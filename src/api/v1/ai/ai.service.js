const aiFactory = require('../../../integrations/ai/ai.factory');
const { aiConfig } = require('../../../config/ai.config');
const Transcript = require('../../../models/Transcript.model');
const Insight = require('../../../models/Insight.model');
const ActionItem = require('../../../models/ActionItem.model');
const Meeting = require('../../../models/Meeting.model');
const ApiError = require('../../../utils/ApiError');
const logger = require('../../../utils/logger');
const notificationHelper = require('../../../utils/notificationHelper');

// ─── Safe JSON parse ────────────────────────────────────────────────────────

const safeParseJson = (content, context) => {
  try {
    return JSON.parse(content);
  } catch (err) {
    logger.warn(`[AI] Malformed JSON from ${context}`, {
      snippet: (content || '').substring(0, 300),
      error: err.message,
    });
    throw ApiError.unprocessable(`AI returned malformed JSON for ${context}`);
  }
};

// ─── Citation enforcement ───────────────────────────────────────────────────

const filterUncited = (items, context) => {
  return items.filter((item) => {
    const citations = item.citations;
    const quote = item.sourceQuote;
    const hasCitation =
      (Array.isArray(citations) && citations.length > 0) || (typeof quote === 'string' && quote.trim().length > 0);
    if (!hasCitation) {
      logger.warn(`[AI] Discarding uncited ${context}`, { title: item.title });
    }
    return hasCitation;
  });
};

// ─── Transcript helper ──────────────────────────────────────────────────────

const getTranscript = async (meetingId, userId) => {
  const transcript = await Transcript.findOne({ meeting: meetingId, owner: userId });
  if (!transcript) throw ApiError.notFound('Transcript not found for this meeting');
  return transcript;
};

// ─── Summarise ──────────────────────────────────────────────────────────────

const getMeeting = (meetingId) => Meeting.findById(meetingId).lean();

const summarize = async (meetingId, userId, options = {}) => {
  const transcript = await getTranscript(meetingId, userId);

  const content = await aiFactory.complete(
    aiConfig.prompts.summarize,
    `Meeting Transcript:\n\n${transcript.rawText}`,
    { json: true, ...options }
  );

  const parsed = safeParseJson(content, 'summarize');

  if (!parsed.summary) {
    logger.warn('[AI] summarize returned null summary – skipping save', { meetingId });
    throw ApiError.unprocessable('AI could not generate a grounded summary from this transcript');
  }

  const citationsArray = Array.isArray(parsed.citations) ? parsed.citations : [];
  if (citationsArray.length === 0) {
    logger.warn('[AI] Summary has no citations – discarding', { meetingId });
    throw ApiError.unprocessable('AI summary lacked required transcript citations');
  }

  const insight = await Insight.create({
    meeting: meetingId,
    owner: userId,
    type: 'summary',
    title: 'Meeting Summary',
    content: parsed.summary,
    citations: citationsArray,
    aiProvider: options.provider || aiConfig.provider,
    aiModel: options.model,
  });

  await Meeting.findByIdAndUpdate(meetingId, { hasInsights: true });

  if (!options._silent) {
    const meeting = await getMeeting(meetingId);
    notificationHelper.createAndDeliver({
      userId,
      type: 'insight_ready',
      title: 'Meeting Summary Ready',
      body: `AI summary for "${meeting?.title ?? 'your meeting'}" is ready to view.`,
      relatedMeeting: meetingId,
      meeting,
    }).catch(() => {});
  }

  return insight;
};

// ─── Extract action items ───────────────────────────────────────────────────

const extractActionItems = async (meetingId, userId, options = {}) => {
  const transcript = await getTranscript(meetingId, userId);
  const meeting = await Meeting.findById(meetingId).select('scheduledAt completedAt').lean();
  const referenceDate = meeting?.completedAt || meeting?.scheduledAt || new Date();

  const content = await aiFactory.complete(
    aiConfig.prompts.extractActions,
    `Meeting date: ${referenceDate.toISOString().slice(0, 10)}\n\n${transcript.rawText}`,
    { json: true, ...options }
  );

  const parsed = safeParseJson(content, 'extractActionItems');
  const rawItems = Array.isArray(parsed.actionItems) ? parsed.actionItems : [];

  const cited = filterUncited(rawItems, 'action item');

  if (cited.length === 0 && rawItems.length > 0) {
    logger.warn('[AI] All action items lacked citations – discarding', { meetingId, total: rawItems.length });
  }

  if (cited.length === 0) return [];

  const created = await ActionItem.insertMany(
    cited.map((item) => ({
      meeting: meetingId,
      owner: userId,
      title: item.title,
      assignee: item.assignee || undefined,
      dueDate: item.dueDate ? new Date(item.dueDate) : undefined,
      priority: item.priority || 'medium',
      sourceQuote: item.sourceQuote,
    }))
  );

  logger.info('[AI] Action items extracted', { meetingId, count: created.length });
  return created;
};

// ─── Generate insights ──────────────────────────────────────────────────────

const generateInsights = async (meetingId, userId, options = {}) => {
  const transcript = await getTranscript(meetingId, userId);

  const content = await aiFactory.complete(
    aiConfig.prompts.generateInsights,
    transcript.rawText,
    { json: true, ...options }
  );

  const parsed = safeParseJson(content, 'generateInsights');
  const rawInsights = Array.isArray(parsed.insights) ? parsed.insights : [];

  const cited = filterUncited(rawInsights, 'insight');

  if (cited.length === 0) {
    logger.warn('[AI] No cited insights produced', { meetingId });
    return [];
  }

  const created = await Insight.insertMany(
    cited.map((i) => ({
      meeting: meetingId,
      owner: userId,
      type: i.type,
      title: i.title,
      content: i.content,
      citations: Array.isArray(i.citations) ? i.citations : [],
      aiProvider: options.provider || aiConfig.provider,
      aiModel: options.model,
    }))
  );

  await Meeting.findByIdAndUpdate(meetingId, { hasInsights: true });

  if (!options._silent) {
    const meeting = await getMeeting(meetingId);
    notificationHelper.createAndDeliver({
      userId,
      type: 'insight_ready',
      title: 'Insights Ready',
      body: `${created.length} new insight${created.length !== 1 ? 's' : ''} generated for "${meeting?.title ?? 'your meeting'}".`,
      relatedMeeting: meetingId,
      meeting,
    }).catch(() => {});
  }

  return created;
};

// ─── Analyse all (partial-failure safe) ────────────────────────────────────

const analyzeAll = async (meetingId, userId, options = {}) => {
  const silent = { ...options, _silent: true };

  const results = await Promise.allSettled([
    summarize(meetingId, userId, silent),
    extractActionItems(meetingId, userId, options),
    generateInsights(meetingId, userId, silent),
  ]);

  const taskNames = ['summary', 'actionItems', 'insights'];
  const errors = results
    .map((r, i) =>
      r.status === 'rejected'
        ? { task: taskNames[i], error: r.reason?.message || 'Unknown error' }
        : null
    )
    .filter(Boolean);

  if (errors.length > 0) {
    logger.warn('[AI] analyzeAll partial failure', { meetingId, errors });
  }

  const summary = results[0].status === 'fulfilled' ? results[0].value : null;
  const actionItems = results[1].status === 'fulfilled' ? results[1].value : [];
  const insights = results[2].status === 'fulfilled' ? results[2].value : [];

  // Fire one combined notification if anything was produced
  if (summary || insights.length > 0) {
    const meeting = await getMeeting(meetingId);
    const parts = [];
    if (summary) parts.push('summary');
    if (insights.length > 0) parts.push(`${insights.length} insight${insights.length !== 1 ? 's' : ''}`);
    notificationHelper.createAndDeliver({
      userId,
      type: 'insight_ready',
      title: 'Analysis Complete',
      body: `AI analysis for "${meeting?.title ?? 'your meeting'}" is ready: ${parts.join(' and ')}.`,
      relatedMeeting: meetingId,
      meeting,
    }).catch(() => {});
  }

  return {
    summary,
    actionItems,
    insights,
    ...(errors.length > 0 && { errors }),
  };
};

module.exports = { summarize, extractActionItems, generateInsights, analyzeAll };

const asyncHandler = require('../../../utils/asyncHandler');
const ApiResponse = require('../../../utils/ApiResponse');
const aiService = require('./ai.service');
const Insight = require('../../../models/Insight.model');

const summarize = asyncHandler(async (req, res) => {
  const result = await aiService.summarize(req.params.meetingId, req.user._id, req.body);
  ApiResponse.created(res, 'Summary generated', result);
});

const extractActionItems = asyncHandler(async (req, res) => {
  const result = await aiService.extractActionItems(req.params.meetingId, req.user._id, req.body);
  ApiResponse.created(res, 'Action items extracted', result);
});

const generateInsights = asyncHandler(async (req, res) => {
  const result = await aiService.generateInsights(req.params.meetingId, req.user._id, req.body);
  ApiResponse.created(res, 'Insights generated', result);
});

const analyzeAll = asyncHandler(async (req, res) => {
  const result = await aiService.analyzeAll(req.params.meetingId, req.user._id, req.body);
  ApiResponse.created(res, 'Full analysis complete', result);
});

/**
 * @swagger
 * /ai/meetings/{meetingId}/insights:
 *   get:
 *     summary: Get all stored insights (non-summary) for a meeting
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: meetingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Insights retrieved
 */
const getInsights = asyncHandler(async (req, res) => {
  const insights = await Insight.find({
    meeting: req.params.meetingId,
    owner: req.user._id,
    type: { $ne: 'summary' },
  }).lean();
  ApiResponse.ok(res, 'Insights retrieved', insights);
});

/**
 * @swagger
 * /ai/meetings/{meetingId}/summary:
 *   get:
 *     summary: Get the stored summary insight for a meeting
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: meetingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Summary retrieved (null if not yet generated)
 */
const getSummary = asyncHandler(async (req, res) => {
  const summary = await Insight.findOne({
    meeting: req.params.meetingId,
    owner: req.user._id,
    type: 'summary',
  }).lean();
  ApiResponse.ok(res, 'Summary retrieved', summary);
});

module.exports = { summarize, extractActionItems, generateInsights, analyzeAll, getInsights, getSummary };

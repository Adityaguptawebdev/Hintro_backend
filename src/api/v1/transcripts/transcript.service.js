const ApiError = require('../../../utils/ApiError');
const repo = require('./transcript.repository');
const Meeting = require('../../../models/Meeting.model');
const notificationHelper = require('../../../utils/notificationHelper');

const normaliseSegments = (segments = []) =>
  segments.map((s) => ({
    speaker: s.speaker,
    text: s.text,
    startTime: s.startTime ?? s.timestamp,
    endTime: s.endTime,
    confidence: s.confidence,
  }));

const getByMeeting = async (meetingId, userId) => {
  const transcript = await repo.findByMeeting(meetingId, userId);
  if (!transcript) throw ApiError.notFound('Transcript not found for this meeting');
  return transcript;
};

const upsert = async (meetingId, userId, data) => {
  const meeting = await Meeting.findOne({ _id: meetingId, owner: userId }).lean();
  if (!meeting) throw ApiError.notFound('Meeting not found');

  const transcript = await repo.upsert(meetingId, userId, {
    rawText: data.rawText,
    segments: normaliseSegments(data.segments),
    language: data.language || 'en',
    processingStatus: 'completed',
    processedAt: new Date(),
  });

  await Meeting.findByIdAndUpdate(meetingId, { hasTranscript: true });

  // Fire-and-forget — don't let notification failure break the transcript save
  notificationHelper.createAndDeliver({
    userId,
    type: 'transcript_processed',
    title: 'Transcript Ready',
    body: `Your transcript for "${meeting.title}" has been processed and is ready to view.`,
    relatedMeeting: meetingId,
    meeting,
  }).catch(() => {});

  return transcript;
};

const remove = async (meetingId, userId) => {
  const transcript = await repo.deleteByMeeting(meetingId, userId);
  if (!transcript) throw ApiError.notFound('Transcript not found');
  await Meeting.findByIdAndUpdate(meetingId, { hasTranscript: false });
};

module.exports = { getByMeeting, upsert, remove };

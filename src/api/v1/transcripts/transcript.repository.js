const Transcript = require('../../../models/Transcript.model');

const findByMeeting = (meetingId, ownerId) =>
  Transcript.findOne({ meeting: meetingId, owner: ownerId }).lean();

const upsert = async (meetingId, ownerId, data) => {
  const existing = await Transcript.findOne({ meeting: meetingId, owner: ownerId });
  if (existing) {
    Object.assign(existing, data);
    return existing.save();
  }
  return Transcript.create({ ...data, meeting: meetingId, owner: ownerId });
};

const deleteByMeeting = (meetingId, ownerId) =>
  Transcript.findOneAndDelete({ meeting: meetingId, owner: ownerId });

module.exports = { findByMeeting, upsert, deleteByMeeting };

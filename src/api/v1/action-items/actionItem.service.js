const ApiError = require('../../../utils/ApiError');
const repo = require('./actionItem.repository');
const Meeting = require('../../../models/Meeting.model');

const list = (userId, query) => repo.findPaginated(userId, query);

const create = async (userId, data) => {
  const meeting = await Meeting.findOne({ _id: data.meetingId, owner: userId }).lean();
  if (!meeting) throw ApiError.notFound('Meeting not found');

  return repo.create({
    meeting: data.meetingId,
    owner: userId,
    title: data.title,
    description: data.description,
    assignee: data.assignee,
    priority: data.priority,
    dueDate: data.dueDate,
    tags: data.tags,
    sourceQuote: data.sourceQuote,
  });
};

const updateStatus = async (id, userId, status) => {
  const item = await repo.updateStatus(id, userId, status);
  if (!item) throw ApiError.notFound('Action item not found');
  return item;
};

const getOverdue = (userId) => repo.findOverdue(userId);

module.exports = { list, create, updateStatus, getOverdue };

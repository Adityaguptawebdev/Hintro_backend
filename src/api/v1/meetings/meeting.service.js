const ApiError = require('../../../utils/ApiError');
const repo = require('./meeting.repository');
const Transcript = require('../../../models/Transcript.model');
const Insight = require('../../../models/Insight.model');
const ActionItem = require('../../../models/ActionItem.model');

const list = (userId, query) => repo.findPaginated(userId, query);

const getById = async (id, userId) => {
  const meeting = await repo.findById(id, userId);
  if (!meeting) throw ApiError.notFound('Meeting not found');
  return meeting;
};

const create = (userId, data) => repo.create({ ...data, owner: userId });

const update = async (id, userId, data) => {
  const meeting = await repo.updateById(id, userId, data);
  if (!meeting) throw ApiError.notFound('Meeting not found');
  return meeting;
};

const remove = async (id, userId) => {
  const meeting = await repo.deleteById(id, userId);
  if (!meeting) throw ApiError.notFound('Meeting not found');
  await Promise.all([
    Transcript.deleteMany({ meeting: id }),
    Insight.deleteMany({ meeting: id }),
    ActionItem.deleteMany({ meeting: id }),
  ]);
};

module.exports = { list, getById, create, update, remove };

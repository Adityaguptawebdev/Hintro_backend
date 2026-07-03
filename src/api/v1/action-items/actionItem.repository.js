const ActionItem = require('../../../models/ActionItem.model');
const { buildPaginationMeta, parsePaginationQuery } = require('../../../utils/pagination');

const buildFilter = (userId, query) => {
  const filter = { owner: userId };
  if (query.status) filter.status = query.status;
  if (query.meetingId) filter.meeting = query.meetingId;
  if (query.assignee) filter['assignee.email'] = query.assignee;
  if (query.priority) filter.priority = query.priority;
  return filter;
};

const findPaginated = async (userId, query) => {
  const { page, limit, skip } = parsePaginationQuery(query);
  const filter = buildFilter(userId, query);
  const sort = query.sort || '-createdAt';

  const [items, total] = await Promise.all([
    ActionItem.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    ActionItem.countDocuments(filter),
  ]);

  return { items, pagination: buildPaginationMeta(total, page, limit) };
};

const findById = (id, userId) =>
  ActionItem.findOne({ _id: id, owner: userId }).lean();

const create = (data) => ActionItem.create(data);

const updateStatus = (id, userId, status) => {
  const update = { status };
  if (status === 'completed') update.completedAt = new Date();
  return ActionItem.findOneAndUpdate({ _id: id, owner: userId }, update, { new: true });
};

const findOverdue = (userId) =>
  ActionItem.find({
    owner: userId,
    isOverdue: true,
    status: { $in: ['pending', 'in_progress'] },
  })
    .sort('-overdueDetectedAt')
    .lean();

module.exports = { findPaginated, findById, create, updateStatus, findOverdue };

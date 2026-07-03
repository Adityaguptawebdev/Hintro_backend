const Meeting = require('../../../models/Meeting.model');
const { buildPaginationMeta, parsePaginationQuery } = require('../../../utils/pagination');

const buildFilter = (userId, query) => {
  const filter = { owner: userId };
  if (query.status) filter.status = query.status;
  if (query.from || query.to) {
    filter.scheduledAt = {};
    if (query.from) filter.scheduledAt.$gte = new Date(query.from);
    if (query.to) filter.scheduledAt.$lte = new Date(query.to);
  }
  if (query.search) filter.$text = { $search: query.search };
  if (query.tags) {
    const tags = Array.isArray(query.tags) ? query.tags : [query.tags];
    filter.tags = { $in: tags };
  }
  return filter;
};

const findPaginated = async (userId, query) => {
  const { page, limit, skip } = parsePaginationQuery(query);
  const filter = buildFilter(userId, query);
  const sort = query.sort || '-scheduledAt';

  const [items, total] = await Promise.all([
    Meeting.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Meeting.countDocuments(filter),
  ]);

  return { items, pagination: buildPaginationMeta(total, page, limit) };
};

const findById = (id, userId) =>
  Meeting.findOne({ _id: id, owner: userId }).populate('transcript').lean();

const create = (data) => Meeting.create(data);

const updateById = (id, userId, data) =>
  Meeting.findOneAndUpdate({ _id: id, owner: userId }, data, { new: true, runValidators: true });

const deleteById = (id, userId) =>
  Meeting.findOneAndDelete({ _id: id, owner: userId });

const findUpcoming = (userId, withinHours = 24) => {
  const from = new Date();
  const to = new Date(Date.now() + withinHours * 60 * 60 * 1000);
  return Meeting.find({
    owner: userId,
    status: 'scheduled',
    scheduledAt: { $gte: from, $lte: to },
    reminderSentAt: null,
  }).populate('owner', 'name email integrations preferences').lean();
};

module.exports = { findPaginated, findById, create, updateById, deleteById, findUpcoming };

const Notification = require('../../../models/Notification.model');
const { buildPaginationMeta, parsePaginationQuery } = require('../../../utils/pagination');

const findPaginated = async (userId, query) => {
  const { page, limit, skip } = parsePaginationQuery(query);
  const filter = { recipient: userId };
  if (query.unreadOnly === 'true') filter.isRead = false;

  const [items, total] = await Promise.all([
    Notification.find(filter).sort('-createdAt').skip(skip).limit(limit).lean(),
    Notification.countDocuments(filter),
  ]);

  return { items, pagination: buildPaginationMeta(total, page, limit) };
};

const markRead = (id, userId) =>
  Notification.findOneAndUpdate(
    { _id: id, recipient: userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );

const markAllRead = (userId) =>
  Notification.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );

module.exports = { findPaginated, markRead, markAllRead };

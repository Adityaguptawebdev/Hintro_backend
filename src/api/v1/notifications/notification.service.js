const ApiError = require('../../../utils/ApiError');
const repo = require('./notification.repository');

const list = (userId, query) => repo.findPaginated(userId, query);

const markRead = async (id, userId) => {
  const notification = await repo.markRead(id, userId);
  if (!notification) throw ApiError.notFound('Notification not found');
  return notification;
};

const markAllRead = (userId) => repo.markAllRead(userId);

module.exports = { list, markRead, markAllRead };

const asyncHandler = require('../../../utils/asyncHandler');
const ApiResponse = require('../../../utils/ApiResponse');
const notificationService = require('./notification.service');

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: In-app notification management
 */

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: List notifications for the authenticated user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 */
const list = asyncHandler(async (req, res) => {
  const { items, pagination } = await notificationService.list(req.user._id, req.query);
  ApiResponse.paginated(res, 'Notifications retrieved', items, pagination);
});

/**
 * @swagger
 * /notifications/{id}/read:
 *   patch:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       404:
 *         description: Notification not found
 */
const markRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markRead(req.params.id, req.user._id);
  ApiResponse.ok(res, 'Notification marked as read', notification);
});

const markAllRead = asyncHandler(async (req, res) => {
  await notificationService.markAllRead(req.user._id);
  ApiResponse.ok(res, 'All notifications marked as read');
});

module.exports = { list, markRead, markAllRead };

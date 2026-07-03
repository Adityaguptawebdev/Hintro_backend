const asyncHandler = require('../../../utils/asyncHandler');
const ApiResponse = require('../../../utils/ApiResponse');
const actionItemService = require('./actionItem.service');

/**
 * @swagger
 * tags:
 *   name: ActionItems
 *   description: Action item tracking
 */

/**
 * @swagger
 * /action-items/overdue:
 *   get:
 *     summary: List all overdue action items for the authenticated user
 *     tags: [ActionItems]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overdue items retrieved
 */
const getOverdue = asyncHandler(async (req, res) => {
  const items = await actionItemService.getOverdue(req.user._id);
  ApiResponse.ok(res, 'Overdue action items retrieved', items);
});

/**
 * @swagger
 * /action-items:
 *   get:
 *     summary: List action items with filters
 *     tags: [ActionItems]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, completed, cancelled]
 *       - in: query
 *         name: meetingId
 *         schema:
 *           type: string
 *       - in: query
 *         name: assignee
 *         schema:
 *           type: string
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
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
 *         description: Action items retrieved
 */
const list = asyncHandler(async (req, res) => {
  const { items, pagination } = await actionItemService.list(req.user._id, req.query);
  ApiResponse.paginated(res, 'Action items retrieved', items, pagination);
});

/**
 * @swagger
 * /action-items:
 *   post:
 *     summary: Create a new action item
 *     tags: [ActionItems]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - meetingId
 *               - title
 *             properties:
 *               meetingId:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               assignee:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Action item created
 */
const create = asyncHandler(async (req, res) => {
  const item = await actionItemService.create(req.user._id, req.body);
  ApiResponse.created(res, 'Action item created', item);
});

/**
 * @swagger
 * /action-items/{id}/status:
 *   patch:
 *     summary: Update action item status
 *     tags: [ActionItems]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, in_progress, completed, cancelled]
 *     responses:
 *       200:
 *         description: Status updated
 *       404:
 *         description: Action item not found
 */
const updateStatus = asyncHandler(async (req, res) => {
  const item = await actionItemService.updateStatus(req.params.id, req.user._id, req.body.status);
  ApiResponse.ok(res, 'Action item status updated', item);
});

module.exports = { list, create, updateStatus, getOverdue };

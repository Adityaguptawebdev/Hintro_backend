const asyncHandler = require('../../../utils/asyncHandler');
const ApiResponse = require('../../../utils/ApiResponse');
const mongoose = require('mongoose');
const Meeting = require('../../../models/Meeting.model');
const Transcript = require('../../../models/Transcript.model');
const ActionItem = require('../../../models/ActionItem.model');
const Insight = require('../../../models/Insight.model');
const Notification = require('../../../models/Notification.model');
const { aiConfig } = require('../../../config/ai.config');

/**
 * @swagger
 * tags:
 *   name: Evaluation
 *   description: Platform health and metrics evaluation
 */

/**
 * @swagger
 * /evaluation:
 *   get:
 *     summary: Platform evaluation metrics and health
 *     tags: [Evaluation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Evaluation data returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: UP
 *                 aiProvider:
 *                   type: string
 *                 database:
 *                   type: string
 *                 metrics:
 *                   type: object
 */
const evaluate = asyncHandler(async (req, res) => {
  const dbState = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  const [
    totalMeetings,
    totalTranscripts,
    actionItemAgg,
    totalInsights,
    notificationAgg,
  ] = await Promise.all([
    Meeting.countDocuments(),
    Transcript.countDocuments(),
    ActionItem.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),
    Insight.countDocuments(),
    Notification.aggregate([
      {
        $group: {
          _id: '$isRead',
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const actionCounts = { total: 0, pending: 0, in_progress: 0, completed: 0, cancelled: 0, overdue: 0 };
  for (const row of actionItemAgg) {
    actionCounts[row._id] = row.count;
    actionCounts.total += row.count;
  }
  const overdueCount = await ActionItem.countDocuments({ isOverdue: true });
  actionCounts.overdue = overdueCount;

  const notifCounts = { total: 0, unread: 0 };
  for (const row of notificationAgg) {
    notifCounts.total += row.count;
    if (!row._id) notifCounts.unread = row.count;
  }

  ApiResponse.ok(res, 'Evaluation data retrieved', {
    status: 'UP',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    aiProvider: aiConfig.provider,
    database: dbState,
    metrics: {
      meetings: totalMeetings,
      transcripts: totalTranscripts,
      actionItems: actionCounts,
      insights: totalInsights,
      notifications: notifCounts,
    },
  });
});

module.exports = { evaluate };

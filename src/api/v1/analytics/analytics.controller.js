const asyncHandler = require('../../../utils/asyncHandler');
const ApiResponse = require('../../../utils/ApiResponse');
const Meeting = require('../../../models/Meeting.model');
const ActionItem = require('../../../models/ActionItem.model');
const Insight = require('../../../models/Insight.model');

/**
 * @swagger
 * /analytics/dashboard:
 *   get:
 *     summary: Per-user dashboard metrics (meeting counts, action completion rate, overdue count)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard metrics for the authenticated user
 */
const dashboard = asyncHandler(async (req, res) => {
  const owner = req.user._id;

  const [totalMeetings, actionItemAgg, totalInsights, overdueCount] = await Promise.all([
    Meeting.countDocuments({ owner }),
    ActionItem.aggregate([
      { $match: { owner } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Insight.countDocuments({ owner }),
    ActionItem.countDocuments({ owner, isOverdue: true }),
  ]);

  const actionCounts = { total: 0, pending: 0, in_progress: 0, completed: 0, cancelled: 0, overdue: overdueCount };
  for (const row of actionItemAgg) {
    actionCounts[row._id] = row.count;
    actionCounts.total += row.count;
  }

  ApiResponse.ok(res, 'Dashboard metrics retrieved', {
    meetings: totalMeetings,
    actionItems: actionCounts,
    insights: totalInsights,
  });
});

module.exports = { dashboard };

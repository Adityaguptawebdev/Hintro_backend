const asyncHandler = require('../../../utils/asyncHandler');
const ApiResponse = require('../../../utils/ApiResponse');
const ApiError = require('../../../utils/ApiError');
const meetingService = require('./meeting.service');
const aiService = require('../ai/ai.service');
const Meeting = require('../../../models/Meeting.model');
const { generateKitToken } = require('../../../integrations/zegocloud/zego.token');

const list = asyncHandler(async (req, res) => {
  const { items, pagination } = await meetingService.list(req.user._id, req.query);
  ApiResponse.paginated(res, 'Meetings retrieved', items, pagination);
});

const getById = asyncHandler(async (req, res) => {
  const meeting = await meetingService.getById(req.params.id, req.user._id);
  ApiResponse.ok(res, 'Meeting retrieved', meeting);
});

const create = asyncHandler(async (req, res) => {
  const meeting = await meetingService.create(req.user._id, req.body);
  ApiResponse.created(res, 'Meeting created', meeting);
});

const update = asyncHandler(async (req, res) => {
  const meeting = await meetingService.update(req.params.id, req.user._id, req.body);
  ApiResponse.ok(res, 'Meeting updated', meeting);
});

const remove = asyncHandler(async (req, res) => {
  await meetingService.remove(req.params.id, req.user._id);
  ApiResponse.noContent(res);
});

/**
 * @swagger
 * /meetings/{id}/analyze:
 *   post:
 *     summary: Run full AI analysis (summary + action items + insights) for a meeting
 *     tags: [Meetings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Analysis complete (partial failures reported in errors field)
 *       404:
 *         description: Meeting or transcript not found
 */
const analyze = asyncHandler(async (req, res) => {
  const result = await aiService.analyzeAll(req.params.id, req.user._id, req.body);
  ApiResponse.created(res, 'Full analysis complete', result);
});

const generateToken = asyncHandler(async (req, res) => {
  const appId = parseInt(process.env.ZEGO_APP_ID, 10);
  const serverSecret = process.env.ZEGO_SERVER_SECRET;

  if (!appId || !serverSecret) {
    throw ApiError.internal('ZEGOCLOUD credentials not configured');
  }

  // Look up by ID only — any authenticated user can join via invite link, not just the owner
  const meeting = await Meeting.findById(req.params.id).lean();
  if (!meeting) throw ApiError.notFound('Meeting not found');

  const roomId = meeting._id.toString();
  const userId = req.user._id.toString();
  const token = generateKitToken(appId, serverSecret, roomId, userId);

  ApiResponse.ok(res, 'Token generated', {
    token,
    appId,
    roomId,
    userId,
    userName: req.user.name,
  });
});

// Lightweight endpoint for room participants — no owner check, just needs auth
const getRoomInfo = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findById(req.params.id)
    .select('title participants owner status')
    .lean();
  if (!meeting) throw ApiError.notFound('Meeting not found');
  ApiResponse.ok(res, 'Room info retrieved', meeting);
});

module.exports = { list, getById, create, update, remove, analyze, generateToken, getRoomInfo };

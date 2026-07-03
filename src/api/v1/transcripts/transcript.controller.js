const asyncHandler = require('../../../utils/asyncHandler');
const ApiResponse = require('../../../utils/ApiResponse');
const transcriptService = require('./transcript.service');

/**
 * @swagger
 * tags:
 *   name: Transcripts
 *   description: Meeting transcript management
 */

/**
 * @swagger
 * /transcripts/{meetingId}:
 *   get:
 *     summary: Get transcript for a meeting
 *     tags: [Transcripts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: meetingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transcript retrieved successfully
 *       404:
 *         description: Transcript not found
 */
const getByMeeting = asyncHandler(async (req, res) => {
  const transcript = await transcriptService.getByMeeting(req.params.meetingId, req.user._id);
  ApiResponse.ok(res, 'Transcript retrieved', transcript);
});

/**
 * @swagger
 * /transcripts/{meetingId}:
 *   post:
 *     summary: Create or replace transcript for a meeting
 *     tags: [Transcripts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: meetingId
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
 *               - rawText
 *             properties:
 *               rawText:
 *                 type: string
 *               segments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - speaker
 *                     - text
 *                   properties:
 *                     speaker:
 *                       type: string
 *                     text:
 *                       type: string
 *                     timestamp:
 *                       type: number
 *                     startTime:
 *                       type: number
 *                     endTime:
 *                       type: number
 *               language:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transcript saved successfully
 *       404:
 *         description: Meeting not found
 */
const upsert = asyncHandler(async (req, res) => {
  const transcript = await transcriptService.upsert(req.params.meetingId, req.user._id, req.body);
  ApiResponse.created(res, 'Transcript saved', transcript);
});

const remove = asyncHandler(async (req, res) => {
  await transcriptService.remove(req.params.meetingId, req.user._id);
  ApiResponse.noContent(res);
});

module.exports = { getByMeeting, upsert, remove };

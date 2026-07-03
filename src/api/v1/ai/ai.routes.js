const { Router } = require('express');
const controller = require('./ai.controller');
const { authenticate } = require('../../../middleware/auth.middleware');
const { aiRateLimiter } = require('../../../middleware/rateLimiter.middleware');

const router = Router({ mergeParams: true });

router.use(authenticate, aiRateLimiter);

router.get('/meetings/:meetingId/insights', controller.getInsights);
router.get('/meetings/:meetingId/summary', controller.getSummary);
router.post('/meetings/:meetingId/summarize', controller.summarize);
router.post('/meetings/:meetingId/extract-actions', controller.extractActionItems);
router.post('/meetings/:meetingId/insights', controller.generateInsights);
router.post('/meetings/:meetingId/analyze', controller.analyzeAll);

module.exports = router;

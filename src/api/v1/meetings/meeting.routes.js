const { Router } = require('express');
const controller = require('./meeting.controller');
const { authenticate } = require('../../../middleware/auth.middleware');
const { aiRateLimiter, videoTokenLimiter } = require('../../../middleware/rateLimiter.middleware');
const { validate } = require('../../../middleware/validate.middleware');
const validators = require('./meeting.validator');

const router = Router();

router.use(authenticate);

router.route('/')
  .get(validate(validators.listQuery, 'query'), controller.list)
  .post(validate(validators.create), controller.create);

// AI analysis shortcut – POST /meetings/:id/analyze
router.post('/:id/analyze', aiRateLimiter, controller.analyze);

// ZEGOCLOUD video room token
router.post('/:id/token', videoTokenLimiter, controller.generateToken);

// Lightweight room info for any authenticated participant (no owner check)
router.get('/:id/room-info', controller.getRoomInfo);

router.route('/:id')
  .get(controller.getById)
  .patch(validate(validators.update), controller.update)
  .delete(controller.remove);

module.exports = router;

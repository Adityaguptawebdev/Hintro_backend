const { Router } = require('express');
const controller = require('./transcript.controller');
const { authenticate } = require('../../../middleware/auth.middleware');
const { validate } = require('../../../middleware/validate.middleware');
const validators = require('./transcript.validator');

const router = Router();

router.use(authenticate);

router.route('/:meetingId')
  .get(controller.getByMeeting)
  .post(validate(validators.create), controller.upsert)
  .delete(controller.remove);

module.exports = router;

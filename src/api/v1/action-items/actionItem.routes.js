const { Router } = require('express');
const controller = require('./actionItem.controller');
const { authenticate } = require('../../../middleware/auth.middleware');
const { validate } = require('../../../middleware/validate.middleware');
const validators = require('./actionItem.validator');

const router = Router();

router.use(authenticate);

// /overdue MUST be registered before /:id to prevent route shadowing
router.get('/overdue', controller.getOverdue);

router.route('/')
  .get(validate(validators.listQuery, 'query'), controller.list)
  .post(validate(validators.create), controller.create);

router.patch('/:id/status', validate(validators.updateStatus), controller.updateStatus);

module.exports = router;

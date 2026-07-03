const { Router } = require('express');
const controller = require('./notification.controller');
const { authenticate } = require('../../../middleware/auth.middleware');

const router = Router();

router.use(authenticate);

router.get('/', controller.list);
router.patch('/read-all', controller.markAllRead);
router.patch('/:id/read', controller.markRead);

module.exports = router;

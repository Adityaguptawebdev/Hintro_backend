const { Router } = require('express');
const controller = require('./evaluation.controller');
const { authenticate } = require('../../../middleware/auth.middleware');

const router = Router();

router.use(authenticate);

router.get('/', controller.evaluate);

module.exports = router;

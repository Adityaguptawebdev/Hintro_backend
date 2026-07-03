const { Router } = require('express');
const { authenticate } = require('../../../middleware/auth.middleware');
const controller = require('./analytics.controller');

const router = Router();
router.use(authenticate);

// GET /analytics/dashboard   – meeting counts, action completion rate, overdue count
router.get('/dashboard', controller.dashboard);

// GET /analytics/meetings    – meeting frequency over time
// GET /analytics/actions     – action items by status breakdown
// GET /analytics/insights    – most common insight types

module.exports = router;

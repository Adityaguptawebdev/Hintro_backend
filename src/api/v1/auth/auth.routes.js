const { Router } = require('express');
const controller = require('./auth.controller');
const oauthController = require('./oauth.controller');
const { validate } = require('../../../middleware/validate.middleware');
const { authenticate } = require('../../../middleware/auth.middleware');
const { authRateLimiter } = require('../../../middleware/rateLimiter.middleware');
const validators = require('./auth.validator');

const router = Router();

router.post('/register', authRateLimiter, validate(validators.register), controller.register);
router.post('/login', authRateLimiter, validate(validators.login), controller.login);
router.post('/refresh', validate(validators.refreshToken), controller.refresh);
router.post('/logout', authenticate, controller.logout);
router.get('/me', authenticate, controller.me);
router.patch('/change-password', authenticate, validate(validators.changePassword), controller.changePassword);
router.patch('/preferences', authenticate, validate(validators.updatePreferences), controller.updatePreferences);

router.get('/google', authRateLimiter, oauthController.googleStart);
router.get('/auth0/callback', oauthController.auth0Callback);

module.exports = router;

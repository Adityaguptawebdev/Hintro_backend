const asyncHandler = require('../../../utils/asyncHandler');
const ApiResponse = require('../../../utils/ApiResponse');
const authService = require('./auth.service');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *     responses:
 *       201:
 *         description: User registered successfully
 */
const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  ApiResponse.created(res, 'Registration successful', result);
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  ApiResponse.ok(res, 'Login successful', result);
});

const refresh = asyncHandler(async (req, res) => {
  const tokens = await authService.refresh(req.body.refreshToken);
  ApiResponse.ok(res, 'Tokens refreshed', tokens);
});

const me = asyncHandler(async (req, res) => {
  ApiResponse.ok(res, 'User profile', req.user);
});

const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user._id, req.body);
  ApiResponse.ok(res, 'Password changed successfully');
});

const logout = asyncHandler(async (_req, res) => {
  ApiResponse.ok(res, 'Logged out successfully');
});

const updatePreferences = asyncHandler(async (req, res) => {
  const user = await authService.updatePreferences(req.user._id, req.body);
  ApiResponse.ok(res, 'Preferences updated', user);
});

module.exports = { register, login, refresh, me, changePassword, logout, updatePreferences };

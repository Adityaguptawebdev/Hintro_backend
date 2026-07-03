const jwt = require('jsonwebtoken');
const { authConfig } = require('../../../config/app.config');
const ApiError = require('../../../utils/ApiError');
const repo = require('./auth.repository');

const signToken = (userId, secret, expiresIn) =>
  jwt.sign({ sub: userId }, secret, { expiresIn });

const generateTokenPair = (userId) => ({
  accessToken: signToken(userId, authConfig.jwtSecret, authConfig.jwtExpiresIn),
  refreshToken: signToken(userId, authConfig.jwtRefreshSecret, authConfig.jwtRefreshExpiresIn),
});

const register = async ({ name, email, password }) => {
  const existing = await repo.findByEmail(email);
  if (existing) throw ApiError.conflict('Email already registered');

  const user = await repo.create({ name, email, password });
  const tokens = generateTokenPair(user._id);
  return { user: user.toPublic(), ...tokens };
};

const login = async ({ email, password }) => {
  const user = await repo.findByEmail(email);
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid credentials');
  }
  if (!user.isActive) throw ApiError.forbidden('Account deactivated');

  await repo.updateById(user._id, { lastLoginAt: new Date() });
  const tokens = generateTokenPair(user._id);
  return { user: user.toPublic(), ...tokens };
};

const refresh = async (token) => {
  let decoded;
  try {
    decoded = jwt.verify(token, authConfig.jwtRefreshSecret);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await repo.findById(decoded.sub);
  if (!user || !user.isActive) throw ApiError.unauthorized('User not found');

  const tokens = generateTokenPair(user._id);
  return tokens;
};

const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await repo.findByEmail(
    (await repo.findById(userId)).email
  );
  if (!(await user.comparePassword(currentPassword))) {
    throw ApiError.badRequest('Current password is incorrect');
  }
  user.password = newPassword;
  await user.save();
};

const updatePreferences = async (userId, body) => {
  const update = {};

  if (body.preferences) {
    for (const [key, val] of Object.entries(body.preferences)) {
      update[`preferences.${key}`] = val;
    }
  }

  if (body.integrations?.telegram) {
    const { chatId } = body.integrations.telegram;
    update['integrations.telegram.chatId'] = chatId;
    update['integrations.telegram.isConnected'] = !!chatId;
  }

  if (body.integrations?.slack) {
    const { userId: slackUserId, channelId } = body.integrations.slack;
    update['integrations.slack.userId'] = slackUserId;
    update['integrations.slack.channelId'] = channelId;
    update['integrations.slack.isConnected'] = !!(slackUserId && channelId);
  }

  const user = await repo.updateById(userId, update);
  return user.toPublic();
};

module.exports = { register, login, refresh, changePassword, updatePreferences, generateTokenPair };

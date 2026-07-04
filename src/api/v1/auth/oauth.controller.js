const asyncHandler = require('../../../utils/asyncHandler');
const logger = require('../../../utils/logger');
const { appConfig, oauthConfig } = require('../../../config/app.config');
const oauthService = require('./oauth.service');
const { generateTokenPair } = require('./auth.service');
const repo = require('./auth.repository');

const buildSuccessRedirect = ({ accessToken, refreshToken }) =>
  `${appConfig.clientUrl}/oauth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`;

const buildErrorRedirect = (message) =>
  `${appConfig.clientUrl}/oauth/callback?error=${encodeURIComponent(message)}`;

const redirectToAuth0 = (res, connection) => {
  if (!oauthConfig.auth0.domain || !oauthConfig.auth0.clientId) {
    return res.redirect(buildErrorRedirect('Social login is not configured yet'));
  }

  const params = new URLSearchParams({
    client_id: oauthConfig.auth0.clientId,
    redirect_uri: oauthConfig.auth0.callbackUrl,
    response_type: 'code',
    scope: 'openid profile email',
    connection,
  });
  res.redirect(`https://${oauthConfig.auth0.domain}/authorize?${params}`);
};

const googleStart = (req, res) => redirectToAuth0(res, 'google-oauth2');

const auth0Callback = asyncHandler(async (req, res) => {
  const { code, error } = req.query;
  if (error || !code) return res.redirect(buildErrorRedirect('Sign-in was cancelled'));

  try {
    const profile = await oauthService.exchangeAuth0Code(code);
    const user = await oauthService.findOrCreateAuth0User(profile);
    await repo.updateById(user._id, { lastLoginAt: new Date() });
    res.redirect(buildSuccessRedirect(generateTokenPair(user._id)));
  } catch (err) {
    logger.error('Auth0 callback failed', { message: err.message, stack: err.stack });
    res.redirect(buildErrorRedirect('Sign-in failed'));
  }
});

module.exports = { googleStart, auth0Callback };

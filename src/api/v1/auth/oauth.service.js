const { oauthConfig } = require('../../../config/app.config');
const ApiError = require('../../../utils/ApiError');
const User = require('../../../models/User.model');
const repo = require('./auth.repository');

const exchangeAuth0Code = async (code) => {
  const { domain, clientId, clientSecret, callbackUrl } = oauthConfig.auth0;

  const tokenRes = await fetch(`https://${domain}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: callbackUrl,
    }),
  });
  if (!tokenRes.ok) throw ApiError.unauthorized('Auth0 authentication failed');
  const { access_token: accessToken } = await tokenRes.json();

  const profileRes = await fetch(`https://${domain}/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!profileRes.ok) throw ApiError.unauthorized('Failed to fetch Auth0 profile');

  // { sub, email, name, picture, email_verified }
  return profileRes.json();
};

const findOrCreateAuth0User = async (profile) => {
  let user = await repo.findByAuth0Id(profile.sub);
  if (user) return user;

  if (profile.email) {
    user = await repo.findByEmail(profile.email);
    if (user) return repo.updateById(user._id, { auth0Id: profile.sub, isEmailVerified: true });
  }

  return User.create({
    name: profile.name || profile.email?.split('@')[0] || 'User',
    email: profile.email || `${profile.sub.replace('|', '-')}@users.noreply.auth0.com`,
    auth0Id: profile.sub,
    avatar: profile.picture,
    isEmailVerified: !!profile.email_verified,
  });
};

module.exports = { exchangeAuth0Code, findOrCreateAuth0User };

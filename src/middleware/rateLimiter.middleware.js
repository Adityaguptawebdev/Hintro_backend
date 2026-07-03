const rateLimit = require('express-rate-limit');
const { StatusCodes } = require('http-status-codes');
const { rateLimitConfig } = require('../config/app.config');

const isTest = process.env.NODE_ENV === 'test';

const createLimiter = (max, windowMs) =>
  rateLimit({
    windowMs: windowMs || rateLimitConfig.windowMs,
    // Effectively disable in test environment to avoid flaky test failures
    max: isTest ? 10000 : max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.id || req.ip,
    handler: (req, res) => {
      res.status(StatusCodes.TOO_MANY_REQUESTS).json({
        success: false,
        message: 'Too many requests, please try again later.',
        traceId: req.traceId,
      });
    },
  });

const globalRateLimiter = createLimiter(rateLimitConfig.max);
const authRateLimiter = createLimiter(100, 15 * 60 * 1000);
const aiRateLimiter = createLimiter(20, 60 * 1000);

// Generous per-authenticated-user limiter for video token generation
// Runs after authenticate middleware so req.user is populated
const videoTokenLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isTest ? 10000 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  skip: () => isTest,
  handler: (_req, res) => {
    res.status(StatusCodes.TOO_MANY_REQUESTS).json({
      success: false,
      message: 'Too many token requests, please wait a moment.',
    });
  },
});

module.exports = { globalRateLimiter, authRateLimiter, aiRateLimiter, videoTokenLimiter };

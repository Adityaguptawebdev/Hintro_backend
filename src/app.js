const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const { StatusCodes } = require('http-status-codes');

const { appConfig } = require('./config/app.config');
const { swaggerSpec, swaggerUi } = require('./config/swagger.config');
const traceIdMiddleware = require('./middleware/traceId.middleware');
const requestLogger = require('./middleware/requestLogger.middleware');
const { globalErrorHandler, notFoundHandler } = require('./middleware/error.middleware');
const { globalRateLimiter } = require('./middleware/rateLimiter.middleware');

const authRoutes = require('./api/v1/auth/auth.routes');
const meetingRoutes = require('./api/v1/meetings/meeting.routes');
const transcriptRoutes = require('./api/v1/transcripts/transcript.routes');
const actionItemRoutes = require('./api/v1/action-items/actionItem.routes');
const aiRoutes = require('./api/v1/ai/ai.routes');
const analyticsRoutes = require('./api/v1/analytics/analytics.routes');
const notificationRoutes = require('./api/v1/notifications/notification.routes');
const evaluationRoutes = require('./api/v1/evaluation/evaluation.routes');

const app = express();

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(mongoSanitize());
app.use(xssClean());
app.use(cors({ origin: appConfig.clientUrl, credentials: true }));

// ─── Core ─────────────────────────────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Observability ────────────────────────────────────────────────────────────
app.use(traceIdMiddleware);
app.use(requestLogger);

// ─── Rate Limiting ────────────────────────────────────────────────────────────
app.use(appConfig.apiPrefix, globalRateLimiter);

// ─── API Docs ─────────────────────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ─── Health Check ─────────────────────────────────────────────────────────────
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Service is up
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: UP
 */
app.get('/health', (req, res) =>
  res.status(StatusCodes.OK).json({ status: 'UP', timestamp: new Date().toISOString(), traceId: req.traceId })
);

// ─── Routes ───────────────────────────────────────────────────────────────────
const API = appConfig.apiPrefix;
app.use(`${API}/auth`, authRoutes);
app.use(`${API}/meetings`, meetingRoutes);
app.use(`${API}/transcripts`, transcriptRoutes);
app.use(`${API}/action-items`, actionItemRoutes);
app.use(`${API}/ai`, aiRoutes);
app.use(`${API}/analytics`, analyticsRoutes);
app.use(`${API}/notifications`, notificationRoutes);
app.use(`${API}/evaluation`, evaluationRoutes);

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(globalErrorHandler);

module.exports = app;

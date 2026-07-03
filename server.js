require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const { connectDatabase } = require('./src/database/connection');
const { initScheduler } = require('./src/jobs/scheduler.init');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 5000;

const bootstrap = async () => {
  await connectDatabase();
  initScheduler();

  const server = http.createServer(app);

  server.listen(PORT, () => {
    logger.info(`Hintro API running on port ${PORT} [${process.env.NODE_ENV}]`);
  });

  const shutdown = (signal) => {
    logger.info(`${signal} received – gracefully shutting down`);
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (err) => {
    logger.error('Unhandled rejection', { error: err.message, stack: err.stack });
    server.close(() => process.exit(1));
  });
};

bootstrap();

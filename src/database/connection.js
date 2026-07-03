const mongoose = require('mongoose');
const { dbConfig } = require('../config/database.config');
const logger = require('../utils/logger');

const connectDatabase = async () => {
  try {
    const conn = await mongoose.connect(dbConfig.uri, dbConfig.options);
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    logger.error('MongoDB connection failed', { error: err.message });
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected – attempting reconnect');
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB error', { error: err.message });
});

module.exports = { connectDatabase };

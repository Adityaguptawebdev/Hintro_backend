const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

const LOG_DIR = process.env.LOG_DIR || 'logs';

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, traceId, ...meta }) => {
    const trace = traceId ? ` [${traceId}]` : '';
    const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp}${trace} ${level}: ${message}${extra}`;
  })
);

const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const transports = [
  new winston.transports.Console({
    format: consoleFormat,
    silent: process.env.NODE_ENV === 'test',
  }),
  new DailyRotateFile({
    dirname: path.join(process.cwd(), LOG_DIR),
    filename: 'hintro-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    format: jsonFormat,
  }),
  new DailyRotateFile({
    dirname: path.join(process.cwd(), LOG_DIR),
    filename: 'hintro-error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxSize: '20m',
    maxFiles: '30d',
    format: jsonFormat,
  }),
];

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports,
  exitOnError: false,
});

module.exports = logger;

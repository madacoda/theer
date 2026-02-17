
import winston from 'winston';
import { config } from './config';

/**
 * Custom Log Format
 */
const logFormat = winston.format.printf(({ level, message, timestamp, ...meta }) => {
  return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
});

/**
 * Logger Instance
 */
export const logger = winston.createLogger({
  level: config.logLevel || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    config.nodeEnv === 'development' ? winston.format.colorize() : winston.format.uncolorize(),
    logFormat
  ),
  transports: [
    new winston.transports.Console(),
  ],
});

/**
 * Stream for Morgan (HTTP Logger)
 */
export const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

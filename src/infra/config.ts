import dotenv from 'dotenv';

dotenv.config();

/**
 * Application Configuration
 */
export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  allowedOrigins: [
    process.env.FRONTEND_URL || 'http://localhost:1000',
    'http://127.0.0.1:1000',
    'http://localhost:1000' // Ensure it's there even if env is empty
  ],
  logLevel: process.env.LOG_LEVEL || 'info',
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // Limit each IP to 100 requests per windowMs
  },
};

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
};

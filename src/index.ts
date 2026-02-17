import createApp from './app';
import { config } from './infra/config';
import { logger } from './infra/logger';
import prisma from './infra/db';

const app = createApp();

/**
 * Start the server
 */
const server = app.listen(config.port, () => {
  logger.info(`[server]: Server is running at http://localhost:${config.port}`);
  logger.info(`[server]: Environment: ${config.nodeEnv}`);
});

/**
 * Graceful Shutdown
 */
const gracefulShutdown = async (signal: string) => {
  logger.info(`[${signal}] Received. Closing HTTP server...`);
  
  server.close(async () => {
    logger.info('HTTP server closed.');

    try {
      await prisma.$disconnect();
      logger.info('Database connection closed.');
      process.exit(0);
    } catch (err) {
      logger.error('Error during database disconnection', err);
      process.exit(1);
    }
  });

  // Force close after 10s
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

import express, { type Application, type Request, type Response } from 'express';
import cors from 'cors';
import apiRoutes from './api/routes/api';
import { config } from './infra/config';

import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import { logger, stream } from './infra/logger';

/**
 * Creates and configures the Express application
 */
const createApp = (): Application => {
  const app = express();
  
  // Security Headers
  app.use(helmet());

  // Compression
  app.use(compression());

  // Logging
  app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined', { stream }));

  // Rate Limiting
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    limit: config.rateLimit.max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      status: 'error',
      message: 'Too many requests, please try again later.',
    },
  });
  app.use(limiter);

  // CORS
  app.use(cors({
    origin: config.allowedOrigins,
    credentials: true,
  }));

  // Body Parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use('/api', apiRoutes);
  
  // Fallback for root
  app.get('/', (req, res) => {
    res.redirect('/api');
  });

  // Global Error Handler
  app.use((err: any, req: Request, res: Response, next: any) => {
    logger.error(`[Global Error]: ${err.message}`, { stack: err.stack, path: req.path, method: req.method });
    res.status(500).json({
      status: 'error',
      message: 'Internal server error: ' + (err.message || 'Unknown error'),
    });
  });

  return app;
};

export default createApp;

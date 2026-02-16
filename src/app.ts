import express, { type Application, type Request, type Response } from 'express';
import cors from 'cors';
import apiRoutes from './api/routes/api';
import { config } from './infra/config';

/**
 * Creates and configures the Express application
 */
const createApp = (): Application => {
  const app = express();
  
  // Middlewares
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  app.use(cors({
    origin: config.allowedOrigins,
    credentials: true,
  }));
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
    console.error('[Global Error]:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error: ' + (err.message || 'Unknown error'),
    });
  });

  return app;
};

export default createApp;

import express, { type Application } from 'express';
import cors from 'cors';
import apiRoutes from './api/routes/api';

/**
 * Creates and configures the Express application
 */
const createApp = (): Application => {
  const app = express();

  // Middlewares
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use('/api', apiRoutes);
  
  // Fallback for root
  app.get('/', (req, res) => {
    res.redirect('/api');
  });

  return app;
};

export default createApp;

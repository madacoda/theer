import createApp from './app';
import { config } from './infra/config';

const app = createApp();

/**
 * Start the server
 */
app.listen(config.port, () => {
  console.log(`[server BUILD v2]: Server is running at http://localhost:${config.port}`);
  console.log(`[server]: Environment: ${config.nodeEnv}`);
});

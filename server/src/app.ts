import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.config.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.middleware.js';
import v1Routes from './routes/v1.routes.js';
import cron from 'node-cron';
import { WhatsAppService } from './modules/whatsapp/whatsapp.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: env.isProd ? undefined : false,
}));

const corsOrigins = env.corsOrigin.split(',').map(o => o.trim());
app.use(cors({ origin: corsOrigins, credentials: true }));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (env.isDev) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1', v1Routes);

// Serve client static files in production
if (env.isProd) {
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist, { maxAge: '1y', immutable: true }));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  // 404 handler (dev only - in prod the SPA catch-all handles it)
  app.use(notFoundHandler);
}

// Global error handler
app.use(errorHandler);

// Start server
app.listen(env.port, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${env.port}`);
  console.log(`Environment: ${env.nodeEnv}`);

  // Daily payment reminder cron job at 9 AM
  cron.schedule('0 9 * * *', async () => {
    try {
      const whatsappService = new WhatsAppService();
      await whatsappService.processPaymentReminders();
      console.log('Payment reminders processed');
    } catch (err) {
      console.error('Payment reminder cron failed:', err);
    }
  });
});

export default app;

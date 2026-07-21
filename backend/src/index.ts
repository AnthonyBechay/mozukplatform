import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { authRouter } from './routes/auth';
import { clientRouter } from './routes/clients';
import { projectRouter } from './routes/projects';
import { documentRouter } from './routes/documents';
import { paymentRouter } from './routes/payments';
import { paymentCategoryRouter } from './routes/paymentCategories';
import { prisma, connectWithRetry } from './lib/prisma';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API routes
app.use('/api/auth', authRouter);
app.use('/api/clients', clientRouter);
app.use('/api/projects', projectRouter);
app.use('/api/documents', documentRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/payment-categories', paymentCategoryRouter);

app.get('/api/health', async (_req, res) => {
  try {
    // Verify the database is actually reachable so the orchestrator only
    // routes traffic once the app can serve real (DB-backed) requests.
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok' });
  } catch {
    res.status(503).json({ status: 'error', database: 'unavailable' });
  }
});

// Serve frontend static files in production
const frontendPath = path.join(__dirname, '../public');
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

async function start() {
  // Warm up the DB connection before accepting traffic so the first request
  // of the day (e.g. login) doesn't race a cold/idle database.
  await connectWithRetry();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

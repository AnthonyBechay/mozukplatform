import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { authRouter } from './routes/auth';
import { clientRouter } from './routes/clients';
import { projectRouter } from './routes/projects';
import { documentRouter } from './routes/documents';

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

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Serve frontend static files in production
const frontendPath = path.join(__dirname, '../public');
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

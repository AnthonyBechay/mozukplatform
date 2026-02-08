import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { projectId } = req.query;
    const where = projectId ? { projectId: projectId as string } : {};
    const documents = await prisma.document.findMany({
      where,
      include: { project: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(documents);
  } catch {
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }
    const { projectId } = req.body;
    const doc = await prisma.document.create({
      data: {
        name: req.body.name || req.file.originalname,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        projectId,
      },
    });
    res.status(201).json(doc);
  } catch {
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

router.get('/:id/download', async (req, res) => {
  try {
    const doc = await prisma.document.findUnique({ where: { id: req.params.id } });
    if (!doc) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }
    const filePath = path.join(uploadDir, doc.filename);
    res.download(filePath, doc.name);
  } catch {
    res.status(500).json({ error: 'Failed to download document' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const doc = await prisma.document.findUnique({ where: { id: req.params.id } });
    if (!doc) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }
    const filePath = path.join(uploadDir, doc.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    await prisma.document.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

export { router as documentRouter };

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

router.use(authenticate);

router.get('/', async (_req, res) => {
  try {
    const clients = await prisma.client.findMany({
      include: { _count: { select: { projects: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(clients);
  } catch {
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: { projects: { orderBy: { createdAt: 'desc' } } },
    });
    if (!client) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }
    res.json(client);
  } catch {
    res.status(500).json({ error: 'Failed to fetch client' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, email, phone, company, notes } = req.body;
    const client = await prisma.client.create({
      data: { name, email, phone, company, notes },
    });
    res.status(201).json(client);
  } catch {
    res.status(500).json({ error: 'Failed to create client' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, email, phone, company, notes } = req.body;
    const client = await prisma.client.update({
      where: { id: req.params.id },
      data: { name, email, phone, company, notes },
    });
    res.json(client);
  } catch {
    res.status(500).json({ error: 'Failed to update client' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.client.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

export { router as clientRouter };

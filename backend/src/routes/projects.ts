import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

router.use(authenticate);

// Convert empty strings to null for optional fields
function cleanProjectData(body: any) {
  return {
    name: body.name,
    description: body.description || null,
    status: body.status,
    clientId: body.clientId,
    projectId: body.projectId || null,
    projectDate: body.projectDate ? new Date(body.projectDate) : null,
    projectLocation: body.projectLocation || null,
    projectTag: body.projectTag || 'MISC',
  };
}

router.get('/', async (req, res) => {
  try {
    const { clientId } = req.query;
    const where = clientId ? { clientId: clientId as string } : {};
    const projects = await prisma.project.findMany({
      where,
      include: {
        client: { select: { id: true, name: true } },
        _count: { select: { documents: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(projects);
  } catch {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        client: { select: { id: true, name: true } },
        documents: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json(project);
  } catch {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = cleanProjectData(req.body);
    const project = await prisma.project.create({
      data,
      include: { client: { select: { id: true, name: true } } },
    });
    res.status(201).json(project);
  } catch {
    res.status(500).json({ error: 'Failed to create project' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const data = cleanProjectData(req.body);
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data,
      include: { client: { select: { id: true, name: true } } },
    });
    res.json(project);
  } catch {
    res.status(500).json({ error: 'Failed to update project' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export { router as projectRouter };

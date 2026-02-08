import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

router.use(authenticate);

// Helper function to clean and validate document data
function cleanDocumentData(body: any) {
  const data: any = {
    projectId: body.projectId,
    documentName: body.documentName,
    documentType: body.documentType || 'OTHERS',
    documentStatus: body.documentStatus || 'NOT_SUBMITTED',
  };

  // Optional fields
  if (body.documentId) data.documentId = body.documentId;
  if (body.documentDate) data.documentDate = new Date(body.documentDate);
  if (body.documentLink) data.documentLink = body.documentLink;

  // Invoice-specific fields (only if documentType is INVOICE)
  if (body.documentType === 'INVOICE') {
    if (body.amount !== undefined && body.amount !== null && body.amount !== '') {
      data.amount = parseFloat(body.amount);
    }
    if (body.paid !== undefined && body.paid !== null && body.paid !== '') {
      data.paid = body.paid === 'true' || body.paid === true;
    }
  }

  return data;
}

// GET all documents
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

// POST create new document
router.post('/', async (req, res) => {
  try {
    const data = cleanDocumentData(req.body);
    const doc = await prisma.document.create({
      data,
      include: { project: { select: { id: true, name: true } } },
    });
    res.status(201).json(doc);
  } catch (error: any) {
    console.error('Document creation error:', error);
    res.status(500).json({ error: 'Failed to create document' });
  }
});

// PUT update document
router.put('/:id', async (req, res) => {
  try {
    const data = cleanDocumentData(req.body);
    const doc = await prisma.document.update({
      where: { id: req.params.id },
      data,
      include: { project: { select: { id: true, name: true } } },
    });
    res.json(doc);
  } catch (error: any) {
    console.error('Document update error:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
});

// DELETE document
router.delete('/:id', async (req, res) => {
  try {
    await prisma.document.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

export { router as documentRouter };

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

router.use(authenticate);

// GET all categories with stats
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.paymentCategory.findMany({
      include: {
        payments: {
          select: {
            amount: true
          }
        }
      },
      orderBy: { name: 'asc' },
    });

    const result = categories.map((cat: any) => {
      const total = cat.payments.reduce((sum: number, p: any) => sum + p.amount, 0);
      return {
        id: cat.id,
        name: cat.name,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
        totalPayments: total,
        paymentsCount: cat.payments.length
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST create category
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Category name is required' });
      return;
    }
    const existing = await prisma.paymentCategory.findUnique({
      where: { name }
    });
    if (existing) {
      res.status(400).json({ error: 'Category already exists' });
      return;
    }
    const category = await prisma.paymentCategory.create({
      data: { name },
    });
    res.status(201).json(category);
  } catch (error) {
    console.error('Failed to create category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// DELETE category
router.delete('/:id', async (req, res) => {
  try {
    await prisma.paymentCategory.delete({
      where: { id: req.params.id },
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export { router as paymentCategoryRouter };

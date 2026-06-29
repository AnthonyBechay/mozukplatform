import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

router.use(authenticate);

// GET all payments
router.get('/', async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      include: { category: true },
      orderBy: { date: 'desc' },
    });
    res.json(payments);
  } catch (error) {
    console.error('Failed to fetch payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// POST create payment
router.post('/', async (req, res, next) => {
  try {
    const { amount, date, description, categoryId } = req.body;
    if (amount === undefined || amount === null || !categoryId) {
      res.status(400).json({ error: 'Amount and Category ID are required' });
      return;
    }
    const payment = await prisma.payment.create({
      data: {
        amount: parseFloat(amount),
        date: date ? new Date(date) : new Date(),
        description: description || null,
        categoryId,
      },
      include: { category: true },
    });
    res.status(201).json(payment);
  } catch (error) {
    console.error('Failed to create payment:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// DELETE payment
router.delete('/:id', async (req, res) => {
  try {
    await prisma.payment.delete({
      where: { id: req.params.id },
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete payment:', error);
    res.status(500).json({ error: 'Failed to delete payment' });
  }
});

export { router as paymentRouter };

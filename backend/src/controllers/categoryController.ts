import { Router, Request, Response } from 'express';
import { Category } from '../models/Category';

const router = Router();

// GET /api/categories
// Fetch categories (optionally filtered by company)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { company } = req.query;
    const filter: any = {};
    if (company) filter.company = company;

    const categories = await Category.find(filter).sort({ createdAt: -1 });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

export default router;

import { Router, Request, Response } from 'express';
import { Product } from '../models/Product';
import { getFirebaseFirestore } from '../config/firebase';

const router = Router();

// GET /api/products
// Fetch products (optionally filtered by company and employeeId)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { company, employeeId } = req.query;
    const filter: any = {};
    if (company) filter.company = company;
    if (employeeId) filter.employeeId = employeeId;

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

export default router;

import { Router, Request, Response } from 'express';
import { Product } from '../models/Product';
import { Restaurant } from '../models/Restaurant';
import { Menu } from '../models/Menu';
import { Category } from '../models/Category';

import { Warehouse } from '../models/Warehouse';

const router = Router();

// GET /api/shop/warehouses
// Get all Amazon warehouses
router.get('/warehouses', async (req: Request, res: Response) => {
  try {
    const warehouses = await Warehouse.find({ company: 'amazon', status: 'active' }).sort({ name: 1 });
    res.json(warehouses);
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    res.status(500).json({ error: 'Failed to fetch warehouses' });
  }
});

// GET /api/shop/products/:warehouse
// Get Amazon products for a specific warehouse
router.get('/products/:warehouse', async (req: Request, res: Response) => {
  try {
    const { warehouse } = req.params;
    const products = await Product.find({ company: 'amazon', status: 'Active', warehouse }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/shop/restaurants
// Get all Zomato restaurants
router.get('/restaurants', async (req: Request, res: Response) => {
  try {
    const restaurants = await Restaurant.find({ isActive: true }).sort({ restaurantId: 1 });
    res.json(restaurants);
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
});

// GET /api/shop/menus/:restaurantId
// Get menus for a specific restaurant
router.get('/menus/:restaurantId', async (req: Request, res: Response) => {
  try {
    const { restaurantId } = req.params;
    const menus = await Menu.find({ restaurantId, isActive: true });
    res.json(menus);
  } catch (error) {
    console.error('Error fetching menus:', error);
    res.status(500).json({ error: 'Failed to fetch menus' });
  }
});

// GET /api/shop/categories/:company
// Get active categories for a company
router.get('/categories/:company', async (req: Request, res: Response) => {
  try {
    const { company } = req.params;
    const categories = await Category.find({ company, status: 'Active' });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

export default router;

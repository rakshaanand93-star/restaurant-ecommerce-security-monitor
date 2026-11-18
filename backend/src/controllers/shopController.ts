import { Router, Request, Response } from 'express';
import { Product } from '../models/Product';
import { Restaurant } from '../models/Restaurant';
import { Menu } from '../models/Menu';
import { Category } from '../models/Category';
import { Warehouse } from '../models/Warehouse';
import { seedShopData } from '../scripts/seedShop';

const router = Router();

// GET /api/shop/warehouses
// Get all Amazon warehouses (auto-seeds if empty)
router.get('/warehouses', async (req: Request, res: Response) => {
  try {
    let warehouses = await Warehouse.find({ company: { $regex: /^amazon$/i } }).sort({ name: 1 });
    if (warehouses.length === 0) {
      console.log('No warehouses found, auto-seeding shop data...');
      await seedShopData();
      warehouses = await Warehouse.find({ company: { $regex: /^amazon$/i } }).sort({ name: 1 });
    }
    res.json(warehouses);
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    res.status(500).json({ error: 'Failed to fetch warehouses' });
  }
});

// GET /api/shop/products
// Get all Amazon products across all warehouses (auto-seeds if empty)
router.get('/products', async (req: Request, res: Response) => {
  try {
    let products = await Product.find({ company: { $regex: /^amazon$/i } }).sort({ createdAt: -1 });
    if (products.length === 0) {
      console.log('No products found, auto-seeding shop data...');
      await seedShopData();
      products = await Product.find({ company: { $regex: /^amazon$/i } }).sort({ createdAt: -1 });
    }
    res.json(products);
  } catch (error) {
    console.error('Error fetching all products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/shop/products/:warehouse
// Get Amazon products for a specific warehouse
router.get('/products/:warehouse', async (req: Request, res: Response) => {
  try {
    const { warehouse } = req.params;
    let products = await Product.find({ 
      company: { $regex: /^amazon$/i }, 
      warehouse: { $regex: new RegExp(`^${warehouse}$`, 'i') } 
    }).sort({ createdAt: -1 });
    if (products.length === 0) {
      products = await Product.find({ company: { $regex: /^amazon$/i } }).sort({ createdAt: -1 });
    }
    res.json(products);
  } catch (error) {
    console.error('Error fetching products for warehouse:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/shop/restaurants
// Get all Zomato restaurants (auto-seeds if empty)
router.get('/restaurants', async (req: Request, res: Response) => {
  try {
    let restaurants = await Restaurant.find({}).sort({ restaurantId: 1 });
    if (restaurants.length === 0) {
      console.log('No restaurants found, auto-seeding shop data...');
      await seedShopData();
      restaurants = await Restaurant.find({}).sort({ restaurantId: 1 });
    }
    res.json(restaurants);
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
});

// GET /api/shop/menus
// Get all menus across all restaurants
router.get('/menus', async (req: Request, res: Response) => {
  try {
    let menus = await Menu.find({}).sort({ name: 1 });
    if (menus.length === 0) {
      console.log('No menus found, auto-seeding shop data...');
      await seedShopData();
      menus = await Menu.find({}).sort({ name: 1 });
    }
    res.json(menus);
  } catch (error) {
    console.error('Error fetching all menus:', error);
    res.status(500).json({ error: 'Failed to fetch menus' });
  }
});

// GET /api/shop/menus/:restaurantId
// Get menus for a specific restaurant
router.get('/menus/:restaurantId', async (req: Request, res: Response) => {
  try {
    const { restaurantId } = req.params;
    let menus = await Menu.find({ restaurantId });
    if (menus.length === 0) {
      menus = await Menu.find({});
    }
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
    const categories = await Category.find({ company: { $regex: new RegExp(`^${company}$`, 'i') } });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

export default router;

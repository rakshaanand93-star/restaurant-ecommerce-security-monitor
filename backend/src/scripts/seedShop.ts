import mongoose from 'mongoose';
import { Product } from '../models/Product';
import { Category } from '../models/Category';
import { Restaurant } from '../models/Restaurant';
import { Menu } from '../models/Menu';
import { Warehouse } from '../models/Warehouse';

const amazonCategories = [
  'Electronics',
  'Fashion',
  'Home',
  'Sports',
  'Grocery'
];

const amazonWarehousesData = [
  { name: 'Warehouse 1', location: 'Bangalore', capacity: 10000, company: 'amazon' },
  { name: 'Warehouse 2', location: 'Mysore', capacity: 8000, company: 'amazon' },
  { name: 'Warehouse 3', location: 'Tumkur', capacity: 5000, company: 'amazon' }
];

const warehouseProductsMap: Record<string, any[]> = {
  'Warehouse 1': [
    { name: 'Apple iPhone 16 (128GB)', price: 79999, image: '/menu/Apple iphone 16.png' },
    { name: 'Samsung Galaxy S25', price: 74999, image: '/menu/Samsung Galaxy S25.png' },
    { name: 'Sony WH-1000XM5 Headphones', price: 29990, image: '/menu/Sony WH-1000XM5.png' },
    { name: 'Apple Watch Series 10', price: 45999, image: '/menu/Apple Watch Series.png' },
    { name: 'Amazon Echo Dot (5th Gen)', price: 4999, image: '/menu/Echo Dot.png' }
  ],
  'Warehouse 2': [
    { name: 'Apple MacBook Air M4', price: 99999, image: '/menu/Sleek MacBook Air.png' },
    { name: 'HP Pavilion 15 Laptop', price: 62999, image: '/menu/HP Pavilion 15.png' },
    { name: 'Samsung 55" Crystal UHD Smart TV', price: 49999, image: '/menu/Samsung Crystal UHD TV.png' },
    { name: 'Philips Air Fryer', price: 8499, image: '/menu/Philips air fryer.png' },
    { name: 'Prestige Electric Kettle', price: 1499, image: '/menu/Prestige electric kettle.png' }
  ],
  'Warehouse 3': [
    { name: 'American Tourister Backpack', price: 1799, image: '/menu/Navy backpack.png' },
    { name: 'Puma Running Shoes', price: 3999, image: '/menu/Puma running shoes.png' },
    { name: 'Titan Men\'s Watch', price: 5499, image: '/menu/Titan wristwatch.png' },
    { name: 'Noise ColorFit Pro 6 Smartwatch', price: 4499, image: '/menu/Smartwatch.png' },
    { name: 'Milton Stainless Steel Water Bottle (1L)', price: 699, image: '/menu/Stainless stell bottle.png' }
  ]
};

const getWarehouseProducts = (warehouseName: string) => {
  const products = warehouseProductsMap[warehouseName] || [];
  return products.map((p, i) => ({
    name: p.name,
    description: `Premium quality ${p.name}`,
    price: p.price,
    quantity: 50,
    category: amazonCategories[i % amazonCategories.length],
    image: p.image,
    company: 'amazon',
    status: 'Active',
    availability: 'In Stock',
    warehouse: warehouseName
  }));
};

// Zomato restaurants are removed from the random generation logic

export const seedShopData = async () => {
  try {
    // Amazon Categories
    const catCount = await Category.countDocuments({ company: 'amazon' });
    if (catCount === 0) {
      await Category.insertMany(
        amazonCategories.map(name => ({
          name,
          productCount: 4,
          status: 'Active',
          company: 'amazon'
        }))
      );
      console.log('✓ Seeded Amazon Categories');
    }

    // Amazon Warehouses
    await Warehouse.deleteMany({ company: 'amazon' });
    const insertedWarehouses = await Warehouse.insertMany(amazonWarehousesData);
    console.log('✓ Seeded Amazon Warehouses');

    // Amazon Products
    await Product.deleteMany({ company: 'amazon' });
    let allAmazonProducts: any[] = [];
    insertedWarehouses.forEach(wh => {
      allAmazonProducts = [...allAmazonProducts, ...getWarehouseProducts(wh.name)];
    });
    await Product.insertMany(allAmazonProducts);
    console.log('✓ Seeded Amazon Products for Warehouses');

    // Zomato Restaurants & Menus (Update to exactly 3)
    await Restaurant.deleteMany({});
    await Menu.deleteMany({});

    const r1 = await Restaurant.create({
      restaurantId: 'REST-1001',
      name: 'Restaurant 1',
      description: 'Premium Multi-Cuisine Restaurant',
      cuisine: ['Multi-Cuisine'],
      rating: 4.8,
      deliveryTime: '20-25 min',
      image: '/Restaurant1.png',
      isActive: true
    });

    const r2 = await Restaurant.create({
      restaurantId: 'REST-1002',
      name: 'Restaurant 2',
      description: 'Authentic Indian Restaurant',
      cuisine: ['Indian'],
      rating: 4.7,
      deliveryTime: '25-30 min',
      image: '/Restaurant2.png',
      isActive: true
    });

    const r3 = await Restaurant.create({
      restaurantId: 'REST-1003',
      name: 'Restaurant 3',
      description: 'Fast Food & Beverages',
      cuisine: ['Fast Food', 'Beverages'],
      rating: 4.9,
      deliveryTime: '15-20 min',
      image: '/Restaurant3.png',
      isActive: true
    });
    console.log('✓ Seeded exactly 3 Zomato Restaurants');

    const menu1 = [
      { name: 'Paneer Butter Masala', image: '/menu/paneer-butter-masala.png' },
      { name: 'Veg Biryani', image: '/menu/veg-biryani.png' },
      { name: 'Butter Naan', image: '/menu/butter-naan.png' },
      { name: 'Masala Dosa', image: '/menu/masala-dosa.png' },
      { name: 'Gulab Jamun', image: '/menu/gulab-jamun.png' }
    ];
    const menu2 = [
      { name: 'Chicken Biryani', image: '/menu/chicken biryani.png' },
      { name: 'Butter Chicken', image: '/menu/butter chicken.png' },
      { name: 'Tandoori Chicken', image: '/menu/tandoori chicken.png' },
      { name: 'Garlic Naan', image: '/menu/garlic naan.png' },
      { name: 'Lassi', image: '/menu/lassi.png' }
    ];
    const menu3 = [
      { name: 'Burger', image: '/menu/burger.png' },
      { name: 'Pizza', image: '/menu/pizza.png' },
      { name: 'French Fries', image: '/menu/french fries.png' },
      { name: 'Sandwich', image: '/menu/sandwich.png' },
      { name: 'Cold Coffee', image: '/menu/cold coffee.png' }
    ];

    const createMenus = async (items: any[], restId: string, fallbackImage: string) => {
      const menuDocs = items.map((item, index) => {
        const name = typeof item === 'string' ? item : item.name;
        const image = typeof item === 'object' && item.image ? item.image : fallbackImage;
        return {
          restaurantId: restId,
          name: name,
          description: `Delicious ${name}`,
          price: (index + 1) * 50 + 100, // random pricing
          category: 'Main Course',
          image: image,
          isVegetarian: name.includes('Chicken') ? false : true,
          isActive: true
        };
      });
      await Menu.insertMany(menuDocs);
    };

    await createMenus(menu1, r1.restaurantId, '/Restaurant1.png');
    await createMenus(menu2, r2.restaurantId, '/Restaurant2.png');
    await createMenus(menu3, r3.restaurantId, '/Restaurant3.png');
    console.log('✓ Seeded Zomato Menus');

  } catch (err) {
    console.error('✗ Failed to seed shop data:', err);
  }
};

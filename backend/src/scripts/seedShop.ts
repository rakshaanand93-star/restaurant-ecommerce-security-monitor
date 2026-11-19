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
    { name: 'Apple iPhone 16 (128GB)', price: 79999, description: 'Super Retina XDR display, A18 bionic chip & 48MP camera', image: '/menu/Apple iphone 16.png' },
    { name: 'Samsung Galaxy S25', price: 74999, description: 'Flagship Dynamic AMOLED 2X display with Galaxy AI built-in', image: '/menu/Samsung Galaxy S25.png' },
    { name: 'Sony WH-1000XM5 Headphones', price: 29990, description: 'Industry-leading noise cancelling wireless headphones with 30h battery', image: '/menu/Sony WH-1000XM5.png' },
    { name: 'Apple Watch Series 10', price: 45999, description: 'Sleek OLED Always-On Retina display with comprehensive health metrics', image: '/menu/Apple Watch Series.png' }
  ],
  'Warehouse 2': [
    { name: 'Apple MacBook Air M4', price: 99999, description: 'Incredible speed, stunning Liquid Retina display and all-day battery life', image: '/menu/Sleek MacBook Air.png' },
    { name: 'HP Pavilion 15 Laptop', price: 62999, description: '15.6" FHD IPS display, Intel Core i5 processor & 512GB SSD storage', image: '/menu/HP Pavilion 15.png' },
    { name: 'Samsung 55" Crystal UHD Smart TV', price: 49999, description: 'Crystal 4K HDR vivid colors, smart apps and immersive sound', image: '/menu/Samsung Crystal UHD TV.png' },
    { name: 'Philips Air Fryer', price: 8499, description: 'Rapid Air technology for delicious, healthy frying with 90% less fat', image: '/menu/Philips air fryer.png' }
  ],
  'Warehouse 3': [
    { name: 'Puma Running Shoes', price: 3999, description: 'Responsive high-grip athletic performance shoes with soft foam cushioning', image: '/menu/Puma running shoes.png' },
    { name: 'American Tourister Backpack', price: 1799, description: 'Durable multi-compartment ergonomic backpack with rain cover', image: '/menu/Navy backpack.png' },
    { name: 'Titan Men\'s Watch', price: 5499, description: 'Premium stainless steel analog timepiece designed for work & casual wear', image: '/menu/Titan wristwatch.png' },
    { name: 'Milton Stainless Steel Water Bottle (1L)', price: 699, description: 'Vacuum insulated double-wall flask keeping liquids hot/cold for 24h', image: '/menu/Stainless stell bottle.png' }
  ]
};

const getWarehouseProducts = (warehouseName: string) => {
  const products = warehouseProductsMap[warehouseName] || [];
  return products.map((p, i) => ({
    name: p.name,
    description: p.description || `Premium quality ${p.name}`,
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
  if (mongoose.connection.readyState !== 1) {
    return;
  }
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
      { name: 'Paneer Butter Masala', price: 240, description: 'Rich cottage cheese cubes simmered in a creamy butter-tomato gravy', image: '/menu/paneer-butter-masala.png', isVegetarian: true },
      { name: 'Veg Biryani', price: 210, description: 'Fragrant basmati rice slow-cooked with fresh garden veggies & spices', image: '/menu/veg-biryani.png', isVegetarian: true },
      { name: 'Butter Naan', price: 50, description: 'Oven-baked traditional clay tandoori flatbread glazed with butter', image: '/menu/butter-naan.png', isVegetarian: true },
      { name: 'Masala Dosa', price: 120, description: 'Golden crisp crepe with potato masala stuffing served with chutneys', image: '/menu/masala-dosa.png', isVegetarian: true },
      { name: 'Gulab Jamun', price: 90, description: 'Two warm, soft milk-solid dumplings steeped in cardamom sugar syrup', image: '/menu/gulab-jamun.png', isVegetarian: true }
    ];
    const menu2 = [
      { name: 'Chicken Biryani', price: 290, description: 'Authentic aromatic dum biryani with marinated tender chicken pieces', image: '/menu/chicken biryani.png', isVegetarian: false },
      { name: 'Butter Chicken', price: 320, description: 'Smoked tandoori chicken cooked in a rich, buttery tomato sauce', image: '/menu/butter chicken.png', isVegetarian: false },
      { name: 'Tandoori Chicken', price: 340, description: 'Juicy whole chicken roasted to perfection in a clay oven with spices', image: '/menu/tandoori chicken.png', isVegetarian: false },
      { name: 'Garlic Naan', price: 60, description: 'Crisp leavened flatbread topped with toasted crushed garlic & butter', image: '/menu/garlic naan.png', isVegetarian: true },
      { name: 'Lassi', price: 80, description: 'Refreshing traditional sweet churned yogurt cooler infused with rose water', image: '/menu/lassi.png', isVegetarian: true }
    ];
    const menu3 = [
      { name: 'Burger', price: 160, description: 'Grilled savory patty with cheddar cheese, fresh lettuce & house mayo', image: '/menu/burger.png', isVegetarian: true },
      { name: 'Pizza', price: 280, description: 'Hand-tossed thin crust pizza topped with mozzarella and rich tomato sauce', image: '/menu/pizza.png', isVegetarian: true },
      { name: 'French Fries', price: 110, description: 'Crisp golden french fries seasoned with sea salt and peri-peri', image: '/menu/french fries.png', isVegetarian: true },
      { name: 'Sandwich', price: 140, description: 'Triple-decker grilled club sandwich layered with fresh vegetables & cheese', image: '/menu/sandwich.png', isVegetarian: true },
      { name: 'Cold Coffee', price: 130, description: 'Thick, creamy chilled coffee blended with espresso and chocolate syrup', image: '/menu/cold coffee.png', isVegetarian: true }
    ];

    const createMenus = async (items: any[], restId: string, fallbackImage: string) => {
      const menuDocs = items.map((item, index) => {
        const name = typeof item === 'string' ? item : item.name;
        const image = typeof item === 'object' && item.image ? item.image : fallbackImage;
        const price = typeof item === 'object' && item.price ? item.price : ((index + 1) * 50 + 100);
        const description = typeof item === 'object' && item.description ? item.description : `Delicious ${name}`;
        const isVegetarian = typeof item === 'object' && item.isVegetarian !== undefined ? item.isVegetarian : (!name.includes('Chicken'));
        return {
          restaurantId: restId,
          name: name,
          description: description,
          price: price,
          category: 'Main Course',
          image: image,
          isVegetarian: isVegetarian,
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

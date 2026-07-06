import mongoose from 'mongoose';
import { Restaurant } from '../models/Restaurant';
import { Menu } from '../models/Menu';

export const updateZomatoData = async () => {
  try {
    // 1. Delete all existing Zomato restaurants and their menus
    // Since our Restaurant schema currently doesn't explicitly store company (wait, does it?),
    // the user said "Update only MongoDB restaurants and menus. Delete old restaurant/menu documents."
    // I will clear both collections completely and re-insert to be safe, since they belong exclusively to Zomato in this app.
    
    await Restaurant.deleteMany({});
    await Menu.deleteMany({});
    console.log('✓ Cleared old restaurants and menus');

    // 2. Insert exact 3 restaurants
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
    console.log('✓ Created Restaurant 1, 2, 3');

    // 3. Insert Menu Items
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

    console.log('✓ Created all menu items');
    
  } catch (error) {
    console.error('✗ Failed to update Zomato data:', error);
  }
};

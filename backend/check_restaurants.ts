import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

const verifySeeding = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/secureguard');
    
    const db = mongoose.connection.db;
    if (!db) {
      console.log('No DB connection');
      process.exit(1);
    }
    
    const restaurantsCount = await db.collection('restaurants').countDocuments();
    const menusCount = await db.collection('menus').countDocuments();
    
    console.log(`Restaurants: ${restaurantsCount}`);
    console.log(`Menus: ${menusCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

verifySeeding();

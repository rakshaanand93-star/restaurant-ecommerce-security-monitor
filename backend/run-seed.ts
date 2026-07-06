import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { seedShopData } from './src/scripts/seedShop';

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/secureguard');
    await seedShopData();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();

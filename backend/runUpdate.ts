import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { updateZomatoData } from './src/scripts/updateZomatoData';

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/secureguard');
    console.log('Connected to DB');
    
    await updateZomatoData();
    
    console.log('Done');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();

import mongoose from 'mongoose';
import { User } from './src/models/User';
import 'dotenv/config';

async function fixRoles() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/secureguard');
  
  const zomatoRes = await User.updateMany({ company: 'zomato', role: 'user' }, { $set: { role: 'employee' } });
  console.log('Zomato Updated:', zomatoRes);
  
  const amazonRes = await User.updateMany({ company: 'amazon', role: 'user' }, { $set: { role: 'warehouse' } });
  console.log('Amazon Updated:', amazonRes);

  process.exit(0);
}

fixRoles();

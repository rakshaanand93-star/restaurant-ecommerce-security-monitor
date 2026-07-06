import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/secureguard');
    
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const allUsers = await User.find({});
    console.log("=== ALL USERS ===");
    console.log(JSON.stringify(allUsers, null, 2));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();

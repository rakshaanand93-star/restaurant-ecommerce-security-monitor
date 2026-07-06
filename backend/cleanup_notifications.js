require('dotenv').config();
const mongoose = require('mongoose');

async function runCleanup() {
  try {
    const MONGO_URI = process.env.MONGODB_URI;
    if (!MONGO_URI) throw new Error("No MONGODB_URI found in environment");
    
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const result = await mongoose.connection.collection('notifications').deleteMany({
      $or: [
        { title: { $regex: /completed/i } },
        { message: { $regex: /completed/i } }
      ]
    });

    console.log(`Successfully deleted ${result.deletedCount} "Completed" notifications.`);
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

runCleanup();

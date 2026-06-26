import { Router } from 'express';
import { getMongooseStatus } from '../config/mongodb';
import mongoose from 'mongoose';

const router = Router();

router.get('/status', async (_req, res) => {
  const mongoStatus = getMongooseStatus();
  
  let collections: string[] = [];
  if (mongoStatus.connected && mongoose.connection.db) {
    try {
      const collectionsCursor = await mongoose.connection.db.listCollections().toArray();
      collections = collectionsCursor.map(c => c.name);
    } catch (e) {
      console.error('Error fetching collections:', e);
    }
  }

  res.json({
    connected: mongoStatus.connected,
    database: mongoStatus.database,
    collections: collections.length > 0 ? collections : [
      "users", 
      "notifications", 
      "orders", 
      "securitylogs", 
      "warehouses", 
      "loginactivities"
    ]
  });
});

export default router;

import { Router } from 'express';
import { User } from '../models/User';
import { Notification } from '../models/Notification';
import { Order } from '../models/Order';
import { SecurityLog } from '../models/SecurityLog';
import { Warehouse } from '../models/Warehouse';
import { LoginActivity } from '../models/LoginActivity';

const router = Router();

router.post('/sync', async (req, res) => {
  const { collectionName, data } = req.body;

  if (!collectionName || !data) {
    return res.status(400).json({ error: 'Missing collectionName or data' });
  }

  try {
    let savedDoc;
    switch (collectionName) {
      case 'users':
        savedDoc = await User.create(data);
        console.log("User saved to MongoDB");
        break;
      case 'notifications':
        savedDoc = await Notification.create(data);
        break;
      case 'orders':
        savedDoc = await Order.create(data);
        break;
      case 'securitylogs':
        savedDoc = await SecurityLog.create(data);
        break;
      case 'warehouses':
        savedDoc = await Warehouse.create(data);
        break;
      case 'loginactivities':
        savedDoc = await LoginActivity.create(data);
        break;
      default:
        return res.status(400).json({ error: `Unknown collection: ${collectionName}` });
    }
    
    res.json({ success: true, doc: savedDoc });
  } catch (error) {
    console.error(`Error syncing to ${collectionName}:`, error);
    res.status(500).json({ error: 'Failed to sync data to MongoDB' });
  }
});

export default router;

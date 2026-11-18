import { Router } from 'express';
import { User } from '../models/User';
import { Notification } from '../models/Notification';
import { Order } from '../models/Order';
import { SecurityLog } from '../models/SecurityLog';
import { Warehouse } from '../models/Warehouse';
import { LoginActivity } from '../models/LoginActivity';
import { saveUser, saveLoginActivity } from '../services/dataStorage';
import { saveOrder } from '../services/orderStorage';

const router = Router();

router.post('/sync', async (req, res) => {
  const { collectionName, data } = req.body;

  if (!collectionName || !data) {
    return res.status(400).json({ error: 'Missing collectionName or data' });
  }

  try {
    let savedDoc: any = data;
    switch (collectionName) {
      case 'users':
        savedDoc = await saveUser(data);
        break;
      case 'notifications':
        try { savedDoc = await Notification.create(data); } catch (e) {}
        break;
      case 'orders':
        savedDoc = await saveOrder(data);
        break;
      case 'securitylogs':
        try { savedDoc = await SecurityLog.create(data); } catch (e) {}
        break;
      case 'warehouses':
        try { savedDoc = await Warehouse.create(data); } catch (e) {}
        break;
      case 'loginactivities':
        savedDoc = await saveLoginActivity(data);
        break;
      default:
        return res.status(400).json({ error: `Unknown collection: ${collectionName}` });
    }
    
    res.json({ success: true, doc: savedDoc });
  } catch (error) {
    console.error(`Error syncing to ${collectionName}:`, error);
    res.status(500).json({ error: 'Failed to sync data' });
  }
});

export default router;

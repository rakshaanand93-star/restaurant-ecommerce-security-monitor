import { Notification } from '../models/Notification';
import { User } from '../models/User';
import { Order } from '../models/Order';
import { SecurityLog } from '../models/SecurityLog';
import { Warehouse } from '../models/Warehouse';
import { LoginActivity } from '../models/LoginActivity';

export const seedDatabase = async () => {
  try {
    const notifCount = await Notification.countDocuments();
    if (notifCount === 0) {
      await Notification.create({
        title: 'Test Notification',
        message: 'MongoDB Connection Successful',
        type: 'system',
        read: false,
      });
      console.log('✓ Seeded Notifications collection');
    }

    const orderCount = await Order.countDocuments();
    if (orderCount === 0) {
      await Order.create({
        orderId: 'TEST-1001',
        amount: 99.99,
        status: 'completed',
        customerEmail: 'test@example.com',
      });
      console.log('✓ Seeded Orders collection');
    }

    const securityCount = await SecurityLog.countDocuments();
    if (securityCount === 0) {
      await SecurityLog.create({
        eventType: 'system_init',
        description: 'SecureGuard AI Backend Started and MongoDB Connected',
        severity: 'info',
        sourceIp: '127.0.0.1',
      });
      console.log('✓ Seeded SecurityLogs collection');
    }

    const warehouseCount = await Warehouse.countDocuments();
    if (warehouseCount === 0) {
      await Warehouse.create({
        name: 'Main Distribution Center',
        location: 'New York, NY',
        capacity: 10000,
        status: 'active',
      });
      console.log('✓ Seeded Warehouses collection');
    }

    const loginActivityCount = await LoginActivity.countDocuments();
    if (loginActivityCount === 0) {
      await LoginActivity.create({
        email: "admin@secureguard.com",
        ipAddress: "127.0.0.1",
        device: "System Initialization",
        status: "LOGIN_SUCCESS",
        company: "admin"
      });
      console.log('✓ Seeded LoginActivities collection');
    }
  } catch (error) {
    console.error('✗ Failed to seed database:', error);
  }
};

import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { Order } from '../models/Order';
import { ZomatoCart } from '../models/ZomatoCart';
import { Cart } from '../models/Cart';

const DATA_DIR = path.join(__dirname, '../../data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const CARTS_FILE = path.join(DATA_DIR, 'carts.json');

// UID and Email mapping for Restaurants
export const RESTAURANT_UID_MAP: Record<string, string> = {
  // Restaurant 1
  'kzneP1VWIxeO92fdDT1W0ha7bzn2': 'REST-1001',
  'resturant1@gmail.com': 'REST-1001',
  'restaurant1@gmail.com': 'REST-1001',
  'restaurant 1': 'REST-1001',
  'REST-1001': 'REST-1001',

  // Restaurant 2
  'As6u7IHApvVMRCbk77U3L05OYwH2': 'REST-1002',
  'restaurant2@gmail.com': 'REST-1002',
  'resturant2@gmail.com': 'REST-1002',
  'restaurant 2': 'REST-1002',
  'REST-1002': 'REST-1002',

  // Restaurant 3
  'T4OH3Vmlh9hezkBa6MKytiryNV73': 'REST-1003',
  'restaurant3@gmail.com': 'REST-1003',
  'resturant3@gmail.com': 'REST-1003',
  'restaurant 3': 'REST-1003',
  'REST-1003': 'REST-1003'
};

// UID and Email mapping for Warehouses
export const WAREHOUSE_UID_MAP: Record<string, string> = {
  'Q8YrOT6D76awK4NvSz7HgGM45Tk1': 'Warehouse 1',
  'warehouse1@gmail.com': 'Warehouse 1',
  'warehouse 1': 'Warehouse 1',
  'Warehouse 1': 'Warehouse 1',

  'Mr3peQD3ENcbbq1DzP0LFZfHdwV2': 'Warehouse 2',
  'warehouse2@gmail.com': 'Warehouse 2',
  'warehouse 2': 'Warehouse 2',
  'Warehouse 2': 'Warehouse 2',

  'OaTqNl0zldTE0aJsgr27mbW7Bst2': 'Warehouse 3',
  'warehouse3@gmail.com': 'Warehouse 3',
  'warehouse 3': 'Warehouse 3',
  'Warehouse 3': 'Warehouse 3'
};

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.error('Error creating data directory:', e);
  }
}

// Helper to read JSON file safely
const readJson = (filePath: string): any[] => {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn(`Error reading ${filePath}:`, err);
  }
  return [];
};

// Helper to write JSON file safely
const writeJson = (filePath: string, data: any[]) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
};

export const isMongoConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};

// ======================== ORDERS ========================

export const saveOrder = async (orderData: any): Promise<any> => {
  const now = new Date();
  const rawRestId = orderData.restaurantId || orderData.items?.[0]?.restaurantId || 'REST-1001';
  const mappedRestId = RESTAURANT_UID_MAP[rawRestId] || rawRestId;

  const rawWhId = orderData.warehouseId || orderData.items?.[0]?.warehouse || 'Warehouse 1';
  const mappedWhId = WAREHOUSE_UID_MAP[rawWhId] || rawWhId;

  const restName = orderData.restaurantName || 
    (mappedRestId === 'REST-1001' ? 'Restaurant 1' : mappedRestId === 'REST-1002' ? 'Restaurant 2' : 'Restaurant 3');

  const fullOrder = {
    orderId: orderData.orderId || `ORD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    amount: Number(orderData.amount) || 0,
    status: orderData.status || 'pending',
    customerEmail: orderData.customerEmail || 'customer@example.com',
    company: (orderData.company || 'zomato').toLowerCase(),
    customerId: orderData.customerId || '',
    items: Array.isArray(orderData.items) ? orderData.items : [],
    paymentMethod: orderData.paymentMethod || 'COD',
    shippingAddress: orderData.shippingAddress || { street: 'Main City Center' },
    employeeId: mappedRestId,
    employeeName: orderData.employeeName || '',
    restaurantId: mappedRestId,
    restaurantName: restName,
    warehouseId: mappedWhId,
    createdAt: orderData.createdAt ? new Date(orderData.createdAt) : now,
    updatedAt: now
  };

  // Always write to local JSON persistence first (instant, 100% durable)
  const orders = readJson(ORDERS_FILE);
  const existingIdx = orders.findIndex((o: any) => o.orderId === fullOrder.orderId);
  if (existingIdx >= 0) {
    orders[existingIdx] = { ...orders[existingIdx], ...fullOrder };
  } else {
    orders.unshift(fullOrder);
  }
  writeJson(ORDERS_FILE, orders);

  // Sync with MongoDB if connected
  if (isMongoConnected()) {
    try {
      await Order.findOneAndUpdate(
        { orderId: fullOrder.orderId },
        fullOrder,
        { upsert: true, new: true }
      );
    } catch (err: any) {
      console.warn('MongoDB sync failed (saved to disk):', err.message);
    }
  }

  return fullOrder;
};

export const getOrders = async (filter: {
  company?: string;
  customerId?: string;
  restaurantId?: string;
  employeeId?: string;
  userEmail?: string;
  isAdmin?: boolean;
}): Promise<any[]> => {
  const company = (filter.company || 'zomato').toLowerCase();

  // Resolve mapped restaurant or warehouse if specific user logged in
  const rawTarget = filter.restaurantId || filter.employeeId || filter.userEmail || '';
  const mappedRestId = RESTAURANT_UID_MAP[rawTarget] || 
                       (filter.userEmail && RESTAURANT_UID_MAP[filter.userEmail.toLowerCase()]) || 
                       (filter.restaurantId && RESTAURANT_UID_MAP[filter.restaurantId.toLowerCase()]);

  const mappedWhId = WAREHOUSE_UID_MAP[rawTarget] || 
                     (filter.userEmail && WAREHOUSE_UID_MAP[filter.userEmail.toLowerCase()]);

  const isGeneralManager = rawTarget.toLowerCase() === 'restaurant@gmail.com' || 
                           rawTarget.toLowerCase() === 'resturant@gmail.com' ||
                           rawTarget.toLowerCase() === 'warehouse@gmail.com' ||
                           filter.isAdmin;

  // Read from disk store
  const allOrders = readJson(ORDERS_FILE);
  return allOrders
    .filter((o: any) => {
      // 1. Company check
      if (company && o.company !== company) return false;

      // 2. Customer view check
      if (filter.customerId && o.customerId !== filter.customerId) return false;

      // 3. Admin & General Manager see ALL orders for that company
      if (isGeneralManager || (!filter.customerId && !mappedRestId && !mappedWhId && !filter.employeeId)) {
        return true;
      }

      // 4. Zomato restaurant matching
      if (company === 'zomato') {
        if (mappedRestId) {
          const restMatches = o.restaurantId === mappedRestId || 
                              o.employeeId === mappedRestId ||
                              (mappedRestId === 'REST-1001' && (o.restaurantName === 'Restaurant 1' || o.restaurantId === 'REST-1001')) ||
                              (mappedRestId === 'REST-1002' && (o.restaurantName === 'Restaurant 2' || o.restaurantId === 'REST-1002')) ||
                              (mappedRestId === 'REST-1003' && (o.restaurantName === 'Restaurant 3' || o.restaurantId === 'REST-1003')) ||
                              (Array.isArray(o.items) && o.items.some((it: any) => it.restaurantId === mappedRestId));
          return restMatches;
        }

        // Delivery personnel matching
        if (filter.employeeId) {
          const deliveryMatches = o.assignedDeliveryPersonId === filter.employeeId ||
                                 ['ready', 'out_for_delivery'].includes(o.status);
          return deliveryMatches;
        }
      }

      // 5. Amazon warehouse matching
      if (company === 'amazon') {
        if (mappedWhId) {
          const whMatches = o.warehouseId === mappedWhId ||
                           (Array.isArray(o.items) && o.items.some((it: any) => it.warehouse === mappedWhId));
          return whMatches;
        }
      }

      return true;
    })
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getOrderById = async (orderId: string): Promise<any | null> => {
  if (isMongoConnected()) {
    try {
      const order = await Order.findOne({ orderId }).lean();
      if (order) return order;
    } catch (err: any) {
      console.warn('MongoDB getOrderById fallback:', err.message);
    }
  }
  const orders = readJson(ORDERS_FILE);
  return orders.find((o: any) => o.orderId === orderId) || null;
};

export const updateOrderStatus = async (
  orderId: string, 
  status: string, 
  userUid?: string, 
  userName?: string
): Promise<any> => {
  const orders = readJson(ORDERS_FILE);
  const idx = orders.findIndex((o: any) => o.orderId === orderId);
  const now = new Date();

  let updatedOrder: any = null;

  if (idx >= 0) {
    orders[idx].status = status;
    orders[idx].updatedAt = now;

    if (status === 'accepted') {
      orders[idx].acceptedAt = now;
      if (!orders[idx].employeeId && userUid) {
        orders[idx].employeeId = userUid;
        if (userName) orders[idx].employeeName = userName;
      }
    } else if (status === 'preparing') {
      orders[idx].preparingAt = now;
    } else if (status === 'ready') {
      orders[idx].preparedAt = now;
    } else if (status === 'out_for_delivery') {
      orders[idx].shippedAt = now;
    } else if (status === 'delivered') {
      orders[idx].deliveredAt = now;
    }

    writeJson(ORDERS_FILE, orders);
    updatedOrder = orders[idx];
  }

  // Update in MongoDB if connected
  if (isMongoConnected()) {
    try {
      const updateDoc: any = { status, updatedAt: now };
      if (status === 'accepted') updateDoc.acceptedAt = now;
      if (status === 'ready') updateDoc.preparedAt = now;
      if (status === 'out_for_delivery') updateDoc.shippedAt = now;
      if (status === 'delivered') updateDoc.deliveredAt = now;
      if (userUid) updateDoc.employeeId = userUid;
      if (userName) updateDoc.employeeName = userName;

      const mongoUpdated = await Order.findOneAndUpdate(
        { orderId },
        { $set: updateDoc },
        { new: true }
      ).lean();
      if (mongoUpdated) updatedOrder = mongoUpdated;
    } catch (err: any) {
      console.warn('MongoDB update status fallback:', err.message);
    }
  }

  return updatedOrder;
};

export const assignOrderDelivery = async (
  orderId: string, 
  employeeId: string, 
  employeeName?: string
): Promise<any> => {
  const orders = readJson(ORDERS_FILE);
  const idx = orders.findIndex((o: any) => o.orderId === orderId);
  const now = new Date();
  let updatedOrder: any = null;

  if (idx >= 0) {
    orders[idx].assignedDeliveryPersonId = employeeId;
    orders[idx].assignedDeliveryPersonName = employeeName || employeeId;
    orders[idx].updatedAt = now;
    writeJson(ORDERS_FILE, orders);
    updatedOrder = orders[idx];
  }

  if (isMongoConnected()) {
    try {
      const mongoUpdated = await Order.findOneAndUpdate(
        { orderId },
        { 
          $set: { 
            assignedDeliveryPersonId: employeeId, 
            assignedDeliveryPersonName: employeeName || employeeId,
            updatedAt: now 
          } 
        },
        { new: true }
      ).lean();
      if (mongoUpdated) updatedOrder = mongoUpdated;
    } catch (err: any) {
      console.warn('MongoDB assignOrderDelivery fallback:', err.message);
    }
  }

  return updatedOrder;
};

// ======================== CARTS ========================

export const getLocalCart = (userId: string, company: string = 'zomato'): any[] => {
  const carts = readJson(CARTS_FILE);
  const userCart = carts.find((c: any) => c.userId === userId && c.company === company);
  return userCart ? userCart.items : [];
};

export const saveLocalCart = (userId: string, items: any[], company: string = 'zomato') => {
  const carts = readJson(CARTS_FILE);
  const idx = carts.findIndex((c: any) => c.userId === userId && c.company === company);
  if (idx >= 0) {
    carts[idx].items = items;
    carts[idx].updatedAt = new Date();
  } else {
    carts.push({ userId, company, items, updatedAt: new Date() });
  }
  writeJson(CARTS_FILE, carts);
};

export const clearLocalCart = (userId: string, company: string = 'zomato') => {
  const carts = readJson(CARTS_FILE);
  const idx = carts.findIndex((c: any) => c.userId === userId && c.company === company);
  if (idx >= 0) {
    carts[idx].items = [];
    writeJson(CARTS_FILE, carts);
  }
};

import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { LoginActivity } from '../models/LoginActivity';
import { isMongoConnected } from './orderStorage';

const DATA_DIR = path.join(__dirname, '../../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const LOGS_FILE = path.join(DATA_DIR, 'login_activities.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.error('Error creating data directory:', e);
  }
}

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

const writeJson = (filePath: string, data: any[]) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
};

// Generate valid 24-hex-char MongoDB ObjectId format
const generateObjectId = (): string => {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const random = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return (timestamp + random).substring(0, 24);
};

// ======================== DEFAULT SEED DATA ========================

const DEFAULT_USERS = [
  {
    _id: "6670a1b2c3d4e5f600000001",
    firebaseUid: "UaXhWk5QNxTRFt9mcs3OuaVn4F23",
    email: "admin@secureguard.com",
    displayName: "AdminHQ",
    role: "admin",
    company: "zomato",
    location: "Global HQ",
    status: "active",
    createdAt: new Date("2026-11-01T10:00:00Z"),
    updatedAt: new Date()
  },
  {
    _id: "6670a1b2c3d4e5f600000002",
    firebaseUid: "kzneP1VWIxeO92fdDT1W0ha7bzn2",
    email: "resturant1@gmail.com",
    displayName: "Restaurant 1",
    role: "restaurant",
    company: "zomato",
    location: "Indiranagar",
    status: "active",
    createdAt: new Date("2026-11-01T10:05:00Z"),
    updatedAt: new Date()
  },
  {
    _id: "6670a1b2c3d4e5f600000003",
    firebaseUid: "As6u7IHApvVMRCbk77U3L05OYwH2",
    email: "restaurant2@gmail.com",
    displayName: "Restaurant 2",
    role: "restaurant",
    company: "zomato",
    location: "Koramangala",
    status: "active",
    createdAt: new Date("2026-11-01T10:10:00Z"),
    updatedAt: new Date()
  },
  {
    _id: "6670a1b2c3d4e5f600000004",
    firebaseUid: "T4OH3Vmlh9hezkBa6MKytiryNV73",
    email: "restaurant3@gmail.com",
    displayName: "Restaurant 3",
    role: "restaurant",
    company: "zomato",
    location: "Whitefield",
    status: "active",
    createdAt: new Date("2026-11-01T10:15:00Z"),
    updatedAt: new Date()
  },
  {
    _id: "6670a1b2c3d4e5f600000005",
    firebaseUid: "deliv-rider-001",
    email: "delivery@gmail.com",
    displayName: "Ramesh Rider",
    role: "employee",
    company: "zomato",
    location: "Indiranagar Hub",
    status: "active",
    createdAt: new Date("2026-11-01T10:20:00Z"),
    updatedAt: new Date()
  },
  {
    _id: "6670a1b2c3d4e5f600000006",
    firebaseUid: "Q8YrOT6D76awK4NvSz7HgGM45Tk1",
    email: "warehouse1@gmail.com",
    displayName: "Warehouse 1 Manager",
    role: "warehouse",
    company: "amazon",
    location: "Whitefield Hub",
    status: "active",
    createdAt: new Date("2026-11-01T10:25:00Z"),
    updatedAt: new Date()
  },
  {
    _id: "6670a1b2c3d4e5f600000007",
    firebaseUid: "Mr3peQD3ENcbbq1DzP0LFZfHdwV2",
    email: "warehouse2@gmail.com",
    displayName: "Warehouse 2 Manager",
    role: "warehouse",
    company: "amazon",
    location: "Mysore DC",
    status: "active",
    createdAt: new Date("2026-11-01T10:30:00Z"),
    updatedAt: new Date()
  },
  {
    _id: "6670a1b2c3d4e5f600000008",
    firebaseUid: "OaTqNl0zldTE0aJsgr27mbW7Bst2",
    email: "warehouse3@gmail.com",
    displayName: "Warehouse 3 Manager",
    role: "warehouse",
    company: "amazon",
    location: "Tumkur FC",
    status: "active",
    createdAt: new Date("2026-11-01T10:35:00Z"),
    updatedAt: new Date()
  },
  {
    _id: "6670a1b2c3d4e5f600000009",
    firebaseUid: "QbaKJBAMtPP5gJUr9LObsPc2YdE3",
    email: "customer@gmail.com",
    displayName: "Customer User",
    role: "customer",
    company: "zomato",
    location: "Bengaluru",
    status: "active",
    createdAt: new Date("2026-11-01T10:40:00Z"),
    updatedAt: new Date()
  }
];

const DEFAULT_LOGS = [
  {
    _id: "6670b1b2c3d4e5f600000001",
    userId: "UaXhWk5QNxTRFt9mcs3OuaVn4F23",
    userEmail: "admin@secureguard.com",
    action: "LOGIN_SUCCESS",
    details: "Admin logged into AdminHQ dashboard",
    ipAddress: "127.0.0.1",
    status: "LOGIN_SUCCESS",
    company: "zomato",
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString()
  },
  {
    _id: "6670b1b2c3d4e5f600000002",
    userId: "kzneP1VWIxeO92fdDT1W0ha7bzn2",
    userEmail: "resturant1@gmail.com",
    action: "LOGIN_SUCCESS",
    details: "Restaurant 1 dashboard session active",
    ipAddress: "127.0.0.1",
    status: "LOGIN_SUCCESS",
    company: "zomato",
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString()
  },
  {
    _id: "6670b1b2c3d4e5f600000003",
    userId: "QbaKJBAMtPP5gJUr9LObsPc2YdE3",
    userEmail: "customer@gmail.com",
    action: "LOGIN_SUCCESS",
    details: "Customer mobile app session",
    ipAddress: "127.0.0.1",
    status: "LOGIN_SUCCESS",
    company: "zomato",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
  },
  {
    _id: "6670b1b2c3d4e5f600000004",
    userId: "unknown",
    userEmail: "attacker@unknown.net",
    action: "LOGIN_BLOCKED",
    details: "Suspicious unrecognized IP address blocked by policy",
    ipAddress: "198.51.100.23",
    status: "LOGIN_BLOCKED",
    company: "zomato",
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString()
  },
  {
    _id: "6670b1b2c3d4e5f600000005",
    userId: "Q8YrOT6D76awK4NvSz7HgGM45Tk1",
    userEmail: "warehouse1@gmail.com",
    action: "LOGIN_SUCCESS",
    details: "Fulfillment center terminal authorized",
    ipAddress: "127.0.0.1",
    status: "LOGIN_SUCCESS",
    company: "amazon",
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString()
  }
];

// Initialize users file if empty
if (!fs.existsSync(USERS_FILE) || readJson(USERS_FILE).length === 0) {
  writeJson(USERS_FILE, DEFAULT_USERS);
}

// Initialize logs file if empty
if (!fs.existsSync(LOGS_FILE) || readJson(LOGS_FILE).length === 0) {
  writeJson(LOGS_FILE, DEFAULT_LOGS);
}

// ======================== USER OPERATIONS ========================

export const saveUser = async (userData: any): Promise<any> => {
  const users = readJson(USERS_FILE);
  const now = new Date();

  const userObj = {
    _id: userData._id || generateObjectId(),
    firebaseUid: userData.firebaseUid || generateObjectId(),
    email: (userData.email || '').toLowerCase().trim(),
    displayName: userData.displayName || userData.name || userData.email?.split('@')[0] || 'User',
    role: (userData.role || 'employee').toLowerCase(),
    company: (userData.company || 'zomato').toLowerCase(),
    location: userData.location || 'Indiranagar',
    status: userData.status || 'active',
    createdAt: userData.createdAt ? new Date(userData.createdAt) : now,
    updatedAt: now
  };

  const existingIdx = users.findIndex(
    (u: any) => (u.email && u.email.toLowerCase() === userObj.email) || 
                (u.firebaseUid && u.firebaseUid === userObj.firebaseUid) ||
                (u._id && u._id === userObj._id)
  );

  if (existingIdx >= 0) {
    users[existingIdx] = { ...users[existingIdx], ...userObj };
  } else {
    users.unshift(userObj);
  }
  writeJson(USERS_FILE, users);

  // Sync to MongoDB if connected
  if (isMongoConnected()) {
    try {
      await User.findOneAndUpdate(
        { firebaseUid: userObj.firebaseUid },
        userObj,
        { upsert: true, new: true }
      );
    } catch (err: any) {
      console.warn('MongoDB User save fallback (saved to disk):', err.message);
    }
  }

  return userObj;
};

export const getUsers = async (filter: { company?: string; role?: string }): Promise<any[]> => {
  const company = filter.company?.toLowerCase();

  // If Mongo is connected, try Mongo first
  if (isMongoConnected()) {
    try {
      let query: any = {};
      if (company) query.company = company;
      if (filter.role) query.role = filter.role;
      const mongoUsers = await User.find(query).lean();
      if (mongoUsers && mongoUsers.length > 0) return mongoUsers;
    } catch (e) {}
  }

  const users = readJson(USERS_FILE);
  return users.filter((u: any) => {
    if (company && u.company && u.company !== company && u.role !== 'admin') return false;
    if (filter.role && u.role !== filter.role) return false;
    return true;
  });
};

export const getUserById = async (id: string): Promise<any | null> => {
  if (isMongoConnected()) {
    try {
      const u = await User.findOne({ $or: [{ _id: id }, { firebaseUid: id }] }).lean();
      if (u) return u;
    } catch (e) {}
  }

  const users = readJson(USERS_FILE);
  return users.find((u: any) => u._id === id || u.firebaseUid === id) || null;
};

export const getUserByEmail = async (email: string): Promise<any | null> => {
  const lowerEmail = email.toLowerCase().trim();
  if (isMongoConnected()) {
    try {
      const u = await User.findOne({ email: lowerEmail }).lean();
      if (u) return u;
    } catch (e) {}
  }

  const users = readJson(USERS_FILE);
  return users.find((u: any) => u.email && u.email.toLowerCase() === lowerEmail) || null;
};

export const updateUser = async (id: string, updateData: any): Promise<any | null> => {
  const users = readJson(USERS_FILE);
  const idx = users.findIndex((u: any) => u._id === id || u.firebaseUid === id);
  if (idx < 0) return null;

  users[idx] = { ...users[idx], ...updateData, updatedAt: new Date() };
  writeJson(USERS_FILE, users);

  if (isMongoConnected()) {
    try {
      await User.findOneAndUpdate(
        { $or: [{ _id: id }, { firebaseUid: id }] },
        { $set: updateData },
        { new: true }
      );
    } catch (e) {}
  }

  return users[idx];
};

export const deleteUser = async (id: string): Promise<boolean> => {
  let users = readJson(USERS_FILE);
  const initialLen = users.length;
  users = users.filter((u: any) => u._id !== id && u.firebaseUid !== id);
  writeJson(USERS_FILE, users);

  if (isMongoConnected()) {
    try {
      await User.deleteOne({ $or: [{ _id: id }, { firebaseUid: id }] });
    } catch (e) {}
  }

  return users.length < initialLen;
};

// ======================== LOGIN ACTIVITY OPERATIONS ========================

export const saveLoginActivity = async (data: any): Promise<any> => {
  const logs = readJson(LOGS_FILE);
  const now = new Date();

  const logEntry = {
    _id: data._id || generateObjectId(),
    userId: data.userId || data.firebaseUid || data.uid || 'unknown',
    userEmail: (data.userEmail || data.email || 'unknown').toLowerCase(),
    action: data.action || data.status || 'LOGIN_SUCCESS',
    details: data.details || data.device || 'User session active',
    ipAddress: data.ipAddress || '127.0.0.1',
    status: data.status || data.action || 'LOGIN_SUCCESS',
    company: (data.company || 'zomato').toLowerCase(),
    role: data.role || 'user',
    createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : now.toISOString()
  };

  logs.unshift(logEntry);
  // Keep last 200 logs
  if (logs.length > 200) logs.pop();
  writeJson(LOGS_FILE, logs);

  if (isMongoConnected()) {
    try {
      await LoginActivity.create(logEntry);
    } catch (e) {}
  }

  return logEntry;
};

export const getLoginActivities = async (company?: string): Promise<any[]> => {
  const comp = company?.toLowerCase();
  if (isMongoConnected()) {
    try {
      const filter = comp ? { company: comp } : {};
      const mongoLogs = await LoginActivity.find(filter).sort({ createdAt: -1 }).lean();
      if (mongoLogs && mongoLogs.length > 0) return mongoLogs;
    } catch (e) {}
  }

  const logs = readJson(LOGS_FILE);
  return logs.filter((l: any) => {
    if (comp && l.company && l.company !== comp && l.company !== 'system') return false;
    return true;
  });
};

export const clearLoginActivities = async (company?: string): Promise<number> => {
  let logs = readJson(LOGS_FILE);
  const comp = company?.toLowerCase();
  let deletedCount = 0;

  if (comp) {
    const remaining = logs.filter((l: any) => l.company !== comp);
    deletedCount = logs.length - remaining.length;
    writeJson(LOGS_FILE, remaining);
  } else {
    deletedCount = logs.length;
    writeJson(LOGS_FILE, []);
  }

  if (isMongoConnected()) {
    try {
      const res = await LoginActivity.deleteMany(comp ? { company: comp } : {});
      deletedCount = res.deletedCount || deletedCount;
    } catch (e) {}
  }

  return deletedCount;
};


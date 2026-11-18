import { Router, Request, Response } from 'express';
import { User } from '../models/User';
import { LoginActivity } from '../models/LoginActivity';
import { Notification } from '../models/Notification';
import { SecurityLog } from '../models/SecurityLog';
import { getFirebaseAuth, getFirebaseFirestore } from '../config/firebase';
import { getUsers, getUserById, getUserByEmail, saveUser, updateUser as updateStoredUser, deleteUser as deleteStoredUser } from '../services/dataStorage';

const router = Router();

// GET /api/users
// Fetch all users from persistent storage / MongoDB
router.get('/', async (req: Request, res: Response) => {
  try {
    const { company, role } = req.query;
    const users = await getUsers({
      company: company as string,
      role: role as string
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/users/by-email/:email
router.get('/by-email/:email', async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    const user = await getUserByEmail(email);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/users/:id
// Fetch a single user by ID or firebaseUid
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (id === 'performance' || id === 'seed-orders' || id === 'by-email') {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const user = await getUserById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error: any) {
    console.error(`[GET /api/users/:id] Error fetching user:`, error.message);
    res.status(500).json({ error: 'Server error fetching user' });
  }
});

// POST /api/users
// Create a new user in MongoDB and Firebase Auth
router.post('/', async (req: Request, res: Response) => {
  try {
    const { email, password, displayName, role, company, location, status } = req.body;
    
    if (!email || !password || !displayName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1. Create or sync in Firebase Auth
    let userRecord: any = null;
    try {
      userRecord = await getFirebaseAuth().createUser({
        email,
        password,
        displayName
      });
      console.log(`✓ Firebase user created: ${userRecord.uid}`);
    } catch (err: any) {
      if (err.code === 'auth/email-already-exists') {
        try {
          console.log(`[USER CREATION] Recovering: Fetching existing Firebase user for ${email}...`);
          userRecord = await getFirebaseAuth().getUserByEmail(email);
          await getFirebaseAuth().updateUser(userRecord.uid, { password, displayName });
          console.log(`[USER CREATION] Password and info updated for existing Firebase account.`);
        } catch (recoverErr: any) {
          console.error('[USER CREATION] Failed to recover existing Firebase user:', recoverErr);
          userRecord = { uid: `usr-${Date.now()}` };
        }
      } else {
        console.warn('Firebase user create notice, using generated UID:', err.message);
        userRecord = { uid: `usr-${Date.now()}` };
      }
    }

    // 2. Save user using persistent data storage layer
    try {
      const savedUser = await saveUser({
        firebaseUid: userRecord.uid,
        email: email.toLowerCase(),
        displayName,
        role: role || (company === 'amazon' ? 'warehouse' : 'employee'),
        company: company ? company.toLowerCase() : 'zomato',
        location: location || 'Indiranagar',
        status: status || 'active'
      });

      // 3. Mirror to Firestore if available
      try {
        const db = getFirebaseFirestore();
        await db.collection('users').doc(userRecord.uid).set({
          uid: userRecord.uid,
          email: email.toLowerCase(),
          displayName,
          role: savedUser.role,
          company: savedUser.company,
          location: savedUser.location,
          status: savedUser.status,
          createdAt: new Date().toISOString()
        }, { merge: true });
      } catch (fsErr) {}

      // 4. Generate Admin Notification
      try {
        await Notification.create({
          title: 'New Employee Created',
          message: `Employee ${savedUser.email} has been added to the system.`,
          type: 'info',
          severity: 'info',
          company: savedUser.company,
          employeeName: savedUser.displayName || savedUser.email.split('@')[0]
        }).catch(console.warn);
      } catch (notifErr) {}

      console.log(`✓ User ${email} created successfully in system`);
      return res.status(201).json(savedUser);
    } catch (saveError: any) {
      console.error('Error saving user:', saveError);
      return res.status(500).json({ error: 'Failed to create user', details: saveError.message });
    }
  } catch (error: any) {
    console.error('Unhandled error during user creation:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// DELETE /api/users/:firebaseUid
// DELETE /api/users/:id
// Completely delete a user and all related records
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { company } = req.query;
  
  if (!id) {
    return res.status(400).json({ error: 'Missing id' });
  }

  try {
    const mongoUser = await User.findById(id);
    if (!mongoUser) {
      return res.status(404).json({ error: 'User not found in MongoDB' });
    }
    if (company && mongoUser.company && mongoUser.company.toLowerCase() !== (company as string).toLowerCase()) {
      return res.status(403).json({ error: 'Cannot delete user from another company' });
    }

    const userEmail = mongoUser.email;
    let firebaseUid = mongoUser.firebaseUid;

    // 1. Delete from Firebase Auth
    console.log('Deleting Firebase Authentication user...');
    try {
      if (!firebaseUid) {
        console.log(`firebaseUid missing for ${userEmail}, fetching from Firebase...`);
        const userRecord = await getFirebaseAuth().getUserByEmail(userEmail);
        firebaseUid = userRecord.uid;
      }
      
      await getFirebaseAuth().deleteUser(firebaseUid);
      console.log('✓ Firebase user deleted');
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        console.log('✓ Firebase user already deleted');
      } else {
        console.error('Firebase Auth deletion error:', err.message);
        return res.status(500).json({ error: 'Failed to delete user from Firebase Auth', details: err.message });
      }
    }

    // 2. Delete from MongoDB and disk storage
    console.log('Deleting user document...');
    await deleteStoredUser(id);
    try {
      await User.findByIdAndDelete(id);
      console.log('✓ MongoDB user deleted');
    } catch (err: any) {
      // Ignored if Mongo not connected
    }

    // 4. Delete related records
    try {
      if (userEmail) {
        await LoginActivity.deleteMany({ $or: [{ userEmail }, { userId: firebaseUid }] });
        console.log('✓ Related login activities deleted');
        
        await Notification.deleteMany({ userEmail });
        console.log('✓ Related notifications deleted');
      } else {
        await LoginActivity.deleteMany({ userId: firebaseUid });
        console.log('✓ Related login activities deleted (by userId)');
      }

      await SecurityLog.deleteMany({ userId: firebaseUid });
      
      // Delete device requests from Firestore
      if (firebaseUid) {
        const deviceReqs = await getFirebaseFirestore().collection('device_requests').where('uid', '==', firebaseUid).get();
        const batch = getFirebaseFirestore().batch();
        deviceReqs.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        console.log('✓ Related device requests deleted');
      }
    } catch (err: any) {
      console.error('Failed to delete related records:', err.message);
    }

    console.log('✓ Synchronization completed');

    // Generate Admin Notification
    const employeeComp = mongoUser.company || 'system';
    await Notification.create({
      title: 'Employee Deleted',
      message: `Employee ${mongoUser.email} has been deleted from the system.`,
      type: 'warning',
      severity: 'warning',
      company: employeeComp.toLowerCase(),
      employeeName: mongoUser.displayName || mongoUser.email.split('@')[0]
    });

    return res.status(200).json({ message: 'User completely deleted from all systems' });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to completely delete user.',
    });
  }
});

// PUT /api/users/:id
// Update a user's profile information (e.g. location, status)
router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { location, status, company, displayName, photoURL, profile, settings } = req.body;
  
  if (!id) {
    return res.status(400).json({ error: 'Missing id' });
  }

  try {
    const updateData: any = {};
    if (location !== undefined) updateData.location = location;
    if (status !== undefined) updateData.status = status;
    if (displayName !== undefined) updateData.displayName = displayName;
    if (photoURL !== undefined) updateData.photoURL = photoURL;
    if (profile) updateData.profile = profile;
    if (settings) updateData.settings = settings;

    const updatedUser = await updateStoredUser(id, updateData);

    try {
      await User.findByIdAndUpdate(id, { $set: updateData });
    } catch (e) {}

    // Update Firestore as well
    if (updatedUser?.firebaseUid) {
      try {
        const firestoreUpdate: any = {};
        if (location !== undefined) firestoreUpdate.location = location;
        if (status !== undefined) firestoreUpdate.isDisabled = status === 'inactive' || status === 'suspended';
        if (displayName !== undefined) firestoreUpdate.displayName = displayName;
        if (photoURL !== undefined) firestoreUpdate.photoURL = photoURL;
        
        await getFirebaseFirestore().collection('users').doc(updatedUser.firebaseUid).update(firestoreUpdate);
      } catch (err: any) {}
    }

    return res.status(200).json(updatedUser || { success: true });
  } catch (error: any) {
    console.error('Update user error:', error);
    return res.status(500).json({ error: 'Failed to update user' });
  }
});

// GET /api/users/:uid/performance
// Get performance metrics and related activity for a specific employee
router.get('/:uid/performance', async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const { company } = req.query;
    
    if (!uid) {
      return res.status(400).json({ error: 'Missing user ID' });
    }
    
    // Attempt to find user by firebaseUid or MongoDB ID
    const user = await User.findOne({ 
      $or: [
        { firebaseUid: uid },
        { _id: uid.length === 24 ? uid : null } // Fallback to Mongo ID if it's 24 chars
      ]
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Ensure company match if provided
    if (company && user.company && user.company.toLowerCase() !== (company as string).toLowerCase()) {
      return res.status(403).json({ error: 'Unauthorized access to user from another company' });
    }

    // 1. Fetch Orders for this employee
    // Map Firebase UIDs to backend REST IDs for Zomato
    const RESTAURANT_MAP: Record<string, string> = {
      'kzneP1VWIxeO92fdDT1W0ha7bzn2': 'REST-1001',
      'As6u7IHApvVMRCbk77U3L05OYwH2': 'REST-1002',
      'T4OH3Vmlh9hezkBa6MKytiryNV73': 'REST-1003'
    };
    
    const targetEmployeeId = user.firebaseUid ? (RESTAURANT_MAP[user.firebaseUid] || user.firebaseUid) : user._id.toString();

    // Using dynamic import or standard import for Order model
    const Order = (await import('../models/Order')).default;
    const orders = await Order.find({ employeeId: targetEmployeeId });

    const totalOrders = orders.length;
    const successful = orders.filter(o => o.status === 'delivered' || o.status === 'completed').length;
    const failed = orders.filter(o => o.status === 'failed' || o.status === 'cancelled').length;
    const pending = orders.filter(o => o.status === 'pending' || o.status === 'processing' || o.status === 'shipped').length;
    
    // Late Deliveries calculation (if deliveredAt > expectedDeliveryDate)
    const late = orders.filter(o => {
      if (o.status !== 'delivered' && o.status !== 'completed') return false;
      if (!o.deliveredAt || !o.expectedDeliveryDate) return false;
      return new Date(o.deliveredAt) > new Date(o.expectedDeliveryDate);
    }).length;

    // ZOMATO SPECIFIC METRICS
    const prepared = orders.filter(o => o.status === 'prepared' || o.status === 'completed' || o.status === 'delivered').length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;
    
    // For Zomato, count any order with preparation or delivery delays
    const delayed = orders.filter(o => o.isPreparationDelayed || o.isDeliveryDelayed).length;

    // Calculate Avg Prep and Delivery Times
    let totalPrepTimeMinutes = 0;
    let prepTimeCount = 0;
    let totalDeliveryTimeMinutes = 0;
    let deliveryTimeCount = 0;

    orders.forEach(o => {
      if (o.preparedAt && o.acceptedAt) {
        const diffMs = o.preparedAt.getTime() - o.acceptedAt.getTime();
        const diffMins = diffMs / 60000;
        if (diffMins >= 0 && diffMins < 60 * 24) { 
          totalPrepTimeMinutes += diffMins;
          prepTimeCount++;
        }
      }

      if (o.deliveredAt && (o.preparedAt || o.packedAt)) {
        const startDelivery = o.preparedAt || o.packedAt;
        if (startDelivery) {
          const diffMs = o.deliveredAt.getTime() - startDelivery.getTime();
          const diffMins = diffMs / 60000;
          if (diffMins >= 0 && diffMins < 60 * 24) {
            totalDeliveryTimeMinutes += diffMins;
            deliveryTimeCount++;
          }
        }
      }
    });

    const avgPrepTime = prepTimeCount > 0 ? Math.round(totalPrepTimeMinutes / prepTimeCount) : 0;
    const avgDeliveryTimeVal = deliveryTimeCount > 0 ? Math.round(totalDeliveryTimeMinutes / deliveryTimeCount) : 0;

    // Calculate Revenue
    let revenue = 0;
    orders.forEach(o => {
      if ((o.status === 'completed' || o.status === 'delivered') && o.amount) {
        revenue += Number(o.amount);
      }
    });

    // Averages
    const successRate = totalOrders > 0 ? ((successful / totalOrders) * 100).toFixed(1) : '0.0';
    const failureRate = totalOrders > 0 ? ((failed / totalOrders) * 100).toFixed(1) : '0.0';

    // Chart Data Generation (Orders Completed per Day for last 7 days)
    const now = new Date();
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(now.getDate() - (6 - i));
      return { 
        date: d.toISOString().split('T')[0], 
        completed: 0,
        failed: 0,
        prepared: 0,
        cancelled: 0,
        prepTimeSum: 0,
        prepCount: 0,
        avgPrepTime: 0
      };
    });

    orders.forEach(o => {
      if (o.createdAt) {
        const dStr = new Date(o.createdAt).toISOString().split('T')[0];
        const day = last7Days.find(d => d.date === dStr);
        if (day) {
          if (o.status === 'delivered' || o.status === 'completed') day.completed++;
          if (o.status === 'failed' || o.status === 'cancelled') day.failed++;
          
          if (o.status === 'prepared' || o.status === 'completed' || o.status === 'delivered') {
            day.prepared++;
            
            // Calc prep time for this specific order
            const endTime = o.preparedAt || o.updatedAt || o.deliveredAt;
            if (endTime) {
              const diffMs = new Date(endTime).getTime() - new Date(o.createdAt).getTime();
              const diffMins = diffMs / (1000 * 60);
              if (diffMins > 0 && diffMins < 60 * 24) {
                day.prepTimeSum += diffMins;
                day.prepCount++;
              }
            }
          }
          if (o.status === 'cancelled') day.cancelled++;
        }
      }
    });

    last7Days.forEach(day => {
      day.avgPrepTime = day.prepCount > 0 ? Math.round(day.prepTimeSum / day.prepCount) : 0;
    });

    // 2. Fetch Security Events / Alerts generated by this user
    // We already have SecurityLog model
    const alerts = await SecurityLog.find({ 
      $or: [
        { userId: user.firebaseUid },
        { userEmail: user.email }
      ]
    }).sort({ timestamp: -1 }).limit(10);

    const totalAlerts = await SecurityLog.countDocuments({ 
      $or: [
        { userId: user.firebaseUid },
        { userEmail: user.email }
      ]
    });

    // 3. Fetch Login Activities
    const LoginActivity = (await import('../models/LoginActivity')).default;
    const logins = await LoginActivity.find({
      $or: [
        { firebaseUid: user.firebaseUid },
        { email: user.email }
      ]
    }).sort({ loginTime: -1 }).limit(10);

    const responseData = {
      employeeId: targetEmployeeId,
      employeeName: user.displayName || user.email.split('@')[0],
      assignedOrders: totalOrders,
      acceptedOrders: orders.filter(o => o.status === 'accepted').length,
      preparingOrders: orders.filter(o => o.status === 'preparing').length,
      readyOrders: orders.filter(o => o.status === 'ready').length,
      outForDeliveryOrders: orders.filter(o => o.status === 'out_for_delivery').length,
      completedOrders: successful,
      rejectedOrders: cancelled,
      packing: orders.filter(o => ['accepted', 'preparing', 'ready', 'out_for_delivery', 'completed', 'delivered'].includes(o.status)).length,
      shipping: orders.filter(o => ['ready', 'out_for_delivery', 'completed', 'delivered'].includes(o.status)).length,
      delayPacking: orders.filter(o => o.isPackingDelayed).length, 
      delayShipping: orders.filter(o => o.isShippingDelayed).length,
      failedDeliveries: failed,
      successRate: totalOrders > 0 ? Math.round((successful / totalOrders) * 100) : 0,
      completionRate: totalOrders > 0 ? Math.round((successful / totalOrders) * 100) : 0,
      metrics: {
        totalOrders,
        successful,
        completed: successful,
        failed,
        pending,
        late,
        prepared,
        cancelled,
        delayed,
        revenue,
        avgPrepTime,
        successRate,
        failureRate,
        totalAlerts,
        avgDeliveryTime: `${avgDeliveryTimeVal}m`
      },
      charts: {
        weeklyPerformance: last7Days,
        preparationTimeTrend: last7Days.map(d => ({ date: d.date, avgPrepTime: d.avgPrepTime }))
      },
      recentOrders: orders.slice(-10).reverse(), // Last 10 orders
      recentAlerts: alerts,
      recentLogins: logins
    };

    console.log("Performance API:", responseData);
    res.json(responseData);

  } catch (error) {
    console.error('Error fetching employee performance:', error);
    res.status(500).json({ error: 'Server error fetching performance metrics' });
  }
});

// POST /api/users/:uid/seed-orders
// Development endpoint to inject fake orders for a specific employee to test charts
router.post('/:uid/seed-orders', async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const user = await User.findOne({ firebaseUid: uid });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const Order = (await import('../models/Order')).default;
    
    const company = user.company || 'amazon';
    const now = new Date();
    
    const mockOrders = [];
    // Seed 20 orders over the past 7 days
    for (let i = 0; i < 20; i++) {
      const daysAgo = Math.floor(Math.random() * 7);
      const createdAt = new Date(now);
      createdAt.setDate(now.getDate() - daysAgo);
      
      const expectedDelivery = new Date(createdAt);
      expectedDelivery.setHours(expectedDelivery.getHours() + 24);
      
      let status = 'pending';
      let deliveredAt = undefined;
      let preparedAt = undefined;

      if (company === 'zomato') {
        const r = Math.random();
        if (r > 0.3) { // 70% prepared
          status = 'prepared';
          preparedAt = new Date(createdAt);
          // prep time between 10 and 45 mins
          const prepMins = Math.floor(Math.random() * 35) + 10;
          preparedAt.setMinutes(preparedAt.getMinutes() + prepMins);
        } else if (r > 0.15) { // 15% cancelled
          status = 'cancelled';
        } else if (r > 0.05) { // 10% delayed
          status = 'delayed';
        } else { // 5% pending
          status = 'pending';
        }
      } else {
        const isDelivered = Math.random() > 0.3; // 70% success rate
        const isFailed = !isDelivered && Math.random() > 0.5; // 15% failed
        
        status = isDelivered ? 'delivered' : (isFailed ? 'failed' : 'pending');
        if (isDelivered) {
          deliveredAt = new Date(createdAt);
          // Randomly make some late
          const hoursToAdd = Math.random() > 0.8 ? 48 : 12; 
          deliveredAt.setHours(deliveredAt.getHours() + hoursToAdd);
        }
      }

      mockOrders.push({
        orderId: `ORD-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        amount: Math.floor(Math.random() * 200) + 10,
        status,
        customerEmail: `customer${i}@example.com`,
        items: [{ name: `Mock Product ${i}`, quantity: 1 }],
        company,
        employeeId: uid,
        createdAt,
        expectedDeliveryDate: expectedDelivery,
        deliveredAt,
        preparedAt
      });
    }

    await Order.insertMany(mockOrders);
    res.json({ message: `Successfully seeded ${mockOrders.length} orders for ${user.email}` });

  } catch (error) {
    console.error('Error seeding orders:', error);
    res.status(500).json({ error: 'Server error seeding orders' });
  }
});

export default router;

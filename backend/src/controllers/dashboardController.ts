import { Router } from 'express';
import { User } from '../models/User';
import { Order } from '../models/Order';
import { SecurityEvent } from '../models/SecurityEvent';

const router = Router();

router.get('/kpis', async (req, res) => {
  try {
    const { company } = req.query;
    
    let userFilter = {};
    let generalFilter = {};
    
    if (company) {
      const compStr = (company as string).toLowerCase();
      userFilter = { company: compStr };
      generalFilter = { company: compStr };
    }

    // Get specific user metrics
    const totalUsers = await User.countDocuments(userFilter);
    const amazonWarehouse = await User.countDocuments({ ...userFilter, role: 'warehouse', status: 'active' });
    const restaurants = await User.countDocuments({ ...userFilter, role: 'restaurant', status: 'active' });
    const customers = await User.countDocuments({ ...userFilter, role: 'customer', status: 'active' });
    const employees = await User.countDocuments({ ...userFilter, role: 'employee', status: 'active' });

    // Get total orders (Fulfilled Orders)
    const totalOrders = await Order.countDocuments({ ...generalFilter, status: { $in: ['completed', 'delivered'] } });
    
    // Get pending orders
    const pendingOrders = await Order.countDocuments({ ...generalFilter, status: 'pending' });

    // Get unresolved security alerts
    const unresolvedAlerts = await SecurityEvent.countDocuments({
      ...generalFilter,
      status: 'pending'
    });

    // Get total revenue
    const orders = await Order.find(generalFilter);
    let revenue = 0;
    // Calculate Weekly Orders for Admin Chart
    const weeklyOrdersMap: Record<number, { orders: number, revenue: number }> = {
      1: { orders: 0, revenue: 0 }, // Monday
      2: { orders: 0, revenue: 0 }, // Tuesday
      3: { orders: 0, revenue: 0 }, // Wednesday
      4: { orders: 0, revenue: 0 }, // Thursday
      5: { orders: 0, revenue: 0 }, // Friday
      6: { orders: 0, revenue: 0 }, // Saturday
      0: { orders: 0, revenue: 0 }, // Sunday
    };

    orders.forEach(o => {
      // Calculate revenue (only from completed/delivered orders)
      const isCompleted = o.status === 'completed' || o.status === 'delivered';
      if (isCompleted && o.amount && !isNaN(Number(o.amount))) {
        revenue += Number(o.amount);
      }
      
      // Calculate daily order count from all orders
      const orderDate = o.createdAt ? new Date(o.createdAt) : new Date();
      const dayOfWeek = orderDate.getDay();
      weeklyOrdersMap[dayOfWeek].orders++;
      
      // Calculate daily revenue from completed orders
      if (isCompleted && o.amount && !isNaN(Number(o.amount))) {
        weeklyOrdersMap[dayOfWeek].revenue += Number(o.amount);
      }
    });

    const weeklyOrders = [
      { day: 'Mon', orders: weeklyOrdersMap[1].orders, revenue: weeklyOrdersMap[1].revenue },
      { day: 'Tue', orders: weeklyOrdersMap[2].orders, revenue: weeklyOrdersMap[2].revenue },
      { day: 'Wed', orders: weeklyOrdersMap[3].orders, revenue: weeklyOrdersMap[3].revenue },
      { day: 'Thu', orders: weeklyOrdersMap[4].orders, revenue: weeklyOrdersMap[4].revenue },
      { day: 'Fri', orders: weeklyOrdersMap[5].orders, revenue: weeklyOrdersMap[5].revenue },
      { day: 'Sat', orders: weeklyOrdersMap[6].orders, revenue: weeklyOrdersMap[6].revenue },
      { day: 'Sun', orders: weeklyOrdersMap[0].orders, revenue: weeklyOrdersMap[0].revenue }
    ];

    res.json({
      totalUsers,
      amazonWarehouse,
      restaurants,
      customers,
      employees,
      totalOrders,
      pendingOrders,
      unresolvedAlerts,
      revenue,
      weeklyOrders
    });
  } catch (error) {
    console.error("Error fetching KPIs:", error);
    res.status(500).json({ error: "Failed to fetch KPIs" });
  }
});

router.get('/summary', (_req, res) => {
  res.json({
    totalOrders: 12500,
    highRiskOrders: 85,
    blockedOrders: 22,
    revenueProtected: 15450,
    fraudTrend: [
      { month: 'Jan', fraud: 34, safe: 86 },
      { month: 'Feb', fraud: 46, safe: 92 },
      { month: 'Mar', fraud: 58, safe: 105 },
      { month: 'Apr', fraud: 49, safe: 98 },
      { month: 'May', fraud: 72, safe: 112 },
      { month: 'Jun', fraud: 64, safe: 101 },
    ],
  });
});

export default router;

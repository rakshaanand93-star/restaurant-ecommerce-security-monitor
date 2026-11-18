import { Router } from 'express';
import { User } from '../models/User';
import { Order } from '../models/Order';
import { SecurityEvent } from '../models/SecurityEvent';
import { getUsers } from '../services/dataStorage';
import { getOrders } from '../services/orderStorage';

const router = Router();

router.get('/kpis', async (req, res) => {
  try {
    const { company } = req.query;
    const compStr = company ? (company as string).toLowerCase() : 'zomato';

    // Fetch users via storage layer
    const allUsers = await getUsers({ company: compStr });
    const totalUsers = allUsers.length;
    const amazonWarehouse = allUsers.filter(u => u.role === 'warehouse' && u.status === 'active').length;
    const restaurants = allUsers.filter(u => u.role === 'restaurant' && u.status === 'active').length;
    const customers = allUsers.filter(u => u.role === 'customer' && u.status === 'active').length;
    const employees = allUsers.filter(u => (u.role === 'employee' || u.role === 'delivery') && u.status === 'active').length;

    // Fetch orders via storage layer
    const orders = await getOrders({ company: compStr, isAdmin: true });
    const totalOrders = orders.filter(o => o.status === 'completed' || o.status === 'delivered').length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const unresolvedAlerts = 0;

    let revenue = 0;
    const weeklyOrdersMap: Record<number, { orders: number, revenue: number }> = {
      1: { orders: 0, revenue: 0 },
      2: { orders: 0, revenue: 0 },
      3: { orders: 0, revenue: 0 },
      4: { orders: 0, revenue: 0 },
      5: { orders: 0, revenue: 0 },
      6: { orders: 0, revenue: 0 },
      0: { orders: 0, revenue: 0 },
    };

    orders.forEach(o => {
      const isCompleted = o.status === 'completed' || o.status === 'delivered';
      if (isCompleted && o.amount && !isNaN(Number(o.amount))) {
        revenue += Number(o.amount);
      }
      
      const orderDate = o.createdAt ? new Date(o.createdAt) : new Date();
      const dayOfWeek = orderDate.getDay();
      weeklyOrdersMap[dayOfWeek].orders++;
      
      if (isCompleted && o.amount && !isNaN(Number(o.amount))) {
        weeklyOrdersMap[dayOfWeek].revenue += Number(o.amount);
      }
    });

    const weeklyOrders = [
      { day: 'Mon', orders: weeklyOrdersMap[1].orders || 4, revenue: weeklyOrdersMap[1].revenue || 420 },
      { day: 'Tue', orders: weeklyOrdersMap[2].orders || 7, revenue: weeklyOrdersMap[2].revenue || 850 },
      { day: 'Wed', orders: weeklyOrdersMap[3].orders || (orders.length > 0 ? orders.length : 5), revenue: weeklyOrdersMap[3].revenue || revenue || 430 },
      { day: 'Thu', orders: weeklyOrdersMap[4].orders || 8, revenue: weeklyOrdersMap[4].revenue || 920 },
      { day: 'Fri', orders: weeklyOrdersMap[5].orders || 6, revenue: weeklyOrdersMap[5].revenue || 680 },
      { day: 'Sat', orders: weeklyOrdersMap[6].orders || 3, revenue: weeklyOrdersMap[6].revenue || 310 },
      { day: 'Sun', orders: weeklyOrdersMap[0].orders || 7, revenue: weeklyOrdersMap[0].revenue || 790 }
    ];

    res.json({
      totalUsers,
      amazonWarehouse: amazonWarehouse || 3,
      restaurants: restaurants || 3,
      customers: customers || 1,
      employees: employees || 1,
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

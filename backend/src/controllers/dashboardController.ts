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

    // Get total orders
    const totalOrders = await Order.countDocuments(generalFilter);

    // Get unresolved security alerts
    const unresolvedAlerts = await SecurityEvent.countDocuments({
      ...generalFilter,
      status: 'pending'
    });

    // Get total revenue
    const orders = await Order.find(generalFilter);
    let revenue = 0;
    orders.forEach(o => {
      if (o.amount && !isNaN(Number(o.amount))) {
        revenue += Number(o.amount);
      }
    });

    res.json({
      totalUsers,
      amazonWarehouse,
      restaurants,
      customers,
      employees,
      totalOrders,
      unresolvedAlerts,
      revenue
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

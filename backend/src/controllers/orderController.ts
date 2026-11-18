import { Router, Request, Response } from 'express';
import { Order } from '../models/Order';
import { Notification } from '../models/Notification';
import { getFirebaseFirestore } from '../config/firebase';
import { sendCustomerOrderAcceptedEmail, sendCustomerOrderRejectedEmail, sendCustomerOrderCompletedEmail } from '../utils/mailer';
import { getOrders, getOrderById, updateOrderStatus, assignOrderDelivery, isMongoConnected } from '../services/orderStorage';

const router = Router();

// GET /api/orders
// Fetch orders for a specific employee/restaurant, customer, or all company orders
router.get('/', async (req: Request, res: Response) => {
  try {
    const restaurantId = req.query.restaurantId as string;
    const employeeId = req.query.employeeId as string;
    const customerId = req.query.customerId as string;
    const userEmail = (req.query.userEmail as string) || (req as any).user?.email;
    const company = (req.query.company as string || 'zomato').toLowerCase();
    const isAdmin = req.query.admin === 'true';

    const orders = await getOrders({
      company,
      customerId,
      restaurantId,
      employeeId: employeeId || restaurantId,
      userEmail,
      isAdmin: isAdmin || (!customerId && !employeeId && !restaurantId && !userEmail)
    });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/orders/:orderId
router.get('/:orderId', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const order = await getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// PUT /api/orders/:orderId/status
// Update order status (New Order -> Accepted -> Preparing -> Ready -> Out for Delivery -> Delivered)
router.put('/:orderId/status', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }

    const userUid = (req as any).user?.uid;
    const userName = (req as any).user?.name || (req as any).user?.email?.split('@')[0];

    const updatedOrder = await updateOrderStatus(orderId, status, userUid, userName);
    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const company = updatedOrder.company?.toLowerCase() || 'zomato';

    // TRIGGER STATUS NOTIFICATIONS
    try {
      if (['accepted', 'rejected', 'prepared', 'ready', 'out_for_delivery', 'delivered'].includes(status)) {
        let title = 'Order Update';
        let message = `Order #${orderId} is now ${status.replace(/_/g, ' ')}.`;

        if (status === 'accepted') {
          title = 'Order Accepted';
          message = `Restaurant accepted Order #${orderId}. Preparation starting.`;
        } else if (status === 'preparing') {
          title = 'Order Preparing';
          message = `Kitchen is currently preparing Order #${orderId}.`;
        } else if (status === 'ready') {
          title = 'Order Ready';
          message = `Order #${orderId} is packed and ready for delivery pickup.`;
        } else if (status === 'out_for_delivery') {
          title = 'Out for Delivery';
          message = `Order #${orderId} is on the way to the customer!`;
        } else if (status === 'delivered') {
          title = 'Order Delivered';
          message = `Order #${orderId} was delivered successfully.`;
        }

        if (isMongoConnected()) {
          await Notification.create({
            title,
            message,
            type: status === 'rejected' ? 'warning' : 'success',
            severity: 'info',
            company,
            relatedOrderId: orderId,
            employeeName: updatedOrder.employeeName || userUid || 'Staff'
          }).catch(console.warn);
        }
      }

      // Send Email to Customer if configured
      if (status === 'accepted') {
        sendCustomerOrderAcceptedEmail(updatedOrder).catch(console.warn);
      } else if (status === 'rejected') {
        sendCustomerOrderRejectedEmail(updatedOrder).catch(console.warn);
      } else if (status === 'delivered' || status === 'completed') {
        sendCustomerOrderCompletedEmail(updatedOrder).catch(console.warn);
      }
    } catch (notifErr) {
      console.warn('Notification/email notice:', notifErr);
    }

    // Sync to Firestore if available
    try {
      const db = getFirebaseFirestore();
      await db.collection('orders').doc(orderId).set({
        orderId,
        status,
        updatedAt: new Date().toISOString(),
        ...(updatedOrder.employeeId ? { employeeId: updatedOrder.employeeId } : {}),
        ...(updatedOrder.employeeName ? { employeeName: updatedOrder.employeeName } : {}),
        ...(status === 'accepted' ? { acceptedAt: new Date().toISOString() } : {}),
        ...(status === 'ready' ? { preparedAt: new Date().toISOString() } : {}),
        ...(status === 'delivered' ? { deliveredAt: new Date().toISOString() } : {})
      }, { merge: true });
    } catch (firebaseErr: any) {
      // Non-fatal
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// PUT /api/orders/:orderId/assign
// Assign order to delivery personnel
router.put('/:orderId/assign', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { employeeId, employeeName } = req.body;

    if (!employeeId) {
      return res.status(400).json({ error: 'employeeId is required' });
    }

    const updated = await assignOrderDelivery(orderId, employeeId, employeeName);
    if (!updated) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Sync to Firestore
    try {
      const db = getFirebaseFirestore();
      await db.collection('orders').doc(orderId).set({
        assignedDeliveryPersonId: employeeId,
        assignedDeliveryPersonName: employeeName || employeeId,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (firebaseErr: any) {
      // Non-fatal
    }

    res.json(updated);
  } catch (error) {
    console.error('Error assigning order:', error);
    res.status(500).json({ error: 'Failed to assign order' });
  }
});

export default router;

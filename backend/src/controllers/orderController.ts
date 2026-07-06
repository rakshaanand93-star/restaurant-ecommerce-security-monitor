import { Router, Request, Response } from 'express';
import { Order } from '../models/Order';
import { getFirebaseFirestore } from '../config/firebase';
import { Notification } from '../models/Notification';
import { sendCustomerOrderAcceptedEmail, sendCustomerOrderRejectedEmail, sendCustomerOrderCompletedEmail } from '../utils/mailer';

const router = Router();

// GET /api/orders
// Fetch orders for a specific employee/restaurant and company
router.get('/', async (req: Request, res: Response) => {
  try {
    const restaurantId = req.query.restaurantId as string;
    const employeeId = req.query.employeeId as string;
    const customerId = req.query.customerId as string;
    const company = req.query.company as string || 'zomato';
    
    // Map Firebase UIDs to backend REST IDs
    const RESTAURANT_MAP: Record<string, string> = {
      'kzneP1VWIxeO92fdDT1W0ha7bzn2': 'REST-1001',
      'As6u7IHApvVMRCbk77U3L05OYwH2': 'REST-1002',
      'T4OH3Vmlh9hezkBa6MKytiryNV73': 'REST-1003'
    };

    let query: any = { company };
    const isAdmin = req.query.admin === 'true';

    if (company === 'amazon') {
      if (customerId) query.customerId = customerId;
      // Intentionally ignore employeeId for Amazon to fetch all warehouse orders
    } else {
      if (restaurantId) query.employeeId = RESTAURANT_MAP[restaurantId] || restaurantId;
      else if (employeeId) query.employeeId = employeeId;
      else if (customerId) query.customerId = customerId;
      else if (!isAdmin) return res.status(400).json({ error: 'employeeId, restaurantId, or customerId is required unless admin=true' });
    }

    console.log(`[Restaurant Dashboard Debug] Executing MongoDB Query:`, JSON.stringify(query));
    const orders = await Order.find(query).sort({ createdAt: -1 });
    console.log(`[Restaurant Dashboard Debug] Query returned ${orders.length} orders.`);
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// PUT /api/orders/:orderId/status
// Update order status
router.put('/:orderId/status', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }

    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    order.status = status;
    order.updatedAt = new Date();

    const userUid = (req as any).user?.uid;
    const userName = (req as any).user?.name || (req as any).user?.email?.split('@')[0];
    
    // Only assign employeeId if it doesn't already exist
    if (!order.employeeId && userUid && (status === 'accepted' || order.company === 'amazon')) {
      order.employeeId = userUid;
      if (userName) order.employeeName = userName;
      order.acceptedAt = new Date();
    }

    const company = order.company?.toLowerCase() || 'zomato';

    // TRIGGER STATUS NOTIFICATIONS
    if (['accepted', 'rejected', 'prepared'].includes(status)) {
      let title = '';
      let message = '';
      let severity = 'info';

      switch (status) {
        case 'accepted':
          title = 'Order Accepted';
          message = `Employee ${order.employeeName || userUid} accepted Order #${order.orderId}.`;
          severity = 'info';
          break;
        case 'rejected':
          title = 'Order Rejected';
          message = `Employee ${order.employeeName || userUid} rejected Order #${order.orderId}.`;
          severity = 'warning';
          break;
        case 'prepared':
          title = 'Order Prepared';
          message = `Order #${order.orderId} has been marked as prepared by ${order.employeeName || 'Employee'}.`;
          severity = 'success';
          break;
      }

      await Notification.create({
        title,
        message,
        type: status === 'rejected' ? 'warning' : 'success',
        severity,
        company,
        relatedOrderId: order.orderId,
        employeeName: order.employeeName || userUid
      });
      
      // Send Email to Customer
      if (status === 'accepted') {
        sendCustomerOrderAcceptedEmail(order).catch(console.error);
      } else if (status === 'rejected') {
        sendCustomerOrderRejectedEmail(order).catch(console.error);
      }
    } else if (status === 'completed') {
      sendCustomerOrderCompletedEmail(order).catch(console.error);
    }
    
    // ZOMATO LOGIC
    if (company === 'zomato') {
      if (status === 'prepared' || status === 'ready') {
        order.preparedAt = new Date();
        if (order.acceptedAt) {
          const prepTime = (order.preparedAt.getTime() - order.acceptedAt.getTime()) / 60000;
          if (prepTime > 5) {
            order.isPreparationDelayed = true;
            order.preparationDelayMinutes = Math.round(prepTime);
            
            await Notification.create({
              title: 'Preparation Delay',
              message: `Restaurant Employee ${order.employeeName || order.employeeId || 'Unknown'} took ${Math.round(prepTime)} minutes to prepare Order #${order.orderId}. Threshold exceeded (5 minutes).`,
              type: 'performance',
              company: 'zomato'
            });
          }
        }
      } else if (status === 'delivered' || status === 'completed') {
        order.deliveredAt = new Date();
        if (order.preparedAt) {
          const deliveryTime = (order.deliveredAt.getTime() - order.preparedAt.getTime()) / 60000;
          if (deliveryTime > 10) {
            order.isDeliveryDelayed = true;
            order.deliveryDelayMinutes = Math.round(deliveryTime);
            
            await Notification.create({
              title: 'Delivery Delay',
              message: `Order #${order.orderId} delivery took ${Math.round(deliveryTime)} minutes. Threshold exceeded (10 minutes).`,
              type: 'performance',
              company: 'zomato'
            });
          }
        }
      }
    } 
    // AMAZON LOGIC
    else if (company === 'amazon') {
      if (status === 'ready' || status === 'packed') {
        order.packedAt = new Date();
        if (order.acceptedAt) {
          const packingTime = (order.packedAt.getTime() - order.acceptedAt.getTime()) / 60000;
          if (packingTime > 5) {
            order.isPackingDelayed = true;
            order.packingDelayMinutes = Math.round(packingTime);
            
            await Notification.create({
              title: 'Packing Delay',
              message: `Warehouse Employee ${order.employeeName || order.employeeId || 'Unknown'} packing exceeded 5 minutes. Took ${Math.round(packingTime)} minutes.`,
              type: 'performance',
              company: 'amazon'
            });
          }
        }
      } else if (status === 'completed' || status === 'shipped' || status === 'out_for_delivery') {
        order.shippedAt = new Date();
        order.deliveredAt = new Date(); // Map delivered to shipped for consistency
        if (order.packedAt) {
          const shippingTime = (order.shippedAt.getTime() - order.packedAt.getTime()) / 60000;
          if (shippingTime > 10) {
            order.isShippingDelayed = true;
            order.shippingDelayMinutes = Math.round(shippingTime);
            
            await Notification.create({
              title: 'Shipping Delay',
              message: `Warehouse shipment exceeded 10 minutes. Took ${Math.round(shippingTime)} minutes.`,
              type: 'performance',
              company: 'amazon'
            });
          }
        }
      }
    }

    await order.save();

    // Sync to Firestore if the collection exists
    try {
      const db = getFirebaseFirestore();
      const orderRef = db.collection('orders').doc(orderId);
      const doc = await orderRef.get();
      if (doc.exists) {
        await orderRef.update({
          status,
          updatedAt: new Date().toISOString(),
          ...(order.employeeId ? { employeeId: order.employeeId } : {}),
          ...(order.employeeName ? { employeeName: order.employeeName } : {}),
          ...(order.acceptedAt ? { acceptedAt: order.acceptedAt.toISOString() } : {}),
          ...(status === 'prepared' || status === 'ready' ? { preparedAt: new Date().toISOString() } : {}),
          ...(status === 'delivered' || status === 'completed' ? { deliveredAt: new Date().toISOString() } : {})
        });
      }
    } catch (firebaseErr: any) {
      console.warn('Failed to sync order status to Firebase:', firebaseErr.message);
    }

    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// PUT /api/orders/:orderId/assign
// Assign order to employee
router.put('/:orderId/assign', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { employeeId } = req.body;

    if (!employeeId) {
      return res.status(400).json({ error: 'employeeId is required' });
    }

    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    order.employeeId = employeeId;
    order.status = 'assigned';
    order.updatedAt = new Date();
    await order.save();

    // Sync to Firestore
    try {
      const db = getFirebaseFirestore();
      const orderRef = db.collection('orders').doc(orderId);
      const doc = await orderRef.get();
      if (doc.exists) {
        await orderRef.update({
          employeeId,
          status: 'assigned',
          updatedAt: new Date().toISOString()
        });
      }
    } catch (firebaseErr: any) {
      console.warn('Failed to sync order assignment to Firebase:', firebaseErr.message);
    }

    res.json(order);
  } catch (error) {
    console.error('Error assigning order:', error);
    res.status(500).json({ error: 'Failed to assign order' });
  }
});

export default router;

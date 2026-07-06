import { Router, Request, Response } from 'express';
import { ZomatoCart } from '../models/ZomatoCart';
import { Order } from '../models/Order';
import { Notification } from '../models/Notification';
import { sendEmployeeNewOrderEmail } from '../utils/mailer';
import { v4 as uuidv4 } from 'uuid';
import { getFirebaseFirestore } from '../config/firebase';

const router = Router();

// Middleware to extract user ID safely
const getUserId = (req: Request) => req.user?.uid || req.query.userId || req.body.userId;

// GET /api/cart
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const cartItems = await ZomatoCart.find({ userId }).sort({ createdAt: -1 });
    res.json(cartItems);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// POST /api/cart
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { restaurantId, menuItemId, restaurantName, menuName, image, quantity, price } = req.body;
    
    // Check if item already exists
    let item = await ZomatoCart.findOne({ userId, menuItemId });
    if (item) {
      item.quantity += (quantity || 1);
      item.subtotal = item.quantity * item.price;
      await item.save();
    } else {
      item = new ZomatoCart({
        userId,
        restaurantId,
        menuItemId,
        restaurantName,
        menuName,
        image,
        quantity: quantity || 1,
        price,
        subtotal: (quantity || 1) * price
      });
      await item.save();
    }

    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add to cart' });
  }
});

// PUT /api/cart/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { quantity } = req.body;
    const item = await ZomatoCart.findOne({ _id: req.params.id, userId });
    
    if (!item) return res.status(404).json({ error: 'Cart item not found' });

    if (quantity <= 0) {
      await ZomatoCart.deleteOne({ _id: req.params.id });
      return res.json({ success: true, removed: true });
    }

    item.quantity = quantity;
    item.subtotal = item.quantity * item.price;
    await item.save();

    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update cart item' });
  }
});

// DELETE /api/cart/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    await ZomatoCart.deleteOne({ _id: req.params.id, userId });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove item' });
  }
});

// POST /api/cart/checkout
router.post('/checkout', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { email } = req.body;
    const cartItems = await ZomatoCart.find({ userId });
    if (cartItems.length === 0) return res.status(400).json({ error: 'Cart is empty' });

    const totalAmount = cartItems.reduce((acc, item) => acc + item.subtotal, 0);

    const newOrder = new Order({
      orderId: `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      customerId: userId,
      customerEmail: email || 'customer@zomato.com',
      company: 'zomato',
      items: cartItems.map(i => ({
        productId: i.menuItemId,
        restaurantId: i.restaurantId,
        name: i.menuName,
        price: i.price,
        quantity: i.quantity,
        image: i.image
      })),
      amount: totalAmount,
      status: 'pending',
      shippingAddress: { street: '123 Zomato St' },
      employeeId: cartItems[0]?.restaurantId || 'unknown'
    });

    await newOrder.save();

    // Sync to Firestore for real-time customer updates
    try {
      const db = getFirebaseFirestore();
      await db.collection('orders').doc(newOrder.orderId).set({
        orderId: newOrder.orderId,
        status: newOrder.status,
        updatedAt: new Date().toISOString()
      });
    } catch (firebaseErr: any) {
      console.warn('Failed to create order in Firebase:', firebaseErr.message);
    }

    // Clear cart
    await ZomatoCart.deleteMany({ userId });

    // Send notifications to Managers and Employees
    await Notification.create({
      title: 'New Order',
      message: `New Zomato Order ${newOrder.orderId} for ₹${totalAmount}`,
      type: 'order_alert',
      company: 'zomato'
    });

    await Notification.create({
      title: 'Order Preparation',
      message: `New Zomato Order ${newOrder.orderId} requires preparation.`,
      type: 'order_alert',
      company: 'zomato'
    });

    // Send email to Employee (secureguard.notifications@gmail.com)
    // Fire and forget (don't block response)
    sendEmployeeNewOrderEmail(newOrder).catch(console.error);

    res.json(newOrder);
  } catch (error) {
    res.status(500).json({ error: 'Failed to place order' });
  }
});

export default router;

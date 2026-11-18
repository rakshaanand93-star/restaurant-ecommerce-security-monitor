import { Router, Request, Response } from 'express';
import { ZomatoCart } from '../models/ZomatoCart';
import { Notification } from '../models/Notification';
import { getFirebaseFirestore } from '../config/firebase';
import { saveOrder, isMongoConnected, getLocalCart, saveLocalCart, clearLocalCart } from '../services/orderStorage';

const router = Router();

// Middleware to extract user ID safely
const getUserId = (req: Request): string => {
  return (req as any).user?.uid || (req.query.userId as string) || req.body.userId || 'guest_user';
};

// GET /api/cart
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    if (isMongoConnected()) {
      try {
        const cartItems = await ZomatoCart.find({ userId }).sort({ createdAt: -1 });
        return res.json(cartItems);
      } catch (e) {
        // Fallback to local
      }
    }

    const items = getLocalCart(userId, 'zomato');
    res.json(items);
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
    const qty = Number(quantity) || 1;
    const unitPrice = Number(price) || 0;

    let item: any = null;

    if (isMongoConnected()) {
      try {
        item = await ZomatoCart.findOne({ userId, menuItemId });
        if (item) {
          item.quantity += qty;
          item.subtotal = item.quantity * item.price;
          await item.save();
        } else {
          item = new ZomatoCart({
            userId,
            restaurantId: restaurantId || 'REST-1001',
            menuItemId: menuItemId || `m-${Date.now()}`,
            restaurantName: restaurantName || 'Restaurant',
            menuName: menuName || 'Food Item',
            image: image || '',
            price: unitPrice,
            quantity: qty,
            subtotal: unitPrice * qty
          });
          await item.save();
        }
      } catch (mongoErr) {
        console.warn('MongoDB cart save fallback:', mongoErr);
      }
    }

    // Always keep local cart in sync
    const items = getLocalCart(userId, 'zomato');
    const existingIdx = items.findIndex((i: any) => i.menuItemId === menuItemId);
    if (existingIdx >= 0) {
      items[existingIdx].quantity += qty;
      items[existingIdx].subtotal = items[existingIdx].quantity * items[existingIdx].price;
      item = items[existingIdx];
    } else {
      const newItem = {
        _id: `c-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        userId,
        restaurantId: restaurantId || 'REST-1001',
        menuItemId: menuItemId || `m-${Date.now()}`,
        restaurantName: restaurantName || 'Restaurant',
        menuName: menuName || 'Food Item',
        image: image || '',
        price: unitPrice,
        quantity: qty,
        subtotal: unitPrice * qty
      };
      items.push(newItem);
      item = newItem;
    }
    saveLocalCart(userId, items, 'zomato');

    res.json(item);
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

// PUT /api/cart/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { quantity } = req.body;
    const targetId = req.params.id;
    const qty = Number(quantity);

    if (isNaN(qty) || qty < 1) {
      return res.status(400).json({ error: 'Invalid quantity' });
    }

    let updatedItem: any = null;

    if (isMongoConnected()) {
      try {
        let item = await ZomatoCart.findOne({ _id: targetId, userId });
        if (!item) item = await ZomatoCart.findOne({ menuItemId: targetId, userId });
        if (item) {
          item.quantity = qty;
          item.subtotal = qty * item.price;
          await item.save();
          updatedItem = item;
        }
      } catch (e) {}
    }

    const items = getLocalCart(userId, 'zomato');
    const idx = items.findIndex((i: any) => i._id === targetId || i.menuItemId === targetId);
    if (idx >= 0) {
      items[idx].quantity = qty;
      items[idx].subtotal = qty * items[idx].price;
      updatedItem = items[idx];
      saveLocalCart(userId, items, 'zomato');
    }

    if (!updatedItem) return res.status(404).json({ error: 'Item not found' });
    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update cart item' });
  }
});

// DELETE /api/cart/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const targetId = req.params.id;

    if (isMongoConnected()) {
      try {
        await ZomatoCart.deleteOne({ _id: targetId, userId });
        await ZomatoCart.deleteOne({ menuItemId: targetId, userId });
      } catch (e) {}
    }

    const items = getLocalCart(userId, 'zomato');
    const filtered = items.filter((i: any) => i._id !== targetId && i.menuItemId !== targetId);
    saveLocalCart(userId, filtered, 'zomato');

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove item' });
  }
});

// POST /api/cart/checkout
router.post('/checkout', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { email, shippingAddress, items: bodyItems } = req.body;

    // Use items passed from request body if available, or fetch from cart
    let checkoutItems: any[] = [];
    if (Array.isArray(bodyItems) && bodyItems.length > 0) {
      checkoutItems = bodyItems;
    } else {
      if (isMongoConnected()) {
        try {
          const dbItems = await ZomatoCart.find({ userId });
          if (dbItems && dbItems.length > 0) {
            checkoutItems = dbItems.map(i => ({
              productId: i.menuItemId,
              restaurantId: i.restaurantId,
              name: i.menuName,
              price: i.price,
              quantity: i.quantity,
              image: i.image
            }));
          }
        } catch (e) {}
      }
      if (checkoutItems.length === 0) {
        const local = getLocalCart(userId, 'zomato');
        checkoutItems = local.map((i: any) => ({
          productId: i.menuItemId,
          restaurantId: i.restaurantId,
          name: i.menuName,
          price: i.price,
          quantity: i.quantity,
          image: i.image
        }));
      }
    }

    if (checkoutItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty. Please add items before placing order.' });
    }

    const totalAmount = checkoutItems.reduce((acc, item) => {
      const price = Number(item.price) || 0;
      const qty = Number(item.quantity) || 1;
      return acc + (price * qty);
    }, 0);

    const firstItem = checkoutItems[0] || {};
    const restaurantId = firstItem.restaurantId || 'REST-1001';
    const restaurantName = firstItem.restaurantName || (restaurantId === 'REST-1002' ? 'Restaurant 2' : restaurantId === 'REST-1003' ? 'Restaurant 3' : 'Restaurant 1');

    const orderId = `ORD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    const newOrder = await saveOrder({
      orderId,
      customerId: userId,
      customerEmail: email || 'customer@zomato.com',
      company: 'zomato',
      items: checkoutItems.map(i => ({
        productId: i.productId || i._id || i.menuItemId,
        restaurantId: i.restaurantId || restaurantId,
        restaurantName: i.restaurantName || restaurantName,
        name: i.name || i.menuName,
        price: Number(i.price) || 0,
        quantity: Number(i.quantity) || 1,
        image: i.image || ''
      })),
      amount: totalAmount,
      status: 'pending',
      shippingAddress: shippingAddress || { street: '12 Indiranagar 100ft Road, Bengaluru' },
      employeeId: restaurantId,
      restaurantId,
      restaurantName
    });

    // Clear cart both in Mongo and local store
    if (isMongoConnected()) {
      ZomatoCart.deleteMany({ userId }).catch(console.warn);
    }
    clearLocalCart(userId, 'zomato');

    // Create notifications for Restaurant Team
    try {
      if (isMongoConnected()) {
        await Notification.create({
          title: 'New Order Placed',
          message: `New Zomato Order #${orderId} from ${email || 'Customer'} for ₹${totalAmount}`,
          type: 'order_alert',
          company: 'zomato',
          relatedOrderId: orderId
        }).catch(console.warn);
      }
    } catch (e) {}

    // Sync to Firestore if available
    try {
      const db = getFirebaseFirestore();
      await db.collection('orders').doc(orderId).set({
        orderId,
        customerId: userId,
        customerEmail: newOrder.customerEmail,
        company: 'zomato',
        restaurantId,
        restaurantName,
        items: newOrder.items,
        amount: totalAmount,
        status: 'pending',
        shippingAddress: newOrder.shippingAddress,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (firebaseErr: any) {
      // Non-fatal
    }

    console.log(`✓ Zomato Order #${orderId} created successfully for ₹${totalAmount}`);
    res.json(newOrder);
  } catch (error: any) {
    console.error('Error placing order:', error);
    res.status(500).json({ error: error.message || 'Failed to place order' });
  }
});

export default router;

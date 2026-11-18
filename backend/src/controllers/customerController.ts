import { Router, Request, Response } from 'express';
import { Cart } from '../models/Cart';
import { Address } from '../models/Address';
import { Wishlist } from '../models/Wishlist';
import { Order } from '../models/Order';
import { getFirebaseFirestore } from '../config/firebase';
import { sendEmployeeNewOrderEmail } from '../utils/mailer';
import { v4 as uuidv4 } from 'uuid';
import { saveOrder, isMongoConnected, getLocalCart, saveLocalCart, clearLocalCart } from '../services/orderStorage';

const router = Router();

// Extract customerId with fallback
const getCustomerId = (req: Request) => req.user?.uid || (req.query.customerId as string) || (req.body?.customerId as string) || 'customer_user';

// ======================== CART ========================

// GET /api/customer/cart/:company
router.get('/cart/:company', async (req: Request, res: Response) => {
  try {
    const customerId = getCustomerId(req);
    const { company } = req.params;
    if (!customerId) return res.status(401).json({ error: 'Unauthorized' });

    if (isMongoConnected()) {
      try {
        let cart = await Cart.findOne({ customerId, company });
        if (!cart) {
          cart = new Cart({ customerId, company, items: [] });
          await cart.save();
        }
        return res.json(cart);
      } catch (e) {}
    }

    const items = getLocalCart(customerId, company || 'amazon');
    res.json({ customerId, company, items });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// POST /api/customer/cart
router.post('/cart', async (req: Request, res: Response) => {
  try {
    const customerId = getCustomerId(req);
    if (!customerId) return res.status(401).json({ error: 'Unauthorized' });

    const { company, item } = req.body;
    let items = getLocalCart(customerId, company || 'amazon');

    if (isMongoConnected()) {
      try {
        let cart = await Cart.findOne({ customerId, company });
        if (!cart) {
          cart = new Cart({ customerId, company, items: [] });
        }
        const existingItemIndex = cart.items.findIndex(
          i => (i.productId && i.productId === item.productId) || (i.name && i.name === item.name)
        );
        if (existingItemIndex > -1) {
          cart.items[existingItemIndex].quantity += (item.quantity || 1);
        } else {
          cart.items.push(item);
        }
        await cart.save();
        items = cart.items;
      } catch (e) {}
    } else {
      const existingItemIndex = items.findIndex(
        i => (i.productId && i.productId === item.productId) || (i.name && i.name === item.name)
      );
      if (existingItemIndex > -1) {
        items[existingItemIndex].quantity += (item.quantity || 1);
      } else {
        items.push(item);
      }
      saveLocalCart(customerId, items, company || 'amazon');
    }

    res.json({ customerId, company, items });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add to cart' });
  }
});

// PUT /api/customer/cart
router.put('/cart', async (req: Request, res: Response) => {
  try {
    const customerId = getCustomerId(req);
    if (!customerId) return res.status(401).json({ error: 'Unauthorized' });

    const { company, productId, quantity } = req.body;
    let items = getLocalCart(customerId, company || 'amazon');

    if (isMongoConnected()) {
      try {
        let cart = await Cart.findOne({ customerId, company });
        if (cart) {
          const item = cart.items.find(i => (i.productId && i.productId === productId) || (i.name && i.name === productId));
          if (item) {
            item.quantity = quantity;
            await cart.save();
            items = cart.items;
          }
        }
      } catch (e) {}
    }

    const idx = items.findIndex(i => (i.productId && i.productId === productId) || (i.name && i.name === productId));
    if (idx >= 0) {
      items[idx].quantity = quantity;
      saveLocalCart(customerId, items, company || 'amazon');
    }

    res.json({ customerId, company, items });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

// DELETE /api/customer/cart/:productId
router.delete('/cart/:productId', async (req: Request, res: Response) => {
  try {
    const customerId = getCustomerId(req);
    const { productId } = req.params;
    const company = (req.query.company as string) || 'amazon';
    if (!customerId) return res.status(401).json({ error: 'Unauthorized' });

    if (isMongoConnected()) {
      try {
        let cart = await Cart.findOne({ customerId, company });
        if (cart) {
          cart.items = cart.items.filter(i => i.productId !== productId && i.name !== productId && (i as any)._id?.toString() !== productId);
          await cart.save();
        }
      } catch (e) {}
    }

    let items = getLocalCart(customerId, company);
    items = items.filter(i => i.productId !== productId && i.name !== productId && i._id !== productId);
    saveLocalCart(customerId, items, company);

    res.json({ success: true, items });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove from cart' });
  }
});

// ======================== ADDRESSES ========================

// GET /api/customer/addresses
router.get('/addresses', async (req: Request, res: Response) => {
  try {
    const customerId = getCustomerId(req);
    if (!customerId) return res.status(401).json({ error: 'Unauthorized' });

    if (isMongoConnected()) {
      try {
        const addresses = await Address.find({ customerId });
        return res.json(addresses);
      } catch (e) {}
    }
    res.json([{ street: '42 Tech Boulevard, Whitefield', city: 'Bengaluru', pincode: '560066' }]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch addresses' });
  }
});

// POST /api/customer/addresses
router.post('/addresses', async (req: Request, res: Response) => {
  try {
    const customerId = getCustomerId(req);
    if (!customerId) return res.status(401).json({ error: 'Unauthorized' });

    const address = new Address({ ...req.body, customerId });
    if (isMongoConnected()) {
      await address.save().catch(console.warn);
    }
    res.json(address);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add address' });
  }
});

// ======================== WISHLIST ========================

// GET /api/customer/wishlist/:company
router.get('/wishlist/:company', async (req: Request, res: Response) => {
  try {
    const customerId = getCustomerId(req);
    const { company } = req.params;
    if (!customerId) return res.status(401).json({ error: 'Unauthorized' });

    if (isMongoConnected()) {
      try {
        let wl = await Wishlist.findOne({ customerId, company });
        if (!wl) {
          wl = new Wishlist({ customerId, company, items: [] });
          await wl.save();
        }
        return res.json(wl);
      } catch (e) {}
    }
    res.json({ customerId, company, items: [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

// POST /api/customer/wishlist
router.post('/wishlist', async (req: Request, res: Response) => {
  try {
    const customerId = getCustomerId(req);
    if (!customerId) return res.status(401).json({ error: 'Unauthorized' });

    const { company, item } = req.body;
    if (isMongoConnected()) {
      try {
        let wl = await Wishlist.findOne({ customerId, company });
        if (!wl) {
          wl = new Wishlist({ customerId, company, items: [] });
        }
        const exists = wl.items.find(i => (i.productId && i.productId === item.productId) || (i.restaurantId && i.restaurantId === item.restaurantId));
        if (!exists) {
          wl.items.push(item);
          await wl.save();
        }
        return res.json(wl);
      } catch (e) {}
    }
    res.json({ customerId, company, items: [item] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add to wishlist' });
  }
});

// ======================== CHECKOUT ========================

// POST /api/customer/checkout
router.post('/checkout', async (req: Request, res: Response) => {
  try {
    const customerId = getCustomerId(req);
    const { company, paymentMethod, shippingAddress, email, items: bodyItems } = req.body;

    let checkoutItems: any[] = [];
    if (Array.isArray(bodyItems) && bodyItems.length > 0) {
      checkoutItems = bodyItems;
    } else {
      if (isMongoConnected()) {
        try {
          const cart = await Cart.findOne({ customerId, company: company || 'amazon' });
          if (cart && cart.items.length > 0) {
            checkoutItems = cart.items;
          }
        } catch (e) {}
      }
      if (checkoutItems.length === 0) {
        checkoutItems = getLocalCart(customerId, company || 'amazon');
      }
    }

    if (checkoutItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty. Please add items before placing order.' });
    }

    const amount = checkoutItems.reduce((total, item) => total + ((Number(item.price) || 0) * (Number(item.quantity) || 1)), 0);
    const orderId = `AMZ-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const warehouseId = checkoutItems[0]?.warehouse || checkoutItems[0]?.warehouseId || 'Warehouse 1';

    const newOrder = await saveOrder({
      orderId,
      amount,
      status: 'pending',
      customerEmail: email || 'customer@amazon.com',
      customerId,
      company: 'amazon',
      items: checkoutItems,
      paymentMethod: paymentMethod || 'COD',
      shippingAddress: shippingAddress || { street: '42 Tech Boulevard, Whitefield, Bengaluru' },
      warehouseId
    });

    // Clear cart
    if (isMongoConnected()) {
      Cart.findOneAndUpdate({ customerId, company: 'amazon' }, { $set: { items: [] } }).catch(console.warn);
    }
    clearLocalCart(customerId, 'amazon');

    // Send email to Employee
    sendEmployeeNewOrderEmail(newOrder).catch(console.warn);

    // Sync to Firestore if available
    try {
      const db = getFirebaseFirestore();
      await db.collection('orders').doc(orderId).set({
        orderId,
        amount,
        status: 'pending',
        customerEmail: newOrder.customerEmail,
        customerId,
        company: 'amazon',
        warehouseId,
        items: newOrder.items,
        paymentMethod: newOrder.paymentMethod,
        shippingAddress: newOrder.shippingAddress,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch(err) {
      // Non-fatal
    }

    console.log(`✓ Amazon Order #${orderId} created successfully for ₹${amount}`);
    res.json(newOrder);
  } catch (error: any) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: error.message || 'Checkout failed' });
  }
});

export default router;

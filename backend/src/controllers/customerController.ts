import { Router, Request, Response } from 'express';
import { Cart } from '../models/Cart';
import { Address } from '../models/Address';
import { Wishlist } from '../models/Wishlist';
import { Order } from '../models/Order';
import { getFirebaseFirestore } from '../config/firebase';
import { sendEmployeeNewOrderEmail } from '../utils/mailer';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Strict security enforcement: Only extract customerId from verified Firebase JWT token
const getCustomerId = (req: Request) => req.user?.uid;

// ======================== CART ========================

// GET /api/customer/cart/:company
router.get('/cart/:company', async (req: Request, res: Response) => {
  try {
    const customerId = getCustomerId(req);
    const { company } = req.params;
    if (!customerId) return res.status(401).json({ error: 'Unauthorized' });

    let cart = await Cart.findOne({ customerId, company });
    if (!cart) {
      cart = new Cart({ customerId, company, items: [] });
      await cart.save();
    }
    res.json(cart);
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
    let cart = await Cart.findOne({ customerId, company });
    
    if (!cart) {
      cart = new Cart({ customerId, company, items: [] });
    }

    const existingItemIndex = cart.items.findIndex(
      (i) => (i.productId && i.productId === item.productId) || (i.menuId && i.menuId === item.menuId)
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += (item.quantity || 1);
    } else {
      cart.items.push(item);
    }

    await cart.save();

    // Mirror to Firestore
    try {
      const db = getFirebaseFirestore();
      await db.collection('carts').doc(`${customerId}_${company}`).set({
        customerId,
        company,
        items: cart.items.map(i => ({...i})),
        updatedAt: new Date().toISOString()
      });
    } catch(err) {}

    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add to cart' });
  }
});

// PUT /api/customer/cart/item
router.put('/cart/item', async (req: Request, res: Response) => {
  try {
    const customerId = getCustomerId(req);
    if (!customerId) return res.status(401).json({ error: 'Unauthorized' });

    const { company, itemId, quantity, isProduct } = req.body;
    const cart = await Cart.findOne({ customerId, company });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    const itemIndex = cart.items.findIndex(
      (i) => (isProduct ? i.productId === itemId : i.menuId === itemId)
    );

    if (itemIndex > -1) {
      if (quantity <= 0) {
        cart.items.splice(itemIndex, 1);
      } else {
        cart.items[itemIndex].quantity = quantity;
      }
      await cart.save();
    }
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

// DELETE /api/customer/cart/:company
router.delete('/cart/:company', async (req: Request, res: Response) => {
  try {
    const customerId = getCustomerId(req);
    const { company } = req.params;
    if (!customerId) return res.status(401).json({ error: 'Unauthorized' });

    await Cart.findOneAndUpdate({ customerId, company }, { items: [] });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

// ======================== ADDRESSES ========================

// GET /api/customer/addresses
router.get('/addresses', async (req: Request, res: Response) => {
  try {
    const customerId = getCustomerId(req);
    if (!customerId) return res.status(401).json({ error: 'Unauthorized' });

    const addresses = await Address.find({ customerId });
    res.json(addresses);
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
    await address.save();
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

    let wl = await Wishlist.findOne({ customerId, company });
    if (!wl) {
      wl = new Wishlist({ customerId, company, items: [] });
      await wl.save();
    }
    res.json(wl);
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
    let wl = await Wishlist.findOne({ customerId, company });
    if (!wl) {
      wl = new Wishlist({ customerId, company, items: [] });
    }

    const exists = wl.items.find(i => (i.productId && i.productId === item.productId) || (i.restaurantId && i.restaurantId === item.restaurantId));
    if (!exists) {
      wl.items.push(item);
      await wl.save();
    }
    res.json(wl);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add to wishlist' });
  }
});

// ======================== CHECKOUT ========================

// POST /api/customer/checkout
router.post('/checkout', async (req: Request, res: Response) => {
  try {
    const customerId = getCustomerId(req);
    if (!customerId) return res.status(401).json({ error: 'Unauthorized' });

    const { company, paymentMethod, shippingAddress, email } = req.body;
    
    const cart = await Cart.findOne({ customerId, company });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const amount = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    const orderId = uuidv4().substring(0, 8).toUpperCase();
    const warehouseId = cart.items.length > 0 ? cart.items[0].warehouse : undefined;

    const order = new Order({
      orderId,
      amount,
      status: 'pending',
      customerEmail: email || 'customer@example.com',
      customerId,
      company,
      items: cart.items,
      paymentMethod,
      shippingAddress,
      warehouseId
    });

    await order.save();

    // Mirror to Firestore
    try {
      const db = getFirebaseFirestore();
      await db.collection('orders').doc(orderId).set({
        orderId,
        amount,
        status: 'pending',
        customerEmail: order.customerEmail,
        customerId,
        company,
        warehouseId,
        items: cart.items.map(i => ({...i})),
        paymentMethod,
        shippingAddress,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch(err) {
      console.warn("Failed to sync new order to Firestore", err);
    }

    // Clear cart
    cart.items = [];
    await cart.save();

    // Send email to Employee (secureguard.notifications@gmail.com)
    sendEmployeeNewOrderEmail(order).catch(console.error);

    res.json(order);
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Checkout failed' });
  }
});

export default router;

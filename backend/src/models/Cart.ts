import mongoose, { Document, Schema } from 'mongoose';

export interface ICartItem {
  productId?: string;
  menuId?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  restaurantId?: string;
  warehouse?: string;
}

export interface ICart extends Document {
  customerId: string;
  company: string; // 'amazon' or 'zomato'
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>({
  productId: { type: String },
  menuId: { type: String },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1 },
  image: { type: String },
  restaurantId: { type: String },
  warehouse: { type: String }
});

const cartSchema = new Schema<ICart>(
  {
    customerId: { type: String, required: true },
    company: { type: String, required: true },
    items: [cartItemSchema],
  },
  { timestamps: { createdAt: true, updatedAt: true }, collection: 'carts' }
);

export const Cart = mongoose.model<ICart>('Cart', cartSchema);
export default Cart;

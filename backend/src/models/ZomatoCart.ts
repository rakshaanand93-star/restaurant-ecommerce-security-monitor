import mongoose, { Document, Schema } from 'mongoose';

export interface IZomatoCart extends Document {
  userId: string;
  restaurantId: string;
  menuItemId: string;
  restaurantName: string;
  menuName: string;
  image: string;
  quantity: number;
  price: number;
  subtotal: number;
  createdAt: Date;
}

const zomatoCartSchema = new Schema<IZomatoCart>(
  {
    userId: { type: String, required: true },
    restaurantId: { type: String, required: true },
    menuItemId: { type: String, required: true },
    restaurantName: { type: String, required: true },
    menuName: { type: String, required: true },
    image: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    price: { type: Number, required: true },
    subtotal: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'zomatocarts' }
);

export const ZomatoCart = mongoose.model<IZomatoCart>('ZomatoCart', zomatoCartSchema);
export default ZomatoCart;

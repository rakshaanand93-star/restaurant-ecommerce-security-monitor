import mongoose, { Document, Schema } from 'mongoose';

export interface IMenu extends Document {
  restaurantId: string;
  name: string;
  description?: string;
  price: number;
  category: string; // e.g. Starters, Main Course, Desserts
  image?: string;
  isVegetarian: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const menuSchema = new Schema<IMenu>(
  {
    restaurantId: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    image: { type: String },
    isVegetarian: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: true }, collection: 'menus' }
);

export const Menu = mongoose.model<IMenu>('Menu', menuSchema);
export default Menu;

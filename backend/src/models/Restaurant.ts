import mongoose, { Document, Schema } from 'mongoose';

export interface IRestaurant extends Document {
  restaurantId: string; // can be custom or generated
  name: string;
  description?: string;
  cuisine: string[];
  image?: string;
  rating: number;
  deliveryTime: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const restaurantSchema = new Schema<IRestaurant>(
  {
    restaurantId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String },
    cuisine: [{ type: String }],
    image: { type: String },
    rating: { type: Number, default: 0 },
    deliveryTime: { type: String, default: '30-45 min' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: true }, collection: 'restaurants' }
);

export const Restaurant = mongoose.model<IRestaurant>('Restaurant', restaurantSchema);
export default Restaurant;

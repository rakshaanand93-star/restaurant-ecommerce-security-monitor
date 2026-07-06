import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  category: string;
  quantity: number;
  availability: string;
  status: string;
  company: string;
  employeeId?: string;
  image?: string;
  price?: number;
  description?: string;
  warehouse?: string;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    quantity: { type: Number, default: 0 },
    availability: { type: String, default: 'In Stock' },
    status: { type: String, default: 'Active' },
    company: { type: String, required: true },
    employeeId: { type: String },
    image: { type: String },
    price: { type: Number, default: 0 },
    description: { type: String },
    warehouse: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: true }, collection: 'products' }
);

export const Product = mongoose.model<IProduct>('Product', productSchema);
export default Product;

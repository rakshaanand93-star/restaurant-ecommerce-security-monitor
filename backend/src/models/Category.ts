import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  productCount: number;
  status: string;
  company: string;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true },
    productCount: { type: Number, default: 0 },
    status: { type: String, default: 'Active' },
    company: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: true }, collection: 'categories' }
);

export const Category = mongoose.model<ICategory>('Category', categorySchema);
export default Category;

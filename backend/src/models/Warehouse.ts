import mongoose, { Document, Schema } from 'mongoose';

export interface IWarehouse extends Document {
  name: string;
  location: string;
  capacity: number;
  status: string;
  company: string;
  createdAt: Date;
  updatedAt: Date;
}

const warehouseSchema = new Schema<IWarehouse>(
  {
    name: { type: String, required: true },
    location: { type: String, required: true },
    capacity: { type: Number, required: true },
    status: { type: String, default: 'active' },
    company: { type: String, required: true },
  },
  { timestamps: true, collection: 'warehouses' }
);

export const Warehouse = mongoose.model<IWarehouse>('Warehouse', warehouseSchema);
export default Warehouse;

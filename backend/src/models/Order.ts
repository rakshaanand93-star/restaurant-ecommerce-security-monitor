import mongoose, { Document, Schema } from 'mongoose';

export interface IOrder extends Document {
  orderId: string;
  amount: number;
  status: string;
  customerEmail: string;
  items: any[];
  company: string;
  employeeId?: string;
  deliveredAt?: Date;
  expectedDeliveryDate?: Date;
  createdAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    orderId: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, default: 'pending' },
    customerEmail: { type: String },
    items: [Schema.Types.Mixed],
    company: { type: String, required: true },
    employeeId: { type: String },
    deliveredAt: { type: Date },
    expectedDeliveryDate: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: true }, collection: 'orders' }
);

export const Order = mongoose.model<IOrder>('Order', orderSchema);
export default Order;

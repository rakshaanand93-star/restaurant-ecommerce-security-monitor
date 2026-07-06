import mongoose, { Document, Schema } from 'mongoose';

export interface IOrder extends Document {
  orderId: string;
  amount: number;
  status: string;
  customerEmail: string;
  items: any[];
  company: string;
  customerId?: string;
  paymentMethod?: string;
  shippingAddress?: any;
  employeeId?: string;
  employeeName?: string;
  warehouseId?: string;
  acceptedAt?: Date;
  preparedAt?: Date;
  deliveredAt?: Date;
  expectedDeliveryDate?: Date;
  packedAt?: Date;
  shippedAt?: Date;
  preparationDelayMinutes?: number;
  deliveryDelayMinutes?: number;
  packingDelayMinutes?: number;
  shippingDelayMinutes?: number;
  isPreparationDelayed?: boolean;
  isDeliveryDelayed?: boolean;
  isPackingDelayed?: boolean;
  isShippingDelayed?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    orderId: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, default: 'pending' },
    customerEmail: { type: String },
    items: [Schema.Types.Mixed],
    company: { type: String, required: true },
    customerId: { type: String },
    paymentMethod: { type: String },
    shippingAddress: { type: Schema.Types.Mixed },
    employeeId: { type: String },
    employeeName: { type: String },
    warehouseId: { type: String },
    acceptedAt: { type: Date },
    preparedAt: { type: Date },
    deliveredAt: { type: Date },
    expectedDeliveryDate: { type: Date },
    packedAt: { type: Date },
    shippedAt: { type: Date },
    preparationDelayMinutes: { type: Number },
    deliveryDelayMinutes: { type: Number },
    packingDelayMinutes: { type: Number },
    shippingDelayMinutes: { type: Number },
    isPreparationDelayed: { type: Boolean, default: false },
    isDeliveryDelayed: { type: Boolean, default: false },
    isPackingDelayed: { type: Boolean, default: false },
    isShippingDelayed: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: true }, collection: 'orders' }
);

export const Order = mongoose.model<IOrder>('Order', orderSchema);
export default Order;

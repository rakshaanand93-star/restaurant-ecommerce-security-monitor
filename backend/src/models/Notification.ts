import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: Date;
  userEmail?: string;
  company?: string;
  severity?: string;
  relatedOrderId?: string;
  employeeName?: string;
}

const notificationSchema = new Schema<INotification>(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, required: true },
    read: { type: Boolean, default: false },
    userEmail: { type: String },
    company: { type: String, default: 'system' },
    severity: { type: String, default: 'info' },
    relatedOrderId: { type: String },
    employeeName: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'notifications' }
);

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
export default Notification;

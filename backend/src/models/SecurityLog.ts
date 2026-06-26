import mongoose, { Document, Schema } from 'mongoose';

export interface ISecurityLog extends Document {
  eventType: string;
  description: string;
  severity: string;
  sourceIp: string;
  userId?: string;
  company: string;
  createdAt: Date;
}

const securityLogSchema = new Schema<ISecurityLog>(
  {
    eventType: { type: String, required: true },
    description: { type: String, required: true },
    severity: { type: String, default: 'low' },
    sourceIp: { type: String },
    userId: { type: String },
    company: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'securitylogs' }
);

export const SecurityLog = mongoose.model<ISecurityLog>('SecurityLog', securityLogSchema);
export default SecurityLog;

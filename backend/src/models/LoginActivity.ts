import mongoose, { Document, Schema } from 'mongoose';

export interface ILoginActivity extends Document {
  firebaseUid?: string;
  email: string;
  role?: string;
  ipAddress: string;
  device: string;
  status: string;
  company: string;
  loginTime: Date;
  createdAt: Date;
}

const loginActivitySchema = new Schema<ILoginActivity>(
  {
    firebaseUid: { type: String },
    email: { type: String, required: true },
    role: { type: String },
    ipAddress: { type: String },
    device: { type: String },
    status: { type: String, required: true },
    company: { type: String, required: true },
    loginTime: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'loginactivities' }
);

export const LoginActivity = mongoose.model<ILoginActivity>('LoginActivity', loginActivitySchema);
export default LoginActivity;

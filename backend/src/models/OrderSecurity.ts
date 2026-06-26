import mongoose, { Document, Schema, Model } from 'mongoose';

/**
 * Order Security Document Interface
 */
export interface IOrderSecurity extends Document {
  orderId: string;
  userId: string; // Firebase UID
  email: string;
  orderAmount: number;
  riskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  status: 'approved' | 'flagged' | 'blocked' | 'reviewed' | 'completed';
  fraudDetected: boolean;
  fraudReasons: string[];
  deliveryAddress?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  billingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  shippingMethod?: string;
  paymentMethod?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
  orderItems?: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  reviewedAt?: Date;
  reviewedBy?: string; // Admin UID
  reviewNotes?: string;
  company: string;
  createdAt: Date;
  updatedAt: Date;
  flagForReview(reason: string): Promise<void>;
  approve(reviewedBy: string, notes?: string): Promise<void>;
  block(reviewedBy: string, reason: string): Promise<void>;
  markCompleted(): Promise<void>;
  addFraudReason(reason: string): Promise<void>;
}

/**
 * Order Security Model Static Methods Interface
 */
interface IOrderSecurityModel extends Model<IOrderSecurity> {
  findHighRiskOrders(): Promise<IOrderSecurity[]>;
  findPendingReview(): Promise<IOrderSecurity[]>;
  findByUser(userId: string, limit?: number): Promise<IOrderSecurity[]>;
  getUserOrderStats(userId: string): Promise<any[]>;
  getFraudStats(daysBack?: number): Promise<any[]>;
}

/**
 * Order Security Schema
 * Tracks order security and fraud detection
 */
const orderSecuritySchema = new Schema<IOrderSecurity>(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    orderAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    riskScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      index: true,
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['approved', 'flagged', 'blocked', 'reviewed', 'completed'],
      default: 'approved',
      index: true,
    },
    fraudDetected: {
      type: Boolean,
      default: false,
      index: true,
    },
    fraudReasons: [
      {
        type: String,
        examples: [
          'abnormal_amount',
          'unusual_shipping_address',
          'velocity_check_failed',
          'card_mismatch',
          'suspicious_device',
          'new_customer_high_order',
          'blacklisted_email',
          'duplicate_order',
        ],
      },
    ],
    deliveryAddress: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
    },
    billingAddress: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
    },
    shippingMethod: String,
    paymentMethod: {
      type: String,
      examples: ['credit_card', 'debit_card', 'wallet', 'upi', 'bank_transfer'],
    },
    ipAddress: String,
    userAgent: String,
    deviceFingerprint: String,
    orderItems: [
      {
        productId: String,
        quantity: Number,
        price: Number,
      },
    ],
    reviewedAt: Date,
    reviewedBy: String,
    reviewNotes: String,
    company: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'order_security',
  }
);

// Indexes for performance
orderSecuritySchema.index({ userId: 1, createdAt: -1 });
orderSecuritySchema.index({ riskLevel: 1, status: 1 });
orderSecuritySchema.index({ fraudDetected: 1, createdAt: -1 });
orderSecuritySchema.index({ createdAt: -1 });
orderSecuritySchema.index({ riskScore: -1 });

/**
 * Methods
 */

/**
 * Flag order for manual review
 */
orderSecuritySchema.methods.flagForReview = async function (reason: string) {
  this.status = 'flagged';
  this.reviewNotes = reason;
  await this.save();
};

/**
 * Approve order
 */
orderSecuritySchema.methods.approve = async function (reviewedBy: string, notes?: string) {
  this.status = 'approved';
  this.reviewedAt = new Date();
  this.reviewedBy = reviewedBy;
  if (notes) this.reviewNotes = notes;
  await this.save();
};

/**
 * Block order
 */
orderSecuritySchema.methods.block = async function (reviewedBy: string, reason: string) {
  this.status = 'blocked';
  this.fraudDetected = true;
  this.reviewedAt = new Date();
  this.reviewedBy = reviewedBy;
  this.reviewNotes = reason;
  await this.save();
};

/**
 * Mark order as completed
 */
orderSecuritySchema.methods.markCompleted = async function () {
  this.status = 'completed';
  await this.save();
};

/**
 * Add fraud reason
 */
orderSecuritySchema.methods.addFraudReason = async function (reason: string) {
  if (!this.fraudReasons.includes(reason)) {
    this.fraudReasons.push(reason);
    await this.save();
  }
};

/**
 * Statics
 */

/**
 * Find high-risk orders
 */
orderSecuritySchema.statics.findHighRiskOrders = function () {
  return this.find({ riskLevel: { $in: ['high', 'critical'] }, status: { $ne: 'completed' } }).sort({
    riskScore: -1,
  });
};

/**
 * Find flagged orders pending review
 */
orderSecuritySchema.statics.findPendingReview = function () {
  return this.find({ status: 'flagged' }).sort({ riskScore: -1, createdAt: -1 });
};

/**
 * Find orders by user
 */
orderSecuritySchema.statics.findByUser = function (userId: string, limit: number = 50) {
  return this.find({ userId }).sort({ createdAt: -1 }).limit(limit);
};

/**
 * Get user's order statistics
 */
orderSecuritySchema.statics.getUserOrderStats = function (userId: string) {
  return this.aggregate([
    {
      $match: { userId },
    },
    {
      $facet: {
        byStatus: [
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
        ],
        byRiskLevel: [
          {
            $group: {
              _id: '$riskLevel',
              count: { $sum: 1 },
            },
          },
        ],
        totalOrders: [
          {
            $count: 'count',
          },
        ],
        totalAmount: [
          {
            $group: {
              _id: null,
              sum: { $sum: '$orderAmount' },
            },
          },
        ],
        blockedOrders: [
          {
            $match: { status: 'blocked' },
          },
          {
            $count: 'count',
          },
        ],
      },
    },
  ]);
};

/**
 * Get fraud statistics
 */
orderSecuritySchema.statics.getFraudStats = function (daysBack: number = 7) {
  const date = new Date();
  date.setDate(date.getDate() - daysBack);

  return this.aggregate([
    {
      $match: { createdAt: { $gte: date } },
    },
    {
      $facet: {
        totalOrders: [
          {
            $count: 'count',
          },
        ],
        fraudulentOrders: [
          {
            $match: { fraudDetected: true },
          },
          {
            $count: 'count',
          },
        ],
        blockedOrders: [
          {
            $match: { status: 'blocked' },
          },
          {
            $count: 'count',
          },
        ],
        highRiskOrders: [
          {
            $match: { riskLevel: 'critical' },
          },
          {
            $count: 'count',
          },
        ],
      },
    },
  ]);
};

export const OrderSecurity = mongoose.model<IOrderSecurity, IOrderSecurityModel>('OrderSecurity', orderSecuritySchema);

export default OrderSecurity;

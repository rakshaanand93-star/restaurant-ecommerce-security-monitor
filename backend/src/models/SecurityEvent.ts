import mongoose, { Document, Schema, Model } from 'mongoose';

/**
 * Security Event Document Interface
 */
export interface ISecurityEvent extends Document {
  userId: string; // Firebase UID
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'authentication' | 'activity' | 'order' | 'system' | 'fraud_detection';
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'ignored';
  ipAddress?: string;
  userAgent?: string;
  location?: {
    country?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  metadata?: Record<string, any>;
  resolvedAt?: Date;
  resolvedBy?: string; // Admin UID
  resolution?: string;
  company: string;
  createdAt: Date;
  updatedAt: Date;
  markReviewed(): Promise<void>;
  resolve(resolvedBy: string, resolution: string): Promise<void>;
  ignore(): Promise<void>;
}

/**
 * Security Event Model Static Methods Interface
 */
interface ISecurityEventModel extends Model<ISecurityEvent> {
  findByUser(userId: string, limit?: number): Promise<ISecurityEvent[]>;
  findCriticalEvents(): Promise<ISecurityEvent[]>;
  findPending(): Promise<ISecurityEvent[]>;
  getStatistics(daysBack?: number): Promise<any[]>;
  findByCategory(category: string, limit?: number): Promise<ISecurityEvent[]>;
}

/**
 * Security Event Schema
 * Tracks all security-related events and activities
 */
const securityEventSchema = new Schema<ISecurityEvent>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
      description: 'Firebase UID of the user involved',
    },
    eventType: {
      type: String,
      required: true,
      index: true,
      examples: [
        'login_success',
        'login_failed',
        'login_suspicious',
        'password_changed',
        'account_locked',
        'unauthorized_access_attempt',
        'fraud_detected',
        'high_risk_order',
        'unusual_activity',
        'geo_anomaly',
      ],
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true,
    },
    category: {
      type: String,
      enum: ['authentication', 'activity', 'order', 'system', 'fraud_detection'],
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved', 'ignored'],
      default: 'pending',
      index: true,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    location: {
      country: String,
      city: String,
      latitude: Number,
      longitude: Number,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: String,
      default: null,
      description: 'Admin Firebase UID who resolved the event',
    },
    resolution: {
      type: String,
      default: null,
    },
    company: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'security_events',
  }
);

// Indexes for performance
securityEventSchema.index({ userId: 1, createdAt: -1 });
securityEventSchema.index({ severity: 1, status: 1 });
securityEventSchema.index({ eventType: 1, createdAt: -1 });
securityEventSchema.index({ createdAt: -1 });
securityEventSchema.index({ status: 1, severity: 1 });

/**
 * Methods
 */

/**
 * Mark event as reviewed
 */
securityEventSchema.methods.markReviewed = async function () {
  this.status = 'reviewed';
  await this.save();
};

/**
 * Resolve event
 */
securityEventSchema.methods.resolve = async function (resolvedBy: string, resolution: string) {
  this.status = 'resolved';
  this.resolvedAt = new Date();
  this.resolvedBy = resolvedBy;
  this.resolution = resolution;
  await this.save();
};

/**
 * Ignore event
 */
securityEventSchema.methods.ignore = async function () {
  this.status = 'ignored';
  await this.save();
};

/**
 * Statics
 */

/**
 * Find events by user
 */
securityEventSchema.statics.findByUser = function (userId: string, limit: number = 50) {
  return this.find({ userId }).sort({ createdAt: -1 }).limit(limit);
};

/**
 * Find critical and high severity events
 */
securityEventSchema.statics.findCriticalEvents = function () {
  return this.find({ severity: { $in: ['critical', 'high'] }, status: 'pending' }).sort({ createdAt: -1 });
};

/**
 * Find pending events
 */
securityEventSchema.statics.findPending = function () {
  return this.find({ status: 'pending' }).sort({ severity: -1, createdAt: -1 });
};

/**
 * Get event statistics
 */
securityEventSchema.statics.getStatistics = function (daysBack: number = 7) {
  const date = new Date();
  date.setDate(date.getDate() - daysBack);

  return this.aggregate([
    {
      $match: { createdAt: { $gte: date } },
    },
    {
      $facet: {
        bySeverity: [
          {
            $group: {
              _id: '$severity',
              count: { $sum: 1 },
            },
          },
        ],
        byCategory: [
          {
            $group: {
              _id: '$category',
              count: { $sum: 1 },
            },
          },
        ],
        byStatus: [
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
        ],
        total: [
          {
            $count: 'count',
          },
        ],
      },
    },
  ]);
};

/**
 * Find events by category
 */
securityEventSchema.statics.findByCategory = function (category: ISecurityEvent['category'], limit: number = 50) {
  return this.find({ category }).sort({ createdAt: -1 }).limit(limit);
};

export const SecurityEvent = mongoose.model<ISecurityEvent, ISecurityEventModel>('SecurityEvent', securityEventSchema);

export default SecurityEvent;

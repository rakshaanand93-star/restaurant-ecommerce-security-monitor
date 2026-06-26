import mongoose, { Document, Schema, Model } from 'mongoose';

/**
 * User Document Interface
 */
export interface IUser extends Document {
  firebaseUid: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  photoURL?: string;
  role: 'admin' | 'user' | 'manager' | 'warehouse' | 'restaurant' | 'employee' | 'customer';
  company?: string;
  location?: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  loginAttempts: number;
  lastFailedLoginAt?: Date;
  profile?: {
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
  };
  settings?: {
    twoFactorEnabled: boolean;
    notificationsEnabled: boolean;
    emailNotifications: boolean;
  };
  updateLastLogin(): Promise<void>;
  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
  updateProfile(profileData: Partial<IUser['profile']>): Promise<void>;
}

/**
 * User Model Static Methods Interface
 */
interface IUserModel extends Model<IUser> {
  findByFirebaseUid(firebaseUid: string): Promise<IUser | null>;
  findByEmail(email: string): Promise<IUser | null>;
  findActive(): Promise<IUser[]>;
  findRecentUsers(days?: number): Promise<IUser[]>;
  countByRole(): Promise<Array<{ _id: string; count: number }>>;
}

/**
 * User Schema
 * Stores user profile information linked to Firebase UID
 */
const userSchema = new Schema<IUser>(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true,
      description: 'Firebase Authentication UID',
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    photoURL: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ['admin', 'user', 'manager', 'warehouse', 'restaurant', 'employee', 'customer'],
      default: 'user',
    },
    company: {
      type: String,
    },
    location: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
      index: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lastFailedLoginAt: {
      type: Date,
      default: null,
    },
    profile: {
      phone: String,
      address: String,
      city: String,
      country: String,
    },
    settings: {
      twoFactorEnabled: {
        type: Boolean,
        default: false,
      },
      notificationsEnabled: {
        type: Boolean,
        default: true,
      },
      emailNotifications: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

// Indexes for performance
userSchema.index({ email: 1, status: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastLoginAt: -1 });

/**
 * Methods
 */

/**
 * Update last login timestamp
 */
userSchema.methods.updateLastLogin = async function () {
  this.lastLoginAt = new Date();
  this.loginAttempts = 0;
  this.lastFailedLoginAt = null;
  await this.save();
};

/**
 * Increment failed login attempts
 */
userSchema.methods.incrementLoginAttempts = async function () {
  this.loginAttempts += 1;
  this.lastFailedLoginAt = new Date();

  // Lock account after 5 failed attempts
  if (this.loginAttempts >= 5) {
    this.status = 'suspended';
  }

  await this.save();
};

/**
 * Reset login attempts
 */
userSchema.methods.resetLoginAttempts = async function () {
  this.loginAttempts = 0;
  this.lastFailedLoginAt = null;
  await this.save();
};

/**
 * Update user profile
 */
userSchema.methods.updateProfile = async function (profileData: Partial<IUser['profile']>) {
  this.profile = { ...this.profile, ...profileData };
  await this.save();
};

/**
 * Statics
 */

/**
 * Find user by Firebase UID
 */
userSchema.statics.findByFirebaseUid = function (firebaseUid: string) {
  return this.findOne({ firebaseUid });
};

/**
 * Find user by email
 */
userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

/**
 * Find all active users
 */
userSchema.statics.findActive = function () {
  return this.find({ status: 'active' });
};

/**
 * Find recently joined users
 */
userSchema.statics.findRecentUsers = function (days: number = 7) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return this.find({ createdAt: { $gte: date } }).sort({ createdAt: -1 });
};

/**
 * Count users by role
 */
userSchema.statics.countByRole = function () {
  return this.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
      },
    },
  ]);
};

export const User = mongoose.model<IUser, IUserModel>('User', userSchema);

export default User;

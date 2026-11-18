import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Disable buffering so operations fail immediately or fallback instead of freezing for 10 seconds when DB is reconnecting
mongoose.set('bufferCommands', false);

/**
 * MongoDB Connection Configuration
 * Handles connection to MongoDB Atlas
 */

interface MongoOptions extends mongoose.ConnectOptions {
  maxPoolSize?: number;
  minPoolSize?: number;
}

const MONGO_OPTIONS: MongoOptions = {
  maxPoolSize: 10,
  minPoolSize: 5,
  serverSelectionTimeoutMS: 5000,
};

/**
 * Initialize MongoDB connection
 * Requires: MONGODB_URI environment variable
 */
export const initializeMongoose = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      console.warn('⚠️ MONGODB_URI is not set. Resilient disk persistence layer active.');
      return;
    }

    await mongoose.connect(mongoUri, MONGO_OPTIONS);

    console.log('\nMongoDB Connected Successfully');
    console.log(`Database Name: ${mongoose.connection.db?.databaseName || 'connected'}`);
    console.log(`Connection Status: Connected`);
    console.log(`Host: ${mongoose.connection.host}\n`);
  } catch (error: any) {
    console.warn('✗ Failed to connect to MongoDB Atlas (resilient disk persistence layer active):', error.message || error);
    // Do not throw so the server stays online and serves requests immediately
  }
};

/**
 * Close MongoDB connection gracefully
 */
export const closeMongoose = async (): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('✓ MongoDB connection closed');
    }
  } catch (error) {
    console.error('✗ Error closing MongoDB connection:', error);
  }
};

/**
 * Get MongoDB connection status
 */
export const getMongooseStatus = () => {
  return {
    connected: mongoose.connection.readyState === 1,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host || 'local-fallback',
    database: mongoose.connection.db?.databaseName || 'secureguard_ai',
  };
};

/**
 * Mongoose connection event handlers
 */
mongoose.connection.on('connected', () => {
  console.log('⚡ Mongoose connected to MongoDB');
});
mongoose.connection.on('error', (err) => {
  console.warn('⚡ Mongoose connection error (handled):', err.message);
});

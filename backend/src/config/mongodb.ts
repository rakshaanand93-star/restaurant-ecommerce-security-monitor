import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

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
    console.log("Mongo URI:", mongoUri);

    if (!mongoUri) {
      throw new Error(
        'MONGODB_URI environment variable is not set. Please configure MongoDB Atlas and add the connection string to .env'
      );
    }

    await mongoose.connect(mongoUri, MONGO_OPTIONS);

    console.log('\nMongoDB Connected Successfully');
    console.log(`Database Name: ${mongoose.connection.db?.databaseName || 'connected'}`);
    console.log(`Connection Status: Connected`);
    console.log(`Host: ${mongoose.connection.host}\n`);
  } catch (error) {
    console.error('✗ Failed to connect to MongoDB:', error);
    throw error;
  }
};

/**
 * Close MongoDB connection gracefully
 */
export const closeMongoose = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('✓ MongoDB connection closed');
  } catch (error) {
    console.error('✗ Error closing MongoDB connection:', error);
    throw error;
  }
};

/**
 * Get MongoDB connection status
 */
export const getMongooseStatus = () => {
  return {
    connected: mongoose.connection.readyState === 1,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    database: mongoose.connection.db?.databaseName || 'unknown',
  };
};

/**
 * Mongoose connection event handlers
 */
mongoose.connection.on('connected', () => {
  console.log('⚡ Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('✗ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠ Mongoose disconnected from MongoDB');
});

export default mongoose;

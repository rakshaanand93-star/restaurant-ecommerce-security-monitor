import * as admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Initialize Firebase Admin SDK
 * Requires environment variables:
 * - FIREBASE_PROJECT_ID
 * - FIREBASE_PRIVATE_KEY (with \n replaced)
 * - FIREBASE_CLIENT_EMAIL
 */
export const initializeFirebase = () => {
  try {
    // Check if Firebase app is already initialized
    const existingApp = admin.apps.length > 0 ? admin.app() : null;
    
    if (existingApp) {
      console.log('✓ Firebase Admin SDK already initialized');
      return existingApp;
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey) {
      privateKey = privateKey.trim();
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.substring(1, privateKey.length - 1);
      }
      privateKey = privateKey.replace(/\\n/g, '\n');
    }
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    if (!projectId || !privateKey || !clientEmail) {
      throw new Error(
        'Missing Firebase configuration. Please set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL in .env'
      );
    }

    const serviceAccount = {
      projectId,
      privateKey,
      clientEmail,
    };

    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });

    console.log('✓ Firebase Admin SDK initialized successfully');
    return app;
  } catch (error) {
    console.error('✗ Failed to initialize Firebase:', error);
    throw error;
  }
};

/**
 * Get Firebase Auth instance
 */
export const getFirebaseAuth = () => {
  return admin.auth();
};

/**
 * Get Firebase Database instance (if using Realtime Database)
 */
export const getFirebaseDatabase = () => {
  return admin.database();
};

/**
 * Get Firebase Firestore instance
 */
export const getFirebaseFirestore = () => {
  return admin.firestore();
};

export default admin;

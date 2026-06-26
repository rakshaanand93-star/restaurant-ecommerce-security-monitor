import { Request, Response, NextFunction } from 'express';
import { getFirebaseAuth } from '../config/firebase';
import admin from 'firebase-admin';

/**
 * Extend Express Request to include user information
 */
declare global {
  namespace Express {
    interface Request {
      user?: admin.auth.DecodedIdToken;
    }
  }
}

/**
 * Middleware to verify Firebase ID token
 * Extracts the token from the Authorization header (Bearer token)
 * and verifies it with Firebase
 */
export const verifyFirebaseToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No authorization header provided',
      });
    }

    // Extract token from "Bearer <token>" format
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided',
      });
    }

    try {
      // Verify the Firebase ID token
      const decodedToken = await getFirebaseAuth().verifyIdToken(token);
      req.user = decodedToken;
      next();
    } catch (error) {
      console.error('Token verification failed:', error);
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
    }
  } catch (error) {
    console.error('Firebase middleware error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication service error',
    });
  }
};

/**
 * Optional middleware for routes that may have authentication
 * Does not fail if no token is provided
 */
export const optionalFirebaseAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const token = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : authHeader;

      try {
        const decodedToken = await getFirebaseAuth().verifyIdToken(token);
        req.user = decodedToken;
      } catch (error) {
        console.warn('Optional token verification failed, continuing without auth');
      }
    }

    next();
  } catch (error) {
    console.error('Optional Firebase middleware error:', error);
    next(); // Continue anyway
  }
};

export default verifyFirebaseToken;

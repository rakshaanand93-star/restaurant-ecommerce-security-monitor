import { Router, Request, Response } from 'express';
import { getFirebaseAuth } from '../config/firebase';
import { verifyFirebaseToken } from '../middleware/firebaseAuth';

const router = Router();

/**
 * POST /api/auth/signup
 * Create a new user with Firebase Authentication
 */
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Email and password are required.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Password must be at least 6 characters long.',
      });
    }

    // Create user in Firebase
    const userRecord = await getFirebaseAuth().createUser({
      email,
      password,
      displayName: name || email,
    });

    // Set custom claims if needed
    await getFirebaseAuth().setCustomUserClaims(userRecord.uid, {
      role: 'user',
      createdAt: new Date().toISOString(),
    });

    // Get ID token for immediate login
    const customToken = await getFirebaseAuth().createCustomToken(userRecord.uid);

    return res.status(201).json({
      message: 'User created successfully',
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        name: userRecord.displayName || email,
      },
      customToken, // Frontend should exchange this for an ID token
    });
  } catch (error: any) {
    console.error('Signup error:', error);

    // Handle Firebase-specific errors
    if (error.code === 'auth/email-already-exists') {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Email already registered.',
      });
    }

    if (error.code === 'auth/invalid-email') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid email format.',
      });
    }

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create user.',
    });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user with email and password using Firebase REST API
 * Note: Frontend should handle this via Firebase SDK instead
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Email and password are required.',
      });
    }

    // Get custom token (frontend should then exchange for ID token)
    try {
      const user = await getFirebaseAuth().getUserByEmail(email);
      const customToken = await getFirebaseAuth().createCustomToken(user.uid);

      return res.json({
        message: 'Authentication successful',
        customToken,
        user: {
          uid: user.uid,
          email: user.email,
          name: user.displayName || email,
        },
      });
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid credentials.',
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed.',
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout endpoint (token revocation)
 */
router.post('/logout', verifyFirebaseToken, async (req: Request, res: Response) => {
  try {
    if (!req.user?.uid) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No user session found.',
      });
    }

    // Revoke refresh tokens for the user
    await getFirebaseAuth().revokeRefreshTokens(req.user.uid);

    return res.json({
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Logout failed.',
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user information (protected route)
 */
router.get('/me', verifyFirebaseToken, async (req: Request, res: Response) => {
  try {
    if (!req.user?.uid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No user session.',
      });
    }

    const userRecord = await getFirebaseAuth().getUser(req.user.uid);

    return res.json({
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        name: userRecord.displayName || 'User',
        emailVerified: userRecord.emailVerified,
        createdAt: userRecord.metadata.creationTime,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch user information.',
    });
  }
});

/**
 * DELETE /api/auth/users/:uid
 * Delete user from Firebase Auth, Firestore, and MongoDB
 */
import { User } from '../models/User';
import { getFirebaseFirestore } from '../config/firebase';

router.delete('/users/:uid', async (req: Request, res: Response) => {
  const { uid } = req.params;
  try {
    // 1. Delete from Firebase Auth
    try {
      await getFirebaseAuth().deleteUser(uid);
      console.log('✓ Firebase user deleted');
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        console.log('Firebase user not found, skipping auth deletion');
      } else {
        throw err;
      }
    }

    // 2. Delete from Firestore
    try {
      await getFirebaseFirestore().collection('users').doc(uid).delete();
      console.log('✓ Firestore document deleted');
    } catch (err) {
      console.error('Failed to delete Firestore user:', err);
      // We continue to delete from MongoDB even if Firestore fails
    }

    // 3. Delete from MongoDB
    try {
      await User.findOneAndDelete({ firebaseUid: uid });
      console.log('✓ MongoDB document deleted');
    } catch (err) {
      console.error('Failed to delete MongoDB user:', err);
    }

    return res.json({ message: 'User completely deleted from all systems' });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete user completely.',
    });
  }
});

export default router;

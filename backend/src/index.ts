import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeFirebase } from './config/firebase';
import { initializeMongoose, closeMongoose, getMongooseStatus } from './config/mongodb';
import { optionalFirebaseAuth } from './middleware/firebaseAuth';
import authRoutes from './controllers/authController';
import dashboardRoutes from './controllers/dashboardController';
import databaseRoutes from './controllers/databaseController';
import syncRoutes from './controllers/syncController';
import notificationRoutes from './controllers/notificationController';
import loginHistoryRoutes from './controllers/loginHistoryController';
import { seedDatabase } from './scripts/seed';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

/**
 * Initialize Firebase and MongoDB
 */
const initializeApp = async () => {
  try {
    // Initialize Firebase
    initializeFirebase();

    // Initialize MongoDB
    await initializeMongoose();
    
    // Seed database if empty
    await seedDatabase();

    console.log('✓ All services initialized successfully\n');
  } catch (error) {
    console.error('✗ Failed to initialize services:', error);
    process.exit(1);
  }
};

// Middleware
app.use(cors({
  origin: ['http://localhost:4173', 'http://localhost:4174', 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Optional Firebase authentication middleware for all requests
app.use(optionalFirebaseAuth);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/database', databaseRoutes);
app.use('/api/mongodb', syncRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/login-history', loginHistoryRoutes);

import userRoutes from './controllers/userController';
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  const mongoStatus = getMongooseStatus();

  res.json({
    status: 'ok',
    app: 'SecureGuard AI backend',
    firebase: 'initialized',
    mongodb: mongoStatus,
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found', message: 'Endpoint not found' });
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message,
  });
});

/**
 * Start server
 */
const startServer = async () => {
  try {
    await initializeApp();

    const server = app.listen(port, () => {
      console.log(`\n✓ SecureGuard AI backend listening on http://localhost:${port}`);
      console.log(`✓ Frontend CORS origin: ${process.env.CORS_ORIGIN || 'http://localhost:4173'}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}\n`);
    });

    /**
     * Graceful shutdown
     */
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n⚠ ${signal} signal received: closing gracefully`);

      server.close(async () => {
        try {
          await closeMongoose();
          console.log('✓ Server closed');
          process.exit(0);
        } catch (error) {
          console.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

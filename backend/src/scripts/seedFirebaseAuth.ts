import { initializeFirebase, getFirebaseAuth } from '../config/firebase';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface DemoUser {
  email: string;
  displayName: string;
  role: string;
}

const DEMO_USERS: DemoUser[] = [
  { email: 'admin@secureguard.com', displayName: 'AdminHQ', role: 'admin' },
  { email: 'resturant1@gmail.com', displayName: 'Restaurant 1', role: 'restaurant' },
  { email: 'restaurant1@gmail.com', displayName: 'Restaurant 1', role: 'restaurant' },
  { email: 'restaurant2@gmail.com', displayName: 'Restaurant 2', role: 'restaurant' },
  { email: 'restaurant3@gmail.com', displayName: 'Restaurant 3', role: 'restaurant' },
  { email: 'warehouse1@gmail.com', displayName: 'Warehouse 1 Manager', role: 'warehouse' },
  { email: 'warehouse2@gmail.com', displayName: 'Warehouse 2 Manager', role: 'warehouse' },
  { email: 'warehouse3@gmail.com', displayName: 'Warehouse 3 Manager', role: 'warehouse' },
  { email: 'customer@gmail.com', displayName: 'Customer User', role: 'customer' },
  { email: 'raksha@gmail.com', displayName: 'Raksha', role: 'employee' }
];

const DEFAULT_PASSWORD = 'TestPass123!';

async function seedFirebaseAuth() {
  console.log('--- Initializing Firebase Admin SDK ---');
  initializeFirebase();
  const auth = getFirebaseAuth();

  console.log(`Setting up demo users with default password: ${DEFAULT_PASSWORD}\n`);

  for (const user of DEMO_USERS) {
    try {
      // Check if user already exists
      const existingUser = await auth.getUserByEmail(user.email).catch(() => null);

      if (existingUser) {
        // Update password and display name
        await auth.updateUser(existingUser.uid, {
          password: DEFAULT_PASSWORD,
          displayName: user.displayName,
        });
        await auth.setCustomUserClaims(existingUser.uid, {
          role: user.role,
        });
        console.log(`✓ Updated existing Firebase user: ${user.email} (Password reset to: ${DEFAULT_PASSWORD})`);
      } else {
        // Create user
        const newUser = await auth.createUser({
          email: user.email,
          password: DEFAULT_PASSWORD,
          displayName: user.displayName,
        });
        await auth.setCustomUserClaims(newUser.uid, {
          role: user.role,
        });
        console.log(`✓ Created new Firebase user: ${user.email} (Password: ${DEFAULT_PASSWORD})`);
      }
    } catch (err: any) {
      console.error(`✗ Error processing ${user.email}:`, err.message || err);
    }
  }

  console.log('\n--- Firebase Auth setup finished! ---');
  console.log(`All accounts can now log in with password: ${DEFAULT_PASSWORD}`);
  process.exit(0);
}

seedFirebaseAuth().catch((err) => {
  console.error('Fatal script error:', err);
  process.exit(1);
});

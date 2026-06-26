import mongoose from 'mongoose';
import { initializeFirebase, getFirebaseFirestore } from './src/config/firebase';
import { User } from './src/models/User';
import { LoginActivity } from './src/models/LoginActivity';
import { Notification } from './src/models/Notification';
import { SecurityLog } from './src/models/SecurityLog';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/secureguard-ai';

async function migrateData() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Initializing Firebase...');
  initializeFirebase();

  const users = await User.find({});
  const emailToUserMap: Record<string, any> = {};
  const uidToUserMap: Record<string, any> = {};

  users.forEach((u: any) => {
    if (u.email) emailToUserMap[u.email.toLowerCase()] = u;
    if (u.firebaseUid) uidToUserMap[u.firebaseUid] = u;
  });

  console.log(`Loaded ${users.length} users into mapping.`);

  // Migrate LoginActivity
  const loginActivities = await LoginActivity.find({});
  let loginUpdated = 0;
  for (const log of loginActivities) {
    let changed = false;
    const user = emailToUserMap[(log as any).userEmail?.toLowerCase()] || emailToUserMap[(log as any).email?.toLowerCase()] || uidToUserMap[log.firebaseUid || ''];
    if (user) {
      if (!log.company || log.company !== user.company) {
        log.company = user.company;
        changed = true;
      }
      if (!log.firebaseUid && user.firebaseUid) {
        log.firebaseUid = user.firebaseUid;
        changed = true;
      }
      if (!log.email && user.email) {
        log.email = user.email;
        changed = true;
      }
      if (!log.role && user.role) {
        log.role = user.role;
        changed = true;
      }
    } else {
      // Admin exception or unknown
      if ((log as any).userEmail?.toLowerCase() === 'admin@secureguard.com' || (log as any).email?.toLowerCase() === 'admin@secureguard.com') {
         log.company = 'admin';
         changed = true;
      }
    }

    if (changed) {
      await log.save();
      loginUpdated++;
    }
  }
  console.log(`Migrated ${loginUpdated} LoginActivity records in MongoDB.`);

  // Migrate ActivityLog in Firestore
  const db = getFirebaseFirestore();
  const activityLogsRef = db.collection('activity_logs');
  const activitySnap = await activityLogsRef.get();
  
  let fsUpdated = 0;
  const batch = db.batch();
  let operations = 0;
  
  for (const doc of activitySnap.docs) {
    const data = doc.data();
    const user = emailToUserMap[data.email?.toLowerCase()] || uidToUserMap[data.uid || ''];
    if (user && data.company !== user.company) {
      batch.update(doc.ref, { company: user.company });
      fsUpdated++;
      operations++;
      
      if (operations >= 400) {
        await batch.commit();
        operations = 0;
      }
    }
  }
  
  if (operations > 0) {
    await batch.commit();
  }
  console.log(`Migrated ${fsUpdated} activity_logs records in Firestore.`);

  console.log('Migration completed successfully.');
  process.exit(0);
}

migrateData().catch(console.error);

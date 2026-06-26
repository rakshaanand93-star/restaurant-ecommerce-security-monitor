import { getFirebaseAuth, initializeFirebase } from './src/config/firebase';

async function cleanup() {
  try {
    initializeFirebase();
    const list = await getFirebaseAuth().listUsers(10);
    const w1 = list.users.find(u => u.email === 'warehouse1@gmail.com');
    if (w1) {
      await getFirebaseAuth().deleteUser(w1.uid);
      console.log('Cleaned up warehouse1@gmail.com');
    } else {
      console.log('warehouse1@gmail.com not found');
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

cleanup();

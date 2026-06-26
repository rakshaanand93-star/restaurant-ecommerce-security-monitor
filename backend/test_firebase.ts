import { getFirebaseAuth, initializeFirebase } from './src/config/firebase';

async function test() {
  try {
    initializeFirebase();
    const list = await getFirebaseAuth().listUsers(10);
    console.log("Users in Firebase:", list.users.map(u => ({ uid: u.uid, email: u.email })));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();

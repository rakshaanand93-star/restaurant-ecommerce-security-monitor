import * as admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.cert(require('./firebaseServiceAccount.json'))
});

const db = admin.firestore();

async function check() {
  const qA = db.collection('activity_logs').where('company', '==', 'amazon');
  const snapA = await qA.get();
  console.log(`Amazon docs: ${snapA.size}`);

  const qZ = db.collection('activity_logs').where('company', '==', 'zomato');
  const snapZ = await qZ.get();
  console.log(`Zomato docs: ${snapZ.size}`);

  const snapAll = await db.collection('activity_logs').get();
  console.log(`Total docs: ${snapAll.size}`);
  
  console.log("ALL DOCS COMPANIES:");
  snapAll.docs.forEach(doc => {
    console.log(doc.id, " => ", doc.data().company, doc.data().email);
  });
}

check().then(() => process.exit(0));

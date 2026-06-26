import { Router } from 'express';
import { LoginActivity } from '../models/LoginActivity';
import { getFirebaseFirestore } from '../config/firebase';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { company } = req.query;
    
    let filter = {};
    if (company) {
      filter = { company: company as string };
    }
    
    const logs = await LoginActivity.find(filter).sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    console.error("Error fetching login history:", error);
    res.status(500).json({ error: "Failed to fetch login history" });
  }
});

router.delete('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const result = await LoginActivity.deleteMany({ firebaseUid: userId });
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (error) {
    console.error("Error deleting user login history:", error);
    res.status(500).json({ error: "Failed to delete user login history" });
  }
});

router.delete('/clear/:company', async (req, res) => {
  try {
    const { company } = req.params;
    
    if (!company) {
      return res.status(400).json({ error: "Company is required" });
    }

    let deletedMongoCount = 0;
    let deletedFirebaseCount = 0;

    // Delete from MongoDB
    console.log('Deleting MongoDB login history...');
    try {
      const result = await LoginActivity.deleteMany({ company });
      deletedMongoCount = result.deletedCount || 0;
      console.log(`MongoDB deleted: ${deletedMongoCount} records`);
    } catch (mongoErr) {
      console.error("MongoDB deletion failed:", mongoErr);
      throw mongoErr; // If Mongo fails, we probably should abort or fail as it's the main DB
    }

    // Delete from Firebase Firestore
    console.log('Deleting Firestore login history...');
    try {
      const db = getFirebaseFirestore();
      const snapshot = await db.collection('activity_logs').where('company', '==', company).get();
      
      if (!snapshot.empty) {
        const batch = db.batch();
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        
        await batch.commit();
        deletedFirebaseCount = snapshot.size;
      }
      console.log(`Firestore deleted: ${deletedFirebaseCount} records`);
    } catch (firebaseErr: any) {
      console.error(`Firestore deletion failed: ${firebaseErr.message || firebaseErr}`);
    }

    // Verify deletion
    const remainingMongo = await LoginActivity.countDocuments({ company });
    console.log(`Remaining MongoDB records: ${remainingMongo}`);

    console.log('Returning success response.');
    res.status(200).json({ 
      success: true,
      deletedMongo: deletedMongoCount,
      deletedFirebase: deletedFirebaseCount,
      message: `Login history cleared successfully` 
    });
  } catch (error) {
    console.error("Error clearing login history:", error);
    res.status(500).json({ error: "Failed to clear login history" });
  }
});

export default router;

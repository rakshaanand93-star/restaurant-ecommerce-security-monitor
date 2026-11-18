import { Router } from 'express';
import { LoginActivity } from '../models/LoginActivity';
import { getFirebaseFirestore } from '../config/firebase';
import { getLoginActivities, clearLoginActivities, saveLoginActivity } from '../services/dataStorage';

const router = Router();

// GET /api/login-history
router.get('/', async (req, res) => {
  try {
    const { company } = req.query;
    const logs = await getLoginActivities(company as string);
    res.json(logs);
  } catch (error) {
    console.error("Error fetching login history:", error);
    res.status(500).json({ error: "Failed to fetch login history" });
  }
});

// POST /api/login-history
router.post('/', async (req, res) => {
  try {
    const saved = await saveLoginActivity(req.body);
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: "Failed to record login activity" });
  }
});

// DELETE /api/login-history/user/:userId
router.delete('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    try {
      await LoginActivity.deleteMany({ $or: [{ firebaseUid: userId }, { userId }] });
    } catch (e) {}

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting user login history:", error);
    res.status(500).json({ error: "Failed to delete user login history" });
  }
});

// DELETE /api/login-history/clear/:company
router.delete('/clear/:company', async (req, res) => {
  try {
    const { company } = req.params;
    
    if (!company) {
      return res.status(400).json({ error: "Company is required" });
    }

    const deletedCount = await clearLoginActivities(company);

    // Delete from Firebase Firestore if available
    try {
      const db = getFirebaseFirestore();
      const snapshot = await db.collection('activity_logs').where('company', '==', company).get();
      if (!snapshot.empty) {
        const batch = db.batch();
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      }
    } catch (firebaseErr: any) {}

    res.status(200).json({ 
      success: true,
      deletedMongo: deletedCount,
      deletedFirebase: 0,
      message: `Login history cleared successfully` 
    });
  } catch (error) {
    console.error("Error clearing login history:", error);
    res.status(500).json({ error: "Failed to clear login history" });
  }
});

export default router;

import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { createSecurityEvent } from './securityLogger';

export async function recalculateRiskScore(uid: string, email: string, eventPenalty: number, reason: string) {
  try {
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) return;

    let currentScore = userDoc.data().riskScore || 0;
    currentScore += eventPenalty;
    if (currentScore > 100) currentScore = 100;

    let riskLevel = 'Low';
    if (currentScore > 20 && currentScore <= 50) riskLevel = 'Medium';
    else if (currentScore > 50 && currentScore <= 80) riskLevel = 'High';
    else if (currentScore > 80) riskLevel = 'Critical';

    await updateDoc(userDocRef, {
      riskScore: currentScore,
      riskLevel: riskLevel
    });

    if (currentScore > 50) {
      await createSecurityEvent(uid, email, 'High Risk Exceeded', 'HIGH', `User risk score reached ${currentScore} due to: ${reason}`, {
        ipAddress: 'System', city: 'System', country: 'System', device: 'System'
      });
    }
  } catch (error) {
    console.error("Failed to recalculate risk:", error);
  }
}

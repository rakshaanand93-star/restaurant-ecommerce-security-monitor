import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { syncToMongo } from './mongoSync';

export async function createSecurityEvent(
  uid: string, 
  email: string, 
  eventType: string, 
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', 
  details: string,
  fingerprint: any
) {
  try {
    const activeCompany = localStorage.getItem('company')?.toLowerCase() || '';
    
    await addDoc(collection(db, 'security_events'), {
      uid,
      email,
      eventType,
      severity,
      details,
      ip: fingerprint.ipAddress,
      location: `${fingerprint.city}, ${fingerprint.country}`,
      device: fingerprint.device,
      timestamp: serverTimestamp(),
      status: 'UNRESOLVED',
      company: activeCompany
    });

    // Sync to MongoDB
    await syncToMongo('securitylogs', {
      eventType,
      description: details,
      severity: severity.toLowerCase(),
      sourceIp: fingerprint.ipAddress || 'Unknown',
      userId: uid,
      company: activeCompany
    });

    // Map severity to notification type
    let notifType: 'warning' | 'success' | 'critical' | 'security' = 'warning';
    if (severity === 'CRITICAL') notifType = 'critical';

    // Generate Admin Notification alongside the security event
    await createAdminNotification(
      `Security Alert: ${eventType}`,
      `${details}`,
      notifType,
      email
    );
  } catch (error) {
    console.error("Failed to create security event:", error);
  }
}

export async function createAdminNotification(title: string, message: string, type: 'warning' | 'success' | 'critical' | 'security', userEmail: string) {
  try {
    console.log("Creating notification...");
    await addDoc(collection(db, 'notifications'), {
      title,
      message,
      type,
      userEmail,
      createdAt: serverTimestamp(),
      read: false
    });

    // Post to the new dedicated MongoDB notification endpoint
    try {
      const activeCompany = localStorage.getItem('company') || 'Zomato';
      const companyKey = activeCompany.toLowerCase();
      
      await fetch('http://localhost:4000/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          message,
          type,
          userEmail,
          read: false,
          company: companyKey,
        }),
      });
      // Notify the frontend to refetch from MongoDB immediately
      window.dispatchEvent(new Event('mongo-notification-updated'));
    } catch (apiErr) {
      console.error("Failed to POST to /api/notifications:", apiErr);
    }

    console.log("Notification created");
  } catch (err) {
    console.error("Failed to create admin notification:", err);
  }
}

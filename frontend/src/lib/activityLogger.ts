import { collection, addDoc, serverTimestamp, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';
import { createAdminNotification } from './securityLogger';
import { syncToMongo } from './mongoSync';

export type ActivityAction = 
  'LOGIN_SUCCESS' | 
  'LOGIN_FAILED' | 
  'LOGOUT' | 
  'SUSPICIOUS_LOGIN' | 
  'ADMIN_APPROVED' | 
  'ADMIN_REJECTED' |
  'LOGIN_BLOCKED' |
  'NEW_DEVICE_LOGIN' |
  'NEW_IP_LOGIN';

export async function logActivity(uid: string, email: string, action: ActivityAction, details: string = '') {
  try {
    const adminRoles = ['admin', 'superadmin', 'platform_owner', 'owner'];
    if (email.toLowerCase() === 'admin@secureguard.com') {
      return; // Do not log admin activity
    }

    try {
      // Small fast check to block admins from logging
      const userQuery = query(collection(db, 'users'), where('email', '==', email.toLowerCase()), limit(1));
      const userSnap = await getDocs(userQuery);
      if (!userSnap.empty && userSnap.docs[0].data().role) {
        if (adminRoles.includes(userSnap.docs[0].data().role.toLowerCase())) {
          return;
        }
      }
    } catch (e) {
      // fail open if we can't verify role
    }

    // Attempt to fetch IP address from a free public API
    let ipAddress = 'Unknown';
    try {
      const res = await fetch('https://api.ipify.org?format=json');
      const data = await res.json();
      ipAddress = data.ip;
    } catch (err) {
      console.warn("Could not fetch IP address");
    }

    // Fetch the correct company and role directly from MongoDB
    let actualCompany = localStorage.getItem('company')?.toLowerCase() || '';
    let actualRole = 'user';
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const mongoRes = await fetch(`${backendUrl}/api/users/by-email/${encodeURIComponent(email)}`);
      if (mongoRes.ok) {
        const mongoUser = await mongoRes.json();
        if (mongoUser.company) actualCompany = mongoUser.company;
        if (mongoUser.role) actualRole = mongoUser.role;
      }
    } catch (err) {
      console.warn("Could not fetch precise user company from backend during logging", err);
    }

    await addDoc(collection(db, 'activity_logs'), {
      uid,
      email,
      action,
      details,
      ipAddress,
      company: actualCompany,
      timestamp: serverTimestamp()
    });

    // Sync to MongoDB with all strictly required fields
    await syncToMongo('loginactivities', {
      firebaseUid: uid,
      email: email,
      role: actualRole,
      ipAddress,
      device: details || 'Unknown',
      status: action,
      company: actualCompany,
    });

    // Auto-generate notifications based on the action
    if (action === 'LOGIN_BLOCKED') {
      await createAdminNotification("Login Blocked", `User blocked from untrusted source. ${details} UID: ${uid}`, "warning", email);
    } 
    else if (action === 'ADMIN_APPROVED') {
      await createAdminNotification("Access Approved", `Admin whitelisted source. ${details}`, "success", email);
    }
    else if (action === 'ADMIN_REJECTED') {
      await createAdminNotification("Access Rejected", `Admin rejected source. ${details}`, "warning", email);
    }
    else if (action === 'NEW_DEVICE_LOGIN' || action === 'NEW_IP_LOGIN') {
      await createAdminNotification("New Device Login Request", `User attempting login from unrecognized device/IP. ${details} UID: ${uid}`, "warning", email);
    }
    else if (action === 'SUSPICIOUS_LOGIN') {
      await createAdminNotification("Suspicious Login", `Suspicious activity detected. ${details} UID: ${uid}`, "critical", email);
    }
    else if (action === 'LOGIN_FAILED') {
      // Threshold check: 3+ failures
      try {
        const q = query(
          collection(db, 'activity_logs'),
          where('email', '==', email),
          where('action', '==', 'LOGIN_FAILED'),
          orderBy('timestamp', 'desc'),
          limit(5)
        );
        const snap = await getDocs(q);
        
        // We only care about recency, but simply seeing 3+ in recent history is enough
        if (snap.size >= 3) {
          // Throttling: Check if we already alerted very recently to avoid spam (30 mins)
          const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
          
          const notifQ = query(
            collection(db, 'notifications'),
            where('userEmail', '==', email),
            where('title', '==', 'Suspicious Login Activity'),
            where('read', '==', false),
            // Cannot use where('createdAt', '>=', thirtyMinutesAgo) easily if we don't import Timestamp 
            // and firebase index might complain about multiple inequality fields. 
            // Let's just fetch recent ones and filter in memory since it's a small set per user.
            orderBy('createdAt', 'desc'),
            limit(1)
          );
          
          const notifSnap = await getDocs(notifQ);
          let skipNotification = false;
          
          if (!notifSnap.empty) {
            const recentNotif = notifSnap.docs[0].data();
            if (recentNotif.createdAt && recentNotif.createdAt.toDate) {
               const notifTime = recentNotif.createdAt.toDate();
               if (notifTime >= thirtyMinutesAgo) {
                 skipNotification = true;
               }
            }
          }

          if (!skipNotification) {
            let cleanUid = uid === 'unknown' ? 'User not found' : uid;
            let extraDetails = '';

            try {
              const userQuery = query(collection(db, 'users'), where('email', '==', email), limit(1));
              const userSnap = await getDocs(userQuery);
              if (!userSnap.empty) {
                const uData = userSnap.docs[0].data();
                cleanUid = uData.uid || userSnap.docs[0].id;
                extraDetails = `\nRole: ${uData.role || 'user'}\nStatus: ${uData.isDisabled ? 'Disabled' : 'Active'}`;
              }
            } catch (err) {
              console.warn("Could not fetch user details for notification:", err);
            }

            let cleanDetails = details.replace('Firebase: Error ', '').replace(/\(auth\/.*\)\.?/, '').replace('Firebase:', '').trim();
            if (!cleanDetails) cleanDetails = "Invalid credentials";
            
            const notifMessage = `${snap.size} failed login attempts detected.\nEmail: ${email}\nIP: ${ipAddress}\nLast Attempt: ${cleanDetails}\nUID: ${cleanUid}${extraDetails}`;

            await createAdminNotification(
              "Suspicious Login Activity", 
              notifMessage, 
              "critical", 
              email
            );
          }
        }
      } catch (e) {
        console.warn("Failed to check login failure threshold", e);
      }
    }

  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}

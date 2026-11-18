import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { getFingerprint } from './fingerprint';
import { logActivity } from './activityLogger';

export async function verifyLoginSecurity(uid: string, email: string): Promise<{ allowed: boolean, reason?: string, role: string }> {
  try {
    const fingerprint = await getFingerprint();
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    
    const lowerEmail = email.toLowerCase();
    let role = lowerEmail.includes('restaurant') || lowerEmail.includes('resturant') ? 'restaurant'
      : lowerEmail.includes('delivery') || lowerEmail.includes('rider') ? 'employee'
      : lowerEmail.includes('customer') ? 'customer'
      : 'user';

    if (userDoc.exists()) {
      const docRole = userDoc.data().role;
      if (docRole && docRole !== 'user') {
        role = docRole;
      }
    }

    // Admin and Customer accounts bypass verification entirely
    const isSystemAdmin = email.toLowerCase() === 'admin@secureguard.com';
    const adminRoles = ['admin', 'superadmin', 'platform_owner', 'owner'];
    if (isSystemAdmin || adminRoles.includes(role.toLowerCase())) {
      // Do NOT call logActivity here. Admin accounts must never appear in Activity Logs.
      return { allowed: true, role: isSystemAdmin ? 'admin' : role };
    }

    // Customers must be able to log in from any device and any location.
    // Do NOT require admin approval. Do NOT create a device request.
    if (role.toLowerCase() === 'customer') {
      await logActivity(uid, email, 'LOGIN_SUCCESS', `Customer logged in without device restrictions.`);
      return { allowed: true, role };
    }

    const deviceDocRef = doc(db, 'user_devices', uid);
    const deviceDoc = await getDoc(deviceDocRef);

    // Browser/Platform extraction
    const browser = navigator.userAgent;
    const platform = navigator.platform;

    // First login check
    if (!deviceDoc.exists()) {
      // First successful login, store as approved
      await setDoc(deviceDocRef, {
        uid,
        userEmail: email,
        ipAddress: fingerprint.ipAddress,
        deviceInfo: fingerprint.device,
        deviceId: fingerprint.deviceId,
        browser: browser,
        platform: platform,
        approved: true,
        approvedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      });
      await logActivity(uid, email, 'LOGIN_SUCCESS', `First login. Device trusted.`);
      return { allowed: true, role };
    }

    const data = deviceDoc.data();
    
    // Check against approved record
    const isIpSame = data.ipAddress === fingerprint.ipAddress;
    const isDeviceSame = data.deviceInfo === fingerprint.device;
    const isDeviceIdSame = data.deviceId === fingerprint.deviceId;

    if (isIpSame && isDeviceSame && isDeviceIdSame && data.approved) {
      await updateDoc(deviceDocRef, { lastLogin: serverTimestamp() });
      await logActivity(uid, email, 'LOGIN_SUCCESS', `Logged in from approved device.`);
      return { allowed: true, role };
    }

    // Quarantine Flow
    console.log("DEVICE MISMATCH DETECTED");
    console.log("USER UID:", uid);
    console.log("OLD IP:", data.ipAddress);
    console.log("NEW IP:", fingerprint.ipAddress);

    try {
      console.log("CREATING DEVICE REQUEST");
      const currentCompany = localStorage.getItem('company')?.toLowerCase() || '';
      const requestData = {
        uid,
        userEmail: email,
        role: role,
        company: currentCompany,
        oldIp: data.ipAddress || 'Unknown',
        newIp: fingerprint.ipAddress,
        oldDevice: data.deviceInfo || 'Unknown',
        newDevice: fingerprint.device,
        newDeviceId: fingerprint.deviceId,
        status: "PENDING",
        requestedAt: serverTimestamp()
      };
      console.log("REQUEST DATA:", requestData);
      
      const docRef = await addDoc(collection(db, 'device_requests'), requestData);
      
      console.log("DEVICE REQUEST CREATED");
      console.log("DOC ID:", docRef.id);

      // Notify admin via backend email system
      try {
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
        await fetch(`${backendUrl}/api/email/notify-admin-device`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company: currentCompany,
            email: email,
            role: role,
            newDevice: fingerprint.device,
            browser: 'Web Browser',
            os: 'Unknown',
            ipAddress: fingerprint.ipAddress,
            location: 'Unknown location'
          })
        });
      } catch (emailErr) {
        console.warn("Failed to send admin device notification email:", emailErr);
      }
    } catch (error: any) {
      console.error("DEVICE REQUEST FAILED:", error);
      throw error; // Do not return success unless addDoc completes successfully
    }
    
    await logActivity(uid, email, 'NEW_DEVICE_LOGIN', `IP: ${fingerprint.ipAddress}, Device: ${fingerprint.device}`);

    return { 
      allowed: false, 
      reason: "Login pending admin approval. You are logging in from an unrecognized device or location.",
      role
    };

  } catch (error) {
    console.error("Error in verifyLoginSecurity:", error);
    // Fail open if fingerprinting fails so we don't lock everyone out, but log it.
    await logActivity(uid, email, 'LOGIN_SUCCESS', `Security check failed, allowed fallback.`);
    const fallbackRole = email.toLowerCase() === 'admin@secureguard.com' ? 'admin' : 'user';
    return { allowed: true, role: fallbackRole };
  }
}

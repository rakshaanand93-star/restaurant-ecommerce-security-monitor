export interface DeviceFingerprint {
  ipAddress: string;
  city: string;
  country: string;
  device: string;
  browser: string;
  os: string;
  deviceId: string;
}

export async function getFingerprint(): Promise<DeviceFingerprint> {
  let ipAddress = 'Unknown';
  let city = 'Unknown';
  let country = 'Unknown';
  
  try {
    const res = await fetch('https://ipapi.co/json/');
    const data = await res.json();
    ipAddress = data.ip || 'Unknown';
    city = data.city || 'Unknown';
    country = data.country_name || 'Unknown';
  } catch (err) {
    console.warn("Could not fetch location data:", err);
  }

  const userAgent = navigator.userAgent;
  let device = 'Desktop';
  if (/Mobi|Android/i.test(userAgent)) {
    device = 'Mobile';
  } else if (/Tablet|iPad/i.test(userAgent)) {
    device = 'Tablet';
  }

  let browser = 'Unknown';
  if (/Chrome/i.test(userAgent) && !/Edge/i.test(userAgent)) browser = 'Chrome';
  else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) browser = 'Safari';
  else if (/Firefox/i.test(userAgent)) browser = 'Firefox';
  else if (/Edge/i.test(userAgent)) browser = 'Edge';

  let os = 'Unknown';
  if (/Windows/i.test(userAgent)) os = 'Windows';
  else if (/Mac/i.test(userAgent)) os = 'MacOS';
  else if (/Linux/i.test(userAgent)) os = 'Linux';
  else if (/Android/i.test(userAgent)) os = 'Android';
  else if (/iOS|iPhone|iPad/i.test(userAgent)) os = 'iOS';

  let deviceId = localStorage.getItem('secureguard_device_id');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('secureguard_device_id', deviceId);
  }

  return { ipAddress, city, country, device, browser, os, deviceId };
}

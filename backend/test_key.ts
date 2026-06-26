import dotenv from 'dotenv';
dotenv.config();

let privateKey = process.env.FIREBASE_PRIVATE_KEY;
console.log("RAW:", JSON.stringify(privateKey));

if (privateKey) {
  // If it starts with quote and ends with quote
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.substring(1, privateKey.length - 1);
  }
  // If it has leading space
  privateKey = privateKey.trim();
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.substring(1, privateKey.length - 1);
  }
  privateKey = privateKey.replace(/\\n/g, '\n');
}

console.log("PROCESSED:", JSON.stringify(privateKey));

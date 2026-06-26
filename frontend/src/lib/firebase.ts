import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
console.log("API KEY =", import.meta.env.VITE_FIREBASE_API_KEY);
console.log("PROJECT ID =", import.meta.env.VITE_FIREBASE_PROJECT_ID);
console.log("AUTH DOMAIN =", import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
console.log("STORAGEBUCKET =", import.meta.env.VITE_FIREBASE_STORAGE_BUCKET);
console.log("MESSAGING SENDER ID =", import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID);
console.log("APP ID =", import.meta.env.VITE_FIREBASE_APP_ID);
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
console.log("API KEY:", import.meta.env.VITE_FIREBASE_API_KEY);
console.log("Firebase Config:", firebaseConfig);
import { getFirestore } from "firebase/firestore";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const secondaryApp = initializeApp(firebaseConfig, 'Secondary');
console.log("Firebase initialized");

// Initialize and export Firebase Auth
export const auth = getAuth(app);
export const secondaryAuth = getAuth(secondaryApp);
export const db = getFirestore(app);
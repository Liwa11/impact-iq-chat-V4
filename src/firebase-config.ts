
// Fixed firebase config with auth export
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDDt-ngJ6ueH-_P7kv1jZZ6SjOoIQZypbI",
  authDomain: "impactiqwebsite.firebaseapp.com",
  projectId: "impactiqwebsite",
  storageBucket: "impactiqwebsite.firebasestorage.app",
  messagingSenderId: "878228226671",
  appId: "1:878228226671:web:34a6be14d9b307cdddc39a",
  measurementId: "G-SYLDQ4BTR0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBfuZulCLP6FHV1VNDfWye2BlyyXLrGsws",
  authDomain: "two-truths-and-a-lie-f8ffe.firebaseapp.com",
  databaseURL: "https://two-truths-and-a-lie-f8ffe-default-rtdb.firebaseio.com",
  projectId: "two-truths-and-a-lie-f8ffe",
  storageBucket: "two-truths-and-a-lie-f8ffe.firebasestorage.app",
  messagingSenderId: "1014814362240",
  appId: "1:1014814362240:web:ca0113c38475722d46b465",
  measurementId: "G-7RY0BNB33D"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Authenticate user anonymously so they have a persistent UID across refreshes
signInAnonymously(auth).catch((error) => {
  console.error("Anonymous auth failed:", error);
});

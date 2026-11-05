import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// ---------------------------------------------------------------
// GLOBAL GUARD: any signed-in user without a users/{uid} document
// in Firestore is signed out automatically.
// ---------------------------------------------------------------
onAuthStateChanged(auth, async (u) => {
  if (!u) return;

  const existsInDb = async () =>
    (await getDoc(doc(db, "users", u.uid))).exists();

  try {
    if (await existsInDb()) return;

    // Wait a few seconds in case registration is still saving the profile
    await new Promise((resolve) => setTimeout(resolve, 4000));

    if (!(await existsInDb())) {
      await signOut(auth);
      window.location.reload();
    }
  } catch (err) {
    console.error("Guard check failed:", err);
  }
});
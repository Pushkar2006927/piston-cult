import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.AIzaSyDdWJSja8crG0-bHt-X-_H7vLylVtIklEs,
  authDomain: process.env.pistoncult-425db.firebaseapp.com,
  projectId: process.env.pistoncult-425db,
  storageBucket: process.env.pistoncult-425db.firebasestorage.app,
  messagingSenderId: process.env.689163039493,
  appId: process.env.1:689163039493:web:ab77ead4401ee4810ebd6c,
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
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAkLMFzItDq_99yQK17VzweBPOxMQsrhBE",
  authDomain: "co-organizer.firebaseapp.com",
  projectId: "co-organizer",
  storageBucket: "co-organizer.appspot.com",
  messagingSenderId: "889157311597",
  appId: "1:889157311597:web:d1db3d66c3cce8b28eb364",
  measurementId: "G-BHF33PYVT3",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };

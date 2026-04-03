import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Note: In a real app, this would be your actual Firebase config.
// For this environment, we assume the config is provided or handled.
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "giroteca-mesquita.firebaseapp.com",
  projectId: "giroteca-mesquita",
  storageBucket: "giroteca-mesquita.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

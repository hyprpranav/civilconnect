import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export const DEFAULT_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: "AIzaSyCL35PCk5_dAZSKSYBSzNlcKEMSfoY9MY8",
  authDomain: "civilconnect-295a4.firebaseapp.com",
  projectId: "civilconnect-295a4",
  storageBucket: "civilconnect-295a4.firebasestorage.app",
  messagingSenderId: "311514382807",
  appId: "1:311514382807:web:818ab0fd7b6be1ff5d8b92"
};

export function getSavedFirebaseConfig(): FirebaseConfig {
  try {
    // 1. Check environment variables
    const envConfig: FirebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    };

    if (envConfig.apiKey && envConfig.projectId) {
      return envConfig;
    }

    // 2. Check localStorage
    const stored = localStorage.getItem('civil_connect_firebase_config');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed reading Firebase config', err);
  }

  // 3. Guaranteed production project fallback
  return DEFAULT_FIREBASE_CONFIG;
}

export function saveFirebaseConfig(config: FirebaseConfig) {
  localStorage.setItem('civil_connect_firebase_config', JSON.stringify(config));
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export function initializeFirebase() {
  const config = getSavedFirebaseConfig();
  if (config && config.apiKey && config.projectId) {
    try {
      if (!getApps().length) {
        app = initializeApp(config);
      } else {
        app = getApps()[0];
      }
      auth = getAuth(app);
      db = getFirestore(app);
      return { app, auth, db, isConfigured: true };
    } catch (err) {
      console.error('Firebase initialization error:', err);
    }
  }
  return { app: null, auth: null, db: null, isConfigured: false };
}

export function getFirestoreDb(): Firestore | null {
  if (!db) {
    const res = initializeFirebase();
    return res.db;
  }
  return db;
}

// Auto-initialize on module load
initializeFirebase();

export { app, auth, db };

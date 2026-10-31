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

export function getSavedFirebaseConfig(): FirebaseConfig | null {
  try {
    // Check localStorage first
    const stored = localStorage.getItem('civil_connect_firebase_config');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }

    // Check environment variables
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
  } catch (err) {
    console.warn('Failed reading Firebase config', err);
  }
  return null;
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

export { app, auth, db };

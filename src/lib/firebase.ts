import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  onSnapshot, 
  getDoc, 
  collection, 
  getDocs 
} from 'firebase/firestore';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { getAnalytics } from "firebase/analytics";
import defaultConfig from '../../firebase-applet-config.json';

/**
 * Interface untuk Profil Pengguna
 */
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  createdAt: number;
  lastLogin: number;
}

/**
 * Interface untuk Konfigurasi Firebase
 */
export interface FirebaseConfigType {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
  firestoreDatabaseId?: string;
}

/**
 * Mengambil konfigurasi aktif
 */
export function getActiveFirebaseConfig(): FirebaseConfigType {
  const env = (import.meta as any).env || {};
  if (env.VITE_FIREBASE_PROJECT_ID && env.VITE_FIREBASE_API_KEY) {
    return {
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || `${env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || `${env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: env.VITE_FIREBASE_APP_ID || '',
      measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || '',
      firestoreDatabaseId: env.VITE_FIREBASE_DATABASE_ID || '(default)',
    };
  }
  return defaultConfig;
}

// Inisialisasi Firebase App
const activeConfig = getActiveFirebaseConfig();
const appName = activeConfig.projectId ? `app-${activeConfig.projectId}` : '[DEFAULT]';
const existingApp = getApps().find((a) => a.name === appName);
const app = existingApp || initializeApp(activeConfig, appName);

export const db = getFirestore(app);
export const auth = getAuth(app);

// Aktifkan Analytics
if (typeof window !== 'undefined' && activeConfig.measurementId) {
  getAnalytics(app);
}

// --- FUNGSI AUTENTIKASI ---

export async function registerUser(email: string, pass: string, displayName: string, role: string = 'member'): Promise<UserProfile> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  const user = userCredential.user;
  const nameToUse = displayName.trim() || email.split('@')[0];
  await updateProfile(user, { displayName: nameToUse });
  const profile: UserProfile = {
    uid: user.uid,
    email: user.email || email,
    displayName: nameToUse,
    role,
    createdAt: Date.now(),
    lastLogin: Date.now(),
  };
  await setDoc(doc(db, 'users', user.uid), profile);
  return profile;
}

export async function loginUser(email: string, pass: string): Promise<UserProfile> {
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  const user = userCredential.user;
  const userDocRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userDocRef);
  let profile: UserProfile;
  if (snap.exists()) {
    profile = snap.data() as UserProfile;
    await setDoc(userDocRef, { lastLogin: Date.now() }, { merge: true });
  } else {
    profile = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      role: 'member',
      createdAt: Date.now(),
      lastLogin: Date.now(),
    };
    await setDoc(userDocRef, profile);
  }
  return profile;
}

export async function logoutUser() {
  await signOut(auth);
}

export function subscribeAuthState(callback: (userProfile: UserProfile | null, loading: boolean) => void) {
  return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    if (!firebaseUser) {
      callback(null, false);
      return;
    }
    const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (snap.exists()) {
      callback(snap.data() as UserProfile, false);
    } else {
      const fallback: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || 'User',
        role: 'member',
        createdAt: Date.now(),
        lastLogin: Date.now(),
      };
      callback(fallback, false);
    }
  });
}

export async function fetchAllRegisteredUsers(): Promise<UserProfile[]> {
  const snap = await getDocs(collection(db, 'users'));
  const list: UserProfile[] = [];
  snap.forEach((d) => list.push(d.data() as UserProfile));
  return list;
}

// --- FUNGSI DATABASE GLOBAL (SHARED) ---

const getSharedDocRef = () => {
  return doc(db, 'app_data', 'shared_dashboard_data');
};

export interface AppDataPayload {
  mainMenus: any[];
  categories: any[];
  templates: any[];
  reports: any[];
  pasaranList?: any[];
  tickerText?: string;
  updatedAt?: number;
}

export function subscribeToAppData(onData: (data: AppDataPayload | null) => void) {
  return onSnapshot(getSharedDocRef(), (docSnap) => {
    if (docSnap.exists()) {
      onData(docSnap.data() as AppDataPayload);
    } else {
      onData(null);
    }
  }, (err) => {
    console.error('Firestore Error:', err);
    onData(null);
  });
}

export async function saveAppDataToFirestore(data: AppDataPayload) {
  // Pastikan user login sebelum mencoba menyimpan
  if (!auth.currentUser) throw new Error("User not authenticated");
  
  try {
    const docRef = getSharedDocRef();
    await setDoc(docRef, {
      ...data,
      updatedAt: Date.now(),
    }, { merge: true });
  } catch (err) {
    console.error('Save Firestore Error:', err);
    throw err;
  }
}

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
 * Mengambil konfigurasi Firebase kustom dari LocalStorage jika ada
 */
export function getCustomFirebaseConfig(): FirebaseConfigType | null {
  try {
    const custom = localStorage.getItem('custom_firebase_config');
    if (custom) {
      const parsed = JSON.parse(custom);
      if (parsed && parsed.projectId && parsed.apiKey) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse custom_firebase_config', e);
  }
  return null;
}

/**
 * Menyimpan konfigurasi kustom dan mereload halaman
 */
export function saveCustomFirebaseConfig(config: FirebaseConfigType) {
  localStorage.setItem('custom_firebase_config', JSON.stringify(config));
  window.location.reload();
}

/**
 * Menghapus konfigurasi kustom
 */
export function removeCustomFirebaseConfig() {
  localStorage.removeItem('custom_firebase_config');
  window.location.reload();
}

/**
 * Mengambil konfigurasi aktif (Kustom > Env > Default)
 */
export function getActiveFirebaseConfig(): FirebaseConfigType {
  const custom = getCustomFirebaseConfig();
  // Jika ada konfigurasi kustom yang disetel manual, gunakan itu
  if (custom) return custom;

  // Cek Environment Variables (Vite)
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

  // Gunakan konfigurasi dari firebase-applet-config.json
  return defaultConfig;
}

// Inisialisasi Firebase App
const activeConfig = getActiveFirebaseConfig();
const appName = activeConfig.projectId ? `app-${activeConfig.projectId}` : '[DEFAULT]';
const existingApp = getApps().find((a) => a.name === appName);
const app = existingApp || initializeApp(activeConfig, appName);

// Inisialisasi Firestore, Auth, dan Analytics
const dbId = activeConfig.firestoreDatabaseId && activeConfig.firestoreDatabaseId !== '(default)'
    ? activeConfig.firestoreDatabaseId
    : undefined;

export const db = dbId ? getFirestore(app, dbId) : getFirestore(app);
export const auth = getAuth(app);

// Aktifkan Analytics hanya jika di lingkungan browser
if (typeof window !== 'undefined' && activeConfig.measurementId) {
  getAnalytics(app);
}

// --- FUNGSI AUTENTIKASI ---

/**
 * Mendaftarkan pengguna baru dan menyimpan profil ke Firestore
 */
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

  try {
    await setDoc(doc(db, 'users', user.uid), profile);
  } catch (err) {
    console.warn('Failed to save user profile to Firestore:', err);
  }

  return profile;
}

/**
 * Login pengguna dan memperbarui waktu login terakhir
 */
export async function loginUser(email: string, pass: string): Promise<UserProfile> {
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  const user = userCredential.user;

  let profile: UserProfile = {
    uid: user.uid,
    email: user.email || email,
    displayName: user.displayName || email.split('@')[0],
    role: 'member',
    createdAt: Date.now(),
    lastLogin: Date.now(),
  };

  try {
    const userDocRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      profile = snap.data() as UserProfile;
      profile.lastLogin = Date.now();
      await setDoc(userDocRef, { lastLogin: Date.now() }, { merge: true });
    } else {
      await setDoc(userDocRef, profile);
    }
  } catch (err) {
    console.warn('Failed to update user login time in Firestore:', err);
  }

  return profile;
}

/**
 * Logout dari aplikasi
 */
export async function logoutUser() {
  await signOut(auth);
}

/**
 * Berlangganan status autentikasi (Realtime)
 */
export function subscribeAuthState(callback: (userProfile: UserProfile | null, loading: boolean) => void) {
  return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    if (!firebaseUser) {
      callback(null, false);
      return;
    }

    try {
      const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (snap.exists()) {
        callback(snap.data() as UserProfile, false);
      } else {
        const fallbackProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User'),
          role: 'member',
          createdAt: Date.now(),
          lastLogin: Date.now(),
        };
        callback(fallbackProfile, false);
      }
    } catch (e) {
      const fallbackProfile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User'),
        role: 'member',
        createdAt: Date.now(),
        lastLogin: Date.now(),
      };
      callback(fallbackProfile, false);
    }
  });
}

/**
 * Mengambil semua daftar pengguna terdaftar (untuk admin)
 */
export async function fetchAllRegisteredUsers(): Promise<UserProfile[]> {
  try {
    const snap = await getDocs(collection(db, 'users'));
    const list: UserProfile[] = [];
    snap.forEach((d) => {
      list.push(d.data() as UserProfile);
    });
    return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch (err) {
    console.error('Failed to fetch users:', err);
    return [];
  }
}

// --- FUNGSI SINKRONISASI DATA APLIKASI ---

const getAppDataDocRef = (userId?: string | null) => {
  // Data dipisahkan berdasarkan UID user agar tidak tertukar antar pengguna
  const docId = userId && userId.trim() !== '' ? userId : 'global';
  return doc(db, 'app_data', docId);
};

export interface AppDataPayload {
  mainMenus: any[];
  categories: any[];
  templates: any[];
  reports: any[];
  pasaranList?: any[];
  updatedAt?: number;
}

let isQuotaExceeded = false;

/**
 * Berlangganan perubahan data secara realtime dari Firestore.
 * Jika user login, dia hanya akan mengambil datanya sendiri.
 */
export function subscribeToAppData(
  userId: string | null | undefined,
  onData: (data: AppDataPayload | null) => void
) {
  try {
    const docRef = getAppDataDocRef(userId);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as AppDataPayload;
        onData(data);
      } else {
        onData(null);
      }
    }, (err) => {
      if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota')) {
        isQuotaExceeded = true;
        console.warn('Firestore subscription paused: Quota limit reached. Operating in Local Storage mode.');
      } else {
        console.warn('Firestore subscription error:', err);
      }
    });
  } catch (err) {
    console.warn('Unable to subscribe to Firestore:', err);
    return () => {};
  }
}

/**
 * Menyimpan data aplikasi ke Firestore Cloud.
 */
export async function saveAppDataToFirestore(data: AppDataPayload, userId?: string | null) {
  if (isQuotaExceeded) {
    return;
  }
  try {
    const docRef = getAppDataDocRef(userId);
    await setDoc(docRef, {
      ...data,
      updatedAt: Date.now(),
    }).catch((err) => {
      if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota')) {
        isQuotaExceeded = true;
        console.warn('Firestore Quota limit reached. All changes are saved locally to browser storage.');
      }
    });
  } catch (err: any) {
    if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota')) {
      isQuotaExceeded = true;
      console.warn('Firestore Quota limit reached. Operating in Local Storage mode.');
    } else {
      console.error('Failed to save to Firestore:', err);
    }
  }
}

/**
 * Mengambil data aplikasi sekali saja dari Firestore.
 */
export async function getAppDataFromFirestore(userId?: string | null): Promise<AppDataPayload | null> {
  try {
    const docRef = getAppDataDocRef(userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as AppDataPayload;
    }
  } catch (err) {
    console.error('Failed to fetch from Firestore:', err);
  }
  return null;
}

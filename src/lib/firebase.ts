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

/**
 * KONFIGURASI FIREBASE (Sesuai Gambar Anda)
 */
const firebaseConfig = {
  apiKey: "AIzaSyC5leEQNIv-wSCMJaeWQQab1QCVejydIBU",
  authDomain: "togelup-crypto.firebaseapp.com",
  projectId: "togelup-crypto",
  storageBucket: "togelup-crypto.firebasestorage.app",
  messagingSenderId: "252463725245",
  appId: "1:252463725245:web:746df21deced249daa55d4",
  measurementId: "G-0V5WVYQKQN"
};

// Inisialisasi Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
export const auth = getAuth(app);

// Aktifkan Analytics jika di browser
if (typeof window !== 'undefined') {
  getAnalytics(app);
}

/**
 * INTERFACE DATA
 */
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  createdAt: number;
  lastLogin: number;
}

export interface AppDataPayload {
  categories: any[];
  templates: any[];
  reports: any[];
  pasaranList: any[];
  tickerText: string;
  updatedAt?: number;
}

// --- FUNGSI PEMBERSIH DATA (Firestore tidak menerima 'undefined') ---
const sanitizeData = (data: any): any => {
  return JSON.parse(
    JSON.stringify(data, (key, value) => (value === undefined ? null : value))
  );
};

// --- FUNGSI AUTENTIKASI ---

export async function registerUser(email: string, pass: string, displayName: string, role: string = 'Member'): Promise<UserProfile> {
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
  
  if (snap.exists()) {
    const profile = snap.data() as UserProfile;
    await setDoc(userDocRef, { lastLogin: Date.now() }, { merge: true });
    return profile;
  } else {
    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || 'User',
      role: 'Member',
      createdAt: Date.now(),
      lastLogin: Date.now(),
    };
    await setDoc(userDocRef, newProfile);
    return newProfile;
  }
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
      callback(null, false);
    }
  });
}

export async function fetchAllRegisteredUsers(): Promise<UserProfile[]> {
  try {
    const snap = await getDocs(collection(db, 'users'));
    const list: UserProfile[] = [];
    snap.forEach((d) => list.push(d.data() as UserProfile));
    return list.sort((a, b) => b.createdAt - a.createdAt);
  } catch (err) {
    console.error('Gagal ambil user:', err);
    return [];
  }
}

// --- FUNGSI DATABASE GLOBAL (SHARED DASHBOARD) ---

const getSharedDocRef = () => {
  return doc(db, 'app_data', 'shared_dashboard_data');
};

/**
 * Berlangganan data secara realtime.
 * Jika data berubah di Firebase, dashboard di semua PC akan langsung update.
 */
export function subscribeToAppData(onData: (data: AppDataPayload | null) => void) {
  return onSnapshot(getSharedDocRef(), (docSnap) => {
    if (docSnap.exists()) {
      onData(docSnap.data() as AppDataPayload);
    } else {
      onData(null); // Data belum ada
    }
  }, (err) => {
    console.error('Firestore Read Error:', err);
  });
}

/**
 * Simpan data ke Firestore.
 */
export async function saveAppDataToFirestore(data: AppDataPayload) {
  if (!auth.currentUser) return;
  
  try {
    const cleanData = sanitizeData(data);
    await setDoc(getSharedDocRef(), {
      ...cleanData,
      updatedAt: Date.now(),
    }, { merge: true });
  } catch (err: any) {
    console.error('Gagal simpan ke Cloud:', err);
    throw err;
  }
}

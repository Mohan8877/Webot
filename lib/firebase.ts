import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app"
import { getAuth, type Auth } from "firebase/auth"
import { getFirestore, type Firestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDwviPchySkPWCRujAR8f0h_q0dzgln7BI",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "urlbot-2efbc.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "urlbot-2efbc",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "urlbot-2efbc.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "734775809106",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:734775809106:web:3808186a3782caa2bdfb8b",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-YTX95VEDXP",
}

export const isFirebaseConfigured = true

let app: FirebaseApp
let auth: Auth
let db: Firestore

app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
auth = getAuth(app)
db = getFirestore(app)

export { app, auth, db }

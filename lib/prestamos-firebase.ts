import { getApps, initializeApp, type FirebaseApp } from "firebase/app"
import { getFirestore, type Firestore } from "firebase/firestore"

const prestamosConfig = {
  apiKey: process.env.NEXT_PUBLIC_PRESTAMOS_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_PRESTAMOS_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_PRESTAMOS_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_PRESTAMOS_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_PRESTAMOS_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_PRESTAMOS_FIREBASE_APP_ID,
}

export const isPrestamosConfigured = Boolean(prestamosConfig.apiKey && prestamosConfig.projectId)

const APP_NAME = "prestamos-escenarios"

let prestamosDb: Firestore | null = null

function getPrestamosApp(): FirebaseApp {
  if (!isPrestamosConfigured) {
    throw new Error("Firebase de préstamos no está configurado")
  }
  const existing = getApps().find((app) => app.name === APP_NAME)
  return existing ?? initializeApp(prestamosConfig, APP_NAME)
}

export function getPrestamosDb(): Firestore {
  if (prestamosDb) return prestamosDb
  prestamosDb = getFirestore(getPrestamosApp())
  return prestamosDb
}

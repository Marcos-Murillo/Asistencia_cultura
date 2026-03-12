import { initializeApp, FirebaseApp } from "firebase/app"
import { getFirestore, Firestore } from "firebase/firestore"
import { logEnvValidation } from './logger'

export type Area = 'cultura' | 'deporte'

interface FirebaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
  measurementId: string
}

// Configuración para Cultura (existente)
const culturaConfig: FirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID!,
}

// Configuración para Deporte (nueva)
const deporteConfig: FirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_DEPORTE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_DEPORTE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_DEPORTE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_DEPORTE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_DEPORTE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_DEPORTE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_DEPORTE_MEASUREMENT_ID!,
}

// Instancias de Firebase
let culturaApp: FirebaseApp
let deporteApp: FirebaseApp
let culturaDb: Firestore
let deporteDb: Firestore

// Inicializar aplicaciones Firebase
export function initializeFirebaseApps(): void {
  if (!culturaApp) {
    culturaApp = initializeApp(culturaConfig, 'cultura')
    culturaDb = getFirestore(culturaApp)
  }
  
  if (!deporteApp) {
    deporteApp = initializeApp(deporteConfig, 'deporte')
    deporteDb = getFirestore(deporteApp)
  }
}

// Obtener instancia de Firestore según área
export function getFirestoreForArea(area: Area): Firestore {
  initializeFirebaseApps()
  
  const db = area === 'cultura' ? culturaDb : deporteDb
  const projectId = area === 'cultura' ? culturaConfig.projectId : deporteConfig.projectId
  
  console.log(`[firebase-config] getFirestoreForArea('${area}') → Project: ${projectId}`)
  
  return db
}

// Validar que todas las variables de entorno estén presentes
export function validateEnvironmentVariables(): { valid: boolean; missing: string[] } {
  const required = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
    'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID',
    'NEXT_PUBLIC_FIREBASE_DEPORTE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_DEPORTE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_DEPORTE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_DEPORTE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_DEPORTE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_DEPORTE_APP_ID',
    'NEXT_PUBLIC_FIREBASE_DEPORTE_MEASUREMENT_ID',
  ]
  
  const missing = required.filter(key => !process.env[key])
  
  // Task 25.1: Log de validación de variables de entorno
  logEnvValidation(missing.length === 0, missing)
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing)
  }
  
  return {
    valid: missing.length === 0,
    missing
  }
}

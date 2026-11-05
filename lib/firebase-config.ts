import { getApps, initializeApp, FirebaseApp } from "firebase/app"
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

// Proyecto aparte: guarda la imagen como texto o enlace y la relaciona
// con usuarios y grupos de Cultura o Deporte.
const imagenesConfig: FirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_IMAGENES_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_IMAGENES_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_IMAGENES_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_IMAGENES_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_IMAGENES_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_IMAGENES_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_IMAGENES_MEASUREMENT_ID!,
}

const IMAGES_ENV_KEYS = [
  'NEXT_PUBLIC_FIREBASE_IMAGENES_API_KEY',
  'NEXT_PUBLIC_FIREBASE_IMAGENES_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_IMAGENES_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_IMAGENES_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_IMAGENES_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_IMAGENES_APP_ID',
  'NEXT_PUBLIC_FIREBASE_IMAGENES_MEASUREMENT_ID',
] as const

// Instancias de Firebase
let culturaApp: FirebaseApp
let deporteApp: FirebaseApp
let culturaDb: Firestore
let deporteDb: Firestore
let imagenesApp: FirebaseApp
let imagenesDb: Firestore

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

function getNamedApp(name: string, config: FirebaseConfig): FirebaseApp {
  const existing = getApps().find((app) => app.name === name)
  return existing ?? initializeApp(config, name)
}

/** Firestore del proyecto de imágenes. Ahí solo se guarda texto o un enlace, no el archivo. */
export function initializeImagesApp(): void {
  if (imagenesApp && imagenesDb) return

  const configured: [string, string][] = [
    ["NEXT_PUBLIC_FIREBASE_IMAGENES_API_KEY", imagenesConfig.apiKey],
    ["NEXT_PUBLIC_FIREBASE_IMAGENES_AUTH_DOMAIN", imagenesConfig.authDomain],
    ["NEXT_PUBLIC_FIREBASE_IMAGENES_PROJECT_ID", imagenesConfig.projectId],
    ["NEXT_PUBLIC_FIREBASE_IMAGENES_STORAGE_BUCKET", imagenesConfig.storageBucket],
    ["NEXT_PUBLIC_FIREBASE_IMAGENES_MESSAGING_SENDER_ID", imagenesConfig.messagingSenderId],
    ["NEXT_PUBLIC_FIREBASE_IMAGENES_APP_ID", imagenesConfig.appId],
    ["NEXT_PUBLIC_FIREBASE_IMAGENES_MEASUREMENT_ID", imagenesConfig.measurementId],
  ]
  const missing = configured.filter(([, value]) => !value).map(([key]) => key)
  if (missing.length > 0) {
    throw new Error(`Faltan variables de la base de imágenes: ${missing.join(", ")}`)
  }

  imagenesApp = getNamedApp("imagenes", imagenesConfig)
  imagenesDb = getFirestore(imagenesApp)
}

export function getImagesFirestore(): Firestore {
  initializeImagesApp()
  console.log(`[firebase-config] getImagesFirestore() → Project: ${imagenesConfig.projectId}`)
  return imagenesDb
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
    ...IMAGES_ENV_KEYS,
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

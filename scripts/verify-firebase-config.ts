/**
 * Verify Firebase Configuration
 */

console.log('============================================================')
console.log('🔍 VERIFYING FIREBASE CONFIGURATION')
console.log('============================================================\n')

console.log('CULTURA Configuration:')
console.log('  API Key:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✓ Set' : '✗ Missing')
console.log('  Auth Domain:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN)
console.log('  Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)
console.log('  Storage Bucket:', process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET)
console.log('  Messaging Sender ID:', process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID)
console.log('  App ID:', process.env.NEXT_PUBLIC_FIREBASE_APP_ID)
console.log('  Measurement ID:', process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID)

console.log('\nDEPORTE Configuration:')
console.log('  API Key:', process.env.NEXT_PUBLIC_FIREBASE_DEPORTE_API_KEY ? '✓ Set' : '✗ Missing')
console.log('  Auth Domain:', process.env.NEXT_PUBLIC_FIREBASE_DEPORTE_AUTH_DOMAIN)
console.log('  Project ID:', process.env.NEXT_PUBLIC_FIREBASE_DEPORTE_PROJECT_ID)
console.log('  Storage Bucket:', process.env.NEXT_PUBLIC_FIREBASE_DEPORTE_STORAGE_BUCKET)
console.log('  Messaging Sender ID:', process.env.NEXT_PUBLIC_FIREBASE_DEPORTE_MESSAGING_SENDER_ID)
console.log('  App ID:', process.env.NEXT_PUBLIC_FIREBASE_DEPORTE_APP_ID)
console.log('  Measurement ID:', process.env.NEXT_PUBLIC_FIREBASE_DEPORTE_MEASUREMENT_ID)

console.log('\n============================================================')
console.log('Testing Firebase Initialization...')
console.log('============================================================\n')

try {
  const { initializeFirebaseApps, getFirestoreForArea } = require('../lib/firebase-config')
  
  console.log('Initializing Firebase apps...')
  initializeFirebaseApps()
  console.log('✓ Firebase apps initialized')
  
  console.log('\nGetting Firestore instances...')
  const culturaDb = getFirestoreForArea('cultura')
  console.log('✓ Cultura Firestore instance obtained')
  console.log('  Type:', culturaDb.type)
  console.log('  App name:', culturaDb.app.name)
  
  const deporteDb = getFirestoreForArea('deporte')
  console.log('✓ Deporte Firestore instance obtained')
  console.log('  Type:', deporteDb.type)
  console.log('  App name:', deporteDb.app.name)
  
  console.log('\n✅ Configuration appears valid')
  
} catch (error: any) {
  console.error('\n❌ ERROR during initialization:', error.message)
  console.error('Stack:', error.stack)
}

console.log('\n============================================================')

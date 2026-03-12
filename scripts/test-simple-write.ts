/**
 * Simple test to write a minimal document to BD_Deporte
 * This will help us identify what's causing the INVALID_ARGUMENT error
 */

import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

import { getFirestoreForArea } from '../lib/firebase-config'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

async function testSimpleWrite() {
  console.log('='.repeat(60))
  console.log('Test de escritura simple a BD_Deporte')
  console.log('='.repeat(60))
  console.log('')

  try {
    const db = getFirestoreForArea('deporte')
    console.log('✓ Conexión a BD_Deporte establecida')
    console.log('')

    // Test 1: Write with serverTimestamp (recommended by Firebase)
    console.log('Test 1: Escribiendo con serverTimestamp()...')
    try {
      const doc1 = {
        nombre: 'Test Grupo 1',
        activo: true,
        createdAt: serverTimestamp(),
      }
      
      console.log('Datos a escribir:', doc1)
      const docRef1 = await addDoc(collection(db, 'cultural_groups'), doc1)
      console.log('✓ Documento creado con ID:', docRef1.id)
      console.log('✓ Test 1 EXITOSO - serverTimestamp funciona')
      console.log('')
    } catch (error: any) {
      console.error('✗ Test 1 FALLÓ:', error.message)
      console.error('Código de error:', error.code)
      console.log('')
    }

    // Test 2: Write with Date object
    console.log('Test 2: Escribiendo con Date()...')
    try {
      const doc2 = {
        nombre: 'Test Grupo 2',
        activo: true,
        createdAt: new Date(),
      }
      
      console.log('Datos a escribir:', doc2)
      const docRef2 = await addDoc(collection(db, 'cultural_groups'), doc2)
      console.log('✓ Documento creado con ID:', docRef2.id)
      console.log('✓ Test 2 EXITOSO - Date() funciona')
      console.log('')
    } catch (error: any) {
      console.error('✗ Test 2 FALLÓ:', error.message)
      console.error('Código de error:', error.code)
      console.log('')
    }

    // Test 3: Write with ISO string
    console.log('Test 3: Escribiendo con ISO string...')
    try {
      const doc3 = {
        nombre: 'Test Grupo 3',
        activo: true,
        createdAt: new Date().toISOString(),
      }
      
      console.log('Datos a escribir:', doc3)
      const docRef3 = await addDoc(collection(db, 'cultural_groups'), doc3)
      console.log('✓ Documento creado con ID:', docRef3.id)
      console.log('✓ Test 3 EXITOSO - ISO string funciona')
      console.log('')
    } catch (error: any) {
      console.error('✗ Test 3 FALLÓ:', error.message)
      console.error('Código de error:', error.code)
      console.log('')
    }

    // Test 4: Write without timestamp
    console.log('Test 4: Escribiendo sin timestamp...')
    try {
      const doc4 = {
        nombre: 'Test Grupo 4',
        activo: true,
      }
      
      console.log('Datos a escribir:', doc4)
      const docRef4 = await addDoc(collection(db, 'cultural_groups'), doc4)
      console.log('✓ Documento creado con ID:', docRef4.id)
      console.log('✓ Test 4 EXITOSO - Sin timestamp funciona')
      console.log('')
    } catch (error: any) {
      console.error('✗ Test 4 FALLÓ:', error.message)
      console.error('Código de error:', error.code)
      console.log('')
    }

    console.log('='.repeat(60))
    console.log('Tests completados')
    console.log('='.repeat(60))
    console.log('')
    console.log('Revisa cuál test funcionó y usaremos ese formato.')
    
  } catch (error: any) {
    console.error('❌ Error fatal:', error.message)
    console.error('Código:', error.code)
    console.error('')
    
    if (error.code === 'app/invalid-credential') {
      console.error('Las credenciales de Firebase son inválidas.')
      console.error('Verifica NEXT_PUBLIC_FIREBASE_DEPORTE_* en .env.local')
    } else if (error.message.includes('(default)')) {
      console.error('Problema con el ID de la base de datos.')
      console.error('Verifica que BD_Deporte existe en Firebase Console.')
    }
    
    process.exit(1)
  }
}

testSimpleWrite()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })

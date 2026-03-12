/**
 * Diagnose Area Switching Issue
 * 
 * This script helps identify why data doesn't change when switching areas
 */

import { getFirestoreForArea } from '../lib/firebase-config'
import { collection, getDocs, query, limit } from 'firebase/firestore'

console.log('============================================================')
console.log('🔍 DIAGNOSING AREA SWITCHING')
console.log('============================================================\n')

async function testAreaSwitch() {
  console.log('Testing if both databases return different data...\n')
  
  // Test Cultura
  console.log('📊 CULTURA Database:')
  const culturaDb = getFirestoreForArea('cultura')
  const culturaUsersRef = collection(culturaDb, 'user_profiles')
  const culturaQuery = query(culturaUsersRef, limit(3))
  const culturaSnapshot = await getDocs(culturaQuery)
  
  console.log(`  Total users (first 3): ${culturaSnapshot.size}`)
  culturaSnapshot.docs.forEach((doc, i) => {
    const data = doc.data()
    console.log(`    ${i + 1}. ${data.nombres} (${data.area || 'NO AREA FIELD'})`)
  })
  
  // Test Deporte
  console.log('\n📊 DEPORTE Database:')
  const deporteDb = getFirestoreForArea('deporte')
  const deporteUsersRef = collection(deporteDb, 'user_profiles')
  const deporteQuery = query(deporteUsersRef, limit(3))
  const deporteSnapshot = await getDocs(deporteQuery)
  
  console.log(`  Total users (first 3): ${deporteSnapshot.size}`)
  deporteSnapshot.docs.forEach((doc, i) => {
    const data = doc.data()
    console.log(`    ${i + 1}. ${data.nombres} (${data.area || 'NO AREA FIELD'})`)
  })
  
  console.log('\n============================================================')
  console.log('📋 ANALYSIS')
  console.log('============================================================\n')
  
  if (culturaSnapshot.size === 0 && deporteSnapshot.size === 0) {
    console.log('❌ PROBLEM: Both databases are empty!')
    console.log('   This means the databases are not properly configured.')
  } else if (culturaSnapshot.size > 0 && deporteSnapshot.size === 0) {
    console.log('✓ Cultura has data')
    console.log('⚠️  Deporte is empty (expected if just created)')
  } else if (culturaSnapshot.size === 0 && deporteSnapshot.size > 0) {
    console.log('⚠️  Cultura is empty')
    console.log('✓ Deporte has data')
  } else {
    console.log('✓ Both databases have data')
    console.log('✓ Area switching should work correctly')
  }
  
  console.log('\n============================================================')
}

testAreaSwitch().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})

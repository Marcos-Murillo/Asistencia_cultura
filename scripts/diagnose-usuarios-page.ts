/**
 * Diagnose Usuarios Page Data Flow
 * 
 * This script traces the entire data flow for the usuarios page
 */

import { getFirestoreForArea } from '../lib/firebase-config'
import { collection, getDocs, query, where, limit } from 'firebase/firestore'
import { getAllUsers } from '../lib/db-router'

console.log('============================================================')
console.log('🔍 DIAGNOSING USUARIOS PAGE DATA FLOW')
console.log('============================================================\n')

async function checkRawData(area: 'cultura' | 'deporte') {
  console.log(`\n📊 RAW DATA CHECK - ${area.toUpperCase()}`)
  console.log('─────────────────────────────────────────────────────────')
  
  const db = getFirestoreForArea(area)
  const usersRef = collection(db, 'user_profiles')
  
  // Get ALL users without filter
  console.log('\n1. Getting ALL users (no filter):')
  const allSnapshot = await getDocs(usersRef)
  console.log(`   Total documents: ${allSnapshot.size}`)
  
  allSnapshot.docs.slice(0, 3).forEach((doc, i) => {
    const data = doc.data()
    console.log(`   ${i + 1}. ${data.nombres}`)
    console.log(`      - area field: ${data.area || 'MISSING'}`)
    console.log(`      - id: ${doc.id}`)
  })
  
  // Get users WITH area filter
  console.log(`\n2. Getting users filtered by area='${area}':`)
  const filteredQuery = query(usersRef, where('area', '==', area))
  const filteredSnapshot = await getDocs(filteredQuery)
  console.log(`   Filtered documents: ${filteredSnapshot.size}`)
  
  filteredSnapshot.docs.slice(0, 3).forEach((doc, i) => {
    const data = doc.data()
    console.log(`   ${i + 1}. ${data.nombres} (area: ${data.area})`)
  })
  
  return {
    total: allSnapshot.size,
    filtered: filteredSnapshot.size,
    missingArea: allSnapshot.size - filteredSnapshot.size
  }
}

async function checkDbRouter(area: 'cultura' | 'deporte') {
  console.log(`\n📦 DB-ROUTER CHECK - ${area.toUpperCase()}`)
  console.log('─────────────────────────────────────────────────────────')
  
  try {
    console.log(`\nCalling getAllUsers('${area}')...`)
    const users = await getAllUsers(area)
    console.log(`✓ Returned ${users.length} users`)
    
    users.slice(0, 3).forEach((user, i) => {
      console.log(`   ${i + 1}. ${user.nombres}`)
      console.log(`      - area: ${user.area || 'MISSING'}`)
      console.log(`      - id: ${user.id}`)
    })
    
    return users.length
  } catch (error: any) {
    console.error(`✗ Error:`, error.message)
    return 0
  }
}

async function main() {
  // Check Cultura
  const culturaRaw = await checkRawData('cultura')
  const culturaRouter = await checkDbRouter('cultura')
  
  // Check Deporte
  const deporteRaw = await checkRawData('deporte')
  const deporteRouter = await checkDbRouter('deporte')
  
  console.log('\n============================================================')
  console.log('📋 SUMMARY')
  console.log('============================================================\n')
  
  console.log('CULTURA:')
  console.log(`  Total documents in DB: ${culturaRaw.total}`)
  console.log(`  Documents with area='cultura': ${culturaRaw.filtered}`)
  console.log(`  Documents missing area field: ${culturaRaw.missingArea}`)
  console.log(`  Returned by getAllUsers(): ${culturaRouter}`)
  
  console.log('\nDEPORTE:')
  console.log(`  Total documents in DB: ${deporteRaw.total}`)
  console.log(`  Documents with area='deporte': ${deporteRaw.filtered}`)
  console.log(`  Documents missing area field: ${deporteRaw.missingArea}`)
  console.log(`  Returned by getAllUsers(): ${deporteRouter}`)
  
  console.log('\n============================================================')
  console.log('🔍 DIAGNOSIS')
  console.log('============================================================\n')
  
  if (culturaRaw.missingArea > 0) {
    console.log(`⚠️  WARNING: ${culturaRaw.missingArea} Cultura documents are missing the 'area' field`)
    console.log('   → Run migration again to fix this')
  }
  
  if (deporteRaw.missingArea > 0) {
    console.log(`⚠️  WARNING: ${deporteRaw.missingArea} Deporte documents are missing the 'area' field`)
    console.log('   → Run migration to fix this')
  }
  
  if (culturaRouter === 0 && culturaRaw.filtered > 0) {
    console.log('❌ PROBLEM: getAllUsers() returns 0 but filtered query finds documents')
    console.log('   → Check db-router.ts implementation')
  }
  
  if (culturaRouter === culturaRaw.filtered && culturaRaw.filtered > 0) {
    console.log('✅ SUCCESS: Data flow is working correctly!')
    console.log('   → The issue might be in the frontend (React state, useEffect, etc.)')
  }
  
  console.log('\n============================================================')
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error)
  process.exit(1)
})

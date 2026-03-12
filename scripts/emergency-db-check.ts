/**
 * EMERGENCY: Database Connection and Data Check
 * 
 * Verifies:
 * 1. Both databases are accessible
 * 2. Data exists in Cultura
 * 3. Collections are readable
 */

import { getFirestoreForArea } from '../lib/firebase-config'
import { collection, getDocs, query, limit } from 'firebase/firestore'

console.log('============================================================')
console.log('🚨 EMERGENCY DATABASE CHECK')
console.log('============================================================\n')

async function checkArea(area: 'cultura' | 'deporte') {
  console.log(`\n📊 Checking ${area.toUpperCase()} database...`)
  
  try {
    const db = getFirestoreForArea(area)
    console.log(`  ✓ Database connection established for ${area}`)
    
    // Check user_profiles
    const usersRef = collection(db, 'user_profiles')
    const usersQuery = query(usersRef, limit(5))
    const usersSnapshot = await getDocs(usersQuery)
    console.log(`  ✓ user_profiles: ${usersSnapshot.size} documents (showing first 5)`)
    
    if (usersSnapshot.size > 0) {
      usersSnapshot.docs.forEach((doc, index) => {
        const data = doc.data()
        console.log(`    ${index + 1}. ${data.nombres} - ${data.correo}`)
      })
    }
    
    // Check attendance_entries
    const attendanceRef = collection(db, 'attendance_entries')
    const attendanceQuery = query(attendanceRef, limit(5))
    const attendanceSnapshot = await getDocs(attendanceQuery)
    console.log(`  ✓ attendance_entries: ${attendanceSnapshot.size} documents (showing first 5)`)
    
    // Check cultural_groups
    const groupsRef = collection(db, 'cultural_groups')
    const groupsSnapshot = await getDocs(groupsRef)
    console.log(`  ✓ cultural_groups: ${groupsSnapshot.size} documents`)
    
    if (groupsSnapshot.size > 0) {
      const groups = groupsSnapshot.docs.map(doc => doc.data().nombre).slice(0, 5)
      console.log(`    Groups: ${groups.join(', ')}...`)
    }
    
    return {
      area,
      success: true,
      users: usersSnapshot.size,
      attendance: attendanceSnapshot.size,
      groups: groupsSnapshot.size
    }
    
  } catch (error: any) {
    console.error(`  ✗ ERROR in ${area}:`, error.message)
    return {
      area,
      success: false,
      error: error.message
    }
  }
}

async function main() {
  const culturaResult = await checkArea('cultura')
  const deporteResult = await checkArea('deporte')
  
  console.log('\n============================================================')
  console.log('📋 SUMMARY')
  console.log('============================================================')
  
  console.log('\nCULTURA:')
  if (culturaResult.success) {
    console.log(`  ✓ Connected`)
    console.log(`  Users: ${culturaResult.users}`)
    console.log(`  Attendance: ${culturaResult.attendance}`)
    console.log(`  Groups: ${culturaResult.groups}`)
  } else {
    console.log(`  ✗ ERROR: ${culturaResult.error}`)
  }
  
  console.log('\nDEPORTE:')
  if (deporteResult.success) {
    console.log(`  ✓ Connected`)
    console.log(`  Users: ${deporteResult.users}`)
    console.log(`  Attendance: ${deporteResult.attendance}`)
    console.log(`  Groups: ${deporteResult.groups}`)
  } else {
    console.log(`  ✗ ERROR: ${deporteResult.error}`)
  }
  
  console.log('\n============================================================')
  
  if (!culturaResult.success || !deporteResult.success) {
    console.log('❌ CRITICAL: Database connection issues detected!')
    process.exit(1)
  }
  
  if (culturaResult.users === 0 && culturaResult.attendance === 0) {
    console.log('⚠️  WARNING: Cultura database appears empty!')
  }
  
  console.log('✅ Database check completed')
  console.log('============================================================')
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})

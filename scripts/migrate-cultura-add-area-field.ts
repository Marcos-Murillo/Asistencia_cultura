/**
 * Migration Script: Add 'area' field to existing Cultura documents
 * 
 * This script adds area: 'cultura' to all documents in the Cultura database
 * that don't have this field yet.
 */

import { getFirestoreForArea } from '../lib/firebase-config'
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'

console.log('============================================================')
console.log('🔄 MIGRATING CULTURA DATABASE - ADDING AREA FIELD')
console.log('============================================================\n')

async function migrateCollection(collectionName: string) {
  console.log(`\n📦 Processing collection: ${collectionName}`)
  
  const db = getFirestoreForArea('cultura')
  const collectionRef = collection(db, collectionName)
  const snapshot = await getDocs(collectionRef)
  
  console.log(`  Found ${snapshot.size} documents`)
  
  let updated = 0
  let skipped = 0
  let errors = 0
  
  for (const docSnapshot of snapshot.docs) {
    const data = docSnapshot.data()
    
    if (!data.area) {
      try {
        const docRef = doc(db, collectionName, docSnapshot.id)
        await updateDoc(docRef, { area: 'cultura' })
        updated++
        console.log(`  ✓ Updated: ${docSnapshot.id}`)
      } catch (error: any) {
        errors++
        console.error(`  ✗ Error updating ${docSnapshot.id}:`, error.message)
      }
    } else {
      skipped++
    }
  }
  
  console.log(`\n  Summary for ${collectionName}:`)
  console.log(`    Updated: ${updated}`)
  console.log(`    Skipped (already has area): ${skipped}`)
  console.log(`    Errors: ${errors}`)
  
  return { updated, skipped, errors }
}

async function main() {
  const collections = [
    'user_profiles',
    'attendance_entries',
    'cultural_groups',
    'events',
    'group_enrollments',
    'event_enrollments'
  ]
  
  const results: Record<string, any> = {}
  
  for (const collectionName of collections) {
    try {
      results[collectionName] = await migrateCollection(collectionName)
    } catch (error: any) {
      console.error(`\n❌ Failed to process ${collectionName}:`, error.message)
      results[collectionName] = { error: error.message }
    }
  }
  
  console.log('\n============================================================')
  console.log('📊 MIGRATION SUMMARY')
  console.log('============================================================\n')
  
  let totalUpdated = 0
  let totalSkipped = 0
  let totalErrors = 0
  
  for (const [collection, result] of Object.entries(results)) {
    if (result.error) {
      console.log(`${collection}: ERROR - ${result.error}`)
    } else {
      console.log(`${collection}:`)
      console.log(`  ✓ Updated: ${result.updated}`)
      console.log(`  - Skipped: ${result.skipped}`)
      console.log(`  ✗ Errors: ${result.errors}`)
      
      totalUpdated += result.updated
      totalSkipped += result.skipped
      totalErrors += result.errors
    }
  }
  
  console.log('\nTOTALS:')
  console.log(`  ✓ Total Updated: ${totalUpdated}`)
  console.log(`  - Total Skipped: ${totalSkipped}`)
  console.log(`  ✗ Total Errors: ${totalErrors}`)
  
  console.log('\n============================================================')
  
  if (totalErrors > 0) {
    console.log('⚠️  Migration completed with errors')
    process.exit(1)
  } else {
    console.log('✅ Migration completed successfully!')
    process.exit(0)
  }
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error)
  process.exit(1)
})

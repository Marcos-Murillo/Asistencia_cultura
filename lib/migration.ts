/**
 * Migration utilities for database updates
 */

import { getFirestoreForArea } from './firebase-config'
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'

export interface MigrationResult {
  collection: string
  updated: number
  skipped: number
  errors: number
  errorMessages?: string[]
}

/**
 * Add 'area' field to all documents in a collection that don't have it
 */
async function migrateCollectionAddArea(
  collectionName: string,
  area: 'cultura' | 'deporte'
): Promise<MigrationResult> {
  const db = getFirestoreForArea(area)
  const collectionRef = collection(db, collectionName)
  
  try {
    const snapshot = await getDocs(collectionRef)
    
    let updated = 0
    let skipped = 0
    let errors = 0
    const errorMessages: string[] = []
    
    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data()
      
      if (!data.area) {
        try {
          const docRef = doc(db, collectionName, docSnapshot.id)
          await updateDoc(docRef, { area })
          updated++
        } catch (error: any) {
          errors++
          errorMessages.push(`${docSnapshot.id}: ${error.message}`)
        }
      } else {
        skipped++
      }
    }
    
    return {
      collection: collectionName,
      updated,
      skipped,
      errors,
      errorMessages: errors > 0 ? errorMessages : undefined
    }
  } catch (error: any) {
    return {
      collection: collectionName,
      updated: 0,
      skipped: 0,
      errors: 1,
      errorMessages: [error.message]
    }
  }
}

/**
 * Migrate all Cultura collections to add area field
 */
export async function migrateCulturaAddAreaField(): Promise<MigrationResult[]> {
  const collections = [
    'user_profiles',
    'attendance_entries',
    'cultural_groups',
    'events',
    'group_enrollments',
    'event_enrollments'
  ]
  
  const results: MigrationResult[] = []
  
  for (const collectionName of collections) {
    const result = await migrateCollectionAddArea(collectionName, 'cultura')
    results.push(result)
  }
  
  return results
}

/**
 * Migrate all Deporte collections to add area field (if needed)
 */
export async function migrateDeporteAddAreaField(): Promise<MigrationResult[]> {
  const collections = [
    'user_profiles',
    'attendance_entries',
    'cultural_groups',
    'events',
    'group_enrollments',
    'event_enrollments'
  ]
  
  const results: MigrationResult[] = []
  
  for (const collectionName of collections) {
    const result = await migrateCollectionAddArea(collectionName, 'deporte')
    results.push(result)
  }
  
  return results
}

/**
 * Validation Script for DB Router Validations
 * 
 * This script validates that the validation functions in db-router.ts work correctly:
 * - Area specification validation
 * - Cross-database operation prevention
 * - Transaction boundary enforcement
 * 
 * Task: 21.1 Agregar validaciones en db-router.ts
 */

import { initializeFirebaseApps } from '../lib/firebase-config'
import {
  DataIsolationError,
  beginTransaction,
  endTransaction,
  getAllUsers,
  getAllCulturalGroups
} from '../lib/db-router'

async function validateAreaSpecification() {
  console.log('\n=== Testing Area Specification Validation ===')
  
  // Test 1: Valid areas should work
  try {
    await getAllUsers('cultura')
    console.log('✓ Valid area "cultura" accepted')
  } catch (error) {
    console.error('✗ Valid area "cultura" rejected:', error)
    return false
  }
  
  try {
    await getAllUsers('deporte')
    console.log('✓ Valid area "deporte" accepted')
  } catch (error) {
    console.error('✗ Valid area "deporte" rejected:', error)
    return false
  }
  
  // Test 2: Invalid area should throw DataIsolationError
  try {
    // @ts-expect-error Testing invalid input
    await getAllUsers('invalid')
    console.error('✗ Invalid area was accepted (should have thrown error)')
    return false
  } catch (error) {
    if (error instanceof DataIsolationError) {
      console.log('✓ Invalid area rejected with DataIsolationError')
      console.log(`  Message: ${error.message}`)
    } else {
      console.error('✗ Wrong error type thrown:', error)
      return false
    }
  }
  
  // Test 3: Undefined area should throw DataIsolationError
  try {
    // @ts-expect-error Testing invalid input
    await getAllUsers(undefined)
    console.error('✗ Undefined area was accepted (should have thrown error)')
    return false
  } catch (error) {
    if (error instanceof DataIsolationError) {
      console.log('✓ Undefined area rejected with DataIsolationError')
      console.log(`  Message: ${error.message}`)
    } else {
      console.error('✗ Wrong error type thrown:', error)
      return false
    }
  }
  
  // Test 4: Null area should throw DataIsolationError
  try {
    // @ts-expect-error Testing invalid input
    await getAllUsers(null)
    console.error('✗ Null area was accepted (should have thrown error)')
    return false
  } catch (error) {
    if (error instanceof DataIsolationError) {
      console.log('✓ Null area rejected with DataIsolationError')
      console.log(`  Message: ${error.message}`)
    } else {
      console.error('✗ Wrong error type thrown:', error)
      return false
    }
  }
  
  return true
}

async function validateTransactionBoundaries() {
  console.log('\n=== Testing Transaction Boundary Enforcement ===')
  
  // Test 1: Starting a transaction should work
  try {
    beginTransaction('test-tx-1', 'cultura')
    console.log('✓ Transaction started successfully')
    endTransaction('test-tx-1')
  } catch (error) {
    console.error('✗ Failed to start transaction:', error)
    return false
  }
  
  // Test 2: Same transaction ID with same area should work
  try {
    beginTransaction('test-tx-2', 'cultura')
    beginTransaction('test-tx-2', 'cultura')
    console.log('✓ Same transaction ID with same area accepted')
    endTransaction('test-tx-2')
  } catch (error) {
    console.error('✗ Same transaction ID with same area rejected:', error)
    endTransaction('test-tx-2')
    return false
  }
  
  // Test 3: Same transaction ID with different area should throw
  try {
    beginTransaction('test-tx-3', 'cultura')
    beginTransaction('test-tx-3', 'deporte')
    console.error('✗ Cross-database transaction was accepted (should have thrown error)')
    endTransaction('test-tx-3')
    return false
  } catch (error) {
    if (error instanceof DataIsolationError) {
      console.log('✓ Cross-database transaction rejected with DataIsolationError')
      console.log(`  Message: ${error.message}`)
      endTransaction('test-tx-3')
    } else {
      console.error('✗ Wrong error type thrown:', error)
      endTransaction('test-tx-3')
      return false
    }
  }
  
  // Test 4: Reusing transaction ID after ending should work
  try {
    beginTransaction('test-tx-4', 'cultura')
    endTransaction('test-tx-4')
    beginTransaction('test-tx-4', 'deporte')
    console.log('✓ Reusing transaction ID after ending accepted')
    endTransaction('test-tx-4')
  } catch (error) {
    console.error('✗ Reusing transaction ID after ending rejected:', error)
    endTransaction('test-tx-4')
    return false
  }
  
  // Test 5: Invalid area in transaction should throw
  try {
    // @ts-expect-error Testing invalid input
    beginTransaction('test-tx-5', 'invalid')
    console.error('✗ Invalid area in transaction was accepted (should have thrown error)')
    endTransaction('test-tx-5')
    return false
  } catch (error) {
    if (error instanceof DataIsolationError) {
      console.log('✓ Invalid area in transaction rejected with DataIsolationError')
      console.log(`  Message: ${error.message}`)
    } else {
      console.error('✗ Wrong error type thrown:', error)
      return false
    }
  }
  
  return true
}

async function validateDataIsolation() {
  console.log('\n=== Testing Data Isolation ===')
  
  // Test 1: Get users from both areas
  try {
    const culturaUsers = await getAllUsers('cultura')
    const deporteUsers = await getAllUsers('deporte')
    
    console.log(`✓ Retrieved ${culturaUsers.length} users from Cultura`)
    console.log(`✓ Retrieved ${deporteUsers.length} users from Deporte`)
    
    // Check for ID overlap
    const culturaIds = new Set(culturaUsers.map(u => u.id))
    const deporteIds = new Set(deporteUsers.map(u => u.id))
    const overlap = Array.from(culturaIds).filter(id => deporteIds.has(id))
    
    if (overlap.length === 0) {
      console.log('✓ No user ID overlap between areas')
    } else {
      console.error(`✗ Found ${overlap.length} overlapping user IDs:`, overlap)
      return false
    }
  } catch (error) {
    console.error('✗ Failed to retrieve users:', error)
    return false
  }
  
  // Test 2: Get groups from both areas
  try {
    const culturaGroups = await getAllCulturalGroups('cultura')
    const deporteGroups = await getAllCulturalGroups('deporte')
    
    console.log(`✓ Retrieved ${culturaGroups.length} groups from Cultura`)
    console.log(`✓ Retrieved ${deporteGroups.length} groups from Deporte`)
    
    // Check for ID overlap
    const culturaIds = new Set(culturaGroups.map(g => g.id))
    const deporteIds = new Set(deporteGroups.map(g => g.id))
    const overlap = Array.from(culturaIds).filter(id => deporteIds.has(id))
    
    if (overlap.length === 0) {
      console.log('✓ No group ID overlap between areas')
    } else {
      console.error(`✗ Found ${overlap.length} overlapping group IDs:`, overlap)
      return false
    }
  } catch (error) {
    console.error('✗ Failed to retrieve groups:', error)
    return false
  }
  
  return true
}

async function main() {
  console.log('Starting DB Router Validations Test...')
  console.log('=====================================')
  
  try {
    // Initialize Firebase
    initializeFirebaseApps()
    console.log('✓ Firebase apps initialized')
    
    // Run validation tests
    const areaValidation = await validateAreaSpecification()
    const transactionValidation = await validateTransactionBoundaries()
    const isolationValidation = await validateDataIsolation()
    
    // Summary
    console.log('\n=== Validation Summary ===')
    console.log(`Area Specification: ${areaValidation ? '✓ PASS' : '✗ FAIL'}`)
    console.log(`Transaction Boundaries: ${transactionValidation ? '✓ PASS' : '✗ FAIL'}`)
    console.log(`Data Isolation: ${isolationValidation ? '✓ PASS' : '✗ FAIL'}`)
    
    if (areaValidation && transactionValidation && isolationValidation) {
      console.log('\n✓ All validations passed!')
      process.exit(0)
    } else {
      console.log('\n✗ Some validations failed')
      process.exit(1)
    }
  } catch (error) {
    console.error('\n✗ Validation script failed:', error)
    process.exit(1)
  }
}

main()

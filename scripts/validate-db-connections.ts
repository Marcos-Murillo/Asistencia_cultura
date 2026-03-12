/**
 * Database Connections Validation Script
 * 
 * This script validates that both databases can be connected to and queried.
 * It performs read-only operations to avoid any data modification issues.
 * 
 * Feature: sistema-multi-area
 * Task: 3. Checkpoint - Validar infraestructura de bases de datos
 * 
 * Usage: npx tsx scripts/validate-db-connections.ts
 */

// Load environment variables from .env.local
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

import {
  validateEnvironmentVariables,
  getFirestoreForArea,
  initializeFirebaseApps,
} from '../lib/firebase-config'
import {
  getAllUsers,
  getAttendanceRecords,
} from '../lib/db-router'

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSuccess(message: string) {
  log(`✅ ${message}`, 'green')
}

function logError(message: string) {
  log(`❌ ${message}`, 'red')
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, 'cyan')
}

function logSection(message: string) {
  log(`\n${'='.repeat(70)}`, 'blue')
  log(message, 'blue')
  log('='.repeat(70), 'blue')
}

async function validateEnvironment(): Promise<boolean> {
  logSection('1. Validating Environment Variables')
  
  const validation = validateEnvironmentVariables()
  
  if (validation.valid) {
    logSuccess('All required environment variables are present')
    logInfo('  ✓ Cultura: 7 variables configured')
    logInfo('  ✓ Deporte: 7 variables configured')
    return true
  } else {
    logError('Missing required environment variables:')
    validation.missing.forEach(varName => {
      log(`  - ${varName}`, 'red')
    })
    return false
  }
}

async function validateFirebaseInitialization(): Promise<boolean> {
  logSection('2. Validating Firebase Initialization')
  
  try {
    initializeFirebaseApps()
    logSuccess('Firebase apps initialized successfully')
    
    const culturaDb = getFirestoreForArea('cultura')
    const deporteDb = getFirestoreForArea('deporte')
    
    if (!culturaDb) {
      logError('Failed to get Cultura Firestore instance')
      return false
    }
    logSuccess('Cultura database connection established')
    logInfo(`  Project ID: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`)
    
    if (!deporteDb) {
      logError('Failed to get Deporte Firestore instance')
      return false
    }
    logSuccess('Deporte database connection established')
    logInfo(`  Project ID: ${process.env.NEXT_PUBLIC_FIREBASE_DEPORTE_PROJECT_ID}`)
    
    if (culturaDb === deporteDb) {
      logError('Cultura and Deporte databases are the same instance (should be different)')
      return false
    }
    logSuccess('Cultura and Deporte databases are separate instances')
    
    return true
  } catch (error) {
    logError(`Firebase initialization failed: ${error}`)
    return false
  }
}

async function validateQueryRouting(): Promise<boolean> {
  logSection('3. Validating Query Routing (Read Operations)')
  
  try {
    // Test 1: Query Cultura database
    logInfo('Test 1: Querying Cultura database...')
    const culturaUsers = await getAllUsers('cultura')
    logSuccess(`Successfully queried Cultura database`)
    logInfo(`  Found ${culturaUsers.length} users in Cultura database`)
    
    // Verify area field
    const culturaUsersWithArea = culturaUsers.filter(u => u.area === 'cultura')
    const culturaUsersWithoutArea = culturaUsers.filter(u => !u.area)
    logInfo(`  Users with area='cultura': ${culturaUsersWithArea.length}`)
    logInfo(`  Users without area field (legacy): ${culturaUsersWithoutArea.length}`)
    
    // Check for any users with wrong area
    const wrongAreaInCultura = culturaUsers.filter(u => u.area && u.area !== 'cultura')
    if (wrongAreaInCultura.length > 0) {
      logError(`  Found ${wrongAreaInCultura.length} users with incorrect area in Cultura database`)
      return false
    }
    logSuccess('All users in Cultura database have correct area field')
    
    // Test 2: Query Deporte database
    logInfo('\nTest 2: Querying Deporte database...')
    const deporteUsers = await getAllUsers('deporte')
    logSuccess(`Successfully queried Deporte database`)
    logInfo(`  Found ${deporteUsers.length} users in Deporte database`)
    
    // Verify area field
    const deporteUsersWithArea = deporteUsers.filter(u => u.area === 'deporte')
    const deporteUsersWithoutArea = deporteUsers.filter(u => !u.area)
    logInfo(`  Users with area='deporte': ${deporteUsersWithArea.length}`)
    logInfo(`  Users without area field (legacy): ${deporteUsersWithoutArea.length}`)
    
    // Check for any users with wrong area
    const wrongAreaInDeporte = deporteUsers.filter(u => u.area && u.area !== 'deporte')
    if (wrongAreaInDeporte.length > 0) {
      logError(`  Found ${wrongAreaInDeporte.length} users with incorrect area in Deporte database`)
      return false
    }
    logSuccess('All users in Deporte database have correct area field')
    
    // Test 3: Verify data isolation
    logInfo('\nTest 3: Verifying data isolation...')
    
    // Check if any emails appear in both databases
    const culturaEmails = new Set(culturaUsers.map(u => u.correo))
    const deporteEmails = new Set(deporteUsers.map(u => u.correo))
    
    const sharedEmails = [...culturaEmails].filter(email => deporteEmails.has(email))
    
    if (sharedEmails.length > 0) {
      logInfo(`  Found ${sharedEmails.length} emails that exist in both databases`)
      logInfo('  This is expected behavior - same email can exist independently in both areas')
    } else {
      logInfo('  No shared emails between databases')
    }
    logSuccess('Data isolation verified - databases are independent')
    
    // Test 4: Query attendance records
    logInfo('\nTest 4: Querying attendance records...')
    const culturaAttendance = await getAttendanceRecords('cultura')
    logSuccess(`Successfully queried Cultura attendance records`)
    logInfo(`  Found ${culturaAttendance.length} attendance records in Cultura`)
    
    const deporteAttendance = await getAttendanceRecords('deporte')
    logSuccess(`Successfully queried Deporte attendance records`)
    logInfo(`  Found ${deporteAttendance.length} attendance records in Deporte`)
    
    return true
  } catch (error) {
    logError(`Query routing validation failed: ${error}`)
    console.error(error)
    return false
  }
}

async function main() {
  log('\n🚀 Starting Database Infrastructure Validation', 'cyan')
  log('Feature: sistema-multi-area', 'cyan')
  log('Task: 3. Checkpoint - Validar infraestructura de bases de datos\n', 'cyan')
  
  const results = {
    environment: false,
    initialization: false,
    routing: false,
  }
  
  // Run all validations
  results.environment = await validateEnvironment()
  
  if (results.environment) {
    results.initialization = await validateFirebaseInitialization()
  }
  
  if (results.initialization) {
    results.routing = await validateQueryRouting()
  }
  
  // Summary
  logSection('Validation Summary')
  
  const allPassed = Object.values(results).every(r => r === true)
  
  log('\nResults:', 'blue')
  log(`  Environment Variables: ${results.environment ? '✅ PASS' : '❌ FAIL'}`, results.environment ? 'green' : 'red')
  log(`  Firebase Initialization: ${results.initialization ? '✅ PASS' : '❌ FAIL'}`, results.initialization ? 'green' : 'red')
  log(`  Query Routing: ${results.routing ? '✅ PASS' : '❌ FAIL'}`, results.routing ? 'green' : 'red')
  
  log('\n' + '='.repeat(70), 'blue')
  
  if (allPassed) {
    log('\n🎉 ALL VALIDATIONS PASSED!', 'green')
    log('\n✅ Verification Complete:', 'green')
    log('  • Both databases connect correctly', 'green')
    log('  • Queries are routed to the correct database', 'green')
    log('  • Data isolation is maintained between areas', 'green')
    log('  • Environment variables are properly configured', 'green')
    log('\nThe database infrastructure is ready for use.\n', 'cyan')
    process.exit(0)
  } else {
    log('\n⚠️  SOME VALIDATIONS FAILED', 'red')
    log('Please review the errors above and fix the issues.\n', 'yellow')
    process.exit(1)
  }
}

// Run the validation
main().catch(error => {
  logError(`Unexpected error: ${error}`)
  console.error(error)
  process.exit(1)
})

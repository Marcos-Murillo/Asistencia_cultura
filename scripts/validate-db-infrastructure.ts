/**
 * Database Infrastructure Validation Script
 * 
 * This script validates the multi-area database infrastructure:
 * - Both databases (Cultura and Deporte) connect correctly
 * - Queries are routed to the correct database
 * - Environment variables are properly configured
 * 
 * Feature: sistema-multi-area
 * Task: 3. Checkpoint - Validar infraestructura de bases de datos
 * 
 * Usage: npx tsx scripts/validate-db-infrastructure.ts
 */

// Load environment variables from .env.local
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

import {
  validateEnvironmentVariables,
  getFirestoreForArea,
  initializeFirebaseApps,
  type Area
} from '../lib/firebase-config'
import {
  saveUserProfile,
  getAllUsers,
  getUserById,
} from '../lib/db-router'
import type { UserProfile } from '../lib/types'

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
  log(`\n${'='.repeat(60)}`, 'blue')
  log(message, 'blue')
  log('='.repeat(60), 'blue')
}

async function validateEnvironment(): Promise<boolean> {
  logSection('1. Validating Environment Variables')
  
  const validation = validateEnvironmentVariables()
  
  if (validation.valid) {
    logSuccess('All required environment variables are present')
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
    
    if (!deporteDb) {
      logError('Failed to get Deporte Firestore instance')
      return false
    }
    logSuccess('Deporte database connection established')
    
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
  logSection('3. Validating Query Routing')
  
  try {
    // Test 1: Save user to Cultura
    logInfo('Test 1: Saving user to Cultura database...')
    const testUserCultura: Omit<UserProfile, "id" | "createdAt" | "lastAttendance"> = {
      nombres: 'Validation Test Cultura',
      correo: `validation-cultura-${Date.now()}@test.com`,
      numeroDocumento: '9999999991',
      telefono: '3009999991',
      genero: 'OTRO',
      etnia: 'MESTIZO',
      tipoDocumento: 'CEDULA',
      edad: 25,
      sede: 'Meléndez',
      estamento: 'ESTUDIANTE',
      area: 'cultura'
    }
    
    const culturaUserId = await saveUserProfile('cultura', testUserCultura)
    if (!culturaUserId) {
      logError('Failed to save user to Cultura database')
      return false
    }
    logSuccess(`User saved to Cultura database with ID: ${culturaUserId}`)
    
    // Test 2: Save user to Deporte
    logInfo('Test 2: Saving user to Deporte database...')
    const testUserDeporte: Omit<UserProfile, "id" | "createdAt" | "lastAttendance"> = {
      nombres: 'Validation Test Deporte',
      correo: `validation-deporte-${Date.now()}@test.com`,
      numeroDocumento: '9999999992',
      telefono: '3009999992',
      genero: 'OTRO',
      etnia: 'MESTIZO',
      tipoDocumento: 'CEDULA',
      edad: 22,
      sede: 'Meléndez',
      estamento: 'ESTUDIANTE',
      area: 'deporte',
      codigoEstudiantil: '2099999'
    }
    
    const deporteUserId = await saveUserProfile('deporte', testUserDeporte)
    if (!deporteUserId) {
      logError('Failed to save user to Deporte database')
      return false
    }
    logSuccess(`User saved to Deporte database with ID: ${deporteUserId}`)
    
    // Test 3: Retrieve user from Cultura
    logInfo('Test 3: Retrieving user from Cultura database...')
    const retrievedCultura = await getUserById('cultura', culturaUserId)
    if (!retrievedCultura) {
      logError('Failed to retrieve user from Cultura database')
      return false
    }
    if (retrievedCultura.nombres !== testUserCultura.nombres) {
      logError('Retrieved user data does not match saved data')
      return false
    }
    logSuccess('User retrieved successfully from Cultura database')
    
    // Test 4: Retrieve user from Deporte
    logInfo('Test 4: Retrieving user from Deporte database...')
    const retrievedDeporte = await getUserById('deporte', deporteUserId)
    if (!retrievedDeporte) {
      logError('Failed to retrieve user from Deporte database')
      return false
    }
    if (retrievedDeporte.nombres !== testUserDeporte.nombres) {
      logError('Retrieved user data does not match saved data')
      return false
    }
    if (retrievedDeporte.codigoEstudiantil !== '2099999') {
      logError('Codigo estudiantil not saved correctly')
      return false
    }
    logSuccess('User retrieved successfully from Deporte database with codigo estudiantil')
    
    // Test 5: Verify data isolation - Cultura user should not be in Deporte
    logInfo('Test 5: Verifying data isolation (Cultura user not in Deporte)...')
    const culturaUserInDeporte = await getUserById('deporte', culturaUserId)
    if (culturaUserInDeporte !== null) {
      logError('Cultura user found in Deporte database (data isolation violated)')
      return false
    }
    logSuccess('Data isolation verified: Cultura user not found in Deporte database')
    
    // Test 6: Verify data isolation - Deporte user should not be in Cultura
    logInfo('Test 6: Verifying data isolation (Deporte user not in Cultura)...')
    const deporteUserInCultura = await getUserById('cultura', deporteUserId)
    if (deporteUserInCultura !== null) {
      logError('Deporte user found in Cultura database (data isolation violated)')
      return false
    }
    logSuccess('Data isolation verified: Deporte user not found in Cultura database')
    
    return true
  } catch (error) {
    logError(`Query routing validation failed: ${error}`)
    console.error(error)
    return false
  }
}

async function validateDataRetrieval(): Promise<boolean> {
  logSection('4. Validating Data Retrieval by Area')
  
  try {
    // Test 1: Get all users from Cultura
    logInfo('Test 1: Retrieving all users from Cultura database...')
    const culturaUsers = await getAllUsers('cultura')
    logSuccess(`Retrieved ${culturaUsers.length} users from Cultura database`)
    
    // Verify all users have correct area or undefined (legacy)
    const invalidCulturaUsers = culturaUsers.filter(u => u.area && u.area !== 'cultura')
    if (invalidCulturaUsers.length > 0) {
      logError(`Found ${invalidCulturaUsers.length} users with incorrect area in Cultura database`)
      return false
    }
    logSuccess('All Cultura users have correct area field')
    
    // Test 2: Get all users from Deporte
    logInfo('Test 2: Retrieving all users from Deporte database...')
    const deporteUsers = await getAllUsers('deporte')
    logSuccess(`Retrieved ${deporteUsers.length} users from Deporte database`)
    
    // Verify all users have correct area or undefined (legacy)
    const invalidDeporteUsers = deporteUsers.filter(u => u.area && u.area !== 'deporte')
    if (invalidDeporteUsers.length > 0) {
      logError(`Found ${invalidDeporteUsers.length} users with incorrect area in Deporte database`)
      return false
    }
    logSuccess('All Deporte users have correct area field')
    
    return true
  } catch (error) {
    logError(`Data retrieval validation failed: ${error}`)
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
    retrieval: false,
  }
  
  // Run all validations
  results.environment = await validateEnvironment()
  
  if (results.environment) {
    results.initialization = await validateFirebaseInitialization()
  }
  
  if (results.initialization) {
    results.routing = await validateQueryRouting()
  }
  
  if (results.routing) {
    results.retrieval = await validateDataRetrieval()
  }
  
  // Summary
  logSection('Validation Summary')
  
  const allPassed = Object.values(results).every(r => r === true)
  
  log('\nResults:', 'blue')
  log(`  Environment Variables: ${results.environment ? '✅ PASS' : '❌ FAIL'}`, results.environment ? 'green' : 'red')
  log(`  Firebase Initialization: ${results.initialization ? '✅ PASS' : '❌ FAIL'}`, results.initialization ? 'green' : 'red')
  log(`  Query Routing: ${results.routing ? '✅ PASS' : '❌ FAIL'}`, results.routing ? 'green' : 'red')
  log(`  Data Retrieval: ${results.retrieval ? '✅ PASS' : '❌ FAIL'}`, results.retrieval ? 'green' : 'red')
  
  log('\n' + '='.repeat(60), 'blue')
  
  if (allPassed) {
    log('\n🎉 ALL VALIDATIONS PASSED!', 'green')
    log('✅ Both databases connect correctly', 'green')
    log('✅ Queries are routed to the correct database', 'green')
    log('✅ Data isolation is maintained between areas', 'green')
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

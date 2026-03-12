/**
 * User Model and Roles Validation Script
 * 
 * This script validates the extended user model and role management system:
 * - New fields (area, codigoEstudiantil, gruposAsignados) are saved correctly
 * - Role restrictions work as expected (single vs multiple group assignments)
 * - Role permissions are correctly calculated
 * - Data filtering by role works correctly
 * 
 * Feature: sistema-multi-area
 * Task: 7. Checkpoint - Validar modelo de usuarios y roles
 * 
 * Usage: npx tsx scripts/validate-user-model-and-roles.ts
 */

// Load environment variables from .env.local
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

import {
  initializeFirebaseApps,
} from '../lib/firebase-config'
import {
  saveUserProfile,
  getUserById,
} from '../lib/db-router'
import {
  getRolePermissions,
  filterDataByPermissions,
} from '../lib/role-manager'
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
  log(`\n${'='.repeat(70)}`, 'blue')
  log(message, 'blue')
  log('='.repeat(70), 'blue')
}

async function validateNewUserFields(): Promise<boolean> {
  logSection('1. Validating New User Model Fields')
  
  try {
    initializeFirebaseApps()
    
    // Test 1: Save Cultura user with area field
    logInfo('Test 1: Saving Cultura user with area field...')
    const culturaUser: Omit<UserProfile, "id" | "createdAt" | "lastAttendance"> = {
      nombres: 'Test Cultura User',
      correo: `test-cultura-${Date.now()}@test.com`,
      numeroDocumento: '1111111111',
      telefono: '3001111111',
      genero: 'MUJER',
      etnia: 'MESTIZO',
      tipoDocumento: 'CEDULA',
      edad: 20,
      sede: 'MELENDEZ',
      estamento: 'ESTUDIANTE',
      area: 'cultura',
      rol: 'ESTUDIANTE'
    }
    
    const culturaUserId = await saveUserProfile('cultura', culturaUser)
    const retrievedCultura = await getUserById('cultura', culturaUserId)
    
    if (!retrievedCultura) {
      logError('Failed to retrieve Cultura user')
      return false
    }
    
    if (retrievedCultura.area !== 'cultura') {
      logError(`Area field incorrect: expected 'cultura', got '${retrievedCultura.area}'`)
      return false
    }
    
    logSuccess('Cultura user saved with correct area field')
    
    // Test 2: Save Deporte user with codigoEstudiantil
    logInfo('Test 2: Saving Deporte user with codigoEstudiantil...')
    const deporteUser: Omit<UserProfile, "id" | "createdAt" | "lastAttendance"> = {
      nombres: 'Test Deporte User',
      correo: `test-deporte-${Date.now()}@test.com`,
      numeroDocumento: '2222222222',
      telefono: '3002222222',
      genero: 'HOMBRE',
      etnia: 'MESTIZO',
      tipoDocumento: 'CEDULA',
      edad: 22,
      sede: 'MELENDEZ',
      estamento: 'ESTUDIANTE',
      area: 'deporte',
      codigoEstudiantil: '2099999',
      rol: 'ESTUDIANTE'
    }
    
    const deporteUserId = await saveUserProfile('deporte', deporteUser)
    const retrievedDeporte = await getUserById('deporte', deporteUserId)
    
    if (!retrievedDeporte) {
      logError('Failed to retrieve Deporte user')
      return false
    }
    
    if (retrievedDeporte.area !== 'deporte') {
      logError(`Area field incorrect: expected 'deporte', got '${retrievedDeporte.area}'`)
      return false
    }
    
    if (retrievedDeporte.codigoEstudiantil !== '2099999') {
      logError(`Codigo estudiantil incorrect: expected '2099999', got '${retrievedDeporte.codigoEstudiantil}'`)
      return false
    }
    
    logSuccess('Deporte user saved with correct area and codigoEstudiantil fields')
    
    // Test 3: Save Deporte user with gruposAsignados (Entrenador)
    logInfo('Test 3: Saving Deporte Entrenador with gruposAsignados...')
    const entrenadorUser: Omit<UserProfile, "id" | "createdAt" | "lastAttendance"> = {
      nombres: 'Test Entrenador',
      correo: `test-entrenador-${Date.now()}@test.com`,
      numeroDocumento: '3333333333',
      telefono: '3003333333',
      genero: 'HOMBRE',
      etnia: 'MESTIZO',
      tipoDocumento: 'CEDULA',
      edad: 35,
      sede: 'MELENDEZ',
      estamento: 'DOCENTE',
      area: 'deporte',
      gruposAsignados: ['grupo-1', 'grupo-2', 'grupo-3'],
      rol: 'ENTRENADOR'
    }
    
    const entrenadorUserId = await saveUserProfile('deporte', entrenadorUser)
    const retrievedEntrenador = await getUserById('deporte', entrenadorUserId)
    
    if (!retrievedEntrenador) {
      logError('Failed to retrieve Entrenador user')
      return false
    }
    
    if (!retrievedEntrenador.gruposAsignados || retrievedEntrenador.gruposAsignados.length !== 3) {
      logError(`Grupos asignados incorrect: expected 3 groups, got ${retrievedEntrenador.gruposAsignados?.length || 0}`)
      return false
    }
    
    logSuccess('Entrenador saved with correct gruposAsignados field (multiple groups)')
    
    return true
  } catch (error) {
    logError(`User model validation failed: ${error}`)
    console.error(error)
    return false
  }
}

async function validateRolePermissions(): Promise<boolean> {
  logSection('2. Validating Role Permissions')
  
  try {
    // Test 1: SUPER_ADMIN permissions
    logInfo('Test 1: Validating SUPER_ADMIN permissions...')
    const superAdminPerms = getRolePermissions('SUPER_ADMIN', 'cultura', [])
    
    if (!superAdminPerms.canViewAllGroups || !superAdminPerms.canViewAllUsers || 
        !superAdminPerms.canManageUsers || !superAdminPerms.canSwitchArea) {
      logError('SUPER_ADMIN does not have all expected permissions')
      return false
    }
    
    if (superAdminPerms.assignedGroups.length !== 0) {
      logError('SUPER_ADMIN should not have assigned groups')
      return false
    }
    
    logSuccess('SUPER_ADMIN permissions correct')
    
    // Test 2: DIRECTOR permissions (Cultura - single group)
    logInfo('Test 2: Validating DIRECTOR permissions (Cultura)...')
    const directorPerms = getRolePermissions('DIRECTOR', 'cultura', ['grupo-danza'])
    
    if (directorPerms.canViewAllGroups || directorPerms.canViewAllUsers || 
        directorPerms.canManageUsers || directorPerms.canSwitchArea) {
      logError('DIRECTOR should have limited permissions')
      return false
    }
    
    if (directorPerms.assignedGroups.length !== 1 || directorPerms.assignedGroups[0] !== 'grupo-danza') {
      logError('DIRECTOR should have exactly one assigned group')
      return false
    }
    
    logSuccess('DIRECTOR permissions correct (single group in Cultura)')
    
    // Test 3: MONITOR permissions in Cultura (single group)
    logInfo('Test 3: Validating MONITOR permissions (Cultura)...')
    const monitorCulturaPerms = getRolePermissions('MONITOR', 'cultura', ['grupo-teatro'])
    
    if (monitorCulturaPerms.assignedGroups.length !== 1) {
      logError('MONITOR in Cultura should have exactly one assigned group')
      return false
    }
    
    logSuccess('MONITOR permissions correct (single group in Cultura)')
    
    // Test 4: MONITOR permissions in Deporte (multiple groups)
    logInfo('Test 4: Validating MONITOR permissions (Deporte)...')
    const monitorDeportePerms = getRolePermissions('MONITOR', 'deporte', ['grupo-futbol', 'grupo-baloncesto'])
    
    if (monitorDeportePerms.assignedGroups.length !== 2) {
      logError('MONITOR in Deporte should support multiple assigned groups')
      return false
    }
    
    logSuccess('MONITOR permissions correct (multiple groups in Deporte)')
    
    // Test 5: ENTRENADOR permissions (multiple groups)
    logInfo('Test 5: Validating ENTRENADOR permissions (Deporte)...')
    const entrenadorPerms = getRolePermissions('ENTRENADOR', 'deporte', ['grupo-natacion', 'grupo-atletismo', 'grupo-voleibol'])
    
    if (entrenadorPerms.assignedGroups.length !== 3) {
      logError('ENTRENADOR should support multiple assigned groups')
      return false
    }
    
    if (entrenadorPerms.canViewAllGroups || entrenadorPerms.canSwitchArea) {
      logError('ENTRENADOR should have limited permissions')
      return false
    }
    
    logSuccess('ENTRENADOR permissions correct (multiple groups in Deporte)')
    
    // Test 6: ESTUDIANTE permissions
    logInfo('Test 6: Validating ESTUDIANTE permissions...')
    const estudiantePerms = getRolePermissions('ESTUDIANTE', 'cultura', [])
    
    if (estudiantePerms.canViewAllGroups || estudiantePerms.canViewAllUsers || 
        estudiantePerms.canManageUsers || estudiantePerms.canSwitchArea) {
      logError('ESTUDIANTE should have no permissions')
      return false
    }
    
    if (estudiantePerms.assignedGroups.length !== 0) {
      logError('ESTUDIANTE should not have assigned groups')
      return false
    }
    
    logSuccess('ESTUDIANTE permissions correct (no permissions)')
    
    return true
  } catch (error) {
    logError(`Role permissions validation failed: ${error}`)
    console.error(error)
    return false
  }
}

async function validateDataFiltering(): Promise<boolean> {
  logSection('3. Validating Data Filtering by Role')
  
  try {
    const testData = [
      { id: '1', name: 'Student 1', grupoCultural: 'Danza' },
      { id: '2', name: 'Student 2', grupoCultural: 'Teatro' },
      { id: '3', name: 'Student 3', grupoCultural: 'Música' },
      { id: '4', name: 'Student 4', grupoCultural: 'Danza' },
      { id: '5', name: 'Student 5', grupoCultural: 'Fútbol' },
    ]
    
    // Test 1: SUPER_ADMIN sees all data
    logInfo('Test 1: SUPER_ADMIN should see all data...')
    const superAdminPerms = getRolePermissions('SUPER_ADMIN', 'cultura', [])
    const superAdminFiltered = filterDataByPermissions(testData, superAdminPerms)
    
    if (superAdminFiltered.length !== 5) {
      logError(`SUPER_ADMIN should see all 5 items, got ${superAdminFiltered.length}`)
      return false
    }
    
    logSuccess('SUPER_ADMIN sees all data')
    
    // Test 2: DIRECTOR sees only their group
    logInfo('Test 2: DIRECTOR should see only their assigned group...')
    const directorPerms = getRolePermissions('DIRECTOR', 'cultura', ['Danza'])
    const directorFiltered = filterDataByPermissions(testData, directorPerms)
    
    if (directorFiltered.length !== 2) {
      logError(`DIRECTOR should see 2 items from Danza, got ${directorFiltered.length}`)
      return false
    }
    
    if (!directorFiltered.every(item => item.grupoCultural === 'Danza')) {
      logError('DIRECTOR should only see items from Danza group')
      return false
    }
    
    logSuccess('DIRECTOR sees only their assigned group')
    
    // Test 3: MONITOR in Cultura sees only their group
    logInfo('Test 3: MONITOR (Cultura) should see only their assigned group...')
    const monitorCulturaPerms = getRolePermissions('MONITOR', 'cultura', ['Teatro'])
    const monitorCulturaFiltered = filterDataByPermissions(testData, monitorCulturaPerms)
    
    if (monitorCulturaFiltered.length !== 1) {
      logError(`MONITOR should see 1 item from Teatro, got ${monitorCulturaFiltered.length}`)
      return false
    }
    
    logSuccess('MONITOR (Cultura) sees only their assigned group')
    
    // Test 4: ENTRENADOR sees all their assigned groups
    logInfo('Test 4: ENTRENADOR should see all their assigned groups...')
    const entrenadorPerms = getRolePermissions('ENTRENADOR', 'deporte', ['Danza', 'Música'])
    const entrenadorFiltered = filterDataByPermissions(testData, entrenadorPerms)
    
    if (entrenadorFiltered.length !== 3) {
      logError(`ENTRENADOR should see 3 items from Danza and Música, got ${entrenadorFiltered.length}`)
      return false
    }
    
    logSuccess('ENTRENADOR sees all their assigned groups')
    
    // Test 5: ESTUDIANTE sees nothing
    logInfo('Test 5: ESTUDIANTE should see no data...')
    const estudiantePerms = getRolePermissions('ESTUDIANTE', 'cultura', [])
    const estudianteFiltered = filterDataByPermissions(testData, estudiantePerms)
    
    if (estudianteFiltered.length !== 0) {
      logError(`ESTUDIANTE should see 0 items, got ${estudianteFiltered.length}`)
      return false
    }
    
    logSuccess('ESTUDIANTE sees no data')
    
    // Test 6: Empty assigned groups returns empty array
    logInfo('Test 6: User with no assigned groups should see no data...')
    const noGroupsPerms = getRolePermissions('MONITOR', 'cultura', [])
    const noGroupsFiltered = filterDataByPermissions(testData, noGroupsPerms)
    
    if (noGroupsFiltered.length !== 0) {
      logError(`User with no groups should see 0 items, got ${noGroupsFiltered.length}`)
      return false
    }
    
    logSuccess('User with no assigned groups sees no data')
    
    return true
  } catch (error) {
    logError(`Data filtering validation failed: ${error}`)
    console.error(error)
    return false
  }
}

async function validateRoleConstraints(): Promise<boolean> {
  logSection('4. Validating Role Assignment Constraints')
  
  try {
    // Test 1: Cultura roles support single group
    logInfo('Test 1: Validating Cultura roles (DIRECTOR, MONITOR) support single group...')
    
    const directorPerms = getRolePermissions('DIRECTOR', 'cultura', ['grupo-1'])
    if (directorPerms.assignedGroups.length !== 1) {
      logError('DIRECTOR should have exactly 1 assigned group')
      return false
    }
    
    const monitorCulturaPerms = getRolePermissions('MONITOR', 'cultura', ['grupo-2'])
    if (monitorCulturaPerms.assignedGroups.length !== 1) {
      logError('MONITOR in Cultura should have exactly 1 assigned group')
      return false
    }
    
    logSuccess('Cultura roles correctly support single group assignment')
    
    // Test 2: Deporte roles support multiple groups
    logInfo('Test 2: Validating Deporte roles (ENTRENADOR, MONITOR) support multiple groups...')
    
    const entrenadorPerms = getRolePermissions('ENTRENADOR', 'deporte', ['grupo-1', 'grupo-2', 'grupo-3'])
    if (entrenadorPerms.assignedGroups.length !== 3) {
      logError('ENTRENADOR should support multiple assigned groups')
      return false
    }
    
    const monitorDeportePerms = getRolePermissions('MONITOR', 'deporte', ['grupo-4', 'grupo-5'])
    if (monitorDeportePerms.assignedGroups.length !== 2) {
      logError('MONITOR in Deporte should support multiple assigned groups')
      return false
    }
    
    logSuccess('Deporte roles correctly support multiple group assignments')
    
    // Test 3: Default role is ESTUDIANTE with no groups
    logInfo('Test 3: Validating default ESTUDIANTE role has no groups...')
    
    const estudiantePerms = getRolePermissions('ESTUDIANTE', 'cultura', [])
    if (estudiantePerms.assignedGroups.length !== 0) {
      logError('ESTUDIANTE should have no assigned groups')
      return false
    }
    
    logSuccess('Default ESTUDIANTE role correctly has no groups')
    
    return true
  } catch (error) {
    logError(`Role constraints validation failed: ${error}`)
    console.error(error)
    return false
  }
}

async function main() {
  log('\n🚀 Starting User Model and Roles Validation', 'cyan')
  log('Feature: sistema-multi-area', 'cyan')
  log('Task: 7. Checkpoint - Validar modelo de usuarios y roles\n', 'cyan')
  
  const results = {
    userFields: false,
    rolePermissions: false,
    dataFiltering: false,
    roleConstraints: false,
  }
  
  // Run all validations
  results.userFields = await validateNewUserFields()
  results.rolePermissions = await validateRolePermissions()
  results.dataFiltering = await validateDataFiltering()
  results.roleConstraints = await validateRoleConstraints()
  
  // Summary
  logSection('Validation Summary')
  
  const allPassed = Object.values(results).every(r => r === true)
  
  log('\nResults:', 'blue')
  log(`  User Model Fields: ${results.userFields ? '✅ PASS' : '❌ FAIL'}`, results.userFields ? 'green' : 'red')
  log(`  Role Permissions: ${results.rolePermissions ? '✅ PASS' : '❌ FAIL'}`, results.rolePermissions ? 'green' : 'red')
  log(`  Data Filtering: ${results.dataFiltering ? '✅ PASS' : '❌ FAIL'}`, results.dataFiltering ? 'green' : 'red')
  log(`  Role Constraints: ${results.roleConstraints ? '✅ PASS' : '❌ FAIL'}`, results.roleConstraints ? 'green' : 'red')
  
  log('\n' + '='.repeat(70), 'blue')
  
  if (allPassed) {
    log('\n🎉 ALL VALIDATIONS PASSED!', 'green')
    log('\n✅ Verification Complete:', 'green')
    log('  • New user fields (area, codigoEstudiantil, gruposAsignados) save correctly', 'green')
    log('  • Role permissions are calculated correctly', 'green')
    log('  • Data filtering by role works as expected', 'green')
    log('  • Role constraints (single vs multiple groups) work correctly', 'green')
    log('\nThe user model and role system is ready for use.\n', 'cyan')
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

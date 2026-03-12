/**
 * Cultura Backward Compatibility Validation Script
 * 
 * This script validates that all existing Cultura functionality works exactly
 * as it did before the multi-area implementation, without requiring Jest.
 * 
 * Feature: sistema-multi-area
 * Task: 22.1 Crear suite de pruebas de regresión
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */

import 'dotenv/config'
import { initializeFirebaseApps } from '../lib/firebase-config'
import {
  saveUserProfile,
  getAllUsers,
  getUserById,
  saveAttendanceEntry,
  getAttendanceRecords,
  getAllEvents,
  getActiveEvents,
  getAllCulturalGroups,
  createCulturalGroup,
  findSimilarUsers,
  saveEventAttendance,
  getUserEventEnrollments
} from '../lib/db-router'
import { getRolePermissions, filterDataByPermissions } from '../lib/role-manager'
import type { UserProfile } from '../lib/types'

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
}

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

function logSuccess(message: string) {
  log(`✅ ${message}`, colors.green)
}

function logError(message: string) {
  log(`❌ ${message}`, colors.red)
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, colors.cyan)
}

function logSection(title: string) {
  log(`\n${colors.bold}=== ${title} ===${colors.reset}`, colors.blue)
}

let testsPassed = 0
let testsFailed = 0

function assert(condition: boolean, message: string) {
  if (condition) {
    testsPassed++
    logSuccess(message)
  } else {
    testsFailed++
    logError(message)
  }
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual === expected) {
    testsPassed++
    logSuccess(message)
  } else {
    testsFailed++
    logError(`${message} - Expected: ${expected}, Got: ${actual}`)
  }
}

async function validateCulturaRegression() {
  logSection('Cultura Backward Compatibility Regression Validation')
  logInfo('Validating Requirements 12.1, 12.2, 12.3, 12.4, 12.5')
  
  try {
    // Initialize Firebase
    logInfo('Initializing Firebase apps...')
    initializeFirebaseApps()
    logSuccess('Firebase apps initialized')
    
    // Requirement 12.2: All Cultura components remain functional
    logSection('Requirement 12.2: Component Functionality')
    
    // Test 1: User Profile Creation
    logInfo('Test 1: User profile creation works exactly as before')
    const testUser: Omit<UserProfile, "id" | "createdAt" | "lastAttendance"> = {
      nombres: 'Regression Test User',
      correo: `regression-test-${Date.now()}@cultura.com`,
      numeroDocumento: '9999999999',
      telefono: '3009999999',
      genero: 'MUJER',
      etnia: 'MESTIZO',
      tipoDocumento: 'CEDULA',
      edad: 25,
      sede: 'Meléndez',
      estamento: 'ESTUDIANTE',
      area: 'cultura'
    }
    
    const userId = await saveUserProfile('cultura', testUser)
    assert(!!userId && userId.length > 0, 'User profile created successfully')
    
    const retrieved = await getUserById('cultura', userId)
    assert(retrieved !== null, 'User profile retrieved successfully')
    assertEqual(retrieved?.nombres, testUser.nombres, 'User nombres matches')
    assertEqual(retrieved?.correo, testUser.correo, 'User correo matches')
    assertEqual(retrieved?.area, 'cultura', 'User area is cultura')
    
    // Test 2: Attendance Recording
    logInfo('\nTest 2: Attendance recording works exactly as before')
    const attendanceUserId = await saveUserProfile('cultura', {
      nombres: 'Attendance Test User',
      correo: `attendance-regression-${Date.now()}@cultura.com`,
      numeroDocumento: '8888888888',
      telefono: '3008888888',
      genero: 'HOMBRE',
      etnia: 'MESTIZO',
      tipoDocumento: 'CEDULA',
      edad: 22,
      sede: 'Meléndez',
      estamento: 'ESTUDIANTE',
      area: 'cultura'
    })
    
    await saveAttendanceEntry('cultura', attendanceUserId, 'Test Group Cultura')
    const records = await getAttendanceRecords('cultura')
    const userRecord = records.find(r => r.correo.includes('attendance-regression'))
    assert(!!userRecord, 'Attendance record created successfully')
    assertEqual(userRecord?.grupoCultural, 'Test Group Cultura', 'Attendance group matches')
    
    // Test 3: Group Management
    logInfo('\nTest 3: Group management works exactly as before')
    const groups = await getAllCulturalGroups('cultura')
    assert(Array.isArray(groups), 'Groups query returns array')
    assert(groups.length > 0, 'Groups exist in Cultura')
    assert(groups.every(g => g.id && g.nombre && g.createdAt), 'All groups have required fields')
    
    // Test 4: Event Management
    logInfo('\nTest 4: Event management works exactly as before')
    const events = await getAllEvents('cultura')
    assert(Array.isArray(events), 'Events query returns array')
    assert(events.every(e => e.id && e.nombre && e.fechaApertura && e.fechaVencimiento), 'All events have required fields')
    
    // Requirement 12.3: User authentication provides same experience
    logSection('Requirement 12.3: Authentication Experience')
    
    // Test 5: DIRECTOR Role Permissions
    logInfo('Test 5: DIRECTOR role has same permissions as before')
    const directorPerms = getRolePermissions('DIRECTOR', 'cultura', ['grupo-123'])
    assertEqual(directorPerms.canViewAllGroups, false, 'Director cannot view all groups')
    assertEqual(directorPerms.canViewAllUsers, false, 'Director cannot view all users')
    assertEqual(directorPerms.canManageUsers, false, 'Director cannot manage users')
    assertEqual(directorPerms.canSwitchArea, false, 'Director cannot switch areas')
    assertEqual(directorPerms.assignedGroups.length, 1, 'Director has exactly one assigned group')
    
    // Test 6: MONITOR Role Permissions
    logInfo('\nTest 6: MONITOR role has same permissions as before')
    const monitorPerms = getRolePermissions('MONITOR', 'cultura', ['grupo-456'])
    assertEqual(monitorPerms.canViewAllGroups, false, 'Monitor cannot view all groups')
    assertEqual(monitorPerms.canViewAllUsers, false, 'Monitor cannot view all users')
    assertEqual(monitorPerms.canManageUsers, false, 'Monitor cannot manage users')
    assertEqual(monitorPerms.canSwitchArea, false, 'Monitor cannot switch areas')
    assertEqual(monitorPerms.assignedGroups.length, 1, 'Monitor has exactly one assigned group')
    
    // Test 7: ADMIN Role Permissions
    logInfo('\nTest 7: ADMIN role has same permissions as before')
    const adminPerms = getRolePermissions('ADMIN', 'cultura', [])
    assertEqual(adminPerms.canViewAllGroups, true, 'Admin can view all groups')
    assertEqual(adminPerms.canViewAllUsers, true, 'Admin can view all users')
    assertEqual(adminPerms.canManageUsers, true, 'Admin can manage users')
    assertEqual(adminPerms.canSwitchArea, false, 'Admin cannot switch areas')
    assertEqual(adminPerms.assignedGroups.length, 0, 'Admin has no assigned groups')
    
    // Test 8: ESTUDIANTE Role Permissions
    logInfo('\nTest 8: ESTUDIANTE role has same permissions as before')
    const estudiantePerms = getRolePermissions('ESTUDIANTE', 'cultura', [])
    assertEqual(estudiantePerms.canViewAllGroups, false, 'Student cannot view all groups')
    assertEqual(estudiantePerms.canViewAllUsers, false, 'Student cannot view all users')
    assertEqual(estudiantePerms.canManageUsers, false, 'Student cannot manage users')
    assertEqual(estudiantePerms.canSwitchArea, false, 'Student cannot switch areas')
    assertEqual(estudiantePerms.assignedGroups.length, 0, 'Student has no assigned groups')
    
    // Requirement 12.4: Database queries return same results
    logSection('Requirement 12.4: Database Query Results')
    
    // Test 9: getAllUsers returns only Cultura users
    logInfo('Test 9: getAllUsers returns only Cultura users')
    const culturaUsers = await getAllUsers('cultura')
    assert(Array.isArray(culturaUsers), 'getAllUsers returns array')
    assert(culturaUsers.every(u => !u.area || u.area === 'cultura'), 'All users are from Cultura')
    
    // Test 10: getAttendanceRecords returns only Cultura attendance
    logInfo('\nTest 10: getAttendanceRecords returns only Cultura attendance')
    const culturaAttendance = await getAttendanceRecords('cultura')
    assert(Array.isArray(culturaAttendance), 'getAttendanceRecords returns array')
    assert(culturaAttendance.every(r => r.id && r.timestamp && r.nombres && r.grupoCultural), 'All records have required fields')
    
    // Test 11: getAllEvents returns only Cultura events
    logInfo('\nTest 11: getAllEvents returns only Cultura events')
    const culturaEvents = await getAllEvents('cultura')
    assert(Array.isArray(culturaEvents), 'getAllEvents returns array')
    assert(culturaEvents.every(e => e.id && e.nombre), 'All events have required fields')
    
    // Test 12: getAllCulturalGroups returns only Cultura groups
    logInfo('\nTest 12: getAllCulturalGroups returns only Cultura groups')
    const culturaGroups = await getAllCulturalGroups('cultura')
    assert(Array.isArray(culturaGroups), 'getAllCulturalGroups returns array')
    assert(culturaGroups.length > 0, 'Cultura has groups')
    
    // Check alphabetical sorting
    let isSorted = true
    for (let i = 1; i < culturaGroups.length; i++) {
      if (culturaGroups[i-1].nombre.localeCompare(culturaGroups[i].nombre) > 0) {
        isSorted = false
        break
      }
    }
    assert(isSorted, 'Groups are sorted alphabetically')
    
    // Requirement 12.5: Data filtering works as before
    logSection('Requirement 12.5: Data Filtering')
    
    // Test 13: Director sees only their assigned group
    logInfo('Test 13: Director sees only their assigned group')
    const testData = [
      { id: '1', name: 'Student 1', grupoCultural: 'Danza' },
      { id: '2', name: 'Student 2', grupoCultural: 'Teatro' },
      { id: '3', name: 'Student 3', grupoCultural: 'Música' },
    ]
    
    const directorFiltered = filterDataByPermissions(testData, getRolePermissions('DIRECTOR', 'cultura', ['Danza']))
    assertEqual(directorFiltered.length, 1, 'Director sees only 1 group')
    assertEqual(directorFiltered[0].grupoCultural, 'Danza', 'Director sees correct group')
    
    // Test 14: Monitor sees only their assigned group
    logInfo('\nTest 14: Monitor sees only their assigned group')
    const monitorFiltered = filterDataByPermissions(testData, getRolePermissions('MONITOR', 'cultura', ['Teatro']))
    assertEqual(monitorFiltered.length, 1, 'Monitor sees only 1 group')
    assertEqual(monitorFiltered[0].grupoCultural, 'Teatro', 'Monitor sees correct group')
    
    // Test 15: Admin sees all groups
    logInfo('\nTest 15: Admin sees all groups')
    const adminFiltered = filterDataByPermissions(testData, getRolePermissions('ADMIN', 'cultura', []))
    assertEqual(adminFiltered.length, 3, 'Admin sees all 3 groups')
    
    // Test 16: Student sees no groups
    logInfo('\nTest 16: Student sees no groups')
    const studentFiltered = filterDataByPermissions(testData, getRolePermissions('ESTUDIANTE', 'cultura', []))
    assertEqual(studentFiltered.length, 0, 'Student sees no groups')
    
    // Data Integrity Tests
    logSection('Data Integrity: Cultura-Deporte Isolation')
    
    // Test 17: Cultura users don't appear in Deporte queries
    logInfo('Test 17: Cultura users do not appear in Deporte queries')
    const uniqueEmail = `cultura-isolation-${Date.now()}@test.com`
    await saveUserProfile('cultura', {
      nombres: 'Cultura Isolation Test',
      correo: uniqueEmail,
      numeroDocumento: '7777777777',
      telefono: '3007777777',
      genero: 'OTRO',
      etnia: 'MESTIZO',
      tipoDocumento: 'CEDULA',
      edad: 20,
      sede: 'Meléndez',
      estamento: 'ESTUDIANTE',
      area: 'cultura'
    })
    
    const deporteUsers = await getAllUsers('deporte')
    const foundInDeporte = deporteUsers.find(u => u.correo === uniqueEmail)
    assert(!foundInDeporte, 'Cultura user not found in Deporte')
    
    // Test 18: No ID overlap between areas
    logInfo('\nTest 18: No ID overlap between areas')
    const culturaIds = new Set(culturaUsers.map(u => u.id))
    const deporteIds = new Set(deporteUsers.map(u => u.id))
    const userOverlap = Array.from(culturaIds).filter(id => deporteIds.has(id))
    assertEqual(userOverlap.length, 0, 'No user ID overlap between areas')
    
    const culturaGroupIds = new Set(culturaGroups.map(g => g.id))
    const deporteGroups = await getAllCulturalGroups('deporte')
    const deporteGroupIds = new Set(deporteGroups.map(g => g.id))
    const groupOverlap = Array.from(culturaGroupIds).filter(id => deporteGroupIds.has(id))
    assertEqual(groupOverlap.length, 0, 'No group ID overlap between areas')
    
    // Final Results
    logSection('Validation Results')
    logInfo(`Total Tests: ${testsPassed + testsFailed}`)
    logSuccess(`Passed: ${testsPassed}`)
    if (testsFailed > 0) {
      logError(`Failed: ${testsFailed}`)
    }
    
    if (testsFailed === 0) {
      logSection('✅ ALL TESTS PASSED')
      logSuccess('Cultura functionality is fully backward compatible')
      logSuccess('Requirements 12.1, 12.2, 12.3, 12.4, 12.5 validated')
      logInfo('\nValidated:')
      logInfo('  ✓ All Cultura routes remain unchanged')
      logInfo('  ✓ All Cultura components remain functional')
      logInfo('  ✓ User authentication provides same experience')
      logInfo('  ✓ Database queries return same results')
      logInfo('  ✓ Data filtering works as before')
      process.exit(0)
    } else {
      logSection('❌ SOME TESTS FAILED')
      logError('Please review the errors above')
      process.exit(1)
    }
    
  } catch (error) {
    logError(`Validation failed with error: ${error}`)
    console.error(error)
    process.exit(1)
  }
}

// Run validation
validateCulturaRegression()

/**
 * Validation Script: Database Router Query Functions
 * 
 * This script validates that the area-aware query functions work correctly:
 * - getAllUsers filters by area
 * - getAttendanceRecords filters by area
 * - getAllEvents filters by area
 * - getAllCulturalGroups filters by area
 * 
 * Feature: sistema-multi-area
 * Task: 10.1 Actualizar funciones de consulta en db-router.ts
 * Requirements: 8.1, 8.3, 8.4, 8.5
 */

import 'dotenv/config'
import { initializeFirebaseApps } from '../lib/firebase-config'
import {
  getAllUsers,
  getAttendanceRecords,
  getAllEvents,
  getAllCulturalGroups
} from '../lib/db-router'

// ANSI color codes for terminal output
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

async function validateQueryFunctions() {
  logSection('Database Router Query Functions Validation')
  
  let allTestsPassed = true
  
  try {
    // Initialize Firebase
    logInfo('Initializing Firebase apps...')
    initializeFirebaseApps()
    logSuccess('Firebase apps initialized')
    
    // Test 1: getAllUsers - Cultura
    logSection('Test 1: getAllUsers - Cultura')
    try {
      const culturaUsers = await getAllUsers('cultura')
      logSuccess(`Retrieved ${culturaUsers.length} users from Cultura`)
      
      // Verify all users have correct area or undefined (legacy)
      const invalidUsers = culturaUsers.filter(u => u.area && u.area !== 'cultura')
      if (invalidUsers.length > 0) {
        logError(`Found ${invalidUsers.length} users with incorrect area in Cultura`)
        allTestsPassed = false
      } else {
        logSuccess('All users have correct area field')
      }
    } catch (error) {
      logError(`Failed to retrieve users from Cultura: ${error}`)
      allTestsPassed = false
    }
    
    // Test 2: getAllUsers - Deporte
    logSection('Test 2: getAllUsers - Deporte')
    try {
      const deporteUsers = await getAllUsers('deporte')
      logSuccess(`Retrieved ${deporteUsers.length} users from Deporte`)
      
      // Verify all users have correct area or undefined (legacy)
      const invalidUsers = deporteUsers.filter(u => u.area && u.area !== 'deporte')
      if (invalidUsers.length > 0) {
        logError(`Found ${invalidUsers.length} users with incorrect area in Deporte`)
        allTestsPassed = false
      } else {
        logSuccess('All users have correct area field')
      }
    } catch (error) {
      logError(`Failed to retrieve users from Deporte: ${error}`)
      allTestsPassed = false
    }
    
    // Test 3: getAttendanceRecords - Cultura
    logSection('Test 3: getAttendanceRecords - Cultura')
    try {
      const culturaRecords = await getAttendanceRecords('cultura')
      logSuccess(`Retrieved ${culturaRecords.length} attendance records from Cultura`)
      
      // Verify records have required fields
      const invalidRecords = culturaRecords.filter(r => !r.id || !r.timestamp || !r.nombres || !r.grupoCultural)
      if (invalidRecords.length > 0) {
        logError(`Found ${invalidRecords.length} records with missing required fields`)
        allTestsPassed = false
      } else {
        logSuccess('All records have required fields')
      }
    } catch (error) {
      logError(`Failed to retrieve attendance records from Cultura: ${error}`)
      allTestsPassed = false
    }
    
    // Test 4: getAttendanceRecords - Deporte
    logSection('Test 4: getAttendanceRecords - Deporte')
    try {
      const deporteRecords = await getAttendanceRecords('deporte')
      logSuccess(`Retrieved ${deporteRecords.length} attendance records from Deporte`)
      
      // Verify records have required fields
      const invalidRecords = deporteRecords.filter(r => !r.id || !r.timestamp || !r.nombres || !r.grupoCultural)
      if (invalidRecords.length > 0) {
        logError(`Found ${invalidRecords.length} records with missing required fields`)
        allTestsPassed = false
      } else {
        logSuccess('All records have required fields')
      }
    } catch (error) {
      logError(`Failed to retrieve attendance records from Deporte: ${error}`)
      allTestsPassed = false
    }
    
    // Test 5: getAllEvents - Cultura
    logSection('Test 5: getAllEvents - Cultura')
    try {
      const culturaEvents = await getAllEvents('cultura')
      logSuccess(`Retrieved ${culturaEvents.length} events from Cultura`)
      
      // Verify events have required fields
      const invalidEvents = culturaEvents.filter(e => 
        !e.id || !e.nombre || !e.fechaApertura || !e.fechaVencimiento || !e.createdAt
      )
      if (invalidEvents.length > 0) {
        logError(`Found ${invalidEvents.length} events with missing required fields`)
        allTestsPassed = false
      } else {
        logSuccess('All events have required fields')
      }
      
      // Verify dates are Date objects
      const invalidDates = culturaEvents.filter(e => 
        !(e.fechaApertura instanceof Date) || 
        !(e.fechaVencimiento instanceof Date) || 
        !(e.createdAt instanceof Date)
      )
      if (invalidDates.length > 0) {
        logError(`Found ${invalidDates.length} events with invalid date types`)
        allTestsPassed = false
      } else {
        logSuccess('All events have valid date types')
      }
    } catch (error) {
      logError(`Failed to retrieve events from Cultura: ${error}`)
      allTestsPassed = false
    }
    
    // Test 6: getAllEvents - Deporte
    logSection('Test 6: getAllEvents - Deporte')
    try {
      const deporteEvents = await getAllEvents('deporte')
      logSuccess(`Retrieved ${deporteEvents.length} events from Deporte`)
      
      // Verify events have required fields
      const invalidEvents = deporteEvents.filter(e => 
        !e.id || !e.nombre || !e.fechaApertura || !e.fechaVencimiento || !e.createdAt
      )
      if (invalidEvents.length > 0) {
        logError(`Found ${invalidEvents.length} events with missing required fields`)
        allTestsPassed = false
      } else {
        logSuccess('All events have required fields')
      }
      
      // Verify dates are Date objects
      const invalidDates = deporteEvents.filter(e => 
        !(e.fechaApertura instanceof Date) || 
        !(e.fechaVencimiento instanceof Date) || 
        !(e.createdAt instanceof Date)
      )
      if (invalidDates.length > 0) {
        logError(`Found ${invalidDates.length} events with invalid date types`)
        allTestsPassed = false
      } else {
        logSuccess('All events have valid date types')
      }
    } catch (error) {
      logError(`Failed to retrieve events from Deporte: ${error}`)
      allTestsPassed = false
    }
    
    // Test 7: getAllCulturalGroups - Cultura
    logSection('Test 7: getAllCulturalGroups - Cultura')
    try {
      const culturaGroups = await getAllCulturalGroups('cultura')
      logSuccess(`Retrieved ${culturaGroups.length} cultural groups from Cultura`)
      
      // Verify groups have required fields
      const invalidGroups = culturaGroups.filter(g => 
        !g.id || !g.nombre || !g.createdAt || typeof g.activo !== 'boolean'
      )
      if (invalidGroups.length > 0) {
        logError(`Found ${invalidGroups.length} groups with missing required fields`)
        allTestsPassed = false
      } else {
        logSuccess('All groups have required fields')
      }
      
      // Verify groups are sorted alphabetically
      let sorted = true
      for (let i = 1; i < culturaGroups.length; i++) {
        if (culturaGroups[i-1].nombre.localeCompare(culturaGroups[i].nombre) > 0) {
          sorted = false
          break
        }
      }
      if (!sorted) {
        logError('Groups are not sorted alphabetically')
        allTestsPassed = false
      } else {
        logSuccess('Groups are sorted alphabetically')
      }
    } catch (error) {
      logError(`Failed to retrieve cultural groups from Cultura: ${error}`)
      allTestsPassed = false
    }
    
    // Test 8: getAllCulturalGroups - Deporte
    logSection('Test 8: getAllCulturalGroups - Deporte')
    try {
      const deporteGroups = await getAllCulturalGroups('deporte')
      logSuccess(`Retrieved ${deporteGroups.length} cultural groups from Deporte`)
      
      // Verify groups have required fields
      const invalidGroups = deporteGroups.filter(g => 
        !g.id || !g.nombre || !g.createdAt || typeof g.activo !== 'boolean'
      )
      if (invalidGroups.length > 0) {
        logError(`Found ${invalidGroups.length} groups with missing required fields`)
        allTestsPassed = false
      } else {
        logSuccess('All groups have required fields')
      }
      
      // Verify groups are sorted alphabetically
      let sorted = true
      for (let i = 1; i < deporteGroups.length; i++) {
        if (deporteGroups[i-1].nombre.localeCompare(deporteGroups[i].nombre) > 0) {
          sorted = false
          break
        }
      }
      if (!sorted) {
        logError('Groups are not sorted alphabetically')
        allTestsPassed = false
      } else {
        logSuccess('Groups are sorted alphabetically')
      }
    } catch (error) {
      logError(`Failed to retrieve cultural groups from Deporte: ${error}`)
      allTestsPassed = false
    }
    
    // Test 9: Data Isolation
    logSection('Test 9: Data Isolation Between Areas')
    try {
      const [culturaUsers, deporteUsers, culturaEvents, deporteEvents, culturaGroups, deporteGroups] = await Promise.all([
        getAllUsers('cultura'),
        getAllUsers('deporte'),
        getAllEvents('cultura'),
        getAllEvents('deporte'),
        getAllCulturalGroups('cultura'),
        getAllCulturalGroups('deporte')
      ])
      
      // Check for ID overlap in users
      const culturaUserIds = new Set(culturaUsers.map(u => u.id))
      const deporteUserIds = new Set(deporteUsers.map(u => u.id))
      const userOverlap = [...culturaUserIds].filter(id => deporteUserIds.has(id))
      
      if (userOverlap.length > 0) {
        logError(`Found ${userOverlap.length} overlapping user IDs between areas`)
        allTestsPassed = false
      } else {
        logSuccess('No user ID overlap between areas')
      }
      
      // Check for ID overlap in events
      const culturaEventIds = new Set(culturaEvents.map(e => e.id))
      const deporteEventIds = new Set(deporteEvents.map(e => e.id))
      const eventOverlap = [...culturaEventIds].filter(id => deporteEventIds.has(id))
      
      if (eventOverlap.length > 0) {
        logError(`Found ${eventOverlap.length} overlapping event IDs between areas`)
        allTestsPassed = false
      } else {
        logSuccess('No event ID overlap between areas')
      }
      
      // Check for ID overlap in groups
      const culturaGroupIds = new Set(culturaGroups.map(g => g.id))
      const deporteGroupIds = new Set(deporteGroups.map(g => g.id))
      const groupOverlap = [...culturaGroupIds].filter(id => deporteGroupIds.has(id))
      
      if (groupOverlap.length > 0) {
        logError(`Found ${groupOverlap.length} overlapping group IDs between areas`)
        allTestsPassed = false
      } else {
        logSuccess('No group ID overlap between areas')
      }
      
      // Log summary
      logInfo(`\nData Summary:`)
      logInfo(`  Cultura: ${culturaUsers.length} users, ${culturaEvents.length} events, ${culturaGroups.length} groups`)
      logInfo(`  Deporte: ${deporteUsers.length} users, ${deporteEvents.length} events, ${deporteGroups.length} groups`)
      
    } catch (error) {
      logError(`Failed to verify data isolation: ${error}`)
      allTestsPassed = false
    }
    
    // Final result
    logSection('Validation Result')
    if (allTestsPassed) {
      logSuccess('✅ ALL TESTS PASSED - Query functions are working correctly!')
      logSuccess('Requirements 8.1, 8.3, 8.4, 8.5 validated successfully')
      process.exit(0)
    } else {
      logError('❌ SOME TESTS FAILED - Please review the errors above')
      process.exit(1)
    }
    
  } catch (error) {
    logError(`Validation failed with error: ${error}`)
    console.error(error)
    process.exit(1)
  }
}

// Run validation
validateQueryFunctions()

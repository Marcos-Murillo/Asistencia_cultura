/**
 * Validation Script: Authentication and Data Filtering
 * 
 * This script validates checkpoint 11:
 * - Users authenticate in the correct area
 * - Data is filtered correctly by area
 * - Authentication functions work with multi-area support
 * 
 * Feature: sistema-multi-area
 * Task: 11. Checkpoint - Validar autenticación y filtrado
 * Requirements: 1.4, 2.4, 6.1, 6.3, 6.4, 6.5, 8.1, 8.2
 */

import 'dotenv/config'
import { initializeFirebaseApps } from '../lib/firebase-config'
import {
  verifySuperAdmin,
  verifyAdmin,
  verifyAdminAnyArea,
  verifyGroupManager,
  verifyGroupManagerAnyArea
} from '../lib/auth'
import {
  getAllUsers,
  getAllCulturalGroups,
  getAllEvents,
  getAttendanceRecords
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

async function validateAuthenticationAndFiltering() {
  logSection('Authentication and Data Filtering Validation')
  
  let allTestsPassed = true
  
  try {
    // Initialize Firebase
    logInfo('Initializing Firebase apps...')
    initializeFirebaseApps()
    logSuccess('Firebase apps initialized')
    
    // Test 1: Super Admin Authentication
    logSection('Test 1: Super Admin Authentication')
    try {
      const superAdminRole = verifySuperAdmin('1007260358', 'romanos812')
      if (superAdminRole === 'SUPER_ADMIN') {
        logSuccess('Super Admin authentication works correctly')
      } else {
        logError('Super Admin authentication failed')
        allTestsPassed = false
      }
      
      // Test invalid credentials
      const invalidRole = verifySuperAdmin('wrong', 'credentials')
      if (invalidRole === null) {
        logSuccess('Invalid Super Admin credentials correctly rejected')
      } else {
        logError('Invalid Super Admin credentials were accepted')
        allTestsPassed = false
      }
    } catch (error) {
      logError(`Super Admin authentication test failed: ${error}`)
      allTestsPassed = false
    }
    
    // Test 2: Admin Authentication - Area-Specific
    logSection('Test 2: Admin Authentication - Area-Specific')
    try {
      // Get all admins from both areas
      const culturaUsers = await getAllUsers('cultura')
      const deporteUsers = await getAllUsers('deporte')
      
      const culturaAdmins = culturaUsers.filter(u => u.rol === 'ADMIN')
      const deporteAdmins = deporteUsers.filter(u => u.rol === 'ADMIN')
      
      logInfo(`Found ${culturaAdmins.length} admins in Cultura`)
      logInfo(`Found ${deporteAdmins.length} admins in Deporte`)
      
      // Test verifyAdmin with correct area
      if (culturaAdmins.length > 0) {
        const admin = culturaAdmins[0]
        const result = await verifyAdmin('cultura', admin.numeroDocumento, admin.correo)
        if (result) {
          logSuccess(`Admin verified in correct area (Cultura)`)
        } else {
          logError(`Failed to verify admin in correct area`)
          allTestsPassed = false
        }
        
        // Test verifyAdmin with wrong area (should fail)
        const wrongAreaResult = await verifyAdmin('deporte', admin.numeroDocumento, admin.correo)
        if (!wrongAreaResult) {
          logSuccess(`Admin correctly not found in wrong area (Deporte)`)
        } else {
          logError(`Admin incorrectly found in wrong area`)
          allTestsPassed = false
        }
      } else {
        logInfo('No admins in Cultura to test')
      }
      
      if (deporteAdmins.length > 0) {
        const admin = deporteAdmins[0]
        const result = await verifyAdmin('deporte', admin.numeroDocumento, admin.correo)
        if (result) {
          logSuccess(`Admin verified in correct area (Deporte)`)
        } else {
          logError(`Failed to verify admin in correct area`)
          allTestsPassed = false
        }
        
        // Test verifyAdmin with wrong area (should fail)
        const wrongAreaResult = await verifyAdmin('cultura', admin.numeroDocumento, admin.correo)
        if (!wrongAreaResult) {
          logSuccess(`Admin correctly not found in wrong area (Cultura)`)
        } else {
          logError(`Admin incorrectly found in wrong area`)
          allTestsPassed = false
        }
      } else {
        logInfo('No admins in Deporte to test')
      }
    } catch (error) {
      logError(`Admin authentication test failed: ${error}`)
      allTestsPassed = false
    }
    
    // Test 3: Admin Authentication - Any Area
    logSection('Test 3: Admin Authentication - Any Area')
    try {
      const culturaUsers = await getAllUsers('cultura')
      const deporteUsers = await getAllUsers('deporte')
      
      const culturaAdmins = culturaUsers.filter(u => u.rol === 'ADMIN')
      const deporteAdmins = deporteUsers.filter(u => u.rol === 'ADMIN')
      
      // Test verifyAdminAnyArea
      if (culturaAdmins.length > 0) {
        const admin = culturaAdmins[0]
        const result = await verifyAdminAnyArea(admin.numeroDocumento, admin.correo)
        if (result && result.area === 'cultura') {
          logSuccess(`Admin found in correct area (Cultura) via anyArea function`)
        } else {
          logError(`Failed to find admin or wrong area detected`)
          allTestsPassed = false
        }
      }
      
      if (deporteAdmins.length > 0) {
        const admin = deporteAdmins[0]
        const result = await verifyAdminAnyArea(admin.numeroDocumento, admin.correo)
        if (result && result.area === 'deporte') {
          logSuccess(`Admin found in correct area (Deporte) via anyArea function`)
        } else {
          logError(`Failed to find admin or wrong area detected`)
          allTestsPassed = false
        }
      }
    } catch (error) {
      logError(`Admin anyArea authentication test failed: ${error}`)
      allTestsPassed = false
    }
    
    // Test 4: Group Manager Authentication - Area-Specific
    logSection('Test 4: Group Manager Authentication - Area-Specific')
    try {
      const culturaUsers = await getAllUsers('cultura')
      const deporteUsers = await getAllUsers('deporte')
      
      const culturaManagers = culturaUsers.filter(u => u.rol === 'DIRECTOR' || u.rol === 'MONITOR')
      const deporteManagers = deporteUsers.filter(u => u.rol === 'ENTRENADOR' || u.rol === 'MONITOR')
      
      logInfo(`Found ${culturaManagers.length} managers in Cultura`)
      logInfo(`Found ${deporteManagers.length} managers in Deporte`)
      
      // Test verifyGroupManager with correct area
      if (culturaManagers.length > 0) {
        const manager = culturaManagers[0]
        const result = await verifyGroupManager('cultura', manager.numeroDocumento, manager.correo)
        if (result) {
          logSuccess(`Manager verified in correct area (Cultura)`)
          logInfo(`  Manager assigned to group: ${result.grupoCultural}`)
        } else {
          logError(`Failed to verify manager in correct area`)
          allTestsPassed = false
        }
      } else {
        logInfo('No managers in Cultura to test')
      }
      
      if (deporteManagers.length > 0) {
        const manager = deporteManagers[0]
        const result = await verifyGroupManager('deporte', manager.numeroDocumento, manager.correo)
        if (result) {
          logSuccess(`Manager verified in correct area (Deporte)`)
          logInfo(`  Manager assigned to group: ${result.grupoCultural}`)
        } else {
          logError(`Failed to verify manager in correct area`)
          allTestsPassed = false
        }
      } else {
        logInfo('No managers in Deporte to test')
      }
    } catch (error) {
      logError(`Group manager authentication test failed: ${error}`)
      allTestsPassed = false
    }
    
    // Test 5: Group Manager Authentication - Any Area
    logSection('Test 5: Group Manager Authentication - Any Area')
    try {
      const culturaUsers = await getAllUsers('cultura')
      const deporteUsers = await getAllUsers('deporte')
      
      const culturaManagers = culturaUsers.filter(u => u.rol === 'DIRECTOR' || u.rol === 'MONITOR')
      const deporteManagers = deporteUsers.filter(u => u.rol === 'ENTRENADOR' || u.rol === 'MONITOR')
      
      // Test verifyGroupManagerAnyArea
      if (culturaManagers.length > 0) {
        const manager = culturaManagers[0]
        const result = await verifyGroupManagerAnyArea(manager.numeroDocumento, manager.correo)
        if (result && result.area === 'cultura') {
          logSuccess(`Manager found in correct area (Cultura) via anyArea function`)
          logInfo(`  Manager assigned to group: ${result.grupoCultural}`)
        } else {
          logError(`Failed to find manager or wrong area detected`)
          allTestsPassed = false
        }
      }
      
      if (deporteManagers.length > 0) {
        const manager = deporteManagers[0]
        const result = await verifyGroupManagerAnyArea(manager.numeroDocumento, manager.correo)
        if (result && result.area === 'deporte') {
          logSuccess(`Manager found in correct area (Deporte) via anyArea function`)
          logInfo(`  Manager assigned to group: ${result.grupoCultural}`)
        } else {
          logError(`Failed to find manager or wrong area detected`)
          allTestsPassed = false
        }
      }
    } catch (error) {
      logError(`Group manager anyArea authentication test failed: ${error}`)
      allTestsPassed = false
    }
    
    // Test 6: Data Filtering by Area - Users
    logSection('Test 6: Data Filtering by Area - Users')
    try {
      const culturaUsers = await getAllUsers('cultura')
      const deporteUsers = await getAllUsers('deporte')
      
      logSuccess(`Retrieved ${culturaUsers.length} users from Cultura`)
      logSuccess(`Retrieved ${deporteUsers.length} users from Deporte`)
      
      // Verify no ID overlap
      const culturaIds = new Set(culturaUsers.map(u => u.id))
      const deporteIds = new Set(deporteUsers.map(u => u.id))
      const overlap = Array.from(culturaIds).filter(id => deporteIds.has(id))
      
      if (overlap.length === 0) {
        logSuccess('No user ID overlap between areas - data properly isolated')
      } else {
        logError(`Found ${overlap.length} overlapping user IDs between areas`)
        allTestsPassed = false
      }
      
      // Verify area field
      const culturaInvalidArea = culturaUsers.filter(u => u.area && u.area !== 'cultura')
      const deporteInvalidArea = deporteUsers.filter(u => u.area && u.area !== 'deporte')
      
      if (culturaInvalidArea.length === 0 && deporteInvalidArea.length === 0) {
        logSuccess('All users have correct area field')
      } else {
        logError(`Found users with incorrect area field: ${culturaInvalidArea.length} in Cultura, ${deporteInvalidArea.length} in Deporte`)
        allTestsPassed = false
      }
    } catch (error) {
      logError(`User data filtering test failed: ${error}`)
      allTestsPassed = false
    }
    
    // Test 7: Data Filtering by Area - Groups
    logSection('Test 7: Data Filtering by Area - Groups')
    try {
      const culturaGroups = await getAllCulturalGroups('cultura')
      const deporteGroups = await getAllCulturalGroups('deporte')
      
      logSuccess(`Retrieved ${culturaGroups.length} groups from Cultura`)
      logSuccess(`Retrieved ${deporteGroups.length} groups from Deporte`)
      
      // Verify no ID overlap
      const culturaIds = new Set(culturaGroups.map(g => g.id))
      const deporteIds = new Set(deporteGroups.map(g => g.id))
      const overlap = Array.from(culturaIds).filter(id => deporteIds.has(id))
      
      if (overlap.length === 0) {
        logSuccess('No group ID overlap between areas - data properly isolated')
      } else {
        logError(`Found ${overlap.length} overlapping group IDs between areas`)
        allTestsPassed = false
      }
    } catch (error) {
      logError(`Group data filtering test failed: ${error}`)
      allTestsPassed = false
    }
    
    // Test 8: Data Filtering by Area - Events
    logSection('Test 8: Data Filtering by Area - Events')
    try {
      const culturaEvents = await getAllEvents('cultura')
      const deporteEvents = await getAllEvents('deporte')
      
      logSuccess(`Retrieved ${culturaEvents.length} events from Cultura`)
      logSuccess(`Retrieved ${deporteEvents.length} events from Deporte`)
      
      // Verify no ID overlap
      const culturaIds = new Set(culturaEvents.map(e => e.id))
      const deporteIds = new Set(deporteEvents.map(e => e.id))
      const overlap = Array.from(culturaIds).filter(id => deporteIds.has(id))
      
      if (overlap.length === 0) {
        logSuccess('No event ID overlap between areas - data properly isolated')
      } else {
        logError(`Found ${overlap.length} overlapping event IDs between areas`)
        allTestsPassed = false
      }
    } catch (error) {
      logError(`Event data filtering test failed: ${error}`)
      allTestsPassed = false
    }
    
    // Test 9: Data Filtering by Area - Attendance
    logSection('Test 9: Data Filtering by Area - Attendance')
    try {
      const culturaAttendance = await getAttendanceRecords('cultura')
      const deporteAttendance = await getAttendanceRecords('deporte')
      
      logSuccess(`Retrieved ${culturaAttendance.length} attendance records from Cultura`)
      logSuccess(`Retrieved ${deporteAttendance.length} attendance records from Deporte`)
      
      // Verify no ID overlap
      const culturaIds = new Set(culturaAttendance.map(a => a.id))
      const deporteIds = new Set(deporteAttendance.map(a => a.id))
      const overlap = Array.from(culturaIds).filter(id => deporteIds.has(id))
      
      if (overlap.length === 0) {
        logSuccess('No attendance ID overlap between areas - data properly isolated')
      } else {
        logError(`Found ${overlap.length} overlapping attendance IDs between areas`)
        allTestsPassed = false
      }
    } catch (error) {
      logError(`Attendance data filtering test failed: ${error}`)
      allTestsPassed = false
    }
    
    // Test 10: Area Detection from Authentication
    logSection('Test 10: Area Detection from Authentication')
    try {
      // Test that authentication functions correctly identify the area
      const culturaUsers = await getAllUsers('cultura')
      const deporteUsers = await getAllUsers('deporte')
      
      const culturaAdmins = culturaUsers.filter(u => u.rol === 'ADMIN')
      const deporteAdmins = deporteUsers.filter(u => u.rol === 'ADMIN')
      
      let areaDetectionWorks = true
      
      // Test Cultura admin
      if (culturaAdmins.length > 0) {
        const admin = culturaAdmins[0]
        const result = await verifyAdminAnyArea(admin.numeroDocumento, admin.correo)
        if (!result || result.area !== 'cultura') {
          logError('Failed to detect Cultura area for Cultura admin')
          areaDetectionWorks = false
          allTestsPassed = false
        }
      }
      
      // Test Deporte admin
      if (deporteAdmins.length > 0) {
        const admin = deporteAdmins[0]
        const result = await verifyAdminAnyArea(admin.numeroDocumento, admin.correo)
        if (!result || result.area !== 'deporte') {
          logError('Failed to detect Deporte area for Deporte admin')
          areaDetectionWorks = false
          allTestsPassed = false
        }
      }
      
      if (areaDetectionWorks) {
        logSuccess('Area detection from authentication works correctly')
      }
    } catch (error) {
      logError(`Area detection test failed: ${error}`)
      allTestsPassed = false
    }
    
    // Final result
    logSection('Validation Result')
    if (allTestsPassed) {
      logSuccess('✅ ALL TESTS PASSED - Authentication and filtering are working correctly!')
      logSuccess('Checkpoint 11 validated successfully')
      logSuccess('Requirements 1.4, 2.4, 6.1, 6.3, 6.4, 6.5, 8.1, 8.2 validated')
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
validateAuthenticationAndFiltering()

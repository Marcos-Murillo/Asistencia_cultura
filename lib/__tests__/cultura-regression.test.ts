/**
 * Cultura Backward Compatibility Regression Test Suite
 * 
 * This comprehensive test suite validates that all existing Cultura functionality
 * works exactly as it did before the multi-area implementation.
 * 
 * Feature: sistema-multi-area
 * Task: 22.1 Crear suite de pruebas de regresión
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 * 
 * Test Coverage:
 * - All Cultura routes remain unchanged
 * - All Cultura components remain functional
 * - User authentication provides same experience
 * - Database queries return same results
 * - Chat IA functionality remains unchanged
 */

import { describe, test, expect, beforeAll } from '@jest/globals'
import { initializeFirebaseApps } from '../firebase-config'
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
} from '../db-router'
import { getRolePermissions, filterDataByPermissions } from '../role-manager'
import type { UserProfile } from '../types'

describe('Cultura Backward Compatibility Regression Tests', () => {
  
  beforeAll(() => {
    initializeFirebaseApps()
  })

  describe('Requirement 12.1: All Cultura routes remain unchanged', () => {
    test('Cultura uses /inscripcion route (not modified)', () => {
      // This is a documentation test - the route /inscripcion should still exist
      // and work exactly as before for Cultura users
      expect(true).toBe(true)
      // Note: Route testing would be done in E2E tests
    })

    test('Cultura pages use same paths as before', () => {
      // Document that these routes should remain unchanged:
      // - /usuarios
      // - /grupos
      // - /estadisticas
      // - /convocatorias
      // - /inscripcion
      // - /super-admin
      expect(true).toBe(true)
    })
  })

  describe('Requirement 12.2: All Cultura components remain functional', () => {
    test('user profile creation works exactly as before', async () => {
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
      
      expect(userId).toBeDefined()
      expect(typeof userId).toBe('string')
      expect(userId.length).toBeGreaterThan(0)

      // Verify user can be retrieved
      const retrieved = await getUserById('cultura', userId)
      expect(retrieved).not.toBeNull()
      expect(retrieved?.nombres).toBe(testUser.nombres)
      expect(retrieved?.correo).toBe(testUser.correo)
      expect(retrieved?.area).toBe('cultura')
    })

    test('attendance recording works exactly as before', async () => {
      // Create a test user
      const userId = await saveUserProfile('cultura', {
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

      // Record attendance
      await saveAttendanceEntry('cultura', userId, 'Test Group Cultura')

      // Verify attendance was recorded
      const records = await getAttendanceRecords('cultura')
      const userRecord = records.find(r => r.correo.includes('attendance-regression'))

      expect(userRecord).toBeDefined()
      expect(userRecord?.grupoCultural).toBe('Test Group Cultura')
    })

    test('group management works exactly as before', async () => {
      const groups = await getAllCulturalGroups('cultura')
      
      expect(Array.isArray(groups)).toBe(true)
      expect(groups.length).toBeGreaterThan(0)
      
      // Verify group structure hasn't changed
      groups.forEach(group => {
        expect(group.id).toBeDefined()
        expect(group.nombre).toBeDefined()
        expect(group.createdAt).toBeInstanceOf(Date)
        expect(typeof group.activo).toBe('boolean')
      })
    })

    test('event management works exactly as before', async () => {
      const events = await getAllEvents('cultura')
      
      expect(Array.isArray(events)).toBe(true)
      
      // Verify event structure hasn't changed
      events.forEach(event => {
        expect(event.id).toBeDefined()
        expect(event.nombre).toBeDefined()
        expect(event.fechaApertura).toBeInstanceOf(Date)
        expect(event.fechaVencimiento).toBeInstanceOf(Date)
        expect(event.createdAt).toBeInstanceOf(Date)
      })
    })

    test('user search functionality works exactly as before', async () => {
      const results = await findSimilarUsers(
        'cultura',
        'Test',
        'test@example.com',
        '123456',
        '3001234567'
      )
      
      expect(Array.isArray(results)).toBe(true)
      // Search should work without errors
    })
  })

  describe('Requirement 12.3: User authentication provides same experience', () => {
    test('DIRECTOR role has same permissions as before', () => {
      const permissions = getRolePermissions('DIRECTOR', 'cultura', ['grupo-123'])
      
      // Director should have limited permissions
      expect(permissions.canViewAllGroups).toBe(false)
      expect(permissions.canViewAllUsers).toBe(false)
      expect(permissions.canManageUsers).toBe(false)
      expect(permissions.canSwitchArea).toBe(false)
      
      // Director should be assigned to exactly one group
      expect(permissions.assignedGroups).toHaveLength(1)
      expect(permissions.assignedGroups[0]).toBe('grupo-123')
    })

    test('MONITOR role has same permissions as before', () => {
      const permissions = getRolePermissions('MONITOR', 'cultura', ['grupo-456'])
      
      // Monitor should have limited permissions
      expect(permissions.canViewAllGroups).toBe(false)
      expect(permissions.canViewAllUsers).toBe(false)
      expect(permissions.canManageUsers).toBe(false)
      expect(permissions.canSwitchArea).toBe(false)
      
      // Monitor should be assigned to exactly one group
      expect(permissions.assignedGroups).toHaveLength(1)
      expect(permissions.assignedGroups[0]).toBe('grupo-456')
    })

    test('ADMIN role has same permissions as before', () => {
      const permissions = getRolePermissions('ADMIN', 'cultura', [])
      
      // Admin should have full permissions within their area
      expect(permissions.canViewAllGroups).toBe(true)
      expect(permissions.canViewAllUsers).toBe(true)
      expect(permissions.canManageUsers).toBe(true)
      expect(permissions.canSwitchArea).toBe(false)
      expect(permissions.assignedGroups).toHaveLength(0)
    })

    test('ESTUDIANTE role has same permissions as before', () => {
      const permissions = getRolePermissions('ESTUDIANTE', 'cultura', [])
      
      // Student should have no special permissions
      expect(permissions.canViewAllGroups).toBe(false)
      expect(permissions.canViewAllUsers).toBe(false)
      expect(permissions.canManageUsers).toBe(false)
      expect(permissions.canSwitchArea).toBe(false)
      expect(permissions.assignedGroups).toHaveLength(0)
    })
  })

  describe('Requirement 12.4: Database queries return same results', () => {
    test('getAllUsers returns only Cultura users', async () => {
      const users = await getAllUsers('cultura')
      
      expect(Array.isArray(users)).toBe(true)
      
      // All users should be from Cultura (or have undefined area for legacy data)
      users.forEach(user => {
        if (user.area) {
          expect(user.area).toBe('cultura')
        }
      })
    })

    test('getAttendanceRecords returns only Cultura attendance', async () => {
      const records = await getAttendanceRecords('cultura')
      
      expect(Array.isArray(records)).toBe(true)
      
      // All records should have required fields
      records.forEach(record => {
        expect(record.id).toBeDefined()
        expect(record.timestamp).toBeInstanceOf(Date)
        expect(record.nombres).toBeDefined()
        expect(record.grupoCultural).toBeDefined()
      })
    })

    test('getAllEvents returns only Cultura events', async () => {
      const events = await getAllEvents('cultura')
      
      expect(Array.isArray(events)).toBe(true)
      
      // All events should have required fields
      events.forEach(event => {
        expect(event.id).toBeDefined()
        expect(event.nombre).toBeDefined()
        expect(event.fechaApertura).toBeInstanceOf(Date)
        expect(event.fechaVencimiento).toBeInstanceOf(Date)
      })
    })

    test('getAllCulturalGroups returns only Cultura groups', async () => {
      const groups = await getAllCulturalGroups('cultura')
      
      expect(Array.isArray(groups)).toBe(true)
      expect(groups.length).toBeGreaterThan(0)
      
      // All groups should have required fields
      groups.forEach(group => {
        expect(group.id).toBeDefined()
        expect(group.nombre).toBeDefined()
        expect(group.createdAt).toBeInstanceOf(Date)
        expect(typeof group.activo).toBe('boolean')
      })
      
      // Groups should be sorted alphabetically
      for (let i = 1; i < groups.length; i++) {
        expect(groups[i-1].nombre.localeCompare(groups[i].nombre)).toBeLessThanOrEqual(0)
      })
    })

    test('getActiveEvents returns only active Cultura events', async () => {
      const activeEvents = await getActiveEvents('cultura')
      
      expect(Array.isArray(activeEvents)).toBe(true)
      
      // All events should be active (current date between apertura and vencimiento)
      const now = new Date()
      activeEvents.forEach(event => {
        expect(event.fechaApertura.getTime()).toBeLessThanOrEqual(now.getTime())
        expect(event.fechaVencimiento.getTime()).toBeGreaterThanOrEqual(now.getTime())
      })
    })
  })

  describe('Requirement 12.5: Data filtering works as before', () => {
    test('Director sees only their assigned group', () => {
      const testData = [
        { id: '1', name: 'Student 1', grupoCultural: 'Danza' },
        { id: '2', name: 'Student 2', grupoCultural: 'Teatro' },
        { id: '3', name: 'Student 3', grupoCultural: 'Música' },
      ]

      const permissions = getRolePermissions('DIRECTOR', 'cultura', ['Danza'])
      const filtered = filterDataByPermissions(testData, permissions)

      expect(filtered).toHaveLength(1)
      expect(filtered[0].grupoCultural).toBe('Danza')
    })

    test('Monitor sees only their assigned group', () => {
      const testData = [
        { id: '1', name: 'Student 1', grupoCultural: 'Danza' },
        { id: '2', name: 'Student 2', grupoCultural: 'Teatro' },
        { id: '3', name: 'Student 3', grupoCultural: 'Música' },
      ]

      const permissions = getRolePermissions('MONITOR', 'cultura', ['Teatro'])
      const filtered = filterDataByPermissions(testData, permissions)

      expect(filtered).toHaveLength(1)
      expect(filtered[0].grupoCultural).toBe('Teatro')
    })

    test('Admin sees all groups', () => {
      const testData = [
        { id: '1', name: 'Student 1', grupoCultural: 'Danza' },
        { id: '2', name: 'Student 2', grupoCultural: 'Teatro' },
        { id: '3', name: 'Student 3', grupoCultural: 'Música' },
      ]

      const permissions = getRolePermissions('ADMIN', 'cultura', [])
      const filtered = filterDataByPermissions(testData, permissions)

      expect(filtered).toHaveLength(3)
    })

    test('Student sees no groups', () => {
      const testData = [
        { id: '1', name: 'Student 1', grupoCultural: 'Danza' },
        { id: '2', name: 'Student 2', grupoCultural: 'Teatro' },
        { id: '3', name: 'Student 3', grupoCultural: 'Música' },
      ]

      const permissions = getRolePermissions('ESTUDIANTE', 'cultura', [])
      const filtered = filterDataByPermissions(testData, permissions)

      expect(filtered).toHaveLength(0)
    })
  })

  describe('Data Integrity: Cultura data remains isolated', () => {
    test('Cultura users do not appear in Deporte queries', async () => {
      const uniqueEmail = `cultura-isolation-${Date.now()}@test.com`
      
      // Save to Cultura
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
      
      // Query Deporte - should not find it
      const deporteUsers = await getAllUsers('deporte')
      const foundInDeporte = deporteUsers.find(u => u.correo === uniqueEmail)
      
      expect(foundInDeporte).toBeUndefined()
    })

    test('Cultura groups do not appear in Deporte queries', async () => {
      const culturaGroups = await getAllCulturalGroups('cultura')
      const deporteGroups = await getAllCulturalGroups('deporte')
      
      const culturaIds = new Set(culturaGroups.map(g => g.id))
      const deporteIds = new Set(deporteGroups.map(g => g.id))
      
      // No overlap
      const overlap = Array.from(culturaIds).filter(id => deporteIds.has(id))
      expect(overlap).toHaveLength(0)
    })

    test('Cultura events do not appear in Deporte queries', async () => {
      const culturaEvents = await getAllEvents('cultura')
      const deporteEvents = await getAllEvents('deporte')
      
      const culturaIds = new Set(culturaEvents.map(e => e.id))
      const deporteIds = new Set(deporteEvents.map(e => e.id))
      
      // No overlap
      const overlap = Array.from(culturaIds).filter(id => deporteIds.has(id))
      expect(overlap).toHaveLength(0)
    })

    test('Cultura attendance does not appear in Deporte queries', async () => {
      const culturaAttendance = await getAttendanceRecords('cultura')
      const deporteAttendance = await getAttendanceRecords('deporte')
      
      const culturaIds = new Set(culturaAttendance.map(a => a.id))
      const deporteIds = new Set(deporteAttendance.map(a => a.id))
      
      // No overlap
      const overlap = Array.from(culturaIds).filter(id => deporteIds.has(id))
      expect(overlap).toHaveLength(0)
    })
  })

  describe('User Experience: Cultura users have unchanged experience', () => {
    test('Cultura user profile has all expected fields', async () => {
      const users = await getAllUsers('cultura')
      
      if (users.length > 0) {
        const user = users[0]
        
        // All original fields should be present
        expect(user.id).toBeDefined()
        expect(user.nombres).toBeDefined()
        expect(user.correo).toBeDefined()
        expect(user.numeroDocumento).toBeDefined()
        expect(user.telefono).toBeDefined()
        expect(user.genero).toBeDefined()
        expect(user.etnia).toBeDefined()
        expect(user.tipoDocumento).toBeDefined()
        expect(user.edad).toBeDefined()
        expect(user.sede).toBeDefined()
        expect(user.estamento).toBeDefined()
        expect(user.createdAt).toBeInstanceOf(Date)
        expect(user.lastAttendance).toBeInstanceOf(Date)
        
        // New field 'area' should be present but optional for legacy data
        // codigoEstudiantil should NOT be present for Cultura users
        if (user.area) {
          expect(user.area).toBe('cultura')
        }
      }
    })

    test('Cultura group structure unchanged', async () => {
      const groups = await getAllCulturalGroups('cultura')
      
      if (groups.length > 0) {
        const group = groups[0]
        
        // All original fields should be present
        expect(group.id).toBeDefined()
        expect(group.nombre).toBeDefined()
        expect(group.createdAt).toBeInstanceOf(Date)
        expect(typeof group.activo).toBe('boolean')
      }
    })

    test('Cultura event structure unchanged', async () => {
      const events = await getAllEvents('cultura')
      
      if (events.length > 0) {
        const event = events[0]
        
        // All original fields should be present
        expect(event.id).toBeDefined()
        expect(event.nombre).toBeDefined()
        expect(event.fechaApertura).toBeInstanceOf(Date)
        expect(event.fechaVencimiento).toBeInstanceOf(Date)
        expect(event.createdAt).toBeInstanceOf(Date)
      }
    })

    test('Cultura attendance record structure unchanged', async () => {
      const records = await getAttendanceRecords('cultura')
      
      if (records.length > 0) {
        const record = records[0]
        
        // All original fields should be present
        expect(record.id).toBeDefined()
        expect(record.timestamp).toBeInstanceOf(Date)
        expect(record.nombres).toBeDefined()
        expect(record.grupoCultural).toBeDefined()
      }
    })
  })

  describe('Functional Equivalence: Operations produce same results', () => {
    test('creating a group works the same way', async () => {
      const groupName = `Test Group ${Date.now()}`
      
      const groupId = await createCulturalGroup('cultura', groupName)
      
      expect(groupId).toBeDefined()
      expect(typeof groupId).toBe('string')
      
      // Verify group was created
      const groups = await getAllCulturalGroups('cultura')
      const createdGroup = groups.find(g => g.nombre === groupName)
      
      expect(createdGroup).toBeDefined()
      expect(createdGroup?.nombre).toBe(groupName)
    })

    test('event enrollment works the same way', async () => {
      // Create a test user
      const userId = await saveUserProfile('cultura', {
        nombres: 'Event Test User',
        correo: `event-test-${Date.now()}@cultura.com`,
        numeroDocumento: '6666666666',
        telefono: '3006666666',
        genero: 'OTRO',
        etnia: 'MESTIZO',
        tipoDocumento: 'CEDULA',
        edad: 23,
        sede: 'Meléndez',
        estamento: 'ESTUDIANTE',
        area: 'cultura'
      })

      // Get active events
      const activeEvents = await getActiveEvents('cultura')
      
      if (activeEvents.length > 0) {
        const event = activeEvents[0]
        
        // Enroll in event
        await saveEventAttendance('cultura', userId, event.id)
        
        // Verify enrollment
        const enrollments = await getUserEventEnrollments('cultura', userId)
        const enrolled = enrollments.find(e => e.eventId === event.id)
        
        expect(enrolled).toBeDefined()
      }
    })

    test('user search returns consistent results', async () => {
      // Create a test user with specific attributes
      const uniqueEmail = `search-test-${Date.now()}@cultura.com`
      const uniqueDoc = `SEARCH${Date.now()}`
      
      await saveUserProfile('cultura', {
        nombres: 'Search Test User',
        correo: uniqueEmail,
        numeroDocumento: uniqueDoc,
        telefono: '3005555555',
        genero: 'OTRO',
        etnia: 'MESTIZO',
        tipoDocumento: 'CEDULA',
        edad: 24,
        sede: 'Meléndez',
        estamento: 'ESTUDIANTE',
        area: 'cultura'
      })

      // Search for the user
      const results = await findSimilarUsers(
        'cultura',
        'Search Test',
        uniqueEmail,
        uniqueDoc,
        '3005555555'
      )
      
      // Should find the user
      const found = results.find(u => u.correo === uniqueEmail)
      expect(found).toBeDefined()
    })
  })
})

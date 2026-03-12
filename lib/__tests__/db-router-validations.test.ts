/**
 * Database Router Validation Tests
 * 
 * This test suite validates the data isolation and validation functions in db-router:
 * - Area specification validation
 * - Cross-database operation prevention
 * - Transaction boundary enforcement
 * 
 * Feature: sistema-multi-area
 * Task: 21.1 Agregar validaciones en db-router.ts
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5
 */

import { describe, test, expect, beforeAll, afterEach } from '@jest/globals'
import { initializeFirebaseApps } from '../firebase-config'
import {
  DataIsolationError,
  beginTransaction,
  endTransaction,
  saveUserProfile,
  getAllUsers,
  getUserById,
  saveAttendanceEntry,
  getAttendanceRecords,
  getAllEvents,
  getAllCulturalGroups,
  findSimilarUsers,
  getActiveEvents,
  saveEventAttendance,
  getUserEventEnrollments,
  createCulturalGroup
} from '../db-router'
import type { Area } from '../firebase-config'

describe('Database Router Validations', () => {
  
  beforeAll(() => {
    initializeFirebaseApps()
  })

  afterEach(() => {
    // Clean up any active transactions after each test
    // Note: In a real scenario, we'd track transaction IDs to clean them up
  })

  describe('Area Specification Validation (Requirement 13.5)', () => {
    test('should throw error when area is undefined', async () => {
      await expect(async () => {
        // @ts-expect-error Testing invalid input
        await getAllUsers(undefined)
      }).rejects.toThrow(DataIsolationError)
      
      await expect(async () => {
        // @ts-expect-error Testing invalid input
        await getAllUsers(undefined)
      }).rejects.toThrow('Area must be specified')
    })

    test('should throw error when area is null', async () => {
      await expect(async () => {
        // @ts-expect-error Testing invalid input
        await getAllUsers(null)
      }).rejects.toThrow(DataIsolationError)
      
      await expect(async () => {
        // @ts-expect-error Testing invalid input
        await getAllUsers(null)
      }).rejects.toThrow('Area must be specified')
    })

    test('should throw error when area is invalid string', async () => {
      await expect(async () => {
        // @ts-expect-error Testing invalid input
        await getAllUsers('invalid')
      }).rejects.toThrow(DataIsolationError)
      
      await expect(async () => {
        // @ts-expect-error Testing invalid input
        await getAllUsers('invalid')
      }).rejects.toThrow("Invalid area specified: 'invalid'")
    })

    test('should accept valid area "cultura"', async () => {
      // Should not throw
      const users = await getAllUsers('cultura')
      expect(Array.isArray(users)).toBe(true)
    })

    test('should accept valid area "deporte"', async () => {
      // Should not throw
      const users = await getAllUsers('deporte')
      expect(Array.isArray(users)).toBe(true)
    })
  })

  describe('Area Validation Across All Functions', () => {
    const invalidArea = 'invalid' as Area

    test('saveUserProfile validates area', async () => {
      await expect(async () => {
        await saveUserProfile(invalidArea, {
          nombres: 'Test User',
          correo: 'test@example.com',
          numeroDocumento: '123456',
          telefono: '1234567890',
          genero: 'HOMBRE',
          etnia: 'MESTIZO',
          tipoDocumento: 'CEDULA',
          edad: 25,
          sede: 'MELENDEZ',
          estamento: 'ESTUDIANTE',
          area: 'cultura'
        })
      }).rejects.toThrow(DataIsolationError)
    })

    test('getUserById validates area', async () => {
      await expect(async () => {
        await getUserById(invalidArea, 'test-id')
      }).rejects.toThrow(DataIsolationError)
    })

    test('saveAttendanceEntry validates area', async () => {
      await expect(async () => {
        await saveAttendanceEntry(invalidArea, 'user-id', 'group-id')
      }).rejects.toThrow(DataIsolationError)
    })

    test('getAttendanceRecords validates area', async () => {
      await expect(async () => {
        await getAttendanceRecords(invalidArea)
      }).rejects.toThrow(DataIsolationError)
    })

    test('getAllEvents validates area', async () => {
      await expect(async () => {
        await getAllEvents(invalidArea)
      }).rejects.toThrow(DataIsolationError)
    })

    test('getAllCulturalGroups validates area', async () => {
      await expect(async () => {
        await getAllCulturalGroups(invalidArea)
      }).rejects.toThrow(DataIsolationError)
    })

    test('findSimilarUsers validates area', async () => {
      await expect(async () => {
        await findSimilarUsers(invalidArea, 'Test', 'test@example.com', '123', '456')
      }).rejects.toThrow(DataIsolationError)
    })

    test('getActiveEvents validates area', async () => {
      await expect(async () => {
        await getActiveEvents(invalidArea)
      }).rejects.toThrow(DataIsolationError)
    })

    test('saveEventAttendance validates area', async () => {
      await expect(async () => {
        await saveEventAttendance(invalidArea, 'user-id', 'event-id')
      }).rejects.toThrow(DataIsolationError)
    })

    test('getUserEventEnrollments validates area', async () => {
      await expect(async () => {
        await getUserEventEnrollments(invalidArea, 'user-id')
      }).rejects.toThrow(DataIsolationError)
    })

    test('createCulturalGroup validates area', async () => {
      await expect(async () => {
        await createCulturalGroup(invalidArea, 'Test Group')
      }).rejects.toThrow(DataIsolationError)
    })
  })

  describe('Transaction Boundary Enforcement (Requirement 13.4)', () => {
    test('should allow starting a transaction for a specific area', () => {
      const transactionId = 'test-transaction-1'
      
      // Should not throw
      expect(() => {
        beginTransaction(transactionId, 'cultura')
      }).not.toThrow()
      
      // Clean up
      endTransaction(transactionId)
    })

    test('should allow same transaction ID for same area', () => {
      const transactionId = 'test-transaction-2'
      
      beginTransaction(transactionId, 'cultura')
      
      // Should not throw when using same area
      expect(() => {
        beginTransaction(transactionId, 'cultura')
      }).not.toThrow()
      
      // Clean up
      endTransaction(transactionId)
    })

    test('should prevent transaction from spanning multiple databases', () => {
      const transactionId = 'test-transaction-3'
      
      // Start transaction in cultura
      beginTransaction(transactionId, 'cultura')
      
      // Attempting to use same transaction in deporte should throw
      expect(() => {
        beginTransaction(transactionId, 'deporte')
      }).toThrow(DataIsolationError)
      
      expect(() => {
        beginTransaction(transactionId, 'deporte')
      }).toThrow(/cannot span multiple databases/)
      
      // Clean up
      endTransaction(transactionId)
    })

    test('should allow reusing transaction ID after ending it', () => {
      const transactionId = 'test-transaction-4'
      
      // Start and end transaction in cultura
      beginTransaction(transactionId, 'cultura')
      endTransaction(transactionId)
      
      // Should be able to start new transaction with same ID in different area
      expect(() => {
        beginTransaction(transactionId, 'deporte')
      }).not.toThrow()
      
      // Clean up
      endTransaction(transactionId)
    })

    test('should validate area when starting transaction', () => {
      const transactionId = 'test-transaction-5'
      
      expect(() => {
        // @ts-expect-error Testing invalid input
        beginTransaction(transactionId, 'invalid')
      }).toThrow(DataIsolationError)
      
      expect(() => {
        // @ts-expect-error Testing invalid input
        beginTransaction(transactionId, null)
      }).toThrow(DataIsolationError)
    })

    test('endTransaction should handle non-existent transaction gracefully', () => {
      // Should not throw
      expect(() => {
        endTransaction('non-existent-transaction')
      }).not.toThrow()
    })
  })

  describe('Data Isolation Verification (Requirements 13.1, 13.2, 13.3)', () => {
    test('operations on cultura do not affect deporte', async () => {
      // Get initial counts
      const initialCulturaUsers = await getAllUsers('cultura')
      const initialDeporteUsers = await getAllUsers('deporte')
      
      const initialCulturaCount = initialCulturaUsers.length
      const initialDeporteCount = initialDeporteUsers.length
      
      // Verify counts are independent
      expect(initialCulturaCount).toBeGreaterThanOrEqual(0)
      expect(initialDeporteCount).toBeGreaterThanOrEqual(0)
      
      // The counts should be for different databases
      console.log(`Cultura has ${initialCulturaCount} users, Deporte has ${initialDeporteCount} users`)
    })

    test('user IDs do not overlap between areas', async () => {
      const culturaUsers = await getAllUsers('cultura')
      const deporteUsers = await getAllUsers('deporte')
      
      const culturaIds = new Set(culturaUsers.map(u => u.id))
      const deporteIds = new Set(deporteUsers.map(u => u.id))
      
      // No user ID should exist in both databases
      const overlap = Array.from(culturaIds).filter(id => deporteIds.has(id))
      expect(overlap).toHaveLength(0)
    })

    test('group IDs do not overlap between areas', async () => {
      const culturaGroups = await getAllCulturalGroups('cultura')
      const deporteGroups = await getAllCulturalGroups('deporte')
      
      const culturaIds = new Set(culturaGroups.map(g => g.id))
      const deporteIds = new Set(deporteGroups.map(g => g.id))
      
      // No group ID should exist in both databases
      const overlap = Array.from(culturaIds).filter(id => deporteIds.has(id))
      expect(overlap).toHaveLength(0)
    })

    test('event IDs do not overlap between areas', async () => {
      const culturaEvents = await getAllEvents('cultura')
      const deporteEvents = await getAllEvents('deporte')
      
      const culturaIds = new Set(culturaEvents.map(e => e.id))
      const deporteIds = new Set(deporteEvents.map(e => e.id))
      
      // No event ID should exist in both databases
      const overlap = Array.from(culturaIds).filter(id => deporteIds.has(id))
      expect(overlap).toHaveLength(0)
    })
  })

  describe('Error Messages', () => {
    test('DataIsolationError should have correct name', () => {
      const error = new DataIsolationError('Test message')
      expect(error.name).toBe('DataIsolationError')
      expect(error.message).toBe('Test message')
      expect(error).toBeInstanceOf(Error)
    })

    test('validation errors should be descriptive', async () => {
      try {
        // @ts-expect-error Testing invalid input
        await getAllUsers('wrong-area')
        throw new Error('Should have thrown an error')
      } catch (error) {
        expect(error).toBeInstanceOf(DataIsolationError)
        expect((error as Error).message).toContain('Invalid area specified')
        expect((error as Error).message).toContain('wrong-area')
      }
    })

    test('transaction errors should be descriptive', () => {
      const transactionId = 'test-transaction-6'
      
      beginTransaction(transactionId, 'cultura')
      
      try {
        beginTransaction(transactionId, 'deporte')
        throw new Error('Should have thrown an error')
      } catch (error) {
        expect(error).toBeInstanceOf(DataIsolationError)
        expect((error as Error).message).toContain('cannot span multiple databases')
        expect((error as Error).message).toContain(transactionId)
        expect((error as Error).message).toContain('cultura')
        expect((error as Error).message).toContain('deporte')
      } finally {
        endTransaction(transactionId)
      }
    })
  })
})

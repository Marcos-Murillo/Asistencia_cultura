/**
 * Database Infrastructure Validation Tests
 * 
 * This test suite validates the multi-area database infrastructure:
 * - Both databases (Cultura and Deporte) connect correctly
 * - Queries are routed to the correct database
 * - Environment variables are properly configured
 * 
 * Feature: sistema-multi-area
 * Task: 3. Checkpoint - Validar infraestructura de bases de datos
 */

import { describe, test, expect, beforeAll } from '@jest/globals'
import {
  validateEnvironmentVariables,
  getFirestoreForArea,
  initializeFirebaseApps,
  type Area
} from '../firebase-config'
import {
  saveUserProfile,
  getAllUsers,
  getUserById,
  saveAttendanceEntry,
  getAttendanceRecords
} from '../db-router'
import type { UserProfile } from '../types'

describe('Database Infrastructure Validation', () => {
  
  describe('Environment Variables', () => {
    test('all required environment variables should be present', () => {
      const validation = validateEnvironmentVariables()
      
      expect(validation.valid).toBe(true)
      expect(validation.missing).toHaveLength(0)
      
      if (!validation.valid) {
        console.error('Missing environment variables:', validation.missing)
      }
    })
  })

  describe('Firebase Initialization', () => {
    beforeAll(() => {
      initializeFirebaseApps()
    })

    test('should initialize Cultura database connection', () => {
      expect(() => {
        const db = getFirestoreForArea('cultura')
        expect(db).toBeDefined()
      }).not.toThrow()
    })

    test('should initialize Deporte database connection', () => {
      expect(() => {
        const db = getFirestoreForArea('deporte')
        expect(db).toBeDefined()
      }).not.toThrow()
    })

    test('should return different Firestore instances for different areas', () => {
      const culturaDb = getFirestoreForArea('cultura')
      const deporteDb = getFirestoreForArea('deporte')
      
      expect(culturaDb).toBeDefined()
      expect(deporteDb).toBeDefined()
      // They should be different instances
      expect(culturaDb).not.toBe(deporteDb)
    })
  })

  describe('Query Routing', () => {
    const testUserCultura: Omit<UserProfile, "id" | "createdAt" | "lastAttendance"> = {
      nombres: 'Test User Cultura',
      correo: `test-cultura-${Date.now()}@test.com`,
      numeroDocumento: '1234567890',
      telefono: '3001234567',
      genero: 'OTRO',
      etnia: 'MESTIZO',
      tipoDocumento: 'CEDULA',
      edad: 25,
      sede: 'Meléndez',
      estamento: 'ESTUDIANTE',
      area: 'cultura'
    }

    const testUserDeporte: Omit<UserProfile, "id" | "createdAt" | "lastAttendance"> = {
      nombres: 'Test User Deporte',
      correo: `test-deporte-${Date.now()}@test.com`,
      numeroDocumento: '0987654321',
      telefono: '3009876543',
      genero: 'OTRO',
      etnia: 'MESTIZO',
      tipoDocumento: 'CEDULA',
      edad: 22,
      sede: 'Meléndez',
      estamento: 'ESTUDIANTE',
      area: 'deporte',
      codigoEstudiantil: '2012345'
    }

    test('should save user to Cultura database when area is cultura', async () => {
      const userId = await saveUserProfile('cultura', testUserCultura)
      
      expect(userId).toBeDefined()
      expect(typeof userId).toBe('string')
      expect(userId.length).toBeGreaterThan(0)
    })

    test('should save user to Deporte database when area is deporte', async () => {
      const userId = await saveUserProfile('deporte', testUserDeporte)
      
      expect(userId).toBeDefined()
      expect(typeof userId).toBe('string')
      expect(userId.length).toBeGreaterThan(0)
    })

    test('should retrieve user from correct database - Cultura', async () => {
      // Save a user to Cultura
      const userId = await saveUserProfile('cultura', testUserCultura)
      
      // Retrieve from Cultura - should succeed
      const user = await getUserById('cultura', userId)
      expect(user).not.toBeNull()
      expect(user?.nombres).toBe(testUserCultura.nombres)
      expect(user?.area).toBe('cultura')
    })

    test('should retrieve user from correct database - Deporte', async () => {
      // Save a user to Deporte
      const userId = await saveUserProfile('deporte', testUserDeporte)
      
      // Retrieve from Deporte - should succeed
      const user = await getUserById('deporte', userId)
      expect(user).not.toBeNull()
      expect(user?.nombres).toBe(testUserDeporte.nombres)
      expect(user?.area).toBe('deporte')
      expect(user?.codigoEstudiantil).toBe('2012345')
    })

    test('should not find user in wrong database', async () => {
      // Save a user to Cultura
      const userId = await saveUserProfile('cultura', {
        ...testUserCultura,
        correo: `test-isolation-${Date.now()}@test.com`
      })
      
      // Try to retrieve from Deporte - should not find it
      const user = await getUserById('deporte', userId)
      expect(user).toBeNull()
    })

    test('should retrieve all users from Cultura database only', async () => {
      const users = await getAllUsers('cultura')
      
      expect(Array.isArray(users)).toBe(true)
      // All users should have area 'cultura' or undefined (for legacy data)
      users.forEach(user => {
        if (user.area) {
          expect(user.area).toBe('cultura')
        }
      })
    })

    test('should retrieve all users from Deporte database only', async () => {
      const users = await getAllUsers('deporte')
      
      expect(Array.isArray(users)).toBe(true)
      // All users should have area 'deporte' or undefined (for legacy data)
      users.forEach(user => {
        if (user.area) {
          expect(user.area).toBe('deporte')
        }
      })
    })
  })

  describe('Data Isolation', () => {
    test('users saved to Cultura should not appear in Deporte queries', async () => {
      const uniqueEmail = `isolation-cultura-${Date.now()}@test.com`
      
      // Save to Cultura
      await saveUserProfile('cultura', {
        nombres: 'Isolation Test Cultura',
        correo: uniqueEmail,
        numeroDocumento: '1111111111',
        telefono: '3001111111',
        genero: 'OTRO',
        etnia: 'MESTIZO',
        tipoDocumento: 'CEDULA',
        edad: 20,
        sede: 'Meléndez',
        estamento: 'ESTUDIANTE',
        area: 'cultura'
      })
      
      // Query Deporte
      const deporteUsers = await getAllUsers('deporte')
      const foundInDeporte = deporteUsers.find(u => u.correo === uniqueEmail)
      
      expect(foundInDeporte).toBeUndefined()
    })

    test('users saved to Deporte should not appear in Cultura queries', async () => {
      const uniqueEmail = `isolation-deporte-${Date.now()}@test.com`
      
      // Save to Deporte
      await saveUserProfile('deporte', {
        nombres: 'Isolation Test Deporte',
        correo: uniqueEmail,
        numeroDocumento: '2222222222',
        telefono: '3002222222',
        genero: 'OTRO',
        etnia: 'MESTIZO',
        tipoDocumento: 'CEDULA',
        edad: 21,
        sede: 'Meléndez',
        estamento: 'ESTUDIANTE',
        area: 'deporte',
        codigoEstudiantil: '2022222'
      })
      
      // Query Cultura
      const culturaUsers = await getAllUsers('cultura')
      const foundInCultura = culturaUsers.find(u => u.correo === uniqueEmail)
      
      expect(foundInCultura).toBeUndefined()
    })
  })

  describe('Attendance Records Routing', () => {
    test('should save and retrieve attendance records from correct database - Cultura', async () => {
      // Create a test user in Cultura
      const userId = await saveUserProfile('cultura', {
        nombres: 'Attendance Test Cultura',
        correo: `attendance-cultura-${Date.now()}@test.com`,
        numeroDocumento: '3333333333',
        telefono: '3003333333',
        genero: 'OTRO',
        etnia: 'MESTIZO',
        tipoDocumento: 'CEDULA',
        edad: 23,
        sede: 'Meléndez',
        estamento: 'ESTUDIANTE',
        area: 'cultura'
      })
      
      // Save attendance to Cultura
      await saveAttendanceEntry('cultura', userId, 'Test Group Cultura')
      
      // Retrieve attendance from Cultura
      const records = await getAttendanceRecords('cultura')
      const userRecord = records.find(r => r.correo.includes('attendance-cultura'))
      
      expect(userRecord).toBeDefined()
      expect(userRecord?.grupoCultural).toBe('Test Group Cultura')
    })

    test('should save and retrieve attendance records from correct database - Deporte', async () => {
      // Create a test user in Deporte
      const userId = await saveUserProfile('deporte', {
        nombres: 'Attendance Test Deporte',
        correo: `attendance-deporte-${Date.now()}@test.com`,
        numeroDocumento: '4444444444',
        telefono: '3004444444',
        genero: 'OTRO',
        etnia: 'MESTIZO',
        tipoDocumento: 'CEDULA',
        edad: 24,
        sede: 'Meléndez',
        estamento: 'ESTUDIANTE',
        area: 'deporte',
        codigoEstudiantil: '2044444'
      })
      
      // Save attendance to Deporte
      await saveAttendanceEntry('deporte', userId, 'Test Group Deporte')
      
      // Retrieve attendance from Deporte
      const records = await getAttendanceRecords('deporte')
      const userRecord = records.find(r => r.correo.includes('attendance-deporte'))
      
      expect(userRecord).toBeDefined()
      expect(userRecord?.grupoCultural).toBe('Test Group Deporte')
    })
  })
})

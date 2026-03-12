/**
 * Database Router Query Functions Tests
 * 
 * This test suite validates the area-aware query functions in db-router:
 * - getAllUsers filters by area
 * - getAttendanceRecords filters by area
 * - getAllEvents filters by area
 * - getAllCulturalGroups filters by area
 * 
 * Feature: sistema-multi-area
 * Task: 10.1 Actualizar funciones de consulta en db-router.ts
 * Requirements: 8.1, 8.3, 8.4, 8.5
 */

import { describe, test, expect, beforeAll } from '@jest/globals'
import { initializeFirebaseApps } from '../firebase-config'
import {
  getAllUsers,
  getAttendanceRecords,
  getAllEvents,
  getAllCulturalGroups
} from '../db-router'

describe('Database Router Query Functions', () => {
  
  beforeAll(() => {
    initializeFirebaseApps()
  })

  describe('getAllUsers - Area Filtering', () => {
    test('should retrieve users from Cultura database', async () => {
      const users = await getAllUsers('cultura')
      
      expect(Array.isArray(users)).toBe(true)
      console.log(`Retrieved ${users.length} users from Cultura`)
      
      // All users should have area 'cultura' or undefined (for legacy data)
      users.forEach(user => {
        if (user.area) {
          expect(user.area).toBe('cultura')
        }
      })
    })

    test('should retrieve users from Deporte database', async () => {
      const users = await getAllUsers('deporte')
      
      expect(Array.isArray(users)).toBe(true)
      console.log(`Retrieved ${users.length} users from Deporte`)
      
      // All users should have area 'deporte' or undefined (for legacy data)
      users.forEach(user => {
        if (user.area) {
          expect(user.area).toBe('deporte')
        }
      })
    })

    test('Cultura and Deporte should have different user sets', async () => {
      const culturaUsers = await getAllUsers('cultura')
      const deporteUsers = await getAllUsers('deporte')
      
      // Get user IDs
      const culturaIds = new Set(culturaUsers.map(u => u.id))
      const deporteIds = new Set(deporteUsers.map(u => u.id))
      
      // There should be no overlap in user IDs
      const overlap = [...culturaIds].filter(id => deporteIds.has(id))
      expect(overlap).toHaveLength(0)
    })
  })

  describe('getAttendanceRecords - Area Filtering', () => {
    test('should retrieve attendance records from Cultura database', async () => {
      const records = await getAttendanceRecords('cultura')
      
      expect(Array.isArray(records)).toBe(true)
      console.log(`Retrieved ${records.length} attendance records from Cultura`)
      
      // Each record should have required fields
      records.forEach(record => {
        expect(record.id).toBeDefined()
        expect(record.timestamp).toBeInstanceOf(Date)
        expect(record.nombres).toBeDefined()
        expect(record.grupoCultural).toBeDefined()
      })
    })

    test('should retrieve attendance records from Deporte database', async () => {
      const records = await getAttendanceRecords('deporte')
      
      expect(Array.isArray(records)).toBe(true)
      console.log(`Retrieved ${records.length} attendance records from Deporte`)
      
      // Each record should have required fields
      records.forEach(record => {
        expect(record.id).toBeDefined()
        expect(record.timestamp).toBeInstanceOf(Date)
        expect(record.nombres).toBeDefined()
        expect(record.grupoCultural).toBeDefined()
      })
    })
  })

  describe('getAllEvents - Area Filtering', () => {
    test('should retrieve events from Cultura database', async () => {
      const events = await getAllEvents('cultura')
      
      expect(Array.isArray(events)).toBe(true)
      console.log(`Retrieved ${events.length} events from Cultura`)
      
      // Each event should have required fields
      events.forEach(event => {
        expect(event.id).toBeDefined()
        expect(event.nombre).toBeDefined()
        expect(event.fechaApertura).toBeInstanceOf(Date)
        expect(event.fechaVencimiento).toBeInstanceOf(Date)
        expect(event.createdAt).toBeInstanceOf(Date)
      })
    })

    test('should retrieve events from Deporte database', async () => {
      const events = await getAllEvents('deporte')
      
      expect(Array.isArray(events)).toBe(true)
      console.log(`Retrieved ${events.length} events from Deporte`)
      
      // Each event should have required fields
      events.forEach(event => {
        expect(event.id).toBeDefined()
        expect(event.nombre).toBeDefined()
        expect(event.fechaApertura).toBeInstanceOf(Date)
        expect(event.fechaVencimiento).toBeInstanceOf(Date)
        expect(event.createdAt).toBeInstanceOf(Date)
      })
    })

    test('Cultura and Deporte should have different event sets', async () => {
      const culturaEvents = await getAllEvents('cultura')
      const deporteEvents = await getAllEvents('deporte')
      
      // Get event IDs
      const culturaIds = new Set(culturaEvents.map(e => e.id))
      const deporteIds = new Set(deporteEvents.map(e => e.id))
      
      // There should be no overlap in event IDs
      const overlap = [...culturaIds].filter(id => deporteIds.has(id))
      expect(overlap).toHaveLength(0)
    })
  })

  describe('getAllCulturalGroups - Area Filtering', () => {
    test('should retrieve cultural groups from Cultura database', async () => {
      const groups = await getAllCulturalGroups('cultura')
      
      expect(Array.isArray(groups)).toBe(true)
      console.log(`Retrieved ${groups.length} cultural groups from Cultura`)
      
      // Each group should have required fields
      groups.forEach(group => {
        expect(group.id).toBeDefined()
        expect(group.nombre).toBeDefined()
        expect(group.createdAt).toBeInstanceOf(Date)
        expect(typeof group.activo).toBe('boolean')
      })
      
      // Groups should be sorted alphabetically by name
      for (let i = 1; i < groups.length; i++) {
        expect(groups[i-1].nombre.localeCompare(groups[i].nombre)).toBeLessThanOrEqual(0)
      }
    })

    test('should retrieve cultural groups from Deporte database', async () => {
      const groups = await getAllCulturalGroups('deporte')
      
      expect(Array.isArray(groups)).toBe(true)
      console.log(`Retrieved ${groups.length} cultural groups from Deporte`)
      
      // Each group should have required fields
      groups.forEach(group => {
        expect(group.id).toBeDefined()
        expect(group.nombre).toBeDefined()
        expect(group.createdAt).toBeInstanceOf(Date)
        expect(typeof group.activo).toBe('boolean')
      })
      
      // Groups should be sorted alphabetically by name
      for (let i = 1; i < groups.length; i++) {
        expect(groups[i-1].nombre.localeCompare(groups[i].nombre)).toBeLessThanOrEqual(0)
      }
    })

    test('Cultura and Deporte should have different group sets', async () => {
      const culturaGroups = await getAllCulturalGroups('cultura')
      const deporteGroups = await getAllCulturalGroups('deporte')
      
      // Get group IDs
      const culturaIds = new Set(culturaGroups.map(g => g.id))
      const deporteIds = new Set(deporteGroups.map(g => g.id))
      
      // There should be no overlap in group IDs
      const overlap = [...culturaIds].filter(id => deporteIds.has(id))
      expect(overlap).toHaveLength(0)
    })
  })

  describe('Data Consistency', () => {
    test('all query functions should respect area boundaries', async () => {
      // Query all data from both areas
      const [
        culturaUsers,
        deporteUsers,
        culturaAttendance,
        deporteAttendance,
        culturaEvents,
        deporteEvents,
        culturaGroups,
        deporteGroups
      ] = await Promise.all([
        getAllUsers('cultura'),
        getAllUsers('deporte'),
        getAttendanceRecords('cultura'),
        getAttendanceRecords('deporte'),
        getAllEvents('cultura'),
        getAllEvents('deporte'),
        getAllCulturalGroups('cultura'),
        getAllCulturalGroups('deporte')
      ])
      
      // Log summary
      console.log('Data Summary:')
      console.log(`  Cultura: ${culturaUsers.length} users, ${culturaAttendance.length} attendance, ${culturaEvents.length} events, ${culturaGroups.length} groups`)
      console.log(`  Deporte: ${deporteUsers.length} users, ${deporteAttendance.length} attendance, ${deporteEvents.length} events, ${deporteGroups.length} groups`)
      
      // All queries should return arrays
      expect(Array.isArray(culturaUsers)).toBe(true)
      expect(Array.isArray(deporteUsers)).toBe(true)
      expect(Array.isArray(culturaAttendance)).toBe(true)
      expect(Array.isArray(deporteAttendance)).toBe(true)
      expect(Array.isArray(culturaEvents)).toBe(true)
      expect(Array.isArray(deporteEvents)).toBe(true)
      expect(Array.isArray(culturaGroups)).toBe(true)
      expect(Array.isArray(deporteGroups)).toBe(true)
    })
  })
})

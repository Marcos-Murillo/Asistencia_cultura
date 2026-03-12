/**
 * Role Manager Unit Tests
 * 
 * This test suite validates the role management system:
 * - getRolePermissions returns correct permissions for each role
 * - filterDataByPermissions correctly filters data based on permissions
 * - Role-specific behaviors (single vs multiple group assignments)
 * - filterGroupsByAssignment filters groups by assigned groups
 * - filterStudentsByAssignment filters students by assigned groups
 * - filterAttendanceByAssignment filters attendance records by assigned groups
 * 
 * Feature: sistema-multi-area
 * Task: 6.1 Crear módulo lib/role-manager.ts
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 6.6, 6.7, 6.8, 6.9, 6.10, 6.11, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */

import { describe, test, expect } from '@jest/globals'
import { 
  getRolePermissions, 
  filterDataByPermissions,
  filterGroupsByAssignment,
  filterStudentsByAssignment,
  filterAttendanceByAssignment
} from '../role-manager'
import type { RolePermissions } from '../role-manager'

describe('Role Manager', () => {
  
  describe('getRolePermissions', () => {
    
    test('SUPER_ADMIN should have all permissions and can switch areas', () => {
      const permissions = getRolePermissions('SUPER_ADMIN', 'cultura')
      
      expect(permissions.canViewAllGroups).toBe(true)
      expect(permissions.canViewAllUsers).toBe(true)
      expect(permissions.canManageUsers).toBe(true)
      expect(permissions.canSwitchArea).toBe(true)
      expect(permissions.assignedGroups).toEqual([])
    })
    
    test('DIRECTOR in Cultura should have limited permissions with assigned groups', () => {
      const assignedGroups = ['grupo-123']
      const permissions = getRolePermissions('DIRECTOR', 'cultura', assignedGroups)
      
      expect(permissions.canViewAllGroups).toBe(false)
      expect(permissions.canViewAllUsers).toBe(false)
      expect(permissions.canManageUsers).toBe(false)
      expect(permissions.canSwitchArea).toBe(false)
      expect(permissions.assignedGroups).toEqual(['grupo-123'])
    })
    
    test('DIRECTOR without assigned groups should have empty assignedGroups', () => {
      const permissions = getRolePermissions('DIRECTOR', 'cultura', [])
      
      expect(permissions.assignedGroups).toEqual([])
    })
    
    test('MONITOR in Cultura should have limited permissions with single group', () => {
      const assignedGroups = ['grupo-456']
      const permissions = getRolePermissions('MONITOR', 'cultura', assignedGroups)
      
      expect(permissions.canViewAllGroups).toBe(false)
      expect(permissions.canViewAllUsers).toBe(false)
      expect(permissions.canManageUsers).toBe(false)
      expect(permissions.canSwitchArea).toBe(false)
      expect(permissions.assignedGroups).toEqual(['grupo-456'])
    })
    
    test('MONITOR in Deporte should support multiple groups', () => {
      const assignedGroups = ['grupo-789', 'grupo-101', 'grupo-102']
      const permissions = getRolePermissions('MONITOR', 'deporte', assignedGroups)
      
      expect(permissions.canViewAllGroups).toBe(false)
      expect(permissions.canViewAllUsers).toBe(false)
      expect(permissions.canManageUsers).toBe(false)
      expect(permissions.canSwitchArea).toBe(false)
      expect(permissions.assignedGroups).toEqual(['grupo-789', 'grupo-101', 'grupo-102'])
    })
    
    test('ENTRENADOR in Deporte should support multiple groups', () => {
      const assignedGroups = ['grupo-201', 'grupo-202', 'grupo-203', 'grupo-204']
      const permissions = getRolePermissions('ENTRENADOR', 'deporte', assignedGroups)
      
      expect(permissions.canViewAllGroups).toBe(false)
      expect(permissions.canViewAllUsers).toBe(false)
      expect(permissions.canManageUsers).toBe(false)
      expect(permissions.canSwitchArea).toBe(false)
      expect(permissions.assignedGroups).toEqual(['grupo-201', 'grupo-202', 'grupo-203', 'grupo-204'])
    })
    
    test('ESTUDIANTE should have no permissions', () => {
      const permissions = getRolePermissions('ESTUDIANTE', 'cultura')
      
      expect(permissions.canViewAllGroups).toBe(false)
      expect(permissions.canViewAllUsers).toBe(false)
      expect(permissions.canManageUsers).toBe(false)
      expect(permissions.canSwitchArea).toBe(false)
      expect(permissions.assignedGroups).toEqual([])
    })
    
    test('should handle undefined role as ESTUDIANTE', () => {
      // @ts-expect-error Testing undefined role
      const permissions = getRolePermissions(undefined, 'cultura')
      
      expect(permissions.canViewAllGroups).toBe(false)
      expect(permissions.canViewAllUsers).toBe(false)
      expect(permissions.canManageUsers).toBe(false)
      expect(permissions.canSwitchArea).toBe(false)
      expect(permissions.assignedGroups).toEqual([])
    })
  })
  
  describe('filterDataByPermissions', () => {
    
    const testData = [
      { id: '1', name: 'Item 1', grupoCultural: 'grupo-123' },
      { id: '2', name: 'Item 2', grupoCultural: 'grupo-456' },
      { id: '3', name: 'Item 3', grupoCultural: 'grupo-789' },
      { id: '4', name: 'Item 4', grupoCultural: 'grupo-123' },
      { id: '5', name: 'Item 5', grupoCultural: 'grupo-101' },
    ]
    
    test('should return all data when canViewAllGroups is true', () => {
      const permissions: RolePermissions = {
        canViewAllGroups: true,
        canViewAllUsers: true,
        canManageUsers: true,
        canSwitchArea: true,
        assignedGroups: [],
      }
      
      const filtered = filterDataByPermissions(testData, permissions)
      
      expect(filtered).toHaveLength(5)
      expect(filtered).toEqual(testData)
    })
    
    test('should return empty array when no groups are assigned', () => {
      const permissions: RolePermissions = {
        canViewAllGroups: false,
        canViewAllUsers: false,
        canManageUsers: false,
        canSwitchArea: false,
        assignedGroups: [],
      }
      
      const filtered = filterDataByPermissions(testData, permissions)
      
      expect(filtered).toHaveLength(0)
      expect(filtered).toEqual([])
    })
    
    test('should filter data by single assigned group', () => {
      const permissions: RolePermissions = {
        canViewAllGroups: false,
        canViewAllUsers: false,
        canManageUsers: false,
        canSwitchArea: false,
        assignedGroups: ['grupo-123'],
      }
      
      const filtered = filterDataByPermissions(testData, permissions)
      
      expect(filtered).toHaveLength(2)
      expect(filtered[0].id).toBe('1')
      expect(filtered[1].id).toBe('4')
      expect(filtered.every(item => item.grupoCultural === 'grupo-123')).toBe(true)
    })
    
    test('should filter data by multiple assigned groups', () => {
      const permissions: RolePermissions = {
        canViewAllGroups: false,
        canViewAllUsers: false,
        canManageUsers: false,
        canSwitchArea: false,
        assignedGroups: ['grupo-123', 'grupo-789'],
      }
      
      const filtered = filterDataByPermissions(testData, permissions)
      
      expect(filtered).toHaveLength(3)
      expect(filtered.map(item => item.id)).toEqual(['1', '3', '4'])
      expect(filtered.every(item => 
        item.grupoCultural === 'grupo-123' || item.grupoCultural === 'grupo-789'
      )).toBe(true)
    })
    
    test('should handle data items without grupoCultural field', () => {
      const dataWithMissing = [
        { id: '1', name: 'Item 1', grupoCultural: 'grupo-123' },
        { id: '2', name: 'Item 2' }, // Missing grupoCultural
        { id: '3', name: 'Item 3', grupoCultural: 'grupo-123' },
      ]
      
      const permissions: RolePermissions = {
        canViewAllGroups: false,
        canViewAllUsers: false,
        canManageUsers: false,
        canSwitchArea: false,
        assignedGroups: ['grupo-123'],
      }
      
      const filtered = filterDataByPermissions(dataWithMissing, permissions)
      
      expect(filtered).toHaveLength(2)
      expect(filtered.every(item => item.grupoCultural === 'grupo-123')).toBe(true)
    })
    
    test('should return empty array when assigned group does not match any data', () => {
      const permissions: RolePermissions = {
        canViewAllGroups: false,
        canViewAllUsers: false,
        canManageUsers: false,
        canSwitchArea: false,
        assignedGroups: ['grupo-999'],
      }
      
      const filtered = filterDataByPermissions(testData, permissions)
      
      expect(filtered).toHaveLength(0)
      expect(filtered).toEqual([])
    })
    
    test('should work with empty data array', () => {
      const permissions: RolePermissions = {
        canViewAllGroups: false,
        canViewAllUsers: false,
        canManageUsers: false,
        canSwitchArea: false,
        assignedGroups: ['grupo-123'],
      }
      
      const filtered = filterDataByPermissions([], permissions)
      
      expect(filtered).toHaveLength(0)
      expect(filtered).toEqual([])
    })
  })
  
  describe('Integration: getRolePermissions + filterDataByPermissions', () => {
    
    const testStudents = [
      { id: '1', name: 'Student 1', grupoCultural: 'Danza' },
      { id: '2', name: 'Student 2', grupoCultural: 'Teatro' },
      { id: '3', name: 'Student 3', grupoCultural: 'Música' },
      { id: '4', name: 'Student 4', grupoCultural: 'Danza' },
    ]
    
    test('DIRECTOR should see only students from their assigned group', () => {
      const permissions = getRolePermissions('DIRECTOR', 'cultura', ['Danza'])
      const filtered = filterDataByPermissions(testStudents, permissions)
      
      expect(filtered).toHaveLength(2)
      expect(filtered.every(s => s.grupoCultural === 'Danza')).toBe(true)
    })
    
    test('MONITOR in Cultura should see only students from their assigned group', () => {
      const permissions = getRolePermissions('MONITOR', 'cultura', ['Teatro'])
      const filtered = filterDataByPermissions(testStudents, permissions)
      
      expect(filtered).toHaveLength(1)
      expect(filtered[0].grupoCultural).toBe('Teatro')
    })
    
    test('ENTRENADOR in Deporte should see students from all assigned groups', () => {
      const permissions = getRolePermissions('ENTRENADOR', 'deporte', ['Danza', 'Música'])
      const filtered = filterDataByPermissions(testStudents, permissions)
      
      expect(filtered).toHaveLength(3)
      expect(filtered.map(s => s.id)).toEqual(['1', '3', '4'])
    })
    
    test('SUPER_ADMIN should see all students', () => {
      const permissions = getRolePermissions('SUPER_ADMIN', 'cultura')
      const filtered = filterDataByPermissions(testStudents, permissions)
      
      expect(filtered).toHaveLength(4)
      expect(filtered).toEqual(testStudents)
    })
    
    test('ESTUDIANTE should see no students', () => {
      const permissions = getRolePermissions('ESTUDIANTE', 'cultura')
      const filtered = filterDataByPermissions(testStudents, permissions)
      
      expect(filtered).toHaveLength(0)
    })
  })
  
  describe('filterGroupsByAssignment', () => {
    
    const testGroups = [
      { id: 'grupo-1', nombre: 'Danza' },
      { id: 'grupo-2', nombre: 'Teatro' },
      { id: 'grupo-3', nombre: 'Música' },
      { id: 'grupo-4', nombre: 'Pintura' },
    ]
    
    test('should return all groups when canViewAllGroups is true', () => {
      const permissions: RolePermissions = {
        canViewAllGroups: true,
        canViewAllUsers: true,
        canManageUsers: true,
        canSwitchArea: true,
        assignedGroups: [],
      }
      
      const filtered = filterGroupsByAssignment(testGroups, permissions)
      
      expect(filtered).toHaveLength(4)
      expect(filtered).toEqual(testGroups)
    })
    
    test('should return empty array when no groups are assigned', () => {
      const permissions: RolePermissions = {
        canViewAllGroups: false,
        canViewAllUsers: false,
        canManageUsers: false,
        canSwitchArea: false,
        assignedGroups: [],
      }
      
      const filtered = filterGroupsByAssignment(testGroups, permissions)
      
      expect(filtered).toHaveLength(0)
      expect(filtered).toEqual([])
    })
    
    test('should filter groups by single assigned group (Cultura Director/Monitor)', () => {
      const permissions: RolePermissions = {
        canViewAllGroups: false,
        canViewAllUsers: false,
        canManageUsers: false,
        canSwitchArea: false,
        assignedGroups: ['grupo-1'],
      }
      
      const filtered = filterGroupsByAssignment(testGroups, permissions)
      
      expect(filtered).toHaveLength(1)
      expect(filtered[0].id).toBe('grupo-1')
      expect(filtered[0].nombre).toBe('Danza')
    })
    
    test('should filter groups by multiple assigned groups (Deporte Entrenador/Monitor)', () => {
      const permissions: RolePermissions = {
        canViewAllGroups: false,
        canViewAllUsers: false,
        canManageUsers: false,
        canSwitchArea: false,
        assignedGroups: ['grupo-1', 'grupo-3', 'grupo-4'],
      }
      
      const filtered = filterGroupsByAssignment(testGroups, permissions)
      
      expect(filtered).toHaveLength(3)
      expect(filtered.map(g => g.id)).toEqual(['grupo-1', 'grupo-3', 'grupo-4'])
      expect(filtered.map(g => g.nombre)).toEqual(['Danza', 'Música', 'Pintura'])
    })
    
    test('should return empty array when assigned group does not match any group', () => {
      const permissions: RolePermissions = {
        canViewAllGroups: false,
        canViewAllUsers: false,
        canManageUsers: false,
        canSwitchArea: false,
        assignedGroups: ['grupo-999'],
      }
      
      const filtered = filterGroupsByAssignment(testGroups, permissions)
      
      expect(filtered).toHaveLength(0)
      expect(filtered).toEqual([])
    })
    
    test('should work with empty groups array', () => {
      const permissions: RolePermissions = {
        canViewAllGroups: false,
        canViewAllUsers: false,
        canManageUsers: false,
        canSwitchArea: false,
        assignedGroups: ['grupo-1'],
      }
      
      const filtered = filterGroupsByAssignment([], permissions)
      
      expect(filtered).toHaveLength(0)
      expect(filtered).toEqual([])
    })
  })
  
  describe('filterStudentsByAssignment', () => {
    
    const testStudents = [
      { id: 'user-1', name: 'Student 1', grupoCultural: 'grupo-1' },
      { id: 'user-2', name: 'Student 2', grupoCultural: 'grupo-2' },
      { id: 'user-3', name: 'Student 3', grupoCultural: 'grupo-3' },
      { id: 'user-4', name: 'Student 4', grupoCultural: 'grupo-1' },
      { id: 'user-5', name: 'Student 5' }, // No group assigned
    ]
    
    test('should return all students when canViewAllUsers is true', () => {
      const permissions: RolePermissions = {
        canViewAllGroups: true,
        canViewAllUsers: true,
        canManageUsers: true,
        canSwitchArea: true,
        assignedGroups: [],
      }
      
      const filtered = filterStudentsByAssignment(testStudents, permissions)
      
      expect(filtered).toHaveLength(5)
      expect(filtered).toEqual(testStudents)
    })
    
    test('should return empty array when no groups are assigned', () => {
      const permissions: RolePermissions = {
        canViewAllGroups: false,
        canViewAllUsers: false,
        canManageUsers: false,
        canSwitchArea: false,
        assignedGroups: [],
      }
      
      const filtered = filterStudentsByAssignment(testStudents, permissions)
      
      expect(filtered).toHaveLength(0)
      expect(filtered).toEqual([])
    })
    
    test('should filter students by single assigned group (Cultura Director/Monitor)', () => {
      const permissions: RolePermissions = {
        canViewAllGroups: false,
        canViewAllUsers: false,
        canManageUsers: false,
        canSwitchArea: false,
        assignedGroups: ['grupo-1'],
      }
      
      const filtered = filterStudentsByAssignment(testStudents, permissions)
      
      expect(filtered).toHaveLength(2)
      expect(filtered.map(s => s.id)).toEqual(['user-1', 'user-4'])
      expect(filtered.every(s => s.grupoCultural === 'grupo-1')).toBe(true)
    })
    
    test('should filter students by multiple assigned groups (Deporte Entrenador/Monitor)', () => {
      const permissions: RolePermissions = {
        canViewAllGroups: false,
        canViewAllUsers: false,
        canManageUsers: false,
        canSwitchArea: false,
        assignedGroups: ['grupo-1', 'grupo-3'],
      }
      
      const filtered = filterStudentsByAssignment(testStudents, permissions)
      
      expect(filtered).toHaveLength(3)
      expect(filtered.map(s => s.id)).toEqual(['user-1', 'user-3', 'user-4'])
    })
    
    test('should exclude students without grupoCultural field', () => {
      const permissions: RolePermissions = {
        canViewAllGroups: false,
        canViewAllUsers: false,
        canManageUsers: false,
        canSwitchArea: false,
        assignedGroups: ['grupo-1', 'grupo-2', 'grupo-3'],
      }
      
      const filtered = filterStudentsByAssignment(testStudents, permissions)
      
      expect(filtered).toHaveLength(4)
      expect(filtered.every(s => s.grupoCultural !== undefined)).toBe(true)
    })
    
    test('should return empty array when assigned group does not match any student', () => {
      const permissions: RolePermissions = {
        canViewAllGroups: false,
        canViewAllUsers: false,
        canManageUsers: false,
        canSwitchArea: false,
        assignedGroups: ['grupo-999'],
      }
      
      const filtered = filterStudentsByAssignment(testStudents, permissions)
      
      expect(filtered).toHaveLength(0)
      expect(filtered).toEqual([])
    })
  })
  
  describe('filterAttendanceByAssignment', () => {
    
    const testAttendance = [
      { id: 'att-1', userId: 'user-1', grupoCultural: 'grupo-1', timestamp: new Date() },
      { id: 'att-2', userId: 'user-2', grupoCultural: 'grupo-2', timestamp: new Date() },
      { id: 'att-3', userId: 'user-3', grupoCultural: 'grupo-3', timestamp: new Date() },
      { id: 'att-4', userId: 'user-1', grupoCultural: 'grupo-1', timestamp: new Date() },
      { id: 'att-5', userId: 'user-4', grupoCultural: 'grupo-2', timestamp: new Date() },
    ]
    
    test('should return all attendance records when canViewAllGroups is true', () => {
      const permissions: RolePermissions = {
        canViewAllGroups: true,
        canViewAllUsers: true,
        canManageUsers: true,
        canSwitchArea: true,
        assignedGroups: [],
      }
      
      const filtered = filterAttendanceByAssignment(testAttendance, permissions)
      
      expect(filtered).toHaveLength(5)
      expect(filtered).toEqual(testAttendance)
    })
    
    test('should return empty array when no groups are assigned', () => {
      const permissions: RolePermissions = {
        canViewAllGroups: false,
        canViewAllUsers: false,
        canManageUsers: false,
        canSwitchArea: false,
        assignedGroups: [],
      }
      
      const filtered = filterAttendanceByAssignment(testAttendance, permissions)
      
      expect(filtered).toHaveLength(0)
      expect(filtered).toEqual([])
    })
    
    test('should filter attendance by single assigned group (Cultura Director/Monitor)', () => {
      const permissions: RolePermissions = {
        canViewAllGroups: false,
        canViewAllUsers: false,
        canManageUsers: false,
        canSwitchArea: false,
        assignedGroups: ['grupo-1'],
      }
      
      const filtered = filterAttendanceByAssignment(testAttendance, permissions)
      
      expect(filtered).toHaveLength(2)
      expect(filtered.map(a => a.id)).toEqual(['att-1', 'att-4'])
      expect(filtered.every(a => a.grupoCultural === 'grupo-1')).toBe(true)
    })
    
    test('should filter attendance by multiple assigned groups (Deporte Entrenador/Monitor)', () => {
      const permissions: RolePermissions = {
        canViewAllGroups: false,
        canViewAllUsers: false,
        canManageUsers: false,
        canSwitchArea: false,
        assignedGroups: ['grupo-1', 'grupo-3'],
      }
      
      const filtered = filterAttendanceByAssignment(testAttendance, permissions)
      
      expect(filtered).toHaveLength(3)
      expect(filtered.map(a => a.id)).toEqual(['att-1', 'att-3', 'att-4'])
    })
    
    test('should return empty array when assigned group does not match any attendance', () => {
      const permissions: RolePermissions = {
        canViewAllGroups: false,
        canViewAllUsers: false,
        canManageUsers: false,
        canSwitchArea: false,
        assignedGroups: ['grupo-999'],
      }
      
      const filtered = filterAttendanceByAssignment(testAttendance, permissions)
      
      expect(filtered).toHaveLength(0)
      expect(filtered).toEqual([])
    })
    
    test('should work with empty attendance array', () => {
      const permissions: RolePermissions = {
        canViewAllGroups: false,
        canViewAllUsers: false,
        canManageUsers: false,
        canSwitchArea: false,
        assignedGroups: ['grupo-1'],
      }
      
      const filtered = filterAttendanceByAssignment([], permissions)
      
      expect(filtered).toHaveLength(0)
      expect(filtered).toEqual([])
    })
  })
})

/**
 * Helper functions for authentication and role management
 */

import type { UserRole } from './types'

/**
 * Get the correct user role from sessionStorage
 * If user is super admin, returns SUPER_ADMIN regardless of stored role
 * If user is admin (but not super admin), returns ADMIN
 */
export function getCurrentUserRole(): UserRole {
  const superAdminStatus = sessionStorage.getItem("isSuperAdmin") === "true"
  const adminStatus = sessionStorage.getItem("isAdmin") === "true"
  const storedUserRole = sessionStorage.getItem("userRole")
  
  if (superAdminStatus) {
    return "SUPER_ADMIN"
  } else if (adminStatus) {
    // Si es admin pero no super admin, retornar ADMIN
    return "ADMIN"
  } else if (storedUserRole) {
    return storedUserRole as UserRole
  } else {
    return "ESTUDIANTE"
  }
}

/**
 * Check if current user is super admin
 */
export function isSuperAdmin(): boolean {
  return sessionStorage.getItem("isSuperAdmin") === "true"
}

/**
 * Check if current user is admin (any type)
 */
export function isAdmin(): boolean {
  return sessionStorage.getItem("isAdmin") === "true"
}

/**
 * Get assigned groups for current user
 */
export function getAssignedGroups(): string[] {
  const grupoCultural = sessionStorage.getItem("grupoCultural") || ""
  return grupoCultural ? [grupoCultural] : []
}

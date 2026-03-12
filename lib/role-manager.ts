import type { UserRole } from './types'
import type { Area } from './firebase-config'

/**
 * Interfaz que define los permisos de un rol en el sistema
 */
export interface RolePermissions {
  /** Indica si el usuario puede ver todos los grupos del área */
  canViewAllGroups: boolean
  /** Indica si el usuario puede ver todos los usuarios del área */
  canViewAllUsers: boolean
  /** Indica si el usuario puede gestionar usuarios (crear, editar, eliminar) */
  canManageUsers: boolean
  /** Indica si el usuario puede cambiar entre áreas (solo Super Admin) */
  canSwitchArea: boolean
  /** Array de IDs de grupos asignados al usuario */
  assignedGroups: string[]
}

/**
 * Obtiene los permisos correspondientes a un rol específico en un área
 * 
 * @param userRole - El rol del usuario
 * @param area - El área en la que opera el usuario ('cultura' o 'deporte')
 * @param assignedGroups - Array de IDs de grupos asignados al usuario (opcional)
 * @returns Los permisos asociados al rol
 * 
 * @example
 * ```typescript
 * // Para un Director de Cultura con un grupo asignado
 * const permissions = getRolePermissions('DIRECTOR', 'cultura', ['grupo-123'])
 * 
 * // Para un Admin sin grupos asignados
 * const permissions = getRolePermissions('SUPER_ADMIN', 'cultura')
 * ```
 */
export function getRolePermissions(
  userRole: UserRole,
  area: Area,
  assignedGroups: string[] = []
): RolePermissions {
  switch (userRole) {
    case 'SUPER_ADMIN':
      return {
        canViewAllGroups: true,
        canViewAllUsers: true,
        canManageUsers: true,
        canSwitchArea: true,
        assignedGroups: [],
      }
    
    case 'ADMIN':
      // Admin regular: puede ver todo de su área pero no cambiar de área
      return {
        canViewAllGroups: true,
        canViewAllUsers: true,
        canManageUsers: true,
        canSwitchArea: false,
        assignedGroups: [],
      }
    
    case 'DIRECTOR':
      // Director de Cultura: solo 1 grupo
      // En el modelo actual, Director solo existe en Cultura
      return {
        canViewAllGroups: false,
        canViewAllUsers: false,
        canManageUsers: false,
        canSwitchArea: false,
        assignedGroups: assignedGroups,
      }
    
    case 'MONITOR':
      if (area === 'cultura') {
        // Monitor de Cultura: solo 1 grupo
        return {
          canViewAllGroups: false,
          canViewAllUsers: false,
          canManageUsers: false,
          canSwitchArea: false,
          assignedGroups: assignedGroups,
        }
      } else {
        // Monitor de Deporte: múltiples grupos
        return {
          canViewAllGroups: false,
          canViewAllUsers: false,
          canManageUsers: false,
          canSwitchArea: false,
          assignedGroups: assignedGroups,
        }
      }
    
    case 'ENTRENADOR':
      // Entrenador de Deporte: múltiples grupos
      return {
        canViewAllGroups: false,
        canViewAllUsers: false,
        canManageUsers: false,
        canSwitchArea: false,
        assignedGroups: assignedGroups,
      }
    
    case 'ESTUDIANTE':
    default:
      return {
        canViewAllGroups: false,
        canViewAllUsers: false,
        canManageUsers: false,
        canSwitchArea: false,
        assignedGroups: [],
      }
  }
}

/**
 * Filtra un array de datos según los permisos del usuario
 * 
 * Esta función es genérica y puede filtrar cualquier tipo de dato que tenga
 * un campo grupoCultural. Si el usuario tiene permisos para ver todos los grupos,
 * retorna todos los datos. Si no, filtra solo los datos de los grupos asignados.
 * 
 * @param data - Array de datos a filtrar
 * @param permissions - Los permisos del usuario
 * @returns Array filtrado según los permisos
 * 
 * @example
 * ```typescript
 * const permissions = getRolePermissions('MONITOR', 'cultura', user)
 * const filteredStudents = filterDataByPermissions(allStudents, permissions)
 * // filteredStudents solo contiene estudiantes del grupo asignado al monitor
 * ```
 */
export function filterDataByPermissions<T extends { grupoCultural?: string }>(
  data: T[],
  permissions: RolePermissions
): T[] {
  // Si el usuario puede ver todos los grupos, retornar todos los datos
  if (permissions.canViewAllGroups) {
    return data
  }
  
  // Si no tiene grupos asignados, retornar array vacío
  if (permissions.assignedGroups.length === 0) {
    return []
  }
  
  // Filtrar solo los datos de los grupos asignados
  return data.filter(item => 
    item.grupoCultural && permissions.assignedGroups.includes(item.grupoCultural)
  )
}

/**
 * Filtra grupos según los grupos asignados al usuario
 * 
 * Para Admins y Super Admins: retorna todos los grupos
 * Para Director/Monitor de Cultura: retorna solo el grupo asignado (1 grupo)
 * Para Entrenador/Monitor de Deporte: retorna todos los grupos asignados (N grupos)
 * Para Estudiantes: retorna array vacío
 * 
 * @param groups - Array de grupos a filtrar
 * @param permissions - Los permisos del usuario
 * @returns Array de grupos filtrado según los permisos
 * 
 * @example
 * ```typescript
 * const permissions = getRolePermissions('DIRECTOR', 'cultura', ['grupo-123'])
 * const visibleGroups = filterGroupsByAssignment(allGroups, permissions)
 * // visibleGroups solo contiene el grupo 'grupo-123'
 * ```
 * 
 * **Validates: Requirements 6.6, 6.7, 6.8, 6.9, 7.1, 7.2, 7.3, 7.4**
 */
export function filterGroupsByAssignment<T extends { id: string; nombre: string }>(
  groups: T[],
  permissions: RolePermissions
): T[] {
  // Si el usuario puede ver todos los grupos, retornar todos
  if (permissions.canViewAllGroups) {
    return groups
  }
  
  // Si no tiene grupos asignados, retornar array vacío
  if (permissions.assignedGroups.length === 0) {
    return []
  }
  
  // Filtrar solo los grupos asignados al usuario
  return groups.filter(group => permissions.assignedGroups.includes(group.id))
}

/**
 * Filtra estudiantes según los grupos asignados al usuario
 * 
 * Para Admins y Super Admins: retorna todos los estudiantes
 * Para Director/Monitor/Entrenador: retorna solo estudiantes inscritos en sus grupos asignados
 * Para Estudiantes: retorna array vacío
 * 
 * @param students - Array de perfiles de estudiantes a filtrar
 * @param permissions - Los permisos del usuario
 * @returns Array de estudiantes filtrado según los permisos
 * 
 * @example
 * ```typescript
 * const permissions = getRolePermissions('MONITOR', 'cultura', ['grupo-123'])
 * const visibleStudents = filterStudentsByAssignment(allStudents, permissions)
 * // visibleStudents solo contiene estudiantes del grupo 'grupo-123'
 * ```
 * 
 * **Validates: Requirements 6.11, 7.5**
 */
export function filterStudentsByAssignment<T extends { id: string; grupoCultural?: string }>(
  students: T[],
  permissions: RolePermissions
): T[] {
  // Si el usuario puede ver todos los usuarios, retornar todos
  if (permissions.canViewAllUsers) {
    return students
  }
  
  // Si no tiene grupos asignados, retornar array vacío
  if (permissions.assignedGroups.length === 0) {
    return []
  }
  
  // Filtrar solo estudiantes inscritos en los grupos asignados
  return students.filter(student => 
    student.grupoCultural && permissions.assignedGroups.includes(student.grupoCultural)
  )
}

/**
 * Filtra registros de asistencia según los grupos asignados al usuario
 * 
 * Para Admins y Super Admins: retorna todos los registros
 * Para Director/Monitor/Entrenador: retorna solo registros de asistencia de sus grupos asignados
 * Para Estudiantes: retorna array vacío
 * 
 * @param attendanceRecords - Array de registros de asistencia a filtrar
 * @param permissions - Los permisos del usuario
 * @returns Array de registros filtrado según los permisos
 * 
 * @example
 * ```typescript
 * const permissions = getRolePermissions('ENTRENADOR', 'deporte', ['grupo-1', 'grupo-2'])
 * const visibleAttendance = filterAttendanceByAssignment(allRecords, permissions)
 * // visibleAttendance solo contiene registros de 'grupo-1' y 'grupo-2'
 * ```
 * 
 * **Validates: Requirements 6.10, 7.6**
 */
export function filterAttendanceByAssignment<T extends { id: string; grupoCultural: string }>(
  attendanceRecords: T[],
  permissions: RolePermissions
): T[] {
  // Si el usuario puede ver todos los grupos, retornar todos los registros
  if (permissions.canViewAllGroups) {
    return attendanceRecords
  }
  
  // Si no tiene grupos asignados, retornar array vacío
  if (permissions.assignedGroups.length === 0) {
    return []
  }
  
  // Filtrar solo registros de los grupos asignados
  return attendanceRecords.filter(record => 
    permissions.assignedGroups.includes(record.grupoCultural)
  )
}

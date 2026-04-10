"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import DeleteUserDialog from "@/components/delete-user-dialog"
import { getAllUsers as getAllUsersRouter, deleteUser as deleteUserRouter, updateUserRole as updateUserRoleRouter, getUserEnrollments as getUserEnrollmentsRouter, assignGroupManager, removeGroupManager } from "@/lib/db-router"
import { getUserEventEnrollments } from "@/lib/firestore"
import { getAttendanceRecords } from "@/lib/storage"
import { getCurrentUserRole, isSuperAdmin as checkIsSuperAdmin, isAdmin as checkIsAdmin, getAssignedGroups } from "@/lib/auth-helpers"
import { getAllCulturalGroups as getAllCulturalGroupsRouter } from "@/lib/db-router"
import { db } from "@/lib/firebase"
import { getFirestoreForArea } from "@/lib/firebase-config"
import { collection, query, where, getDocs } from "firebase/firestore"
import type { UserProfile, GroupEnrollment, AttendanceRecord, UserRole, GroupManager } from "@/lib/types"
import { useArea } from "@/contexts/area-context"
import { getRolePermissions, filterStudentsByAssignment, type RolePermissions } from "@/lib/role-manager"
import { formatNombre } from "@/lib/utils"
import { 
  Users, 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  MoreVertical, 
  Eye, 
  Trash2,
  UserCog,
  UsersRound,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Mail,
  Phone,
  GraduationCap,
  Building2,
  User as UserIcon,
  Music
} from "lucide-react"

const ITEMS_PER_PAGE = 20

export default function UsuariosPage() {
  const { area } = useArea()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [facultadFilter, setFacultadFilter] = useState("")
  const [programaFilter, setProgramaFilter] = useState("")
  const [grupoCulturalFilter, setGrupoCulturalFilter] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [userDetailsOpen, setUserDetailsOpen] = useState(false)
  const [userGroups, setUserGroups] = useState<GroupEnrollment[]>([])
  const [userEvents, setUserEvents] = useState<string[]>([])
  const [userAttendances, setUserAttendances] = useState<AttendanceRecord[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [userToAssignRole, setUserToAssignRole] = useState<UserProfile | null>(null)
  const [selectedRole, setSelectedRole] = useState<UserRole>("ESTUDIANTE")
  const [isAssigningRole, setIsAssigningRole] = useState(false)
  const [groupDialogOpen, setGroupDialogOpen] = useState(false)
  const [userToAssignGroup, setUserToAssignGroup] = useState<UserProfile | null>(null)
  const [selectedGroup, setSelectedGroup] = useState("")
  const [isAssigningGroup, setIsAssigningGroup] = useState(false)
  const [userAssignedGroups, setUserAssignedGroups] = useState<{ id: string; grupoCultural: string }[]>([])
  const [loadingAssignedGroups, setLoadingAssignedGroups] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [isCleaningDuplicates, setIsCleaningDuplicates] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>("ESTUDIANTE")
  const [currentUserPermissions, setCurrentUserPermissions] = useState<RolePermissions | null>(null)
  const [availableGroups, setAvailableGroups] = useState<string[]>([])

  const loadUsers = async () => {
    try {
      console.log("[Usuarios] ========== LOADING USERS ==========")
      console.log("[Usuarios] Current area:", area)
      console.log("[Usuarios] Timestamp:", new Date().toISOString())
      
      const usersList = await getAllUsersRouter(area)
      console.log("[Usuarios] ✓ Loaded", usersList.length, "users from database")
      console.log("[Usuarios] Users with area field:", usersList.filter(u => u.area).length)
      console.log("[Usuarios] Users without area field:", usersList.filter(u => !u.area).length)
      
      // Apply role-based filtering
      let filteredList = usersList
      if (currentUserPermissions && !currentUserPermissions.canViewAllUsers) {
        console.log("[Usuarios] Applying role-based filtering with permissions:", currentUserPermissions)
        filteredList = filterStudentsByAssignment(usersList, currentUserPermissions)
        console.log("[Usuarios] Filtered users:", filteredList.length)
      }
      
      setUsers(filteredList)
      setFilteredUsers(filteredList)
      setError(null)
      console.log("[Usuarios] ========== USERS LOADED SUCCESSFULLY ==========")
    } catch (error) {
      console.error("[Usuarios] ========== ERROR LOADING USERS ==========")
      console.error("[Usuarios] Error:", error)
      setError("Error al cargar los usuarios. Verifica la conexión a Firebase.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Get user role and permissions
    const userRole = getCurrentUserRole()
    const adminStatus = checkIsAdmin()
    const superAdminStatus = checkIsSuperAdmin()
    const assignedGroups = getAssignedGroups()
    
    setIsAdmin(adminStatus)
    setIsSuperAdmin(superAdminStatus)
    setCurrentUserRole(userRole)
    
    // Get user permissions based on role and assigned groups
    const permissions = getRolePermissions(userRole, area, assignedGroups)
    setCurrentUserPermissions(permissions)
    
    console.log("[Usuarios] ========== PERMISSIONS CHECK ==========")
    console.log("[Usuarios] Is Super Admin:", superAdminStatus)
    console.log("[Usuarios] User role:", userRole)
    console.log("[Usuarios] Area:", area)
    console.log("[Usuarios] Assigned groups:", assignedGroups)
    console.log("[Usuarios] Permissions:", permissions)
    console.log("[Usuarios] Can view all users:", permissions.canViewAllUsers)
    console.log("[Usuarios] ==========================================")
    
    // Load users immediately after setting permissions
    loadUsers()

    // Load groups dynamically from the database
    getAllCulturalGroupsRouter(area).then(groups => {
      setAvailableGroups(groups.filter(g => g.activo).map(g => g.nombre).sort())
    }).catch(err => console.error("[Usuarios] Error loading groups:", err))
  }, [area])

  useEffect(() => {
    let filtered = users

    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (user) =>
          user.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.correo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.numeroDocumento.includes(searchTerm)
      )
    }

    if (facultadFilter) {
      filtered = filtered.filter((user) => user.facultad === facultadFilter)
    }

    if (programaFilter) {
      filtered = filtered.filter((user) => user.programaAcademico === programaFilter)
    }

    if (grupoCulturalFilter) {
      // Filtrar por grupo cultural requiere cargar las inscripciones
      // Por ahora lo dejamos como placeholder
    }

    setFilteredUsers(filtered)
    setCurrentPage(1)
  }, [searchTerm, facultadFilter, programaFilter, grupoCulturalFilter, users])

  const getInitials = (nombres: string) => {
    const parts = nombres.split(" ")
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase()
    }
    return nombres.charAt(0).toUpperCase()
  }

  const handleDeleteUser = (user: UserProfile) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteUser = async (userId: string) => {
    try {
      await deleteUserRouter(area, userId)
      setSuccess("Usuario eliminado exitosamente")
      await loadUsers()
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error("Error deleting user:", error)
      throw error
    }
  }

  const handleViewUser = async (user: UserProfile) => {
    setSelectedUser(user)
    setUserDetailsOpen(true)
    
    // Cargar información adicional del usuario
    try {
      const [groups, events, allAttendances] = await Promise.all([
        getUserEnrollmentsRouter(area, user.id),
        getUserEventEnrollments(user.id),
        getAttendanceRecords()
      ])
      
      setUserGroups(groups)
      setUserEvents(events)
      setUserAttendances(allAttendances.filter(a => a.numeroDocumento === user.numeroDocumento))
    } catch (error) {
      console.error("Error loading user details:", error)
    }
  }

  const handleAssignRole = (user: UserProfile) => {
    if (!isAdmin && !isSuperAdmin) {
      setError("Solo los administradores pueden asignar roles")
      setTimeout(() => setError(null), 3000)
      return
    }
    setUserToAssignRole(user)
    setSelectedRole(user.rol || "ESTUDIANTE")
    setRoleDialogOpen(true)
  }

  const confirmAssignRole = async () => {
    if (!userToAssignRole) return

    setIsAssigningRole(true)
    try {
      await updateUserRoleRouter(area, userToAssignRole.id, selectedRole)
      setSuccess(`Rol actualizado a ${selectedRole} exitosamente`)
      await loadUsers()
      setRoleDialogOpen(false)
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error("Error assigning role:", error)
      setError("Error al asignar el rol")
      setTimeout(() => setError(null), 3000)
    } finally {
      setIsAssigningRole(false)
    }
  }

  const handleAssignGroup = async (user: UserProfile) => {
    if (!isAdmin && !isSuperAdmin) {
      setError("Solo los administradores pueden asignar encargados")
      setTimeout(() => setError(null), 3000)
      return
    }
    
    setUserToAssignGroup(user)
    setSelectedGroup("")
    setUserAssignedGroups([])
    setGroupDialogOpen(true)
    setLoadingAssignedGroups(true)
    
    // Cargar todos los grupos asignados al usuario en el área actual
    try {
      const areaDb = getFirestoreForArea(area)
      const managersRef = collection(areaDb, "group_managers")
      const q = query(managersRef, where("userId", "==", user.id))
      const snapshot = await getDocs(q)
      
      const assignments = snapshot.docs.map(d => ({
        id: d.id,
        grupoCultural: d.data().grupoCultural as string,
      }))
      setUserAssignedGroups(assignments)
      console.log("[Usuarios] User has", assignments.length, "group assignments in area:", area)
    } catch (error) {
      console.error("[Usuarios] Error checking user groups:", error)
      setUserAssignedGroups([])
    } finally {
      setLoadingAssignedGroups(false)
    }
  }

  const confirmAssignGroup = async () => {
    if (!userToAssignGroup || !selectedGroup) return

    setIsAssigningGroup(true)
    try {
      const assignedBy = sessionStorage.getItem("userId") || "admin"
      await assignGroupManager(area, userToAssignGroup.id, selectedGroup, assignedBy)
      setSuccess(`${userToAssignGroup.nombres} asignado como encargado de ${selectedGroup}`)
      // Refrescar lista de grupos asignados
      const areaDb = getFirestoreForArea(area)
      const managersRef = collection(areaDb, "group_managers")
      const q = query(managersRef, where("userId", "==", userToAssignGroup.id))
      const snapshot = await getDocs(q)
      setUserAssignedGroups(snapshot.docs.map(d => ({ id: d.id, grupoCultural: d.data().grupoCultural })))
      setSelectedGroup("")
      await loadUsers()
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error("Error assigning group:", error)
      setError(error.message || "Error al asignar como encargado")
      setTimeout(() => setError(null), 3000)
    } finally {
      setIsAssigningGroup(false)
    }
  }

  const handleRemoveGroupAssignment = async (managerId: string, groupName: string) => {
    if (!userToAssignGroup) return

    setIsAssigningGroup(true)
    try {
      await removeGroupManager(area, managerId)
      setUserAssignedGroups(prev => prev.filter(g => g.id !== managerId))
      setSuccess(`${userToAssignGroup.nombres} removido de ${groupName}`)
      await loadUsers()
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error("[Usuarios] Error removing group:", error)
      setError("Error al remover como encargado")
      setTimeout(() => setError(null), 3000)
    } finally {
      setIsAssigningGroup(false)
    }
  }

  const handleCleanDuplicates = async () => {
    if (!isAdmin && !isSuperAdmin) {
      setError("Solo los administradores pueden limpiar duplicados")
      setTimeout(() => setError(null), 3000)
      return
    }

    const confirmed = window.confirm(
      "¿Estás seguro de que deseas eliminar usuarios duplicados?\n\n" +
      "Esta acción eliminará todos los usuarios con el mismo número de documento, " +
      "excepto el más reciente. Esta acción no se puede deshacer."
    )

    if (!confirmed) return

    setIsCleaningDuplicates(true)
    try {
      // Agrupar usuarios por número de documento
      const usersByDocument = new Map<string, UserProfile[]>()
      
      users.forEach(user => {
        const doc = user.numeroDocumento
        if (!usersByDocument.has(doc)) {
          usersByDocument.set(doc, [])
        }
        usersByDocument.get(doc)!.push(user)
      })

      // Encontrar duplicados
      let duplicatesFound = 0
      let duplicatesDeleted = 0

      const entries = Array.from(usersByDocument.entries())
      
      for (const [documento, userList] of entries) {
        if (userList.length > 1) {
          duplicatesFound += userList.length - 1
          
          // Ordenar por fecha de creación (más reciente primero)
          userList.sort((a: UserProfile, b: UserProfile) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          
          // Mantener el primero (más reciente), eliminar los demás
          for (let i = 1; i < userList.length; i++) {
            try {
              await deleteUserRouter(area, userList[i].id)
              duplicatesDeleted++
            } catch (error) {
              console.error(`Error eliminando usuario duplicado ${userList[i].id}:`, error)
            }
          }
        }
      }

      await loadUsers()
      
      if (duplicatesDeleted > 0) {
        setSuccess(`Se eliminaron ${duplicatesDeleted} usuario(s) duplicado(s)`)
      } else {
        setSuccess("No se encontraron usuarios duplicados")
      }
      
      setTimeout(() => setSuccess(null), 5000)
    } catch (error) {
      console.error("Error limpiando duplicados:", error)
      setError("Error al limpiar usuarios duplicados")
      setTimeout(() => setError(null), 3000)
    } finally {
      setIsCleaningDuplicates(false)
    }
  }

  // Obtener opciones únicas para los filtros
  const facultades: ComboboxOption[] = Array.from(new Set(users.map(u => u.facultad).filter(Boolean)))
    .map(f => ({ value: f!, label: f! }))
    .sort((a, b) => a.label.localeCompare(b.label))

  const programas: ComboboxOption[] = Array.from(new Set(users.map(u => u.programaAcademico).filter(Boolean)))
    .map(p => ({ value: p!, label: p! }))
    .sort((a, b) => a.label.localeCompare(b.label))

  // Opciones para el selector de grupos según el área (cargadas dinámicamente)
  const gruposOptions: ComboboxOption[] = availableGroups.map((grupo) => ({
    value: grupo,
    label: grupo,
  }))

  // Paginación
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentUsers = filteredUsers.slice(startIndex, endIndex)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-lg text-gray-600">Cargando usuarios...</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
              <p className="text-gray-600 mt-1">Administrar perfiles de usuarios registrados</p>
            </div>
            <div className="flex items-center gap-2">
              {(isAdmin || isSuperAdmin) && (
                <Button
                  onClick={handleCleanDuplicates}
                  disabled={isCleaningDuplicates}
                  variant="outline"
                  className="border-orange-300 text-orange-700 hover:bg-orange-50"
                >
                  {isCleaningDuplicates ? "Limpiando..." : "Limpiar Duplicados"}
                </Button>
              )}
              <Badge variant="secondary" className="text-sm">
                <Users className="w-4 h-4 mr-1" />
                {filteredUsers.length} usuarios
              </Badge>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Buscar y Filtrar Usuarios
              </CardTitle>
              <CardDescription>Busca por nombre, correo o documento, y filtra por facultad o programa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, correo o documento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Facultad</label>
                  <Combobox
                    options={facultades}
                    value={facultadFilter}
                    onValueChange={setFacultadFilter}
                    placeholder="Todas las facultades"
                    searchPlaceholder="Buscar facultad..."
                    emptyText="No se encontró la facultad"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Programa</label>
                  <Combobox
                    options={programas}
                    value={programaFilter}
                    onValueChange={setProgramaFilter}
                    placeholder="Todos los programas"
                    searchPlaceholder="Buscar programa..."
                    emptyText="No se encontró el programa"
                  />
                </div>

                {(facultadFilter || programaFilter || searchTerm) && (
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm("")
                        setFacultadFilter("")
                        setProgramaFilter("")
                        setGrupoCulturalFilter("")
                      }}
                      className="w-full"
                    >
                      Limpiar Filtros
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tabla de Usuarios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="w-5 h-5" />
                Lista de Usuarios
              </CardTitle>
              <CardDescription>
                Mostrando {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} de {filteredUsers.length} usuarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentUsers.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Usuario</TableHead>
                          <TableHead>Estamento</TableHead>
                          <TableHead>Facultad</TableHead>
                          <TableHead>Programa</TableHead>
                          <TableHead className="text-center">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback className="bg-blue-100 text-blue-700">
                                    {getInitials(user.nombres)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{formatNombre(user.nombres)}</div>
                                  <div className="text-sm text-gray-500">{user.correo}</div>
                                  {user.area === 'deporte' && user.codigoEstudiantil && (
                                    <div className="text-xs text-blue-600 mt-1">
                                      Código: {user.codigoEstudiantil}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{user.estamento}</Badge>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {user.facultad || "N/A"}
                            </TableCell>
                            <TableCell className="max-w-[250px] truncate">
                              {user.programaAcademico || "N/A"}
                            </TableCell>
                            <TableCell className="text-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleViewUser(user)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Ver Usuario
                                  </DropdownMenuItem>
                                  {(isAdmin || isSuperAdmin) && (
                                    <>
                                      <DropdownMenuItem onClick={() => handleAssignRole(user)}>
                                        <UserCog className="h-4 w-4 mr-2" />
                                        Asignar Rol
                                      </DropdownMenuItem>
                                      {(user.rol === "DIRECTOR" || user.rol === "MONITOR" || user.rol === "ENTRENADOR") && (
                                        <DropdownMenuItem onClick={() => handleAssignGroup(user)}>
                                          <UsersRound className="h-4 w-4 mr-2" />
                                          {area === 'deporte' ? 'Gestionar Grupos' : 'Asignar como Encargado'}
                                        </DropdownMenuItem>
                                      )}
                                    </>
                                  )}
                                  {(isAdmin || isSuperAdmin) && (
                                    <DropdownMenuItem 
                                      onClick={() => handleDeleteUser(user)}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Eliminar
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Paginación */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div className="text-sm text-gray-600">
                        Página {currentPage} de {totalPages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Anterior
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Siguiente
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm || facultadFilter || programaFilter
                    ? "No se encontraron usuarios con ese criterio de búsqueda"
                    : "No hay usuarios registrados"}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dialog de Detalles del Usuario */}
          <Dialog open={userDetailsOpen} onOpenChange={setUserDetailsOpen}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">Perfil del Usuario</DialogTitle>
                <DialogDescription>Información completa y detallada</DialogDescription>
              </DialogHeader>
              
              {selectedUser && (
                <div className="space-y-6">
                  {/* Header con Avatar y Info Principal */}
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
                    <div className="flex items-start gap-6">
                      <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                        <AvatarFallback className="bg-white text-blue-600 text-2xl font-bold">
                          {getInitials(selectedUser.nombres)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold mb-2">{formatNombre(selectedUser.nombres)}</h2>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge className="bg-white/20 text-white hover:bg-white/30">
                            {selectedUser.genero}
                          </Badge>
                          <Badge className="bg-white/20 text-white hover:bg-white/30">
                            {selectedUser.estamento}
                          </Badge>
                          <Badge className="bg-white/20 text-white hover:bg-white/30">
                            {selectedUser.edad} años
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <span>{selectedUser.correo}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{selectedUser.telefono}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Grid de Información */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Información Personal */}
                    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
                          <UserIcon className="h-5 w-5" />
                          Información Personal
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Etnia</p>
                          <p className="font-medium text-gray-900">{selectedUser.etnia}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Tipo de Documento</p>
                          <p className="font-medium text-gray-900">{selectedUser.tipoDocumento}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Número de Documento</p>
                          <p className="font-medium text-gray-900">{selectedUser.numeroDocumento}</p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Información Institucional */}
                    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2 text-purple-900">
                          <Building2 className="h-5 w-5" />
                          Información Institucional
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Sede</p>
                          <p className="font-medium text-gray-900">{selectedUser.sede}</p>
                        </div>
                        {selectedUser.codigoEstudiantil && (
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Código Estudiante</p>
                            <p className="font-medium text-gray-900">{selectedUser.codigoEstudiantil}</p>
                          </div>
                        )}
                        {selectedUser.area === 'deporte' && selectedUser.codigoEstudiantil && (
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Código Estudiantil</p>
                            <p className="font-medium text-gray-900">{selectedUser.codigoEstudiantil}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Información Académica */}
                    {(selectedUser.facultad || selectedUser.programaAcademico) && (
                      <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 md:col-span-2">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2 text-green-900">
                            <GraduationCap className="h-5 w-5" />
                            Información Académica
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedUser.facultad && (
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Facultad</p>
                              <p className="font-medium text-gray-900">{selectedUser.facultad}</p>
                            </div>
                          )}
                          {selectedUser.programaAcademico && (
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Programa Académico</p>
                              <p className="font-medium text-gray-900">{selectedUser.programaAcademico}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Grupos Inscritos */}
                    <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2 text-orange-900">
                          <Music className="h-5 w-5" />
                          Grupos Culturales
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {userGroups.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {userGroups.map((group) => (
                              <Badge key={group.id} className="bg-orange-500 text-white hover:bg-orange-600">
                                {group.grupoCultural}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No está inscrito en ningún grupo</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Eventos Inscritos */}
                    <Card className="border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-rose-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2 text-pink-900">
                          <Calendar className="h-5 w-5" />
                          Eventos Inscritos
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {userEvents.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-900">
                              {userEvents.length} evento(s) inscrito(s)
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {Array.from(new Set(userEvents)).map((eventId, index) => (
                                <Badge key={index} className="bg-pink-500 text-white hover:bg-pink-600">
                                  Evento {index + 1}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No está inscrito en ningún evento</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Última Asistencia */}
                    <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 md:col-span-2">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2 text-indigo-900">
                          <Calendar className="h-5 w-5" />
                          Historial de Asistencia
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-white rounded-lg">
                          <p className="text-2xl font-bold text-indigo-600">{userAttendances.length}</p>
                          <p className="text-xs text-gray-500 font-medium">Total Asistencias</p>
                        </div>
                        <div className="md:col-span-2 p-4 bg-white rounded-lg">
                          <p className="text-xs text-gray-500 font-medium mb-1">Última Asistencia</p>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(selectedUser.lastAttendance).toLocaleDateString("es-CO", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Delete User Dialog */}
          <DeleteUserDialog
            user={userToDelete}
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onConfirm={confirmDeleteUser}
          />

          {/* Assign Role Dialog */}
          <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
            <DialogContent className="w-[95vw] max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle className="text-lg md:text-xl">Asignar Rol de Usuario</DialogTitle>
                <DialogDescription className="text-sm">
                  Selecciona el rol para {userToAssignRole?.nombres}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rol</label>
                  <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
                    <SelectTrigger className="h-10 md:h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ESTUDIANTE">Estudiante</SelectItem>
                      <SelectItem value="DIRECTOR">{area === 'deporte' ? 'Entrenador' : 'Director'}</SelectItem>
                      <SelectItem value="MONITOR">Monitor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs md:text-sm text-blue-800">
                    <strong>Nota:</strong> Los roles de {area === 'deporte' ? 'Entrenador' : 'Director'} y Monitor permiten gestionar grupos {area === 'deporte' ? 'deportivos' : 'culturales'}.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={() => setRoleDialogOpen(false)}
                  disabled={isAssigningRole}
                  className="flex-1 h-10 md:h-11"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmAssignRole}
                  disabled={isAssigningRole}
                  className="flex-1 h-10 md:h-11"
                >
                  {isAssigningRole ? "Asignando..." : "Asignar Rol"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Assign Group Dialog */}
          <Dialog open={groupDialogOpen} onOpenChange={(open) => {
            setGroupDialogOpen(open)
            if (!open) { setSelectedGroup(""); setUserAssignedGroups([]) }
          }}>
            <DialogContent className="w-[95vw] max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle className="text-lg md:text-xl">
                  {area === 'deporte' ? 'Grupos del Entrenador' : `Asignar como Encargado`}
                </DialogTitle>
                <DialogDescription className="text-sm">
                  {userToAssignGroup?.nombres}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-2">
                {/* Grupos ya asignados */}
                {loadingAssignedGroups ? (
                  <div className="text-center py-4 text-sm text-gray-500">Cargando grupos asignados...</div>
                ) : userAssignedGroups.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">
                      Grupos asignados ({userAssignedGroups.length})
                    </p>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {userAssignedGroups.map((assignment) => (
                        <div key={assignment.id} className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                          <span className="text-sm text-green-800 font-medium truncate pr-2">{assignment.grupoCultural}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveGroupAssignment(assignment.id, assignment.grupoCultural)}
                            disabled={isAssigningGroup}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0 shrink-0"
                          >
                            ✕
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                    Sin grupos asignados
                  </div>
                )}

                {/* Selector para asignar nuevo grupo */}
                {!loadingAssignedGroups && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {userAssignedGroups.length > 0
                        ? `Asignar otro grupo ${area === 'deporte' ? 'deportivo' : 'cultural'}`
                        : `Asignar grupo ${area === 'deporte' ? 'deportivo' : 'cultural'}`
                      }
                    </label>
                    <Combobox
                      options={gruposOptions.filter(g => !userAssignedGroups.some(a => a.grupoCultural === g.value))}
                      value={selectedGroup}
                      onValueChange={setSelectedGroup}
                      placeholder="Selecciona un grupo"
                      searchPlaceholder="Buscar grupo..."
                      emptyText="No hay más grupos disponibles"
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => { setGroupDialogOpen(false); setSelectedGroup(""); setUserAssignedGroups([]) }}
                  disabled={isAssigningGroup}
                  className="flex-1 h-10"
                >
                  Cerrar
                </Button>
                <Button
                  onClick={confirmAssignGroup}
                  disabled={isAssigningGroup || !selectedGroup}
                  className="flex-1 h-10"
                >
                  {isAssigningGroup ? "Asignando..." : "Asignar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}

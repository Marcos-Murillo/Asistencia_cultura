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
import { getAllUsers as getAllUsersRouter, deleteUser as deleteUserRouter, updateUserRole as updateUserRoleRouter, getUserEnrollments as getUserEnrollmentsRouter, assignGroupManager, removeGroupManager, updateUserProfile as updateUserProfileRouter, getUserEventEnrollments as getUserEventEnrollmentsRouter, getUserRealEventEnrollments, getEventByIdRouter, getRealEventByIdRouter, getAttendanceRecords as getAttendanceRecordsRouter, removeUserFromGroup as removeUserFromGroupRouter } from "@/lib/db-router"
import { getCurrentUserRole, isSuperAdmin as checkIsSuperAdmin, isAdmin as checkIsAdmin, getAssignedGroups } from "@/lib/auth-helpers"
import { getAllCulturalGroups as getAllCulturalGroupsRouter } from "@/lib/db-router"
import { db } from "@/lib/firebase"
import { getFirestoreForArea } from "@/lib/firebase-config"
import { collection, query, where, getDocs } from "firebase/firestore"
import type { UserProfile, GroupEnrollment, AttendanceRecord, UserRole, GroupManager } from "@/lib/types"
import { useArea } from "@/contexts/area-context"
import { getRolePermissions, filterStudentsByAssignment, type RolePermissions } from "@/lib/role-manager"
import { formatNombre, sortUsersByNombres } from "@/lib/utils"
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
  Music,
  Pencil,
  X,
  Megaphone,
} from "lucide-react"

type NamedItem = { id: string; nombre: string }

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
  const [userConvocatorias, setUserConvocatorias] = useState<NamedItem[]>([])
  const [userRealEvents, setUserRealEvents] = useState<NamedItem[]>([])
  const [userAttendances, setUserAttendances] = useState<AttendanceRecord[]>([])
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [removingGroupId, setRemovingGroupId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [userToAssignRole, setUserToAssignRole] = useState<UserProfile | null>(null)
  const [selectedRole, setSelectedRole] = useState<UserRole>("ESTUDIANTE")
  const [esFisioEncargado, setEsFisioEncargado] = useState(false)
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

  // Edit user state
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [userToEdit, setUserToEdit] = useState<UserProfile | null>(null)
  const [editForm, setEditForm] = useState({
    nombres: "",
    correo: "",
    telefono: "",
    edad: "",
    genero: "" as UserProfile["genero"] | "",
    etnia: "" as UserProfile["etnia"] | "",
    tipoDocumento: "" as UserProfile["tipoDocumento"] | "",
    numeroDocumento: "",
    sede: "" as UserProfile["sede"] | "",
    estamento: "" as UserProfile["estamento"] | "",
    codigoEstudiantil: "",
    facultad: "",
    programaAcademico: "",
  })
  const [isSavingEdit, setIsSavingEdit] = useState(false)

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

    setFilteredUsers(sortUsersByNombres(filtered))
    setCurrentPage(1)
  }, [searchTerm, facultadFilter, programaFilter, grupoCulturalFilter, users])

  const getInitials = (nombres: string) => {
    const parts = nombres.split(" ")
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase()
    }
    return nombres.charAt(0).toUpperCase()
  }

  const formatDateTime = (value?: Date | string) => {
    if (!value) return "Sin registro"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "Sin registro"
    return date.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const roleLabel = (rol?: UserProfile["rol"]) => {
    if (rol === "DIRECTOR") return area === "deporte" ? "Entrenador" : "Director"
    if (rol === "MONITOR") return "Monitor"
    if (rol === "ENTRENADOR") return "Entrenador"
    if (rol === "FISIOTERAPEUTA") return "Fisioterapeuta"
    if (rol === "SUPER_ADMIN") return "Super admin"
    return "Estudiante"
  }

  const handleDeleteUser = (user: UserProfile) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteUser = async (userId: string) => {
    try {
      await deleteUserRouter(area, userId)
      if (selectedUser?.id === userId) {
        setUserDetailsOpen(false)
        setSelectedUser(null)
      }
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
    setUserGroups([])
    setUserConvocatorias([])
    setUserRealEvents([])
    setUserAttendances([])
    setDetailsError(null)
    setUserDetailsOpen(true)
    setDetailsLoading(true)

    try {
      const [groups, convocatoriaIds, eventIds, allAttendances] = await Promise.all([
        getUserEnrollmentsRouter(area, user.id),
        getUserEventEnrollmentsRouter(area, user.id),
        getUserRealEventEnrollments(area, user.id),
        getAttendanceRecordsRouter(area),
      ])

      const uniqueConvocatorias = Array.from(new Set(convocatoriaIds.filter(Boolean)))
      const uniqueEvents = Array.from(new Set(eventIds.filter(Boolean)))

      const [convocatorias, eventos] = await Promise.all([
        Promise.all(uniqueConvocatorias.map(async (id) => {
          const event = await getEventByIdRouter(area, id)
          return { id, nombre: event?.nombre || "Convocatoria sin nombre" }
        })),
        Promise.all(uniqueEvents.map(async (id) => {
          const event = await getRealEventByIdRouter(area, id)
          return { id, nombre: event?.nombre || "Evento sin nombre" }
        })),
      ])

      setUserGroups(groups.filter((group) => group.grupoCultural && group.grupoCultural !== "__FISIOTERAPIA__"))
      setUserConvocatorias(convocatorias)
      setUserRealEvents(eventos)
      setUserAttendances(allAttendances.filter((record) => record.numeroDocumento === user.numeroDocumento))
    } catch (error) {
      console.error("[Usuarios] Error loading user details from area", area, error)
      setDetailsError("No se pudieron cargar grupos, convocatorias ni eventos. Revisa la conexión con la base de datos.")
    } finally {
      setDetailsLoading(false)
    }
  }

  const handleRemoveUserFromGroup = async (group: GroupEnrollment) => {
    if (!selectedUser) return
    if (!isAdmin && !isSuperAdmin) {
      setError("Solo los administradores pueden retirar usuarios de un grupo")
      setTimeout(() => setError(null), 3000)
      return
    }

    const confirmed = window.confirm(
      `¿Quitar a ${formatNombre(selectedUser.nombres)} del grupo ${group.grupoCultural}?`
    )
    if (!confirmed) return

    setRemovingGroupId(group.id)
    try {
      await removeUserFromGroupRouter(area, selectedUser.id, group.grupoCultural)
      setUserGroups((prev) => prev.filter((item) => item.grupoCultural !== group.grupoCultural))
      setSuccess(`${formatNombre(selectedUser.nombres)} fue retirado de ${group.grupoCultural}`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error("[Usuarios] Error removing user from group:", error)
      setError("No se pudo retirar al usuario del grupo")
      setTimeout(() => setError(null), 3000)
    } finally {
      setRemovingGroupId(null)
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
    setEsFisioEncargado(Boolean(user.esFisioterapeutaEncargado))
    setRoleDialogOpen(true)
  }

  const confirmAssignRole = async () => {
    if (!userToAssignRole) return

    setIsAssigningRole(true)
    try {
      await updateUserRoleRouter(area, userToAssignRole.id, selectedRole, {
        esFisioterapeutaEncargado: selectedRole === "FISIOTERAPEUTA" && esFisioEncargado,
      })
      setSuccess(`Rol actualizado a ${selectedRole}${selectedRole === "FISIOTERAPEUTA" && esFisioEncargado ? " (encargado)" : ""} exitosamente`)
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

  const handleEditUser = (user: UserProfile) => {
    setUserToEdit(user)
    setEditForm({
      nombres: user.nombres,
      correo: user.correo,
      telefono: user.telefono,
      edad: String(user.edad),
      genero: user.genero,
      etnia: user.etnia,
      tipoDocumento: user.tipoDocumento,
      numeroDocumento: user.numeroDocumento,
      sede: user.sede,
      estamento: user.estamento,
      codigoEstudiantil: user.codigoEstudiantil ?? "",
      facultad: user.facultad ?? "",
      programaAcademico: user.programaAcademico ?? "",
    })
    setEditDialogOpen(true)
  }

  const confirmEditUser = async () => {
    if (!userToEdit) return

    const edadNum = parseInt(editForm.edad, 10)
    if (!editForm.nombres.trim()) {
      setError("El nombre es requerido")
      setTimeout(() => setError(null), 3000)
      return
    }
    if (!editForm.correo.trim()) {
      setError("El correo es requerido")
      setTimeout(() => setError(null), 3000)
      return
    }
    if (isNaN(edadNum) || edadNum < 1 || edadNum > 120) {
      setError("La edad debe ser un número válido")
      setTimeout(() => setError(null), 3000)
      return
    }

    setIsSavingEdit(true)
    try {
      const updates: Parameters<typeof updateUserProfileRouter>[2] = {
        nombres: editForm.nombres.trim(),
        correo: editForm.correo.trim(),
        telefono: editForm.telefono.trim(),
        edad: edadNum,
        genero: editForm.genero as UserProfile["genero"],
        etnia: editForm.etnia as UserProfile["etnia"],
        tipoDocumento: editForm.tipoDocumento as UserProfile["tipoDocumento"],
        numeroDocumento: editForm.numeroDocumento.trim(),
        sede: editForm.sede as UserProfile["sede"],
        estamento: editForm.estamento as UserProfile["estamento"],
      }

      // Optional academic fields
      if (editForm.codigoEstudiantil.trim()) updates.codigoEstudiantil = editForm.codigoEstudiantil.trim()
      if (editForm.facultad.trim()) updates.facultad = editForm.facultad.trim()
      if (editForm.programaAcademico.trim()) updates.programaAcademico = editForm.programaAcademico.trim()

      await updateUserProfileRouter(area, userToEdit.id, updates)
      if (selectedUser?.id === userToEdit.id) {
        setSelectedUser({ ...selectedUser, ...updates })
      }
      setSuccess(`Usuario ${editForm.nombres} actualizado exitosamente`)
      setEditDialogOpen(false)
      await loadUsers()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || "Error al actualizar el usuario")
      setTimeout(() => setError(null), 4000)
    } finally {
      setIsSavingEdit(false)
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
                                      <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Editar Usuario
                                      </DropdownMenuItem>
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
            <DialogContent className="flex max-h-[min(92vh,860px)] w-[calc(100%-1.5rem)] max-w-[720px] flex-col gap-0 overflow-hidden border-0 bg-white p-0 shadow-2xl sm:rounded-[28px] [&>button]:right-3 [&>button]:top-3 [&>button]:rounded-full [&>button]:text-white [&>button]:opacity-90 [&>button]:hover:bg-white/20 [&>button]:hover:opacity-100">
              <DialogHeader className="sr-only">
                <DialogTitle>Perfil del Usuario</DialogTitle>
                <DialogDescription>Información completa y detallada</DialogDescription>
              </DialogHeader>

              {selectedUser && (
                <>
                  <div className="relative h-28 shrink-0 overflow-hidden bg-[#5b4bdb]">
                    <div className="absolute -left-6 top-3 h-16 w-16 rounded-full bg-[#ff7ad9]" />
                    <div className="absolute left-12 top-5 h-14 w-24 rounded-[40%] bg-gradient-to-br from-[#ff8a3d] to-[#ff5a7a]" />
                    <div className="absolute right-16 top-2 h-16 w-28 rotate-12 rounded-2xl bg-[#7c5cff]" />
                    <div className="absolute -right-6 bottom-0 h-20 w-32 rounded-full bg-[#3d7eff]" />
                    <div className="absolute bottom-1 left-24 h-10 w-20 rounded-full bg-[#6ee7ff]/80" />
                  </div>

                  <div className="shrink-0 px-6 pb-4">
                    <div className="-mt-10 flex items-end justify-between gap-3">
                      <Avatar className="h-[76px] w-[76px] border-4 border-white bg-[#f7c5d8] shadow-sm">
                        <AvatarFallback className="bg-[#f7c5d8] text-xl font-semibold text-[#3d2a33]">
                          {getInitials(selectedUser.nombres)}
                        </AvatarFallback>
                      </Avatar>
                      {(isAdmin || isSuperAdmin) && (
                        <div className="mb-1 flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditUser(selectedUser)}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-violet-200 bg-violet-50 text-violet-600 transition hover:bg-violet-100"
                            aria-label="Editar usuario"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(selectedUser)}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-500 transition hover:bg-rose-100"
                            aria-label="Eliminar usuario"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <h2 className="text-[22px] font-semibold leading-tight tracking-tight text-gray-950">
                          {formatNombre(selectedUser.nombres)}
                        </h2>
                        <p className="mt-0.5 text-sm text-gray-500">{selectedUser.estamento}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-700">
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-violet-500 text-[9px] font-bold text-white">
                            {roleLabel(selectedUser.rol).slice(0, 1)}
                          </span>
                          {roleLabel(selectedUser.rol)}
                        </span>
                        {userGroups.length > 0 && (
                          <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-700">
                            +{userGroups.length}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <div className="rounded-2xl bg-indigo-50 px-3 py-2 text-center">
                        <p className="text-sm font-semibold text-indigo-700">{detailsLoading ? "—" : userAttendances.length}</p>
                        <p className="text-[11px] text-indigo-400">asistencias</p>
                      </div>
                      <div className="rounded-2xl bg-orange-50 px-3 py-2 text-center">
                        <p className="text-sm font-semibold text-orange-700">{detailsLoading ? "—" : userGroups.length}</p>
                        <p className="text-[11px] text-orange-400">grupos</p>
                      </div>
                      <div className="rounded-2xl bg-pink-50 px-3 py-2 text-center">
                        <p className="text-sm font-semibold text-pink-700">{detailsLoading ? "—" : userConvocatorias.length + userRealEvents.length}</p>
                        <p className="text-[11px] text-pink-400">inscripciones</p>
                      </div>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-6 [scrollbar-width:thin] [scrollbar-color:rgb(216_214_230)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-violet-200">
                    {detailsError && (
                      <p className="mb-4 rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700">{detailsError}</p>
                    )}

                    <div className="mb-4 flex flex-wrap gap-2">
                      <span className="inline-flex max-w-full items-center gap-2 rounded-full bg-sky-50 px-3 py-1.5 text-sm text-sky-800">
                        <Mail className="h-4 w-4 shrink-0 text-sky-500" />
                        <span className="truncate">{selectedUser.correo}</span>
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm text-emerald-800">
                        <Phone className="h-4 w-4 shrink-0 text-emerald-500" />
                        {selectedUser.telefono || "Sin teléfono"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <section>
                        <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-violet-600">
                          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                            <UserIcon className="h-3.5 w-3.5" />
                          </span>
                          Personal
                        </p>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                          <div>
                            <p className="text-[11px] text-gray-400">Género</p>
                            <p className="font-medium text-gray-900">{selectedUser.genero}</p>
                          </div>
                          <div>
                            <p className="text-[11px] text-gray-400">Edad</p>
                            <p className="font-medium text-gray-900">{selectedUser.edad} años</p>
                          </div>
                          <div>
                            <p className="text-[11px] text-gray-400">Etnia</p>
                            <p className="font-medium text-gray-900">{selectedUser.etnia}</p>
                          </div>
                          <div>
                            <p className="text-[11px] text-gray-400">Documento</p>
                            <p className="font-medium text-gray-900">{selectedUser.tipoDocumento}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-[11px] text-gray-400">Número</p>
                            <p className="font-medium text-gray-900">{selectedUser.numeroDocumento}</p>
                          </div>
                        </div>
                      </section>

                      <section>
                        <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-600">
                          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                            <Building2 className="h-3.5 w-3.5" />
                          </span>
                          Institucional
                        </p>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                          <div>
                            <p className="text-[11px] text-gray-400">Sede</p>
                            <p className="font-medium text-gray-900">{selectedUser.sede}</p>
                          </div>
                          {selectedUser.codigoEstudiantil && (
                            <div>
                              <p className="text-[11px] text-gray-400">Código estudiantil</p>
                              <p className="font-medium text-gray-900">{selectedUser.codigoEstudiantil}</p>
                            </div>
                          )}
                        </div>
                      </section>

                      {(selectedUser.facultad || selectedUser.programaAcademico) && (
                        <section className="sm:col-span-2">
                          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-600">
                            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                              <GraduationCap className="h-3.5 w-3.5" />
                            </span>
                            Académica
                          </p>
                          <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                            {selectedUser.facultad && (
                              <div>
                                <p className="text-[11px] text-gray-400">Facultad</p>
                                <p className="font-medium text-gray-900">{selectedUser.facultad}</p>
                              </div>
                            )}
                            {selectedUser.programaAcademico && (
                              <div>
                                <p className="text-[11px] text-gray-400">Programa</p>
                                <p className="font-medium text-gray-900">{selectedUser.programaAcademico}</p>
                              </div>
                            )}
                          </div>
                        </section>
                      )}

                      <section>
                        <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-orange-600">
                          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                            <Music className="h-3.5 w-3.5" />
                          </span>
                          {area === "deporte" ? "Grupos" : "Grupos culturales"}
                        </p>
                        {detailsLoading ? (
                          <p className="text-sm text-orange-400">Cargando grupos...</p>
                        ) : userGroups.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {userGroups.map((group) => (
                              <span key={group.id} className="inline-flex items-center gap-1 rounded-full bg-orange-50 py-1 pl-3 pr-1 text-sm font-medium text-orange-900">
                                {group.grupoCultural}
                                {(isAdmin || isSuperAdmin) && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveUserFromGroup(group)}
                                    disabled={removingGroupId === group.id}
                                    className="flex h-6 w-6 items-center justify-center rounded-full text-orange-400 transition hover:bg-white hover:text-rose-600 disabled:opacity-50"
                                    aria-label={`Quitar de ${group.grupoCultural}`}
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400">No está inscrito en ningún grupo</p>
                        )}
                      </section>

                      <section>
                        <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-fuchsia-600">
                          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-fuchsia-100 text-fuchsia-600">
                            <Megaphone className="h-3.5 w-3.5" />
                          </span>
                          Convocatorias
                        </p>
                        {detailsLoading ? (
                          <p className="text-sm text-fuchsia-400">Cargando convocatorias...</p>
                        ) : userConvocatorias.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {userConvocatorias.map((item) => (
                              <span key={item.id} className="rounded-full bg-fuchsia-50 px-3 py-1 text-sm font-medium text-fuchsia-900">
                                {item.nombre}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400">No está inscrito en ninguna convocatoria</p>
                        )}
                      </section>

                      <section>
                        <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-sky-600">
                          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                            <Calendar className="h-3.5 w-3.5" />
                          </span>
                          Eventos
                        </p>
                        {detailsLoading ? (
                          <p className="text-sm text-sky-400">Cargando eventos...</p>
                        ) : userRealEvents.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {userRealEvents.map((item) => (
                              <span key={item.id} className="rounded-full bg-sky-50 px-3 py-1 text-sm font-medium text-sky-900">
                                {item.nombre}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400">No está inscrito en ningún evento</p>
                        )}
                      </section>

                      <section>
                        <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-600">
                          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                            <Calendar className="h-3.5 w-3.5" />
                          </span>
                          Asistencia
                        </p>
                        <div className="rounded-2xl bg-indigo-50 px-3 py-2">
                          <p className="text-[11px] text-indigo-400">Última asistencia</p>
                          <p className="text-sm font-medium text-indigo-950">
                            {formatDateTime(userAttendances[0]?.timestamp || selectedUser.lastAttendance)}
                          </p>
                        </div>
                      </section>
                    </div>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>

          {/* Edit User Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open) }}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2">
                  <Pencil className="h-5 w-5" />
                  Editar Usuario
                </DialogTitle>
                <DialogDescription>
                  Modifica los datos de {userToEdit?.nombres}
                </DialogDescription>
              </DialogHeader>

              {userToEdit && (
                <div className="space-y-4 py-2">
                  {/* Datos personales */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-sm font-medium">Nombres completos</label>
                      <Input
                        value={editForm.nombres}
                        onChange={(e) => setEditForm(f => ({ ...f, nombres: e.target.value }))}
                        placeholder="Nombres completos"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium">Correo electrónico</label>
                      <Input
                        type="email"
                        value={editForm.correo}
                        onChange={(e) => setEditForm(f => ({ ...f, correo: e.target.value }))}
                        placeholder="correo@ejemplo.com"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium">Teléfono</label>
                      <Input
                        value={editForm.telefono}
                        onChange={(e) => setEditForm(f => ({ ...f, telefono: e.target.value }))}
                        placeholder="Número de teléfono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium">Tipo de documento</label>
                      <Select
                        value={editForm.tipoDocumento}
                        onValueChange={(v) => setEditForm(f => ({ ...f, tipoDocumento: v as UserProfile["tipoDocumento"] }))}
                      >
                        <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CEDULA">Cédula</SelectItem>
                          <SelectItem value="TARGETA DE IDENTIDAD">Tarjeta de identidad</SelectItem>
                          <SelectItem value="CEDULA DE EXTRANJERIA">Cédula de extranjería</SelectItem>
                          <SelectItem value="PASAPORTE">Pasaporte</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium">Número de documento</label>
                      <Input
                        value={editForm.numeroDocumento}
                        onChange={(e) => setEditForm(f => ({ ...f, numeroDocumento: e.target.value }))}
                        placeholder="Número de documento"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium">Edad</label>
                      <Input
                        type="number"
                        min={1}
                        max={120}
                        value={editForm.edad}
                        onChange={(e) => setEditForm(f => ({ ...f, edad: e.target.value }))}
                        placeholder="Edad"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium">Género</label>
                      <Select
                        value={editForm.genero}
                        onValueChange={(v) => setEditForm(f => ({ ...f, genero: v as UserProfile["genero"] }))}
                      >
                        <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MUJER">Mujer</SelectItem>
                          <SelectItem value="HOMBRE">Hombre</SelectItem>
                          <SelectItem value="OTRO">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium">Etnia</label>
                      <Select
                        value={editForm.etnia}
                        onValueChange={(v) => setEditForm(f => ({ ...f, etnia: v as UserProfile["etnia"] }))}
                      >
                        <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MESTIZO">Mestizo</SelectItem>
                          <SelectItem value="AFRO">Afro</SelectItem>
                          <SelectItem value="INDIGENA">Indígena</SelectItem>
                          <SelectItem value="GITANO O ROM">Gitano o Rom</SelectItem>
                          <SelectItem value="PALENQUERO">Palenquero</SelectItem>
                          <SelectItem value="RAIZAL">Raizal</SelectItem>
                          <SelectItem value="NO SABE">No sabe</SelectItem>
                          <SelectItem value="NO RESPONDE">No responde</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium">Sede</label>
                      <Select
                        value={editForm.sede}
                        onValueChange={(v) => setEditForm(f => ({ ...f, sede: v as UserProfile["sede"] }))}
                      >
                        <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                        <SelectContent>
                          {["SAN FERNANDO","MELENDEZ","BUGA","TULUA","SEDE PASIFICO","PALMIRA","CAICEDONIA","CARTAGO","NORTE DEL CAUCA","YUMBO","ZARZAL","NINGUNA"].map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium">Estamento</label>
                      <Select
                        value={editForm.estamento}
                        onValueChange={(v) => setEditForm(f => ({ ...f, estamento: v as UserProfile["estamento"] }))}
                      >
                        <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                        <SelectContent>
                          {["ESTUDIANTE","EGRESADO","DOCENTE","DOCENTE HORA CATEDRA","FUNCIONARIO","CONTRATISTA","INVITADO"].map(e => (
                            <SelectItem key={e} value={e}>{e}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Datos académicos (opcionales) */}
                  {(editForm.estamento === "ESTUDIANTE" || editForm.estamento === "EGRESADO" || editForm.estamento === "DOCENTE" || editForm.estamento === "DOCENTE HORA CATEDRA") && (
                    <div className="border-t pt-4 space-y-3">
                      <p className="text-sm font-semibold text-gray-700">Información académica (opcional)</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-sm font-medium">Código estudiantil</label>
                          <Input
                            value={editForm.codigoEstudiantil}
                            onChange={(e) => setEditForm(f => ({ ...f, codigoEstudiantil: e.target.value }))}
                            placeholder="Código estudiantil"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-medium">Facultad</label>
                          <Input
                            value={editForm.facultad}
                            onChange={(e) => setEditForm(f => ({ ...f, facultad: e.target.value }))}
                            placeholder="Facultad"
                          />
                        </div>
                        <div className="md:col-span-2 space-y-1">
                          <label className="text-sm font-medium">Programa académico</label>
                          <Input
                            value={editForm.programaAcademico}
                            onChange={(e) => setEditForm(f => ({ ...f, programaAcademico: e.target.value }))}
                            placeholder="Programa académico"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t">
                <Button
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                  disabled={isSavingEdit}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmEditUser}
                  disabled={isSavingEdit}
                  className="flex-1"
                >
                  {isSavingEdit ? "Guardando..." : "Guardar cambios"}
                </Button>
              </div>
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
                      {area === "deporte" && (
                        <SelectItem value="FISIOTERAPEUTA">Fisioterapeuta</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs md:text-sm text-blue-800">
                    <strong>Nota:</strong> Los roles de {area === 'deporte' ? 'Entrenador' : 'Director'} y Monitor permiten gestionar grupos {area === 'deporte' ? 'deportivos' : 'culturales'}.
                    {area === "deporte" ? " El fisioterapeuta ingresa por el mismo login y no requiere grupo asignado." : ""}
                  </p>
                </div>

                {selectedRole === "FISIOTERAPEUTA" && (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={esFisioEncargado}
                      onChange={(e) => setEsFisioEncargado(e.target.checked)}
                    />
                    Fisioterapeuta encargado (ve todas las bitácoras y asigna solicitudes)
                  </label>
                )}
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

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { Users, Eye, Music, MoreVertical, UserPlus, CheckCircle, AlertTriangle, X, Search, Edit, Trash, Plus } from "lucide-react"
import Link from "next/link"
import { getAllGroupsWithEnrollments, getAllCulturalGroups, migrateExistingGroupsToCollection, cleanDuplicateEnrollments, migrateEnrollmentsToCompositeIds } from "@/lib/firestore"
import { getAllCulturalGroups as getAllCulturalGroupsRouter, getGroupsWithEnrollmentCounts, getAllUsers as getAllUsersRouter, assignGroupManager, getGroupManagers, removeGroupManager, createCulturalGroup, updateCulturalGroupName, deleteCulturalGroup, type CulturalGroup } from "@/lib/db-router"

import type { GroupWithEnrollments, UserProfile, GroupManager, UserRole } from "@/lib/types"
import { useArea } from "@/contexts/area-context"
import { getRolePermissions, filterGroupsByAssignment, type RolePermissions } from "@/lib/role-manager"
import { getCurrentUserRole, isSuperAdmin as checkIsSuperAdmin, isAdmin as checkIsAdmin, getAssignedGroups } from "@/lib/auth-helpers"

export default function GruposPage() {
  const { area } = useArea()
  const [groups, setGroups] = useState<GroupWithEnrollments[]>([])
  const [filteredGroups, setFilteredGroups] = useState<GroupWithEnrollments[]>([])
  const [culturalGroups, setCulturalGroups] = useState<CulturalGroup[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  
  console.log("[Grupos] Component render - area:", area)
  console.log("[Grupos] localStorage selectedArea:", typeof window !== 'undefined' ? localStorage.getItem('selectedArea') : 'N/A')
  console.log("[Grupos] sessionStorage adminArea:", typeof window !== 'undefined' ? sessionStorage.getItem('adminArea') : 'N/A')
  const [managerDialogOpen, setManagerDialogOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<string>("")
  const [availableManagers, setAvailableManagers] = useState<UserProfile[]>([])
  const [selectedManager, setSelectedManager] = useState<string>("")
  const [isAssigning, setIsAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [groupManagers, setGroupManagers] = useState<Record<string, (GroupManager & { user: UserProfile })[]>>({})
  const [viewManagersDialogOpen, setViewManagersDialogOpen] = useState(false)
  const [viewingGroup, setViewingGroup] = useState<string>("")
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>("ESTUDIANTE")
  const [currentUserPermissions, setCurrentUserPermissions] = useState<RolePermissions | null>(null)
  
  // Estados para crear/editar/eliminar grupos
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  const [editingGroup, setEditingGroup] = useState<CulturalGroup | null>(null)
  const [editedGroupName, setEditedGroupName] = useState("")
  const [deletingGroup, setDeletingGroup] = useState<CulturalGroup | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isMigrating, setIsMigrating] = useState(false)
  const [isCleaningDuplicates, setIsCleaningDuplicates] = useState(false)
  const [isMigratingIds, setIsMigratingIds] = useState(false)

  useEffect(() => {
    // Get user role and permissions
    const userRole = getCurrentUserRole()
    const adminStatus = checkIsAdmin()
    const superAdminStatus = checkIsSuperAdmin()
    const assignedGroups = getAssignedGroups()
    
    console.log("[Grupos] ========== CHECKING ADMIN STATUS ==========")
    console.log("[Grupos] sessionStorage.userType:", sessionStorage.getItem("userType"))
    console.log("[Grupos] sessionStorage.isAdmin:", sessionStorage.getItem("isAdmin"))
    console.log("[Grupos] sessionStorage.isSuperAdmin:", sessionStorage.getItem("isSuperAdmin"))
    console.log("[Grupos] sessionStorage.userRole:", sessionStorage.getItem("userRole"))
    console.log("[Grupos] sessionStorage.adminArea:", sessionStorage.getItem("adminArea"))
    console.log("[Grupos] localStorage.selectedArea:", localStorage.getItem("selectedArea"))
    console.log("[Grupos] checkIsAdmin() result:", adminStatus)
    console.log("[Grupos] checkIsSuperAdmin() result:", superAdminStatus)
    console.log("[Grupos] getCurrentUserRole() result:", userRole)
    console.log("[Grupos] getAssignedGroups() result:", assignedGroups)
    console.log("[Grupos] Current area from useArea():", area)
    console.log("[Grupos] ===============================================")
    
    setIsAdmin(adminStatus)
    setIsSuperAdmin(superAdminStatus)
    setCurrentUserRole(userRole)
    
    // Get user permissions based on role and assigned groups
    const permissions = getRolePermissions(userRole, area, assignedGroups)
    setCurrentUserPermissions(permissions)
    
    console.log("[Grupos] ========== PERMISSIONS CALCULATED ==========")
    console.log("[Grupos] User role:", userRole)
    console.log("[Grupos] Area:", area)
    console.log("[Grupos] Assigned groups:", assignedGroups)
    console.log("[Grupos] Permissions:", JSON.stringify(permissions, null, 2))
    console.log("[Grupos] canViewAllGroups:", permissions.canViewAllGroups)
    console.log("[Grupos] ===============================================")
    
    // Cargar grupos inmediatamente después de establecer permisos
    loadGroupsWithPermissions(permissions)
  }, [area])

  async function loadGroupsWithPermissions(permissions: RolePermissions) {
    try {
      setLoading(true)
      console.log("[Grupos] ========== LOADING GROUPS ==========")
      console.log("[Grupos] Area:", area)
      console.log("[Grupos] Permissions:", permissions)
      
      // Get groups with enrollment counts from area-aware router
      const groupsWithCounts = await getGroupsWithEnrollmentCounts(area)
      console.log("[Grupos] Groups with enrollment counts:", groupsWithCounts.length)
      console.log("[Grupos] Sample groups:", groupsWithCounts.slice(0, 3))
      
      // Get cultural groups for additional data
      const allCulturalGroups = await getAllCulturalGroupsRouter(area)
      console.log("[Grupos] All cultural groups:", allCulturalGroups.length)
      
      // Apply role-based filtering to cultural groups
      let filteredCulturalGroups = allCulturalGroups
      if (permissions && !permissions.canViewAllGroups) {
        console.log("[Grupos] Applying role-based filtering")
        filteredCulturalGroups = filterGroupsByAssignment(allCulturalGroups, permissions)
        console.log("[Grupos] Filtered cultural groups:", filteredCulturalGroups.length)
      }
      
      setCulturalGroups(filteredCulturalGroups)
      
      // Filter groups with counts to match filtered cultural groups
      const filteredGroupNames = new Set(filteredCulturalGroups.map(g => g.nombre))
      const filteredGroupsWithCounts = groupsWithCounts.filter(g => filteredGroupNames.has(g.nombre))
      
      console.log("[Grupos] Final filtered groups with counts:", filteredGroupsWithCounts.length)
      console.log("[Grupos] =======================================")
      
      setGroups(filteredGroupsWithCounts)
      setFilteredGroups(filteredGroupsWithCounts)

      // Cargar encargados de cada grupo
      const managersMap: Record<string, (GroupManager & { user: UserProfile })[]> = {}
      for (const group of filteredCulturalGroups) {
        const managers = await getGroupManagers(area, group.nombre)
        managersMap[group.nombre] = managers
      }
      setGroupManagers(managersMap)
    } catch (error) {
      console.error("[Grupos] Error cargando grupos:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = groups.filter((group) =>
        group.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredGroups(filtered)
    } else {
      setFilteredGroups(groups)
    }
  }, [searchTerm, groups])

  async function loadGroups() {
    // Recargar con los permisos actuales
    if (currentUserPermissions) {
      await loadGroupsWithPermissions(currentUserPermissions)
    }
  }

  const handleAssignManager = async (groupName: string) => {
    if (!isAdmin && !isSuperAdmin) {
      setError("Solo los administradores pueden asignar encargados")
      setTimeout(() => setError(null), 3000)
      return
    }
    
    setSelectedGroup(groupName)
    setManagerDialogOpen(true)
    
    // Cargar usuarios con rol de director o monitor del área actual
    try {
      const allUsers = await getAllUsersRouter(area)
      const managers = allUsers.filter(u => u.rol === "DIRECTOR" || u.rol === "MONITOR")
      setAvailableManagers(managers)
      console.log("[Grupos] Loaded", managers.length, "managers from area:", area)
    } catch (error) {
      console.error("Error cargando managers:", error)
      setError("Error al cargar la lista de directores y monitores")
    }
  }

  const confirmAssignManager = async () => {
    if (!selectedManager || !selectedGroup) return

    setIsAssigning(true)
    setError(null)
    
    try {
      const assignedBy = sessionStorage.getItem("userId") || "admin"
      await assignGroupManager(area, selectedManager, selectedGroup, assignedBy)
      setSuccess(`Encargado asignado exitosamente a ${selectedGroup}`)
      await loadGroups()
      setManagerDialogOpen(false)
      setSelectedManager("")
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      setError(error.message || "Error al asignar encargado")
      setTimeout(() => setError(null), 3000)
    } finally {
      setIsAssigning(false)
    }
  }

  const handleViewManagers = (groupName: string) => {
    setViewingGroup(groupName)
    setViewManagersDialogOpen(true)
  }

  const handleRemoveManager = async (managerId: string) => {
    if (!isAdmin && !isSuperAdmin) {
      setError("Solo los administradores pueden remover encargados")
      setTimeout(() => setError(null), 3000)
      return
    }
    
    try {
      await removeGroupManager(area, managerId)
      setSuccess("Encargado removido exitosamente")
      await loadGroups()
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error("Error removing manager:", error)
      setError("Error al remover encargado")
      setTimeout(() => setError(null), 3000)
    }
  }

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      setError("El nombre del grupo no puede estar vacío")
      setTimeout(() => setError(null), 3000)
      return
    }

    setIsProcessing(true)
    try {
      await createCulturalGroup(area, newGroupName.trim())
      setSuccess(`Grupo "${newGroupName}" creado exitosamente`)
      setNewGroupName("")
      setCreateDialogOpen(false)
      await loadGroups()
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      setError(error.message || "Error al crear el grupo")
      setTimeout(() => setError(null), 3000)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleEditGroup = (group: CulturalGroup) => {
    setEditingGroup(group)
    setEditedGroupName(group.nombre)
    setEditDialogOpen(true)
  }

  const confirmEditGroup = async () => {
    if (!editingGroup || !editedGroupName.trim()) {
      setError("El nombre del grupo no puede estar vacío")
      setTimeout(() => setError(null), 3000)
      return
    }

    setIsProcessing(true)
    try {
      await updateCulturalGroupName(area, editingGroup.id, editingGroup.nombre, editedGroupName.trim())
      setSuccess(`Grupo actualizado exitosamente`)
      setEditDialogOpen(false)
      setEditingGroup(null)
      setEditedGroupName("")
      await loadGroups()
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      setError(error.message || "Error al actualizar el grupo")
      setTimeout(() => setError(null), 3000)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeleteGroup = (group: CulturalGroup) => {
    setDeletingGroup(group)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteGroup = async () => {
    if (!deletingGroup) return

    setIsProcessing(true)
    try {
      await deleteCulturalGroup(area, deletingGroup.id, deletingGroup.nombre)
      setSuccess(`Grupo "${deletingGroup.nombre}" eliminado exitosamente`)
      setDeleteDialogOpen(false)
      setDeletingGroup(null)
      await loadGroups()
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      setError(error.message || "Error al eliminar el grupo")
      setTimeout(() => setError(null), 3000)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleMigrateGroups = async () => {
    const confirmed = window.confirm(
      "¿Deseas migrar los grupos existentes?\n\n" +
      "Esto creará registros en la colección 'cultural_groups' para todos los grupos " +
      "que ya existen en tus inscripciones y asistencias.\n\n" +
      "No se perderá ningún dato."
    )

    if (!confirmed) return

    setIsMigrating(true)
    try {
      const result = await migrateExistingGroupsToCollection()
      setSuccess(
        `Migración completada: ${result.created} grupo(s) creado(s), ` +
        `${result.existing.length} ya existían`
      )
      await loadGroups()
      setTimeout(() => setSuccess(null), 5000)
    } catch (error: any) {
      setError(error.message || "Error durante la migración")
      setTimeout(() => setError(null), 3000)
    } finally {
      setIsMigrating(false)
    }
  }

  const handleCleanDuplicates = async () => {
    const confirmed = window.confirm(
      "¿Deseas limpiar inscripciones duplicadas?\n\n" +
      "Esto eliminará inscripciones duplicadas de usuarios al mismo grupo, " +
      "manteniendo solo la más reciente.\n\n" +
      "Esto corregirá el conteo de inscritos."
    )

    if (!confirmed) return

    setIsCleaningDuplicates(true)
    try {
      const result = await cleanDuplicateEnrollments()
      setSuccess(
        `Limpieza completada: ${result.removed} inscripción(es) duplicada(s) eliminada(s), ` +
        `${result.kept} inscripción(es) mantenida(s)`
      )
      await loadGroups()
      setTimeout(() => setSuccess(null), 5000)
    } catch (error: any) {
      setError(error.message || "Error durante la limpieza")
      setTimeout(() => setError(null), 3000)
    } finally {
      setIsCleaningDuplicates(false)
    }
  }

  const handleMigrateToCompositeIds = async () => {
    const confirmed = window.confirm(
      "¿Migrar inscripciones a IDs compuestos?\n\n" +
      "Esto previene duplicados a nivel de base de datos usando IDs únicos.\n" +
      "También eliminará cualquier duplicado existente.\n\n" +
      "Esta operación es segura y mejora la integridad de los datos."
    )

    if (!confirmed) return

    setIsMigratingIds(true)
    try {
      const result = await migrateEnrollmentsToCompositeIds()
      setSuccess(
        `Migración completada: ${result.migrated} inscripción(es) migrada(s), ` +
        `${result.duplicatesRemoved} duplicado(s) eliminado(s)` +
        (result.errors > 0 ? `, ${result.errors} error(es)` : "")
      )
      await loadGroups()
      setTimeout(() => setSuccess(null), 5000)
    } catch (error: any) {
      setError(error.message || "Error durante la migración")
      setTimeout(() => setError(null), 3000)
    } finally {
      setIsMigratingIds(false)
    }
  }


  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  // Preparar opciones para el Combobox (usando grupos cargados dinámicamente)
  const gruposOptions: ComboboxOption[] = culturalGroups.map((grupo) => ({
    value: grupo.nombre,
    label: grupo.nombre,
  }))

  const totalInscritos = filteredGroups.reduce((sum, g) => sum + g.totalInscritos, 0)
  const gruposConInscritos = filteredGroups.filter(g => g.totalInscritos > 0).length

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Grupos {area === 'deporte' ? 'Deportivos' : 'Culturales'}
              </h1>
              <p className="text-gray-600 mt-2">
                Gestión de inscripciones a grupos {area === 'deporte' ? 'deportivos' : 'culturales'}
              </p>
            </div>
            {(isAdmin || isSuperAdmin) && (
              <div className="flex flex-wrap gap-2">
                {culturalGroups.length === 0 && isSuperAdmin && (
                  <Button
                    onClick={handleMigrateGroups}
                    disabled={isMigrating}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isMigrating ? "Migrando..." : "Migrar Grupos Existentes"}
                  </Button>
                )}
                {isSuperAdmin && (
                  <>
                    <Button
                      onClick={handleMigrateToCompositeIds}
                      disabled={isMigratingIds}
                      variant="outline"
                      className="border-purple-300 text-purple-700 hover:bg-purple-50"
                    >
                      {isMigratingIds ? "Migrando IDs..." : "Migrar a IDs Únicos"}
                    </Button>
                    <Button
                      onClick={handleCleanDuplicates}
                      disabled={isCleaningDuplicates}
                      variant="outline"
                      className="border-orange-300 text-orange-700 hover:bg-orange-50"
                    >
                      {isCleaningDuplicates ? "Limpiando..." : "Limpiar Duplicados"}
                    </Button>
                    <Button
                      onClick={() => {
                        setLoading(true)
                        loadGroups()
                      }}
                      disabled={loading}
                      variant="outline"
                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      {loading ? "Recargando..." : "Recargar Datos"}
                    </Button>
                  </>
                )}
                <Button
                  onClick={() => setCreateDialogOpen(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Grupo
                </Button>
              </div>
            )}
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

          {/* Filtro de búsqueda */}
          <Card className="w-full max-w-full md:max-w-2xl lg:max-w-3xl mx-auto">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Search className="w-4 h-4 md:w-5 md:h-5" />
                Buscar Grupos
              </CardTitle>
              <CardDescription className="text-sm">Filtra grupos por nombre</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre de grupo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 md:h-11"
                />
              </div>
              {searchTerm && (
                <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <p className="text-xs md:text-sm text-gray-600">
                    Mostrando {filteredGroups.length} de {groups.length} grupos
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchTerm("")}
                    className="w-full sm:w-auto"
                  >
                    Limpiar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Inscritos</p>
                    <p className="text-2xl font-bold text-gray-900">{totalInscritos}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-full">
                    <Music className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Grupos Activos</p>
                    <p className="text-2xl font-bold text-gray-900">{gruposConInscritos}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Music className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Grupos</p>
                    <p className="text-2xl font-bold text-gray-900">{groups.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabla de Grupos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="w-5 h-5" />
                Lista de Grupos {area === 'deporte' ? 'Deportivos' : 'Culturales'}
              </CardTitle>
              <CardDescription>
                {searchTerm 
                  ? `${filteredGroups.length} grupo${filteredGroups.length !== 1 ? 's' : ''} encontrado${filteredGroups.length !== 1 ? 's' : ''}`
                  : `Todos los grupos ${area === 'deporte' ? 'deportivos' : 'culturales'} disponibles y sus inscripciones`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredGroups.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Grupo</TableHead>
                        <TableHead className="text-center">Total Inscritos</TableHead>
                        <TableHead className="text-center">Encargados</TableHead>
                        <TableHead className="text-center">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredGroups.map((group) => {
                      const managers = groupManagers[group.nombre] || []
                      const culturalGroup = culturalGroups.find(cg => cg.nombre === group.nombre)
                      return (
                        <TableRow key={group.nombre}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-purple-100 text-purple-700">
                                  {getInitials(group.nombre)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{group.nombre}</div>
                                <div className="text-sm text-gray-500">
                                  {group.totalInscritos > 0 
                                    ? `${group.totalInscritos} persona${group.totalInscritos !== 1 ? 's' : ''} inscrita${group.totalInscritos !== 1 ? 's' : ''}`
                                    : "Sin inscripciones"
                                  }
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge 
                              variant="secondary" 
                              className={`text-base ${
                                group.totalInscritos > 0 
                                  ? "bg-blue-100 text-blue-800" 
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {group.totalInscritos}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {managers.length > 0 ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewManagers(group.nombre)}
                              >
                                {managers.length} encargado{managers.length !== 1 ? 's' : ''}
                              </Button>
                            ) : (
                              <span className="text-sm text-gray-500">Sin encargados</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/grupos/${encodeURIComponent(group.nombre)}`}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Ver Grupo
                                  </Link>
                                </DropdownMenuItem>
                                {(isAdmin || isSuperAdmin) && (
                                  <>
                                    <DropdownMenuItem onClick={() => handleAssignManager(group.nombre)}>
                                      <UserPlus className="h-4 w-4 mr-2" />
                                      Asignar Encargado
                                    </DropdownMenuItem>
                                    {culturalGroup && (
                                      <>
                                        <DropdownMenuItem onClick={() => handleEditGroup(culturalGroup)}>
                                          <Edit className="h-4 w-4 mr-2" />
                                          Editar Nombre
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                          onClick={() => handleDeleteGroup(culturalGroup)}
                                          className="text-red-600"
                                        >
                                          <Trash className="h-4 w-4 mr-2" />
                                          Eliminar Grupo
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm
                    ? "No se encontraron grupos con ese nombre"
                    : "No hay grupos disponibles"}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dialog para asignar encargado */}
          <Dialog open={managerDialogOpen} onOpenChange={setManagerDialogOpen}>
            <DialogContent className="w-[95vw] max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle className="text-lg md:text-xl">Asignar Encargado</DialogTitle>
                <DialogDescription className="text-sm">
                  Selecciona un director o monitor para el grupo {selectedGroup}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {availableManagers.length > 0 ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Director / Monitor</label>
                      <Select value={selectedManager} onValueChange={setSelectedManager}>
                        <SelectTrigger className="h-10 md:h-11">
                          <SelectValue placeholder="Selecciona un encargado" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableManagers.map((manager) => (
                            <SelectItem key={manager.id} value={manager.id}>
                              {manager.nombres} - {manager.rol}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-xs md:text-sm text-amber-800">
                        <strong>Nota:</strong> Un usuario solo puede ser encargado de un grupo a la vez.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500">No hay directores o monitores disponibles.</p>
                    <p className="text-xs md:text-sm text-gray-400 mt-2">
                      Asigna roles de Director o Monitor desde la página de Usuarios.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setManagerDialogOpen(false)
                    setSelectedManager("")
                  }}
                  disabled={isAssigning}
                  className="flex-1 h-10 md:h-11"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmAssignManager}
                  disabled={isAssigning || !selectedManager}
                  className="flex-1 h-10 md:h-11"
                >
                  {isAssigning ? "Asignando..." : "Asignar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Dialog para ver encargados */}
          <Dialog open={viewManagersDialogOpen} onOpenChange={setViewManagersDialogOpen}>
            <DialogContent className="w-[95vw] max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle className="text-lg md:text-xl">Encargados de {viewingGroup}</DialogTitle>
                <DialogDescription className="text-sm">
                  Lista de directores y monitores asignados a este grupo
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto">
                {groupManagers[viewingGroup]?.length > 0 ? (
                  groupManagers[viewingGroup].map((manager) => (
                    <div key={manager.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Avatar className="h-9 w-9 md:h-10 md:w-10">
                        <AvatarFallback className="bg-blue-100 text-blue-700 text-xs md:text-sm">
                          {manager.user.nombres.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm md:text-base truncate">{manager.user.nombres}</p>
                        <p className="text-xs md:text-sm text-gray-500 truncate">{manager.user.correo}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs shrink-0">{manager.user.rol}</Badge>
                      {(isAdmin || isSuperAdmin) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveManager(manager.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0 shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No hay encargados asignados a este grupo
                  </div>
                )}
              </div>

              <Button onClick={() => setViewManagersDialogOpen(false)} className="w-full h-10 md:h-11">
                Cerrar
              </Button>
            </DialogContent>
          </Dialog>

          {/* Dialog para crear grupo */}
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogContent className="w-[95vw] max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle className="text-lg md:text-xl">
                  Crear Nuevo Grupo {area === 'deporte' ? 'Deportivo' : 'Cultural'}
                </DialogTitle>
                <DialogDescription className="text-sm">
                  Ingresa el nombre del nuevo grupo {area === 'deporte' ? 'deportivo' : 'cultural'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="newGroupName">Nombre del Grupo</Label>
                  <Input
                    id="newGroupName"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Ej: Grupo de Teatro"
                    className="h-10 md:h-11"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCreateDialogOpen(false)
                    setNewGroupName("")
                  }}
                  disabled={isProcessing}
                  className="flex-1 h-10 md:h-11"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateGroup}
                  disabled={isProcessing || !newGroupName.trim()}
                  className="flex-1 h-10 md:h-11 bg-green-600 hover:bg-green-700"
                >
                  {isProcessing ? "Creando..." : "Crear Grupo"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Dialog para editar grupo */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="w-[95vw] max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle className="text-lg md:text-xl">Editar Nombre del Grupo</DialogTitle>
                <DialogDescription className="text-sm">
                  Modifica el nombre del grupo. Esto actualizará todos los registros relacionados.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs md:text-sm text-amber-800">
                    <strong>Nombre actual:</strong> {editingGroup?.nombre}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editedGroupName">Nuevo Nombre</Label>
                  <Input
                    id="editedGroupName"
                    value={editedGroupName}
                    onChange={(e) => setEditedGroupName(e.target.value)}
                    placeholder="Ingresa el nuevo nombre"
                    className="h-10 md:h-11"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditDialogOpen(false)
                    setEditingGroup(null)
                    setEditedGroupName("")
                  }}
                  disabled={isProcessing}
                  className="flex-1 h-10 md:h-11"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmEditGroup}
                  disabled={isProcessing || !editedGroupName.trim()}
                  className="flex-1 h-10 md:h-11"
                >
                  {isProcessing ? "Actualizando..." : "Actualizar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Dialog para eliminar grupo */}
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent className="w-[95vw] max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle className="text-lg md:text-xl text-red-600">
                  Eliminar Grupo {area === 'deporte' ? 'Deportivo' : 'Cultural'}
                </DialogTitle>
                <DialogDescription className="text-sm">
                  Esta acción no se puede deshacer
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">
                    ¿Estás seguro de que deseas eliminar el grupo <strong>"{deletingGroup?.nombre}"</strong>?
                  </p>
                  <p className="text-xs text-red-700 mt-2">
                    Esto eliminará:
                  </p>
                  <ul className="text-xs text-red-700 mt-1 ml-4 list-disc">
                    <li>Todas las inscripciones al grupo</li>
                    <li>Todos los registros de asistencia</li>
                    <li>Todas las asignaciones de encargados</li>
                    <li>Todas las categorías asignadas</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeleteDialogOpen(false)
                    setDeletingGroup(null)
                  }}
                  disabled={isProcessing}
                  className="flex-1 h-10 md:h-11"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmDeleteGroup}
                  disabled={isProcessing}
                  variant="destructive"
                  className="flex-1 h-10 md:h-11"
                >
                  {isProcessing ? "Eliminando..." : "Eliminar Grupo"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}

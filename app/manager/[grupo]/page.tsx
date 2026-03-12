"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  Search,
  UserCheck,
  Filter,
  X,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { getGroupEnrolledUsers as getGroupEnrollments, saveAttendanceEntry } from "@/lib/firestore"
import { assignUsersToCategory, getUserCategory } from "@/lib/group-categories"
import { getAttendanceRecords } from "@/lib/storage"
import { getUserEnrollments, getAllUsers, saveAttendanceEntry as saveAttendanceEntryRouter, getAttendanceRecords as getAttendanceRecordsRouter } from "@/lib/db-router"
import type { UserProfile, GroupCategory } from "@/lib/types"
import type { Area } from "@/lib/firebase-config"

export default function ManagerGroupPage() {
  const params = useParams()
  const router = useRouter()
  const groupName = decodeURIComponent(params.grupo as string)

  const [area, setArea] = useState<Area>("cultura")
  const [enrolledUsers, setEnrolledUsers] = useState<UserProfile[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Filtros
  const [searchName, setSearchName] = useState("")
  const [filterFacultad, setFilterFacultad] = useState("")
  const [filterPrograma, setFilterPrograma] = useState("")
  const [filterCodigo, setFilterCodigo] = useState("")
  const [filterCategory, setFilterCategory] = useState<GroupCategory | "TODOS">("TODOS")
  const [showFilters, setShowFilters] = useState(false)

  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 8

  // Asistencia
  const [selectedForAttendance, setSelectedForAttendance] = useState<Set<string>>(new Set())
  const [isMarkingAttendance, setIsMarkingAttendance] = useState(false)

  // Categorías
  const [selectedForCategory, setSelectedForCategory] = useState<Set<string>>(new Set())
  const [selectedCategory, setSelectedCategory] = useState<GroupCategory>("SEMILLERO")
  const [isAssigningCategory, setIsAssigningCategory] = useState(false)
  const [userCategories, setUserCategories] = useState<Record<string, GroupCategory>>({})
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)

  // Estadísticas
  const [attendanceStats, setAttendanceStats] = useState<Record<string, number>>({})

  useEffect(() => {
    const userType = sessionStorage.getItem("userType")
    const userRole = sessionStorage.getItem("userRole")
    const assignedGroup = sessionStorage.getItem("grupoCultural")
    const userArea = sessionStorage.getItem("userArea") as Area

    console.log("[Manager] Checking authentication...")
    console.log("[Manager] User type:", userType)
    console.log("[Manager] User role:", userRole)
    console.log("[Manager] Assigned group:", assignedGroup)
    console.log("[Manager] User area:", userArea)
    console.log("[Manager] Current group:", groupName)

    if (userType !== "manager" || (userRole !== "DIRECTOR" && userRole !== "MONITOR")) {
      console.log("[Manager] Invalid user type or role, redirecting to login")
      router.push("/login-manager")
      return
    }

    if (assignedGroup !== groupName) {
      console.log("[Manager] Group mismatch, redirecting to login")
      router.push("/login-manager")
      return
    }

    if (!userArea) {
      console.log("[Manager] No area found, defaulting to cultura")
      setArea("cultura")
    } else {
      console.log("[Manager] Setting area to:", userArea)
      setArea(userArea)
    }

    loadGroupData(userArea || "cultura")
  }, [groupName, router])

  useEffect(() => {
    applyFilters()
  }, [searchName, filterFacultad, filterPrograma, filterCodigo, filterCategory, enrolledUsers])

  async function loadGroupData(currentArea: Area) {
    setLoading(true)
    try {
      console.log("[Manager] Loading group data for area:", currentArea, "group:", groupName)
      
      // Get all users from the area
      const allUsers = await getAllUsers(currentArea)
      console.log("[Manager] Total users in area:", allUsers.length)
      
      // Filter users enrolled in this group by checking their enrollments
      const enrolledUsersList: UserProfile[] = []
      
      for (const user of allUsers) {
        const userEnrollments = await getUserEnrollments(currentArea, user.id)
        const isEnrolled = userEnrollments.some(e => e.grupoCultural === groupName)
        if (isEnrolled) {
          enrolledUsersList.push(user)
        }
      }
      
      console.log("[Manager] Users enrolled in group:", enrolledUsersList.length)
      setEnrolledUsers(enrolledUsersList)

      // Load categories
      const categories: Record<string, GroupCategory> = {}
      for (const user of enrolledUsersList) {
        const category = await getUserCategory(user.id, groupName)
        if (category) {
          categories[user.id] = category
        }
      }
      setUserCategories(categories)

      // Load attendance stats
      const allAttendances = await getAttendanceRecordsRouter(currentArea)
      console.log("[Manager] Total attendance records:", allAttendances.length)
      
      const stats: Record<string, number> = {}
      
      enrolledUsersList.forEach(user => {
        const userAttendances = allAttendances.filter(
          a => a.numeroDocumento === user.numeroDocumento && a.grupoCultural === groupName
        )
        stats[user.id] = userAttendances.length
        console.log("[Manager] User:", user.nombres, "Attendances:", userAttendances.length)
      })
      setAttendanceStats(stats)

    } catch (err) {
      console.error("[Manager] Error loading group data:", err)
      setError("Error al cargar los datos del grupo")
    } finally {
      setLoading(false)
    }
  }

  function applyFilters() {
    let filtered = enrolledUsers

    if (searchName.trim()) {
      filtered = filtered.filter(u =>
        u.nombres.toLowerCase().includes(searchName.toLowerCase())
      )
    }

    if (filterCodigo.trim()) {
      filtered = filtered.filter(u =>
        u.codigoEstudiantil?.includes(filterCodigo)
      )
    }

    if (filterFacultad) {
      filtered = filtered.filter(u => u.facultad === filterFacultad)
    }

    if (filterPrograma) {
      filtered = filtered.filter(u => u.programaAcademico === filterPrograma)
    }

    if (filterCategory !== "TODOS") {
      filtered = filtered.filter(u => userCategories[u.id] === filterCategory)
    }

    setFilteredUsers(filtered)
    setCurrentPage(1) // Reset a la primera página cuando se filtran
  }

  const handleSelectForAttendance = (userId: string) => {
    const newSet = new Set(selectedForAttendance)
    if (newSet.has(userId)) {
      newSet.delete(userId)
    } else {
      newSet.add(userId)
    }
    setSelectedForAttendance(newSet)
  }

  const handleSelectAllForAttendance = () => {
    if (selectedForAttendance.size === paginatedUsers.length && paginatedUsers.every(u => selectedForAttendance.has(u.id))) {
      // Deseleccionar todos de la página actual
      const newSet = new Set(selectedForAttendance)
      paginatedUsers.forEach(u => newSet.delete(u.id))
      setSelectedForAttendance(newSet)
    } else {
      // Seleccionar todos de la página actual
      const newSet = new Set(selectedForAttendance)
      paginatedUsers.forEach(u => newSet.add(u.id))
      setSelectedForAttendance(newSet)
    }
  }

  const handleMarkAttendance = async () => {
    if (selectedForAttendance.size === 0) {
      setError("Selecciona al menos un usuario")
      setTimeout(() => setError(null), 3000)
      return
    }

    setIsMarkingAttendance(true)
    try {
      console.log("[Manager] Marking attendance for", selectedForAttendance.size, "users in area:", area)
      const promises = Array.from(selectedForAttendance).map(userId =>
        saveAttendanceEntryRouter(area, userId, groupName)
      )
      await Promise.all(promises)

      setSuccess(`Asistencia registrada para ${selectedForAttendance.size} usuario(s)`)
      setSelectedForAttendance(new Set())
      await loadGroupData(area)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error("[Manager] Error marking attendance:", err)
      setError("Error al registrar asistencia")
      setTimeout(() => setError(null), 3000)
    } finally {
      setIsMarkingAttendance(false)
    }
  }

  const handleSelectForCategory = (userId: string) => {
    const newSet = new Set(selectedForCategory)
    if (newSet.has(userId)) {
      newSet.delete(userId)
    } else {
      newSet.add(userId)
    }
    setSelectedForCategory(newSet)
  }

  const handleAssignCategory = async () => {
    if (selectedForCategory.size === 0) {
      setError("Selecciona al menos un usuario")
      setTimeout(() => setError(null), 3000)
      return
    }

    setIsAssigningCategory(true)
    try {
      await assignUsersToCategory(Array.from(selectedForCategory), groupName, selectedCategory)
      setSuccess(`${selectedForCategory.size} usuario(s) asignado(s) a ${selectedCategory}`)
      setSelectedForCategory(new Set())
      setShowCategoryDialog(false)
      await loadGroupData(area)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError("Error al asignar categoría")
      setTimeout(() => setError(null), 3000)
    } finally {
      setIsAssigningCategory(false)
    }
  }

  const facultades: ComboboxOption[] = Array.from(new Set(enrolledUsers.map(u => u.facultad).filter(Boolean)))
    .map(f => ({ value: f!, label: f! }))
    .sort((a, b) => a.label.localeCompare(b.label))

  const programas: ComboboxOption[] = Array.from(new Set(enrolledUsers.map(u => u.programaAcademico).filter(Boolean)))
    .map(p => ({ value: p!, label: p! }))
    .sort((a, b) => a.label.localeCompare(b.label))

  const topAttendees = enrolledUsers
    .map(u => ({ user: u, count: attendanceStats[u.id] || 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
  }

  const clearFilters = () => {
    setSearchName("")
    setFilterCodigo("")
    setFilterFacultad("")
    setFilterPrograma("")
    setFilterCategory("TODOS")
  }

  const hasActiveFilters = searchName || filterCodigo || filterFacultad || filterPrograma || filterCategory !== "TODOS"

  // Paginación
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto p-4 md:p-6 max-w-7xl">
        <div className="space-y-4 md:space-y-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{groupName}</h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              Panel de Gestión - {sessionStorage.getItem("userRole")}
            </p>
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

          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <Card>
              <CardContent className="pt-4 md:pt-6">
                <div className="text-center">
                  <div className="mx-auto w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                    <Users className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                  </div>
                  <p className="text-xs md:text-sm text-gray-500">Total</p>
                  <p className="text-xl md:text-2xl font-bold">{enrolledUsers.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 md:pt-6">
                <div className="text-center">
                  <div className="mx-auto w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                    <UserCheck className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                  </div>
                  <p className="text-xs md:text-sm text-gray-500">Semillero</p>
                  <p className="text-xl md:text-2xl font-bold">
                    {Object.values(userCategories).filter(c => c === "SEMILLERO").length}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 md:pt-6">
                <div className="text-center">
                  <div className="mx-auto w-10 h-10 md:w-12 md:h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                    <UserCheck className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
                  </div>
                  <p className="text-xs md:text-sm text-gray-500">Proceso</p>
                  <p className="text-xl md:text-2xl font-bold">
                    {Object.values(userCategories).filter(c => c === "PROCESO").length}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 md:pt-6">
                <div className="text-center">
                  <div className="mx-auto w-10 h-10 md:w-12 md:h-12 bg-orange-100 rounded-full flex items-center justify-center mb-2">
                    <UserCheck className="h-5 w-5 md:h-6 md:w-6 text-orange-600" />
                  </div>
                  <p className="text-xs md:text-sm text-gray-500">Representativo</p>
                  <p className="text-xl md:text-2xl font-bold">
                    {Object.values(userCategories).filter(c => c === "REPRESENTATIVO").length}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Búsqueda y Filtros */}
          <Card>
            <CardContent className="pt-4 md:pt-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="w-full flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filtros Avanzados
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-2">
                      {[searchName, filterCodigo, filterFacultad, filterPrograma].filter(Boolean).length}
                    </Badge>
                  )}
                </span>
                {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>

              {showFilters && (
                <div className="space-y-3 pt-2">
                  <Input
                    placeholder="Código estudiante..."
                    value={filterCodigo}
                    onChange={(e) => setFilterCodigo(e.target.value)}
                  />
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Categoría</label>
                    <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as GroupCategory | "TODOS")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TODOS">Todas las categorías</SelectItem>
                        <SelectItem value="SEMILLERO">Semillero</SelectItem>
                        <SelectItem value="PROCESO">Proceso</SelectItem>
                        <SelectItem value="REPRESENTATIVO">Representativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Combobox
                    options={facultades}
                    value={filterFacultad}
                    onValueChange={setFilterFacultad}
                    placeholder="Todas las facultades"
                    searchPlaceholder="Buscar..."
                    emptyText="No encontrado"
                  />
                  <Combobox
                    options={programas}
                    value={filterPrograma}
                    onValueChange={setFilterPrograma}
                    placeholder="Todos los programas"
                    searchPlaceholder="Buscar..."
                    emptyText="No encontrado"
                  />
                  {hasActiveFilters && (
                    <Button variant="outline" onClick={clearFilters} className="w-full">
                      <X className="h-4 w-4 mr-2" />
                      Limpiar Filtros
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Acciones Rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              onClick={handleMarkAttendance}
              disabled={selectedForAttendance.size === 0 || isMarkingAttendance}
              className="w-full bg-green-600 hover:bg-green-700 h-12 md:h-auto"
            >
              <Calendar className="h-4 w-4 mr-2" />
              {isMarkingAttendance ? "Registrando..." : `Marcar Asistencia (${selectedForAttendance.size})`}
            </Button>

            <Button
              onClick={() => setShowCategoryDialog(true)}
              disabled={selectedForCategory.size === 0}
              variant="outline"
              className="w-full h-12 md:h-auto"
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Asignar Categoría ({selectedForCategory.size})
            </Button>
          </div>

          {/* Seleccionar Todos */}
          <Card>
            <CardContent className="pt-4">
              <Button
                variant="outline"
                onClick={handleSelectAllForAttendance}
                className="w-full"
              >
                {selectedForAttendance.size === filteredUsers.length ? "Deseleccionar Todos" : "Seleccionar Todos"}
              </Button>
            </CardContent>
          </Card>

          {/* Lista de Usuarios - Vista Móvil */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-lg font-semibold">
                Usuarios ({filteredUsers.length})
                {totalPages > 1 && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    Página {currentPage} de {totalPages}
                  </span>
                )}
              </h3>
            </div>

            {paginatedUsers.map((user) => (
              <Card key={user.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Checkboxes */}
                    <div className="flex flex-col gap-2 pt-1">
                      <Checkbox
                        checked={selectedForAttendance.has(user.id)}
                        onCheckedChange={() => handleSelectForAttendance(user.id)}
                      />
                      <Checkbox
                        checked={selectedForCategory.has(user.id)}
                        onCheckedChange={() => handleSelectForCategory(user.id)}
                      />
                    </div>

                    {/* Avatar */}
                    <Avatar className="h-12 w-12 flex-shrink-0">
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-semibold">
                        {getInitials(user.nombres)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm md:text-base truncate">{user.nombres}</h4>
                      <p className="text-xs text-gray-500 truncate">
                        {user.area === 'deporte' && user.codigoEstudiantil 
                          ? user.codigoEstudiantil 
                          : user.codigoEstudiantil || "Sin código"}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mt-2">
                        {userCategories[user.id] && (
                          <Badge
                            className={`text-xs ${
                              userCategories[user.id] === "SEMILLERO"
                                ? "bg-green-100 text-green-800"
                                : userCategories[user.id] === "PROCESO"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-orange-100 text-orange-800"
                            }`}
                          >
                            {userCategories[user.id]}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {attendanceStats[user.id] || 0} asistencias
                        </Badge>
                      </div>

                      {user.programaAcademico && (
                        <p className="text-xs text-gray-600 mt-1 truncate">{user.programaAcademico}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredUsers.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  No se encontraron usuarios
                </CardContent>
              </Card>
            )}

            {/* Paginación */}
            {totalPages > 1 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="flex-1"
                    >
                      Anterior
                    </Button>
                    <div className="text-sm text-gray-600 px-2">
                      {currentPage} / {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="flex-1"
                    >
                      Siguiente
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Top Asistentes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top 5 Asistentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topAttendees.map((item, index) => (
                  <div key={item.user.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.user.nombres}</p>
                      <p className="text-xs text-gray-500">{item.count} asistencias</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog de Categorías */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Asignar Categoría</DialogTitle>
            <DialogDescription>
              Selecciona la categoría para {selectedForCategory.size} usuario(s)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as GroupCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SEMILLERO">Semillero</SelectItem>
                <SelectItem value="PROCESO">Proceso</SelectItem>
                <SelectItem value="REPRESENTATIVO">Representativo</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCategoryDialog(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAssignCategory}
                disabled={isAssigningCategory}
                className="flex-1"
              >
                {isAssigningCategory ? "Asignando..." : "Asignar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

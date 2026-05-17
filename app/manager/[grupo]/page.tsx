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
  ChevronUp,
  Eye,
  Copy,
  Download,
  GitCompareArrows,
  CheckSquare,
} from "lucide-react"
import * as XLSX from "xlsx"
import {
  assignUsersToCategory,
  getGroupCategoriesBatch,
  removeUserFromAllCategories,
} from "@/lib/group-categories"
import { SEDES, ESTAMENTOS } from "@/lib/data"
import { saveAttendanceEntry as saveAttendanceEntryRouter, getGroupAttendanceStats, getGroupEnrolledUsersRouter } from "@/lib/db-router"
import type { UserProfile, GroupCategory } from "@/lib/types"
import type { Area } from "@/lib/firebase-config"
import { formatNombre, sortUsersByNombres } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GroupAttendanceReport } from "@/components/group-attendance-report"

export default function ManagerGroupPage() {
  const params = useParams()
  const router = useRouter()
  const groupName = decodeURIComponent(params.grupo as string)

  const [area, setArea] = useState<Area>("cultura")
  const [allGroups, setAllGroups] = useState<string[]>([])
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
  const [filterSede, setFilterSede] = useState("")
  const [filterEstamento, setFilterEstamento] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 8

  // Selección múltiple
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showOnlySelected, setShowOnlySelected] = useState(false)
  const [isMarkingAttendance, setIsMarkingAttendance] = useState(false)

  // Categorías
  const [selectedCategory, setSelectedCategory] = useState<GroupCategory>("SEMILLERO")
  const [isAssigningCategory, setIsAssigningCategory] = useState(false)
  const [isRemovingCategory, setIsRemovingCategory] = useState(false)
  const [userCategories, setUserCategories] = useState<Record<string, GroupCategory>>({})
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [showCompareDialog, setShowCompareDialog] = useState(false)

  // Estadísticas
  const [attendanceStats, setAttendanceStats] = useState<Record<string, number>>({})
  const [managerDisplayName, setManagerDisplayName] = useState("")

  useEffect(() => {
    const userType = sessionStorage.getItem("userType")
    const userRole = sessionStorage.getItem("userRole")
    const assignedGroup = sessionStorage.getItem("grupoCultural")
    const userArea = sessionStorage.getItem("userArea") as Area
    const storedGroups = sessionStorage.getItem("allGroups")

    console.log("[Manager] Checking authentication...")
    console.log("[Manager] User type:", userType)
    console.log("[Manager] User role:", userRole)
    console.log("[Manager] Assigned group:", assignedGroup)
    console.log("[Manager] User area:", userArea)
    console.log("[Manager] Current group:", groupName)

    if (userType !== "manager" || (userRole !== "DIRECTOR" && userRole !== "MONITOR" && userRole !== "ENTRENADOR")) {
      console.log("[Manager] Invalid user type or role, redirecting to login")
      router.push("/login-manager")
      return
    }

    // Cargar todos los grupos del entrenador
    const groups: string[] = storedGroups ? JSON.parse(storedGroups) : (assignedGroup ? [assignedGroup] : [])
    setAllGroups(groups)

    // Verificar que el grupo actual sea uno de los asignados
    if (!groups.includes(groupName)) {
      console.log("[Manager] Group not in assigned list, redirecting to first group")
      if (groups.length > 0) {
        router.push(`/manager/${encodeURIComponent(groups[0])}`)
      } else {
        router.push("/login-manager")
      }
      return
    }

    const currentArea = userArea || "cultura"
    setArea(currentArea)
    setManagerDisplayName(sessionStorage.getItem("userName") || "")
    loadGroupData(currentArea)
  }, [groupName, router])

  useEffect(() => {
    applyFilters()
  }, [
    searchName,
    filterFacultad,
    filterPrograma,
    filterCodigo,
    filterCategory,
    filterSede,
    filterEstamento,
    showOnlySelected,
    selectedIds,
    enrolledUsers,
    userCategories,
  ])

  async function loadGroupData(currentArea: Area) {
    setLoading(true)
    try {
      console.log("[Manager] Loading group data for area:", currentArea, "group:", groupName)
      
      // Execute all queries in parallel for maximum performance
      const [enrolledUsersList, categories, stats] = await Promise.all([
        // 1. Get users enrolled in this specific group (optimized with batch queries)
        getGroupEnrolledUsersRouter(currentArea, groupName),
        
        // 2. Get all categories for this group in one query
        getGroupCategoriesBatch(groupName),
        
        // 3. Get attendance stats filtered by group (will be set after we have user IDs)
        Promise.resolve({} as Record<string, number>)
      ])
      
      console.log("[Manager] Users enrolled in group:", enrolledUsersList.length)
      setEnrolledUsers(enrolledUsersList)
      setUserCategories(categories)

      // Now get attendance stats with user IDs
      const userIds = enrolledUsersList.map(u => u.id)
      const attendanceStats = await getGroupAttendanceStats(currentArea, groupName, userIds)
      setAttendanceStats(attendanceStats)

      console.log("[Manager] Data loading complete")
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

    if (filterSede) {
      filtered = filtered.filter(u => u.sede === filterSede)
    }

    if (filterEstamento) {
      filtered = filtered.filter(u => u.estamento === filterEstamento)
    }

    if (showOnlySelected) {
      filtered = filtered.filter(u => selectedIds.has(u.id))
    }

    setFilteredUsers(sortUsersByNombres(filtered))
    setCurrentPage(1) // Reset a la primera página cuando se filtran
  }

  const exitSelectionMode = () => {
    setSelectionMode(false)
    setSelectedIds(new Set())
    setShowOnlySelected(false)
  }

  const toggleUserSelection = (userId: string) => {
    const next = new Set(selectedIds)
    if (next.has(userId)) next.delete(userId)
    else next.add(userId)
    setSelectedIds(next)
  }

  const handleSelectAllFiltered = () => {
    const allSelected = filteredUsers.length > 0 && filteredUsers.every(u => selectedIds.has(u.id))
    if (allSelected) {
      const next = new Set(selectedIds)
      filteredUsers.forEach(u => next.delete(u.id))
      setSelectedIds(next)
    } else {
      const next = new Set(selectedIds)
      filteredUsers.forEach(u => next.add(u.id))
      setSelectedIds(next)
    }
  }

  const handleMarkAttendance = async () => {
    if (selectedIds.size === 0) {
      setError("Selecciona al menos un usuario")
      setTimeout(() => setError(null), 3000)
      return
    }

    setIsMarkingAttendance(true)
    try {
      const managerId = sessionStorage.getItem("userId") || ""
      const managerName = sessionStorage.getItem("userName") || ""
      const managerRole = sessionStorage.getItem("userRole") || ""
      const markedBy = { id: managerId, nombre: managerName, role: managerRole }

      const promises = Array.from(selectedIds).map(userId =>
        saveAttendanceEntryRouter(area, userId, groupName, markedBy)
      )
      await Promise.all(promises)

      setSuccess(`Asistencia registrada para ${selectedIds.size} usuario(s)`)
      setSelectedIds(new Set())
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

  const handleAssignCategory = async () => {
    if (selectedIds.size === 0) {
      setError("Selecciona al menos un usuario")
      setTimeout(() => setError(null), 3000)
      return
    }

    setIsAssigningCategory(true)
    try {
      await assignUsersToCategory(Array.from(selectedIds), groupName, selectedCategory)
      setSuccess(`${selectedIds.size} usuario(s) asignado(s) a ${selectedCategory}`)
      setSelectedIds(new Set())
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

  const handleRemoveCategory = async () => {
    if (selectedIds.size === 0) {
      setError("Selecciona al menos un usuario")
      setTimeout(() => setError(null), 3000)
      return
    }

    setIsRemovingCategory(true)
    try {
      await Promise.all(
        Array.from(selectedIds).map(userId =>
          removeUserFromAllCategories(userId, groupName)
        )
      )
      setSuccess(`Categoría removida de ${selectedIds.size} usuario(s)`)
      setSelectedIds(new Set())
      await loadGroupData(area)
      setTimeout(() => setSuccess(null), 3000)
    } catch {
      setError("Error al quitar categoría")
      setTimeout(() => setError(null), 3000)
    } finally {
      setIsRemovingCategory(false)
    }
  }

  const handleCopyNames = async () => {
    if (selectedIds.size === 0) return
    const names = Array.from(selectedIds)
      .map(id => enrolledUsers.find(u => u.id === id))
      .filter(Boolean)
      .map(u => formatNombre(u!.nombres))
      .join("\n")
    await navigator.clipboard.writeText(names)
    setSuccess(`${selectedIds.size} nombre(s) copiado(s)`)
    setTimeout(() => setSuccess(null), 2500)
  }

  const handleExportSelected = () => {
    if (selectedIds.size === 0) return
    const rows = Array.from(selectedIds).map(id => {
      const u = enrolledUsers.find(x => x.id === id)!
      return {
        Nombre: formatNombre(u.nombres),
        Documento: u.numeroDocumento,
        Código: u.codigoEstudiantil || "",
        Categoría: userCategories[id] || "—",
        Asistencias: attendanceStats[id] || 0,
        Sede: u.sede || "",
        Estamento: u.estamento || "",
      }
    })
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Selección")
    XLSX.writeFile(wb, `seleccion_${groupName.replace(/\s+/g, "_")}.xlsx`)
  }

  const compareUsers = Array.from(selectedIds)
    .map(id => {
      const user = enrolledUsers.find(u => u.id === id)
      if (!user) return null
      return {
        user,
        count: attendanceStats[id] || 0,
        category: userCategories[id],
      }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.count - a.count)

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
    setFilterSede("")
    setFilterEstamento("")
  }

  const hasActiveFilters =
    searchName ||
    filterCodigo ||
    filterFacultad ||
    filterPrograma ||
    filterCategory !== "TODOS" ||
    filterSede ||
    filterEstamento

  const allFilteredSelected =
    filteredUsers.length > 0 && filteredUsers.every(u => selectedIds.has(u.id))

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
              {(() => {
                const role = sessionStorage.getItem("userRole")
                const name = sessionStorage.getItem("userName")
                const roleLabel =
                  role === "ENTRENADOR" ? "Entrenador" :
                  role === "DIRECTOR" ? "Director" :
                  role === "MONITOR" ? "Monitor" : role
                return `Bienvenido ${roleLabel} ${name}`
              })()}
            </p>
            {allGroups.length > 1 && (
              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-2 font-medium">Cambiar grupo:</p>
                <div className="flex flex-wrap gap-2">
                  {allGroups.map((g) => (
                    <button
                      key={g}
                      onClick={() => router.push(`/manager/${encodeURIComponent(g)}`)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        g === groupName
                          ? "bg-green-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-700"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
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

          <Tabs defaultValue="gestion" className="w-full">
            <TabsList className="grid w-full max-w-lg grid-cols-2 h-auto p-1">
              <TabsTrigger value="gestion" className="py-2.5">
                Gestión del grupo
              </TabsTrigger>
              <TabsTrigger value="asistencias" className="gap-2 py-2.5">
                <Eye className="h-4 w-4 shrink-0" />
                Ver asistentes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="gestion" className="mt-4 space-y-4 md:space-y-6 outline-none">
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

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sede</label>
                    <Select value={filterSede || "TODOS"} onValueChange={(v) => setFilterSede(v === "TODOS" ? "" : v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas las sedes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TODOS">Todas las sedes</SelectItem>
                        {SEDES.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Estamento</label>
                    <Select
                      value={filterEstamento || "TODOS"}
                      onValueChange={(v) => setFilterEstamento(v === "TODOS" ? "" : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los estamentos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TODOS">Todos los estamentos</SelectItem>
                        {ESTAMENTOS.map((e) => (
                          <SelectItem key={e} value={e}>{e}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

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

          {selectionMode && (
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="pt-4 space-y-3">
                <p className="text-sm font-medium text-green-900">
                  {selectedIds.size} seleccionado(s)
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => setShowCategoryDialog(true)} disabled={selectedIds.size === 0}>
                    <UserCheck className="h-4 w-4 mr-1" />
                    Asignar categoría
                  </Button>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handleMarkAttendance}
                    disabled={selectedIds.size === 0 || isMarkingAttendance}
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    {isMarkingAttendance ? "Registrando..." : "Marcar asistencia"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRemoveCategory}
                    disabled={selectedIds.size === 0 || isRemovingCategory}
                  >
                    Quitar categoría
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleExportSelected} disabled={selectedIds.size === 0}>
                    <Download className="h-4 w-4 mr-1" />
                    Exportar Excel
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCopyNames} disabled={selectedIds.size === 0}>
                    <Copy className="h-4 w-4 mr-1" />
                    Copiar nombres
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowOnlySelected(v => !v)}
                    disabled={selectedIds.size === 0}
                  >
                    {showOnlySelected ? "Ver todos" : "Ver solo seleccionados"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowCompareDialog(true)}
                    disabled={selectedIds.size < 2}
                  >
                    <GitCompareArrows className="h-4 w-4 mr-1" />
                    Comparar asistencias
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleSelectAllFiltered}>
                    <CheckSquare className="h-4 w-4 mr-1" />
                    {allFilteredSelected ? "Deseleccionar todos" : "Seleccionar todos"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de Usuarios */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 px-2 flex-wrap">
              <h3 className="text-lg font-semibold">
                Usuarios ({filteredUsers.length})
                {totalPages > 1 && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    Página {currentPage} de {totalPages}
                  </span>
                )}
              </h3>
              <Button
                variant={selectionMode ? "secondary" : "outline"}
                size="sm"
                onClick={() => {
                  if (selectionMode) exitSelectionMode()
                  else setSelectionMode(true)
                }}
              >
                {selectionMode ? "Cancelar selección" : "Seleccionar"}
              </Button>
            </div>

            {paginatedUsers.map((user) => (
              <Card key={user.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {selectionMode && (
                      <div className="pt-1">
                        <Checkbox
                          checked={selectedIds.has(user.id)}
                          onCheckedChange={() => toggleUserSelection(user.id)}
                        />
                      </div>
                    )}

                    {/* Avatar */}
                    <Avatar className="h-12 w-12 flex-shrink-0">
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-semibold">
                        {getInitials(user.nombres)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm md:text-base truncate">{formatNombre(user.nombres)}</h4>
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
                      <p className="font-medium text-sm truncate">{formatNombre(item.user.nombres)}</p>
                      <p className="text-xs text-gray-500">{item.count} asistencias</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
            </TabsContent>

            <TabsContent value="asistencias" className="mt-4 outline-none">
              <GroupAttendanceReport
                groupName={groupName}
                area={area}
                backLink={null}
                userCategories={userCategories}
                managerDisplayName={managerDisplayName}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={showCompareDialog} onOpenChange={setShowCompareDialog}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Comparar asistencias</DialogTitle>
            <DialogDescription>
              Comparación de {compareUsers.length} participante(s) seleccionado(s)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {compareUsers.map((item, index) => {
              const maxCount = compareUsers[0]?.count || 1
              const widthPct = maxCount > 0 ? Math.round((item.count / maxCount) * 100) : 0
              return (
                <div key={item.user.id} className="p-3 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {index + 1}. {formatNombre(item.user.nombres)}
                      </p>
                      {item.category && (
                        <p className="text-xs text-gray-500">{item.category}</p>
                      )}
                    </div>
                    <span className="font-bold text-green-700 shrink-0">{item.count}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-600 rounded-full transition-all"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Categorías */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Asignar Categoría</DialogTitle>
            <DialogDescription>
              Selecciona la categoría para {selectedIds.size} usuario(s)
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

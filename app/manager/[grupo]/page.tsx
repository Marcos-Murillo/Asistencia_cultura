"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  Search,
  UserCheck
} from "lucide-react"
import { getGroupEnrolledUsers as getGroupEnrollments, saveAttendanceEntry } from "@/lib/firestore"
import { assignUsersToCategory, getUserCategory } from "@/lib/group-categories"
import { getAttendanceRecords } from "@/lib/storage"
import type { UserProfile, GroupCategory, AttendanceRecord } from "@/lib/types"

export default function ManagerGroupPage() {
  const params = useParams()
  const router = useRouter()
  const groupName = decodeURIComponent(params.grupo as string)

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

  // Asistencia
  const [selectedForAttendance, setSelectedForAttendance] = useState<Set<string>>(new Set())
  const [isMarkingAttendance, setIsMarkingAttendance] = useState(false)

  // Categorías
  const [selectedForCategory, setSelectedForCategory] = useState<Set<string>>(new Set())
  const [selectedCategory, setSelectedCategory] = useState<GroupCategory>("SEMILLERO")
  const [isAssigningCategory, setIsAssigningCategory] = useState(false)
  const [userCategories, setUserCategories] = useState<Record<string, GroupCategory>>({})

  // Estadísticas
  const [attendanceStats, setAttendanceStats] = useState<Record<string, number>>({})

  useEffect(() => {
    // Verificar autenticación
    const userType = sessionStorage.getItem("userType")
    const userRole = sessionStorage.getItem("userRole")
    const assignedGroup = sessionStorage.getItem("grupoCultural")

    if (userType !== "manager" || (userRole !== "DIRECTOR" && userRole !== "MONITOR")) {
      router.push("/login-manager")
      return
    }

    if (assignedGroup !== groupName) {
      router.push("/login-manager")
      return
    }

    loadGroupData()
  }, [groupName, router])

  useEffect(() => {
    applyFilters()
  }, [searchName, filterFacultad, filterPrograma, filterCodigo, enrolledUsers])

  async function loadGroupData() {
    setLoading(true)
    try {
      // Cargar usuarios inscritos
      const enrollments = await getGroupEnrollments(groupName)
      setEnrolledUsers(enrollments)

      // Cargar categorías de usuarios
      const categories: Record<string, GroupCategory> = {}
      for (const user of enrollments) {
        const category = await getUserCategory(user.id, groupName)
        if (category) {
          categories[user.id] = category
        }
      }
      setUserCategories(categories)

      // Cargar estadísticas de asistencia
      const allAttendances = await getAttendanceRecords()
      const stats: Record<string, number> = {}
      
      enrollments.forEach(user => {
        const userAttendances = allAttendances.filter(
          a => a.numeroDocumento === user.numeroDocumento && a.grupoCultural === groupName
        )
        stats[user.id] = userAttendances.length
      })
      setAttendanceStats(stats)

    } catch (err) {
      console.error("Error loading group data:", err)
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
        u.codigoEstudiante?.includes(filterCodigo)
      )
    }

    if (filterFacultad) {
      filtered = filtered.filter(u => u.facultad === filterFacultad)
    }

    if (filterPrograma) {
      filtered = filtered.filter(u => u.programaAcademico === filterPrograma)
    }

    setFilteredUsers(filtered)
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
    if (selectedForAttendance.size === filteredUsers.length) {
      setSelectedForAttendance(new Set())
    } else {
      setSelectedForAttendance(new Set(filteredUsers.map(u => u.id)))
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
      const promises = Array.from(selectedForAttendance).map(userId =>
        saveAttendanceEntry(userId, groupName)
      )
      await Promise.all(promises)

      setSuccess(`Asistencia registrada para ${selectedForAttendance.size} usuario(s)`)
      setSelectedForAttendance(new Set())
      await loadGroupData()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
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
      await loadGroupData()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError("Error al asignar categoría")
      setTimeout(() => setError(null), 3000)
    } finally {
      setIsAssigningCategory(false)
    }
  }

  // Opciones para filtros
  const facultades: ComboboxOption[] = Array.from(new Set(enrolledUsers.map(u => u.facultad).filter(Boolean)))
    .map(f => ({ value: f!, label: f! }))
    .sort((a, b) => a.label.localeCompare(b.label))

  const programas: ComboboxOption[] = Array.from(new Set(enrolledUsers.map(u => u.programaAcademico).filter(Boolean)))
    .map(p => ({ value: p!, label: p! }))
    .sort((a, b) => a.label.localeCompare(b.label))

  // Top asistentes
  const topAttendees = enrolledUsers
    .map(u => ({ user: u, count: attendanceStats[u.id] || 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{groupName}</h1>
            <p className="text-gray-600 mt-1">Panel de Gestión - {sessionStorage.getItem("userRole")}</p>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Inscritos</p>
                    <p className="text-2xl font-bold">{enrolledUsers.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <UserCheck className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Semillero</p>
                    <p className="text-2xl font-bold">
                      {Object.values(userCategories).filter(c => c === "SEMILLERO").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <UserCheck className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Proceso</p>
                    <p className="text-2xl font-bold">
                      {Object.values(userCategories).filter(c => c === "PROCESO").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <UserCheck className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Representativo</p>
                    <p className="text-2xl font-bold">
                      {Object.values(userCategories).filter(c => c === "REPRESENTATIVO").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tabla Principal */}
            <div className="lg:col-span-2 space-y-4">
              {/* Filtros */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Filtros
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Buscar por nombre</label>
                      <Input
                        placeholder="Nombre del estudiante..."
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Código</label>
                      <Input
                        placeholder="Código estudiante..."
                        value={filterCodigo}
                        onChange={(e) => setFilterCodigo(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Facultad</label>
                      <Combobox
                        options={facultades}
                        value={filterFacultad}
                        onValueChange={setFilterFacultad}
                        placeholder="Todas"
                        searchPlaceholder="Buscar..."
                        emptyText="No encontrado"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Programa</label>
                      <Combobox
                        options={programas}
                        value={filterPrograma}
                        onValueChange={setFilterPrograma}
                        placeholder="Todos"
                        searchPlaceholder="Buscar..."
                        emptyText="No encontrado"
                      />
                    </div>
                  </div>
                  {(searchName || filterCodigo || filterFacultad || filterPrograma) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchName("")
                        setFilterCodigo("")
                        setFilterFacultad("")
                        setFilterPrograma("")
                      }}
                    >
                      Limpiar Filtros
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Acciones */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Marcar Asistencia */}
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={handleMarkAttendance}
                      disabled={selectedForAttendance.size === 0 || isMarkingAttendance}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      {isMarkingAttendance ? "Registrando..." : `Marcar Asistencia (${selectedForAttendance.size})`}
                    </Button>
                  </div>

                  {/* Asignar Categoría */}
                  <div className="flex items-center gap-3">
                    <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as GroupCategory)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SEMILLERO">Semillero</SelectItem>
                        <SelectItem value="PROCESO">Proceso</SelectItem>
                        <SelectItem value="REPRESENTATIVO">Representativo</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleAssignCategory}
                      disabled={selectedForCategory.size === 0 || isAssigningCategory}
                      variant="outline"
                    >
                      {isAssigningCategory ? "Asignando..." : `Asignar a ${selectedForCategory.size} usuario(s)`}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Tabla de Usuarios */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>Usuarios Inscritos ({filteredUsers.length})</span>
                    <Button variant="outline" size="sm" onClick={handleSelectAllForAttendance}>
                      {selectedForAttendance.size === filteredUsers.length ? "Deseleccionar Todos" : "Seleccionar Todos"}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">Asist.</TableHead>
                          <TableHead className="w-12">Cat.</TableHead>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Código</TableHead>
                          <TableHead>Programa</TableHead>
                          <TableHead>Categoría</TableHead>
                          <TableHead className="text-center">Asistencias</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedForAttendance.has(user.id)}
                                onCheckedChange={() => handleSelectForAttendance(user.id)}
                              />
                            </TableCell>
                            <TableCell>
                              <Checkbox
                                checked={selectedForCategory.has(user.id)}
                                onCheckedChange={() => handleSelectForCategory(user.id)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{user.nombres}</TableCell>
                            <TableCell>{user.codigoEstudiante || "N/A"}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{user.programaAcademico || "N/A"}</TableCell>
                            <TableCell>
                              {userCategories[user.id] ? (
                                <Badge
                                  className={
                                    userCategories[user.id] === "SEMILLERO"
                                      ? "bg-green-100 text-green-800"
                                      : userCategories[user.id] === "PROCESO"
                                      ? "bg-purple-100 text-purple-800"
                                      : "bg-orange-100 text-orange-800"
                                  }
                                >
                                  {userCategories[user.id]}
                                </Badge>
                              ) : (
                                <span className="text-sm text-gray-400">Sin asignar</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary">{attendanceStats[user.id] || 0}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Panel Lateral - Top Asistentes */}
            <div>
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
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.user.nombres}</p>
                          <p className="text-sm text-gray-500">{item.count} asistencias</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

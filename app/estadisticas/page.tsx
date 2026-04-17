"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Users, GraduationCap, Building2, Calendar, User, FileText, ChevronDown, ChevronUp, Filter, X } from "lucide-react"
import { FACULTADES, PROGRAMAS_POR_FACULTAD, ESTAMENTOS } from "@/lib/data"
import { getAllCulturalGroups } from "@/lib/db-router"
import { GRUPOS_DEPORTIVOS } from "@/lib/deporte-groups"
import Link from "next/link"
import { GroupTrackingTable } from "@/components/group-tracking-table"
import AttendanceFilters, { type FilterState } from "@/components/attendance-filters"
import { getAttendanceRecords as getAttendanceRecordsRouter, getEventAttendanceRecordsRouter, getRealEventAttendanceRecords } from "@/lib/db-router"
import { generateEventStats } from "@/lib/event-stats"
import type { AttendanceStats, AttendanceRecord, EventStats, EventAttendanceEntry, UserProfile, UserRole } from "@/lib/types"
import { generatePDFReport } from "@/lib/pdf-generator"
import { useArea } from "@/contexts/area-context"
import { getRolePermissions, filterAttendanceByAssignment, type RolePermissions } from "@/lib/role-manager"
import { getCurrentUserRole, getAssignedGroups } from "@/lib/auth-helpers"
import { formatNombre } from "@/lib/utils"

// Helper function to generate stats from records — fuera del componente para evitar re-renders
function generateStatsFromRecords(records: AttendanceRecord[]): AttendanceStats {
  const stats: AttendanceStats = {
    totalParticipants: records.length,
    byGender: { mujer: 0, hombre: 0, otro: 0 },
    byProgram: {},
    byFaculty: {},
    byCulturalGroup: {},
    byMonth: {},
  }

  records.forEach((record) => {
    const gender = record.genero.toLowerCase() as "mujer" | "hombre" | "otro"
    stats.byGender[gender]++

    if (record.programaAcademico) {
      if (!stats.byProgram[record.programaAcademico]) {
        stats.byProgram[record.programaAcademico] = { mujer: 0, hombre: 0, otro: 0, total: 0 }
      }
      stats.byProgram[record.programaAcademico][gender]++
      stats.byProgram[record.programaAcademico].total++
    }

    if (record.facultad) {
      if (!stats.byFaculty[record.facultad]) {
        stats.byFaculty[record.facultad] = { mujer: 0, hombre: 0, otro: 0, total: 0 }
      }
      stats.byFaculty[record.facultad][gender]++
      stats.byFaculty[record.facultad].total++
    }

    if (!stats.byCulturalGroup[record.grupoCultural]) {
      stats.byCulturalGroup[record.grupoCultural] = 0
    }
    stats.byCulturalGroup[record.grupoCultural]++

    const monthKey = record.timestamp.toISOString().slice(0, 7)
    if (!stats.byMonth[monthKey]) stats.byMonth[monthKey] = {}
    if (!stats.byMonth[monthKey][record.grupoCultural]) stats.byMonth[monthKey][record.grupoCultural] = 0
    stats.byMonth[monthKey][record.grupoCultural]++
  })

  return stats
}

export default function EstadisticasPage() {
  const { area } = useArea()
  const [stats, setStats] = useState<AttendanceStats | null>(null)
  const [eventStats, setEventStats] = useState<EventStats | null>(null)
  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [hasActiveFilters, setHasActiveFilters] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [allAttendanceRecords, setAllAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [allEventRecords, setAllEventRecords] = useState<{ entry: EventAttendanceEntry; user: UserProfile; eventName: string }[]>([])
  const [allRealEventRecords, setAllRealEventRecords] = useState<{ entry: EventAttendanceEntry; user: UserProfile; eventName: string }[]>([])
  const [realEventStats, setRealEventStats] = useState<EventStats | null>(null)
  const [isProgramTableOpen, setIsProgramTableOpen] = useState(false)
  const [isFacultyTableOpen, setIsFacultyTableOpen] = useState(false)
  const [isEventProgramTableOpen, setIsEventProgramTableOpen] = useState(false)
  const [isEventFacultyTableOpen, setIsEventFacultyTableOpen] = useState(false)
  const [isRealEventProgramTableOpen, setIsRealEventProgramTableOpen] = useState(false)
  const [isRealEventFacultyTableOpen, setIsRealEventFacultyTableOpen] = useState(false)
  const [currentUserPermissions, setCurrentUserPermissions] = useState<RolePermissions | null>(null)
  const [grupos, setGrupos] = useState<string[]>([])

  // Filtros tabla por programa
  const [progFacultad, setProgFacultad] = useState("all")
  const [progFechaDesde, setProgFechaDesde] = useState("")
  const [progFechaHasta, setProgFechaHasta] = useState("")
  const [progEstamento, setProgEstamento] = useState("all")
  const [progGrupo, setProgGrupo] = useState("all")

  // Filtros tabla por facultad
  const [facFechaDesde, setFacFechaDesde] = useState("")
  const [facFechaHasta, setFacFechaHasta] = useState("")
  const [facEstamento, setFacEstamento] = useState("all")
  const [facGrupo, setFacGrupo] = useState("all")

  // Set up user permissions
  useEffect(() => {
    const userRole = getCurrentUserRole()
    const assignedGroups = getAssignedGroups()
    
    // Get user permissions based on role and assigned groups
    const permissions = getRolePermissions(userRole, area, assignedGroups)
    setCurrentUserPermissions(permissions)
    
    console.log("[Estadisticas] User role:", userRole, "Area:", area, "Assigned groups:", assignedGroups)
    console.log("[Estadisticas] Permissions:", permissions)
  }, [area])

  useEffect(() => {
    const loadData = async () => {
      if (!currentUserPermissions) {
        console.log("[Estadisticas] Waiting for permissions...")
        return
      }

      setLoading(true)
      try {
        console.log("[Estadisticas] ========== LOADING DATA ==========")
        console.log("[Estadisticas] Area:", area)
        console.log("[Estadisticas] Permissions:", currentUserPermissions)
        console.log("[Estadisticas] Timestamp:", new Date().toISOString())
        
        // Load attendance records from area-aware db-router
        const records = await getAttendanceRecordsRouter(area)
        console.log("[Estadisticas] ✓ Loaded", records.length, "attendance records from", area)
        console.log("[Estadisticas] Sample records:", records.slice(0, 2))
        
        // Apply role-based filtering to attendance records
        let filteredAttendanceRecords = records
        if (!currentUserPermissions.canViewAllGroups) {
          console.log("[Estadisticas] ⚠️ Applying role-based filtering")
          console.log("[Estadisticas] Permissions:", currentUserPermissions)
          filteredAttendanceRecords = filterAttendanceByAssignment(records, currentUserPermissions)
          console.log("[Estadisticas] ✓ Filtered to", filteredAttendanceRecords.length, "attendance records")
        } else {
          console.log("[Estadisticas] ✓ User can view all groups, no filtering applied")
        }

        // Load event records from area-aware db-router
        const eventRecordsData = await getEventAttendanceRecordsRouter(area)
        console.log("[Estadisticas] Loaded", eventRecordsData.length, "event records from area:", area)

        // Load real event records
        const realEventRecordsData = await getRealEventAttendanceRecords(area)
        console.log("[Estadisticas] Loaded", realEventRecordsData.length, "real event records from area:", area)

        setAllAttendanceRecords(filteredAttendanceRecords)
        setAllEventRecords(eventRecordsData)
        setAllRealEventRecords(realEventRecordsData)
        setAllRecords(filteredAttendanceRecords)

        // Generate stats from filtered records
        const calculatedStats = generateStatsFromRecords(filteredAttendanceRecords)
        setStats(calculatedStats)
        console.log("[Estadisticas] Stats generated:", calculatedStats.totalParticipants, "participants")

        const calculatedEventStats = generateEventStats(eventRecordsData)
        setEventStats(calculatedEventStats)

        const calculatedRealEventStats = generateEventStats(realEventRecordsData)
        setRealEventStats(calculatedRealEventStats)
        
        console.log("[Estadisticas] ========== DATA LOADED SUCCESSFULLY ==========")
      } catch (error) {
        console.error("[Estadisticas] ========== ERROR LOADING DATA ==========")
        console.error("[Estadisticas] Error:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [area, currentUserPermissions])

  // Load grupos for filter dropdowns
  useEffect(() => {
    if (area === 'deporte') {
      setGrupos([...GRUPOS_DEPORTIVOS].sort())
    } else {
      getAllCulturalGroups(area)
        .then(gs => setGrupos(gs.filter(g => g.activo).map(g => g.nombre).sort()))
        .catch(() => {})
    }
  }, [area])

  // Filtered records for program table
  const filteredProgRecords = useMemo(() => {
    if (!allRecords.length) return allRecords
    return allRecords.filter(r => {
      if (progFacultad !== "all" && r.facultad !== progFacultad) return false
      if (progEstamento !== "all" && r.estamento !== progEstamento) return false
      if (progGrupo !== "all" && r.grupoCultural !== progGrupo) return false
      if (progFechaDesde) {
        const desde = new Date(progFechaDesde)
        if (new Date(r.timestamp) < desde) return false
      }
      if (progFechaHasta) {
        const hasta = new Date(progFechaHasta)
        hasta.setHours(23, 59, 59)
        if (new Date(r.timestamp) > hasta) return false
      }
      return true
    })
  }, [allRecords, progFacultad, progEstamento, progGrupo, progFechaDesde, progFechaHasta])

  // Filtered records for faculty table
  const filteredFacRecords = useMemo(() => {
    if (!allRecords.length) return allRecords
    return allRecords.filter(r => {
      if (facEstamento !== "all" && r.estamento !== facEstamento) return false
      if (facGrupo !== "all" && r.grupoCultural !== facGrupo) return false
      if (facFechaDesde) {
        const desde = new Date(facFechaDesde)
        if (new Date(r.timestamp) < desde) return false
      }
      if (facFechaHasta) {
        const hasta = new Date(facFechaHasta)
        hasta.setHours(23, 59, 59)
        if (new Date(r.timestamp) > hasta) return false
      }
      return true
    })
  }, [allRecords, facEstamento, facGrupo, facFechaDesde, facFechaHasta])

  const progStats = useMemo(() => generateStatsFromRecords(filteredProgRecords), [filteredProgRecords])
  const facStats = useMemo(() => generateStatsFromRecords(filteredFacRecords), [filteredFacRecords])

  const handleFiltersChange = (filters: FilterState) => {
    let filtered = allRecords
    let isFiltering = false

    const uniqueUsers = new Set<string>()
    const uniqueRecords: AttendanceRecord[] = []

    if (filters.nombre.trim()) {
      const searchTerm = filters.nombre.toLowerCase().trim()
      filtered = filtered.filter((record) => record.nombres.toLowerCase().includes(searchTerm))
      isFiltering = true
    }

    if (filters.facultad && filters.facultad !== "defaultFacultad") {
      filtered = filtered.filter((record) => record.facultad === filters.facultad)
      isFiltering = true
    }

    if (filters.programa && filters.programa !== "defaultPrograma") {
      filtered = filtered.filter((record) => record.programaAcademico === filters.programa)
      isFiltering = true
    }

    if (filters.grupoCultural && filters.grupoCultural !== "defaultGrupoCultural") {
      filtered = filtered.filter((record) => record.grupoCultural === filters.grupoCultural)
      isFiltering = true
    }

    filtered.forEach((record) => {
      const userId = `${record.numeroDocumento}-${record.grupoCultural}`
      if (!uniqueUsers.has(userId)) {
        uniqueUsers.add(userId)
        uniqueRecords.push(record)
      }
    })

    setFilteredRecords(uniqueRecords)
    setHasActiveFilters(isFiltering)
  }

  const handleGeneratePDF = async () => {
    if (!stats) return

    setIsGeneratingPDF(true)
    try {
      console.log("[Estadisticas] ========== GENERATING PDF ==========")
      console.log("[Estadisticas] Area:", area)
      console.log("[Estadisticas] Attendance records:", allAttendanceRecords.length)
      console.log("[Estadisticas] Event records:", allEventRecords.length)
      console.log("[Estadisticas] Stats total participants:", stats.totalParticipants)
      console.log("[Estadisticas] Event stats total:", eventStats?.totalParticipants || 0)
      console.log("[Estadisticas] Sample attendance record:", allAttendanceRecords[0])
      console.log("[Estadisticas] Sample event record:", allEventRecords[0])
      
      await generatePDFReport(stats, allAttendanceRecords, allEventRecords, area, eventStats || undefined, allRealEventRecords, realEventStats || undefined)
    } catch (error) {
      console.error("[Estadisticas] Error generating PDF:", error)
      alert("Error al generar el reporte PDF. Por favor intenta nuevamente.")
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-lg text-gray-600">Cargando estadísticas...</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-lg text-gray-600">Error al cargar las estadísticas</div>
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Estadísticas de Asistencia</h1>
              <p className="text-gray-600 mt-1">Grupos {area === 'deporte' ? 'Deportivos' : 'Culturales'} - Universidad del Valle</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                onClick={handleGeneratePDF}
                disabled={isGeneratingPDF}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
              >
                {isGeneratingPDF ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Generar Reporte PDF
                  </>
                )}
              </Button>
              <Link href="/" className="w-full sm:w-auto">
                <button className="w-full flex items-center justify-center gap-2 bg-transparent border border-gray-300 rounded px-4 py-2 text-gray-600 hover:bg-gray-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4"
                  >
                    <path d="M19 12H5M12 19l-7-7m7 7l7-7"></path>
                  </svg>
                  Volver al Registro
                </button>
              </Link>
            </div>
          </div>

          <AttendanceFilters onFiltersChange={handleFiltersChange} attendanceCount={filteredRecords.length} area={area} />

          {hasActiveFilters && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Lista de Asistencias
                </CardTitle>
                <CardDescription>
                  Mostrando {filteredRecords.length} de {allRecords.length} asistencias
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredRecords.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre Completo</TableHead>
                          <TableHead>Género</TableHead>
                          <TableHead>Estamento</TableHead>
                          <TableHead>Facultad</TableHead>
                          <TableHead>Programa</TableHead>
                          <TableHead>Grupo {area === 'deporte' ? 'Deportivo' : 'Cultural'}</TableHead>
                          <TableHead>Fecha</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRecords
                          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                          .map((record) => (
                            <TableRow key={record.id}>
                              <TableCell className="font-medium">
                                {formatNombre(record.nombres)} 
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    record.genero === "MUJER"
                                      ? "bg-pink-100 text-pink-800"
                                      : record.genero === "HOMBRE"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-purple-100 text-purple-800"
                                  }
                                >
                                  {record.genero}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">{record.estamento}</Badge>
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate">{record.facultad || "N/A"}</TableCell>
                              <TableCell className="max-w-[250px] truncate">
                                {record.programaAcademico || "N/A"}
                              </TableCell>
                              <TableCell className="max-w-[300px] truncate">{record.grupoCultural}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(record.timestamp).toLocaleDateString("es-CO")}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No se encontraron registros con los filtros aplicados
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Participantes</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalParticipants}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-pink-500 rounded-full" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Mujeres</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.byGender.mujer}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-blue-500 rounded-full" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Hombres</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.byGender.hombre}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-purple-500 rounded-full" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Otro</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.byGender.otro}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Collapsible open={isProgramTableOpen} onOpenChange={setIsProgramTableOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="w-5 h-5" />
                        Asistencias por Programa Académico
                      </CardTitle>
                      <CardDescription>Distribución de participantes por programa académico y género</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm">
                      {isProgramTableOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </Button>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  {/* Filtros */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4 p-3 bg-gray-50 rounded-lg border">
                    <div className="space-y-1">
                      <Label className="text-xs">Facultad</Label>
                      <Select value={progFacultad} onValueChange={setProgFacultad}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Todas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas las facultades</SelectItem>
                          {FACULTADES.map(f => <SelectItem key={f} value={f}>{f.replace("FACULTAD DE ", "")}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Grupo {area === 'deporte' ? 'Deportivo' : 'Cultural'}</Label>
                      <Select value={progGrupo} onValueChange={setProgGrupo}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos los grupos</SelectItem>
                          {grupos.map(g => <SelectItem key={g} value={g}>{g.length > 40 ? g.slice(0, 40) + "…" : g}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Estamento</Label>
                      <Select value={progEstamento} onValueChange={setProgEstamento}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          {ESTAMENTOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Rango de fechas</Label>
                      <div className="flex gap-1">
                        <Input type="date" value={progFechaDesde} onChange={e => setProgFechaDesde(e.target.value)} className="h-8 text-xs" />
                        <Input type="date" value={progFechaHasta} onChange={e => setProgFechaHasta(e.target.value)} className="h-8 text-xs" />
                      </div>
                    </div>
                    {(progFacultad !== "all" || progGrupo !== "all" || progEstamento !== "all" || progFechaDesde || progFechaHasta) && (
                      <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{filteredProgRecords.length} registros filtrados</span>
                        <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => { setProgFacultad("all"); setProgGrupo("all"); setProgEstamento("all"); setProgFechaDesde(""); setProgFechaHasta("") }}>
                          <X className="h-3 w-3 mr-1" /> Limpiar
                        </Button>
                      </div>
                    )}
                  </div>

                  {Object.keys(progStats.byProgram).length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[300px]">Programa Académico</TableHead>
                            <TableHead className="text-center">Mujer</TableHead>
                            <TableHead className="text-center">Hombre</TableHead>
                            <TableHead className="text-center">Otro</TableHead>
                            <TableHead className="text-center font-semibold">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(progStats.byProgram)
                            .sort(([, a], [, b]) => b.total - a.total)
                            .map(([programa, data]) => (
                              <TableRow key={programa}>
                                <TableCell className="font-medium">{programa}</TableCell>
                                <TableCell className="text-center"><Badge variant="secondary" className="bg-pink-100 text-pink-800">{data.mujer}</Badge></TableCell>
                                <TableCell className="text-center"><Badge variant="secondary" className="bg-blue-100 text-blue-800">{data.hombre}</Badge></TableCell>
                                <TableCell className="text-center"><Badge variant="secondary" className="bg-purple-100 text-purple-800">{data.otro}</Badge></TableCell>
                                <TableCell className="text-center"><Badge variant="default" className="bg-gray-800 text-white">{data.total}</Badge></TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">No hay datos de programas académicos disponibles</div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          <Collapsible open={isFacultyTableOpen} onOpenChange={setIsFacultyTableOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        Asistencias por Facultad
                      </CardTitle>
                      <CardDescription>Distribución de participantes por facultad y género</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm">
                      {isFacultyTableOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </Button>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  {/* Filtros */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4 p-3 bg-gray-50 rounded-lg border">
                    <div className="space-y-1">
                      <Label className="text-xs">Grupo {area === 'deporte' ? 'Deportivo' : 'Cultural'}</Label>
                      <Select value={facGrupo} onValueChange={setFacGrupo}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos los grupos</SelectItem>
                          {grupos.map(g => <SelectItem key={g} value={g}>{g.length > 40 ? g.slice(0, 40) + "…" : g}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Estamento</Label>
                      <Select value={facEstamento} onValueChange={setFacEstamento}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          {ESTAMENTOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Rango de fechas</Label>
                      <div className="flex gap-1">
                        <Input type="date" value={facFechaDesde} onChange={e => setFacFechaDesde(e.target.value)} className="h-8 text-xs" />
                        <Input type="date" value={facFechaHasta} onChange={e => setFacFechaHasta(e.target.value)} className="h-8 text-xs" />
                      </div>
                    </div>
                    {(facGrupo !== "all" || facEstamento !== "all" || facFechaDesde || facFechaHasta) && (
                      <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{filteredFacRecords.length} registros filtrados</span>
                        <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => { setFacGrupo("all"); setFacEstamento("all"); setFacFechaDesde(""); setFacFechaHasta("") }}>
                          <X className="h-3 w-3 mr-1" /> Limpiar
                        </Button>
                      </div>
                    )}
                  </div>

                  {Object.keys(facStats.byFaculty).length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[300px]">Facultad</TableHead>
                            <TableHead className="text-center">Mujer</TableHead>
                            <TableHead className="text-center">Hombre</TableHead>
                            <TableHead className="text-center">Otro</TableHead>
                            <TableHead className="text-center font-semibold">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(facStats.byFaculty)
                            .sort(([, a], [, b]) => b.total - a.total)
                            .map(([facultad, data]) => (
                              <TableRow key={facultad}>
                                <TableCell className="font-medium">{facultad}</TableCell>
                                <TableCell className="text-center"><Badge variant="secondary" className="bg-pink-100 text-pink-800">{data.mujer}</Badge></TableCell>
                                <TableCell className="text-center"><Badge variant="secondary" className="bg-blue-100 text-blue-800">{data.hombre}</Badge></TableCell>
                                <TableCell className="text-center"><Badge variant="secondary" className="bg-purple-100 text-purple-800">{data.otro}</Badge></TableCell>
                                <TableCell className="text-center"><Badge variant="default" className="bg-gray-800 text-white">{data.total}</Badge></TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">No hay datos de facultades disponibles</div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* ── CONVOCATORIAS ── */}
          <GroupTrackingTable />
        </div>
      </div>
    </div>
  )
}

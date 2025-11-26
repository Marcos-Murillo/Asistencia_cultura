"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, GraduationCap, Building2, Calendar, User, FileText } from "lucide-react"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { GroupTrackingComponent } from "@/components/group-traking"
import AttendanceFilters, { type FilterState } from "@/components/attendance-filters"
import { generateStats, getAttendanceRecords } from "@/lib/storage"
import { getEventAttendanceRecords } from "@/lib/event-storage"
import { generateEventStats } from "@/lib/event-stats"
import type { AttendanceStats, AttendanceRecord, EventStats, EventAttendanceEntry, UserProfile } from "@/lib/types"
import { generatePDFReport } from "@/lib/pdf-generator"

export default function EstadisticasPage() {
  const [stats, setStats] = useState<AttendanceStats | null>(null)
  const [eventStats, setEventStats] = useState<EventStats | null>(null)
  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [hasActiveFilters, setHasActiveFilters] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [allAttendanceRecords, setAllAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [allEventRecords, setAllEventRecords] = useState<{ entry: EventAttendanceEntry; user: UserProfile }[]>([])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const records = await getAttendanceRecords()
        const eventRecordsData = await getEventAttendanceRecords()

        setAllAttendanceRecords(records)
        setAllEventRecords(eventRecordsData)
        setAllRecords(records)

        const calculatedStats = await generateStats()
        setStats(calculatedStats)

        const calculatedEventStats = generateEventStats(eventRecordsData)
        setEventStats(calculatedEventStats)
      } catch (error) {
        console.error("[v0] Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

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
      await generatePDFReport(stats, allAttendanceRecords, allEventRecords, eventStats || undefined)
    } catch (error) {
      console.error("[v0] Error generating PDF:", error)
      alert("Error al generar el reporte PDF. Por favor intenta nuevamente.")
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Navigation />
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
        <Navigation />
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
      <Navigation />
      <div className="p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Estadísticas de Asistencia</h1>
              <p className="text-gray-600 mt-1">Grupos Culturales - Universidad del Valle</p>
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

          <AttendanceFilters onFiltersChange={handleFiltersChange} attendanceCount={filteredRecords.length} />

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
                          <TableHead>Grupo Cultural</TableHead>
                          <TableHead>Fecha</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRecords
                          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                          .map((record) => (
                            <TableRow key={record.id}>
                              <TableCell className="font-medium">
                                {record.nombres} 
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Asistencias por Programa Académico
              </CardTitle>
              <CardDescription>Distribución de participantes por programa académico y género</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(stats.byProgram).length > 0 ? (
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
                      {Object.entries(stats.byProgram)
                        .sort(([, a], [, b]) => b.total - a.total)
                        .map(([programa, data]) => (
                          <TableRow key={programa}>
                            <TableCell className="font-medium">{programa}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className="bg-pink-100 text-pink-800">
                                {data.mujer}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                {data.hombre}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                                {data.otro}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="default" className="bg-gray-800 text-white">
                                {data.total}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No hay datos de programas académicos disponibles</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Asistencias por Facultad
              </CardTitle>
              <CardDescription>Distribución de participantes por facultad y género</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(stats.byFaculty).length > 0 ? (
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
                      {Object.entries(stats.byFaculty)
                        .sort(([, a], [, b]) => b.total - a.total)
                        .map(([facultad, data]) => (
                          <TableRow key={facultad}>
                            <TableCell className="font-medium">{facultad}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className="bg-pink-100 text-pink-800">
                                {data.mujer}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                {data.hombre}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                                {data.otro}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="default" className="bg-gray-800 text-white">
                                {data.total}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No hay datos de facultades disponibles</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumen por Grupo Cultural</CardTitle>
              <CardDescription>Número total de asistentes por grupo cultural</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(stats.byCulturalGroup).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(stats.byCulturalGroup)
                    .sort(([, a], [, b]) => b - a)
                    .map(([grupo, count]) => (
                      <div key={grupo} className="p-4 bg-white rounded-lg border">
                        <h4 className="font-medium text-sm text-gray-900 mb-2 line-clamp-2">{grupo}</h4>
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold text-blue-600">{count}</span>
                          <Badge variant="outline">participantes</Badge>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No hay datos de grupos culturales disponibles</div>
              )}
            </CardContent>
          </Card>

          <GroupTrackingComponent />
        </div>
      </div>
    </div>
  )
}

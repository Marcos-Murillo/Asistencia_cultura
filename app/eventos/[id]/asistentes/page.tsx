"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Navigation } from "@/components/navigation"
import { getEventById, getEventAttendees } from "@/lib/firestore"
import { FACULTADES_PROGRAMAS } from "@/lib/data"
import type { Event, UserProfile } from "@/lib/types"
import { ArrowLeft, Download, Search, Users, Calendar, MapPin, Clock } from "lucide-react"
import Link from "next/link"
import * as XLSX from "xlsx"

interface EventAttendee extends UserProfile {
  fechaAsistencia: Date
}

export default function EventoAsistentesPage() {
  const params = useParams()
  const eventId = params.id as string
  
  const [event, setEvent] = useState<Event | null>(null)
  const [attendees, setAttendees] = useState<EventAttendee[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filtros
  const [searchName, setSearchName] = useState("")
  const [filterFacultad, setFilterFacultad] = useState("todas")
  const [filterPrograma, setFilterPrograma] = useState("todos")
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

  useEffect(() => {
    loadData()
  }, [eventId])

  async function loadData() {
    try {
      setLoading(true)
      const [eventData, attendeesData] = await Promise.all([
        getEventById(eventId),
        getEventAttendees(eventId),
      ])
      setEvent(eventData)
      setAttendees(attendeesData)
    } catch (error) {
      console.error("Error cargando datos:", error)
    } finally {
      setLoading(false)
    }
  }

  // Obtener programas según facultad seleccionada
  const availablePrograms = useMemo(() => {
    if (filterFacultad === "todas") return []
    const facultad = FACULTADES_PROGRAMAS.find(f => f.nombre === filterFacultad)
    return facultad?.programas || []
  }, [filterFacultad])

  // Filtrar asistentes
  const filteredAttendees = useMemo(() => {
    return attendees.filter(attendee => {
      const matchesName = searchName === "" || 
        attendee.nombres.toLowerCase().includes(searchName.toLowerCase())
      
      const matchesFacultad = filterFacultad === "todas" || 
        attendee.facultad === filterFacultad
      
      const matchesPrograma = filterPrograma === "todos" || 
        attendee.programaAcademico === filterPrograma

      return matchesName && matchesFacultad && matchesPrograma
    })
  }, [attendees, searchName, filterFacultad, filterPrograma])

  // Paginación
  const totalPages = Math.ceil(filteredAttendees.length / itemsPerPage)
  const paginatedAttendees = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredAttendees.slice(start, start + itemsPerPage)
  }, [filteredAttendees, currentPage])

  // Reset página cuando cambian filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [searchName, filterFacultad, filterPrograma])

  // Reset programa cuando cambia facultad
  useEffect(() => {
    setFilterPrograma("todos")
  }, [filterFacultad])

  // Descargar Excel
  function downloadExcel() {
    const data = filteredAttendees.map(a => ({
      "Nombres": a.nombres,
      "Documento": a.numeroDocumento,
      "Correo": a.correo,
      "Teléfono": a.telefono,
      "Género": a.genero,
      "Edad": a.edad,
      "Estamento": a.estamento,
      "Facultad": a.facultad || "N/A",
      "Programa": a.programaAcademico || "N/A",
      "Fecha de Asistencia": new Date(a.fechaAsistencia).toLocaleString("es-CO")
    }))

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Asistentes")

    XLSX.writeFile(
      workbook,
      `asistentes_${event?.nombre.replace(/\s+/g, "_") || "evento"}_${new Date().toISOString().split("T")[0]}.xlsx`
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500">Cargando datos del evento...</div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500">Evento no encontrado</div>
              <div className="text-center mt-4">
                <Link href="/eventos">
                  <Button variant="outline">Volver a Eventos</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Navigation />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
          <div className="flex items-start gap-4">
            <Link href="/eventos">
              <Button variant="outline" size="icon" className="bg-transparent">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{event.nombre}</h1>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(event.fechaApertura).toLocaleDateString("es-CO")}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {event.hora}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {event.lugar}
                </span>
              </div>
            </div>
          </div>

          <Button onClick={downloadExcel} className="gap-2">
            <Download className="h-4 w-4" />
            Descargar Excel
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Asistentes</p>
                  <p className="text-2xl font-bold">{attendees.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <Users className="h-5 w-5 text-pink-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Mujeres</p>
                  <p className="text-2xl font-bold">{attendees.filter(a => a.genero === "MUJER").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Users className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Hombres</p>
                  <p className="text-2xl font-bold">{attendees.filter(a => a.genero === "HOMBRE").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="searchName">Buscar por nombre</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="searchName"
                    placeholder="Nombre del asistente..."
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filterFacultad">Facultad</Label>
                <Select value={filterFacultad} onValueChange={setFilterFacultad}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las facultades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas las facultades</SelectItem>
                    {FACULTADES_PROGRAMAS.map((f) => (
                      <SelectItem key={f.nombre} value={f.nombre}>
                        {f.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filterPrograma">Programa</Label>
                <Select 
                  value={filterPrograma} 
                  onValueChange={setFilterPrograma}
                  disabled={filterFacultad === "todas"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los programas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los programas</SelectItem>
                    {availablePrograms.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de asistentes */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Lista de Asistentes</CardTitle>
              <Badge variant="secondary">
                {filteredAttendees.length} {filteredAttendees.length === 1 ? "asistente" : "asistentes"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {paginatedAttendees.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No se encontraron asistentes con los filtros seleccionados
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Documento</TableHead>
                        <TableHead>Correo</TableHead>
                        <TableHead>Género</TableHead>
                        <TableHead>Estamento</TableHead>
                        <TableHead>Facultad</TableHead>
                        <TableHead>Programa</TableHead>
                        <TableHead>Fecha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedAttendees.map((attendee, index) => (
                        <TableRow key={`${attendee.id}-${index}`}>
                          <TableCell className="font-medium">{attendee.nombres}</TableCell>
                          <TableCell>{attendee.numeroDocumento}</TableCell>
                          <TableCell>{attendee.correo}</TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline"
                              className={
                                attendee.genero === "MUJER" 
                                  ? "border-pink-300 text-pink-700 bg-pink-50" 
                                  : attendee.genero === "HOMBRE"
                                  ? "border-blue-300 text-blue-700 bg-blue-50"
                                  : "border-purple-300 text-purple-700 bg-purple-50"
                              }
                            >
                              {attendee.genero}
                            </Badge>
                          </TableCell>
                          <TableCell>{attendee.estamento}</TableCell>
                          <TableCell className="text-sm">{attendee.facultad || "N/A"}</TableCell>
                          <TableCell className="text-sm max-w-[200px] truncate">{attendee.programaAcademico || "N/A"}</TableCell>
                          <TableCell className="text-sm">
                            {new Date(attendee.fechaAsistencia).toLocaleDateString("es-CO")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Paginación */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="bg-transparent"
                    >
                      Anterior
                    </Button>
                    <span className="text-sm text-gray-600">
                      Página {currentPage} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="bg-transparent"
                    >
                      Siguiente
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

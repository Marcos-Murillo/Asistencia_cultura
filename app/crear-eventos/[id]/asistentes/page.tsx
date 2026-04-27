"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ExcelColumnSelector, type ExcelColumn } from "@/components/excel-column-selector"
import { getRealEventByIdRouter, getRealEventAttendeesRouter } from "@/lib/db-router"
import { FACULTADES_PROGRAMAS } from "@/lib/data"
import type { Event, UserProfile } from "@/lib/types"
import { ArrowLeft, Search, Users, Calendar, MapPin, Clock } from "lucide-react"
import Link from "next/link"
import * as XLSX from "xlsx"
import { useArea } from "@/contexts/area-context"
import { formatNombre } from "@/lib/utils"

interface EventAttendee extends UserProfile {
  fechaAsistencia: Date
}

const ITEMS_PER_PAGE = 15

export default function EventoAsistentesPage() {
  const params = useParams()
  const eventId = params.id as string
  const { area } = useArea()

  const [event, setEvent] = useState<Event | null>(null)
  const [attendees, setAttendees] = useState<EventAttendee[]>([])
  const [loading, setLoading] = useState(true)

  const [searchName, setSearchName] = useState("")
  const [filterFacultad, setFilterFacultad] = useState("todas")
  const [filterPrograma, setFilterPrograma] = useState("todos")
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => { loadData() }, [eventId, area])

  async function loadData() {
    try {
      setLoading(true)
      const [eventData, attendeesData] = await Promise.all([
        getRealEventByIdRouter(area, eventId),
        getRealEventAttendeesRouter(area, eventId),
      ])
      setEvent(eventData)
      setAttendees(attendeesData)
    } catch (error) {
      console.error("[EventoAsistentes] Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const availablePrograms = useMemo(() => {
    if (filterFacultad === "todas") return []
    return FACULTADES_PROGRAMAS.find(f => f.nombre === filterFacultad)?.programas || []
  }, [filterFacultad])

  const filteredAttendees = useMemo(() => {
    return attendees.filter(a => {
      if (searchName && !a.nombres.toLowerCase().includes(searchName.toLowerCase())) return false
      if (filterFacultad !== "todas" && a.facultad !== filterFacultad) return false
      if (filterPrograma !== "todos" && a.programaAcademico !== filterPrograma) return false
      return true
    })
  }, [attendees, searchName, filterFacultad, filterPrograma])

  const totalPages = Math.ceil(filteredAttendees.length / ITEMS_PER_PAGE)
  const paginatedAttendees = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredAttendees.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredAttendees, currentPage])

  useEffect(() => { setCurrentPage(1) }, [searchName, filterFacultad, filterPrograma])
  useEffect(() => { setFilterPrograma("todos") }, [filterFacultad])

  const availableColumns: ExcelColumn[] = [
    { key: "correo", label: "Correo" },
    { key: "numeroDocumento", label: "Documento" },
    { key: "tipoDocumento", label: "Tipo Documento" },
    { key: "telefono", label: "Teléfono" },
    { key: "genero", label: "Género" },
    { key: "etnia", label: "Etnia" },
    { key: "edad", label: "Edad" },
    { key: "sede", label: "Sede" },
    { key: "estamento", label: "Estamento" },
    { key: "codigoEstudiantil", label: "Código" },
    { key: "facultad", label: "Facultad" },
    { key: "programaAcademico", label: "Programa" },
    { key: "fechaAsistencia", label: "Fecha Inscripción" },
  ]

  function downloadExcel(selectedColumns: string[]) {
    const data = filteredAttendees.map(a => {
      const row: Record<string, any> = {}
      selectedColumns.forEach(key => {
        switch (key) {
          case "nombres": row["Nombres"] = formatNombre(a.nombres); break
          case "correo": row["Correo"] = a.correo; break
          case "numeroDocumento": row["Documento"] = a.numeroDocumento; break
          case "tipoDocumento": row["Tipo Documento"] = a.tipoDocumento; break
          case "telefono": row["Teléfono"] = a.telefono; break
          case "genero": row["Género"] = a.genero; break
          case "etnia": row["Etnia"] = a.etnia; break
          case "edad": row["Edad"] = a.edad; break
          case "sede": row["Sede"] = a.sede; break
          case "estamento": row["Estamento"] = a.estamento; break
          case "codigoEstudiantil": row["Código"] = a.codigoEstudiantil || "N/A"; break
          case "facultad": row["Facultad"] = a.facultad || "N/A"; break
          case "programaAcademico": row["Programa"] = a.programaAcademico || "N/A"; break
          case "fechaAsistencia": row["Fecha Inscripción"] = new Date(a.fechaAsistencia).toLocaleString("es-CO"); break
        }
      })
      return row
    })
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Inscritos")
    XLSX.writeFile(wb, `inscritos_${event?.nombre.replace(/\s+/g, "_") || "evento"}_${new Date().toISOString().split("T")[0]}.xlsx`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <p className="text-gray-500">Cargando datos del evento...</p>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <p className="text-gray-500">Evento no encontrado</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Link href="/crear-eventos">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{event.nombre}</h1>
              <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{event.hora}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.lugar}</span>
                {event.fechaEvento && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(event.fechaEvento).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                )}
              </div>
            </div>
          </div>
          <ExcelColumnSelector
            availableColumns={availableColumns}
            onDownload={downloadExcel}
            buttonText="Descargar Excel"
            buttonClassName="bg-emerald-600 hover:bg-emerald-700"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">Total inscritos</p>
                <p className="text-2xl font-bold">{attendees.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold">M</div>
              <div>
                <p className="text-sm text-gray-500">Mujeres</p>
                <p className="text-2xl font-bold">{attendees.filter(a => a.genero === "MUJER").length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">H</div>
              <div>
                <p className="text-sm text-gray-500">Hombres</p>
                <p className="text-2xl font-bold">{attendees.filter(a => a.genero === "HOMBRE").length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input className="pl-9" placeholder="Nombre..." value={searchName} onChange={e => setSearchName(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Facultad</Label>
                <Select value={filterFacultad} onValueChange={setFilterFacultad}>
                  <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas las facultades</SelectItem>
                    {FACULTADES_PROGRAMAS.map(f => <SelectItem key={f.nombre} value={f.nombre}>{f.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Programa</Label>
                <Select value={filterPrograma} onValueChange={setFilterPrograma} disabled={filterFacultad === "todas"}>
                  <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los programas</SelectItem>
                    {availablePrograms.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Inscritos ({filteredAttendees.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paginatedAttendees.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No hay inscritos para este evento</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Género</TableHead>
                        <TableHead>Estamento</TableHead>
                        <TableHead>Facultad</TableHead>
                        <TableHead>Programa</TableHead>
                        <TableHead>Fecha inscripción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedAttendees.map(a => (
                        <TableRow key={a.id}>
                          <TableCell className="font-medium">{formatNombre(a.nombres)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={a.genero === "MUJER" ? "bg-pink-50 text-pink-700" : a.genero === "HOMBRE" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}>
                              {a.genero}
                            </Badge>
                          </TableCell>
                          <TableCell><Badge variant="secondary">{a.estamento}</Badge></TableCell>
                          <TableCell className="max-w-[180px] truncate text-sm">{a.facultad || "N/A"}</TableCell>
                          <TableCell className="max-w-[220px] truncate text-sm">{a.programaAcademico || "N/A"}</TableCell>
                          <TableCell className="text-sm text-gray-500">{new Date(a.fechaAsistencia).toLocaleDateString("es-CO")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <span className="text-sm text-gray-500">Página {currentPage} de {totalPages}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Anterior</Button>
                      <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Siguiente</Button>
                    </div>
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

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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ExcelColumnSelector, type ExcelColumn } from "@/components/excel-column-selector"
import { AttendeeCharts } from "@/components/attendee-charts"
import { AttendeeFormDrawer } from "@/components/attendee-form-drawer"
import { getAllEvents, getEventByIdRouter, getEventAttendeesRouter, getEventFormResponsesByEvent } from "@/lib/db-router"
import { FACULTADES_PROGRAMAS } from "@/lib/data"
import type { Event, EventFormResponse, UserProfile } from "@/lib/types"
import { ArrowLeft, Search, Users, Calendar, MapPin, Clock, PieChart, Filter, ChevronDown } from "lucide-react"
import Link from "next/link"
import * as XLSX from "xlsx"
import { useArea } from "@/contexts/area-context"
import { formatNombre } from "@/lib/utils"

interface EventAttendee extends UserProfile {
  fechaAsistencia: Date
  formResponse?: EventFormResponse
}

export default function EventoAsistentesPage() {
  const params = useParams()
  const eventId = decodeURIComponent(String(params?.id ?? "")).trim()
  const { area } = useArea()
  
  const [event, setEvent] = useState<Event | null>(null)
  const [attendees, setAttendees] = useState<EventAttendee[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  
  // Filtros
  const [searchName, setSearchName] = useState("")
  const [filterFacultad, setFilterFacultad] = useState("todas")
  const [filterPrograma, setFilterPrograma] = useState("todos")
  const [optionFilters, setOptionFilters] = useState<Record<string, string[]>>({})
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

  useEffect(() => {
    loadData()
  }, [eventId, area])

  async function loadData() {
    try {
      setLoading(true)
      if (!eventId) {
        setEvent(null)
        setAttendees([])
        return
      }

      const areasToTry = area === "deporte" ? (["deporte", "cultura"] as const) : (["cultura", "deporte"] as const)
      let eventData: Event | null = null
      let usedArea = area

      for (const candidate of areasToTry) {
        eventData = await getEventByIdRouter(candidate, eventId)
        if (!eventData) {
          const listed = await getAllEvents(candidate)
          eventData = listed.find((item) => item.id === eventId) || null
        }
        if (eventData) {
          usedArea = candidate
          break
        }
      }

      setEvent(eventData)
      if (!eventData) {
        setAttendees([])
        return
      }

      const formResponseMaps = await Promise.all(
        areasToTry.map((candidate) =>
          getEventFormResponsesByEvent(candidate, eventId).catch((error) => {
            console.error("[EventoAsistentes] Error cargando formulario:", candidate, error)
            return new Map<string, EventFormResponse>()
          }),
        ),
      )
      const formResponses = new Map<string, EventFormResponse>()
      for (const map of formResponseMaps) {
        for (const [userId, response] of map.entries()) {
          const key = String(userId)
          const existing = formResponses.get(key)
          if (!existing || response.submittedAt > existing.submittedAt) {
            formResponses.set(key, response)
          }
        }
      }

      const [attendeesData] = await Promise.all([
        getEventAttendeesRouter(usedArea, eventId).catch((error) => {
          console.error("[EventoAsistentes] Error cargando inscritos:", error)
          return []
        }),
      ])

      const merged = attendeesData.map((attendee) => ({
        ...attendee,
        formResponse: formResponses.get(String(attendee.id)),
      }))

      for (const [userId, response] of formResponses.entries()) {
        if (!merged.some((attendee) => String(attendee.id) === String(userId))) {
          merged.push({
            id: userId,
            nombres: "Inscrito (sin perfil)",
            correo: "",
            numeroDocumento: "",
            telefono: "",
            genero: "OTRO",
            etnia: "NO RESPONDE",
            tipoDocumento: "CEDULA",
            edad: 0,
            sede: "NINGUNA",
            estamento: "INVITADO",
            area: usedArea,
            createdAt: response.submittedAt,
            lastAttendance: response.submittedAt,
            fechaAsistencia: response.submittedAt,
            formResponse: response,
          })
        }
      }

      setAttendees(merged)
    } catch (error) {
      console.error("[EventoAsistentes] Error cargando datos:", error)
    } finally {
      setLoading(false)
    }
  }

  const availablePrograms = useMemo(() => {
    if (filterFacultad === "todas") return []
    const facultad = FACULTADES_PROGRAMAS.find(f => f.nombre === filterFacultad)
    return facultad?.programas || []
  }, [filterFacultad])

  const multipleChoiceQuestions = useMemo(() => {
    const questions = (event?.inscriptionForm?.questions || []).filter((question) => question.type === "multiple_choice")
    const byId = new Map(
      questions.map((question) => [
        question.id,
        {
          id: question.id,
          label: question.label,
          options: [...(question.options || [])],
        },
      ]),
    )
    for (const attendee of attendees) {
      for (const answer of attendee.formResponse?.answers || []) {
        if (answer.type && answer.type !== "multiple_choice") continue
        if (!answer.selected?.length && !byId.has(answer.questionId)) continue
        const current = byId.get(answer.questionId) || {
          id: answer.questionId,
          label: answer.label || "Pregunta",
          options: [] as string[],
        }
        for (const option of answer.selected || []) {
          if (option && !current.options.includes(option)) current.options.push(option)
        }
        byId.set(answer.questionId, current)
      }
    }
    return Array.from(byId.values()).filter((question) => question.options.length > 0)
  }, [event, attendees])

  function toggleOptionFilter(questionId: string, option: string) {
    setOptionFilters((current) => {
      const selected = current[questionId] || []
      const next = selected.includes(option)
        ? selected.filter((item) => item !== option)
        : [...selected, option]
      const updated = { ...current }
      if (next.length === 0) delete updated[questionId]
      else updated[questionId] = next
      return updated
    })
  }

  const filteredAttendees = useMemo(() => {
    return attendees.filter((attendee) => {
      const term = searchName.toLowerCase()
      const matchesName = searchName === "" ||
        (attendee.nombres || "").toLowerCase().includes(term) ||
        (attendee.correo || "").toLowerCase().includes(term) ||
        (attendee.numeroDocumento || "").toLowerCase().includes(term)

      const matchesFacultad = filterFacultad === "todas" ||
        attendee.facultad === filterFacultad

      const matchesPrograma = filterPrograma === "todos" ||
        attendee.programaAcademico === filterPrograma

      const matchesForm = Object.entries(optionFilters).every(([questionId, options]) => {
        if (!options.length) return true
        const selected = attendee.formResponse?.answers?.find((answer) => answer.questionId === questionId)?.selected || []
        return options.some((option) => selected.includes(option))
      })

      return matchesName && matchesFacultad && matchesPrograma && matchesForm
    })
  }, [attendees, searchName, filterFacultad, filterPrograma, optionFilters])

  // Paginación
  const totalPages = Math.ceil(filteredAttendees.length / itemsPerPage)
  const paginatedAttendees = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredAttendees.slice(start, start + itemsPerPage)
  }, [filteredAttendees, currentPage])

  // Reset página cuando cambian filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [searchName, filterFacultad, filterPrograma, optionFilters])

  // Reset programa cuando cambia facultad
  useEffect(() => {
    setFilterPrograma("todos")
  }, [filterFacultad])

  const formQuestionColumns = useMemo<ExcelColumn[]>(() => {
    const questions = event?.inscriptionForm?.questions || []
    const columns: ExcelColumn[] = questions.map((question) => ({
      key: `form_${question.id}`,
      label: question.label,
    }))
    const knownIds = new Set(questions.map((question) => question.id))
    for (const attendee of attendees) {
      for (const answer of attendee.formResponse?.answers || []) {
        if (!answer.questionId || knownIds.has(answer.questionId)) continue
        knownIds.add(answer.questionId)
        columns.push({
          key: `form_${answer.questionId}`,
          label: answer.label || "Pregunta",
        })
      }
    }
    const seenLabels = new Map<string, number>()
    return columns.map((column) => {
      const count = (seenLabels.get(column.label) || 0) + 1
      seenLabels.set(column.label, count)
      return count > 1 ? { ...column, label: `${column.label} (${count})` } : column
    })
  }, [event, attendees])

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
    { key: "fechaAsistencia", label: "Fecha Asistencia" },
    ...formQuestionColumns,
  ]

  // Descargar Excel con columnas seleccionadas
  function downloadExcel(selectedColumns: string[]) {
    const data = filteredAttendees.map(a => {
      const row: Record<string, any> = {}
      
      selectedColumns.forEach(key => {
        switch (key) {
          case "nombres":
            row["Nombres"] = formatNombre(a.nombres).toUpperCase()
            break
          case "correo":
            row["Correo"] = a.correo
            break
          case "numeroDocumento":
            row["Documento"] = a.numeroDocumento
            break
          case "tipoDocumento":
            row["Tipo Documento"] = a.tipoDocumento
            break
          case "telefono":
            row["Teléfono"] = a.telefono
            break
          case "genero":
            row["Género"] = a.genero
            break
          case "etnia":
            row["Etnia"] = a.etnia
            break
          case "edad":
            row["Edad"] = a.edad
            break
          case "sede":
            row["Sede"] = a.sede
            break
          case "estamento":
            row["Estamento"] = a.estamento
            break
          case "codigoEstudiantil":
            row["Código"] = a.codigoEstudiantil || "N/A"
            break
          case "facultad":
            row["Facultad"] = a.facultad || "N/A"
            break
          case "programaAcademico":
            row["Programa"] = a.programaAcademico || "N/A"
            break
          case "fechaAsistencia":
            row["Fecha de Asistencia"] = new Date(a.fechaAsistencia).toLocaleString("es-CO")
            break
          default: {
            if (!key.startsWith("form_")) break
            const questionId = key.slice(5)
            const column = formQuestionColumns.find((item) => item.key === key)
            const answer = a.formResponse?.answers?.find((item) => item.questionId === questionId)
            const parts: string[] = []
            if (answer?.text?.trim()) parts.push(answer.text.trim())
            if (answer?.selected?.length) parts.push(answer.selected.join(", "))
            if (answer?.files?.length) {
              parts.push(
                answer.files
                  .map((file) => file.webViewLink || file.webContentLink || file.name)
                  .filter(Boolean)
                  .join(" "),
              )
            }
            row[column?.label || "Pregunta"] = parts.join(" | ")
            break
          }
        }
      })
      
      return row
    })

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
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500">Convocatoria no encontrada</div>
              <div className="text-center mt-4">
                <Link href="/crear-convocatorias">
                  <Button variant="outline">Volver a Convocatorias</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const hasForm = Boolean(event.inscriptionForm?.enabled && event.inscriptionForm.questions.length)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
          <div className="flex items-start gap-4">
            <Link href="/crear-convocatorias">
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

          <ExcelColumnSelector
            availableColumns={availableColumns}
            onDownload={downloadExcel}
            buttonText="Descargar Excel"
            buttonClassName="bg-green-600 hover:bg-green-700"
          />
        </div>

        <Tabs defaultValue="lista" className="space-y-4">
          <TabsList>
            <TabsTrigger value="lista" className="gap-2">
              <Users className="h-4 w-4" />
              Inscritos
            </TabsTrigger>
            <TabsTrigger value="graficas" className="gap-2">
              <PieChart className="h-4 w-4" />
              Gráficas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lista">
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
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
            <CardTitle className="text-lg">Filtros</CardTitle>
            {multipleChoiceQuestions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-transparent shrink-0">
                    <Filter className="mr-2 h-4 w-4" />
                    Formulario
                    {Object.values(optionFilters).reduce((count, options) => count + options.length, 0) > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {Object.values(optionFilters).reduce((count, options) => count + options.length, 0)}
                      </Badge>
                    )}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>Filtrar por respuestas</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {multipleChoiceQuestions.map((question) => (
                    <DropdownMenuSub key={question.id}>
                      <DropdownMenuSubTrigger className="gap-2">
                        <span className="flex-1 truncate">{question.label}</span>
                        {optionFilters[question.id]?.length ? (
                          <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                            {optionFilters[question.id].length}
                          </Badge>
                        ) : null}
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-56">
                        {question.options.map((option) => (
                          <DropdownMenuCheckboxItem
                            key={option}
                            checked={Boolean(optionFilters[question.id]?.includes(option))}
                            onCheckedChange={() => toggleOptionFilter(question.id, option)}
                            onSelect={(event) => event.preventDefault()}
                          >
                            <span className="truncate">{option}</span>
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  ))}
                  {Object.keys(optionFilters).length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setOptionFilters({})}>
                        Limpiar filtros del formulario
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
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
            ) : hasForm ? (
              <div className="space-y-3">
                {paginatedAttendees.map((attendee, index) => (
                    <div key={`${attendee.id}-${index}`} className="rounded-lg border bg-white p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-semibold">{formatNombre(attendee.nombres)}</p>
                          <p className="text-sm text-gray-600">{attendee.correo || "Sin correo"}</p>
                          <p className="text-sm text-gray-500">
                            {attendee.numeroDocumento || "Sin documento"} · {attendee.estamento} ·{" "}
                            {new Date(attendee.fechaAsistencia).toLocaleDateString("es-CO")}
                          </p>
                          {attendee.formResponse?.answers?.length ? (
                            <Badge variant="secondary" className="mt-2">Formulario enviado</Badge>
                          ) : null}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-transparent"
                          onClick={() => setExpandedId(attendee.id)}
                        >
                          Ver formulario y archivos
                        </Button>
                      </div>
                    </div>
                ))}
                <AttendeeFormDrawer
                  attendee={paginatedAttendees.find((item) => item.id === expandedId) || attendees.find((item) => item.id === expandedId) || null}
                  open={Boolean(expandedId)}
                  onOpenChange={(open) => {
                    if (!open) setExpandedId(null)
                  }}
                />
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
                          <TableCell className="font-medium">{formatNombre(attendee.nombres)}</TableCell>
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
              </>
            )}

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
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="graficas">
            <AttendeeCharts attendees={attendees} title={event.nombre} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

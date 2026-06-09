"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ExcelColumnSelector, type ExcelColumn } from "@/components/excel-column-selector"
import {
  getAllCinecluEvents,
  createCinecluEvent,
  deleteCinecluEvent,
  getCinecluAttendees,
  getUserByNumeroDocumento,
  saveCinecluAttendance,
} from "@/lib/db-router"
import type { CinecluEvent, UserProfile } from "@/lib/types"
import { ESTAMENTOS, FACULTADES } from "@/lib/data"
import { formatNombre } from "@/lib/utils"
import { Plus, Trash2, Search, Calendar, Film, Users, UserCheck, Eye, BarChart2 } from "lucide-react"
import * as XLSX from "xlsx"
import type { Area } from "@/lib/firebase-config"

type CinecluEventWithCount = CinecluEvent & { asistentes: number }
type Attendee = UserProfile & { fechaAsistencia: Date }

function StatBar({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-40 truncate text-gray-600">{label}</span>
      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-violet-600" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 text-right text-gray-700 font-medium">{pct}%</span>
      <span className="text-gray-400">({value})</span>
    </div>
  )
}

export function CinecluTab({ area }: { area: Area }) {
  const [events, setEvents] = useState<CinecluEventWithCount[]>([])
  const [filteredEvents, setFilteredEvents] = useState<CinecluEventWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({ pelicula: "", fecha: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [markingEvent, setMarkingEvent] = useState<CinecluEventWithCount | null>(null)
  const [cedula, setCedula] = useState("")
  const [foundUser, setFoundUser] = useState<UserProfile | null>(null)
  const [searchingUser, setSearchingUser] = useState(false)
  const [markingAttendance, setMarkingAttendance] = useState(false)
  const [markError, setMarkError] = useState("")
  const [markSuccess, setMarkSuccess] = useState("")

  const [viewingEvent, setViewingEvent] = useState<CinecluEventWithCount | null>(null)
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [loadingAttendees, setLoadingAttendees] = useState(false)
  const [viewSearch, setViewSearch] = useState("")
  const [viewEstamento, setViewEstamento] = useState("all")
  const [viewFacultad, setViewFacultad] = useState("all")

  useEffect(() => { loadEvents() }, [area])

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredEvents(events)
    } else {
      const s = searchTerm.toLowerCase()
      setFilteredEvents(events.filter(e =>
        e.pelicula.toLowerCase().includes(s) ||
        new Date(e.fecha).toLocaleDateString("es-CO").includes(s)
      ))
    }
  }, [searchTerm, events])

  async function loadEvents() {
    try {
      setLoading(true)
      const data = await getAllCinecluEvents(area)
      setEvents(data)
      setFilteredEvents(data)
    } catch (err) {
      console.error("Error cargando cineclú:", err)
      setError("Error al cargar las proyecciones de Cineclú")
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)
    try {
      await createCinecluEvent(area, {
        pelicula: createForm.pelicula,
        fecha: new Date(createForm.fecha + "T00:00:00"),
      })
      setSuccess("Proyección creada exitosamente")
      setCreateForm({ pelicula: "", fecha: "" })
      setCreateOpen(false)
      await loadEvents()
    } catch (err) {
      console.error("Error creando cineclú:", err)
      setError("Hubo un problema al crear la proyección")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(eventId: string) {
    if (!confirm("¿Estás seguro de que deseas eliminar esta proyección? También se eliminarán todas las asistencias asociadas.")) return
    try {
      await deleteCinecluEvent(area, eventId)
      setSuccess("Proyección eliminada exitosamente")
      await loadEvents()
    } catch (err) {
      console.error("Error eliminando cineclú:", err)
      setError("Hubo un problema al eliminar la proyección")
    }
  }

  function openMarkDialog(event: CinecluEventWithCount) {
    setMarkingEvent(event)
    setCedula("")
    setFoundUser(null)
    setMarkError("")
    setMarkSuccess("")
  }

  function closeMarkDialog() {
    setMarkingEvent(null)
    setCedula("")
    setFoundUser(null)
    setMarkError("")
    setMarkSuccess("")
  }

  async function handleSearchUser() {
    setMarkError("")
    setMarkSuccess("")
    setFoundUser(null)
    const trimmed = cedula.trim()
    if (!trimmed) {
      setMarkError("Ingresa un número de cédula")
      return
    }
    setSearchingUser(true)
    try {
      const user = await getUserByNumeroDocumento(area, trimmed)
      if (!user) {
        setMarkError("Usuario no registrado. Debe inscribirse primero en el sistema.")
        return
      }
      setFoundUser(user)
    } catch (err) {
      console.error("Error buscando usuario:", err)
      setMarkError("Error al buscar el usuario")
    } finally {
      setSearchingUser(false)
    }
  }

  async function handleMarkEntry() {
    if (!markingEvent || !foundUser) return
    setMarkError("")
    setMarkSuccess("")
    setMarkingAttendance(true)
    const registeredName = formatNombre(foundUser.nombres)
    try {
      await saveCinecluAttendance(area, foundUser.id, markingEvent.id)
      setMarkSuccess(`Asistencia registrada para ${registeredName}`)
      setCedula("")
      setFoundUser(null)
      setMarkingEvent(prev => prev ? { ...prev, asistentes: prev.asistentes + 1 } : null)
      setEvents(prev => prev.map(e => e.id === markingEvent.id ? { ...e, asistentes: e.asistentes + 1 } : e))
      await loadEvents()
      if (viewingEvent?.id === markingEvent.id) {
        await loadAttendees(markingEvent.id)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al registrar asistencia"
      setMarkError(msg)
    } finally {
      setMarkingAttendance(false)
    }
  }

  async function loadAttendees(eventId: string) {
    setLoadingAttendees(true)
    try {
      setAttendees(await getCinecluAttendees(area, eventId))
    } catch (err) {
      console.error("Error cargando asistentes:", err)
    } finally {
      setLoadingAttendees(false)
    }
  }

  async function openViewDialog(event: CinecluEventWithCount) {
    setViewingEvent(event)
    setViewSearch("")
    setViewEstamento("all")
    setViewFacultad("all")
    await loadAttendees(event.id)
  }

  const filteredAttendees = useMemo(() => {
    return attendees.filter(a => {
      if (viewSearch && !a.nombres.toLowerCase().includes(viewSearch.toLowerCase()) && !a.numeroDocumento.includes(viewSearch)) return false
      if (viewEstamento !== "all" && a.estamento !== viewEstamento) return false
      if (viewFacultad !== "all" && a.facultad !== viewFacultad) return false
      return true
    })
  }, [attendees, viewSearch, viewEstamento, viewFacultad])

  const viewStats = useMemo(() => {
    if (attendees.length === 0) return null
    const byGenero: Record<string, number> = {}
    const byFacultad: Record<string, number> = {}
    const byPrograma: Record<string, number> = {}
    attendees.forEach(a => {
      byGenero[a.genero] = (byGenero[a.genero] || 0) + 1
      if (a.facultad) byFacultad[a.facultad] = (byFacultad[a.facultad] || 0) + 1
      if (a.programaAcademico) byPrograma[a.programaAcademico] = (byPrograma[a.programaAcademico] || 0) + 1
    })
    return { total: attendees.length, byGenero, byFacultad, byPrograma }
  }, [attendees])

  const excelColumns: ExcelColumn[] = [
    { key: "numeroDocumento", label: "Documento" },
    { key: "genero", label: "Género" },
    { key: "estamento", label: "Estamento" },
    { key: "facultad", label: "Facultad" },
    { key: "programaAcademico", label: "Programa" },
    { key: "correo", label: "Correo" },
    { key: "telefono", label: "Teléfono" },
    { key: "fechaAsistencia", label: "Fecha asistencia" },
  ]

  function downloadExcel(selectedColumns: string[]) {
    if (!viewingEvent) return
    const data = filteredAttendees.map(a => {
      const row: Record<string, string> = {}
      selectedColumns.forEach(key => {
        switch (key) {
          case "nombres": row["Nombres"] = formatNombre(a.nombres).toUpperCase(); break
          case "numeroDocumento": row["Documento"] = a.numeroDocumento; break
          case "genero": row["Género"] = a.genero; break
          case "estamento": row["Estamento"] = a.estamento; break
          case "facultad": row["Facultad"] = a.facultad || "N/A"; break
          case "programaAcademico": row["Programa"] = a.programaAcademico || "N/A"; break
          case "correo": row["Correo"] = a.correo; break
          case "telefono": row["Teléfono"] = a.telefono; break
          case "fechaAsistencia": row["Fecha asistencia"] = new Date(a.fechaAsistencia).toLocaleString("es-CO"); break
        }
      })
      return row
    })
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Asistentes")
    XLSX.writeFile(wb, `cineclu_${viewingEvent.pelicula.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`)
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cineclú</h2>
          <p className="text-gray-600 mt-1">Proyecciones de cine con registro de asistencia presencial</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2 bg-violet-600 hover:bg-violet-700">
              <Plus className="h-5 w-5" />
              Crear Proyección
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle>Nueva Proyección</DialogTitle>
              <DialogDescription>Registra una proyección de Cineclú con fecha y película.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="cineclu-pelicula">Película *</Label>
                <Input
                  id="cineclu-pelicula"
                  value={createForm.pelicula}
                  onChange={e => setCreateForm({ ...createForm, pelicula: e.target.value })}
                  placeholder="Ej: El laberinto del fauno"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cineclu-fecha">Fecha *</Label>
                <Input
                  id="cineclu-fecha"
                  type="date"
                  value={createForm.fecha}
                  onChange={e => setCreateForm({ ...createForm, fecha: e.target.value })}
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting} className="bg-violet-600 hover:bg-violet-700">
                  {isSubmitting ? "Creando..." : "Generar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {success && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por película o fecha..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card><CardContent className="py-12"><div className="text-center text-gray-500">Cargando proyecciones...</div></CardContent></Card>
      ) : filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Film className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">{searchTerm ? "No se encontraron proyecciones" : "No hay proyecciones creadas aún"}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map(event => (
            <Card key={event.id} className="border-violet-200">
              <CardHeader>
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-lg leading-tight">{event.pelicula}</CardTitle>
                  <Badge variant="secondary" className="shrink-0 gap-1">
                    <Users className="h-3 w-3" />
                    {event.asistentes}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(event.fecha).toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
                </div>
                <div className="flex flex-col gap-2 pt-2 border-t">
                  <Button
                    className="w-full bg-violet-600 hover:bg-violet-700 gap-2"
                    onClick={() => openMarkDialog(event)}
                  >
                    <UserCheck className="h-4 w-4" />
                    Marcar Asistencia
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openViewDialog(event)}>
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(event.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Marcar asistencia */}
      <Dialog open={!!markingEvent} onOpenChange={open => { if (!open) closeMarkDialog() }}>
        <DialogContent className="sm:max-w-md">
          {markingEvent && (
            <>
              <DialogHeader>
                <DialogTitle>Asistencia — {markingEvent.pelicula}</DialogTitle>
                <DialogDescription>
                  {new Date(markingEvent.fecha).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="cedula">Cédula</Label>
                  <div className="flex gap-2">
                    <Input
                      id="cedula"
                      value={cedula}
                      onChange={e => { setCedula(e.target.value); setFoundUser(null); setMarkError(""); setMarkSuccess("") }}
                      placeholder="Número de documento"
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleSearchUser() } }}
                    />
                    <Button type="button" variant="outline" onClick={handleSearchUser} disabled={searchingUser}>
                      {searchingUser ? "..." : "Buscar"}
                    </Button>
                  </div>
                </div>
                {foundUser && (
                  <div className="rounded-lg border bg-violet-50 p-4 space-y-1">
                    <p className="font-semibold text-gray-900">{formatNombre(foundUser.nombres)}</p>
                    <p className="text-sm text-gray-600">{foundUser.numeroDocumento} · {foundUser.estamento}</p>
                    {foundUser.facultad && <p className="text-sm text-gray-500">{foundUser.facultad}</p>}
                    {foundUser.programaAcademico && <p className="text-sm text-gray-500">{foundUser.programaAcademico}</p>}
                  </div>
                )}
                {markSuccess && (
                  <Alert className="bg-green-50 border-green-200">
                    <AlertDescription className="text-green-800">{markSuccess}</AlertDescription>
                  </Alert>
                )}
                {markError && (
                  <Alert variant="destructive">
                    <AlertDescription>{markError}</AlertDescription>
                  </Alert>
                )}
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={closeMarkDialog}>Cancelar</Button>
                <Button
                  className="bg-violet-600 hover:bg-violet-700"
                  onClick={handleMarkEntry}
                  disabled={!foundUser || markingAttendance}
                >
                  {markingAttendance ? "Registrando..." : "Marcar Entrada"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Ver asistentes */}
      <Dialog open={!!viewingEvent} onOpenChange={open => { if (!open) setViewingEvent(null) }}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          {viewingEvent && (
            <>
              <DialogHeader>
                <DialogTitle>{viewingEvent.pelicula}</DialogTitle>
                <DialogDescription>
                  {new Date(viewingEvent.fecha).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}
                  {" · "}{attendees.length} asistentes
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-2">
                <div className="relative col-span-2 md:col-span-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input className="pl-9 h-8 text-xs" placeholder="Nombre o cédula..." value={viewSearch} onChange={e => setViewSearch(e.target.value)} />
                </div>
                <Select value={viewEstamento} onValueChange={setViewEstamento}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Estamento" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Todos</SelectItem>{ESTAMENTOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={viewFacultad} onValueChange={setViewFacultad}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Facultad" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Todas</SelectItem>{FACULTADES.map(f => <SelectItem key={f} value={f}>{f.replace("FACULTAD DE ", "")}</SelectItem>)}</SelectContent>
                </Select>
                <Badge variant="secondary">{filteredAttendees.length} / {attendees.length}</Badge>
              </div>
              {loadingAttendees ? (
                <p className="text-center text-gray-500 py-8">Cargando asistentes...</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Documento</TableHead>
                        <TableHead>Género</TableHead>
                        <TableHead>Estamento</TableHead>
                        <TableHead>Facultad</TableHead>
                        <TableHead>Programa</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAttendees.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center text-gray-500">Sin asistentes registrados</TableCell></TableRow>
                      ) : filteredAttendees.map(a => (
                        <TableRow key={a.id}>
                          <TableCell className="font-medium">{formatNombre(a.nombres)}</TableCell>
                          <TableCell>{a.numeroDocumento}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={a.genero === "MUJER" ? "bg-pink-50 text-pink-700" : a.genero === "HOMBRE" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}>
                              {a.genero}
                            </Badge>
                          </TableCell>
                          <TableCell><Badge variant="secondary">{a.estamento}</Badge></TableCell>
                          <TableCell className="text-xs max-w-[160px] truncate">{a.facultad || "N/A"}</TableCell>
                          <TableCell className="text-xs max-w-[200px] truncate">{a.programaAcademico || "N/A"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {viewStats && (
                <div className="mt-4 space-y-4 border-t pt-4">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2"><BarChart2 className="h-4 w-4" />Resumen estadístico</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-500 uppercase">Por Género</p>
                      {Object.entries(viewStats.byGenero).map(([g, v]) => <StatBar key={g} label={g} value={v} total={viewStats.total} />)}
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-500 uppercase">Por Facultad</p>
                      {Object.entries(viewStats.byFacultad).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([f, v]) => <StatBar key={f} label={f.replace("FACULTAD DE ", "")} value={v} total={viewStats.total} />)}
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-500 uppercase">Por Programa</p>
                      {Object.entries(viewStats.byPrograma).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([p, v]) => <StatBar key={p} label={p} value={v} total={viewStats.total} />)}
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter className="mt-4">
                <ExcelColumnSelector availableColumns={excelColumns} onDownload={downloadExcel} buttonText="Descargar Excel" buttonClassName="bg-emerald-600 hover:bg-emerald-700" />
                <Button variant="outline" onClick={() => setViewingEvent(null)}>Cerrar</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

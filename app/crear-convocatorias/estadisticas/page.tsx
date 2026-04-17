"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Users, Calendar, GraduationCap, Building2, ChevronDown, ChevronUp, X } from "lucide-react"
import { FACULTADES, ESTAMENTOS } from "@/lib/data"
import { getEventAttendanceRecordsRouter } from "@/lib/db-router"
import { generateEventStats } from "@/lib/event-stats"
import type { EventStats, EventAttendanceEntry, UserProfile } from "@/lib/types"
import { useArea } from "@/contexts/area-context"

type EventRecord = { entry: EventAttendanceEntry; user: UserProfile; eventName: string }

function buildStats(records: EventRecord[]): EventStats {
  return generateEventStats(records)
}

export default function ConvocatoriasEstadisticasPage() {
  const { area } = useArea()
  const [allRecords, setAllRecords] = useState<EventRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros tabla por programa
  const [progFacultad, setProgFacultad] = useState("all")
  const [progEstamento, setProgEstamento] = useState("all")
  const [progEvento, setProgEvento] = useState("all")
  const [progFechaDesde, setProgFechaDesde] = useState("")
  const [progFechaHasta, setProgFechaHasta] = useState("")

  // Filtros tabla por facultad
  const [facEstamento, setFacEstamento] = useState("all")
  const [facEvento, setFacEvento] = useState("all")
  const [facFechaDesde, setFacFechaDesde] = useState("")
  const [facFechaHasta, setFacFechaHasta] = useState("")

  const [isProgramOpen, setIsProgramOpen] = useState(false)
  const [isFacultyOpen, setIsFacultyOpen] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const data = await getEventAttendanceRecordsRouter(area)
        setAllRecords(data)
      } catch (err) {
        console.error("Error cargando estadísticas de convocatorias:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [area])

  // Lista de eventos únicos para el filtro
  const eventNames = useMemo(() => {
    const names = new Set(allRecords.map(r => r.eventName))
    return Array.from(names).sort()
  }, [allRecords])

  // Stats generales (sin filtros)
  const stats = useMemo(() => buildStats(allRecords), [allRecords])

  // Filtrado para tabla por programa
  const filteredProgRecords = useMemo(() => {
    return allRecords.filter(r => {
      if (progFacultad !== "all" && r.user.facultad !== progFacultad) return false
      if (progEstamento !== "all" && r.user.estamento !== progEstamento) return false
      if (progEvento !== "all" && r.eventName !== progEvento) return false
      if (progFechaDesde && new Date(r.entry.timestamp) < new Date(progFechaDesde)) return false
      if (progFechaHasta) {
        const hasta = new Date(progFechaHasta); hasta.setHours(23, 59, 59)
        if (new Date(r.entry.timestamp) > hasta) return false
      }
      return true
    })
  }, [allRecords, progFacultad, progEstamento, progEvento, progFechaDesde, progFechaHasta])

  // Filtrado para tabla por facultad
  const filteredFacRecords = useMemo(() => {
    return allRecords.filter(r => {
      if (facEstamento !== "all" && r.user.estamento !== facEstamento) return false
      if (facEvento !== "all" && r.eventName !== facEvento) return false
      if (facFechaDesde && new Date(r.entry.timestamp) < new Date(facFechaDesde)) return false
      if (facFechaHasta) {
        const hasta = new Date(facFechaHasta); hasta.setHours(23, 59, 59)
        if (new Date(r.entry.timestamp) > hasta) return false
      }
      return true
    })
  }, [allRecords, facEstamento, facEvento, facFechaDesde, facFechaHasta])

  const progStats = useMemo(() => buildStats(filteredProgRecords), [filteredProgRecords])
  const facStats = useMemo(() => buildStats(filteredFacRecords), [filteredFacRecords])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4" />
          <p className="text-gray-600">Cargando estadísticas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Estadísticas de Convocatorias</h1>
          <p className="text-gray-600 mt-2">Análisis detallado de participación en convocatorias</p>
        </div>

        {/* Resumen general */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-gray-600">Total Participantes</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-gray-900">{stats.totalParticipants}</div></CardContent>
          </Card>
          <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-gray-600">Mujeres</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-pink-600">{stats.byGender.mujer}</div></CardContent>
          </Card>
          <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-gray-600">Hombres</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-blue-600">{stats.byGender.hombre}</div></CardContent>
          </Card>
          <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-gray-600">Otro</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-purple-600">{stats.byGender.otro}</div></CardContent>
          </Card>
        </div>

        {/* Por convocatoria */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" />Participantes por Convocatoria</CardTitle>
            <CardDescription>Número de inscritos por convocatoria</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(stats.byEvent).length === 0 ? (
              <p className="text-center text-gray-500 py-8">No hay convocatorias con inscripciones registradas</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(stats.byEvent).sort((a, b) => b[1] - a[1]).map(([evento, count]) => (
                  <div key={evento} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-900">{evento}</span>
                    <Badge variant="secondary" className="text-lg px-3 py-1">{count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Por Programa */}
        <Collapsible open={isProgramOpen} onOpenChange={setIsProgramOpen}>
          <Card className="mb-6">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5" />Participantes por Programa Académico</CardTitle>
                    <CardDescription>Distribución por género y programa</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm">{isProgramOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}</Button>
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
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todas" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las facultades</SelectItem>
                        {FACULTADES.map(f => <SelectItem key={f} value={f}>{f.replace("FACULTAD DE ", "")}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Convocatoria</Label>
                    <Select value={progEvento} onValueChange={setProgEvento}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todas" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {eventNames.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Estamento</Label>
                    <Select value={progEstamento} onValueChange={setProgEstamento}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
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
                  {(progFacultad !== "all" || progEstamento !== "all" || progEvento !== "all" || progFechaDesde || progFechaHasta) && (
                    <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{filteredProgRecords.length} registros filtrados</span>
                      <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => { setProgFacultad("all"); setProgEstamento("all"); setProgEvento("all"); setProgFechaDesde(""); setProgFechaHasta("") }}>
                        <X className="h-3 w-3 mr-1" /> Limpiar
                      </Button>
                    </div>
                  )}
                </div>

                {Object.keys(progStats.byProgram).length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No hay datos disponibles</p>
                ) : (
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
                        {Object.entries(progStats.byProgram).sort(([,a],[,b]) => b.total - a.total).map(([prog, data]) => (
                          <TableRow key={prog}>
                            <TableCell className="font-medium">{prog}</TableCell>
                            <TableCell className="text-center"><Badge variant="secondary" className="bg-pink-100 text-pink-800">{data.mujer}</Badge></TableCell>
                            <TableCell className="text-center"><Badge variant="secondary" className="bg-blue-100 text-blue-800">{data.hombre}</Badge></TableCell>
                            <TableCell className="text-center"><Badge variant="secondary" className="bg-purple-100 text-purple-800">{data.otro}</Badge></TableCell>
                            <TableCell className="text-center"><Badge variant="default" className="bg-gray-800 text-white">{data.total}</Badge></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Por Facultad */}
        <Collapsible open={isFacultyOpen} onOpenChange={setIsFacultyOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />Participantes por Facultad</CardTitle>
                    <CardDescription>Distribución por género y facultad</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm">{isFacultyOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}</Button>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                {/* Filtros */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 p-3 bg-gray-50 rounded-lg border">
                  <div className="space-y-1">
                    <Label className="text-xs">Convocatoria</Label>
                    <Select value={facEvento} onValueChange={setFacEvento}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todas" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {eventNames.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Estamento</Label>
                    <Select value={facEstamento} onValueChange={setFacEstamento}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
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
                  {(facEstamento !== "all" || facEvento !== "all" || facFechaDesde || facFechaHasta) && (
                    <div className="sm:col-span-3 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{filteredFacRecords.length} registros filtrados</span>
                      <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => { setFacEstamento("all"); setFacEvento("all"); setFacFechaDesde(""); setFacFechaHasta("") }}>
                        <X className="h-3 w-3 mr-1" /> Limpiar
                      </Button>
                    </div>
                  )}
                </div>

                {Object.keys(facStats.byFaculty).length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No hay datos disponibles</p>
                ) : (
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
                        {Object.entries(facStats.byFaculty).sort(([,a],[,b]) => b.total - a.total).map(([fac, data]) => (
                          <TableRow key={fac}>
                            <TableCell className="font-medium">{fac}</TableCell>
                            <TableCell className="text-center"><Badge variant="secondary" className="bg-pink-100 text-pink-800">{data.mujer}</Badge></TableCell>
                            <TableCell className="text-center"><Badge variant="secondary" className="bg-blue-100 text-blue-800">{data.hombre}</Badge></TableCell>
                            <TableCell className="text-center"><Badge variant="secondary" className="bg-purple-100 text-purple-800">{data.otro}</Badge></TableCell>
                            <TableCell className="text-center"><Badge variant="default" className="bg-gray-800 text-white">{data.total}</Badge></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>
    </div>
  )
}

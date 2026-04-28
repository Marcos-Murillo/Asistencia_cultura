"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Trophy, Users, User, Plus, Trash2, Pencil, Shuffle, Calendar, MapPin,
  ArrowLeft, Copy, CheckCircle, BarChart2, Swords, ChevronRight
} from "lucide-react"
import Link from "next/link"
import {
  getTorneoById, getEquiposByTorneo, createEquipo, updateEquipo, deleteEquipo,
  getInscripcionesByTorneo, getGruposByTorneo, createGruposAleatorios,
  getPartidosByTorneo, createPartido, updatePartido, generarPartidosGrupo,
  generarBracketEliminatorias, updateTorneo, getUserById,
} from "@/lib/db-router"
import type { Torneo, TorneoEquipo, TorneoInscripcion, TorneoGrupo, TorneoPartido, PosicionGrupo, EstadisticasJugador } from "@/lib/types"
import { getCurrentUserRole, isSuperAdmin as checkSuperAdmin, isAdmin as checkAdmin } from "@/lib/auth-helpers"

// Estadísticas por deporte
const STATS_FIELDS: Record<string, { key: keyof EstadisticasJugador; label: string }[]> = {
  futbol: [
    { key: "goles", label: "Goles" }, { key: "asistencias", label: "Asistencias" },
    { key: "tarjetasAmarillas", label: "T. Amarillas" }, { key: "tarjetasRojas", label: "T. Rojas" },
    { key: "minutosJugados", label: "Minutos" },
  ],
  baloncesto: [
    { key: "puntos", label: "Puntos" }, { key: "rebotes", label: "Rebotes" },
    { key: "asistencias", label: "Asistencias" }, { key: "minutosJugados", label: "Minutos" },
  ],
  voleibol: [
    { key: "puntos", label: "Puntos" }, { key: "aces", label: "Aces" },
    { key: "bloqueos", label: "Bloqueos" }, { key: "asistencias", label: "Asistencias" },
  ],
  tenis_mesa: [{ key: "puntosIndividuales", label: "Puntos" }],
  ajedrez: [{ key: "puntosIndividuales", label: "Puntos" }],
  natacion: [{ key: "tiempoSegundos", label: "Tiempo (seg)" }, { key: "posicion", label: "Posición" }],
  atletismo: [{ key: "tiempoSegundos", label: "Tiempo (seg)" }, { key: "posicion", label: "Posición" }],
  otro: [{ key: "puntosIndividuales", label: "Puntos" }],
}

function calcPosiciones(partidos: TorneoPartido[], equipos: string[]): PosicionGrupo[] {
  const map = new Map<string, PosicionGrupo>()
  equipos.forEach(e => map.set(e, { equipoId: e, nombre: e, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0, pts: 0 }))
  partidos.filter(p => p.jugado && p.golesLocal != null && p.golesVisitante != null).forEach(p => {
    const l = map.get(p.local); const v = map.get(p.visitante)
    if (!l || !v) return
    l.pj++; v.pj++; l.gf += p.golesLocal!; l.gc += p.golesVisitante!; v.gf += p.golesVisitante!; v.gc += p.golesLocal!
    if (p.golesLocal! > p.golesVisitante!) { l.pg++; l.pts += 3; v.pp++ }
    else if (p.golesLocal! < p.golesVisitante!) { v.pg++; v.pts += 3; l.pp++ }
    else { l.pe++; v.pe++; l.pts++; v.pts++ }
    l.dg = l.gf - l.gc; v.dg = v.gf - v.gc
  })
  return Array.from(map.values()).sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf)
}

export default function TorneoAdminPage() {
  const params = useParams()
  const torneoId = params.id as string
  const [torneo, setTorneo] = useState<Torneo | null>(null)
  const [equipos, setEquipos] = useState<TorneoEquipo[]>([])
  const [inscripciones, setInscripciones] = useState<TorneoInscripcion[]>([])
  const [grupos, setGrupos] = useState<TorneoGrupo[]>([])
  const [partidos, setPartidos] = useState<TorneoPartido[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [copiedCodigo, setCopiedCodigo] = useState<string | null>(null)

  // Equipo dialog
  const [equipoDialogOpen, setEquipoDialogOpen] = useState(false)
  const [editingEquipo, setEditingEquipo] = useState<TorneoEquipo | null>(null)
  const [equipoNombre, setEquipoNombre] = useState("")
  const [equipoSubmitting, setEquipoSubmitting] = useState(false)

  // Partido dialog
  const [partidoDialogOpen, setPartidoDialogOpen] = useState(false)
  const [editingPartido, setEditingPartido] = useState<TorneoPartido | null>(null)
  const [pLocal, setPLocal] = useState("")
  const [pVisitante, setPVisitante] = useState("")
  const [pFecha, setPFecha] = useState("")
  const [pLugar, setPLugar] = useState("")
  const [pGolesLocal, setPGolesLocal] = useState("")
  const [pGolesVisitante, setPGolesVisitante] = useState("")
  const [pJugado, setPJugado] = useState(false)
  const [pStats, setPStats] = useState<EstadisticasJugador[]>([])
  const [partidoSubmitting, setPartidoSubmitting] = useState(false)

  useEffect(() => {
    setIsAdmin(checkAdmin() || checkSuperAdmin())
    loadAll()
  }, [torneoId])

  async function loadAll() {
    setLoading(true)
    try {
      const [t, eq, ins, gr, pts] = await Promise.all([
        getTorneoById(torneoId),
        getEquiposByTorneo(torneoId),
        getInscripcionesByTorneo(torneoId),
        getGruposByTorneo(torneoId),
        getPartidosByTorneo(torneoId),
      ])
      setTorneo(t); setEquipos(eq); setInscripciones(ins); setGrupos(gr); setPartidos(pts)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  function copyCodigo(codigo: string) {
    navigator.clipboard.writeText(codigo)
    setCopiedCodigo(codigo)
    setTimeout(() => setCopiedCodigo(null), 2000)
  }

  // ── Equipos ──
  function openCreateEquipo() { setEditingEquipo(null); setEquipoNombre(""); setEquipoDialogOpen(true) }
  function openEditEquipo(e: TorneoEquipo) { setEditingEquipo(e); setEquipoNombre(e.nombre); setEquipoDialogOpen(true) }

  async function handleEquipoSubmit() {
    if (!equipoNombre.trim()) return
    setEquipoSubmitting(true)
    try {
      if (editingEquipo) { await updateEquipo(editingEquipo.id, equipoNombre); setSuccess("Equipo actualizado") }
      else { await createEquipo(torneoId, equipoNombre); setSuccess("Equipo creado") }
      setEquipoDialogOpen(false); await loadAll()
    } catch (e) { setError("Error al guardar equipo") } finally { setEquipoSubmitting(false) }
  }

  async function handleDeleteEquipo(id: string) {
    if (!confirm("¿Eliminar este equipo?")) return
    try { await deleteEquipo(id); setSuccess("Equipo eliminado"); await loadAll() }
    catch (e) { setError("Error al eliminar") }
  }

  // ── Grupos ──
  async function handleCrearGrupos() {
    if (!torneo) return
    const participantes = torneo.tipo === "grupal" ? equipos.map(e => e.id) : inscripciones.map(i => i.userId)
    if (participantes.length < 2) { setError("Se necesitan al menos 2 participantes"); return }
    const porGrupo = torneo.equiposPorGrupo || 4
    if (!confirm(`¿Crear grupos de ${porGrupo} participantes aleatoriamente? Esto eliminará los grupos anteriores.`)) return
    try {
      await createGruposAleatorios(torneoId, participantes, porGrupo)
      setSuccess("Grupos creados"); await loadAll()
    } catch (e) { setError("Error al crear grupos") }
  }

  async function handleGenerarPartidosGrupo(grupo: TorneoGrupo) {
    if (!confirm(`¿Generar partidos round-robin para ${grupo.nombre}?`)) return
    try {
      await generarPartidosGrupo(torneoId, grupo.id, grupo.equipos)
      setSuccess("Partidos generados"); await loadAll()
    } catch (e) { setError("Error al generar partidos") }
  }

  // ── Partidos ──
  function openPartidoDialog(p?: TorneoPartido, local?: string, visitante?: string) {
    if (p) {
      setEditingPartido(p); setPLocal(p.local); setPVisitante(p.visitante)
      setPFecha(p.fecha ? p.fecha.toISOString().split("T")[0] : "")
      setPLugar(p.lugar || ""); setPGolesLocal(p.golesLocal?.toString() || "")
      setPGolesVisitante(p.golesVisitante?.toString() || ""); setPJugado(p.jugado)
      setPStats(p.estadisticas || [])
    } else {
      setEditingPartido(null); setPLocal(local || ""); setPVisitante(visitante || "")
      setPFecha(""); setPLugar(""); setPGolesLocal(""); setPGolesVisitante(""); setPJugado(false); setPStats([])
    }
    setPartidoDialogOpen(true)
  }

  async function handlePartidoSubmit() {
    setPartidoSubmitting(true)
    try {
      const data: Partial<TorneoPartido> = {
        local: pLocal, visitante: pVisitante, jugado: pJugado,
        ...(pFecha ? { fecha: new Date(pFecha) } : {}),
        ...(pLugar ? { lugar: pLugar } : {}),
        ...(pJugado && pGolesLocal !== "" ? { golesLocal: parseInt(pGolesLocal) } : {}),
        ...(pJugado && pGolesVisitante !== "" ? { golesVisitante: parseInt(pGolesVisitante) } : {}),
        ...(pStats.length > 0 ? { estadisticas: pStats } : {}),
      }
      if (editingPartido) { await updatePartido(editingPartido.id, data); setSuccess("Partido actualizado") }
      else {
        await createPartido({ torneoId, fase: "grupos", local: pLocal, visitante: pVisitante, jugado: false, ...data } as TorneoPartido)
        setSuccess("Partido creado")
      }
      setPartidoDialogOpen(false); await loadAll()
    } catch (e) { setError("Error al guardar partido") } finally { setPartidoSubmitting(false) }
  }

  async function handleAvanzarFase() {
    if (!torneo) return
    const nextFase = torneo.fase === "inscripcion" ? "grupos" : torneo.fase === "grupos" ? "eliminatorias" : "finalizado"
    if (!confirm(`¿Avanzar a fase: ${nextFase}?`)) return
    try {
      await updateTorneo(torneoId, { fase: nextFase as any })
      if (nextFase === "eliminatorias") {
        // Tomar los 2 primeros de cada grupo como clasificados
        const clasificados: string[] = []
        for (const g of grupos) {
          const pts = calcPosiciones(partidos.filter(p => p.grupoId === g.id), g.equipos)
          clasificados.push(...pts.slice(0, 2).map(p => p.equipoId))
        }
        const fase = clasificados.length <= 4 ? "semifinal" : clasificados.length <= 8 ? "cuartos" : "octavos"
        await generarBracketEliminatorias(torneoId, clasificados, fase)
      }
      setSuccess("Fase actualizada"); await loadAll()
    } catch (e) { setError("Error al avanzar fase") }
  }

  const getNombre = (id: string) => {
    const eq = equipos.find(e => e.id === id)
    return eq ? eq.nombre : id.slice(0, 8)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Cargando torneo...</p></div>
  if (!torneo) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Torneo no encontrado</p></div>

  const statsFields = STATS_FIELDS[torneo.deporte] || STATS_FIELDS.otro
  const partidosGrupos = partidos.filter(p => p.fase === "grupos")
  const partidosElim = partidos.filter(p => p.fase !== "grupos")

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/torneos"><Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Torneos</Button></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Trophy className="h-6 w-6 text-orange-500" />{torneo.nombre}
            </h1>
            <div className="flex flex-wrap gap-2 mt-1 text-sm text-gray-500">
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{torneo.lugar}</span>
              <Badge className={`text-xs ${torneo.tipo === "individual" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                {torneo.tipo === "individual" ? <><User className="h-3 w-3 mr-1" />Individual</> : <><Users className="h-3 w-3 mr-1" />Grupal</>}
              </Badge>
              <Badge variant="outline" className="text-xs">{torneo.fase}</Badge>
            </div>
          </div>
          {isAdmin && torneo.fase !== "finalizado" && (
            <Button size="sm" onClick={handleAvanzarFase} className="bg-orange-600 hover:bg-orange-700 text-white gap-1">
              <ChevronRight className="h-4 w-4" />Avanzar fase
            </Button>
          )}
        </div>

        {success && <Alert className="mb-4 bg-green-50 border-green-200"><AlertDescription className="text-green-800">{success}</AlertDescription></Alert>}
        {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}

        <Tabs defaultValue={isAdmin ? "admin" : "seguimiento"}>
          <TabsList className="mb-4">
            {isAdmin && <TabsTrigger value="admin">Admin</TabsTrigger>}
            <TabsTrigger value="seguimiento">Seguimiento</TabsTrigger>
            <TabsTrigger value="estadisticas">Estadísticas</TabsTrigger>
            {isAdmin && <TabsTrigger value="estadisticas-admin">Estadísticas Admin</TabsTrigger>}
          </TabsList>

          {/* ── TAB ADMIN ── */}
          {isAdmin && (
            <TabsContent value="admin" className="space-y-6">
              {/* Equipos (solo grupal) */}
              {torneo.tipo === "grupal" && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Equipos ({equipos.length})</CardTitle>
                      <Button size="sm" onClick={openCreateEquipo} className="gap-1"><Plus className="h-4 w-4" />Nuevo equipo</Button>
                    </div>
                    <CardDescription>Cada equipo recibe un código único para que los jugadores se inscriban.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {equipos.length === 0 ? <p className="text-sm text-gray-500">No hay equipos creados.</p> : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {equipos.map(eq => (
                          <div key={eq.id} className="border rounded-lg p-3 bg-white flex items-center justify-between gap-2">
                            <div>
                              <p className="font-medium text-sm">{eq.nombre}</p>
                              <div className="flex items-center gap-1 mt-1">
                                <code className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-mono">{eq.codigo}</code>
                                <button onClick={() => copyCodigo(eq.codigo)} className="text-gray-400 hover:text-gray-600">
                                  {copiedCodigo === eq.codigo ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                                </button>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => openEditEquipo(eq)}><Pencil className="h-3 w-3" /></Button>
                              <Button size="sm" variant="destructive" className="h-7 px-2" onClick={() => handleDeleteEquipo(eq.id)}><Trash2 className="h-3 w-3" /></Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Inscritos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />Inscritos ({inscripciones.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {inscripciones.length === 0 ? <p className="text-sm text-gray-500">Nadie inscrito aún.</p> : (
                    <div className="text-sm text-gray-600 space-y-1">
                      {inscripciones.map(i => (
                        <div key={i.id} className="flex items-center gap-2 py-1 border-b last:border-0">
                          <User className="h-3 w-3 text-gray-400" />
                          <span>{i.userId.slice(0, 12)}...</span>
                          {i.equipoId && <Badge variant="outline" className="text-xs">{equipos.find(e => e.id === i.equipoId)?.nombre || i.equipoId}</Badge>}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Fase de grupos */}
              {(torneo.fase === "grupos" || torneo.fase === "eliminatorias" || torneo.fase === "finalizado") && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2"><Shuffle className="h-5 w-5" />Fase de Grupos</CardTitle>
                      {torneo.fase === "grupos" && (
                        <Button size="sm" onClick={handleCrearGrupos} variant="outline" className="gap-1">
                          <Shuffle className="h-4 w-4" />Regenerar grupos
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {grupos.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500 mb-3">No hay grupos generados.</p>
                        <Button onClick={handleCrearGrupos} className="gap-1 bg-orange-600 hover:bg-orange-700">
                          <Shuffle className="h-4 w-4" />Crear grupos aleatorios
                        </Button>
                      </div>
                    ) : grupos.map(g => {
                      const gPartidos = partidosGrupos.filter(p => p.grupoId === g.id)
                      return (
                        <div key={g.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold">{g.nombre}</h3>
                            {gPartidos.length === 0 && (
                              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleGenerarPartidosGrupo(g)}>
                                <Swords className="h-3 w-3" />Generar partidos
                              </Button>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1 mb-3">
                            {g.equipos.map(e => <Badge key={e} variant="secondary" className="text-xs">{getNombre(e)}</Badge>)}
                          </div>
                          {gPartidos.length > 0 && (
                            <div className="space-y-2">
                              {gPartidos.map(p => (
                                <div key={p.id} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2 text-sm">
                                  <span className="font-medium">{getNombre(p.local)}</span>
                                  <div className="flex items-center gap-2">
                                    {p.jugado ? (
                                      <span className="font-bold text-orange-600">{p.golesLocal} - {p.golesVisitante}</span>
                                    ) : (
                                      <span className="text-gray-400 text-xs">{p.fecha ? p.fecha.toLocaleDateString("es-CO") : "Sin fecha"}</span>
                                    )}
                                    <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={() => openPartidoDialog(p)}>
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  <span className="font-medium">{getNombre(p.visitante)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Bracket eliminatorias */}
              {(torneo.fase === "eliminatorias" || torneo.fase === "finalizado") && partidosElim.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5" />Eliminatorias</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {["octavos", "cuartos", "semifinal", "tercer_puesto", "final"].map(fase => {
                        const fps = partidosElim.filter(p => p.fase === fase)
                        if (fps.length === 0) return null
                        return (
                          <div key={fase}>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{fase.replace("_", " ")}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {fps.map(p => (
                                <div key={p.id} className="flex items-center justify-between border rounded px-3 py-2 bg-white text-sm">
                                  <span className="font-medium">{getNombre(p.local)}</span>
                                  <div className="flex items-center gap-2">
                                    {p.jugado ? <span className="font-bold text-orange-600">{p.golesLocal} - {p.golesVisitante}</span> : <span className="text-gray-400 text-xs">vs</span>}
                                    <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={() => openPartidoDialog(p)}><Pencil className="h-3 w-3" /></Button>
                                  </div>
                                  <span className="font-medium">{getNombre(p.visitante)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}

          {/* ── TAB SEGUIMIENTO ── */}
          <TabsContent value="seguimiento" className="space-y-6">
            {grupos.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-gray-500">El torneo aún no tiene grupos generados.</CardContent></Card>
            ) : grupos.map(g => {
              const gPartidos = partidosGrupos.filter(p => p.grupoId === g.id)
              const posiciones = calcPosiciones(gPartidos, g.equipos)
              return (
                <Card key={g.id}>
                  <CardHeader><CardTitle>{g.nombre}</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead><TableHead>Equipo</TableHead>
                          <TableHead className="text-center">PJ</TableHead><TableHead className="text-center">PG</TableHead>
                          <TableHead className="text-center">PE</TableHead><TableHead className="text-center">PP</TableHead>
                          <TableHead className="text-center">GF</TableHead><TableHead className="text-center">GC</TableHead>
                          <TableHead className="text-center">DG</TableHead><TableHead className="text-center font-bold">PTS</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {posiciones.map((p, i) => (
                          <TableRow key={p.equipoId} className={i < 2 ? "bg-green-50" : ""}>
                            <TableCell className="font-bold text-gray-500">{i + 1}</TableCell>
                            <TableCell className="font-medium">{getNombre(p.equipoId)}</TableCell>
                            <TableCell className="text-center">{p.pj}</TableCell><TableCell className="text-center">{p.pg}</TableCell>
                            <TableCell className="text-center">{p.pe}</TableCell><TableCell className="text-center">{p.pp}</TableCell>
                            <TableCell className="text-center">{p.gf}</TableCell><TableCell className="text-center">{p.gc}</TableCell>
                            <TableCell className="text-center">{p.dg > 0 ? `+${p.dg}` : p.dg}</TableCell>
                            <TableCell className="text-center font-bold text-orange-600">{p.pts}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="space-y-1">
                      {gPartidos.map(p => (
                        <div key={p.id} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                          <span>{getNombre(p.local)}</span>
                          <span className={`font-bold ${p.jugado ? "text-orange-600" : "text-gray-400"}`}>
                            {p.jugado ? `${p.golesLocal} - ${p.golesVisitante}` : p.fecha ? p.fecha.toLocaleDateString("es-CO") : "Por jugar"}
                          </span>
                          <span>{getNombre(p.visitante)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            {/* Bracket */}
            {partidosElim.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-orange-500" />Eliminatorias</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {["octavos", "cuartos", "semifinal", "tercer_puesto", "final"].map(fase => {
                      const fps = partidosElim.filter(p => p.fase === fase)
                      if (fps.length === 0) return null
                      return (
                        <div key={fase}>
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{fase.replace("_", " ")}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {fps.map(p => (
                              <div key={p.id} className={`flex items-center justify-between border-2 rounded-lg px-4 py-3 ${p.jugado ? "border-orange-300 bg-orange-50" : "border-gray-200 bg-white"}`}>
                                <div className="text-center">
                                  <p className="font-semibold text-sm">{getNombre(p.local)}</p>
                                  {p.jugado && <p className="text-2xl font-bold text-orange-600">{p.golesLocal}</p>}
                                </div>
                                <span className="text-gray-400 font-bold">VS</span>
                                <div className="text-center">
                                  <p className="font-semibold text-sm">{getNombre(p.visitante)}</p>
                                  {p.jugado && <p className="text-2xl font-bold text-orange-600">{p.golesVisitante}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── TAB ESTADÍSTICAS ── */}
          <TabsContent value="estadisticas" className="space-y-4">
            {partidos.filter(p => p.jugado && p.estadisticas && p.estadisticas.length > 0).length === 0 ? (
              <Card><CardContent className="py-12 text-center text-gray-500">No hay estadísticas registradas aún.</CardContent></Card>
            ) : (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><BarChart2 className="h-5 w-5" />Estadísticas del Torneo</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Jugador</TableHead>
                        {statsFields.map(f => <TableHead key={f.key} className="text-center">{f.label}</TableHead>)}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        const agg = new Map<string, EstadisticasJugador>()
                        partidos.filter(p => p.estadisticas).forEach(p => {
                          p.estadisticas!.forEach(s => {
                            const prev = agg.get(s.userId) || { userId: s.userId }
                            statsFields.forEach(f => {
                              const k = f.key as keyof EstadisticasJugador
                              if (s[k] != null) (prev as any)[k] = ((prev as any)[k] || 0) + (s[k] as number)
                            })
                            agg.set(s.userId, prev)
                          })
                        })
                        return Array.from(agg.values()).map(s => (
                          <TableRow key={s.userId}>
                            <TableCell className="font-medium">{s.userId.slice(0, 10)}...</TableCell>
                            {statsFields.map(f => <TableCell key={f.key} className="text-center">{(s as any)[f.key] ?? "-"}</TableCell>)}
                          </TableRow>
                        ))
                      })()}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── TAB ESTADÍSTICAS ADMIN ── */}
          {isAdmin && (
            <TabsContent value="estadisticas-admin" className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Resumen del Torneo</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Inscritos", value: inscripciones.length },
                      { label: torneo.tipo === "grupal" ? "Equipos" : "Participantes", value: torneo.tipo === "grupal" ? equipos.length : inscripciones.length },
                      { label: "Grupos", value: grupos.length },
                      { label: "Partidos jugados", value: partidos.filter(p => p.jugado).length },
                    ].map(s => (
                      <div key={s.label} className="text-center p-4 bg-orange-50 rounded-lg">
                        <p className="text-2xl font-bold text-orange-600">{s.value}</p>
                        <p className="text-sm text-gray-600">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* Dialog equipo */}
        <Dialog open={equipoDialogOpen} onOpenChange={setEquipoDialogOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle>{editingEquipo ? "Editar Equipo" : "Nuevo Equipo"}</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label>Nombre del equipo *</Label>
                <Input value={equipoNombre} onChange={e => setEquipoNombre(e.target.value)} placeholder="Ej: Los Tigres" />
              </div>
              {editingEquipo && (
                <div className="flex items-center gap-2 p-2 bg-orange-50 rounded">
                  <span className="text-sm text-gray-600">Código:</span>
                  <code className="font-mono text-orange-700 font-bold">{editingEquipo.codigo}</code>
                </div>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setEquipoDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleEquipoSubmit} disabled={equipoSubmitting} className="bg-orange-600 hover:bg-orange-700">
                {equipoSubmitting ? "Guardando..." : editingEquipo ? "Guardar" : "Crear"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog partido */}
        <Dialog open={partidoDialogOpen} onOpenChange={setPartidoDialogOpen}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingPartido ? "Editar Partido" : "Nuevo Partido"}</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Fecha</Label><Input type="date" value={pFecha} onChange={e => setPFecha(e.target.value)} /></div>
                <div className="space-y-1"><Label>Lugar</Label><Input value={pLugar} onChange={e => setPLugar(e.target.value)} placeholder="Cancha..." /></div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="jugado" checked={pJugado} onChange={e => setPJugado(e.target.checked)} />
                <Label htmlFor="jugado">Partido jugado</Label>
              </div>
              {pJugado && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>{getNombre(pLocal)} (local)</Label>
                    <Input type="number" min={0} value={pGolesLocal} onChange={e => setPGolesLocal(e.target.value)} placeholder="0" />
                  </div>
                  <div className="space-y-1">
                    <Label>{getNombre(pVisitante)} (visitante)</Label>
                    <Input type="number" min={0} value={pGolesVisitante} onChange={e => setPGolesVisitante(e.target.value)} placeholder="0" />
                  </div>
                </div>
              )}
              {pJugado && statsFields.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Estadísticas por jugador</Label>
                  <p className="text-xs text-gray-500">Agrega las estadísticas de cada jugador que participó.</p>
                  {pStats.map((s, idx) => (
                    <div key={idx} className="border rounded p-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <Input className="h-7 text-xs flex-1 mr-2" placeholder="ID o nombre del jugador" value={s.userId} onChange={e => { const n = [...pStats]; n[idx].userId = e.target.value; setPStats(n) }} />
                        <button onClick={() => setPStats(prev => prev.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        {statsFields.map(f => (
                          <div key={f.key} className="space-y-0.5">
                            <Label className="text-xs">{f.label}</Label>
                            <Input className="h-7 text-xs" type="number" min={0} value={(s as any)[f.key] ?? ""} onChange={e => { const n = [...pStats]; (n[idx] as any)[f.key] = e.target.value ? parseInt(e.target.value) : undefined; setPStats(n) }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <Button size="sm" variant="outline" className="w-full gap-1 text-xs" onClick={() => setPStats(prev => [...prev, { userId: "" }])}>
                    <Plus className="h-3 w-3" />Agregar jugador
                  </Button>
                </div>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setPartidoDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handlePartidoSubmit} disabled={partidoSubmitting} className="bg-orange-600 hover:bg-orange-700">
                {partidoSubmitting ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

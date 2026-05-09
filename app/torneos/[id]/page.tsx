"use client"

import { useState, useEffect } from "react"
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
import {
  Trophy, Users, User, Plus, Trash2, Pencil, Shuffle,
  ArrowLeft, Copy, CheckCircle, BarChart2, Swords, ChevronRight,
  MapPin, History, Search
} from "lucide-react"
import Link from "next/link"
import {
  getTorneoById, getEquiposByTorneo, createEquipo, updateEquipo, deleteEquipo,
  getInscripcionesByTorneo, getGruposByTorneo, createGruposAleatorios,
  getPartidosByTorneo, createPartido, updatePartido, generarPartidosGrupo,
  generarBracketEliminatorias, updateTorneo, getUserNamesByIds,
} from "@/lib/db-router"
import type { Torneo, TorneoEquipo, TorneoInscripcion, TorneoGrupo, TorneoPartido, PosicionGrupo, EstadisticasJugador } from "@/lib/types"
import { isSuperAdmin as checkSuperAdmin, isAdmin as checkAdmin } from "@/lib/auth-helpers"

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

// Orden de fases para saber cuáles ya pasaron
const FASE_ORDER = ["inscripcion", "grupos", "eliminatorias", "finalizado"]
function fasePasada(torneoFase: string, fase: string): boolean {
  return FASE_ORDER.indexOf(torneoFase) > FASE_ORDER.indexOf(fase)
}

export default function TorneoAdminPage() {
  const params = useParams()
  const torneoId = params.id as string
  const [torneo, setTorneo] = useState<Torneo | null>(null)
  const [equipos, setEquipos] = useState<TorneoEquipo[]>([])
  const [inscripciones, setInscripciones] = useState<TorneoInscripcion[]>([])
  const [grupos, setGrupos] = useState<TorneoGrupo[]>([])
  const [partidos, setPartidos] = useState<TorneoPartido[]>([])
  const [userNames, setUserNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [copiedCodigo, setCopiedCodigo] = useState<string | null>(null)
  const [mostrarAnteriores, setMostrarAnteriores] = useState(false)

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
  const [pStatsFilter, setPStatsFilter] = useState("")
  const [partidoSubmitting, setPartidoSubmitting] = useState(false)

  useEffect(() => {
    setIsAdmin(checkAdmin() || checkSuperAdmin())
    loadAll()
  }, [torneoId])

  async function loadAll() {
    setLoading(true)
    try {
      const [t, eq, ins, gr, pts] = await Promise.all([
        getTorneoById(torneoId), getEquiposByTorneo(torneoId),
        getInscripcionesByTorneo(torneoId), getGruposByTorneo(torneoId),
        getPartidosByTorneo(torneoId),
      ])
      setTorneo(t); setEquipos(eq); setInscripciones(ins); setGrupos(gr); setPartidos(pts)
      const names = await getUserNamesByIds(ins.map(i => i.userId))
      setUserNames(names)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  function copyCodigo(codigo: string) {
    navigator.clipboard.writeText(codigo)
    setCopiedCodigo(codigo)
    setTimeout(() => setCopiedCodigo(null), 2000)
  }

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

  async function handleCrearGrupos() {
    if (!torneo) return
    const participantes = torneo.tipo === "grupal" ? equipos.map(e => e.id) : inscripciones.map(i => i.userId)
    if (participantes.length < 2) { setError("Se necesitan al menos 2 participantes"); return }
    const porGrupo = torneo.equiposPorGrupo || 4
    if (!confirm(`¿Crear grupos de ${porGrupo} participantes aleatoriamente? Esto eliminará los grupos anteriores.`)) return
    try { await createGruposAleatorios(torneoId, participantes, porGrupo); setSuccess("Grupos creados"); await loadAll() }
    catch (e) { setError("Error al crear grupos") }
  }

  async function handleGenerarPartidosGrupo(grupo: TorneoGrupo) {
    if (!confirm(`¿Generar partidos round-robin para ${grupo.nombre}?`)) return
    try { await generarPartidosGrupo(torneoId, grupo.id, grupo.equipos); setSuccess("Partidos generados"); await loadAll() }
    catch (e) { setError("Error al generar partidos") }
  }

  function openPartidoDialog(p?: TorneoPartido, local?: string, visitante?: string) {
    setPStatsFilter("")
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

  const getNombre = (id: string) => equipos.find(e => e.id === id)?.nombre ?? id.slice(0, 8)

  // Jugadores de los dos equipos del partido actual (para estadísticas)
  function getJugadoresPartido(localId: string, visitanteId: string) {
    const equipoIds = [localId, visitanteId]
    return inscripciones
      .filter(i => i.equipoId && equipoIds.includes(i.equipoId))
      .map(i => ({ userId: i.userId, nombre: userNames[i.userId] || i.userId, equipo: getNombre(i.equipoId!) }))
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Cargando torneo...</p></div>
  if (!torneo) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Torneo no encontrado</p></div>

  const statsFields = STATS_FIELDS[torneo.deporte] || STATS_FIELDS.otro
  const partidosGrupos = partidos.filter(p => p.fase === "grupos")
  const partidosElim = partidos.filter(p => p.fase !== "grupos")
  const gruposPasados = fasePasada(torneo.fase, "grupos")
  const elimPasados = fasePasada(torneo.fase, "eliminatorias")

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
          <div className="flex items-center gap-2">
            {(gruposPasados || elimPasados) && (
              <Button size="sm" variant="outline" onClick={() => setMostrarAnteriores(v => !v)} className="gap-1 text-gray-600">
                <History className="h-4 w-4" />{mostrarAnteriores ? "Ocultar anteriores" : "Resultados anteriores"}
              </Button>
            )}
            {isAdmin && torneo.fase !== "finalizado" && (
              <Button size="sm" onClick={handleAvanzarFase} className="bg-orange-600 hover:bg-orange-700 text-white gap-1">
                <ChevronRight className="h-4 w-4" />Avanzar fase
              </Button>
            )}
          </div>
        </div>

        {success && <Alert className="mb-4 bg-green-50 border-green-200"><AlertDescription className="text-green-800">{success}</AlertDescription></Alert>}
        {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}

        <Tabs defaultValue={isAdmin ? "admin" : "seguimiento"}>
          <TabsList className="mb-4">
            {isAdmin && <TabsTrigger value="admin">Admin</TabsTrigger>}
            <TabsTrigger value="seguimiento">Seguimiento</TabsTrigger>
            <TabsTrigger value="estadisticas">Estadísticas</TabsTrigger>
            {isAdmin && <TabsTrigger value="estadisticas-admin">Resumen</TabsTrigger>}
          </TabsList>

          {/* ── TAB ADMIN ── */}
          {isAdmin && (
            <TabsContent value="admin" className="space-y-6">
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
                  <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />Inscritos ({inscripciones.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {inscripciones.length === 0 ? <p className="text-sm text-gray-500">Nadie inscrito aún.</p> : torneo.tipo === "grupal" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {equipos.map(eq => {
                        const miembros = inscripciones.filter(i => i.equipoId === eq.id)
                        return (
                          <div key={eq.id} className="border rounded-lg p-3 bg-white space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-sm text-orange-800">{eq.nombre}</p>
                              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">{miembros.length} inscrito{miembros.length !== 1 ? "s" : ""}</span>
                            </div>
                            {miembros.length === 0 ? <p className="text-xs text-gray-400 italic">Sin inscritos</p> : (
                              <ul className="space-y-1">
                                {miembros.map((i, idx) => (
                                  <li key={i.id} className="text-xs text-gray-700 flex items-center gap-1.5">
                                    <span className="w-4 h-4 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-[10px] font-bold shrink-0">{idx + 1}</span>
                                    {userNames[i.userId] || i.userId.slice(0, 10) + "..."}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600 space-y-1">
                      {inscripciones.map((i, idx) => (
                        <div key={i.id} className="flex items-center gap-2 py-1 border-b last:border-0">
                          <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-[10px] font-bold shrink-0">{idx + 1}</span>
                          <span>{userNames[i.userId] || i.userId.slice(0, 12) + "..."}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Fase de grupos — oculta si ya pasó, salvo mostrarAnteriores */}
              {(torneo.fase === "grupos" || (gruposPasados && mostrarAnteriores)) && (
                <Card className={gruposPasados ? "opacity-75 border-dashed" : ""}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Shuffle className="h-5 w-5" />Fase de Grupos
                        {gruposPasados && <Badge variant="outline" className="text-xs text-gray-400">Fase anterior</Badge>}
                      </CardTitle>
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
                        <Button onClick={handleCrearGrupos} className="gap-1 bg-orange-600 hover:bg-orange-700"><Shuffle className="h-4 w-4" />Crear grupos aleatorios</Button>
                      </div>
                    ) : grupos.map(g => {
                      const gPartidos = partidosGrupos.filter(p => p.grupoId === g.id)
                      return (
                        <div key={g.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold">{g.nombre}</h3>
                            {gPartidos.length === 0 && torneo.fase === "grupos" && (
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
                                    {p.jugado ? <span className="font-bold text-orange-600">{p.golesLocal} - {p.golesVisitante}</span>
                                      : <span className="text-gray-400 text-xs">{p.fecha ? p.fecha.toLocaleDateString("es-CO") : "Sin fecha"}</span>}
                                    {!gruposPasados && <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={() => openPartidoDialog(p)}><Pencil className="h-3 w-3" /></Button>}
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

              {/* Eliminatorias — oculta si ya pasó, salvo mostrarAnteriores */}
              {((torneo.fase === "eliminatorias") || (elimPasados && mostrarAnteriores)) && partidosElim.length > 0 && (
                <Card className={elimPasados ? "opacity-75 border-dashed" : ""}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5" />Eliminatorias
                      {elimPasados && <Badge variant="outline" className="text-xs text-gray-400">Fase anterior</Badge>}
                    </CardTitle>
                  </CardHeader>
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
                                    {!elimPasados && <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={() => openPartidoDialog(p)}><Pencil className="h-3 w-3" /></Button>}
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
            {/* Fase de grupos — oculta si ya pasó */}
            {(!gruposPasados || mostrarAnteriores) && grupos.length > 0 && (
              <div className="space-y-4">
                {gruposPasados && <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Fase de grupos (anterior)</p>}
                {grupos.map(g => {
                  const gPartidos = partidosGrupos.filter(p => p.grupoId === g.id)
                  const posiciones = calcPosiciones(gPartidos, g.equipos)
                  return (
                    <Card key={g.id} className={gruposPasados ? "opacity-75" : ""}>
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
                            <div key={p.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                              <span className="flex-1 text-right pr-3">{getNombre(p.local)}</span>
                              <div className="text-center min-w-[100px]">
                                <span className={`font-bold ${p.jugado ? "text-orange-600" : "text-gray-400"}`}>
                                  {p.jugado ? `${p.golesLocal} - ${p.golesVisitante}` : p.fecha ? p.fecha.toLocaleDateString("es-CO") : "Por jugar"}
                                </span>
                                {(p.fecha || p.lugar) && !p.jugado && (
                                  <div className="flex items-center justify-center gap-2 mt-0.5 text-xs text-gray-400">
                                    {p.lugar && <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{p.lugar}</span>}
                                  </div>
                                )}
                                {p.jugado && p.lugar && (
                                  <div className="text-xs text-gray-400 flex items-center justify-center gap-0.5 mt-0.5">
                                    <MapPin className="h-2.5 w-2.5" />{p.lugar}
                                  </div>
                                )}
                              </div>
                              <span className="flex-1 pl-3">{getNombre(p.visitante)}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            {grupos.length === 0 && !partidosElim.length && (
              <Card><CardContent className="py-12 text-center text-gray-500">El torneo aún no tiene grupos generados.</CardContent></Card>
            )}

            {/* Eliminatorias */}
            {(!elimPasados || mostrarAnteriores) && partidosElim.length > 0 && (
              <Card className={elimPasados ? "opacity-75" : ""}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-orange-500" />Eliminatorias
                    {elimPasados && <Badge variant="outline" className="text-xs text-gray-400">Fase anterior</Badge>}
                  </CardTitle>
                </CardHeader>
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
                              <div key={p.id} className={`border-2 rounded-lg px-4 py-3 ${p.jugado ? "border-orange-300 bg-orange-50" : "border-gray-200 bg-white"}`}>
                                <div className="flex items-center justify-between">
                                  <div className="text-center flex-1">
                                    <p className="font-semibold text-sm">{getNombre(p.local)}</p>
                                    {p.jugado && <p className="text-2xl font-bold text-orange-600">{p.golesLocal}</p>}
                                  </div>
                                  <div className="text-center px-2">
                                    <span className="text-gray-400 font-bold text-sm">VS</span>
                                    {(p.fecha || p.lugar) && (
                                      <div className="text-xs text-gray-400 mt-1 space-y-0.5">
                                        {p.fecha && <p>{p.fecha.toLocaleDateString("es-CO")}</p>}
                                        {p.lugar && <p className="flex items-center gap-0.5 justify-center"><MapPin className="h-2.5 w-2.5" />{p.lugar}</p>}
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-center flex-1">
                                    <p className="font-semibold text-sm">{getNombre(p.visitante)}</p>
                                    {p.jugado && <p className="text-2xl font-bold text-orange-600">{p.golesVisitante}</p>}
                                  </div>
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
                        <TableHead>Equipo</TableHead>
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
                        return Array.from(agg.values()).map(s => {
                          const insc = inscripciones.find(i => i.userId === s.userId)
                          const equipoNombre = insc?.equipoId ? getNombre(insc.equipoId) : "-"
                          return (
                            <TableRow key={s.userId}>
                              <TableCell className="font-medium">{userNames[s.userId] || s.userId.slice(0, 10) + "..."}</TableCell>
                              <TableCell className="text-sm text-gray-500">{equipoNombre}</TableCell>
                              {statsFields.map(f => <TableCell key={f.key} className="text-center">{(s as any)[f.key] ?? "-"}</TableCell>)}
                            </TableRow>
                          )
                        })
                      })()}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── TAB RESUMEN ADMIN ── */}
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
                  {/* Filtro de jugadores */}
                  <div className="relative">
                    <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-gray-400" />
                    <Input
                      className="pl-7 h-8 text-xs"
                      placeholder="Buscar jugador..."
                      value={pStatsFilter}
                      onChange={e => setPStatsFilter(e.target.value)}
                    />
                  </div>
                  {/* Lista de jugadores de los dos equipos */}
                  <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                    {getJugadoresPartido(pLocal, pVisitante)
                      .filter(j => j.nombre.toLowerCase().includes(pStatsFilter.toLowerCase()))
                      .map(j => {
                        const statIdx = pStats.findIndex(s => s.userId === j.userId)
                        const stat = statIdx >= 0 ? pStats[statIdx] : null
                        return (
                          <div key={j.userId} className="p-2 space-y-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs font-medium">{j.nombre}</p>
                                <p className="text-[10px] text-gray-400">{j.equipo}</p>
                              </div>
                              {!stat ? (
                                <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={() => setPStats(prev => [...prev, { userId: j.userId }])}>
                                  + Agregar
                                </Button>
                              ) : (
                                <button className="text-xs text-red-400 hover:text-red-600" onClick={() => setPStats(prev => prev.filter(s => s.userId !== j.userId))}>
                                  Quitar
                                </button>
                              )}
                            </div>
                            {stat && (
                              <div className="grid grid-cols-3 gap-1">
                                {statsFields.map(f => (
                                  <div key={f.key} className="space-y-0.5">
                                    <p className="text-[10px] text-gray-500">{f.label}</p>
                                    <Input
                                      type="number" min={0}
                                      className="h-6 text-xs px-1"
                                      value={(stat as any)[f.key] ?? ""}
                                      onChange={e => {
                                        const val = e.target.value === "" ? undefined : parseInt(e.target.value)
                                        setPStats(prev => prev.map(s => s.userId === j.userId ? { ...s, [f.key]: val } : s))
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    {getJugadoresPartido(pLocal, pVisitante).filter(j => j.nombre.toLowerCase().includes(pStatsFilter.toLowerCase())).length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-3">No se encontraron jugadores</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setPartidoDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handlePartidoSubmit} disabled={partidoSubmitting} className="bg-orange-600 hover:bg-orange-700">
                {partidoSubmitting ? "Guardando..." : editingPartido ? "Guardar" : "Crear"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

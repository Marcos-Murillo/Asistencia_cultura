"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ExcelColumnSelector, type ExcelColumn } from "@/components/excel-column-selector"
import * as XLSX from "xlsx"
import { Plus, Trash2, Pencil, Search, Users, Calendar, X, ListChecks, BarChart2, ChevronRight } from "lucide-react"
import { useArea } from "@/contexts/area-context"
import {
  getAllCulturalGroups, getGroupEnrolledUsersRouter,
  createRepresentacion, getAllRepresentaciones, updateRepresentacion, deleteRepresentacion,
  type Representacion, type RepresentacionMember,
} from "@/lib/db-router"
import { GRUPOS_DEPORTIVOS } from "@/lib/deporte-groups"
import { ESTAMENTOS, FACULTADES } from "@/lib/data"
import type { UserProfile } from "@/lib/types"
import { formatNombre } from "@/lib/utils"

type EnrolledUser = UserProfile & { fechaInscripcion: Date }

// Sub-lista por grupo dentro del wizard
interface SubLista { grupo: string; miembros: RepresentacionMember[] }

function StatBar({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-40 truncate text-gray-600">{label}</span>
      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 text-right text-gray-700 font-medium">{pct}%</span>
      <span className="text-gray-400">({value})</span>
    </div>
  )
}

export default function RepresentacionesPage() {
  const { area } = useArea()
  const [representaciones, setRepresentaciones] = useState<Representacion[]>([])
  const [loading, setLoading] = useState(true)
  const [grupos, setGrupos] = useState<string[]>([])
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  // ── Wizard: crear evento con múltiples sub-listas ──
  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardNombre, setWizardNombre] = useState("")
  const [wizardFecha, setWizardFecha] = useState("")
  const [subListas, setSubListas] = useState<SubLista[]>([])
  // Sub-lista activa en edición
  const [activeGrupo, setActiveGrupo] = useState("")
  const [enrolledUsers, setEnrolledUsers] = useState<EnrolledUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [userSearch, setUserSearch] = useState("")
  const [activeMembers, setActiveMembers] = useState<RepresentacionMember[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ── Edit single lista ──
  const [editingRep, setEditingRep] = useState<Representacion | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editGrupo, setEditGrupo] = useState("")
  const [editEnrolled, setEditEnrolled] = useState<EnrolledUser[]>([])
  const [editLoadingUsers, setEditLoadingUsers] = useState(false)
  const [editMembers, setEditMembers] = useState<RepresentacionMember[]>([])
  const [editUserSearch, setEditUserSearch] = useState("")
  const [editSubmitting, setEditSubmitting] = useState(false)

  // ── View dialog ──
  const [viewingRep, setViewingRep] = useState<Representacion | null>(null)
  const [viewSearch, setViewSearch] = useState("")
  const [viewFacultad, setViewFacultad] = useState("all")
  const [viewEstamento, setViewEstamento] = useState("all")

  useEffect(() => { if (!area) return; loadGrupos(); loadRepresentaciones() }, [area])

  async function loadGrupos() {
    try {
      const grps = area === "deporte"
        ? [...GRUPOS_DEPORTIVOS].sort()
        : (await getAllCulturalGroups(area)).filter(g => g.activo).map(g => g.nombre).sort()
      setGrupos(grps)
    } catch (e) { console.error(e) }
  }

  async function loadRepresentaciones() {
    setLoading(true)
    try { setRepresentaciones(await getAllRepresentaciones(area)) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  // ── Wizard helpers ──
  async function handleActiveGrupoChange(g: string) {
    setActiveGrupo(g)
    setUserSearch("")
    // Preserve members if switching back to same group
    const existing = subListas.find(s => s.grupo === g)
    setActiveMembers(existing?.miembros || [])
    if (!g) return
    setLoadingUsers(true)
    try { setEnrolledUsers(await getGroupEnrolledUsersRouter(area, g)) }
    catch (e) { console.error(e) }
    finally { setLoadingUsers(false) }
  }

  function toggleActiveMember(u: EnrolledUser) {
    setActiveMembers(prev => {
      const exists = prev.find(m => m.userId === u.id)
      if (exists) return prev.filter(m => m.userId !== u.id)
      return [...prev, {
        userId: u.id, nombres: u.nombres, numeroDocumento: u.numeroDocumento,
        genero: u.genero, estamento: u.estamento, grupoCultural: activeGrupo,
        ...(u.facultad ? { facultad: u.facultad } : {}),
        ...(u.programaAcademico ? { programaAcademico: u.programaAcademico } : {}),
      }]
    })
  }

  function saveSubLista() {
    if (!activeGrupo || activeMembers.length === 0) {
      setError("Selecciona un grupo y al menos un integrante.")
      return
    }
    setError("")
    setSubListas(prev => {
      const idx = prev.findIndex(s => s.grupo === activeGrupo)
      if (idx >= 0) { const n = [...prev]; n[idx] = { grupo: activeGrupo, miembros: activeMembers }; return n }
      return [...prev, { grupo: activeGrupo, miembros: activeMembers }]
    })
    setActiveGrupo(""); setActiveMembers([]); setEnrolledUsers([])
  }

  function openWizard() {
    setWizardNombre(""); setWizardFecha(""); setSubListas([])
    setActiveGrupo(""); setActiveMembers([]); setEnrolledUsers([])
    setError(""); setWizardOpen(true)
  }

  async function handleWizardSubmit() {
    if (!wizardNombre || !wizardFecha) { setError("Completa el nombre y la fecha del evento."); return }
    if (subListas.length === 0) { setError("Agrega al menos una lista de grupo."); return }
    setIsSubmitting(true)
    try {
      await Promise.all(subListas.map(sl =>
        createRepresentacion(area, { nombre: wizardNombre, fechaEvento: wizardFecha, grupoCultural: sl.grupo, miembros: sl.miembros, area })
      ))
      setSuccess(`Evento "${wizardNombre}" creado con ${subListas.length} lista(s)`)
      setWizardOpen(false)
      await loadRepresentaciones()
    } catch (e) { setError("Error al guardar.") }
    finally { setIsSubmitting(false) }
  }

  // ── Edit helpers ──
  async function openEdit(rep: Representacion) {
    setEditingRep(rep); setEditGrupo(rep.grupoCultural); setEditMembers(rep.miembros)
    setEditUserSearch(""); setEditDialogOpen(true); setEditLoadingUsers(true)
    try { setEditEnrolled(await getGroupEnrolledUsersRouter(area, rep.grupoCultural)) }
    catch (e) { console.error(e) }
    finally { setEditLoadingUsers(false) }
  }

  function toggleEditMember(u: EnrolledUser) {
    setEditMembers(prev => {
      const exists = prev.find(m => m.userId === u.id)
      if (exists) return prev.filter(m => m.userId !== u.id)
      return [...prev, {
        userId: u.id, nombres: u.nombres, numeroDocumento: u.numeroDocumento,
        genero: u.genero, estamento: u.estamento, grupoCultural: editGrupo,
        ...(u.facultad ? { facultad: u.facultad } : {}),
        ...(u.programaAcademico ? { programaAcademico: u.programaAcademico } : {}),
      }]
    })
  }

  async function handleEditSubmit() {
    if (!editingRep || editMembers.length === 0) return
    setEditSubmitting(true)
    try {
      await updateRepresentacion(area, editingRep.id, { miembros: editMembers })
      setSuccess("Lista actualizada"); setEditDialogOpen(false); await loadRepresentaciones()
    } catch (e) { setError("Error al actualizar") }
    finally { setEditSubmitting(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta lista?")) return
    try { await deleteRepresentacion(area, id); setSuccess("Lista eliminada"); await loadRepresentaciones() }
    catch (e) { setError("Error al eliminar") }
  }

  // ── Memos ──
  const filteredEnrolled = useMemo(() => {
    const s = userSearch.toLowerCase()
    return enrolledUsers.filter(u => !s || u.nombres.toLowerCase().includes(s) || u.numeroDocumento.includes(s))
  }, [enrolledUsers, userSearch])

  const filteredEditEnrolled = useMemo(() => {
    const s = editUserSearch.toLowerCase()
    return editEnrolled.filter(u => !s || u.nombres.toLowerCase().includes(s) || u.numeroDocumento.includes(s))
  }, [editEnrolled, editUserSearch])

  const filteredMembers = useMemo(() => {
    if (!viewingRep) return []
    return viewingRep.miembros.filter(m => {
      if (viewSearch && !m.nombres.toLowerCase().includes(viewSearch.toLowerCase()) && !m.numeroDocumento.includes(viewSearch)) return false
      if (viewFacultad !== "all" && m.facultad !== viewFacultad) return false
      if (viewEstamento !== "all" && m.estamento !== viewEstamento) return false
      return true
    })
  }, [viewingRep, viewSearch, viewFacultad, viewEstamento])

  const viewStats = useMemo(() => {
    if (!viewingRep) return null
    const members = viewingRep.miembros; const total = members.length
    const byFacultad: Record<string, number> = {}; const byPrograma: Record<string, number> = {}
    const byGenero: Record<string, number> = { MUJER: 0, HOMBRE: 0, OTRO: 0 }
    members.forEach(m => {
      if (m.facultad) byFacultad[m.facultad] = (byFacultad[m.facultad] || 0) + 1
      if (m.programaAcademico) byPrograma[m.programaAcademico] = (byPrograma[m.programaAcademico] || 0) + 1
      const g = m.genero?.toUpperCase() || "OTRO"; byGenero[g] = (byGenero[g] || 0) + 1
    })
    return { total, byFacultad, byPrograma, byGenero }
  }, [viewingRep])

  // Agrupar representaciones por evento (nombre + fecha)
  const eventoGroups = useMemo(() => {
    const map = new Map<string, Representacion[]>()
    representaciones.forEach(r => {
      const key = `${r.nombre}||${r.fechaEvento}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(r)
    })
    return Array.from(map.entries()).map(([key, reps]) => {
      const [nombre, fecha] = key.split("||")
      return { nombre, fecha, reps }
    })
  }, [representaciones])

  const excelColumns: ExcelColumn[] = [
    { key: "numeroDocumento", label: "Documento" }, { key: "genero", label: "Género" },
    { key: "estamento", label: "Estamento" }, { key: "facultad", label: "Facultad" },
    { key: "programaAcademico", label: "Programa" }, { key: "grupoCultural", label: "Grupo" },
  ]

  function downloadExcel(rep: Representacion, selectedCols: string[]) {
    const data = rep.miembros.map(m => {
      const row: Record<string, any> = { Nombres: formatNombre(m.nombres) }
      selectedCols.forEach(k => {
        switch (k) {
          case "numeroDocumento": row["Documento"] = m.numeroDocumento; break
          case "genero": row["Género"] = m.genero; break
          case "estamento": row["Estamento"] = m.estamento; break
          case "facultad": row["Facultad"] = m.facultad || "N/A"; break
          case "programaAcademico": row["Programa"] = m.programaAcademico || "N/A"; break
          case "grupoCultural": row["Grupo"] = m.grupoCultural; break
        }
      })
      return row
    })
    const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Representación")
    XLSX.writeFile(wb, `rep_${rep.nombre.replace(/\s+/g, "_")}_${rep.grupoCultural.replace(/\s+/g, "_")}.xlsx`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Listas de Representación</h1>
            <p className="text-gray-600 mt-2">Crea listas por grupo para eventos — un evento puede tener múltiples grupos</p>
          </div>
          <Button onClick={openWizard} size="lg" className="gap-2"><Plus className="h-5 w-5" />Nuevo Evento</Button>
        </div>

        {success && <Alert className="mb-4 bg-green-50 border-green-200"><AlertDescription className="text-green-800">{success}</AlertDescription></Alert>}
        {error && !wizardOpen && !editDialogOpen && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}

        {/* Eventos agrupados */}
        {loading ? (
          <Card><CardContent className="py-12 text-center text-gray-500">Cargando...</CardContent></Card>
        ) : eventoGroups.length === 0 ? (
          <Card><CardContent className="py-12 text-center"><ListChecks className="h-12 w-12 text-gray-400 mx-auto mb-4" /><p className="text-gray-500">No hay listas creadas aún</p></CardContent></Card>
        ) : (
          <div className="space-y-6">
            {eventoGroups.map(({ nombre, fecha, reps }) => (
              <Card key={`${nombre}||${fecha}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">{nombre}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(fecha + "T00:00:00").toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}
                        <span className="ml-2 text-blue-600 font-medium">{reps.length} grupo(s) · {reps.reduce((s, r) => s + r.miembros.length, 0)} personas</span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {reps.map(rep => (
                      <div key={rep.id} className="border rounded-lg p-3 bg-white hover:shadow-sm transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-gray-800 truncate flex-1">{rep.grupoCultural}</p>
                          <Badge variant="secondary" className="text-xs ml-2 shrink-0">{rep.miembros.length}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setViewingRep(rep); setViewSearch(""); setViewFacultad("all"); setViewEstamento("all") }}>
                            <Search className="h-3 w-3 mr-1" />Ver
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openEdit(rep)}>
                            <Pencil className="h-3 w-3 mr-1" />Editar
                          </Button>
                          <ExcelColumnSelector availableColumns={excelColumns} onDownload={cols => downloadExcel(rep, cols)} buttonText="Excel" buttonClassName="bg-emerald-600 hover:bg-emerald-700 h-7 text-xs px-2" />
                          <Button size="sm" variant="destructive" className="h-7 text-xs px-2" onClick={() => handleDelete(rep.id)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ── Wizard: Nuevo Evento con múltiples listas ── */}
        <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
          <DialogContent className="max-w-5xl w-full max-h-[92vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Nuevo Evento de Representación</DialogTitle>
              <DialogDescription>Define el evento y agrega una lista por cada grupo que participará.</DialogDescription>
            </DialogHeader>

            <div className="flex gap-4 flex-1 overflow-hidden py-2">
              {/* Izquierda: datos evento + selector grupo + integrantes */}
              <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-2">
                <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg border">
                  <div className="space-y-1">
                    <Label>Nombre del evento *</Label>
                    <Input value={wizardNombre} onChange={e => setWizardNombre(e.target.value)} placeholder="Ej: Festival Nacional de Danza" />
                  </div>
                  <div className="space-y-1">
                    <Label>Fecha del evento *</Label>
                    <Input type="date" value={wizardFecha} onChange={e => setWizardFecha(e.target.value)} />
                  </div>
                </div>

                <div className="border rounded-lg p-3 space-y-3">
                  <p className="text-sm font-semibold text-gray-700">Agregar lista por grupo</p>
                  <div className="space-y-1">
                    <Label>Grupo</Label>
                    <Select value={activeGrupo} onValueChange={handleActiveGrupoChange}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar grupo..." /></SelectTrigger>
                      <SelectContent className="max-h-60">
                        {grupos.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {activeGrupo && (
                    <>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input className="pl-9" placeholder="Buscar integrante..." value={userSearch} onChange={e => setUserSearch(e.target.value)} />
                      </div>
                      {loadingUsers ? <p className="text-sm text-gray-500">Cargando...</p> : (
                        <div className="overflow-y-auto border rounded-md" style={{ maxHeight: 220 }}>
                          {filteredEnrolled.length === 0
                            ? <p className="text-sm text-gray-500 p-3">Sin integrantes</p>
                            : filteredEnrolled.map(u => {
                              const sel = activeMembers.some(m => m.userId === u.id)
                              return (
                                <div key={u.id} onClick={() => toggleActiveMember(u)}
                                  className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50 border-b last:border-0 ${sel ? "bg-blue-50" : ""}`}>
                                  <div>
                                    <p className="text-sm font-medium">{formatNombre(u.nombres)}</p>
                                    <p className="text-xs text-gray-500">{u.numeroDocumento} · {u.estamento}</p>
                                  </div>
                                  {sel ? <Badge className="bg-blue-500 text-xs">✓</Badge> : <span className="text-xs text-gray-400">+</span>}
                                </div>
                              )
                            })}
                        </div>
                      )}
                      <Button size="sm" onClick={saveSubLista} disabled={activeMembers.length === 0} className="w-full gap-1">
                        <ChevronRight className="h-4 w-4" />
                        Guardar lista de {activeGrupo.length > 30 ? activeGrupo.slice(0, 30) + "…" : activeGrupo} ({activeMembers.length})
                      </Button>
                    </>
                  )}
                </div>

                {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
              </div>

              {/* Derecha: listas guardadas + preview activa */}
              <div className="w-72 shrink-0 flex flex-col border-l pl-4 gap-3 overflow-y-auto">
                {/* Listas guardadas */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-semibold">Listas del evento</Label>
                    <Badge variant="secondary">{subListas.length}</Badge>
                  </div>
                  {subListas.length === 0 ? (
                    <div className="text-xs text-gray-400 border border-dashed rounded-md p-3 text-center">Ninguna lista agregada aún</div>
                  ) : (
                    <div className="space-y-2">
                      {subListas.map(sl => (
                        <div key={sl.grupo} className="flex items-center justify-between bg-blue-50 rounded-md px-3 py-2 text-xs cursor-pointer hover:bg-blue-100"
                          onClick={() => handleActiveGrupoChange(sl.grupo)}>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{sl.grupo}</p>
                            <p className="text-gray-500">{sl.miembros.length} integrantes</p>
                          </div>
                          <button onClick={e => { e.stopPropagation(); setSubListas(prev => prev.filter(s => s.grupo !== sl.grupo)) }}
                            className="text-red-400 hover:text-red-600 ml-2 shrink-0">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Preview integrantes activos */}
                {activeMembers.length > 0 && (
                  <div>
                    <Label className="text-xs font-semibold text-gray-600 mb-1 block">Seleccionados ahora ({activeMembers.length})</Label>
                    <div className="space-y-1 overflow-y-auto" style={{ maxHeight: 200 }}>
                      {activeMembers.map((m, i) => (
                        <div key={m.userId} className="flex items-center gap-1.5 bg-indigo-50 rounded px-2 py-1 text-xs">
                          <span className="text-indigo-400 font-bold shrink-0">{i + 1}.</span>
                          <span className="truncate">{formatNombre(m.nombres)}</span>
                          <button onClick={() => setActiveMembers(prev => prev.filter(x => x.userId !== m.userId))} className="text-red-400 hover:text-red-600 ml-auto shrink-0">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setWizardOpen(false)}>Cancelar</Button>
              <Button onClick={handleWizardSubmit} disabled={isSubmitting || subListas.length === 0}>
                {isSubmitting ? "Guardando..." : `Crear evento (${subListas.length} lista${subListas.length !== 1 ? "s" : ""})`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Edit single lista ── */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Editar lista — {editingRep?.grupoCultural}</DialogTitle>
              <DialogDescription>{editingRep?.nombre} · {editingRep?.fechaEvento}</DialogDescription>
            </DialogHeader>
            <div className="flex gap-4 flex-1 overflow-hidden py-2">
              <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input className="pl-9" placeholder="Buscar integrante..." value={editUserSearch} onChange={e => setEditUserSearch(e.target.value)} />
                </div>
                {editLoadingUsers ? <p className="text-sm text-gray-500">Cargando...</p> : (
                  <div className="overflow-y-auto border rounded-md flex-1" style={{ maxHeight: 380 }}>
                    {filteredEditEnrolled.map(u => {
                      const sel = editMembers.some(m => m.userId === u.id)
                      return (
                        <div key={u.id} onClick={() => toggleEditMember(u)}
                          className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50 border-b last:border-0 ${sel ? "bg-blue-50" : ""}`}>
                          <div>
                            <p className="text-sm font-medium">{formatNombre(u.nombres)}</p>
                            <p className="text-xs text-gray-500">{u.numeroDocumento} · {u.estamento}</p>
                          </div>
                          {sel ? <Badge className="bg-blue-500 text-xs">✓</Badge> : <span className="text-xs text-gray-400">+</span>}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
              <div className="w-56 shrink-0 border-l pl-4 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-semibold">Seleccionados</Label>
                  <Badge variant="secondary">{editMembers.length}</Badge>
                </div>
                <div className="overflow-y-auto space-y-1 flex-1" style={{ maxHeight: 380 }}>
                  {editMembers.map((m, i) => (
                    <div key={m.userId} className="flex items-center gap-1.5 bg-blue-50 rounded px-2 py-1.5 text-xs">
                      <span className="text-blue-400 font-bold shrink-0">{i + 1}.</span>
                      <div className="min-w-0 flex-1"><p className="font-medium truncate">{formatNombre(m.nombres)}</p></div>
                      <button onClick={() => setEditMembers(prev => prev.filter(x => x.userId !== m.userId))} className="text-red-400 hover:text-red-600 shrink-0"><X className="h-3 w-3" /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleEditSubmit} disabled={editSubmitting}>{editSubmitting ? "Guardando..." : "Guardar cambios"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── View Dialog ── */}
        <Dialog open={!!viewingRep} onOpenChange={open => { if (!open) setViewingRep(null) }}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            {viewingRep && (<>
              <DialogHeader>
                <DialogTitle>{viewingRep.nombre} — {viewingRep.grupoCultural}</DialogTitle>
                <DialogDescription>{new Date(viewingRep.fechaEvento + "T00:00:00").toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}</DialogDescription>
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
                <Badge variant="secondary">{filteredMembers.length} / {viewingRep.miembros.length}</Badge>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Documento</TableHead><TableHead>Género</TableHead><TableHead>Estamento</TableHead><TableHead>Facultad</TableHead><TableHead>Programa</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {filteredMembers.map(m => (
                      <TableRow key={m.userId}>
                        <TableCell className="font-medium">{formatNombre(m.nombres)}</TableCell>
                        <TableCell>{m.numeroDocumento}</TableCell>
                        <TableCell><Badge variant="outline" className={m.genero === "MUJER" ? "bg-pink-50 text-pink-700" : m.genero === "HOMBRE" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}>{m.genero}</Badge></TableCell>
                        <TableCell><Badge variant="secondary">{m.estamento}</Badge></TableCell>
                        <TableCell className="text-xs max-w-[160px] truncate">{m.facultad || "N/A"}</TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">{m.programaAcademico || "N/A"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {viewStats && (
                <div className="mt-4 space-y-4 border-t pt-4">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2"><BarChart2 className="h-4 w-4" />Resumen estadístico</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2"><p className="text-xs font-medium text-gray-500 uppercase">Por Género</p>{Object.entries(viewStats.byGenero).map(([g, v]) => <StatBar key={g} label={g} value={v} total={viewStats.total} />)}</div>
                    <div className="space-y-2"><p className="text-xs font-medium text-gray-500 uppercase">Por Facultad</p>{Object.entries(viewStats.byFacultad).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([f, v]) => <StatBar key={f} label={f.replace("FACULTAD DE ", "")} value={v} total={viewStats.total} />)}</div>
                    <div className="space-y-2"><p className="text-xs font-medium text-gray-500 uppercase">Por Programa</p>{Object.entries(viewStats.byPrograma).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([p, v]) => <StatBar key={p} label={p} value={v} total={viewStats.total} />)}</div>
                  </div>
                </div>
              )}
              <DialogFooter className="mt-4">
                <ExcelColumnSelector availableColumns={excelColumns} onDownload={cols => downloadExcel(viewingRep, cols)} buttonText="Descargar Excel" buttonClassName="bg-emerald-600 hover:bg-emerald-700" />
                <Button variant="outline" onClick={() => setViewingRep(null)}>Cerrar</Button>
              </DialogFooter>
            </>)}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

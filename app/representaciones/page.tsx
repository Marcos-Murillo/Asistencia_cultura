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
import {
  Plus, Trash2, Pencil, Search, Users, Calendar, ChevronDown, X, ListChecks, BarChart2
} from "lucide-react"
import { useArea } from "@/contexts/area-context"
import {
  getAllCulturalGroups,
  getGroupEnrolledUsersRouter,
  createRepresentacion,
  getAllRepresentaciones,
  updateRepresentacion,
  deleteRepresentacion,
  type Representacion,
  type RepresentacionMember,
} from "@/lib/db-router"
import { GRUPOS_DEPORTIVOS } from "@/lib/deporte-groups"
import { ESTAMENTOS, FACULTADES } from "@/lib/data"
import type { UserProfile } from "@/lib/types"
import { formatNombre } from "@/lib/utils"

type EnrolledUser = UserProfile & { fechaInscripcion: Date }

// ── Mini stat bar ──────────────────────────────────────────────────────────
function StatBar({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-40 truncate text-gray-600">{label}</span>
      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600"
          style={{ width: `${pct}%` }}
        />
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
  const [enrolledUsers, setEnrolledUsers] = useState<EnrolledUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  // ── Create / Edit dialog ──
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formNombre, setFormNombre] = useState("")
  const [formFecha, setFormFecha] = useState("")
  const [formGrupo, setFormGrupo] = useState("")
  const [selectedMembers, setSelectedMembers] = useState<RepresentacionMember[]>([])
  const [userSearch, setUserSearch] = useState("")
  const [grupoSearch, setGrupoSearch] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ── View dialog ──
  const [viewingRep, setViewingRep] = useState<Representacion | null>(null)
  const [viewSearch, setViewSearch] = useState("")
  const [viewFacultad, setViewFacultad] = useState("all")
  const [viewPrograma, setViewPrograma] = useState("all")
  const [viewEstamento, setViewEstamento] = useState("all")

  useEffect(() => {
    if (!area) return
    loadGrupos()
    loadRepresentaciones()
  }, [area])

  async function loadGrupos() {
    try {
      let grps: string[]
      if (area === "deporte") {
        grps = [...GRUPOS_DEPORTIVOS].sort()
      } else {
        const gs = await getAllCulturalGroups(area)
        grps = gs.filter(g => g.activo).map(g => g.nombre).sort()
      }
      setGrupos(grps)
    } catch (e) {
      console.error("[Representaciones] Error cargando grupos:", e)
    }
  }

  async function loadRepresentaciones() {
    setLoading(true)
    try {
      const reps = await getAllRepresentaciones(area)
      setRepresentaciones(reps)
    } catch (e) {
      console.error("[Representaciones] Error cargando representaciones:", e)
    } finally {
      setLoading(false)
    }
  }

  async function loadData() {
    loadGrupos()
    loadRepresentaciones()
  }

  async function handleGrupoChange(grupo: string) {
    setFormGrupo(grupo)
    setSelectedMembers([])
    setUserSearch("")
    if (!grupo) return
    setLoadingUsers(true)
    try {
      const users = await getGroupEnrolledUsersRouter(area, grupo)
      setEnrolledUsers(users)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingUsers(false)
    }
  }

  function toggleMember(user: EnrolledUser) {
    setSelectedMembers(prev => {
      const exists = prev.find(m => m.userId === user.id)
      if (exists) return prev.filter(m => m.userId !== user.id)
      return [...prev, {
        userId: user.id,
        nombres: user.nombres,
        numeroDocumento: user.numeroDocumento,
        genero: user.genero,
        estamento: user.estamento,
        facultad: user.facultad,
        programaAcademico: user.programaAcademico,
        grupoCultural: formGrupo,
      }]
    })
  }

  function openCreate() {
    setEditingId(null)
    setFormNombre(""); setFormFecha(""); setFormGrupo("")
    setSelectedMembers([]); setEnrolledUsers([])
    setDialogOpen(true)
  }

  async function openEdit(rep: Representacion) {
    setEditingId(rep.id)
    setFormNombre(rep.nombre)
    setFormFecha(rep.fechaEvento)
    setFormGrupo(rep.grupoCultural)
    setSelectedMembers(rep.miembros)
    setDialogOpen(true)
    setLoadingUsers(true)
    try {
      const users = await getGroupEnrolledUsersRouter(area, rep.grupoCultural)
      setEnrolledUsers(users)
    } catch (e) { console.error(e) }
    finally { setLoadingUsers(false) }
  }

  async function handleSubmit() {
    if (!formNombre || !formFecha || !formGrupo || selectedMembers.length === 0) {
      setError("Completa todos los campos y selecciona al menos un integrante.")
      return
    }
    setIsSubmitting(true)
    try {
      const payload = { nombre: formNombre, fechaEvento: formFecha, grupoCultural: formGrupo, miembros: selectedMembers, area }
      if (editingId) {
        await updateRepresentacion(area, editingId, payload)
        setSuccess("Lista actualizada exitosamente")
      } else {
        await createRepresentacion(area, payload)
        setSuccess("Lista creada exitosamente")
      }
      setDialogOpen(false)
      await loadData()
    } catch (e) {
      setError("Error al guardar la lista.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta lista de representación?")) return
    try {
      await deleteRepresentacion(area, id)
      setSuccess("Lista eliminada")
      await loadData()
    } catch (e) { setError("Error al eliminar") }
  }

  // ── Filtered users in create dialog ──
  const filteredEnrolled = useMemo(() => {
    const s = userSearch.toLowerCase()
    return enrolledUsers.filter(u =>
      !s || u.nombres.toLowerCase().includes(s) || u.numeroDocumento.includes(s)
    )
  }, [enrolledUsers, userSearch])

  // ── Filtered grupos in create dialog ──
  const filteredGrupos = useMemo(() => {
    const s = grupoSearch.toLowerCase()
    return grupos.filter(g => !s || g.toLowerCase().includes(s))
  }, [grupos, grupoSearch])

  // ── View dialog filtered members ──
  const filteredMembers = useMemo(() => {
    if (!viewingRep) return []
    return viewingRep.miembros.filter(m => {
      if (viewSearch && !m.nombres.toLowerCase().includes(viewSearch.toLowerCase()) && !m.numeroDocumento.includes(viewSearch)) return false
      if (viewFacultad !== "all" && m.facultad !== viewFacultad) return false
      if (viewPrograma !== "all" && m.programaAcademico !== viewPrograma) return false
      if (viewEstamento !== "all" && m.estamento !== viewEstamento) return false
      return true
    })
  }, [viewingRep, viewSearch, viewFacultad, viewPrograma, viewEstamento])

  // ── Stats for view dialog ──
  const viewStats = useMemo(() => {
    if (!viewingRep) return null
    const members = viewingRep.miembros
    const total = members.length
    const byFacultad: Record<string, number> = {}
    const byPrograma: Record<string, number> = {}
    const byGenero: Record<string, number> = { MUJER: 0, HOMBRE: 0, OTRO: 0 }
    members.forEach(m => {
      if (m.facultad) byFacultad[m.facultad] = (byFacultad[m.facultad] || 0) + 1
      if (m.programaAcademico) byPrograma[m.programaAcademico] = (byPrograma[m.programaAcademico] || 0) + 1
      const g = m.genero?.toUpperCase() || "OTRO"
      byGenero[g] = (byGenero[g] || 0) + 1
    })
    return { total, byFacultad, byPrograma, byGenero }
  }, [viewingRep])

  // ── Excel columns ──
  const excelColumns: ExcelColumn[] = [
    { key: "numeroDocumento", label: "Documento" },
    { key: "genero", label: "Género" },
    { key: "estamento", label: "Estamento" },
    { key: "facultad", label: "Facultad" },
    { key: "programaAcademico", label: "Programa" },
    { key: "grupoCultural", label: "Grupo" },
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
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Representación")
    XLSX.writeFile(wb, `representacion_${rep.nombre.replace(/\s+/g, "_")}_${rep.fechaEvento}.xlsx`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Listas de Representación</h1>
            <p className="text-gray-600 mt-2">Crea listas de integrantes por grupo para eventos y representaciones</p>
          </div>
          <Button onClick={openCreate} size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Nueva Lista
          </Button>
        </div>

        {success && <Alert className="mb-4 bg-green-50 border-green-200"><AlertDescription className="text-green-800">{success}</AlertDescription></Alert>}
        {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}

        {/* Lista de representaciones */}
        {loading ? (
          <Card><CardContent className="py-12 text-center text-gray-500">Cargando listas...</CardContent></Card>
        ) : representaciones.length === 0 ? (
          <Card><CardContent className="py-12 text-center">
            <ListChecks className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay listas creadas aún</p>
          </CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {representaciones.map(rep => (
              <Card key={rep.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg">{rep.nombre}</CardTitle>
                    <Badge variant="outline" className="text-xs shrink-0">{rep.miembros.length} personas</Badge>
                  </div>
                  <CardDescription className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(rep.fechaEvento + "T00:00:00").toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4 flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {rep.grupoCultural}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setViewingRep(rep); setViewSearch(""); setViewFacultad("all"); setViewPrograma("all"); setViewEstamento("all") }}>
                      <Search className="h-3 w-3 mr-1" /> Ver lista
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openEdit(rep)}>
                      <Pencil className="h-3 w-3 mr-1" /> Editar
                    </Button>
                    <ExcelColumnSelector
                      availableColumns={excelColumns}
                      onDownload={(cols) => downloadExcel(rep, cols)}
                      buttonText="Excel"
                      buttonClassName="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs px-2"
                    />
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(rep.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ── Create / Edit Dialog ── */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Lista" : "Nueva Lista de Representación"}</DialogTitle>
              <DialogDescription>Selecciona el grupo y los integrantes que representarán a la universidad.</DialogDescription>
            </DialogHeader>

            <div className="flex gap-4 flex-1 overflow-hidden py-2">
              {/* ── Columna izquierda: formulario + búsqueda ── */}
              <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Nombre del evento *</Label>
                    <Input value={formNombre} onChange={e => setFormNombre(e.target.value)} placeholder="Ej: Festival Nacional de Danza" />
                  </div>
                  <div className="space-y-1">
                    <Label>Fecha del evento *</Label>
                    <Input type="date" value={formFecha} onChange={e => setFormFecha(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Grupo *</Label>
                  <Select value={formGrupo} onValueChange={g => handleGrupoChange(g)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar grupo..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {grupos.map(g => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formGrupo && (
                  <div className="flex flex-col gap-2 flex-1">
                    <Label>Integrantes del grupo</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input className="pl-9" placeholder="Buscar por nombre o cédula..." value={userSearch} onChange={e => setUserSearch(e.target.value)} />
                    </div>
                    {loadingUsers ? (
                      <p className="text-sm text-gray-500 py-2">Cargando integrantes...</p>
                    ) : (
                      <div className="flex-1 overflow-y-auto border rounded-md" style={{ maxHeight: 320 }}>
                        {filteredEnrolled.length === 0 ? (
                          <p className="text-sm text-gray-500 p-3">No se encontraron integrantes</p>
                        ) : filteredEnrolled.map(u => {
                          const selected = selectedMembers.some(m => m.userId === u.id)
                          return (
                            <div
                              key={u.id}
                              onClick={() => toggleMember(u)}
                              className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50 border-b last:border-0 transition-colors ${selected ? "bg-blue-50" : ""}`}
                            >
                              <div>
                                <p className="text-sm font-medium">{formatNombre(u.nombres)}</p>
                                <p className="text-xs text-gray-500">{u.numeroDocumento} · {u.estamento}</p>
                              </div>
                              {selected
                                ? <Badge className="bg-blue-500 text-xs shrink-0">✓ Añadido</Badge>
                                : <span className="text-xs text-gray-400">+ Añadir</span>
                              }
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
              </div>

              {/* ── Columna derecha: lista seleccionados ── */}
              <div className="w-64 shrink-0 flex flex-col border-l pl-4">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-semibold">Lista seleccionada</Label>
                  <Badge variant="secondary">{selectedMembers.length}</Badge>
                </div>
                {selectedMembers.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-center text-xs text-gray-400 border border-dashed rounded-md p-4">
                    Ningún integrante seleccionado aún
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto space-y-1" style={{ maxHeight: 420 }}>
                    {selectedMembers.map((m, i) => (
                      <div key={m.userId} className="flex items-center justify-between bg-blue-50 rounded-md px-2 py-1.5 text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-blue-400 font-bold shrink-0">{i + 1}.</span>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{formatNombre(m.nombres)}</p>
                            <p className="text-gray-500 truncate">{m.numeroDocumento}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedMembers(prev => prev.filter(x => x.userId !== m.userId))}
                          className="text-red-400 hover:text-red-600 shrink-0 ml-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : editingId ? "Guardar cambios" : `Crear lista (${selectedMembers.length})`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── View Dialog ── */}
        <Dialog open={!!viewingRep} onOpenChange={open => { if (!open) setViewingRep(null) }}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            {viewingRep && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl">{viewingRep.nombre}</DialogTitle>
                  <DialogDescription>
                    {viewingRep.grupoCultural} · {new Date(viewingRep.fechaEvento + "T00:00:00").toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}
                  </DialogDescription>
                </DialogHeader>

                {/* Filtros */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-2">
                  <div className="relative col-span-2 md:col-span-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input className="pl-9 h-8 text-xs" placeholder="Nombre o cédula..." value={viewSearch} onChange={e => setViewSearch(e.target.value)} />
                  </div>
                  <Select value={viewEstamento} onValueChange={setViewEstamento}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Estamento" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {ESTAMENTOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={viewFacultad} onValueChange={v => { setViewFacultad(v); setViewPrograma("all") }}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Facultad" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {FACULTADES.map(f => <SelectItem key={f} value={f}>{f.replace("FACULTAD DE ", "")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary">{filteredMembers.length} / {viewingRep.miembros.length}</Badge>
                    {(viewSearch || viewFacultad !== "all" || viewEstamento !== "all") && (
                      <Button variant="ghost" size="sm" className="h-6 px-1" onClick={() => { setViewSearch(""); setViewFacultad("all"); setViewPrograma("all"); setViewEstamento("all") }}>
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Tabla */}
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

                {/* Estadísticas */}
                {viewStats && (
                  <div className="mt-4 space-y-4 border-t pt-4">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2"><BarChart2 className="h-4 w-4" />Resumen estadístico</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Género */}
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Por Género</p>
                        {Object.entries(viewStats.byGenero).map(([g, v]) => (
                          <StatBar key={g} label={g} value={v} total={viewStats.total} />
                        ))}
                      </div>
                      {/* Facultad */}
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Por Facultad</p>
                        {Object.entries(viewStats.byFacultad).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([f, v]) => (
                          <StatBar key={f} label={f.replace("FACULTAD DE ", "")} value={v} total={viewStats.total} />
                        ))}
                      </div>
                      {/* Programa */}
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Por Programa</p>
                        {Object.entries(viewStats.byPrograma).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([p, v]) => (
                          <StatBar key={p} label={p} value={v} total={viewStats.total} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <DialogFooter className="mt-4">
                  <ExcelColumnSelector
                    availableColumns={excelColumns}
                    onDownload={(cols) => downloadExcel(viewingRep, cols)}
                    buttonText="Descargar Excel"
                    buttonClassName="bg-emerald-600 hover:bg-emerald-700"
                  />
                  <Button variant="outline" onClick={() => setViewingRep(null)}>Cerrar</Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

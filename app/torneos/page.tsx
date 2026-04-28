"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Trophy, Users, User, Calendar, MapPin, Pencil, Trash2, ChevronRight } from "lucide-react"
import Link from "next/link"
import { getAllTorneos, createTorneo, updateTorneo, deleteTorneo } from "@/lib/db-router"
import type { Torneo, TorneoDeporte, TorneoTipo } from "@/lib/types"

const DEPORTES: { value: TorneoDeporte; label: string }[] = [
  { value: "futbol", label: "Fútbol" },
  { value: "baloncesto", label: "Baloncesto" },
  { value: "voleibol", label: "Voleibol" },
  { value: "tenis_mesa", label: "Tenis de Mesa" },
  { value: "ajedrez", label: "Ajedrez" },
  { value: "natacion", label: "Natación" },
  { value: "atletismo", label: "Atletismo" },
  { value: "otro", label: "Otro" },
]

const FASE_LABELS: Record<string, string> = {
  inscripcion: "Inscripción", grupos: "Fase de Grupos",
  eliminatorias: "Eliminatorias", finalizado: "Finalizado",
}
const FASE_COLORS: Record<string, string> = {
  inscripcion: "bg-blue-100 text-blue-700", grupos: "bg-yellow-100 text-yellow-700",
  eliminatorias: "bg-orange-100 text-orange-700", finalizado: "bg-green-100 text-green-700",
}

const emptyForm = { nombre: "", deporte: "" as TorneoDeporte, tipo: "" as TorneoTipo, descripcion: "", fechaInicio: "", fechaFin: "", lugar: "", equiposPorGrupo: "4" }

export default function TorneosPage() {
  const [torneos, setTorneos] = useState<Torneo[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTorneo, setEditingTorneo] = useState<Torneo | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { setTorneos(await getAllTorneos()) } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  function openCreate() {
    setEditingTorneo(null); setForm(emptyForm); setError(""); setDialogOpen(true)
  }

  function openEdit(t: Torneo) {
    setEditingTorneo(t)
    setForm({
      nombre: t.nombre, deporte: t.deporte, tipo: t.tipo,
      descripcion: t.descripcion || "", lugar: t.lugar,
      fechaInicio: t.fechaInicio.toISOString().split("T")[0],
      fechaFin: t.fechaFin.toISOString().split("T")[0],
      equiposPorGrupo: t.equiposPorGrupo?.toString() || "4",
    })
    setError(""); setDialogOpen(true)
  }

  async function handleSubmit() {
    if (!form.nombre || !form.deporte || !form.tipo || !form.fechaInicio || !form.fechaFin || !form.lugar) {
      setError("Completa todos los campos obligatorios."); return
    }
    setSubmitting(true)
    try {
      const payload = {
        nombre: form.nombre, deporte: form.deporte, tipo: form.tipo,
        descripcion: form.descripcion, lugar: form.lugar,
        fechaInicio: new Date(form.fechaInicio), fechaFin: new Date(form.fechaFin),
        activo: true,
        ...(form.tipo === "grupal" ? { equiposPorGrupo: parseInt(form.equiposPorGrupo) || 4 } : {}),
      }
      if (editingTorneo) {
        await updateTorneo(editingTorneo.id, payload)
        setSuccess("Torneo actualizado")
      } else {
        await createTorneo(payload)
        setSuccess("Torneo creado")
      }
      setDialogOpen(false); await load()
    } catch (e) { setError("Error al guardar") } finally { setSubmitting(false) }
  }

  async function handleDelete(id: string, nombre: string) {
    if (!confirm(`¿Eliminar el torneo "${nombre}"?`)) return
    try { await deleteTorneo(id); setSuccess("Torneo eliminado"); await load() }
    catch (e) { setError("Error al eliminar") }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
              <Trophy className="h-9 w-9 text-orange-500" />Torneos Deportivos
            </h1>
            <p className="text-gray-600 mt-2">Gestiona torneos individuales y grupales</p>
          </div>
          <Button onClick={openCreate} size="lg" className="gap-2 bg-orange-600 hover:bg-orange-700">
            <Plus className="h-5 w-5" />Nuevo Torneo
          </Button>
        </div>

        {success && <Alert className="mb-4 bg-green-50 border-green-200"><AlertDescription className="text-green-800">{success}</AlertDescription></Alert>}
        {error && !dialogOpen && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}

        {loading ? (
          <Card><CardContent className="py-12 text-center text-gray-500">Cargando torneos...</CardContent></Card>
        ) : torneos.length === 0 ? (
          <Card><CardContent className="py-12 text-center">
            <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay torneos creados aún</p>
          </CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {torneos.map(t => (
              <Card key={t.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg">{t.nombre}</CardTitle>
                    <Badge className={`text-xs shrink-0 ${FASE_COLORS[t.fase]}`}>{FASE_LABELS[t.fase]}</Badge>
                  </div>
                  <CardDescription className="flex flex-wrap gap-2 mt-1">
                    <span className="flex items-center gap-1"><Trophy className="h-3 w-3" />{DEPORTES.find(d => d.value === t.deporte)?.label}</span>
                    <Badge variant="outline" className="text-xs">{t.tipo === "individual" ? <><User className="h-3 w-3 mr-1" />Individual</> : <><Users className="h-3 w-3 mr-1" />Grupal</>}</Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center gap-1"><MapPin className="h-3 w-3" />{t.lugar}</div>
                    <div className="flex items-center gap-1"><Calendar className="h-3 w-3" />
                      {t.fechaInicio.toLocaleDateString("es-CO")} — {t.fechaFin.toLocaleDateString("es-CO")}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Link href={`/torneos/${t.id}`} className="flex-1">
                      <Button size="sm" className="w-full gap-1 bg-orange-600 hover:bg-orange-700 text-white h-8 text-xs">
                        Administrar<ChevronRight className="h-3 w-3" />
                      </Button>
                    </Link>
                    <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => openEdit(t)}><Pencil className="h-3 w-3" /></Button>
                    <Button size="sm" variant="destructive" className="h-8 px-2" onClick={() => handleDelete(t.id, t.nombre)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog crear/editar */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingTorneo ? "Editar Torneo" : "Nuevo Torneo"}</DialogTitle>
              <DialogDescription>Configura los datos del torneo deportivo.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label>Nombre *</Label>
                <Input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Torneo Interfacultades 2026" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Deporte *</Label>
                  <Select value={form.deporte} onValueChange={v => setForm(f => ({ ...f, deporte: v as TorneoDeporte }))}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>{DEPORTES.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Tipo *</Label>
                  <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v as TorneoTipo }))}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual"><User className="h-3 w-3 inline mr-1" />Individual</SelectItem>
                      <SelectItem value="grupal"><Users className="h-3 w-3 inline mr-1" />Grupal (equipos)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {form.tipo === "grupal" && (
                <div className="space-y-1">
                  <Label>Equipos por grupo</Label>
                  <Input type="number" min={2} max={8} value={form.equiposPorGrupo} onChange={e => setForm(f => ({ ...f, equiposPorGrupo: e.target.value }))} />
                </div>
              )}
              <div className="space-y-1">
                <Label>Lugar *</Label>
                <Input value={form.lugar} onChange={e => setForm(f => ({ ...f, lugar: e.target.value }))} placeholder="Ej: Coliseo Universitario" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Fecha inicio *</Label>
                  <Input type="date" value={form.fechaInicio} onChange={e => setForm(f => ({ ...f, fechaInicio: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Fecha fin *</Label>
                  <Input type="date" value={form.fechaFin} onChange={e => setForm(f => ({ ...f, fechaFin: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Descripción</Label>
                <Input value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Descripción opcional..." />
              </div>
              {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={submitting} className="bg-orange-600 hover:bg-orange-700">
                {submitting ? "Guardando..." : editingTorneo ? "Guardar cambios" : "Crear torneo"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

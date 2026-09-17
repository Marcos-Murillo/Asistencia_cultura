"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Combobox } from "@/components/ui/combobox"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { createBitacora, TIPO_SOLICITUD_LABEL } from "@/lib/fisioterapia"
import { getGroupEnrolledUsersRouter, getGroupManagers, listDeportiveGroups } from "@/lib/db-router"
import type { FisioterapiaActor } from "@/lib/fisioterapia-permissions"
import type { FisioterapiaBitacora, FisioterapiaBitacoraTipo, UserProfile } from "@/lib/types"
import { toLocalDateKey } from "@/lib/utils"
import { fisioSheetClass, fisioSheetHandleClass } from "./drawer-styles"

type SolicitudDefaults = Pick<
  FisioterapiaBitacora,
  "grupoNombre" | "entrenadorNombre" | "entrenadorId" | "deportistaId"
>

const actividadOptions = [
  { value: "acompanamiento_entrenamiento", label: "Acompañamiento de entrenamiento" },
  ...Object.entries(TIPO_SOLICITUD_LABEL).map(([value, label]) => ({ value, label })),
]

export function BitacoraFormDrawer({
  open,
  onOpenChange,
  actor,
  groups,
  defaultTipo,
  solicitudId,
  solicitudNumero,
  solicitudDefaults,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  actor: FisioterapiaActor
  groups: { id: string; nombre: string }[]
  defaultTipo?: FisioterapiaBitacoraTipo
  solicitudId?: string
  solicitudNumero?: number
  solicitudDefaults?: Partial<SolicitudDefaults>
  onSaved: () => void
}) {
  const [tipo, setTipo] = useState<FisioterapiaBitacoraTipo>(defaultTipo || "actividad")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [grupoNombre, setGrupoNombre] = useState("")
  const [entrenadorNombre, setEntrenadorNombre] = useState("")
  const [entrenadorId, setEntrenadorId] = useState("")
  const [athletes, setAthletes] = useState<UserProfile[]>([])
  const [loadedGroups, setLoadedGroups] = useState(groups)
  const [form, setForm] = useState({
    fecha: toLocalDateKey(new Date()),
    hora: new Date().toTimeString().slice(0, 5),
    tipoActividad: "acompanamiento_entrenamiento",
    descripcion: "",
    observaciones: "",
    estado: "Realizada",
    deportistaId: "",
    motivoAtencion: "",
    tipoLesion: "",
    zonaCorporal: "",
    descripcionIncidente: "",
    evaluacion: "",
    intervencion: "",
    recomendaciones: "",
    requiereSeguimiento: false,
    fechaSeguimiento: "",
    generarOrden: false,
    ordenDescripcion: "",
    ordenDestino: "",
  })

  useEffect(() => {
    if (!open) return
    setTipo(defaultTipo || "actividad")
    if (solicitudDefaults?.grupoNombre) setGrupoNombre(solicitudDefaults.grupoNombre)
    if (solicitudDefaults?.entrenadorNombre) setEntrenadorNombre(solicitudDefaults.entrenadorNombre)
    if (solicitudDefaults?.entrenadorId) setEntrenadorId(solicitudDefaults.entrenadorId)
    if (solicitudDefaults?.deportistaId) {
      setForm((prev) => ({ ...prev, deportistaId: solicitudDefaults.deportistaId || "" }))
    }
    listDeportiveGroups()
      .then(setLoadedGroups)
      .catch(() => setLoadedGroups(groups))
  }, [open, defaultTipo, solicitudDefaults, groups])

  useEffect(() => {
    if (!grupoNombre) {
      setAthletes([])
      return
    }
    let cancelled = false
    ;(async () => {
      const [users, managers] = await Promise.all([
        getGroupEnrolledUsersRouter("deporte", grupoNombre),
        getGroupManagers("deporte", grupoNombre),
      ])
      if (cancelled) return
      setAthletes(users)
      if (managers[0]) {
        setEntrenadorId(managers[0].userId)
        setEntrenadorNombre(managers[0].user.nombres)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [grupoNombre])

  const athleteOptions = useMemo(
    () => athletes.map((user) => ({ value: user.id, label: user.nombres })),
    [athletes],
  )
  const groupOptions = (loadedGroups.length ? loadedGroups : groups).map((group) => ({
    value: group.nombre,
    label: group.nombre,
  }))
  const selectedAthlete = athletes.find((user) => user.id === form.deportistaId)

  async function handleSave() {
    setSaving(true)
    setError("")
    try {
      const fecha = new Date(`${form.fecha}T${form.hora || "12:00"}`)
      await createBitacora(actor, {
        tipo,
        fecha,
        hora: form.hora,
        grupoNombre: grupoNombre || undefined,
        entrenadorId: entrenadorId || undefined,
        entrenadorNombre: entrenadorNombre || undefined,
        tipoActividad: form.tipoActividad as FisioterapiaBitacora["tipoActividad"],
        descripcion: form.descripcion,
        observaciones: form.observaciones,
        estado: form.estado,
        deportistaId: form.deportistaId || undefined,
        deportistaNombre: selectedAthlete?.nombres,
        motivoAtencion: form.motivoAtencion || undefined,
        tipoLesion: form.tipoLesion || undefined,
        zonaCorporal: form.zonaCorporal || undefined,
        descripcionIncidente: form.descripcionIncidente || undefined,
        evaluacion: form.evaluacion || undefined,
        intervencion: form.intervencion || undefined,
        recomendaciones: form.recomendaciones || undefined,
        requiereSeguimiento: form.requiereSeguimiento,
        fechaSeguimiento: form.fechaSeguimiento ? new Date(`${form.fechaSeguimiento}T12:00`) : undefined,
        orden: form.generarOrden
          ? { descripcion: form.ordenDescripcion, destino: form.ordenDestino, fecha }
          : null,
        solicitudId,
        solicitudNumero,
      })
      onSaved()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent side="bottom" className={fisioSheetClass}>
        <div className={fisioSheetHandleClass} />
        <DrawerHeader className="pb-2 pt-2">
          <DrawerTitle className="text-base">Nuevo registro</DrawerTitle>
          <DrawerDescription>Completa solo las secciones del tipo de evento.</DrawerDescription>
        </DrawerHeader>
        <ScrollArea className="min-h-0 flex-1 overflow-y-auto px-5">
          <Tabs value={tipo} onValueChange={(value) => setTipo(value as FisioterapiaBitacoraTipo)}>
            <TabsList className="grid h-8 w-full grid-cols-3">
              <TabsTrigger value="actividad" className="py-1 text-[11px]">Actividad</TabsTrigger>
              <TabsTrigger value="atencion" className="py-1 text-[11px]">Atención</TabsTrigger>
              <TabsTrigger value="solicitud" className="py-1 text-[11px]">Solicitud</TabsTrigger>
            </TabsList>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Hora</Label>
                <Input type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Grupo deportivo</Label>
                <Combobox
                  options={groupOptions}
                  value={grupoNombre}
                  onValueChange={setGrupoNombre}
                  placeholder={groupOptions.length ? "Buscar grupo de la base de datos" : "Cargando grupos..."}
                  searchPlaceholder="Nombre del grupo"
                />
                <p className="text-xs text-slate-500">{groupOptions.length} grupos disponibles</p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Entrenador</Label>
                <Input value={entrenadorNombre} onChange={(e) => setEntrenadorNombre(e.target.value)} placeholder="Se completa al elegir grupo" />
              </div>
            </div>

            <TabsContent value="actividad" className="space-y-3">
              <div className="space-y-2">
                <Label>Tipo de actividad</Label>
                <Combobox options={actividadOptions} value={form.tipoActividad} onValueChange={(v) => setForm({ ...form, tipoActividad: v })} />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Textarea value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} />
              </div>
            </TabsContent>

            <TabsContent value="atencion" className="space-y-3">
              <div className="space-y-2">
                <Label>Deportista</Label>
                <Combobox
                  options={athleteOptions}
                  value={form.deportistaId}
                  onValueChange={(v) => setForm({ ...form, deportistaId: v })}
                  placeholder={grupoNombre ? "Buscar por nombre" : "Elige un grupo primero"}
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Motivo de atención</Label>
                  <Input value={form.motivoAtencion} onChange={(e) => setForm({ ...form, motivoAtencion: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de lesión</Label>
                  <Input value={form.tipoLesion} onChange={(e) => setForm({ ...form, tipoLesion: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Zona corporal</Label>
                  <Input value={form.zonaCorporal} onChange={(e) => setForm({ ...form, zonaCorporal: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Estado del deportista</Label>
                  <Input value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descripción del incidente</Label>
                <Textarea value={form.descripcionIncidente} onChange={(e) => setForm({ ...form, descripcionIncidente: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Evaluación</Label>
                <Textarea value={form.evaluacion} onChange={(e) => setForm({ ...form, evaluacion: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Procedimiento / intervención</Label>
                <Textarea value={form.intervencion} onChange={(e) => setForm({ ...form, intervencion: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Recomendaciones</Label>
                <Textarea value={form.recomendaciones} onChange={(e) => setForm({ ...form, recomendaciones: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.requiereSeguimiento}
                  onCheckedChange={(v) => setForm({ ...form, requiereSeguimiento: Boolean(v) })}
                />
                Requiere seguimiento
              </label>
              {form.requiereSeguimiento && (
                <div className="space-y-2">
                  <Label>Fecha de seguimiento</Label>
                  <Input type="date" value={form.fechaSeguimiento} onChange={(e) => setForm({ ...form, fechaSeguimiento: e.target.value })} />
                </div>
              )}
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.generarOrden}
                  onCheckedChange={(v) => setForm({ ...form, generarOrden: Boolean(v) })}
                />
                Generar orden / remisión
              </label>
              {form.generarOrden && (
                <div className="space-y-3 rounded-md border bg-slate-50 p-3">
                  <div className="space-y-2">
                    <Label>Descripción de la orden</Label>
                    <Textarea value={form.ordenDescripcion} onChange={(e) => setForm({ ...form, ordenDescripcion: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Destino / especialidad</Label>
                    <Input value={form.ordenDestino} onChange={(e) => setForm({ ...form, ordenDestino: e.target.value })} />
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="solicitud" className="space-y-3">
              <p className="text-sm text-slate-600">
                {solicitudNumero
                  ? `Vinculada a solicitud #${String(solicitudNumero).padStart(5, "0")}`
                  : "Registra la atención de una solicitud de entrenador."}
              </p>
              <div className="space-y-2">
                <Label>Lo realizado</Label>
                <Textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Textarea value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} />
              </div>
            </TabsContent>
          </Tabs>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <div className="h-4" />
        </ScrollArea>
        <DrawerFooter className="border-t border-slate-200/80 bg-white/80 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 md:bg-white">
          <Button onClick={handleSave} disabled={saving} className="h-10 justify-center bg-teal-800 hover:bg-teal-700">
            {saving ? "Guardando..." : "Guardar registro"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

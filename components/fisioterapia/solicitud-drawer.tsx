"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Combobox } from "@/components/ui/combobox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  assignSolicitud,
  finalizarSolicitudEnBitacora,
  TIPO_SOLICITUD_LABEL,
  updateSolicitudEstado,
} from "@/lib/fisioterapia"
import type { FisioterapiaActor } from "@/lib/fisioterapia-permissions"
import { getFisioterapiaPermissions } from "@/lib/fisioterapia-permissions"
import type { FisioterapiaBitacora, FisioterapiaSolicitud, FisioterapiaSolicitudEstado, UserProfile } from "@/lib/types"
import { EstadoBadge, PrioridadBadge } from "./badges"
import { AthleteHistoryDrawer } from "./athlete-history-drawer"
import { ContactPersonDrawer } from "./contact-drawer"
import { fisioSheetClass, fisioSheetHandleClass } from "./drawer-styles"

export function SolicitudDrawer({
  open,
  onOpenChange,
  solicitud,
  actor,
  fisioterapeutas,
  bitacora,
  onChanged,
  onRegisterActivity,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  solicitud: FisioterapiaSolicitud | null
  actor: FisioterapiaActor
  fisioterapeutas: UserProfile[]
  bitacora: FisioterapiaBitacora[]
  onChanged: () => void
  onRegisterActivity?: () => void
}) {
  const [fisioId, setFisioId] = useState("")
  const [estado, setEstado] = useState<FisioterapiaSolicitudEstado>("Asignada")
  const [realizado, setRealizado] = useState("")
  const [historyOpen, setHistoryOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const [detail, setDetail] = useState<FisioterapiaBitacora | null>(null)
  const [saving, setSaving] = useState(false)
  const perms = getFisioterapiaPermissions(actor)
  const related = useMemo(
    () => bitacora.filter((item) => item.solicitudId === solicitud?.id),
    [bitacora, solicitud],
  )

  if (!solicitud) return null
  const current = solicitud

  async function handleAssign() {
    const selected = fisioterapeutas.find((item) => item.id === fisioId)
    if (!selected) return
    setSaving(true)
    try {
      await assignSolicitud(actor, current.id, selected.id, selected.nombres)
      onChanged()
    } finally {
      setSaving(false)
    }
  }

  async function handleEstado() {
    setSaving(true)
    try {
      if (estado === "Realizada") {
        await finalizarSolicitudEnBitacora(actor, current.id, realizado || "Actividad realizada")
      } else {
        await updateSolicitudEstado(actor, current.id, estado)
      }
      onChanged()
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent side="bottom" className={fisioSheetClass}>
          <div className={fisioSheetHandleClass} />
          <DrawerHeader className="pt-2">
            <DrawerTitle>Solicitud #{String(solicitud.numero).padStart(5, "0")}</DrawerTitle>
            <DrawerDescription>{TIPO_SOLICITUD_LABEL[solicitud.tipo]}</DrawerDescription>
          </DrawerHeader>
          <ScrollArea className="min-h-0 flex-1 overflow-y-auto px-6">
            <div className="space-y-4 pb-6">
              <div className="flex flex-wrap gap-2">
                <PrioridadBadge prioridad={solicitud.prioridad} />
                <EstadoBadge estado={solicitud.estado} />
              </div>
              <div className="grid gap-2 text-sm">
                <p><span className="text-slate-600">Fecha:</span> {solicitud.fechaSolicitada.toLocaleDateString("es-CO")} {solicitud.hora}</p>
                <p><span className="text-slate-600">Lugar:</span> {solicitud.lugar}</p>
                <p><span className="text-slate-600">Grupo:</span> {solicitud.grupoNombre}</p>
                <p><span className="text-slate-600">Entrenador:</span> {solicitud.entrenadorNombre}</p>
                <p><span className="text-slate-600">Deportista:</span> {solicitud.deportistaNombre || "No aplica"}</p>
                <p><span className="text-slate-600">Asignado:</span> {solicitud.fisioterapeutaNombre || "Sin asignar"}</p>
              </div>
              <p className="text-sm">{solicitud.descripcion}</p>
              {solicitud.observaciones && (
                <p className="text-sm text-slate-600">Obs.: {solicitud.observaciones}</p>
              )}
              <Separator />
              <div className="flex flex-wrap gap-2">
                {solicitud.entrenadorId && (
                  <Button variant="outline" className="h-10 justify-center" onClick={() => setContactOpen(true)}>
                    Contactar entrenador
                  </Button>
                )}
                {solicitud.deportistaId && (
                  <Button variant="outline" className="h-10 justify-center" onClick={() => setHistoryOpen(true)}>
                    Ver historial
                  </Button>
                )}
                {onRegisterActivity && (
                  <Button variant="outline" className="h-9 justify-center" onClick={onRegisterActivity}>
                    Registrar actividad
                  </Button>
                )}
                {related[0] && (
                  <Button variant="outline" className="h-9 justify-center" onClick={() => setDetail(related[0])}>
                    Ver bitácora relacionada
                  </Button>
                )}
              </div>
              {perms.canAssignSolicitudes && (
                <div className="space-y-2 rounded-md border bg-slate-50 p-3">
                  <Label>Asignar fisioterapeuta</Label>
                  <Combobox
                    options={fisioterapeutas.map((item) => ({ value: item.id, label: item.nombres }))}
                    value={fisioId}
                    onValueChange={setFisioId}
                    placeholder="Seleccionar"
                  />
                  <Button onClick={handleAssign} disabled={saving || !fisioId} className="h-9 w-full justify-center bg-teal-800 hover:bg-teal-700">
                    Asignar
                  </Button>
                </div>
              )}
              {(perms.canAssignSolicitudes || solicitud.fisioterapeutaId === (actor.kind === "fisioterapeuta" ? actor.userId : "")) && (
                <div className="space-y-2 rounded-md border p-3">
                  <Label>Cambiar estado</Label>
                  <Select value={estado} onValueChange={(v) => setEstado(v as FisioterapiaSolicitudEstado)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asignada">Asignada</SelectItem>
                      <SelectItem value="En proceso">En proceso</SelectItem>
                      <SelectItem value="Realizada">Realizada</SelectItem>
                      <SelectItem value="Cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                  {estado === "Realizada" && (
                    <Textarea
                      placeholder="Qué se realizó"
                      value={realizado}
                      onChange={(e) => setRealizado(e.target.value)}
                    />
                  )}
                  <Button onClick={handleEstado} disabled={saving} className="h-9 w-full justify-center">
                    Actualizar estado
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
          <DrawerFooter />
        </DrawerContent>
      </Drawer>

      <ContactPersonDrawer
        open={contactOpen}
        onOpenChange={setContactOpen}
        nested
        userId={solicitud.entrenadorId}
        fallbackName={solicitud.entrenadorNombre}
        roleLabel="entrenador"
      />

      <AthleteHistoryDrawer
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        nested
        actor={actor}
        deportistaId={solicitud.deportistaId || null}
        onOpenBitacora={setDetail}
      />

      <Drawer open={Boolean(detail)} onOpenChange={(v) => !v && setDetail(null)}>
        <DrawerContent nested side="bottom" className={fisioSheetClass}>
          <DrawerHeader>
            <DrawerTitle>Detalle de atención</DrawerTitle>
            <DrawerDescription>{detail?.tipo}</DrawerDescription>
          </DrawerHeader>
          <ScrollArea className="h-[calc(100vh-8rem)] px-6 pb-6">
            {detail && (
              <div className="space-y-2 text-sm">
                <p>{detail.fecha.toLocaleDateString("es-CO")} {detail.hora}</p>
                <p>{detail.descripcion || detail.descripcionIncidente}</p>
                {detail.intervencion && <p>Intervención: {detail.intervencion}</p>}
                {detail.recomendaciones && <p>Recomendaciones: {detail.recomendaciones}</p>}
                {detail.observaciones && <p>Obs.: {detail.observaciones}</p>}
                <Button variant="outline" className="mt-4 h-9 justify-center" onClick={() => setDetail(null)}>
                  Volver
                </Button>
              </div>
            )}
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    </>
  )
}

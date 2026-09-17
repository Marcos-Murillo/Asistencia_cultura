"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Badge } from "@/components/ui/badge"
import { getAthleteHistory } from "@/lib/fisioterapia"
import { getUserById, getUserEnrollments, getGroupManagers } from "@/lib/db-router"
import type { FisioterapiaActor } from "@/lib/fisioterapia-permissions"
import type { FisioterapiaBitacora, UserProfile } from "@/lib/types"
import { SeguimientoBadge, EstadoBadge } from "./badges"
import { fisioSheetClass, fisioSheetHandleClass } from "./drawer-styles"

export function AthleteHistoryDrawer({
  open,
  onOpenChange,
  nested,
  actor,
  deportistaId,
  onOpenBitacora,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  nested?: boolean
  actor: FisioterapiaActor
  deportistaId: string | null
  onOpenBitacora?: (record: FisioterapiaBitacora) => void
}) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [grupos, setGrupos] = useState<string[]>([])
  const [entrenadores, setEntrenadores] = useState<string[]>([])
  const [history, setHistory] = useState<Awaited<ReturnType<typeof getAthleteHistory>> | null>(null)

  useEffect(() => {
    if (!open || !deportistaId) return
    let cancelled = false
    ;(async () => {
      const [profile, enrollments, hist] = await Promise.all([
        getUserById("deporte", deportistaId),
        getUserEnrollments("deporte", deportistaId),
        getAthleteHistory(actor, deportistaId),
      ])
      if (cancelled) return
      setUser(profile)
      const groupNames = enrollments.map((item) => item.grupoCultural)
      setGrupos(groupNames)
      const managers = await Promise.all(groupNames.map((name) => getGroupManagers("deporte", name)))
      if (cancelled) return
      setEntrenadores(
        Array.from(
          new Set(
            managers.flat().map((item) => item.user.nombres).filter(Boolean),
          ),
        ),
      )
      setHistory(hist)
    })()
    return () => {
      cancelled = true
    }
  }, [open, deportistaId, actor])

  const lesiones = useMemo(
    () => history?.bitacora.filter((item) => item.tipo === "atencion") || [],
    [history],
  )

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent nested={nested} side="bottom" className={fisioSheetClass}>
        <div className={fisioSheetHandleClass} />
        <DrawerHeader>
          <DrawerTitle>Historial del deportista</DrawerTitle>
          <DrawerDescription>Consulta clínica. El perfil principal no se modifica aquí.</DrawerDescription>
        </DrawerHeader>
        <ScrollArea className="h-[calc(100vh-8rem)] px-6 pb-8">
          {!user ? (
            <p className="text-sm text-slate-500">Cargando información...</p>
          ) : (
            <div className="space-y-5">
              <section>
                <p className="text-lg font-semibold">{user.nombres}</p>
                <p className="text-sm text-slate-600">{user.correo}</p>
                <p className="text-sm text-slate-600">Documento: {user.numeroDocumento}</p>
                <p className="text-sm text-slate-600">Teléfono: {user.telefono}</p>
              </section>
              <Separator />
              <section>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Grupos</p>
                <div className="flex flex-wrap gap-2">
                  {grupos.length === 0 ? (
                    <span className="text-sm text-slate-500">Sin inscripciones</span>
                  ) : (
                    grupos.map((grupo) => (
                      <Badge key={grupo} variant="secondary">
                        {grupo}
                      </Badge>
                    ))
                  )}
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Entrenador(es): {entrenadores.join(", ") || "No asignado"}
                </p>
              </section>
              <section>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Lesiones / atenciones</p>
                {lesiones.length === 0 ? (
                  <p className="text-sm text-slate-500">Sin atenciones registradas</p>
                ) : (
                  lesiones.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onOpenBitacora?.(item)}
                      className="mb-2 w-full rounded-md border bg-white p-3 text-left hover:border-teal-300"
                    >
                      <p className="text-sm font-medium">{item.tipoLesion || item.motivoAtencion}</p>
                      <p className="text-xs text-slate-500">
                        {item.fecha.toLocaleDateString("es-CO")} · {item.zonaCorporal || "Zona no registrada"}
                      </p>
                    </button>
                  ))
                )}
              </section>
              <section>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Solicitudes</p>
                {history?.solicitudes.length ? (
                  history.solicitudes.map((item) => (
                    <div key={item.id} className="mb-2 flex items-center justify-between rounded-md border p-3">
                      <span className="text-sm">#{String(item.numero).padStart(5, "0")}</span>
                      <EstadoBadge estado={item.estado} />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Sin solicitudes relacionadas</p>
                )}
              </section>
              <section>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Seguimientos</p>
                {history?.seguimientos.length ? (
                  history.seguimientos.map((item) => (
                    <div key={item.id} className="mb-2 rounded-md border p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm">{item.lesionAtencion}</p>
                        <SeguimientoBadge estado={item.estado} />
                      </div>
                      <p className="text-xs text-slate-500">
                        Programado: {item.fechaProgramada.toLocaleDateString("es-CO")}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Sin seguimientos</p>
                )}
              </section>
            </div>
          )}
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  )
}

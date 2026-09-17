"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { listBitacora, listSeguimientos, listSolicitudes } from "@/lib/fisioterapia"
import { useFisioActor } from "@/lib/fisioterapia-session"
import type { FisioterapiaBitacora, FisioterapiaSeguimiento, FisioterapiaSolicitud } from "@/lib/types"
import { ChevronRight, NotebookPen, Activity, CalendarClock, Users } from "lucide-react"

function Stat({ label, value, href }: { label: string; value: number; href?: string }) {
  const content = (
    <Card className="border-teal-100 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tabular-nums text-teal-900">{value}</p>
      </CardContent>
    </Card>
  )
  return href ? <Link href={href}>{content}</Link> : content
}

export default function FisioterapiaDashboardPage() {
  const actor = useFisioActor()
  const [solicitudes, setSolicitudes] = useState<FisioterapiaSolicitud[]>([])
  const [bitacora, setBitacora] = useState<FisioterapiaBitacora[]>([])
  const [seguimientos, setSeguimientos] = useState<FisioterapiaSeguimiento[]>([])

  useEffect(() => {
    if (!actor) return
    Promise.all([listSolicitudes(actor), listBitacora(actor), listSeguimientos(actor)]).then(
      ([s, b, g]) => {
        setSolicitudes(s)
        setBitacora(b)
        setSeguimientos(g)
      },
    )
  }, [actor])

  const stats = useMemo(() => {
    const atenciones = bitacora.filter((item) => item.tipo === "atencion").length
    const lesiones = bitacora.filter((item) => item.tipo === "atencion" && item.tipoLesion).length
    const actividades = bitacora.filter((item) => item.tipo === "actividad").length
    return {
      atenciones,
      lesiones,
      actividades,
      pendientes: solicitudes.filter((item) => item.estado === "Pendiente").length,
      nuevas: solicitudes.filter((item) => item.estado === "Pendiente").length,
      enProceso: solicitudes.filter((item) => item.estado === "En proceso" || item.estado === "Asignada").length,
      seguimientos: seguimientos.filter((item) => item.estado === "Pendiente").length,
    }
  }, [bitacora, solicitudes, seguimientos])

  const esEncargado = actor?.kind === "fisioterapeuta" && actor.esEncargado
  const byFisio = useMemo(() => {
    const map = new Map<string, number>()
    solicitudes.forEach((item) => {
      if (!item.fisioterapeutaNombre) return
      map.set(item.fisioterapeutaNombre, (map.get(item.fisioterapeutaNombre) || 0) + 1)
    })
    return Array.from(map.entries())
  }, [solicitudes])

  const shortcuts = [
    { href: "/fisioterapia/bitacora?nuevo=1", label: "Registrar", icon: NotebookPen },
    { href: "/fisioterapia/solicitudes", label: "Solicitudes", icon: Activity },
    { href: "/fisioterapia/seguimientos", label: "Seguimiento", icon: CalendarClock },
    { href: "/fisioterapia/deportistas", label: "Deportistas", icon: Users },
  ]

  return (
    <div className="space-y-3 md:space-y-6">
      <div className="hidden md:block">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Panel clínico</h1>
        <p className="text-sm text-slate-500">Resumen operativo para el trabajo en campo.</p>
      </div>

      <div className="grid grid-cols-2 gap-2 md:hidden">
        <Link href="/fisioterapia/solicitudes" className="rounded-lg border border-teal-100 bg-white px-3 py-2.5">
          <p className="text-[10px] text-slate-500">Pendientes</p>
          <p className="text-xl font-semibold tabular-nums text-teal-900">{stats.pendientes}</p>
        </Link>
        <Link href="/fisioterapia/seguimientos" className="rounded-lg border border-teal-100 bg-white px-3 py-2.5">
          <p className="text-[10px] text-slate-500">Seguimientos</p>
          <p className="text-xl font-semibold tabular-nums text-teal-900">{stats.seguimientos}</p>
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-1 md:hidden">
        {shortcuts.map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 py-1 text-center">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-800 text-white">
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-[9px] font-medium text-slate-600">{item.label}</span>
            </Link>
          )
        })}
      </div>

      <div className="hidden grid-cols-2 gap-3 md:grid lg:grid-cols-4">
        <Stat label="Atenciones" value={stats.atenciones} href="/fisioterapia/bitacora" />
        <Stat label="Lesiones" value={stats.lesiones} href="/fisioterapia/bitacora" />
        <Stat label="Actividades" value={stats.actividades} href="/fisioterapia/actividades" />
        <Stat label="Pendientes" value={stats.pendientes} href="/fisioterapia/solicitudes" />
        <Stat label="Solicitudes nuevas" value={stats.nuevas} href="/fisioterapia/solicitudes" />
        <Stat label="En proceso" value={stats.enProceso} href="/fisioterapia/actividades" />
        <Stat label="Seguimientos" value={stats.seguimientos} href="/fisioterapia/seguimientos" />
        {esEncargado && <Stat label="Total solicitudes" value={solicitudes.length} href="/fisioterapia/solicitudes" />}
      </div>

      <div className="space-y-1.5 md:hidden">
        <p className="px-0.5 text-[11px] font-semibold text-slate-600">Recientes</p>
        {bitacora.slice(0, 6).map((item) => (
          <Link
            key={item.id}
            href="/fisioterapia/bitacora"
            className="flex items-center justify-between rounded-lg border border-teal-100 bg-white px-2.5 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-xs font-medium">{item.deportistaNombre || item.grupoNombre || "Registro"}</p>
              <p className="text-[10px] text-slate-500">{item.fecha.toLocaleDateString("es-CO")}</p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          </Link>
        ))}
      </div>

      {esEncargado && (
        <div className="hidden gap-4 md:grid lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actividades por fisioterapeuta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {byFisio.length === 0 && <p className="text-sm text-slate-500">Sin asignaciones aún.</p>}
              {byFisio.map(([name, count]) => (
                <div key={name} className="flex items-center justify-between text-sm">
                  <span>{name}</span>
                  <span className="font-semibold tabular-nums">{count}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Atenciones recientes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {bitacora.slice(0, 6).map((item) => (
                <div key={item.id} className="flex justify-between gap-3 text-sm">
                  <span className="truncate">{item.deportistaNombre || item.grupoNombre || item.descripcion}</span>
                  <span className="shrink-0 text-slate-500">{item.fecha.toLocaleDateString("es-CO")}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

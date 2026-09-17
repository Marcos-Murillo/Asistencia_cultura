"use client"

import type { ReactNode } from "react"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import type { FisioterapiaBitacora, FisioterapiaSolicitud, UserProfile } from "@/lib/types"
import { EstadoBadge } from "./badges"

export function DeportistaHover({
  user,
  lastAtencion,
  seguimiento,
  grupo,
  entrenador,
  children,
}: {
  user?: Pick<UserProfile, "nombres" | "correo" | "telefono" | "numeroDocumento">
  lastAtencion?: string
  seguimiento?: string
  grupo?: string
  entrenador?: string
  children: ReactNode
}) {
  return (
    <HoverCard openDelay={180}>
      <HoverCardTrigger asChild>
        <button type="button" className="text-left font-medium text-teal-800 hover:underline">
          {children}
        </button>
      </HoverCardTrigger>
      <HoverCardContent>
        <p className="font-semibold text-slate-900">{user?.nombres || children}</p>
        {grupo && <p className="text-sm text-slate-600">Grupo: {grupo}</p>}
        {entrenador && <p className="text-sm text-slate-600">Entrenador: {entrenador}</p>}
        {user?.correo && <p className="text-xs text-slate-500">{user.correo}</p>}
        <p className="mt-2 text-xs text-slate-500">Última atención: {lastAtencion || "Sin registros"}</p>
        <p className="text-xs text-slate-500">Seguimiento: {seguimiento || "N/A"}</p>
      </HoverCardContent>
    </HoverCard>
  )
}

export function GrupoHover({ nombre, entrenador, inscritos, children }: {
  nombre: string
  entrenador?: string
  inscritos?: number
  children: ReactNode
}) {
  return (
    <HoverCard openDelay={180}>
      <HoverCardTrigger asChild>
        <button type="button" className="text-left hover:underline">{children}</button>
      </HoverCardTrigger>
      <HoverCardContent>
        <p className="font-semibold">{nombre}</p>
        {entrenador && <p className="text-sm text-slate-600">Entrenador: {entrenador}</p>}
        {typeof inscritos === "number" && (
          <p className="text-sm text-slate-600">{inscritos} deportistas inscritos</p>
        )}
      </HoverCardContent>
    </HoverCard>
  )
}

export function EstadoHover({ solicitud }: { solicitud: Pick<FisioterapiaSolicitud, "estado" | "fisioterapeutaNombre" | "updatedAt"> }) {
  return (
    <HoverCard openDelay={180}>
      <HoverCardTrigger asChild>
        <span className="inline-flex cursor-default">
          <EstadoBadge estado={solicitud.estado} />
        </span>
      </HoverCardTrigger>
      <HoverCardContent>
        <p className="text-sm">Estado: {solicitud.estado}</p>
        <p className="text-sm text-slate-600">Asignado: {solicitud.fisioterapeutaNombre || "Sin asignar"}</p>
        <p className="text-xs text-slate-500">
          Actualizado: {solicitud.updatedAt.toLocaleString("es-CO")}
        </p>
      </HoverCardContent>
    </HoverCard>
  )
}

export function lastAtencionLabel(records: FisioterapiaBitacora[], deportistaId?: string) {
  if (!deportistaId) return undefined
  const match = records.find((item) => item.deportistaId === deportistaId && item.tipo === "atencion")
  return match ? match.fecha.toLocaleDateString("es-CO") : undefined
}

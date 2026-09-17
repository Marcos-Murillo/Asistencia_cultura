import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type {
  FisioterapiaPrioridad,
  FisioterapiaSeguimientoEstado,
  FisioterapiaSolicitudEstado,
} from "@/lib/types"

export function EstadoBadge({ estado }: { estado: FisioterapiaSolicitudEstado | string }) {
  const map: Record<string, string> = {
    Pendiente: "bg-amber-100 text-amber-900 border-amber-200",
    Asignada: "bg-sky-100 text-sky-900 border-sky-200",
    "En proceso": "bg-indigo-100 text-indigo-900 border-indigo-200",
    Realizada: "bg-emerald-100 text-emerald-900 border-emerald-200",
    Cancelada: "bg-slate-100 text-slate-600 border-slate-200",
  }
  return (
    <Badge variant="outline" className={cn("font-medium", map[estado] || "")}>
      {estado}
    </Badge>
  )
}

export function PrioridadBadge({ prioridad }: { prioridad: FisioterapiaPrioridad }) {
  const map: Record<FisioterapiaPrioridad, string> = {
    Baja: "bg-slate-100 text-slate-700 border-slate-200",
    Media: "bg-blue-100 text-blue-800 border-blue-200",
    Alta: "bg-orange-100 text-orange-800 border-orange-200",
    Urgente: "bg-red-100 text-red-800 border-red-200",
  }
  return (
    <Badge variant="outline" className={cn("font-medium", map[prioridad])}>
      {prioridad}
    </Badge>
  )
}

export function SeguimientoBadge({ estado }: { estado: FisioterapiaSeguimientoEstado }) {
  const map: Record<FisioterapiaSeguimientoEstado, string> = {
    Pendiente: "bg-amber-100 text-amber-900 border-amber-200",
    Realizado: "bg-emerald-100 text-emerald-900 border-emerald-200",
    "No asistió": "bg-orange-100 text-orange-800 border-orange-200",
    Cancelado: "bg-slate-100 text-slate-600 border-slate-200",
  }
  return (
    <Badge variant="outline" className={cn("font-medium", map[estado])}>
      {estado}
    </Badge>
  )
}

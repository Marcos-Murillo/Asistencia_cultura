import type { PosicionGrupo, Torneo, TorneoPartido } from "./types"

export function inicioInscripcion(torneo: Torneo): Date {
  return torneo.inscripcionInicio ?? torneo.fechaInicio
}

export function finInscripcion(torneo: Torneo): Date {
  return torneo.inscripcionFin ?? torneo.fechaFin
}

export function inscripcionAbierta(torneo: Torneo, now = new Date()): boolean {
  if (torneo.activo === false || torneo.fase !== "inscripcion") return false
  return now >= inicioInscripcion(torneo) && now <= finInscripcion(torneo)
}

export function inscripcionCerrada(torneo: Torneo, now = new Date()): boolean {
  if (torneo.fase !== "inscripcion") return false
  return now > finInscripcion(torneo)
}

export function estadoInscripcion(torneo: Torneo, now = new Date()): "pendiente" | "abierta" | "cerrada" {
  if (torneo.fase !== "inscripcion") return "cerrada"
  if (now < inicioInscripcion(torneo)) return "pendiente"
  if (now > finInscripcion(torneo)) return "cerrada"
  return "abierta"
}

export function toDateInput(date?: Date): string {
  if (!date || Number.isNaN(date.getTime())) return ""
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function fromDateInput(value: string, endOfDay = false): Date {
  const [y, m, d] = value.split("-").map(Number)
  return endOfDay
    ? new Date(y, m - 1, d, 23, 59, 59, 999)
    : new Date(y, m - 1, d, 0, 0, 0, 0)
}

export const TORNEO_DEPORTES: { value: Torneo["deporte"]; label: string }[] = [
  { value: "futbol", label: "Fútbol" },
  { value: "baloncesto", label: "Baloncesto" },
  { value: "voleibol", label: "Voleibol" },
  { value: "tenis_mesa", label: "Tenis de mesa" },
  { value: "ajedrez", label: "Ajedrez" },
  { value: "natacion", label: "Natación" },
  { value: "atletismo", label: "Atletismo" },
  { value: "otro", label: "Otro" },
]

export function labelDeporte(deporte: Torneo["deporte"]): string {
  return TORNEO_DEPORTES.find((item) => item.value === deporte)?.label ?? deporte
}

export const FASE_TORNEO_LABEL: Record<Torneo["fase"], string> = {
  inscripcion: "Inscripción",
  grupos: "Fase de grupos",
  eliminatorias: "Eliminatorias",
  finalizado: "Finalizado",
}

export function calcularPosiciones(
  partidos: TorneoPartido[],
  participantes: string[],
  nombres: Record<string, string>,
): PosicionGrupo[] {
  const map = new Map<string, PosicionGrupo>()
  participantes.forEach((id) => {
    map.set(id, { equipoId: id, nombre: nombres[id] || "Equipo", pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0, pts: 0 })
  })
  partidos
    .filter((partido) => partido.jugado && partido.golesLocal != null && partido.golesVisitante != null)
    .forEach((partido) => {
      const local = map.get(partido.local)
      const visitante = map.get(partido.visitante)
      if (!local || !visitante) return
      local.pj += 1
      visitante.pj += 1
      local.gf += partido.golesLocal!
      local.gc += partido.golesVisitante!
      visitante.gf += partido.golesVisitante!
      visitante.gc += partido.golesLocal!
      if (partido.golesLocal! > partido.golesVisitante!) {
        local.pg += 1
        local.pts += 3
        visitante.pp += 1
      } else if (partido.golesLocal! < partido.golesVisitante!) {
        visitante.pg += 1
        visitante.pts += 3
        local.pp += 1
      } else {
        local.pe += 1
        visitante.pe += 1
        local.pts += 1
        visitante.pts += 1
      }
      local.dg = local.gf - local.gc
      visitante.dg = visitante.gf - visitante.gc
    })
  return Array.from(map.values()).sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf)
}

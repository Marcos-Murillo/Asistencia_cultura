import type { PosicionGrupo, Torneo, TorneoPartido } from "./types"

export type ColumnaPosicion = {
  key: "pts" | "pj" | "pg" | "pe" | "pp" | "gf" | "gc" | "dg" | "sf" | "sc" | "ds" | "pf" | "pc" | "dp"
  label: string
  title: string
  signed?: boolean
}

type ModoTabla = "goles" | "puntos" | "sets"

function configTabla(deporte: Torneo["deporte"]): {
  modo: ModoTabla
  victoria: number
  empate: number
  derrota: number
} {
  if (deporte === "baloncesto") return { modo: "puntos", victoria: 2, empate: 1, derrota: 1 }
  if (deporte === "voleibol") return { modo: "sets", victoria: 1, empate: 0, derrota: 0 }
  return { modo: "goles", victoria: 3, empate: 1, derrota: 0 }
}

export function columnasPosiciones(deporte: Torneo["deporte"]): ColumnaPosicion[] {
  if (deporte === "voleibol") {
    return [
      { key: "pts", label: "PTS", title: "Puntos" },
      { key: "pj", label: "PJ", title: "Partidos jugados" },
      { key: "pg", label: "PG", title: "Partidos ganados" },
      { key: "pp", label: "PP", title: "Partidos perdidos" },
      { key: "sf", label: "SF", title: "Sets a favor" },
      { key: "sc", label: "SC", title: "Sets en contra" },
      { key: "ds", label: "DS", title: "Diferencia de sets", signed: true },
      { key: "pf", label: "PF", title: "Puntos a favor" },
      { key: "pc", label: "PC", title: "Puntos en contra" },
      { key: "dp", label: "DP", title: "Diferencia de puntos", signed: true },
    ]
  }
  if (deporte === "baloncesto") {
    return [
      { key: "pts", label: "PTS", title: "Puntos" },
      { key: "pj", label: "PJ", title: "Partidos jugados" },
      { key: "pg", label: "PG", title: "Partidos ganados" },
      { key: "pp", label: "PP", title: "Partidos perdidos" },
      { key: "pf", label: "PF", title: "Puntos a favor" },
      { key: "pc", label: "PC", title: "Puntos en contra" },
      { key: "dp", label: "DIF", title: "Diferencia de puntos", signed: true },
    ]
  }
  return [
    { key: "pts", label: "PTS", title: "Puntos" },
    { key: "pj", label: "PJ", title: "Partidos jugados" },
    { key: "pg", label: "PG", title: "Partidos ganados" },
    { key: "pe", label: "PE", title: "Partidos empatados" },
    { key: "pp", label: "PP", title: "Partidos perdidos" },
    { key: "gf", label: "GF", title: "Goles a favor" },
    { key: "gc", label: "GC", title: "Goles en contra" },
    { key: "dg", label: "DG", title: "Diferencia de goles", signed: true },
  ]
}

export function reglaTablaTexto(deporte: Torneo["deporte"]): string {
  if (deporte === "voleibol") {
    return "Victoria 1, derrota 0. SF sets a favor, SC sets en contra, DP diferencia de puntos."
  }
  if (deporte === "baloncesto") {
    return "Victoria 2, derrota 1. DIF es la diferencia de puntos."
  }
  if (deporte === "futbol") {
    return "Victoria 3, empate 1, derrota 0. DG es la diferencia de goles."
  }
  return "Victoria 3, empate 1, derrota 0."
}

export function etiquetaMarcador(deporte: Torneo["deporte"]): { principal: string; puntos?: string } {
  if (deporte === "voleibol") return { principal: "Sets", puntos: "Puntos" }
  if (deporte === "baloncesto") return { principal: "Puntos" }
  if (deporte === "futbol") return { principal: "Goles" }
  return { principal: "Marcador" }
}

export function textoPosicion(fila: PosicionGrupo, columna: ColumnaPosicion): string {
  const value = fila[columna.key] ?? 0
  if (columna.signed && value > 0) return `+${value}`
  return String(value)
}

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

function filaVacia(id: string, nombre: string): PosicionGrupo {
  return {
    equipoId: id, nombre, pj: 0, pg: 0, pe: 0, pp: 0,
    gf: 0, gc: 0, dg: 0, pts: 0,
    sf: 0, sc: 0, ds: 0, pf: 0, pc: 0, dp: 0,
  }
}

export function calcularPosiciones(
  partidos: TorneoPartido[],
  participantes: string[],
  nombres: Record<string, string>,
  deporte: Torneo["deporte"] = "futbol",
): PosicionGrupo[] {
  const { modo, victoria, empate, derrota } = configTabla(deporte)
  const map = new Map<string, PosicionGrupo>()
  participantes.forEach((id) => {
    map.set(id, filaVacia(id, nombres[id] || "Equipo"))
  })
  partidos
    .filter((partido) => partido.jugado && partido.golesLocal != null && partido.golesVisitante != null)
    .forEach((partido) => {
      const local = map.get(partido.local)
      const visitante = map.get(partido.visitante)
      if (!local || !visitante) return
      const marcadorLocal = partido.golesLocal!
      const marcadorVisitante = partido.golesVisitante!
      local.pj += 1
      visitante.pj += 1
      if (modo === "goles") {
        local.gf += marcadorLocal
        local.gc += marcadorVisitante
        visitante.gf += marcadorVisitante
        visitante.gc += marcadorLocal
      } else if (modo === "puntos") {
        local.pf += marcadorLocal
        local.pc += marcadorVisitante
        visitante.pf += marcadorVisitante
        visitante.pc += marcadorLocal
      } else {
        local.sf += marcadorLocal
        local.sc += marcadorVisitante
        visitante.sf += marcadorVisitante
        visitante.sc += marcadorLocal
        if (partido.puntosLocal != null && partido.puntosVisitante != null && Number.isFinite(partido.puntosLocal) && Number.isFinite(partido.puntosVisitante)) {
          local.pf += partido.puntosLocal
          local.pc += partido.puntosVisitante
          visitante.pf += partido.puntosVisitante
          visitante.pc += partido.puntosLocal
        }
      }
      if (marcadorLocal > marcadorVisitante) {
        local.pg += 1
        local.pts += victoria
        visitante.pp += 1
        visitante.pts += derrota
      } else if (marcadorLocal < marcadorVisitante) {
        visitante.pg += 1
        visitante.pts += victoria
        local.pp += 1
        local.pts += derrota
      } else {
        local.pe += 1
        visitante.pe += 1
        local.pts += empate
        visitante.pts += empate
      }
      local.dg = local.gf - local.gc
      visitante.dg = visitante.gf - visitante.gc
      local.ds = local.sf - local.sc
      visitante.ds = visitante.sf - visitante.sc
      local.dp = local.pf - local.pc
      visitante.dp = visitante.pf - visitante.pc
    })
  return Array.from(map.values()).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts
    if (modo === "sets") return b.ds - a.ds || b.dp - a.dp || b.sf - a.sf
    if (modo === "puntos") return b.dp - a.dp || b.pf - a.pf
    return b.dg - a.dg || b.gf - a.gf
  })
}

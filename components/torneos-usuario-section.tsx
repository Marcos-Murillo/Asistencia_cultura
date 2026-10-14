"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Calendar, ChevronRight, MapPin, Trophy } from "lucide-react"
import {
  getEquiposByTorneo,
  getGruposByTorneo,
  getInscripcionesDeUsuario,
  getPartidosByTorneo,
  getTorneoById,
  getUserNamesByIds,
} from "@/lib/db-router"
import type { Torneo, TorneoEquipo, TorneoGrupo, TorneoInscripcion, TorneoPartido } from "@/lib/types"
import { calcularPosiciones, FASE_TORNEO_LABEL, labelDeporte } from "@/lib/torneo-utils"

type ResumenTorneo = {
  inscripcion: TorneoInscripcion
  torneo: Torneo
  equipoNombre?: string
}

const FASE_PARTIDO: Record<string, string> = {
  grupos: "Fase de grupos",
  octavos: "Octavos",
  cuartos: "Cuartos",
  semifinal: "Semifinal",
  final: "Final",
  tercer_puesto: "Tercer puesto",
}

function formatDia(date?: Date) {
  if (!date || Number.isNaN(date.getTime())) return ""
  return date.toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "short" })
}

export function TorneosUsuarioSection({ userId }: { userId: string }) {
  const [items, setItems] = useState<ResumenTorneo[]>([])
  const [loading, setLoading] = useState(true)
  const [abierto, setAbierto] = useState<ResumenTorneo | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getInscripcionesDeUsuario(userId)
      .then(async (inscripciones) => {
        const unicas = new Map<string, TorneoInscripcion>()
        inscripciones.forEach((item) => {
          if (!unicas.has(item.torneoId)) unicas.set(item.torneoId, item)
        })
        const resumenes: ResumenTorneo[] = []
        for (const inscripcion of unicas.values()) {
          const torneo = await getTorneoById(inscripcion.torneoId)
          if (!torneo) continue
          let equipoNombre: string | undefined
          if (inscripcion.equipoId) {
            const equipos = await getEquiposByTorneo(torneo.id)
            equipoNombre = equipos.find((equipo) => equipo.id === inscripcion.equipoId)?.nombre
          }
          resumenes.push({ inscripcion, torneo, equipoNombre })
        }
        if (!cancelled) setItems(resumenes)
      })
      .catch((error) => {
        console.error("Error loading user tournaments:", error)
        if (!cancelled) setItems([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  return (
    <section>
      <h2 className="mb-3 text-base sm:text-lg font-semibold">Torneos</h2>
      {loading ? (
        <div className="flex h-24 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-400 border-t-transparent" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-5 text-center text-sm text-zinc-400">
          Aún no estás inscrito en ningún torneo. Puedes inscribirte desde el botón ⋯.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <button
              key={item.inscripcion.id}
              type="button"
              onClick={() => setAbierto(item)}
              className="flex w-full items-center gap-3 rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4 text-left backdrop-blur-sm transition hover:bg-white/10"
            >
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-orange-500 to-amber-500">
                <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm sm:text-base font-medium">{item.torneo.nombre}</p>
                <p className="truncate text-xs text-zinc-400">
                  {labelDeporte(item.torneo.deporte)} · {FASE_TORNEO_LABEL[item.torneo.fase]}
                  {item.equipoNombre ? ` · ${item.equipoNombre}` : ""}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-zinc-500" />
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!abierto} onOpenChange={(open) => !open && setAbierto(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-zinc-800 bg-zinc-900 text-white w-[calc(100vw-2rem)] max-w-lg sm:max-w-2xl">
          {abierto && (
            <SeguimientoTorneo
              torneo={abierto.torneo}
              equipoId={abierto.inscripcion.equipoId}
              userId={userId}
              equipoNombre={abierto.equipoNombre}
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}

function SeguimientoTorneo({
  torneo,
  equipoId,
  userId,
  equipoNombre,
}: {
  torneo: Torneo
  equipoId?: string
  userId: string
  equipoNombre?: string
}) {
  const [loading, setLoading] = useState(true)
  const [equipos, setEquipos] = useState<TorneoEquipo[]>([])
  const [grupos, setGrupos] = useState<TorneoGrupo[]>([])
  const [partidos, setPartidos] = useState<TorneoPartido[]>([])
  const [nombresUsuarios, setNombresUsuarios] = useState<Record<string, string>>({})

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      getEquiposByTorneo(torneo.id),
      getGruposByTorneo(torneo.id),
      getPartidosByTorneo(torneo.id),
    ])
      .then(async ([eq, gr, pts]) => {
        if (cancelled) return
        setEquipos(eq)
        setGrupos(gr)
        setPartidos(pts)
        if (torneo.tipo === "individual") {
          const ids = Array.from(new Set(pts.flatMap((partido) => [partido.local, partido.visitante]).concat(gr.flatMap((grupo) => grupo.equipos))))
          setNombresUsuarios(await getUserNamesByIds(ids))
        }
      })
      .catch((error) => console.error("Error loading tournament follow-up:", error))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [torneo.id, torneo.tipo])

  const miId = equipoId || userId
  const nombres: Record<string, string> = {}
  equipos.forEach((equipo) => {
    nombres[equipo.id] = equipo.nombre
  })
  Object.entries(nombresUsuarios).forEach(([id, nombre]) => {
    nombres[id] = nombre
  })
  const nombreDe = (id: string) => nombres[id] || "Por definir"

  const partidosOrdenados = [...partidos].sort((a, b) => {
    const fechaA = a.fecha?.getTime() ?? Number.MAX_SAFE_INTEGER
    const fechaB = b.fecha?.getTime() ?? Number.MAX_SAFE_INTEGER
    return fechaA - fechaB
  })

  return (
    <>
      <DialogHeader>
        <DialogTitle className="pr-6 text-base sm:text-lg">{torneo.nombre}</DialogTitle>
        <DialogDescription className="text-zinc-400">
          {labelDeporte(torneo.deporte)} · {FASE_TORNEO_LABEL[torneo.fase]}
          {equipoNombre ? ` · Tu equipo: ${equipoNombre}` : ""}
        </DialogDescription>
      </DialogHeader>

      {loading ? (
        <div className="flex h-28 items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-orange-400 border-t-transparent" />
        </div>
      ) : torneo.fase === "inscripcion" ? (
        <p className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">
          Este torneo todavía está en inscripciones. Cuando el administrador arme los grupos, aquí vas a ver la tabla de puntos, los marcadores y las fechas de cada partido.
        </p>
      ) : (
        <div className="space-y-6">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-orange-200">Tabla de puntos</h3>
            {grupos.length === 0 ? (
              <p className="text-sm text-zinc-400">Todavía no hay grupos publicados.</p>
            ) : (
              <div className="space-y-3">
                {grupos.map((grupo) => {
                  const tabla = calcularPosiciones(
                    partidos.filter((partido) => partido.grupoId === grupo.id && partido.fase === "grupos"),
                    grupo.equipos,
                    nombres,
                  )
                  return (
                    <div key={grupo.id} className="overflow-hidden rounded-2xl border border-white/10">
                      <p className="bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-300">{grupo.nombre}</p>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[280px] text-left text-xs sm:text-sm">
                          <thead className="text-zinc-500">
                            <tr>
                              <th className="px-3 py-2 font-medium">Equipo</th>
                              <th className="px-2 py-2 text-center font-medium">PTS</th>
                              <th className="px-2 py-2 text-center font-medium">PJ</th>
                              <th className="px-2 py-2 text-center font-medium">DG</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tabla.map((fila, index) => {
                              const mio = fila.equipoId === miId
                              return (
                                <tr key={fila.equipoId} className={mio ? "bg-orange-500/15 text-orange-50" : "border-t border-white/5"}>
                                  <td className="px-3 py-2">
                                    <span className="mr-2 text-zinc-500">{index + 1}</span>
                                    {fila.nombre}
                                    {mio && <span className="ml-2 text-[10px] uppercase text-orange-300">Tú</span>}
                                  </td>
                                  <td className="px-2 py-2 text-center font-semibold">{fila.pts}</td>
                                  <td className="px-2 py-2 text-center">{fila.pj}</td>
                                  <td className="px-2 py-2 text-center">{fila.dg > 0 ? `+${fila.dg}` : fila.dg}</td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-orange-200">Partidos</h3>
            {partidosOrdenados.length === 0 ? (
              <p className="text-sm text-zinc-400">Todavía no hay partidos programados.</p>
            ) : (
              <div className="space-y-2">
                {partidosOrdenados.map((partido) => {
                  const mio = partido.local === miId || partido.visitante === miId
                  const lugar = partido.lugar || torneo.lugar
                  return (
                    <div
                      key={partido.id}
                      className={`rounded-2xl border p-3 ${mio ? "border-orange-400/40 bg-orange-500/10" : "border-white/10 bg-white/5"}`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-2 text-[11px] text-zinc-400">
                        <span>{FASE_PARTIDO[partido.fase] || partido.fase}</span>
                        <span>{partido.jugado ? "Finalizado" : "Por jugar"}</span>
                      </div>
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
                        <p className={`truncate text-right ${partido.local === miId ? "font-semibold text-orange-100" : ""}`}>{nombreDe(partido.local)}</p>
                        <p className="min-w-14 text-center font-bold">
                          {partido.jugado && partido.golesLocal != null && partido.golesVisitante != null
                            ? `${partido.golesLocal} - ${partido.golesVisitante}`
                            : "vs"}
                        </p>
                        <p className={`truncate ${partido.visitante === miId ? "font-semibold text-orange-100" : ""}`}>{nombreDe(partido.visitante)}</p>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-400">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {partido.fecha ? formatDia(partido.fecha) : "Fecha por confirmar"}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {lugar || "Lugar por confirmar"}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

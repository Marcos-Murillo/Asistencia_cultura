"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Calendar,
  Check,
  ChevronLeft,
  Copy,
  KeyRound,
  MapPin,
  Search,
  Shield,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react"
import {
  createEquipo,
  getEquiposByTorneo,
  getInscripcionDeUsuario,
  getMiembrosEquipo,
  getAllTorneos,
  inscribirEnTorneo,
  updateEquipoEscudo,
} from "@/lib/db-router"
import { ensureUserInArea, lookupParticipantByDocumento, mergeIdentityUser, type PortalIdentity } from "@/lib/participant-identity"
import type { Torneo, TorneoEquipo, UserProfile } from "@/lib/types"
import { finInscripcion, inicioInscripcion, inscripcionAbierta, labelDeporte } from "@/lib/torneo-utils"
import { cn } from "@/lib/utils"

type Step = "torneos" | "modo" | "crear" | "delegado" | "equipos" | "codigo" | "inscrito"

type Miembro = { userId: string; nombres: string; rol?: string }

interface TorneoInscripcionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  identity: PortalIdentity
  onIdentityUpdated: (identity: PortalIdentity) => void
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase()
}

function formatDay(date: Date) {
  return date.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })
}

async function fileToShield(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const size = 256
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("No se pudo preparar la imagen")
  const scale = Math.max(size / bitmap.width, size / bitmap.height)
  const w = bitmap.width * scale
  const h = bitmap.height * scale
  ctx.drawImage(bitmap, (size - w) / 2, (size - h) / 2, w, h)
  return canvas.toDataURL("image/jpeg", 0.72)
}

export function TorneoInscripcionDialog({
  open,
  onOpenChange,
  identity,
  onIdentityUpdated,
}: TorneoInscripcionDialogProps) {
  const [step, setStep] = useState<Step>("torneos")
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [torneos, setTorneos] = useState<Torneo[]>([])
  const [torneo, setTorneo] = useState<Torneo | null>(null)
  const [equipos, setEquipos] = useState<TorneoEquipo[]>([])
  const [equipo, setEquipo] = useState<TorneoEquipo | null>(null)
  const [miembros, setMiembros] = useState<Miembro[]>([])
  const [deporteUserId, setDeporteUserId] = useState<string | null>(identity.deporte?.id ?? null)
  const [nombreEquipo, setNombreEquipo] = useState("")
  const [escudo, setEscudo] = useState("")
  const [cedula, setCedula] = useState("")
  const [jugador, setJugador] = useState<UserProfile | null>(null)
  const [jugadorMensaje, setJugadorMensaje] = useState("")
  const [codigo, setCodigo] = useState("")
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    if (!open) return
    setStep("torneos")
    setError("")
    setTorneo(null)
    setEquipo(null)
    setNombreEquipo("")
    setEscudo("")
    setCedula("")
    setJugador(null)
    setJugadorMensaje("")
    setCodigo("")
    setLoading(true)
    getAllTorneos()
      .then((items) => setTorneos(items.filter((item) => item.tipo === "grupal" && inscripcionAbierta(item))))
      .catch(() => setError("No se pudieron cargar los torneos."))
      .finally(() => setLoading(false))
  }, [open])

  async function deporteUser(): Promise<string> {
    if (deporteUserId) return deporteUserId
    const ensured = await ensureUserInArea("deporte", identity.profile)
    setDeporteUserId(ensured.id)
    onIdentityUpdated(mergeIdentityUser(identity, "deporte", ensured))
    return ensured.id
  }

  async function abrirTorneo(item: Torneo) {
    setBusy(true)
    setError("")
    try {
      const userId = identity.deporte?.id ?? deporteUserId
      const [lista, inscripcion] = await Promise.all([
        getEquiposByTorneo(item.id),
        userId ? getInscripcionDeUsuario(item.id, userId) : Promise.resolve(null),
      ])
      setTorneo(item)
      setEquipos(lista)
      if (inscripcion?.equipoId) {
        const propio = lista.find((eq) => eq.id === inscripcion.equipoId) ?? null
        setEquipo(propio)
        if (propio) setMiembros(await getMiembrosEquipo(item.id, propio.id))
        setStep(inscripcion.rol === "delegado" || propio?.delegadoId === userId ? "delegado" : "inscrito")
      } else {
        setEquipo(null)
        setStep("modo")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo abrir el torneo.")
    } finally {
      setBusy(false)
    }
  }

  async function handleCrearEquipo() {
    if (!torneo || !nombreEquipo.trim()) {
      setError("Escribe el nombre del equipo.")
      return
    }
    setBusy(true)
    setError("")
    try {
      const userId = await deporteUser()
      const creado = await createEquipo(torneo.id, nombreEquipo.trim(), {
        delegadoId: userId,
        ...(escudo ? { escudoUrl: escudo } : {}),
      })
      setEquipo(creado)
      setEquipos((prev) => [...prev, creado])
      setMiembros([{ userId, nombres: identity.profile.nombres, rol: "delegado" }])
      setStep("delegado")
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el equipo.")
    } finally {
      setBusy(false)
    }
  }

  async function handleEscudo(file?: File) {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setError("El escudo debe ser una imagen.")
      return
    }
    setError("")
    try {
      const dataUrl = await fileToShield(file)
      setEscudo(dataUrl)
      if (equipo && step === "delegado") {
        await updateEquipoEscudo(equipo.id, dataUrl)
        setEquipo({ ...equipo, escudoUrl: dataUrl })
      }
    } catch {
      setError("No se pudo leer la imagen del escudo.")
    }
  }

  async function buscarCedula() {
    const documento = cedula.trim()
    if (documento.length < 4) {
      setJugador(null)
      setJugadorMensaje("Escribe la cédula completa.")
      return
    }
    setBusy(true)
    setJugador(null)
    setJugadorMensaje("")
    try {
      const lookup = await lookupParticipantByDocumento(documento)
      if (lookup.status === "not_found") {
        setJugadorMensaje("Esta persona no está registrada. Pídele que se inscriba en la plataforma y luego vuelve a buscar su cédula.")
        return
      }
      if (lookup.status === "conflict") {
        setJugadorMensaje("Esta cédula está en Cultura y Deporte con correos distintos. Bienestar debe unificar la cuenta antes de inscribirla.")
        return
      }
      setJugador(lookup.identity.profile)
    } catch {
      setJugadorMensaje("No se pudo consultar la cédula. Intenta de nuevo.")
    } finally {
      setBusy(false)
    }
  }

  async function inscribirJugador() {
    if (!torneo || !equipo || !jugador) return
    setBusy(true)
    setError("")
    try {
      const ensured = await ensureUserInArea("deporte", jugador)
      if (miembros.some((item) => item.userId === ensured.id)) {
        setError("Esta persona ya está en el equipo.")
        return
      }
      await inscribirEnTorneo(torneo.id, ensured.id, equipo.id, "jugador")
      setMiembros((prev) => [...prev, { userId: ensured.id, nombres: ensured.nombres, rol: "jugador" }])
      setJugador(null)
      setCedula("")
      setJugadorMensaje("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo inscribir a esta persona.")
    } finally {
      setBusy(false)
    }
  }

  async function unirseConCodigo() {
    if (!torneo || !equipo) return
    if (codigo.trim().toLowerCase() !== equipo.codigo.toLowerCase()) {
      setError("Ese código no corresponde a este equipo. Confírmalo con el delegado.")
      return
    }
    setBusy(true)
    setError("")
    try {
      const userId = await deporteUser()
      await inscribirEnTorneo(torneo.id, userId, equipo.id, "jugador")
      setMiembros(await getMiembrosEquipo(torneo.id, equipo.id))
      setStep("inscrito")
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo completar la inscripción.")
    } finally {
      setBusy(false)
    }
  }

  function copiarCodigo() {
    if (!equipo) return
    navigator.clipboard.writeText(equipo.codigo)
    setCopiado(true)
    window.setTimeout(() => setCopiado(false), 2000)
  }

  const titulo =
    step === "torneos" ? "Inscribirme a torneo" :
    step === "modo" ? torneo?.nombre ?? "Torneo" :
    step === "crear" ? "Crear equipo" :
    step === "delegado" ? equipo?.nombre ?? "Tu equipo" :
    step === "equipos" ? "Elige un equipo" :
    step === "codigo" ? equipo?.nombre ?? "Código del equipo" :
    "Ya estás inscrito"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-zinc-800 bg-zinc-900 text-white w-[calc(100vw-2rem)] max-w-lg sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {step !== "torneos" && (
              <button
                type="button"
                className="rounded-full p-1 text-zinc-400 hover:bg-white/10 hover:text-white"
                onClick={() => {
                  setError("")
                  if (step === "codigo") setStep("equipos")
                  else if (step === "crear" || step === "equipos") setStep("modo")
                  else setStep("torneos")
                }}
                aria-label="Volver"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            <DialogTitle className="text-base sm:text-lg">{titulo}</DialogTitle>
          </div>
          <DialogDescription className="text-zinc-400">
            {step === "torneos"
              ? "Estos son los torneos que el administrador dejó abiertos para inscripción."
              : torneo
                ? `${labelDeporte(torneo.deporte)} · inscripciones hasta ${formatDay(finInscripcion(torneo))}`
                : "Elige cómo quieres participar."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>
        )}

        {loading || busy && step === "torneos" ? (
          <div className="flex h-28 items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-orange-400 border-t-transparent" />
          </div>
        ) : step === "torneos" ? (
          <div className="space-y-2">
            {torneos.length === 0 ? (
              <p className="py-6 text-center text-sm text-zinc-400">
                Ahora no hay torneos con inscripciones abiertas.
              </p>
            ) : torneos.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={busy}
                onClick={() => abrirTorneo(item)}
                className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-left hover:bg-white/10"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500">
                  <Trophy className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.nombre}</p>
                  <p className="truncate text-xs text-zinc-400">{labelDeporte(item.deporte)} · {item.lugar}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-orange-200">
                    <Calendar className="h-3 w-3" />
                    {formatDay(inicioInscripcion(item))} — {formatDay(finInscripcion(item))}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : step === "modo" && torneo ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => { setError(""); setNombreEquipo(""); setEscudo(""); setStep("crear") }}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10"
            >
              <Shield className="mb-3 h-5 w-5 text-orange-300" />
              <p className="font-semibold">Crear un equipo</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                Tú quedas como delegado y ya inscrito. Después sumas a tus compañeros.
              </p>
            </button>
            <button
              type="button"
              onClick={() => { setError(""); setStep("equipos") }}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10"
            >
              <Users className="mb-3 h-5 w-5 text-orange-300" />
              <p className="font-semibold">Unirme a un equipo</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                Elige el equipo y escribe el código de 4 caracteres que te pasó el delegado.
              </p>
            </button>
          </div>
        ) : step === "crear" ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border border-white/10">
                {escudo ? <AvatarImage src={escudo} alt="Escudo del equipo" /> : null}
                <AvatarFallback className="bg-orange-500/20 text-orange-100">
                  {nombreEquipo ? initials(nombreEquipo) : <Shield className="h-5 w-5" />}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <Label htmlFor="escudo" className="text-zinc-300">Escudo (opcional)</Label>
                <Input
                  id="escudo"
                  type="file"
                  accept="image/*"
                  className="mt-1 border-zinc-700 bg-zinc-800 text-white file:mr-3 file:rounded-full file:border-0 file:bg-orange-500 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white"
                  onChange={(event) => handleEscudo(event.target.files?.[0])}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="nombre-equipo" className="text-zinc-300">Nombre del equipo</Label>
              <Input
                id="nombre-equipo"
                value={nombreEquipo}
                onChange={(event) => setNombreEquipo(event.target.value)}
                placeholder="Ej: Ingeniería"
                className="border-zinc-700 bg-zinc-800 text-white"
              />
            </div>
            <Button
              className="w-full bg-orange-500 font-semibold text-white hover:bg-orange-400"
              disabled={busy || !nombreEquipo.trim()}
              onClick={handleCrearEquipo}
            >
              {busy ? "Creando..." : "Crear equipo y quedar como delegado"}
            </Button>
          </div>
        ) : step === "delegado" && equipo ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
              <Avatar className="h-14 w-14 border border-white/10">
                {(escudo || equipo.escudoUrl) ? <AvatarImage src={escudo || equipo.escudoUrl} alt="" /> : null}
                <AvatarFallback className="bg-orange-500 text-white">{initials(equipo.nombre)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-semibold">{equipo.nombre}</p>
                <p className="text-xs text-zinc-400">Tú eres el delegado y ya estás inscrito.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-orange-400/30 bg-orange-500/10 p-3">
              <div className="flex items-start gap-2">
                <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-orange-200" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-orange-100">Cómo funciona el código</p>
                  <p className="mt-1 text-xs leading-relaxed text-orange-50/80">
                    Este código de 4 letras y números es la llave del equipo. Pásaselo solo a quienes quieras dentro.
                    Ellos entran a Deporte, abren el botón ⋯, eligen Inscribirme a torneo, seleccionan este torneo,
                    tocan el equipo y escriben el código. Sin ese código no pueden unirse. También puedes inscribirlos tú con su cédula.
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <code className="rounded-lg bg-zinc-950 px-3 py-1.5 font-mono text-lg tracking-[0.3em] text-white">
                      {equipo.codigo}
                    </code>
                    <Button type="button" size="sm" variant="outline" className="border-orange-300/40 bg-transparent text-orange-50 hover:bg-orange-500/20" onClick={copiarCodigo}>
                      {copiado ? <Check className="mr-1 h-3.5 w-3.5" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
                      {copiado ? "Copiado" : "Copiar"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="escudo-luego" className="text-zinc-300">Escudo del equipo (opcional)</Label>
              <Input
                id="escudo-luego"
                type="file"
                accept="image/*"
                className="border-zinc-700 bg-zinc-800 text-white file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-xs file:text-white"
                onChange={(event) => handleEscudo(event.target.files?.[0])}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cedula" className="text-zinc-300">Inscribir por cédula</Label>
              <div className="flex gap-2">
                <Input
                  id="cedula"
                  value={cedula}
                  onChange={(event) => setCedula(event.target.value)}
                  placeholder="Número de documento"
                  className="border-zinc-700 bg-zinc-800 text-white"
                />
                <Button type="button" variant="outline" className="border-zinc-700 bg-transparent text-white hover:bg-zinc-800" disabled={busy} onClick={buscarCedula}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              {jugadorMensaje && (
                <p className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-100">
                  {jugadorMensaje}
                </p>
              )}
              {jugador && (
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-lime-400/20 text-lime-100">{initials(jugador.nombres)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{jugador.nombres}</p>
                    <p className="truncate text-xs text-zinc-400">{jugador.numeroDocumento} · {jugador.estamento}</p>
                  </div>
                  <Button size="sm" className="bg-lime-400 font-semibold text-zinc-950 hover:bg-lime-300" disabled={busy} onClick={inscribirJugador}>
                    <UserPlus className="mr-1 h-3.5 w-3.5" />
                    Inscribir
                  </Button>
                </div>
              )}
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Integrantes ({miembros.length})</p>
              <ul className="space-y-1.5">
                {miembros.map((item) => (
                  <li key={item.userId} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-sm">
                    <span className="truncate">{item.nombres}</span>
                    {item.rol === "delegado" && <span className="text-[11px] text-orange-300">Delegado</span>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : step === "equipos" ? (
          <div className="space-y-2">
            {equipos.length === 0 ? (
              <p className="py-6 text-center text-sm text-zinc-400">Todavía no hay equipos. Puedes crear el primero.</p>
            ) : equipos.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => { setEquipo(item); setCodigo(""); setError(""); setStep("codigo") }}
                className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-left hover:bg-white/10"
              >
                <Avatar className="h-11 w-11 border border-white/10">
                  {item.escudoUrl ? <AvatarImage src={item.escudoUrl} alt="" /> : null}
                  <AvatarFallback className="bg-orange-500/80 text-white">{initials(item.nombre)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.nombre}</p>
                  <p className="text-xs text-zinc-400">Pide el código al delegado</p>
                </div>
              </button>
            ))}
          </div>
        ) : step === "codigo" && equipo ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                {equipo.escudoUrl ? <AvatarImage src={equipo.escudoUrl} alt="" /> : null}
                <AvatarFallback className="bg-orange-500 text-white">{initials(equipo.nombre)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{equipo.nombre}</p>
                <p className="flex items-center gap-1 text-xs text-zinc-400"><MapPin className="h-3 w-3" />{torneo?.lugar}</p>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="codigo-equipo" className="text-zinc-300">Código del delegado</Label>
              <Input
                id="codigo-equipo"
                value={codigo}
                maxLength={4}
                onChange={(event) => setCodigo(event.target.value.toUpperCase())}
                placeholder="4 caracteres"
                className="border-zinc-700 bg-zinc-800 text-center font-mono text-lg uppercase tracking-[0.3em] text-white"
              />
              <p className="text-xs text-zinc-500">Son 4 letras y números. Si no lo tienes, pídeselo a quien creó el equipo.</p>
            </div>
            <Button
              className="w-full bg-orange-500 font-semibold text-white hover:bg-orange-400"
              disabled={busy || codigo.trim().length !== 4}
              onClick={unirseConCodigo}
            >
              {busy ? "Inscribiendo..." : "Unirme al equipo"}
            </Button>
          </div>
        ) : step === "inscrito" && equipo ? (
          <div className={cn("rounded-2xl border border-lime-400/30 bg-lime-400/10 p-4")}>
            <p className="font-medium text-lime-100">Quedaste inscrito en {equipo.nombre}.</p>
            <p className="mt-1 text-sm text-lime-50/80">El delegado del equipo puede ver la lista completa.</p>
            <ul className="mt-3 space-y-1">
              {miembros.map((item) => (
                <li key={item.userId} className="text-sm text-white">{item.nombres}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

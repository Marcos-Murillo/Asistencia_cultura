"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import {
  Calendar,
  ChevronRight,
  Clock,
  Film,
  LogOut,
  MapPin,
  Megaphone,
  MoreHorizontal,
  Music,
  UserPlus,
} from "lucide-react"
import {
  enrollUserToGroup,
  getActiveEvents,
  getActiveRealEvents,
  getEventByIdRouter,
  getGroupAttendanceStats,
  getRealEventByIdRouter,
  getUserCinecluAttendance,
  getUserEnrollments,
  getUserEventEnrollments,
  getUserRealEventEnrollments,
  saveEventAttendance,
  saveRealEventAttendance,
  updateUserCodigoEstudiantil,
} from "@/lib/db-router"
import type { Event, UserProfile } from "@/lib/types"
import { cn } from "@/lib/utils"

type GroupActivity = {
  grupo: string
  asistencias: number
  fechaInscripcion: Date
}

type ActivityItem = {
  id: string
  tipo: "convocatoria" | "evento" | "cineclu"
  titulo: string
  subtitulo: string
  fecha?: Date
  lugar?: string
  hora?: string
  fechaApertura?: Date
  fechaVencimiento?: Date
}

type AvailableEnrollment = {
  id: string
  tipo: "convocatoria" | "evento"
  nombre: string
  lugar: string
  hora: string
  fechaEvento?: Date
  fechaApertura: Date
  fechaVencimiento: Date
}

interface CulturaUserProfileProps {
  user: UserProfile
  showPostRegistroQuestion: boolean
  onDismissQuestion: () => void
  onLogout: () => void
  onUserUpdated: (user: UserProfile) => void
  gruposDisponibles: string[]
}

function needsCodigoEstudiantil(user: UserProfile): boolean {
  if (user.estamento !== "ESTUDIANTE") return false
  const codigo = user.codigoEstudiantil?.replace(/\D/g, "") ?? ""
  return codigo.length !== 9
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function formatDate(date: Date) {
  return date.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })
}

function formatDateTime(date: Date) {
  return date.toLocaleString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function CulturaUserProfile({
  user,
  showPostRegistroQuestion,
  onDismissQuestion,
  onLogout,
  onUserUpdated,
  gruposDisponibles,
}: CulturaUserProfileProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState<GroupActivity[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null)
  const [showGroupDialog, setShowGroupDialog] = useState(false)
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [showCodigoDialog, setShowCodigoDialog] = useState(() => needsCodigoEstudiantil(user))
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuTutorialActive, setMenuTutorialActive] = useState(false)
  const [codigoEstudiantil, setCodigoEstudiantil] = useState("")
  const [isSavingCodigo, setIsSavingCodigo] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState("")
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [loadingAvailable, setLoadingAvailable] = useState(false)
  const [availableItems, setAvailableItems] = useState<AvailableEnrollment[]>([])
  const [enrollingEventId, setEnrollingEventId] = useState<string | null>(null)

  const enrolledGroupNames = groups.map((g) => g.grupo)
  const availableGroups = gruposDisponibles.filter((g) => !enrolledGroupNames.includes(g))
  const firstName = user.nombres.split(" ")[0]

  async function loadProfileData() {
    setLoading(true)
    try {
      const [enrollments, convIds, realIds, cinecluItems] = await Promise.all([
        getUserEnrollments("cultura", user.id),
        getUserEventEnrollments("cultura", user.id),
        getUserRealEventEnrollments("cultura", user.id),
        getUserCinecluAttendance("cultura", user.id),
      ])

      const groupStats = await Promise.all(
        enrollments.map(async (e) => {
          const stats = await getGroupAttendanceStats("cultura", e.grupoCultural, [user.id])
          return {
            grupo: e.grupoCultural,
            asistencias: stats[user.id] || 0,
            fechaInscripcion: e.fechaInscripcion,
          }
        }),
      )

      const convocatorias = (
        await Promise.all(convIds.map((id) => getEventByIdRouter("cultura", id)))
      ).filter((e): e is Event => e !== null)

      const eventos = (
        await Promise.all(realIds.map((id) => getRealEventByIdRouter("cultura", id)))
      ).filter((e): e is Event => e !== null)

      const activityItems: ActivityItem[] = [
        ...convocatorias.map((e) => ({
          id: e.id,
          tipo: "convocatoria" as const,
          titulo: e.nombre,
          subtitulo: `Convocatoria · ${e.lugar}`,
          fecha: e.fechaEvento,
          lugar: e.lugar,
          hora: e.hora,
          fechaApertura: e.fechaApertura,
          fechaVencimiento: e.fechaVencimiento,
        })),
        ...eventos.map((e) => ({
          id: e.id,
          tipo: "evento" as const,
          titulo: e.nombre,
          subtitulo: `Evento · ${e.lugar}`,
          fecha: e.fechaEvento,
          lugar: e.lugar,
          hora: e.hora,
          fechaApertura: e.fechaApertura,
          fechaVencimiento: e.fechaVencimiento,
        })),
        ...cinecluItems.map((e) => ({
          id: e.id,
          tipo: "cineclu" as const,
          titulo: e.pelicula,
          subtitulo: `Cineclú · ${formatDate(e.fecha)}`,
          fecha: e.fecha,
        })),
      ].sort((a, b) => {
        const dateA = a.fecha?.getTime() ?? 0
        const dateB = b.fecha?.getTime() ?? 0
        return dateB - dateA
      })

      setGroups(groupStats)
      setActivities(activityItems)
    } catch (error) {
      console.error("Error loading profile data:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar tu actividad. Intenta recargar la página.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function loadAvailableEnrollments() {
    setLoadingAvailable(true)
    try {
      const [convocatorias, eventos, convIds, realIds] = await Promise.all([
        getActiveEvents("cultura"),
        getActiveRealEvents("cultura"),
        getUserEventEnrollments("cultura", user.id),
        getUserRealEventEnrollments("cultura", user.id),
      ])

      const enrolledConv = new Set(convIds)
      const enrolledReal = new Set(realIds)

      const items: AvailableEnrollment[] = [
        ...convocatorias
          .filter((e) => !enrolledConv.has(e.id))
          .map((e) => ({
            id: e.id,
            tipo: "convocatoria" as const,
            nombre: e.nombre,
            lugar: e.lugar,
            hora: e.hora,
            fechaEvento: e.fechaEvento,
            fechaApertura: e.fechaApertura,
            fechaVencimiento: e.fechaVencimiento,
          })),
        ...eventos
          .filter((e) => !enrolledReal.has(e.id))
          .map((e) => ({
            id: e.id,
            tipo: "evento" as const,
            nombre: e.nombre,
            lugar: e.lugar,
            hora: e.hora,
            fechaEvento: e.fechaEvento,
            fechaApertura: e.fechaApertura,
            fechaVencimiento: e.fechaVencimiento,
          })),
      ]

      setAvailableItems(items)
    } catch (error) {
      console.error("Error loading available events:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las convocatorias y eventos disponibles.",
        variant: "destructive",
      })
    } finally {
      setLoadingAvailable(false)
    }
  }

  async function openEventEnrollmentDialog() {
    setShowEventDialog(true)
    await loadAvailableEnrollments()
  }

  useEffect(() => {
    loadProfileData()
  }, [user.id])

  useEffect(() => {
    if (!needsCodigoEstudiantil(user)) {
      setShowCodigoDialog(false)
    }
  }, [user.codigoEstudiantil, user.estamento])

  async function handleSaveCodigo() {
    const codigo = codigoEstudiantil.replace(/\D/g, "")
    if (codigo.length !== 9) {
      toast({
        title: "Código inválido",
        description: "El código estudiantil debe tener exactamente 9 dígitos.",
        variant: "destructive",
      })
      return
    }

    setIsSavingCodigo(true)
    try {
      await updateUserCodigoEstudiantil("cultura", user.id, codigo)
      onUserUpdated({ ...user, codigoEstudiantil: codigo })
      setShowCodigoDialog(false)
      toast({
        title: "Código guardado",
        description: "Tu código estudiantil quedó registrado correctamente.",
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "No se pudo guardar el código"
      toast({ title: "Error", description: message, variant: "destructive" })
    } finally {
      setIsSavingCodigo(false)
    }
  }

  async function handleEnrollGroup() {
    if (!selectedGroup) return
    setIsEnrolling(true)
    try {
      await enrollUserToGroup("cultura", user.id, selectedGroup)
      toast({
        title: "Inscripción exitosa",
        description: `Te inscribiste al grupo ${selectedGroup}`,
      })
      setShowGroupDialog(false)
      setSelectedGroup("")
      await loadProfileData()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "No se pudo completar la inscripción"
      toast({ title: "Error", description: message, variant: "destructive" })
    } finally {
      setIsEnrolling(false)
    }
  }

  async function handleEnrollEvent(item: AvailableEnrollment) {
    setEnrollingEventId(item.id)
    try {
      if (item.tipo === "evento") {
        await saveRealEventAttendance("cultura", user.id, item.id)
      } else {
        await saveEventAttendance("cultura", user.id, item.id)
      }
      toast({
        title: "Inscripción exitosa",
        description: `Te inscribiste a ${item.nombre}`,
      })
      await loadProfileData()
      await loadAvailableEnrollments()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "No se pudo completar la inscripción"
      toast({ title: "Error", description: message, variant: "destructive" })
    } finally {
      setEnrollingEventId(null)
    }
  }

  const convocatorias = activities.filter((a) => a.tipo === "convocatoria")
  const eventos = activities.filter((a) => a.tipo === "evento" || a.tipo === "cineclu")
  const availableConvocatorias = availableItems.filter((i) => i.tipo === "convocatoria")
  const availableEventos = availableItems.filter((i) => i.tipo === "evento")

  const highlightMenuButton = (showPostRegistroQuestion || menuTutorialActive) && !showCodigoDialog

  const handleMenuOpenChange = (open: boolean) => {
    setMenuOpen(open)
    if (open && showPostRegistroQuestion) {
      onDismissQuestion()
      setMenuTutorialActive(true)
    }
    if (!open && menuTutorialActive) {
      setMenuTutorialActive(false)
    }
  }

  const handleTutorialMenuAction = (action: () => void) => {
    setMenuTutorialActive(false)
    onDismissQuestion()
    action()
  }

  const dialogClass = "border-zinc-800 bg-zinc-900 text-white w-[calc(100vw-2rem)] max-w-lg sm:max-w-xl md:max-w-2xl"

  return (
    <div className="min-h-screen bg-zinc-950 text-white relative overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -right-16 h-48 w-48 sm:h-72 sm:w-72 rounded-full bg-fuchsia-600/20 blur-3xl" />
      <div className="pointer-events-none absolute top-40 -left-20 h-40 w-40 sm:h-64 sm:w-64 rounded-full bg-violet-600/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-56 w-56 sm:h-80 sm:w-80 rounded-full bg-lime-400/10 blur-3xl" />

      <div className="relative mx-auto w-full max-w-lg px-4 pb-8 pt-4 sm:px-6 sm:pb-10 sm:pt-6 md:max-w-3xl lg:max-w-5xl lg:px-8 lg:pb-12 lg:pt-8">
        {/* Profile header + menu */}
        <div className="mb-6 sm:mb-8 flex items-start justify-between gap-3 sm:gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4 md:gap-5">
            <Avatar className="h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 shrink-0 border-2 border-lime-400/60 shadow-lg shadow-lime-400/10">
              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-base sm:text-lg md:text-xl font-semibold text-white">
                {getInitials(user.nombres)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-zinc-400">Hola,</p>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight truncate">{firstName}</h1>
              <p className="text-xs sm:text-sm text-zinc-400 truncate">{user.nombres}</p>
            </div>
          </div>

          <div className="relative shrink-0">
            {highlightMenuButton && (
              <div
                className={cn(
                  "absolute z-20 rounded-2xl border border-lime-400/50 bg-zinc-900/95 px-3.5 py-3 text-xs text-lime-50 shadow-xl shadow-lime-400/20 backdrop-blur-sm",
                  "right-full top-1/2 mr-3 w-[min(240px,calc(100vw-5.5rem))] -translate-y-1/2",
                  "sm:right-0 sm:top-full sm:mr-0 sm:mt-3 sm:w-72 sm:translate-y-0 sm:text-sm",
                )}
              >
                <p className="font-semibold text-lime-300">¿Cómo inscribirte?</p>
                <p className="mt-1.5 leading-relaxed text-zinc-300">
                  Pulsa el botón <span className="font-semibold text-white">⋯</span> para abrir el menú y elegir grupo cultural, convocatoria o evento.
                </p>
                <div className="absolute -right-2 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border-r border-t border-lime-400/50 bg-zinc-900/95 sm:hidden" />
                <div className="absolute -top-2 right-4 hidden h-3 w-3 rotate-45 border-l border-t border-lime-400/50 bg-zinc-900/95 sm:block" />
              </div>
            )}
            <DropdownMenu open={menuOpen} onOpenChange={handleMenuOpenChange}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "relative h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white",
                    highlightMenuButton &&
                      "bg-lime-400/15 shadow-[0_0_0_4px_rgba(163,230,53,0.35)] hover:bg-lime-400/25",
                  )}
                  aria-label="Menú de inscripciones"
                >
                  {highlightMenuButton && (
                    <>
                      <span className="pointer-events-none absolute inset-0 rounded-full bg-lime-400/25 animate-ping" />
                      <span className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-lime-400/80 ring-offset-2 ring-offset-zinc-950 animate-pulse" />
                    </>
                  )}
                  <MoreHorizontal className="relative h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 sm:w-64 border-zinc-800 bg-zinc-900 text-white">
                {highlightMenuButton && (
                  <div className="px-2 py-2 text-xs text-lime-300 border-b border-zinc-800">
                    Elige una opción para inscribirte
                  </div>
                )}
                <DropdownMenuItem
                  className={cn(
                    "focus:bg-zinc-800 focus:text-white",
                    highlightMenuButton && "bg-lime-400/10 text-lime-100",
                  )}
                  onClick={() =>
                    handleTutorialMenuAction(() => setShowGroupDialog(true))
                  }
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Inscribirme a grupo
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={cn(
                    "focus:bg-zinc-800 focus:text-white",
                    highlightMenuButton && "bg-lime-400/10 text-lime-100",
                  )}
                  onClick={() => handleTutorialMenuAction(openEventEnrollmentDialog)}
                >
                  <Megaphone className="mr-2 h-4 w-4" />
                  Inscribirme a convocatoria o evento
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem
                  className="text-red-400 focus:bg-zinc-800 focus:text-red-300"
                  onClick={onLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Post-registration question */}
        {showPostRegistroQuestion && !showCodigoDialog && (
          <div className="mb-5 sm:mb-6 rounded-2xl sm:rounded-3xl border border-lime-400/30 bg-gradient-to-br from-violet-900/60 to-fuchsia-900/40 p-4 sm:p-5 backdrop-blur-sm">
            <p className="text-sm sm:text-base font-medium leading-snug">
              ¡Tu registro quedó listo! ¿Quieres inscribirte a un grupo cultural, convocatoria o evento?
            </p>
            <p className="mt-2 text-xs sm:text-sm text-zinc-300">
              Mira la esquina superior derecha: el botón <span className="font-semibold text-white">⋯</span> te muestra todas las opciones de inscripción.
            </p>
            <div className="mt-4 flex flex-col xs:flex-row gap-2 sm:flex-row">
              <Button
                className="flex-1 rounded-full bg-lime-400 font-semibold text-zinc-950 hover:bg-lime-300"
                onClick={() => {
                  onDismissQuestion()
                  setMenuTutorialActive(true)
                  setMenuOpen(true)
                }}
              >
                Sí, abrir menú
              </Button>
              <Button
                variant="outline"
                className="flex-1 rounded-full border-white/20 bg-transparent text-white hover:bg-white/10"
                onClick={onDismissQuestion}
              >
                Más tarde
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex h-32 sm:h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-lime-400 border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8 lg:items-start">
            {/* Groups section */}
            <section>
              <h2 className="mb-3 text-base sm:text-lg font-semibold">Mis grupos</h2>
              {groups.length === 0 ? (
                <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-5 text-center text-sm text-zinc-400">
                  Aún no estás inscrito en ningún grupo cultural.
                </div>
              ) : (
                <div className="space-y-2">
                  {groups.map((group) => (
                    <div
                      key={group.grupo}
                      className="flex items-center gap-3 rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4 backdrop-blur-sm"
                    >
                      <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-violet-500/80 to-fuchsia-500/80">
                        <Music className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm sm:text-base font-medium">{group.grupo}</p>
                        <p className="text-xs text-zinc-400">
                          Inscrito desde {formatDate(group.fechaInscripcion)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-base sm:text-lg font-bold text-lime-400">{group.asistencias}</p>
                        <p className="text-xs text-zinc-500">asistencias</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div className="space-y-6">
              {/* Convocatorias section */}
              <section>
                <h2 className="mb-3 text-base sm:text-lg font-semibold">Convocatorias</h2>
                {convocatorias.length === 0 ? (
                  <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-5 text-center text-sm text-zinc-400">
                    No tienes convocatorias registradas.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {convocatorias.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedActivity(item)}
                        className="flex w-full items-center gap-3 rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4 text-left backdrop-blur-sm transition hover:bg-white/10"
                      >
                        <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-lime-400/90 to-lime-300/80">
                          <Megaphone className="h-4 w-4 sm:h-5 sm:w-5 text-zinc-950" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm sm:text-base font-medium">{item.titulo}</p>
                          <p className="truncate text-xs text-zinc-400">{item.subtitulo}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-zinc-500" />
                      </button>
                    ))}
                  </div>
                )}
              </section>

              {/* Events + Cineclú section */}
              <section>
                <h2 className="mb-3 text-base sm:text-lg font-semibold">Eventos y Cineclú</h2>
                {eventos.length === 0 ? (
                  <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-5 text-center text-sm text-zinc-400">
                    No tienes eventos ni proyecciones registradas.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {eventos.map((item) => (
                      <button
                        key={`${item.tipo}-${item.id}`}
                        type="button"
                        onClick={() => setSelectedActivity(item)}
                        className="flex w-full items-center gap-3 rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4 text-left backdrop-blur-sm transition hover:bg-white/10"
                      >
                        <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-violet-500/80 to-indigo-500/80">
                          {item.tipo === "cineclu" ? (
                            <Film className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                          ) : (
                            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm sm:text-base font-medium">{item.titulo}</p>
                          <p className="truncate text-xs text-zinc-400">{item.subtitulo}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-zinc-500" />
                      </button>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        )}
      </div>

      {/* Código estudiantil — una sola vez para estudiantes sin código */}
      <Dialog
        open={showCodigoDialog}
        onOpenChange={(open) => {
          if (open) setShowCodigoDialog(true)
        }}
      >
        <DialogContent
          className={`${dialogClass} [&>button]:hidden`}
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Completa tu código estudiantil</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Como estudiante, necesitamos registrar tu código de 9 dígitos. Solo te lo pediremos esta vez.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="codigo-estudiantil" className="text-zinc-300">
                Código estudiantil (9 dígitos)
              </Label>
              <Input
                id="codigo-estudiantil"
                value={codigoEstudiantil}
                onChange={(e) => setCodigoEstudiantil(e.target.value.replace(/\D/g, "").slice(0, 9))}
                placeholder="202625413"
                maxLength={9}
                inputMode="numeric"
                className="border-zinc-700 bg-zinc-800 text-white"
                autoFocus
              />
              {codigoEstudiantil.length > 0 && codigoEstudiantil.length !== 9 && (
                <p className="text-xs text-amber-400">El código debe tener exactamente 9 dígitos</p>
              )}
            </div>
            <Button
              className="w-full bg-lime-400 font-semibold text-zinc-950 hover:bg-lime-300"
              disabled={codigoEstudiantil.length !== 9 || isSavingCodigo}
              onClick={handleSaveCodigo}
            >
              {isSavingCodigo ? "Guardando..." : "Guardar código"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Activity detail dialog */}
      <Dialog open={!!selectedActivity} onOpenChange={(open) => !open && setSelectedActivity(null)}>
        <DialogContent className={dialogClass}>
          {selectedActivity && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base sm:text-lg pr-6">{selectedActivity.titulo}</DialogTitle>
                <DialogDescription className="text-zinc-400">
                  {selectedActivity.tipo === "convocatoria"
                    ? "Convocatoria cultural"
                    : selectedActivity.tipo === "cineclu"
                      ? "Proyección Cineclú"
                      : "Evento cultural"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                {selectedActivity.fecha && (
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Calendar className="h-4 w-4 shrink-0 text-lime-400" />
                    <span>
                      {selectedActivity.tipo === "cineclu"
                        ? `Proyección: ${formatDate(selectedActivity.fecha)}`
                        : `Fecha: ${formatDate(selectedActivity.fecha)}`}
                    </span>
                  </div>
                )}
                {selectedActivity.hora && (
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Clock className="h-4 w-4 shrink-0 text-lime-400" />
                    <span>Hora: {selectedActivity.hora}</span>
                  </div>
                )}
                {selectedActivity.lugar && (
                  <div className="flex items-center gap-2 text-zinc-300">
                    <MapPin className="h-4 w-4 shrink-0 text-lime-400" />
                    <span>{selectedActivity.lugar}</span>
                  </div>
                )}
                {selectedActivity.fechaApertura && selectedActivity.fechaVencimiento && (
                  <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 p-3 text-zinc-300">
                    <p className="text-xs text-zinc-500">Periodo de inscripción</p>
                    <p className="mt-1">{formatDateTime(selectedActivity.fechaApertura)}</p>
                    <p className="text-zinc-500">hasta</p>
                    <p>{formatDateTime(selectedActivity.fechaVencimiento)}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Group enrollment dialog */}
      <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
        <DialogContent className={dialogClass}>
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Inscribirme a un grupo</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Selecciona el grupo cultural al que deseas inscribirte.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {availableGroups.length === 0 ? (
              <p className="text-sm text-zinc-400">
                Ya estás inscrito en todos los grupos disponibles o no hay grupos activos.
              </p>
            ) : (
              <div className="space-y-2">
                <Label className="text-zinc-300">Grupo cultural</Label>
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger className="border-zinc-700 bg-zinc-800 text-white">
                    <SelectValue placeholder="Selecciona un grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableGroups.map((grupo) => (
                      <SelectItem key={grupo} value={grupo}>
                        {grupo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button
                variant="outline"
                className="flex-1 border-zinc-700 bg-transparent text-white hover:bg-zinc-800"
                onClick={() => {
                  setShowGroupDialog(false)
                  setSelectedGroup("")
                }}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-lime-400 font-semibold text-zinc-950 hover:bg-lime-300"
                disabled={!selectedGroup || isEnrolling}
                onClick={handleEnrollGroup}
              >
                {isEnrolling ? "Inscribiendo..." : "Confirmar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Event / convocatoria enrollment dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className={`${dialogClass} max-h-[90vh] flex flex-col`}>
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Inscribirme a convocatoria o evento</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Selecciona una convocatoria o evento disponible para inscribirte.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-5 py-1">
            {loadingAvailable ? (
              <div className="flex h-32 items-center justify-center">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-lime-400 border-t-transparent" />
              </div>
            ) : availableItems.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-6">
                No hay convocatorias ni eventos disponibles en este momento, o ya estás inscrito en todos.
              </p>
            ) : (
              <>
                {availableConvocatorias.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-lime-400">Convocatorias</h3>
                    {availableConvocatorias.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-lime-400/20">
                            <Megaphone className="h-4 w-4 text-lime-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm sm:text-base">{item.nombre}</p>
                            <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1">
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="truncate">{item.lugar}</span>
                            </p>
                            <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                              <Clock className="h-3 w-3 shrink-0" />
                              {item.hora}
                              {item.fechaEvento && ` · ${formatDate(item.fechaEvento)}`}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="mt-3 w-full sm:w-auto bg-lime-400 font-semibold text-zinc-950 hover:bg-lime-300"
                          disabled={enrollingEventId === item.id}
                          onClick={() => handleEnrollEvent(item)}
                        >
                          {enrollingEventId === item.id ? "Inscribiendo..." : "Inscribirme"}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {availableEventos.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-violet-400">Eventos</h3>
                    {availableEventos.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/20">
                            <Calendar className="h-4 w-4 text-violet-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm sm:text-base">{item.nombre}</p>
                            <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1">
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="truncate">{item.lugar}</span>
                            </p>
                            <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                              <Clock className="h-3 w-3 shrink-0" />
                              {item.hora}
                              {item.fechaEvento && ` · ${formatDate(item.fechaEvento)}`}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="mt-3 w-full sm:w-auto bg-lime-400 font-semibold text-zinc-950 hover:bg-lime-300"
                          disabled={enrollingEventId === item.id}
                          onClick={() => handleEnrollEvent(item)}
                        >
                          {enrollingEventId === item.id ? "Inscribiendo..." : "Inscribirme"}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

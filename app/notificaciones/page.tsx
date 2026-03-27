"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { Button } from "@/components/ui/button"
import { Bell, Users, Clock, Calendar, Shield, X, RefreshCw } from "lucide-react"
import { getAttendanceNotifications, getAllCulturalGroups } from "@/lib/db-router"
import { useArea } from "@/contexts/area-context"
import { getCurrentUserRole, isAdmin as checkIsAdmin, isSuperAdmin as checkIsSuperAdmin } from "@/lib/auth-helpers"
import { useRouter } from "next/navigation"
import { formatNombre } from "@/lib/utils"

interface Notification {
  id: string
  grupoCultural: string
  timestamp: Date
  markedById: string
  markedByNombre: string
  markedByRole: string
  userCount: number
  userNames: string[]
}

function getRoleBadge(role: string) {
  const map: Record<string, { label: string; className: string }> = {
    DIRECTOR: { label: "Director", className: "bg-blue-100 text-blue-800" },
    MONITOR: { label: "Monitor", className: "bg-green-100 text-green-800" },
    ENTRENADOR: { label: "Entrenador", className: "bg-orange-100 text-orange-800" },
  }
  const r = map[role] || { label: role || "Encargado", className: "bg-gray-100 text-gray-700" }
  return <Badge className={`text-xs ${r.className}`}>{r.label}</Badge>
}

function formatHour(date: Date) {
  return date.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: true })
}

function formatDate(date: Date) {
  return date.toLocaleDateString("es-CO", { weekday: "short", year: "numeric", month: "short", day: "numeric" })
}

export default function NotificacionesPage() {
  const { area } = useArea()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [authorized, setAuthorized] = useState(false)

  // Filter states
  const [filterGrupo, setFilterGrupo] = useState("")
  const [filterManager, setFilterManager] = useState("")
  const [filterDia, setFilterDia] = useState("")
  const [filterHora, setFilterHora] = useState("")

  useEffect(() => {
    const admin = checkIsAdmin()
    const superAdmin = checkIsSuperAdmin()
    if (!admin && !superAdmin) {
      router.push("/login")
      return
    }
    setAuthorized(true)
  }, [router])

  const loadNotifications = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAttendanceNotifications(area)
      setNotifications(data)
    } catch (e) {
      setError("Error al cargar las notificaciones")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authorized) loadNotifications()
  }, [area, authorized])

  // Build filter options from data
  const grupoOptions: ComboboxOption[] = useMemo(() => {
    const unique = Array.from(new Set(notifications.map(n => n.grupoCultural))).sort()
    return unique.map(g => ({ value: g, label: g }))
  }, [notifications])

  const managerOptions: ComboboxOption[] = useMemo(() => {
    const seen = new Map<string, string>()
    notifications.forEach(n => seen.set(n.markedById, n.markedByNombre))
    return Array.from(seen.entries())
      .map(([id, nombre]) => ({ value: id, label: nombre }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [notifications])

  const diaOptions: ComboboxOption[] = useMemo(() => {
    const unique = Array.from(new Set(notifications.map(n => formatDate(n.timestamp)))).sort()
    return unique.map(d => ({ value: d, label: d }))
  }, [notifications])

  const horaOptions: ComboboxOption[] = useMemo(() => {
    const unique = Array.from(new Set(notifications.map(n => {
      const h = n.timestamp.getHours()
      const label = `${h.toString().padStart(2, "0")}:00 - ${(h + 1).toString().padStart(2, "0")}:00`
      return label
    }))).sort()
    return unique.map(h => ({ value: h, label: h }))
  }, [notifications])

  const filtered = useMemo(() => {
    return notifications.filter(n => {
      if (filterGrupo && n.grupoCultural !== filterGrupo) return false
      if (filterManager && n.markedById !== filterManager) return false
      if (filterDia && formatDate(n.timestamp) !== filterDia) return false
      if (filterHora) {
        const h = n.timestamp.getHours()
        const label = `${h.toString().padStart(2, "0")}:00 - ${(h + 1).toString().padStart(2, "0")}:00`
        if (label !== filterHora) return false
      }
      return true
    })
  }, [notifications, filterGrupo, filterManager, filterDia, filterHora])

  const hasFilters = filterGrupo || filterManager || filterDia || filterHora

  const clearFilters = () => {
    setFilterGrupo("")
    setFilterManager("")
    setFilterDia("")
    setFilterHora("")
  }

  if (!authorized) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="p-4">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Bell className="w-8 h-8 text-blue-600" />
                Notificaciones de Asistencia
              </h1>
              <p className="text-gray-600 mt-1">
                Registros de asistencia marcados por encargados — Área {area === "deporte" ? "Deportiva" : "Cultural"}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={loadNotifications}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Filtros */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                Filtros
                {hasFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto text-gray-500 h-7 px-2">
                    <X className="w-3 h-3 mr-1" />
                    Limpiar
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">
                    Grupo {area === "deporte" ? "Deportivo" : "Cultural"}
                  </label>
                  <Combobox
                    options={grupoOptions}
                    value={filterGrupo}
                    onValueChange={setFilterGrupo}
                    placeholder="Todos los grupos"
                    searchPlaceholder="Buscar grupo..."
                    emptyText="No encontrado"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Encargado</label>
                  <Combobox
                    options={managerOptions}
                    value={filterManager}
                    onValueChange={setFilterManager}
                    placeholder="Todos los encargados"
                    searchPlaceholder="Buscar encargado..."
                    emptyText="No encontrado"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Día</label>
                  <Combobox
                    options={diaOptions}
                    value={filterDia}
                    onValueChange={setFilterDia}
                    placeholder="Todos los días"
                    searchPlaceholder="Buscar día..."
                    emptyText="No encontrado"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Hora</label>
                  <Combobox
                    options={horaOptions}
                    value={filterHora}
                    onValueChange={setFilterHora}
                    placeholder="Todas las horas"
                    searchPlaceholder="Buscar hora..."
                    emptyText="No encontrado"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contador */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              <Bell className="w-3 h-3 mr-1" />
              {filtered.length} registro{filtered.length !== 1 ? "s" : ""}
              {hasFilters && ` de ${notifications.length}`}
            </Badge>
          </div>

          {/* Tabla / Cards */}
          {loading ? (
            <Card>
              <CardContent className="py-16 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3" />
                Cargando notificaciones...
              </CardContent>
            </Card>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">
                  {hasFilters ? "No hay registros con esos filtros" : "No hay notificaciones aún"}
                </p>
                <p className="text-sm mt-1">
                  {!hasFilters && "Las notificaciones aparecerán cuando un encargado marque asistencia desde su panel."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map(n => (
                <Card key={n.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">

                      {/* Icono */}
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Bell className="w-5 h-5 text-blue-600" />
                      </div>

                      {/* Info principal */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-gray-900 truncate">
                            {n.grupoCultural}
                          </span>
                          <Badge
                            className={`text-xs ${area === "deporte" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}`}
                          >
                            {area === "deporte" ? "Deporte" : "Cultura"}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Shield className="w-3.5 h-3.5" />
                            <span className="font-medium">{formatNombre(n.markedByNombre)}</span>
                            {getRoleBadge(n.markedByRole)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {n.userCount} asistente{n.userCount !== 1 ? "s" : ""}
                          </span>
                        </div>

                        {n.userNames.length > 0 && (
                          <p className="text-xs text-gray-500">
                            {n.userNames.map(formatNombre).join(", ")}
                            {n.userCount > n.userNames.length && ` y ${n.userCount - n.userNames.length} más`}
                          </p>
                        )}
                      </div>

                      {/* Fecha y hora */}
                      <div className="flex-shrink-0 text-right space-y-1">
                        <div className="flex items-center gap-1 text-sm text-gray-700 justify-end">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(n.timestamp)}
                        </div>
                        <div className="flex items-center gap-1 text-sm font-medium text-blue-600 justify-end">
                          <Clock className="w-3.5 h-3.5" />
                          {formatHour(n.timestamp)}
                        </div>
                      </div>

                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

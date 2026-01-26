"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Navigation } from "@/components/navigation"
import { createEvent, getAllEvents, deleteEvent, toggleEventActive } from "@/lib/firestore"
import type { Event } from "@/lib/types"
import { Calendar, Clock, MapPin, Plus, Trash2, Power, PowerOff, BarChart3, Users } from "lucide-react"
import Link from "next/link"

export default function EventosPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    nombre: "",
    hora: "",
    lugar: "",
    fechaApertura: "",
    fechaVencimiento: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    loadEvents()
  }, [])

  async function loadEvents() {
    try {
      setLoading(true)
      const eventsData = await getAllEvents()
      setEvents(eventsData)
    } catch (error) {
      console.error("Error cargando eventos:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsSubmitting(true)

    try {
      // Validar fechas
      const fechaApertura = new Date(formData.fechaApertura)
      const fechaVencimiento = new Date(formData.fechaVencimiento)

      if (fechaVencimiento <= fechaApertura) {
        setError("La fecha de vencimiento debe ser posterior a la fecha de apertura")
        setIsSubmitting(false)
        return
      }

      await createEvent({
        nombre: formData.nombre,
        hora: formData.hora,
        lugar: formData.lugar,
        fechaApertura,
        fechaVencimiento,
      })

      setSuccess("Evento creado exitosamente")
      setFormData({
        nombre: "",
        hora: "",
        lugar: "",
        fechaApertura: "",
        fechaVencimiento: "",
      })
      setDialogOpen(false)
      await loadEvents()
    } catch (error) {
      console.error("Error creando evento:", error)
      setError("Hubo un problema al crear el evento. Por favor intenta nuevamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(eventId: string) {
    if (
      !confirm(
        "¿Estás seguro de que deseas eliminar este evento? También se eliminarán todos los registros de asistencia asociados.",
      )
    ) {
      return
    }

    try {
      await deleteEvent(eventId)
      setSuccess("Evento eliminado exitosamente")
      await loadEvents()
    } catch (error) {
      console.error("Error eliminando evento:", error)
      setError("Hubo un problema al eliminar el evento")
    }
  }

  async function handleToggleActive(eventId: string, currentState: boolean) {
    try {
      await toggleEventActive(eventId, !currentState)
      setSuccess(`Evento ${!currentState ? "activado" : "desactivado"} exitosamente`)
      await loadEvents()
    } catch (error) {
      console.error("Error cambiando estado del evento:", error)
      setError("Hubo un problema al cambiar el estado del evento")
    }
  }

  function isEventActive(event: Event): boolean {
    const now = new Date()
    return event.activo && new Date(event.fechaApertura) <= now && new Date(event.fechaVencimiento) >= now
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Navigation />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Gestión de Eventos</h1>
            <p className="text-gray-600 mt-2">Crea y administra eventos especiales</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Link href="/eventos/estadisticas">
              <Button variant="outline" size="lg" className="gap-2 w-full sm:w-auto bg-transparent">
                <BarChart3 className="h-5 w-5" />
                Ver Estadísticas
              </Button>
            </Link>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="gap-2 w-full sm:w-auto">
                  <Plus className="h-5 w-5" />
                  Crear Evento
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Evento</DialogTitle>
                  <DialogDescription>
                    Complete la información del evento. Los asistentes podrán registrarse entre las fechas
                    especificadas.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre del Evento *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      placeholder="Ej: Concierto de Fin de Año"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hora">Hora *</Label>
                      <Input
                        id="hora"
                        type="time"
                        value={formData.hora}
                        onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lugar">Lugar *</Label>
                      <Input
                        id="lugar"
                        value={formData.lugar}
                        onChange={(e) => setFormData({ ...formData, lugar: e.target.value })}
                        placeholder="Ej: Auditorio Central"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fechaApertura">Fecha de Apertura *</Label>
                      <Input
                        id="fechaApertura"
                        type="datetime-local"
                        value={formData.fechaApertura}
                        onChange={(e) => setFormData({ ...formData, fechaApertura: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fechaVencimiento">Fecha de Vencimiento *</Label>
                      <Input
                        id="fechaVencimiento"
                        type="datetime-local"
                        value={formData.fechaVencimiento}
                        onChange={(e) => setFormData({ ...formData, fechaVencimiento: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Creando..." : "Crear Evento"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {error && !dialogOpen && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500">Cargando eventos...</div>
            </CardContent>
          </Card>
        ) : events.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No hay eventos creados aún</p>
                <p className="text-sm text-gray-400 mt-2">Crea tu primer evento usando el botón de arriba</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const active = isEventActive(event)
              return (
                <Card key={event.id} className={active ? "border-green-500 border-2" : ""}>
                  <CardHeader>
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-xl">{event.nombre}</CardTitle>
                      <Badge variant={active ? "default" : "secondary"} className={active ? "bg-green-500" : ""}>
                        {active ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>{event.hora}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{event.lugar}</span>
                      </div>
                      <div className="flex items-start gap-2 text-gray-600">
                        <Calendar className="h-4 w-4 mt-0.5" />
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500">Apertura:</span>
                          <span>{new Date(event.fechaApertura).toLocaleString("es-CO")}</span>
                          <span className="text-xs text-gray-500 mt-1">Vencimiento:</span>
                          <span>{new Date(event.fechaVencimiento).toLocaleString("es-CO")}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-4 border-t">
                      <Link href={`/eventos/${event.id}/asistentes`}>
                        <Button variant="outline" size="sm" className="w-full bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100">
                          <Users className="h-4 w-4 mr-2" />
                          Ver Asistentes
                        </Button>
                      </Link>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(event.id, event.activo)}
                          className="flex-1 bg-transparent"
                        >
                          {event.activo ? (
                            <>
                              <PowerOff className="h-4 w-4 mr-1" />
                              Desactivar
                            </>
                          ) : (
                            <>
                              <Power className="h-4 w-4 mr-1" />
                              Activar
                            </>
                          )}
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(event.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

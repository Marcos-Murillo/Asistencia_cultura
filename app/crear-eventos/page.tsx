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
import { getAllRealEvents, createRealEvent, deleteRealEvent, toggleRealEventActive, updateRealEvent } from "@/lib/db-router"
import type { Event } from "@/lib/types"
import { Calendar, Clock, MapPin, Plus, Trash2, Power, PowerOff, Search, Pencil } from "lucide-react"
import Link from "next/link"
import { useArea } from "@/contexts/area-context"

export default function CrearEventosPage() {
  const { area } = useArea()
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    nombre: "",
    hora: "",
    lugar: "",
    fechaEvento: "",
    fechaApertura: "",
    fechaVencimiento: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editFormData, setEditFormData] = useState({
    nombre: "",
    hora: "",
    lugar: "",
    fechaEvento: "",
    fechaApertura: "",
    fechaVencimiento: "",
  })

  useEffect(() => { loadEvents() }, [area])

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredEvents(events)
    } else {
      setFilteredEvents(events.filter(e =>
        e.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.lugar.toLowerCase().includes(searchTerm.toLowerCase())
      ))
    }
  }, [searchTerm, events])

  async function loadEvents() {
    try {
      setLoading(true)
      const data = await getAllRealEvents(area)
      setEvents(data)
      setFilteredEvents(data)
    } catch (err) {
      console.error("Error cargando eventos:", err)
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
      const fechaApertura = new Date(formData.fechaApertura)
      const fechaVencimiento = new Date(formData.fechaVencimiento)
      if (fechaVencimiento <= fechaApertura) {
        setError("La fecha de vencimiento debe ser posterior a la fecha de apertura")
        setIsSubmitting(false)
        return
      }
      await createRealEvent(area, {
        nombre: formData.nombre,
        hora: formData.hora,
        lugar: formData.lugar,
        fechaEvento: formData.fechaEvento ? new Date(formData.fechaEvento) : undefined,
        fechaApertura,
        fechaVencimiento,
      })
      setSuccess("Evento creado exitosamente")
      setFormData({ nombre: "", hora: "", lugar: "", fechaEvento: "", fechaApertura: "", fechaVencimiento: "" })
      setDialogOpen(false)
      await loadEvents()
    } catch (err) {
      console.error("Error creando evento:", err)
      setError("Hubo un problema al crear el evento. Por favor intenta nuevamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(eventId: string) {
    if (!confirm("¿Estás seguro de que deseas eliminar este evento? También se eliminarán todos los registros de asistencia asociados.")) return
    try {
      await deleteRealEvent(area, eventId)
      setSuccess("Evento eliminado exitosamente")
      await loadEvents()
    } catch (err) {
      console.error("Error eliminando evento:", err)
      setError("Hubo un problema al eliminar el evento")
    }
  }

  async function handleToggleActive(eventId: string, currentState: boolean) {
    try {
      await toggleRealEventActive(area, eventId, !currentState)
      setSuccess(`Evento ${!currentState ? "activado" : "desactivado"} exitosamente`)
      await loadEvents()
    } catch (err) {
      console.error("Error cambiando estado del evento:", err)
      setError("Hubo un problema al cambiar el estado del evento")
    }
  }

  function isEventActive(event: Event): boolean {
    const now = new Date()
    return event.activo && new Date(event.fechaApertura) <= now && new Date(event.fechaVencimiento) >= now
  }

  function toDatetimeLocal(date: Date | string): string {
    const d = new Date(date)
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  function handleOpenEdit(event: Event) {
    setEditingEvent(event)
    setEditFormData({
      nombre: event.nombre,
      hora: event.hora,
      lugar: event.lugar,
      fechaEvento: event.fechaEvento ? toDatetimeLocal(event.fechaEvento).slice(0, 10) : "",
      fechaApertura: toDatetimeLocal(event.fechaApertura),
      fechaVencimiento: toDatetimeLocal(event.fechaVencimiento),
    })
    setEditDialogOpen(true)
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingEvent) return
    setError("")
    setIsSubmitting(true)
    try {
      const fechaApertura = new Date(editFormData.fechaApertura)
      const fechaVencimiento = new Date(editFormData.fechaVencimiento)
      if (fechaVencimiento <= fechaApertura) {
        setError("La fecha de vencimiento debe ser posterior a la fecha de apertura")
        setIsSubmitting(false)
        return
      }
      await updateRealEvent(area, editingEvent.id, {
        nombre: editFormData.nombre,
        hora: editFormData.hora,
        lugar: editFormData.lugar,
        fechaEvento: editFormData.fechaEvento ? new Date(editFormData.fechaEvento) : undefined,
        fechaApertura,
        fechaVencimiento,
      })
      setSuccess("Evento actualizado exitosamente")
      setEditDialogOpen(false)
      setEditingEvent(null)
      await loadEvents()
    } catch (err) {
      console.error("Error actualizando evento:", err)
      setError("Hubo un problema al actualizar el evento.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Gestión de Eventos</h1>
            <p className="text-gray-600 mt-2">Crea y administra eventos especiales (separados de convocatorias)</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
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
                    Complete la información del evento. Los participantes podrán inscribirse desde los formularios de convocatorias.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre del Evento *</Label>
                    <Input id="nombre" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} placeholder="Ej: Torneo Interfacultades" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hora">Hora *</Label>
                      <Input id="hora" type="time" value={formData.hora} onChange={e => setFormData({ ...formData, hora: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lugar">Lugar *</Label>
                      <Input id="lugar" value={formData.lugar} onChange={e => setFormData({ ...formData, lugar: e.target.value })} placeholder="Ej: Coliseo Universitario" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fechaEvento">Fecha del Evento</Label>
                    <Input id="fechaEvento" type="date" value={formData.fechaEvento} onChange={e => setFormData({ ...formData, fechaEvento: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fechaApertura">Fecha de Apertura *</Label>
                      <Input id="fechaApertura" type="datetime-local" value={formData.fechaApertura} onChange={e => setFormData({ ...formData, fechaApertura: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fechaVencimiento">Fecha de Vencimiento *</Label>
                      <Input id="fechaVencimiento" type="datetime-local" value={formData.fechaVencimiento} onChange={e => setFormData({ ...formData, fechaVencimiento: e.target.value })} required />
                    </div>
                  </div>
                  {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Creando..." : "Crear Evento"}</Button>
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

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar eventos por nombre o lugar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <Card><CardContent className="py-12"><div className="text-center text-gray-500">Cargando eventos...</div></CardContent></Card>
        ) : filteredEvents.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">{searchTerm ? "No se encontraron eventos con ese criterio" : "No hay eventos creados aún"}</p>
                <p className="text-sm text-gray-400 mt-2">{searchTerm ? "Intenta con otro término de búsqueda" : "Crea tu primer evento usando el botón de arriba"}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map(event => {
              const active = isEventActive(event)
              return (
                <Card key={event.id} className={active ? "border-blue-500 border-2" : ""}>
                  <CardHeader>
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-xl">{event.nombre}</CardTitle>
                      <Badge variant={active ? "default" : "secondary"} className={active ? "bg-blue-500" : ""}>
                        {active ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-4 w-4" /><span>{event.hora}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-4 w-4" /><span>{event.lugar}</span>
                      </div>
                      {event.fechaEvento && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium">Fecha del evento: {new Date(event.fechaEvento).toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
                        </div>
                      )}
                      <div className="flex items-start gap-2 text-gray-600">
                        <Calendar className="h-4 w-4 mt-0.5" />
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500">Apertura inscripciones:</span>
                          <span>{new Date(event.fechaApertura).toLocaleString("es-CO")}</span>
                          <span className="text-xs text-gray-500 mt-1">Cierre inscripciones:</span>
                          <span>{new Date(event.fechaVencimiento).toLocaleString("es-CO")}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 pt-4 border-t">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenEdit(event)} className="flex-1 bg-transparent">
                          <Pencil className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleToggleActive(event.id, event.activo)} className="flex-1 bg-transparent">
                          {event.activo ? (<><PowerOff className="h-4 w-4 mr-1" />Desactivar</>) : (<><Power className="h-4 w-4 mr-1" />Activar</>)}
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

      {/* Dialog editar evento */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Evento</DialogTitle>
            <DialogDescription>Modifica los datos del evento.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nombre">Nombre del Evento *</Label>
              <Input id="edit-nombre" value={editFormData.nombre} onChange={e => setEditFormData({ ...editFormData, nombre: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-hora">Hora *</Label>
                <Input id="edit-hora" type="time" value={editFormData.hora} onChange={e => setEditFormData({ ...editFormData, hora: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lugar">Lugar *</Label>
                <Input id="edit-lugar" value={editFormData.lugar} onChange={e => setEditFormData({ ...editFormData, lugar: e.target.value })} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-fechaEvento">Fecha del Evento</Label>
              <Input id="edit-fechaEvento" type="date" value={editFormData.fechaEvento} onChange={e => setEditFormData({ ...editFormData, fechaEvento: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-apertura">Fecha de Apertura *</Label>
                <Input id="edit-apertura" type="datetime-local" value={editFormData.fechaApertura} onChange={e => setEditFormData({ ...editFormData, fechaApertura: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-vencimiento">Fecha de Vencimiento *</Label>
                <Input id="edit-vencimiento" type="datetime-local" value={editFormData.fechaVencimiento} onChange={e => setEditFormData({ ...editFormData, fechaVencimiento: e.target.value })} required />
              </div>
            </div>
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Guardando..." : "Guardar cambios"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

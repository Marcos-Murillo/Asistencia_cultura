"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Combobox } from "@/components/ui/combobox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createSolicitud, TIPO_SOLICITUD_LABEL } from "@/lib/fisioterapia"
import { getGroupEnrolledUsersRouter } from "@/lib/db-router"
import type { FisioterapiaActor } from "@/lib/fisioterapia-permissions"
import type { FisioterapiaPrioridad, FisioterapiaSolicitudTipo, UserProfile } from "@/lib/types"
import { toLocalDateKey } from "@/lib/utils"

export function TrainerRequestDialog({
  open,
  onOpenChange,
  actor,
  grupoNombre,
  groups,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  actor: FisioterapiaActor
  grupoNombre: string
  groups: string[]
}) {
  const [tipo, setTipo] = useState<FisioterapiaSolicitudTipo>("acompanamiento")
  const [grupo, setGrupo] = useState(grupoNombre)
  const [fecha, setFecha] = useState(toLocalDateKey(new Date()))
  const [hora, setHora] = useState("08:00")
  const [lugar, setLugar] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [prioridad, setPrioridad] = useState<FisioterapiaPrioridad>("Media")
  const [observaciones, setObservaciones] = useState("")
  const [deportistaId, setDeportistaId] = useState("")
  const [athletes, setAthletes] = useState<UserProfile[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [ok, setOk] = useState("")

  useEffect(() => {
    if (open) setGrupo(grupoNombre)
  }, [open, grupoNombre])

  useEffect(() => {
    if (!grupo) return
    getGroupEnrolledUsersRouter("deporte", grupo).then(setAthletes).catch(() => setAthletes([]))
  }, [grupo])

  async function handleSubmit() {
    setSaving(true)
    setError("")
    setOk("")
    try {
      const athlete = athletes.find((item) => item.id === deportistaId)
      await createSolicitud(actor, {
        tipo,
        grupoNombre: grupo,
        fechaSolicitada: new Date(`${fecha}T${hora}`),
        hora,
        lugar,
        descripcion,
        prioridad,
        observaciones,
        deportistaId: deportistaId || undefined,
        deportistaNombre: athlete?.nombres,
      })
      setOk("Solicitud enviada a fisioterapia")
      setDescripcion("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la solicitud")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Solicitar fisioterapia</DialogTitle>
          <DialogDescription>La solicitud queda en estado Pendiente para el fisioterapeuta encargado.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="space-y-2">
            <Label>Tipo de actividad</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as FisioterapiaSolicitudTipo)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(TIPO_SOLICITUD_LABEL).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Grupo</Label>
            <Combobox
              options={groups.map((name) => ({ value: name, label: name }))}
              value={grupo}
              onValueChange={setGrupo}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Hora</Label>
              <Input type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Lugar</Label>
            <Input value={lugar} onChange={(e) => setLugar(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Deportista (si aplica)</Label>
            <Combobox
              options={[{ value: "", label: "No aplica" }, ...athletes.map((item) => ({ value: item.id, label: item.nombres }))]}
              value={deportistaId}
              onValueChange={setDeportistaId}
              placeholder="Buscar deportista"
            />
          </div>
          <div className="space-y-2">
            <Label>Prioridad</Label>
            <Select value={prioridad} onValueChange={(v) => setPrioridad(v as FisioterapiaPrioridad)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Baja">Baja</SelectItem>
                <SelectItem value="Media">Media</SelectItem>
                <SelectItem value="Alta">Alta</SelectItem>
                <SelectItem value="Urgente">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Observaciones</Label>
            <Textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {ok && <p className="text-sm text-emerald-700">{ok}</p>}
          <Button onClick={handleSubmit} disabled={saving || !descripcion} className="h-10 justify-center">
            {saving ? "Enviando..." : "Enviar solicitud"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

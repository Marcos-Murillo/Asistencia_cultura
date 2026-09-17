"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { listBitacora, listFisioterapeutas, listSolicitudes } from "@/lib/fisioterapia"
import { useFisioActor } from "@/lib/fisioterapia-session"
import { SolicitudDrawer } from "@/components/fisioterapia/solicitud-drawer"
import { BitacoraFormDrawer } from "@/components/fisioterapia/bitacora-form-drawer"
import { PrioridadBadge } from "@/components/fisioterapia/badges"
import { ContactPersonDrawer } from "@/components/fisioterapia/contact-drawer"
import { EstadoHover } from "@/components/fisioterapia/hover-entities"
import { MobileRecordCard } from "@/components/fisioterapia/compact-filters"
import { listDeportiveGroups } from "@/lib/db-router"
import { TIPO_SOLICITUD_LABEL } from "@/lib/fisioterapia"
import type { FisioterapiaBitacora, FisioterapiaSolicitud, UserProfile } from "@/lib/types"

export default function ActividadesPage() {
  const actor = useFisioActor()
  const [items, setItems] = useState<FisioterapiaSolicitud[]>([])
  const [bitacora, setBitacora] = useState<FisioterapiaBitacora[]>([])
  const [fisios, setFisios] = useState<UserProfile[]>([])
  const [groups, setGroups] = useState<{ id: string; nombre: string }[]>([])
  const [selected, setSelected] = useState<FisioterapiaSolicitud | null>(null)
  const [contact, setContact] = useState<FisioterapiaSolicitud | null>(null)
  const [formOpen, setFormOpen] = useState(false)

  async function load() {
    if (!actor) return
    const [s, b, f, g] = await Promise.all([
      listSolicitudes(actor),
      listBitacora(actor),
      listFisioterapeutas(),
      listDeportiveGroups(),
    ])
    const mine = actor.kind === "fisioterapeuta" && !actor.esEncargado
      ? s.filter((item) => item.fisioterapeutaId === actor.userId)
      : s.filter((item) => item.estado !== "Pendiente")
    setItems(mine)
    setBitacora(b)
    setFisios(f)
    setGroups(g)
  }

  useEffect(() => {
    load()
  }, [actor])

  if (!actor) return null

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">
          {actor.kind === "fisioterapeuta" && actor.esEncargado ? "Asignaciones" : "Mis actividades"}
        </h1>
        <p className="text-sm text-slate-500">Acepta, avanza y finaliza las actividades asignadas.</p>
      </div>
      <div className="space-y-1.5 md:hidden">
        {items.map((item) => (
          <MobileRecordCard
            key={item.id}
            title={item.grupoNombre}
            subtitle={item.descripcion || TIPO_SOLICITUD_LABEL[item.tipo]}
            onClick={() => setSelected(item)}
          />
        ))}
      </div>
      <div className="hidden overflow-hidden rounded-md border bg-white md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Prioridad</TableHead>
              <TableHead>Actividad</TableHead>
              <TableHead>Grupo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fisioterapeuta</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} className="cursor-pointer" onClick={() => setSelected(item)}>
                <TableCell><PrioridadBadge prioridad={item.prioridad} /></TableCell>
                <TableCell>#{String(item.numero).padStart(5, "0")} · {TIPO_SOLICITUD_LABEL[item.tipo]}</TableCell>
                <TableCell>{item.grupoNombre}</TableCell>
                <TableCell><EstadoHover solicitud={item} /></TableCell>
                <TableCell>{item.fisioterapeutaNombre}</TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 justify-center"
                    onClick={(event) => {
                      event.stopPropagation()
                      setContact(item)
                    }}
                  >
                    Contactar entrenador
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <SolicitudDrawer
        open={Boolean(selected)}
        onOpenChange={(v) => !v && setSelected(null)}
        solicitud={selected}
        actor={actor}
        fisioterapeutas={fisios}
        bitacora={bitacora}
        onChanged={load}
        onRegisterActivity={() => setFormOpen(true)}
      />
      <BitacoraFormDrawer
        open={formOpen}
        onOpenChange={setFormOpen}
        actor={actor}
        groups={groups}
        defaultTipo="solicitud"
        solicitudId={selected?.id}
        solicitudNumero={selected?.numero}
        solicitudDefaults={selected || undefined}
        onSaved={load}
      />
      <ContactPersonDrawer
        open={Boolean(contact)}
        onOpenChange={(open) => !open && setContact(null)}
        userId={contact?.entrenadorId}
        fallbackName={contact?.entrenadorNombre}
        roleLabel="entrenador"
      />
    </div>
  )
}

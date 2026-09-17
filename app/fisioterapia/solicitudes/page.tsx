"use client"

import { useEffect, useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Combobox } from "@/components/ui/combobox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { listBitacora, listFisioterapeutas, listSolicitudes } from "@/lib/fisioterapia"
import { useFisioActor } from "@/lib/fisioterapia-session"
import { SolicitudDrawer } from "@/components/fisioterapia/solicitud-drawer"
import { PrioridadBadge, EstadoBadge } from "@/components/fisioterapia/badges"
import { EstadoHover, DeportistaHover, lastAtencionLabel } from "@/components/fisioterapia/hover-entities"
import { TIPO_SOLICITUD_LABEL } from "@/lib/fisioterapia"
import type { FisioterapiaBitacora, FisioterapiaSolicitud, UserProfile } from "@/lib/types"
import { getFisioterapiaPermissions } from "@/lib/fisioterapia-permissions"

export default function SolicitudesPage() {
  const actor = useFisioActor()
  const [items, setItems] = useState<FisioterapiaSolicitud[]>([])
  const [bitacora, setBitacora] = useState<FisioterapiaBitacora[]>([])
  const [fisios, setFisios] = useState<UserProfile[]>([])
  const [selected, setSelected] = useState<FisioterapiaSolicitud | null>(null)
  const [estado, setEstado] = useState<string>("todos")
  const [prioridad, setPrioridad] = useState("")
  const [grupo, setGrupo] = useState("")
  const [from, setFrom] = useState("")

  async function load() {
    if (!actor) return
    const [s, b, f] = await Promise.all([listSolicitudes(actor), listBitacora(actor), listFisioterapeutas()])
    setItems(s)
    setBitacora(b)
    setFisios(f)
  }

  useEffect(() => {
    load()
  }, [actor])

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (estado !== "todos" && item.estado !== estado) return false
      if (prioridad && item.prioridad !== prioridad) return false
      if (grupo && !item.grupoNombre.toLowerCase().includes(grupo.toLowerCase())) return false
      if (from && item.fechaSolicitada.toISOString().slice(0, 10) < from) return false
      return true
    })
  }, [items, estado, prioridad, grupo, from])

  if (!actor) return null
  const perms = getFisioterapiaPermissions(actor)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{perms.canViewAllSolicitudes ? "Solicitudes" : "Solicitudes relacionadas"}</h1>
        <p className="text-sm text-slate-500">Panel operativo. Abre el drawer para asignar, cambiar estado o ver historial.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <Combobox
          options={["todos", "Pendiente", "Asignada", "En proceso", "Realizada", "Cancelada"].map((v) => ({ value: v, label: v === "todos" ? "Todos los estados" : v }))}
          value={estado}
          onValueChange={setEstado}
        />
        <Combobox
          options={["", "Baja", "Media", "Alta", "Urgente"].map((v) => ({ value: v, label: v || "Todas las prioridades" }))}
          value={prioridad}
          onValueChange={setPrioridad}
        />
        <Input placeholder="Filtrar grupo" value={grupo} onChange={(e) => setGrupo(e.target.value)} />
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
      </div>
      <div className="space-y-1.5 md:hidden">
        {filtered.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelected(item)}
            className="w-full rounded-lg border border-teal-100 bg-white p-2.5 text-left shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium">#{String(item.numero).padStart(5, "0")}</p>
              <PrioridadBadge prioridad={item.prioridad} />
            </div>
            <p className="mt-1 text-sm text-slate-600">{TIPO_SOLICITUD_LABEL[item.tipo]}</p>
            <p className="text-xs text-slate-500">{item.grupoNombre}</p>
            <div className="mt-2"><EstadoBadge estado={item.estado} /></div>
          </button>
        ))}
      </div>
      <div className="hidden overflow-hidden rounded-md border bg-white md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Prioridad</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Solicitud</TableHead>
              <TableHead>Grupo</TableHead>
              <TableHead>Entrenador</TableHead>
              <TableHead>Deportista</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Asignado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item) => (
              <TableRow key={item.id} className="cursor-pointer" onClick={() => setSelected(item)}>
                <TableCell><PrioridadBadge prioridad={item.prioridad} /></TableCell>
                <TableCell>{item.fechaSolicitada.toLocaleDateString("es-CO")}</TableCell>
                <TableCell>#{String(item.numero).padStart(5, "0")} · {TIPO_SOLICITUD_LABEL[item.tipo]}</TableCell>
                <TableCell>{item.grupoNombre}</TableCell>
                <TableCell>{item.entrenadorNombre}</TableCell>
                <TableCell>
                  {item.deportistaNombre ? (
                    <DeportistaHover
                      lastAtencion={lastAtencionLabel(bitacora, item.deportistaId)}
                      grupo={item.grupoNombre}
                      entrenador={item.entrenadorNombre}
                    >
                      {item.deportistaNombre}
                    </DeportistaHover>
                  ) : "—"}
                </TableCell>
                <TableCell><EstadoHover solicitud={item} /></TableCell>
                <TableCell>{item.fisioterapeutaNombre || "—"}</TableCell>
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
        onChanged={() => {
          load()
        }}
      />
    </div>
  )
}

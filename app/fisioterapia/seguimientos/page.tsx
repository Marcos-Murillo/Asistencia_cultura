"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { listSeguimientos, updateSeguimientoEstado } from "@/lib/fisioterapia"
import { useFisioActor } from "@/lib/fisioterapia-session"
import { AthleteHistoryDrawer } from "@/components/fisioterapia/athlete-history-drawer"
import { SeguimientoBadge } from "@/components/fisioterapia/badges"
import { MobileRecordCard } from "@/components/fisioterapia/compact-filters"
import type { FisioterapiaSeguimiento, FisioterapiaSeguimientoEstado } from "@/lib/types"

export default function SeguimientosPage() {
  const actor = useFisioActor()
  const [items, setItems] = useState<FisioterapiaSeguimiento[]>([])
  const [historyId, setHistoryId] = useState<string | null>(null)

  async function load() {
    if (!actor) return
    setItems(await listSeguimientos(actor))
  }

  useEffect(() => {
    load()
  }, [actor])

  if (!actor) return null

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Seguimientos pendientes</h1>
        <p className="text-sm text-slate-500">Atenciones marcadas con seguimiento clínico.</p>
      </div>
      <div className="space-y-1.5 md:hidden">
        {items.map((item) => (
          <MobileRecordCard
            key={item.id}
            title={item.grupoNombre || item.deportistaNombre}
            subtitle={item.lesionAtencion}
            onClick={() => setHistoryId(item.deportistaId)}
          />
        ))}
      </div>
      <div className="hidden overflow-hidden rounded-md border bg-white md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Deportista</TableHead>
              <TableHead>Atención</TableHead>
              <TableHead>Fecha atención</TableHead>
              <TableHead>Programada</TableHead>
              <TableHead>Responsable</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <button className="font-medium text-teal-800 hover:underline" onClick={() => setHistoryId(item.deportistaId)}>
                    {item.deportistaNombre}
                  </button>
                </TableCell>
                <TableCell>{item.lesionAtencion}</TableCell>
                <TableCell>{item.fechaAtencion.toLocaleDateString("es-CO")}</TableCell>
                <TableCell>{item.fechaProgramada.toLocaleDateString("es-CO")}</TableCell>
                <TableCell>{item.fisioterapeutaNombre}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <SeguimientoBadge estado={item.estado} />
                    <Select
                      value={item.estado}
                      onValueChange={async (v) => {
                        await updateSeguimientoEstado(actor, item.id, v as FisioterapiaSeguimientoEstado)
                        load()
                      }}
                    >
                      <SelectTrigger className="h-8 w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pendiente">Pendiente</SelectItem>
                        <SelectItem value="Realizado">Realizado</SelectItem>
                        <SelectItem value="No asistió">No asistió</SelectItem>
                        <SelectItem value="Cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <AthleteHistoryDrawer
        open={Boolean(historyId)}
        onOpenChange={(v) => !v && setHistoryId(null)}
        actor={actor}
        deportistaId={historyId}
      />
    </div>
  )
}

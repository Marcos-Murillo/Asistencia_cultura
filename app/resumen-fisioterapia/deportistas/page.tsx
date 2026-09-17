"use client"

import { useEffect, useMemo, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { listAllBitacoraRecords, listAllSeguimientoRecords, TIPO_BITACORA_LABEL } from "@/lib/fisioterapia"
import { fisioSheetClass, fisioSheetHandleClass } from "@/components/fisioterapia/drawer-styles"
import type { FisioterapiaBitacora, FisioterapiaSeguimiento } from "@/lib/types"

type AthleteRow = {
  id: string
  nombre: string
  grupos: string[]
  atenciones: FisioterapiaBitacora[]
  seguimientos: FisioterapiaSeguimiento[]
  ordenes: FisioterapiaBitacora[]
}

export default function DeportistasAtendidosPage() {
  const [bitacora, setBitacora] = useState<FisioterapiaBitacora[]>([])
  const [seguimientos, setSeguimientos] = useState<FisioterapiaSeguimiento[]>([])
  const [selected, setSelected] = useState<AthleteRow | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([listAllBitacoraRecords(), listAllSeguimientoRecords()])
      .then(([b, s]) => {
        setBitacora(b)
        setSeguimientos(s)
      })
      .finally(() => setLoading(false))
  }, [])

  const athletes = useMemo(() => {
    const map = new Map<string, AthleteRow>()
    for (const item of bitacora) {
      if (!item.deportistaId && !item.deportistaNombre) continue
      const id = item.deportistaId || item.deportistaNombre || item.id
      const current = map.get(id) || {
        id,
        nombre: item.deportistaNombre || "Sin nombre",
        grupos: [],
        atenciones: [],
        seguimientos: [],
        ordenes: [],
      }
      if (item.tipo === "atencion") current.atenciones.push(item)
      if (item.grupoNombre && !current.grupos.includes(item.grupoNombre)) {
        current.grupos.push(item.grupoNombre)
      }
      if (item.orden?.descripcion) current.ordenes.push(item)
      map.set(id, current)
    }
    for (const item of seguimientos) {
      const current = map.get(item.deportistaId) || {
        id: item.deportistaId,
        nombre: item.deportistaNombre,
        grupos: item.grupoNombre ? [item.grupoNombre] : [],
        atenciones: [],
        seguimientos: [],
        ordenes: [],
      }
      current.seguimientos.push(item)
      map.set(item.deportistaId, current)
    }
    return Array.from(map.values())
      .filter((item) => item.atenciones.length > 0 || item.seguimientos.length > 0 || item.ordenes.length > 0)
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
  }, [bitacora, seguimientos])

  return (
    <>
      <div className="overflow-x-auto rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Deportista</TableHead>
              <TableHead>Grupo</TableHead>
              <TableHead>Atenciones</TableHead>
              <TableHead>Seguimientos</TableHead>
              <TableHead>Órdenes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={5} className="text-sm text-gray-500">Cargando deportistas...</TableCell>
              </TableRow>
            )}
            {!loading && athletes.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-sm text-gray-500">No hay deportistas atendidos.</TableCell>
              </TableRow>
            )}
            {athletes.map((item) => (
              <TableRow key={item.id} className="cursor-pointer" onClick={() => setSelected(item)}>
                <TableCell className="font-medium">{item.nombre}</TableCell>
                <TableCell>{item.grupos.join(", ") || "—"}</TableCell>
                <TableCell>{item.atenciones.length}</TableCell>
                <TableCell>{item.seguimientos.length}</TableCell>
                <TableCell>{item.ordenes.length}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Drawer open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DrawerContent side="bottom" className={fisioSheetClass}>
          <div className={fisioSheetHandleClass} />
          <DrawerHeader className="pt-2">
            <DrawerTitle>{selected?.nombre}</DrawerTitle>
            <DrawerDescription>{selected?.grupos.join(", ") || "Sin grupo"}</DrawerDescription>
          </DrawerHeader>
          {selected && (
            <ScrollArea className="min-h-0 flex-1 overflow-y-auto px-6 pb-8">
              <div className="space-y-4 text-sm">
                <section className="space-y-2">
                  <p className="font-semibold">Atenciones</p>
                  {selected.atenciones.length === 0 && <p className="text-gray-500">Sin atenciones.</p>}
                  {selected.atenciones.map((item) => (
                    <div key={item.id} className="rounded-md border p-3">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{TIPO_BITACORA_LABEL[item.tipo]}</Badge>
                        <span>{item.fecha.toLocaleDateString("es-CO")} {item.hora}</span>
                      </div>
                      <p>Fisio: {item.fisioterapeutaNombre}</p>
                      <p>{item.motivoAtencion || item.descripcion || item.descripcionIncidente}</p>
                      {item.tipoLesion && <p>Lesión: {item.tipoLesion} {item.zonaCorporal ? `· ${item.zonaCorporal}` : ""}</p>}
                      {item.intervencion && <p>Intervención: {item.intervencion}</p>}
                      {item.recomendaciones && <p>Recomendaciones: {item.recomendaciones}</p>}
                    </div>
                  ))}
                </section>
                <Separator />
                <section className="space-y-2">
                  <p className="font-semibold">Seguimientos</p>
                  {selected.seguimientos.length === 0 && <p className="text-gray-500">Sin seguimientos.</p>}
                  {selected.seguimientos.map((item) => (
                    <div key={item.id} className="rounded-md border p-3">
                      <p>{item.lesionAtencion}</p>
                      <p>Programado: {item.fechaProgramada.toLocaleDateString("es-CO")}</p>
                      <p>Estado: {item.estado}</p>
                      <p>Responsable: {item.fisioterapeutaNombre}</p>
                    </div>
                  ))}
                </section>
                <Separator />
                <section className="space-y-2">
                  <p className="font-semibold">Órdenes / remisiones</p>
                  {selected.ordenes.length === 0 && <p className="text-gray-500">No se ha enviado orden.</p>}
                  {selected.ordenes.map((item) => (
                    <div key={`${item.id}-orden`} className="rounded-md border p-3">
                      <p>{item.orden?.descripcion}</p>
                      {item.orden?.destino && <p>Destino: {item.orden.destino}</p>}
                      <p>Fecha: {item.orden?.fecha.toLocaleDateString("es-CO") || item.fecha.toLocaleDateString("es-CO")}</p>
                    </div>
                  ))}
                </section>
              </div>
            </ScrollArea>
          )}
        </DrawerContent>
      </Drawer>
    </>
  )
}

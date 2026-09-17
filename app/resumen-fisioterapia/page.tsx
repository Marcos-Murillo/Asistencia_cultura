"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { listAllBitacoraRecords, TIPO_BITACORA_LABEL } from "@/lib/fisioterapia"
import { fisioSheetClass, fisioSheetHandleClass } from "@/components/fisioterapia/drawer-styles"
import type { FisioterapiaBitacora } from "@/lib/types"

export default function ResumenFisioterapiaPage() {
  const [records, setRecords] = useState<FisioterapiaBitacora[]>([])
  const [selected, setSelected] = useState<FisioterapiaBitacora | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listAllBitacoraRecords()
      .then(setRecords)
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <div className="overflow-x-auto rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Grupo</TableHead>
              <TableHead>Fisioterapeuta</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Hora</TableHead>
              <TableHead>Tipo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={5} className="text-sm text-gray-500">Cargando registros...</TableCell>
              </TableRow>
            )}
            {!loading && records.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-sm text-gray-500">Aún no hay registros de fisioterapia.</TableCell>
              </TableRow>
            )}
            {records.map((item) => (
              <TableRow key={item.id} className="cursor-pointer" onClick={() => setSelected(item)}>
                <TableCell className="font-medium">{item.grupoNombre || "—"}</TableCell>
                <TableCell>{item.fisioterapeutaNombre || "—"}</TableCell>
                <TableCell>{item.fecha.toLocaleDateString("es-CO")}</TableCell>
                <TableCell>{item.hora || "—"}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{TIPO_BITACORA_LABEL[item.tipo] || item.tipo}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Drawer open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DrawerContent side="bottom" className={fisioSheetClass}>
          <div className={fisioSheetHandleClass} />
          <DrawerHeader className="pt-2">
            <DrawerTitle>Detalle de la actividad</DrawerTitle>
            <DrawerDescription>
              {selected && (TIPO_BITACORA_LABEL[selected.tipo] || selected.tipo)}
            </DrawerDescription>
          </DrawerHeader>
          {selected && (
            <ScrollArea className="min-h-0 flex-1 overflow-y-auto px-6 pb-8">
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-500">Grupo:</span> {selected.grupoNombre || "—"}</p>
                <p><span className="text-gray-500">Fisioterapeuta:</span> {selected.fisioterapeutaNombre}</p>
                <p><span className="text-gray-500">Fecha:</span> {selected.fecha.toLocaleDateString("es-CO")} {selected.hora}</p>
                <p><span className="text-gray-500">Entrenador:</span> {selected.entrenadorNombre || "—"}</p>
                <p><span className="text-gray-500">Deportista:</span> {selected.deportistaNombre || "No aplica"}</p>
                <p><span className="text-gray-500">Descripción:</span> {selected.descripcion || selected.descripcionIncidente || "—"}</p>
                {selected.motivoAtencion && <p><span className="text-gray-500">Motivo:</span> {selected.motivoAtencion}</p>}
                {selected.tipoLesion && <p><span className="text-gray-500">Lesión:</span> {selected.tipoLesion}</p>}
                {selected.zonaCorporal && <p><span className="text-gray-500">Zona:</span> {selected.zonaCorporal}</p>}
                {selected.evaluacion && <p><span className="text-gray-500">Evaluación:</span> {selected.evaluacion}</p>}
                {selected.intervencion && <p><span className="text-gray-500">Intervención:</span> {selected.intervencion}</p>}
                {selected.recomendaciones && <p><span className="text-gray-500">Recomendaciones:</span> {selected.recomendaciones}</p>}
                {selected.observaciones && <p><span className="text-gray-500">Observaciones:</span> {selected.observaciones}</p>}
                {selected.orden && (
                  <p>
                    <span className="text-gray-500">Orden:</span> {selected.orden.descripcion}
                    {selected.orden.destino ? ` · ${selected.orden.destino}` : ""}
                  </p>
                )}
                {selected.requiereSeguimiento && (
                  <p>
                    <span className="text-gray-500">Seguimiento:</span>{" "}
                    {selected.fechaSeguimiento?.toLocaleDateString("es-CO") || "Sí"}
                  </p>
                )}
              </div>
            </ScrollArea>
          )}
        </DrawerContent>
      </Drawer>
    </>
  )
}

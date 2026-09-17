"use client"

import { useEffect, useMemo, useState } from "react"
import { Download } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { listAllBitacoraRecords, listAllSeguimientoRecords, TIPO_BITACORA_LABEL } from "@/lib/fisioterapia"
import { exportFisioAdminReport } from "@/components/fisioterapia/excel"
import { toLocalDateKey } from "@/lib/utils"
import type { FisioterapiaBitacora, FisioterapiaSeguimiento } from "@/lib/types"

export default function FisioEstadisticasAdminPage() {
  const [bitacora, setBitacora] = useState<FisioterapiaBitacora[]>([])
  const [seguimientos, setSeguimientos] = useState<FisioterapiaSeguimiento[]>([])
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [reportOpen, setReportOpen] = useState(false)
  const [reportFrom, setReportFrom] = useState("")
  const [reportTo, setReportTo] = useState("")

  useEffect(() => {
    Promise.all([listAllBitacoraRecords(), listAllSeguimientoRecords()]).then(([b, s]) => {
      setBitacora(b)
      setSeguimientos(s)
    })
  }, [])

  const filtered = useMemo(() => {
    return bitacora.filter((item) => {
      const key = toLocalDateKey(item.fecha)
      if (from && key < from) return false
      if (to && key > to) return false
      return true
    })
  }, [bitacora, from, to])

  const filteredSeguimientos = useMemo(() => {
    return seguimientos.filter((item) => {
      const key = toLocalDateKey(item.fechaProgramada)
      if (from && key < from) return false
      if (to && key > to) return false
      return true
    })
  }, [seguimientos, from, to])

  const stats = useMemo(() => {
    const byTipo: Record<string, number> = {}
    const byFisio: Record<string, number> = {}
    const athletes = new Set<string>()
    let ordenes = 0
    for (const item of filtered) {
      const tipo = TIPO_BITACORA_LABEL[item.tipo] || item.tipo
      byTipo[tipo] = (byTipo[tipo] || 0) + 1
      byFisio[item.fisioterapeutaNombre || "Sin asignar"] = (byFisio[item.fisioterapeutaNombre || "Sin asignar"] || 0) + 1
      if (item.deportistaId || item.deportistaNombre) {
        athletes.add(item.deportistaId || item.deportistaNombre || "")
      }
      if (item.orden?.descripcion) ordenes += 1
    }
    return {
      total: filtered.length,
      byTipo,
      byFisio,
      athletes: athletes.size,
      ordenes,
      seguimientosPendientes: filteredSeguimientos.filter((item) => item.estado === "Pendiente").length,
      seguimientosRealizados: filteredSeguimientos.filter((item) => item.estado === "Realizado").length,
    }
  }, [filtered, filteredSeguimientos])

  function downloadReport() {
    const records = bitacora.filter((item) => {
      const key = toLocalDateKey(item.fecha)
      if (reportFrom && key < reportFrom) return false
      if (reportTo && key > reportTo) return false
      return true
    })
    const segs = seguimientos.filter((item) => {
      const key = toLocalDateKey(item.fechaProgramada)
      if (reportFrom && key < reportFrom) return false
      if (reportTo && key > reportTo) return false
      return true
    })
    exportFisioAdminReport(records, segs, "reporte-fisioterapia.xlsx")
    setReportOpen(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Desde</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Hasta</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        <Button className="h-10 justify-center bg-teal-800 hover:bg-teal-700" onClick={() => {
          setReportFrom(from)
          setReportTo(to)
          setReportOpen(true)
        }}>
          <Download className="h-4 w-4" />
          Reporte
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader><CardTitle className="text-sm">Registros</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{stats.total}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Deportistas</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{stats.athletes}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Órdenes</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{stats.ordenes}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Seguimientos pendientes</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{stats.seguimientosPendientes}</CardContent></Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Por tipo</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                {Object.entries(stats.byTipo).map(([label, count]) => (
                  <TableRow key={label}>
                    <TableCell>{label}</TableCell>
                    <TableCell className="text-right font-medium">{count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Por fisioterapeuta</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                {Object.entries(stats.byFisio).map(([label, count]) => (
                  <TableRow key={label}>
                    <TableCell>{label}</TableCell>
                    <TableCell className="text-right font-medium">{count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Descargar reporte</DialogTitle>
            <DialogDescription>Elige el rango de fechas que quieres incluir en el Excel.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Desde</Label>
              <Input type="date" value={reportFrom} onChange={(e) => setReportFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Hasta</Label>
              <Input type="date" value={reportTo} onChange={(e) => setReportTo(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(false)}>Cancelar</Button>
            <Button className="bg-teal-800 hover:bg-teal-700" onClick={downloadReport}>Descargar Excel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

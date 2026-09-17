"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { listBitacora, listSeguimientos, listSolicitudes } from "@/lib/fisioterapia"
import { useFisioActor } from "@/lib/fisioterapia-session"
import { exportBitacoraExcel } from "@/components/fisioterapia/excel"
import type { FisioterapiaBitacora, FisioterapiaSeguimiento, FisioterapiaSolicitud } from "@/lib/types"

export default function ReportesPage() {
  const router = useRouter()
  const actor = useFisioActor()
  const [bitacora, setBitacora] = useState<FisioterapiaBitacora[]>([])
  const [solicitudes, setSolicitudes] = useState<FisioterapiaSolicitud[]>([])
  const [seguimientos, setSeguimientos] = useState<FisioterapiaSeguimiento[]>([])

  useEffect(() => {
    if (actor?.kind === "fisioterapeuta" && !actor.esEncargado) {
      router.replace("/fisioterapia")
    }
  }, [actor, router])

  useEffect(() => {
    if (!actor) return
    Promise.all([listBitacora(actor), listSolicitudes(actor), listSeguimientos(actor)]).then(([b, s, g]) => {
      setBitacora(b)
      setSolicitudes(s)
      setSeguimientos(g)
    })
  }, [actor])

  const resumen = useMemo(
    () => ({
      bitacora: bitacora.length,
      solicitudes: solicitudes.length,
      pendientes: solicitudes.filter((item) => item.estado === "Pendiente").length,
      seguimientos: seguimientos.filter((item) => item.estado === "Pendiente").length,
    }),
    [bitacora, solicitudes, seguimientos],
  )

  if (!actor || actor.kind !== "fisioterapeuta" || !actor.esEncargado) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Reportes</h1>
          <p className="text-sm text-slate-500">Exportación global de bitácoras filtradas.</p>
        </div>
        <Button className="h-10 justify-center bg-teal-800 hover:bg-teal-700" onClick={() => exportBitacoraExcel(bitacora, "bitacora-general.xlsx")}>
          <Download className="h-4 w-4" />
          Descargar Excel
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader><CardTitle className="text-sm">Registros</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{resumen.bitacora}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Solicitudes</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{resumen.solicitudes}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Pendientes</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{resumen.pendientes}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Seguimientos</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{resumen.seguimientos}</CardContent></Card>
      </div>
    </div>
  )
}

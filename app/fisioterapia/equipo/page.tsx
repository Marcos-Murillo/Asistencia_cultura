"use client"

import { useEffect, useMemo, useState } from "react"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Combobox } from "@/components/ui/combobox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { listBitacora, listFisioterapeutas, TIPO_BITACORA_LABEL } from "@/lib/fisioterapia"
import { useFisioActor } from "@/lib/fisioterapia-session"
import { exportBitacoraExcel } from "@/components/fisioterapia/excel"
import {
  CompactDateButton,
  CompactFiltersButton,
  MobileRecordCard,
} from "@/components/fisioterapia/compact-filters"
import type { FisioterapiaBitacora, UserProfile } from "@/lib/types"
import { useRouter } from "next/navigation"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function EquipoBitacorasPage() {
  const router = useRouter()
  const actor = useFisioActor()
  const [records, setRecords] = useState<FisioterapiaBitacora[]>([])
  const [fisios, setFisios] = useState<UserProfile[]>([])
  const [fisioId, setFisioId] = useState("")
  const [tipo, setTipo] = useState("")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [selected, setSelected] = useState<FisioterapiaBitacora | null>(null)

  useEffect(() => {
    if (actor?.kind === "fisioterapeuta" && !actor.esEncargado) {
      router.replace("/fisioterapia/bitacora")
    }
  }, [actor, router])

  useEffect(() => {
    if (!actor) return
    Promise.all([listBitacora(actor), listFisioterapeutas()]).then(([b, f]) => {
      setRecords(b)
      setFisios(f)
    })
  }, [actor])

  const filtered = useMemo(() => {
    return records.filter((item) => {
      if (fisioId && item.fisioterapeutaId !== fisioId) return false
      if (tipo && item.tipo !== tipo) return false
      if (from && item.fecha.toISOString().slice(0, 10) < from) return false
      if (to && item.fecha.toISOString().slice(0, 10) > to) return false
      return true
    })
  }, [records, fisioId, tipo, from, to])

  if (!actor || actor.kind !== "fisioterapeuta" || !actor.esEncargado) return null

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Bitácoras del equipo</h1>
          <p className="text-sm text-slate-500">Fisioterapeuta → bitácora → registro.</p>
        </div>
        <Button variant="outline" className="h-10 justify-center" onClick={() => exportBitacoraExcel(filtered, "bitacora-equipo.xlsx")}>
          <Download className="h-4 w-4" />
          Descargar Excel
        </Button>
      </div>
      <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto md:hidden">
        <CompactDateButton from={from} to={to} onFrom={setFrom} onTo={setTo} />
        <CompactFiltersButton
          value={tipo}
          onChange={setTipo}
          options={[
            { value: "", label: "Todos" },
            { value: "actividad", label: "Actividad" },
            { value: "atencion", label: "Atención por lesión" },
            { value: "solicitud", label: "Solicitud atendida" },
          ]}
        />
        <CompactFiltersButton
          label="Fisio"
          value={fisioId}
          onChange={setFisioId}
          options={[
            { value: "", label: "Todos" },
            ...fisios.map((item) => ({ value: item.id, label: item.nombres })),
          ]}
        />
      </div>
      <div className="hidden gap-3 md:grid md:grid-cols-3">
        <Combobox
          options={[{ value: "", label: "Todos los fisioterapeutas" }, ...fisios.map((item) => ({ value: item.id, label: item.nombres }))]}
          value={fisioId}
          onValueChange={setFisioId}
        />
        <Combobox
          options={[
            { value: "", label: "Todos los tipos" },
            { value: "actividad", label: "Actividad" },
            { value: "atencion", label: "Atención" },
            { value: "solicitud", label: "Solicitud" },
          ]}
          value={tipo}
          onValueChange={setTipo}
        />
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
      </div>
      <div className="space-y-1.5 md:hidden">
        {filtered.map((item) => (
          <MobileRecordCard
            key={item.id}
            title={item.grupoNombre || item.fisioterapeutaNombre}
            subtitle={item.descripcion || item.motivoAtencion || TIPO_BITACORA_LABEL[item.tipo]}
            onClick={() => setSelected(item)}
          />
        ))}
      </div>
      <div className="hidden overflow-hidden rounded-md border bg-white md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fisioterapeuta</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Grupo</TableHead>
              <TableHead>Deportista</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.fisioterapeutaNombre}</TableCell>
                <TableCell>{item.fecha.toLocaleDateString("es-CO")}</TableCell>
                <TableCell><Badge variant="secondary">{TIPO_BITACORA_LABEL[item.tipo]}</Badge></TableCell>
                <TableCell>{item.grupoNombre}</TableCell>
                <TableCell>{item.deportistaNombre || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Drawer open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DrawerContent side="bottom" className="max-h-[80dvh] gap-0 border-white/40 bg-white/70 backdrop-blur-xl">
          <div className="mx-auto mb-1 mt-2 h-1 w-10 rounded-full bg-slate-300/80" />
          <DrawerHeader className="pt-2">
            <DrawerTitle>{selected?.grupoNombre || "Registro"}</DrawerTitle>
            <DrawerDescription>{selected && TIPO_BITACORA_LABEL[selected.tipo]}</DrawerDescription>
          </DrawerHeader>
          {selected && (
            <ScrollArea className="min-h-0 flex-1 overflow-y-auto px-6 pb-8">
              <div className="space-y-2 text-sm">
                <p>{selected.fecha.toLocaleDateString("es-CO")} {selected.hora}</p>
                <p>Fisioterapeuta: {selected.fisioterapeutaNombre}</p>
                <p>Deportista: {selected.deportistaNombre || "—"}</p>
                <p>{selected.descripcion || selected.motivoAtencion || selected.descripcionIncidente}</p>
              </div>
            </ScrollArea>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  )
}

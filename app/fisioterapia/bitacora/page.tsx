"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Download, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Combobox } from "@/components/ui/combobox"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { listBitacora, TIPO_BITACORA_LABEL } from "@/lib/fisioterapia"
import { listDeportiveGroups } from "@/lib/db-router"
import { useFisioActor } from "@/lib/fisioterapia-session"
import { exportBitacoraExcel } from "@/components/fisioterapia/excel"
import { BitacoraFormDrawer } from "@/components/fisioterapia/bitacora-form-drawer"
import { AthleteHistoryDrawer } from "@/components/fisioterapia/athlete-history-drawer"
import {
  CompactDateButton,
  CompactFiltersButton,
  CompactGroupButton,
  MobileRecordCard,
} from "@/components/fisioterapia/compact-filters"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { FisioterapiaBitacora, FisioterapiaBitacoraTipo } from "@/lib/types"
import { toLocalDateKey } from "@/lib/utils"
import { fisioSheetClass, fisioSheetHandleClass } from "@/components/fisioterapia/drawer-styles"
import { Suspense } from "react"

function BitacoraPage() {
  const actor = useFisioActor()
  const searchParams = useSearchParams()
  const [records, setRecords] = useState<FisioterapiaBitacora[]>([])
  const [groups, setGroups] = useState<{ id: string; nombre: string }[]>([])
  const [q, setQ] = useState("")
  const [tipo, setTipo] = useState<string>("todos")
  const [grupo, setGrupo] = useState("")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [selected, setSelected] = useState<FisioterapiaBitacora | null>(null)
  const [historyId, setHistoryId] = useState<string | null>(null)

  async function load() {
    if (!actor) return
    const [items, groupList] = await Promise.all([listBitacora(actor), listDeportiveGroups()])
    setRecords(items)
    setGroups(groupList)
  }

  useEffect(() => {
    load()
  }, [actor])

  useEffect(() => {
    if (searchParams.get("nuevo") === "1") setFormOpen(true)
  }, [searchParams])

  const filtered = useMemo(() => {
    return records.filter((item) => {
      if (tipo !== "todos" && item.tipo !== tipo) return false
      if (grupo && item.grupoNombre !== grupo) return false
      if (from && toLocalDateKey(item.fecha) < from) return false
      if (to && toLocalDateKey(item.fecha) > to) return false
      const blob = `${item.descripcion} ${item.deportistaNombre} ${item.grupoNombre} ${item.observaciones}`.toLowerCase()
      if (q && !blob.includes(q.toLowerCase())) return false
      return true
    })
  }, [records, tipo, grupo, from, to, q])

  const today = filtered.filter((item) => toLocalDateKey(item.fecha) === toLocalDateKey(new Date()))

  if (!actor) return null

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Mi bitácora</h1>
          <p className="hidden text-sm text-slate-500 md:block">
            {groups.length > 0
              ? `${groups.length} grupos deportivos conectados desde la base de datos.`
              : "Registros individuales del fisioterapeuta autenticado."}
          </p>
        </div>
        <div className="hidden gap-2 sm:flex">
          <Button variant="outline" className="h-10 justify-center" onClick={() => exportBitacoraExcel(filtered, "mi-bitacora.xlsx")}>
            <Download className="h-4 w-4" />
            Descargar Excel
          </Button>
          <Button className="h-10 justify-center bg-teal-800 hover:bg-teal-700" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            Nuevo registro
          </Button>
        </div>
      </div>

      <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto md:hidden">
        <CompactDateButton from={from} to={to} onFrom={setFrom} onTo={setTo} />
        <CompactGroupButton
          groups={groups.map((g) => ({ value: g.nombre, label: g.nombre }))}
          value={grupo}
          onChange={setGrupo}
        />
        <CompactFiltersButton
          value={tipo}
          onChange={setTipo}
          options={[
            { value: "todos", label: "Todos" },
            { value: "actividad", label: TIPO_BITACORA_LABEL.actividad },
            { value: "atencion", label: TIPO_BITACORA_LABEL.atencion },
            { value: "solicitud", label: TIPO_BITACORA_LABEL.solicitud },
          ]}
        />
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-slate-400" />
          <Input className="h-8 pl-7 text-xs" placeholder="Buscar" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <Card className="hidden md:block">
        <CardContent className="grid gap-3 pt-4 md:grid-cols-5">
          <div className="relative md:col-span-2">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
            <Input className="pl-8" placeholder="Buscar" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <Combobox
            options={[{ value: "", label: "Todos los grupos" }, ...groups.map((g) => ({ value: g.nombre, label: g.nombre }))]}
            value={grupo}
            onValueChange={setGrupo}
            placeholder="Grupo"
          />
        </CardContent>
      </Card>

      <Tabs defaultValue="tabla">
        <TabsList className="hidden md:inline-flex">
          <TabsTrigger value="tabla">Tabla</TabsTrigger>
          <TabsTrigger value="timeline">Timeline del día</TabsTrigger>
        </TabsList>
        <TabsContent value="tabla" className="mt-0 md:mt-2">
          <div className="hidden gap-2 py-2 md:flex">
            {(["todos", "actividad", "atencion", "solicitud"] as const).map((item) => (
              <Button key={item} size="sm" variant={tipo === item ? "default" : "outline"} onClick={() => setTipo(item)}>
                {item === "todos" ? "Todos" : TIPO_BITACORA_LABEL[item as FisioterapiaBitacoraTipo]}
              </Button>
            ))}
          </div>
          <div className="space-y-1.5 md:hidden">
            {filtered.map((item) => (
              <MobileRecordCard
                key={item.id}
                title={item.grupoNombre || TIPO_BITACORA_LABEL[item.tipo]}
                subtitle={item.descripcion || item.motivoAtencion || item.descripcionIncidente}
                onClick={() => setSelected(item)}
              />
            ))}
          </div>
          <div className="hidden overflow-hidden rounded-md border bg-white md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Grupo</TableHead>
                  <TableHead>Deportista</TableHead>
                  <TableHead>Descripción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item.id} className="cursor-pointer" onClick={() => setSelected(item)}>
                    <TableCell>{item.fecha.toLocaleDateString("es-CO")} {item.hora}</TableCell>
                    <TableCell><Badge variant="secondary">{TIPO_BITACORA_LABEL[item.tipo]}</Badge></TableCell>
                    <TableCell>{item.grupoNombre}</TableCell>
                    <TableCell>{item.deportistaNombre}</TableCell>
                    <TableCell className="max-w-xs truncate">{item.descripcion || item.motivoAtencion}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        <TabsContent value="timeline" className="space-y-3">
          {today.length === 0 && <p className="text-sm text-slate-500">No hay actividades registradas hoy.</p>}
          {today.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex gap-4 pt-4">
                <div className="w-16 shrink-0 text-sm font-semibold text-teal-800">{item.hora}</div>
                <div>
                  <p className="font-medium">{TIPO_BITACORA_LABEL[item.tipo]}</p>
                  <p className="text-sm text-slate-600">{item.grupoNombre} · {item.descripcion || item.motivoAtencion}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <BitacoraFormDrawer open={formOpen} onOpenChange={setFormOpen} actor={actor} groups={groups} onSaved={load} />
      <AthleteHistoryDrawer
        open={Boolean(historyId)}
        onOpenChange={(v) => !v && setHistoryId(null)}
        nested
        actor={actor}
        deportistaId={historyId}
      />
      <Drawer open={Boolean(selected)} onOpenChange={(v) => !v && setSelected(null)}>
        <DrawerContent side="bottom" className={fisioSheetClass}>
          <div className={fisioSheetHandleClass} />
          <DrawerHeader className="pt-2">
            <DrawerTitle>Detalle del registro</DrawerTitle>
            <DrawerDescription>{selected && TIPO_BITACORA_LABEL[selected.tipo]}</DrawerDescription>
          </DrawerHeader>
          {selected && (
            <ScrollArea className="min-h-0 flex-1 overflow-y-auto px-6 pb-8">
              <div className="space-y-2 text-sm">
                <p>{selected.fecha.toLocaleDateString("es-CO")} {selected.hora}</p>
                <p>Grupo: {selected.grupoNombre}</p>
                <p>Entrenador: {selected.entrenadorNombre}</p>
                <p>Deportista: {selected.deportistaNombre || "—"}</p>
                <p>{selected.descripcion || selected.descripcionIncidente}</p>
                {selected.intervencion && <p>Intervención: {selected.intervencion}</p>}
                {selected.recomendaciones && <p>Recomendaciones: {selected.recomendaciones}</p>}
                {selected.orden && <p>Orden: {selected.orden.descripcion}</p>}
                {selected.deportistaId && (
                  <Button variant="outline" className="mt-3 h-9 justify-center" onClick={() => setHistoryId(selected.deportistaId!)}>
                    Ver historial del deportista
                  </Button>
                )}
              </div>
            </ScrollArea>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  )
}

export default function BitacoraPageWrapper() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Cargando bitácora...</p>}>
      <BitacoraPage />
    </Suspense>
  )
}

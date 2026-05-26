"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getGroupTracking, getAttendanceRecords } from "@/lib/db-router"
import type { GroupTracking, AttendanceRecord, GroupCategory } from "@/lib/types"
import type { Area } from "@/lib/firebase-config"
import { Calendar, ChevronLeft, ChevronRight, ArrowLeft, Users, ArrowUpDown } from "lucide-react"
import Link from "next/link"
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  format,
} from "date-fns"
import { es } from "date-fns/locale"
import { ExcelColumnSelector, type ExcelColumn } from "@/components/excel-column-selector"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { formatNombre } from "@/lib/utils"
import * as XLSX from "xlsx"

type TimeFilter = "day" | "week" | "month"
type SortOrder = "name" | "attendance-desc" | "attendance-asc"

const ITEMS_PER_PAGE = 15

const PERIOD_LABELS: Record<TimeFilter, string> = {
  day: "Un día",
  week: "Una semana",
  month: "Un mes",
}

const DATE_PICKER_HINT: Record<TimeFilter, string> = {
  day: "Elige el día a consultar",
  week: "Elige un día dentro de la semana",
  month: "Elige un día del mes a consultar",
}

export type GroupAttendanceReportProps = {
  groupName: string
  area: Area
  backLink?: { href: string; label: string } | null
  managerDisplayName?: string
  userCategories?: Record<string, GroupCategory>
}

const DEFAULT_BACK = { href: "/estadisticas", label: "Volver" }

export function GroupAttendanceReport({
  groupName,
  area,
  backLink = DEFAULT_BACK,
  managerDisplayName,
  userCategories = {},
}: GroupAttendanceReportProps) {
  const [groupData, setGroupData] = useState<GroupTracking | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("month")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [currentPage, setCurrentPage] = useState(1)
  const [showExcelDialog, setShowExcelDialog] = useState(false)
  const [excelDesde, setExcelDesde] = useState("")
  const [excelHasta, setExcelHasta] = useState("")
  const [allAttendanceRecords, setAllAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [sortOrder, setSortOrder] = useState<SortOrder>("name")
  const [filterCategory, setFilterCategory] = useState<GroupCategory | "TODOS" | "SIN_CATEGORIA">("TODOS")

  useEffect(() => {
    loadGroupData()
  }, [groupName, area])

  useEffect(() => {
    setCurrentPage(1)
  }, [timeFilter, selectedDate, sortOrder, filterCategory])

  async function loadGroupData() {
    setLoading(true)
    try {
      const [tracking, records] = await Promise.all([
        getGroupTracking(area),
        getAttendanceRecords(area),
      ])
      const group = tracking.find((g) => g.groupName === groupName)
      setGroupData(group || null)
      setAllAttendanceRecords(records.filter((r) => r.grupoCultural === groupName))
    } catch (error) {
      console.error("[GroupAttendanceReport] Error loading group data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getDateRange = (date: Date, filter: TimeFilter) => {
    switch (filter) {
      case "day":
        return {
          start: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          end: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59),
        }
      case "week":
        return {
          start: startOfWeek(date, { locale: es }),
          end: endOfWeek(date, { locale: es }),
        }
      case "month":
        return {
          start: startOfMonth(date),
          end: endOfMonth(date),
        }
    }
  }

  const periodSummary = useMemo(() => {
    if (!selectedDate) return null
    const range = getDateRange(selectedDate, timeFilter)
    if (timeFilter === "day") {
      return format(range.start, "EEEE d 'de' MMMM yyyy", { locale: es })
    }
    return `${format(range.start, "d MMM yyyy", { locale: es })} — ${format(range.end, "d MMM yyyy", { locale: es })}`
  }, [selectedDate, timeFilter])

  const filteredParticipants = useMemo(() => {
    if (!groupData) return []

    let list = groupData.participants

    if (selectedDate) {
      const range = getDateRange(selectedDate, timeFilter)
      list = list.filter((p) => isWithinInterval(new Date(p.lastAttendance), range))
    }

    if (filterCategory === "SIN_CATEGORIA") {
      list = list.filter((p) => !userCategories[p.userId])
    } else if (filterCategory !== "TODOS") {
      list = list.filter((p) => userCategories[p.userId] === filterCategory)
    }

    const sorted = [...list]
    if (sortOrder === "name") {
      sorted.sort((a, b) =>
        a.userName.localeCompare(b.userName, "es", { sensitivity: "base" })
      )
    } else if (sortOrder === "attendance-desc") {
      sorted.sort((a, b) => b.totalCount - a.totalCount)
    } else {
      sorted.sort((a, b) => a.totalCount - b.totalCount)
    }

    return sorted
  }, [groupData, selectedDate, timeFilter, filterCategory, userCategories, sortOrder])

  const totalPages = Math.ceil(filteredParticipants.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentParticipants = filteredParticipants.slice(startIndex, endIndex)

  const sortLabel =
    sortOrder === "name"
      ? "Nombre (A-Z)"
      : sortOrder === "attendance-desc"
        ? "Mayor a menor asistencias"
        : "Menor a mayor asistencias"

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)

  const categoryBadgeClass = (cat: GroupCategory) =>
    cat === "SEMILLERO"
      ? "bg-green-100 text-green-800"
      : cat === "PROCESO"
        ? "bg-purple-100 text-purple-800"
        : "bg-orange-100 text-orange-800"

  const excelColumns: ExcelColumn[] = [
    { key: "codigoEstudiantil", label: "Código" },
    { key: "numeroDocumento", label: "Documento" },
    { key: "genero", label: "Género" },
    { key: "estamento", label: "Estamento" },
    { key: "facultad", label: "Facultad" },
    { key: "programaAcademico", label: "Programa" },
    { key: "correo", label: "Correo" },
    { key: "telefono", label: "Teléfono" },
    { key: "sede", label: "Sede" },
    { key: "edad", label: "Edad" },
  ]

  function buildExcelRows(
    records: AttendanceRecord[],
    selectedColumns: string[]
  ): Record<string, unknown>[] {
    const userMap = new Map<string, { record: AttendanceRecord; count: number }>()
    records.forEach((r) => {
      const key = r.numeroDocumento
      if (!userMap.has(key)) userMap.set(key, { record: r, count: 0 })
      userMap.get(key)!.count++
    })

    return Array.from(userMap.values()).map(({ record: r, count }) => {
      const row: Record<string, unknown> = {
        Nombres: formatNombre(r.nombres).toUpperCase(),
        "Total Asistencias": count,
      }
      selectedColumns.forEach((key) => {
        switch (key) {
          case "codigoEstudiantil":
            row["Código"] = r.codigoEstudiantil || ""
            break
          case "numeroDocumento":
            row["Documento"] = r.numeroDocumento
            break
          case "genero":
            row["Género"] = r.genero
            break
          case "estamento":
            row["Estamento"] = r.estamento
            break
          case "facultad":
            row["Facultad"] = r.facultad || "N/A"
            break
          case "programaAcademico":
            row["Programa"] = r.programaAcademico || "N/A"
            break
          case "correo":
            row["Correo"] = r.correo
            break
          case "telefono":
            row["Teléfono"] = r.telefono
            break
          case "sede":
            row["Sede"] = r.sede
            break
          case "edad":
            row["Edad"] = r.edad
            break
        }
      })
      return row
    })
  }

  function handleDownloadExcel(selectedColumns: string[]) {
    const filtered = allAttendanceRecords.filter((r) => {
      const ts = new Date(r.timestamp)
      if (excelDesde && ts < new Date(excelDesde)) return false
      if (excelHasta) {
        const h = new Date(excelHasta)
        h.setHours(23, 59, 59)
        if (ts > h) return false
      }
      return true
    })

    const data = buildExcelRows(filtered, selectedColumns)
    const periodLabel =
      excelDesde && excelHasta
        ? `${excelDesde} a ${excelHasta}`
        : excelDesde
          ? `Desde ${excelDesde}`
          : excelHasta
            ? `Hasta ${excelHasta}`
            : "Todas las fechas registradas"

    const titleBlock: string[][] = [
      ["REPORTE DE ASISTENCIAS"],
      [`Grupo: ${groupName}`],
      [`Encargado: ${managerDisplayName?.trim() || "—"}`],
      [`Período: ${periodLabel}`],
      [],
    ]

    const ws = XLSX.utils.aoa_to_sheet(titleBlock)
    XLSX.utils.sheet_add_json(ws, data, { origin: `A${titleBlock.length + 1}` })

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Asistencias")
    const suffix =
      excelDesde || excelHasta
        ? `_${excelDesde || "inicio"}_a_${excelHasta || "hoy"}`
        : ""
    XLSX.writeFile(wb, `asistencias_${groupName.replace(/\s+/g, "_")}${suffix}.xlsx`)
    setShowExcelDialog(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-600">
        Cargando asistencias...
      </div>
    )
  }

  if (!groupData) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          No se encontró información del grupo
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {backLink && (
        <Button variant="ghost" size="sm" asChild className="gap-2 -ml-2">
          <Link href={backLink.href}>
            <ArrowLeft className="h-4 w-4" />
            {backLink.label}
          </Link>
        </Button>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {groupName}
          </CardTitle>
          <CardDescription>
            {filteredParticipants.length} asistente(s) en el período seleccionado
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Período</Label>
              <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">{PERIOD_LABELS.day}</SelectItem>
                  <SelectItem value="week">{PERIOD_LABELS.week}</SelectItem>
                  <SelectItem value="month">{PERIOD_LABELS.month}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">{DATE_PICKER_HINT[timeFilter]}</Label>
              <DatePicker date={selectedDate} onDateChange={setSelectedDate} />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Categoría</Label>
              <Select
                value={filterCategory}
                onValueChange={(v) =>
                  setFilterCategory(v as GroupCategory | "TODOS" | "SIN_CATEGORIA")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todas</SelectItem>
                  <SelectItem value="SIN_CATEGORIA">Sin categoría</SelectItem>
                  <SelectItem value="SEMILLERO">Semillero</SelectItem>
                  <SelectItem value="PROCESO">Proceso</SelectItem>
                  <SelectItem value="REPRESENTATIVO">Representativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Ordenar por</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between font-normal">
                    <span className="truncate">{sortLabel}</span>
                    <ArrowUpDown className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[var(--radix-dropdown-menu-trigger-width)]">
                  <DropdownMenuItem onClick={() => setSortOrder("name")}>
                    Nombre (A-Z)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOrder("attendance-desc")}>
                    Mayor a menor asistencias
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOrder("attendance-asc")}>
                    Menor a mayor asistencias
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {periodSummary && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 shrink-0" />
              {periodSummary}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <ExcelColumnSelector
              availableColumns={excelColumns}
              onDownload={(cols) => handleDownloadExcel(cols.filter((c) => c !== "nombres"))}
              buttonText="Exportar Excel"
            />
            <Button variant="outline" onClick={() => setShowExcelDialog(true)}>
              Rango personalizado
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participante</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Asistencias</TableHead>
                  <TableHead>Última asistencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentParticipants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                      No hay asistentes para este período o filtro
                    </TableCell>
                  </TableRow>
                ) : (
                  currentParticipants.map((p) => {
                    const cat = userCategories[p.userId]
                    return (
                      <TableRow key={p.userId}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                                {getInitials(p.userName)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{formatNombre(p.userName)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {cat ? (
                            <Badge className={categoryBadgeClass(cat)}>{cat}</Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold">{p.totalCount}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(p.lastAttendance), "d MMM yyyy", { locale: es })}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-2 border-t p-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showExcelDialog} onOpenChange={setShowExcelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exportar con rango de fechas</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="excel-desde">Desde</Label>
              <Input
                id="excel-desde"
                type="date"
                value={excelDesde}
                onChange={(e) => setExcelDesde(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="excel-hasta">Hasta</Label>
              <Input
                id="excel-hasta"
                type="date"
                value={excelHasta}
                onChange={(e) => setExcelHasta(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowExcelDialog(false)}>
              Cancelar
            </Button>
            <ExcelColumnSelector
              availableColumns={excelColumns}
              onDownload={(cols) => handleDownloadExcel(cols.filter((c) => c !== "nombres"))}
              buttonText="Descargar"
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

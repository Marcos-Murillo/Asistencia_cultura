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
import jsPDF from "jspdf"
import { autoTable } from "jspdf-autotable"

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
  const [showPdfDialog, setShowPdfDialog] = useState(false)
  const [pdfDesde, setPdfDesde] = useState("")
  const [pdfHasta, setPdfHasta] = useState("")

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

  function handleDownloadPDF() {
    // ── Filtrar registros por rango de fechas ──────────────────────────────
    const filtered = allAttendanceRecords.filter((r) => {
      const ts = new Date(r.timestamp)
      if (pdfDesde && ts < new Date(pdfDesde)) return false
      if (pdfHasta) {
        const h = new Date(pdfHasta)
        h.setHours(23, 59, 59)
        if (ts > h) return false
      }
      return true
    })

    // ── Agregar registros por documento (igual que Excel) ──────────────────
    const userMap = new Map<string, { record: AttendanceRecord; count: number }>()
    filtered.forEach((r) => {
      const key = r.numeroDocumento
      if (!userMap.has(key)) userMap.set(key, { record: r, count: 0 })
      userMap.get(key)!.count++
    })

    const rows = Array.from(userMap.values()).map(({ record: r, count }, i) => [
      String(i + 1),
      formatNombre(r.nombres).toUpperCase(),
      r.numeroDocumento,
      r.estamento,
      r.sede,
      String(count),
    ])

    // ── Etiqueta de período ────────────────────────────────────────────────
    const periodLabel =
      pdfDesde && pdfHasta
        ? `${pdfDesde} a ${pdfHasta}`
        : pdfDesde
          ? `Desde ${pdfDesde}`
          : pdfHasta
            ? `Hasta ${pdfHasta}`
            : "Todas las fechas registradas"

    const generatedOn = format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es })

    // ── Crear documento PDF ────────────────────────────────────────────────
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
    const pageWidth = doc.internal.pageSize.getWidth()
    const marginX = 14

    // Encabezado institucional
    doc.setFillColor(22, 101, 52)
    doc.rect(0, 0, pageWidth, 22, "F")

    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(13)
    doc.text("VICERRECTORÍA DE BIENESTAR UNIVERSITARIO", pageWidth / 2, 9, { align: "center" })
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text("Área de Cultura — Universidad del Valle", pageWidth / 2, 16, { align: "center" })

    // Título del reporte
    doc.setTextColor(22, 101, 52)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(14)
    doc.text("REPORTE OFICIAL DE ASISTENCIAS", pageWidth / 2, 32, { align: "center" })

    // Línea separadora
    doc.setDrawColor(22, 101, 52)
    doc.setLineWidth(0.5)
    doc.line(marginX, 35, pageWidth - marginX, 35)

    // Metadata del reporte
    doc.setTextColor(50, 50, 50)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)

    const metaY = 41
    const col1 = marginX
    const col2 = pageWidth / 2 + 4

    doc.setFont("helvetica", "bold")
    doc.text("Grupo:", col1, metaY)
    doc.setFont("helvetica", "normal")
    doc.text(groupName, col1 + 16, metaY)

    doc.setFont("helvetica", "bold")
    doc.text("Encargado:", col2, metaY)
    doc.setFont("helvetica", "normal")
    doc.text(managerDisplayName?.trim() || "—", col2 + 24, metaY)

    doc.setFont("helvetica", "bold")
    doc.text("Período:", col1, metaY + 6)
    doc.setFont("helvetica", "normal")
    doc.text(periodLabel, col1 + 16, metaY + 6)

    doc.setFont("helvetica", "bold")
    doc.text("Total asistentes:", col2, metaY + 6)
    doc.setFont("helvetica", "normal")
    doc.text(String(rows.length), col2 + 35, metaY + 6)

    doc.setFont("helvetica", "bold")
    doc.text("Fecha de generación:", col1, metaY + 12)
    doc.setFont("helvetica", "normal")
    doc.text(generatedOn, col1 + 40, metaY + 12)

    // Línea separadora
    doc.line(marginX, metaY + 16, pageWidth - marginX, metaY + 16)

    // ── Tabla de asistentes ────────────────────────────────────────────────
    autoTable(doc, {
      startY: metaY + 20,
      margin: { left: marginX, right: marginX },
      head: [["#", "Nombre completo", "Documento", "Estamento", "Sede", "Asistencias"]],
      body: rows,
      theme: "grid",
      headStyles: {
        fillColor: [22, 101, 52],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
        halign: "center",
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [40, 40, 40],
      },
      alternateRowStyles: {
        fillColor: [240, 253, 244],
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 8 },
        1: { cellWidth: "auto" },
        2: { halign: "center", cellWidth: 28 },
        3: { halign: "center", cellWidth: 28 },
        4: { halign: "center", cellWidth: 30 },
        5: { halign: "center", cellWidth: 18 },
      },
      didDrawPage: (data) => {
        const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } })
          .internal.getNumberOfPages()
        doc.setFontSize(8)
        doc.setTextColor(130, 130, 130)
        doc.setFont("helvetica", "normal")
        doc.text(
          `Página ${data.pageNumber} de ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 8,
          { align: "center" }
        )
      },
    })

    // ── Sección de firma ───────────────────────────────────────────────────
    const lastTable = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable
    const tableEndY = (lastTable?.finalY ?? 0) + 16

    const signatureBlockH = 60
    const pageH = doc.internal.pageSize.getHeight()
    const signatureY = tableEndY + signatureBlockH > pageH - 20
      ? (() => { doc.addPage(); return 30 })()
      : tableEndY

    // Caja de declaración
    doc.setDrawColor(22, 101, 52)
    doc.setLineWidth(0.3)
    doc.roundedRect(marginX, signatureY - 4, pageWidth - marginX * 2, 30, 2, 2, "S")

    doc.setFontSize(8)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(22, 101, 52)
    doc.text("DECLARACIÓN DE VERACIDAD", marginX + 4, signatureY + 2)

    doc.setFont("helvetica", "normal")
    doc.setTextColor(50, 50, 50)
    const declaracion =
      "El suscrito encargado del grupo, en pleno ejercicio de sus funciones y en cumplimiento de los principios " +
      "de transparencia e integridad institucional, certifica que la información contenida en el presente " +
      "documento constituye un registro fiel y verídico de las asistencias registradas durante el período " +
      "indicado, conforme a los datos consignados en el sistema de gestión de asistencias del Área de Cultura " +
      "de la Vicerrectoría de Bienestar Universitario de la Universidad del Valle."
    const splitDecl = doc.splitTextToSize(declaracion, pageWidth - marginX * 2 - 8)
    doc.text(splitDecl, marginX + 4, signatureY + 9)

    // Línea de firma
    const sigLineY = signatureY + 44
    doc.setDrawColor(40, 40, 40)
    doc.setLineWidth(0.4)
    doc.line(marginX + 10, sigLineY, marginX + 90, sigLineY)

    doc.setFontSize(8.5)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(40, 40, 40)
    doc.text("Firma del Encargado", marginX + 10, sigLineY + 5)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(90, 90, 90)
    doc.text(managerDisplayName?.trim() || "Nombre del encargado", marginX + 10, sigLineY + 11)
    doc.text(`Grupo: ${groupName}`, marginX + 10, sigLineY + 16)

    // ── Guardar ────────────────────────────────────────────────────────────
    const suffix = pdfDesde || pdfHasta
      ? `_${pdfDesde || "inicio"}_a_${pdfHasta || "hoy"}`
      : ""
    doc.save(`asistencias_${groupName.replace(/\s+/g, "_")}${suffix}.pdf`)
    setShowPdfDialog(false)
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
            <Button
              variant="outline"
              className="gap-2 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
              onClick={() => setShowPdfDialog(true)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              Exportar PDF
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

      <Dialog open={showPdfDialog} onOpenChange={setShowPdfDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-red-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              Exportar reporte PDF
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <p className="text-sm text-muted-foreground">
              El reporte incluirá nombre, documento, estamento, sede y total de asistencias. Al
              final del documento se agregará un espacio de firma con declaración de veracidad.
            </p>
            <div className="space-y-2">
              <Label htmlFor="pdf-desde">Desde <span className="text-muted-foreground font-normal">(opcional)</span></Label>
              <Input
                id="pdf-desde"
                type="date"
                value={pdfDesde}
                onChange={(e) => setPdfDesde(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pdf-hasta">Hasta <span className="text-muted-foreground font-normal">(opcional)</span></Label>
              <Input
                id="pdf-hasta"
                type="date"
                value={pdfHasta}
                onChange={(e) => setPdfHasta(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowPdfDialog(false)}>
              Cancelar
            </Button>
            <Button
              className="gap-2 bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDownloadPDF}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Descargar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

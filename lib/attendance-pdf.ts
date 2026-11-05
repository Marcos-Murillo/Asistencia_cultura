import { format } from "date-fns"
import { es } from "date-fns/locale"
import jsPDF from "jspdf"
import { autoTable } from "jspdf-autotable"
import type { Area } from "./firebase-config"
import type { AttendanceRecord } from "./types"
import { formatNombre } from "./utils"

export function buildGroupAttendancePdf(params: {
  records: AttendanceRecord[]
  groupName: string
  area: Area
  managerDisplayName?: string
  desde?: string
  hasta?: string
}): jsPDF {
  const { records, groupName, area, managerDisplayName, desde = "", hasta = "" } = params
  const filtered = records.filter((record) => {
    const ts = new Date(record.timestamp)
    if (desde && ts < new Date(`${desde}T00:00:00`)) return false
    if (hasta && ts > new Date(`${hasta}T23:59:59`)) return false
    return true
  })

  const userMap = new Map<string, { record: AttendanceRecord; count: number }>()
  filtered.forEach((record) => {
    const key = record.numeroDocumento
    if (!userMap.has(key)) userMap.set(key, { record, count: 0 })
    userMap.get(key)!.count++
  })

  const rows = Array.from(userMap.values()).map(({ record, count }, index) => [
    String(index + 1),
    formatNombre(record.nombres).toUpperCase(),
    record.numeroDocumento,
    record.estamento,
    record.sede,
    String(count),
  ])

  const periodLabel =
    desde && hasta
      ? `${desde} a ${hasta}`
      : desde
        ? `Desde ${desde}`
        : hasta
          ? `Hasta ${hasta}`
          : "Todas las fechas registradas"

  const areaLabel = area === "deporte" ? "Área de Deporte" : "Área de Cultura"
  const generatedOn = format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es })
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const marginX = 14

  doc.setFillColor(22, 101, 52)
  doc.rect(0, 0, pageWidth, 22, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(13)
  doc.text("VICERRECTORÍA DE BIENESTAR UNIVERSITARIO", pageWidth / 2, 9, { align: "center" })
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(`${areaLabel} — Universidad del Valle`, pageWidth / 2, 16, { align: "center" })

  doc.setTextColor(22, 101, 52)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.text("REPORTE OFICIAL DE ASISTENCIAS", pageWidth / 2, 32, { align: "center" })
  doc.setDrawColor(22, 101, 52)
  doc.setLineWidth(0.5)
  doc.line(marginX, 35, pageWidth - marginX, 35)

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
  doc.line(marginX, metaY + 16, pageWidth - marginX, metaY + 16)

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
    bodyStyles: { fontSize: 8, textColor: [40, 40, 40] },
    alternateRowStyles: { fillColor: [240, 253, 244] },
    columnStyles: {
      0: { halign: "center", cellWidth: 8 },
      1: { cellWidth: "auto" },
      2: { halign: "center", cellWidth: 28 },
      3: { halign: "center", cellWidth: 28 },
      4: { halign: "center", cellWidth: 30 },
      5: { halign: "center", cellWidth: 18 },
    },
    didDrawPage: (data) => {
      const pageCount = doc.getNumberOfPages()
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

  const lastTable = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable
  const tableEndY = (lastTable?.finalY ?? 0) + 16
  const signatureBlockH = 60
  const pageH = doc.internal.pageSize.getHeight()
  const signatureY = tableEndY + signatureBlockH > pageH - 20
    ? (() => {
        doc.addPage()
        return 30
      })()
    : tableEndY

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
    `indicado, conforme a los datos consignados en el sistema de gestión de asistencias del ${areaLabel} ` +
    "de la Vicerrectoría de Bienestar Universitario de la Universidad del Valle."
  doc.text(doc.splitTextToSize(declaracion, pageWidth - marginX * 2 - 8), marginX + 4, signatureY + 9)

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

  return doc
}

export function attendancePdfFileName(groupName: string, desde?: string, hasta?: string) {
  const suffix = desde || hasta ? `_${desde || "inicio"}_a_${hasta || "hoy"}` : ""
  return `asistencias_${groupName.replace(/\s+/g, "_")}${suffix}.pdf`
}

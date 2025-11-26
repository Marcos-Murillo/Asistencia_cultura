import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import type { AttendanceStats, EventStats } from "./types"

export async function generatePDFReport(stats: AttendanceStats, eventStats?: EventStats) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let currentY = 20

  // Título del informe
  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.text("INFORME DE ASISTENCIA", pageWidth / 2, currentY, { align: "center" })

  currentY += 10
  doc.setFontSize(14)
  doc.setFont("helvetica", "normal")
  doc.text("Grupos Culturales - Universidad del Valle", pageWidth / 2, currentY, { align: "center" })

  currentY += 5
  doc.setFontSize(10)
  doc.text(`Fecha: ${new Date().toLocaleDateString("es-CO")}`, pageWidth / 2, currentY, { align: "center" })

  currentY += 15

  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text("RESUMEN GENERAL", 14, currentY)
  currentY += 10

  const totalGruposCulturales = stats.totalParticipants
  const totalEventos = eventStats?.totalParticipants || 0
  const totalGeneral = totalGruposCulturales + totalEventos

  const summaryData = [
    ["Participaciones en Grupos Culturales", totalGruposCulturales.toString()],
    ["Participaciones en Eventos", totalEventos.toString()],
    ["TOTAL GENERAL", totalGeneral.toString()],
  ]

  autoTable(doc, {
    startY: currentY,
    head: [["Categoría", "Cantidad"]],
    body: summaryData,
    theme: "grid",
    headStyles: { fillColor: [34, 197, 94], fontStyle: "bold", fontSize: 12 },
    bodyStyles: { fontSize: 11 },
    footStyles: { fillColor: [220, 252, 231], fontStyle: "bold", fontSize: 12 },
    margin: { left: 14, right: 14 },
  })

  currentY = (doc as any).lastAutoTable.finalY + 20

  // Agregar separador visual
  doc.setDrawColor(200, 200, 200)
  doc.line(14, currentY, pageWidth - 14, currentY)
  currentY += 15

  // Verificar si necesita nueva página
  if (currentY > pageHeight - 60) {
    doc.addPage()
    currentY = 20
  }

  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.text("GRUPOS CULTURALES", 14, currentY)
  currentY += 15

  // 1. TABLA: Total de Participaciones por Género (Grupos Culturales)
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("1. TOTAL DE PARTICIPACIONES POR GÉNERO", 14, currentY)
  currentY += 7

  const genderData = [
    ["Mujer", stats.byGender.mujer.toString()],
    ["Hombre", stats.byGender.hombre.toString()],
    ["Otro", stats.byGender.otro.toString()],
    ["TOTAL", stats.totalParticipants.toString()],
  ]

  autoTable(doc, {
    startY: currentY,
    head: [["Género", "Cantidad"]],
    body: genderData,
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246], fontStyle: "bold" },
    footStyles: { fillColor: [229, 231, 235], fontStyle: "bold" },
    margin: { left: 14, right: 14 },
  })

  currentY = (doc as any).lastAutoTable.finalY + 15

  // Gráfico de género (simple representación con barras)
  const maxGender = Math.max(stats.byGender.mujer, stats.byGender.hombre, stats.byGender.otro)
  const barWidth = 60
  const barHeight = 8
  const startX = 14

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")

  // Barra Mujer
  const mujerBarWidth = (stats.byGender.mujer / maxGender) * barWidth
  doc.setFillColor(236, 72, 153) // Pink
  doc.rect(startX, currentY, mujerBarWidth, barHeight, "F")
  doc.text(`Mujer: ${stats.byGender.mujer}`, startX + barWidth + 5, currentY + 6)

  currentY += 12

  // Barra Hombre
  const hombreBarWidth = (stats.byGender.hombre / maxGender) * barWidth
  doc.setFillColor(59, 130, 246) // Blue
  doc.rect(startX, currentY, hombreBarWidth, barHeight, "F")
  doc.text(`Hombre: ${stats.byGender.hombre}`, startX + barWidth + 5, currentY + 6)

  currentY += 12

  // Barra Otro
  const otroBarWidth = (stats.byGender.otro / maxGender) * barWidth
  doc.setFillColor(168, 85, 247) // Purple
  doc.rect(startX, currentY, otroBarWidth, barHeight, "F")
  doc.text(`Otro: ${stats.byGender.otro}`, startX + barWidth + 5, currentY + 6)

  currentY += 20

  // Verificar si necesita nueva página
  if (currentY > pageHeight - 60) {
    doc.addPage()
    currentY = 20
  }

  // 2. TABLA: Total de Participaciones por Grupo Cultural
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("2. TOTAL DE PARTICIPACIONES POR GRUPO CULTURAL", 14, currentY)
  currentY += 7

  const culturalGroupData = Object.entries(stats.byCulturalGroup)
    .sort(([, a], [, b]) => b - a)
    .map(([group, count]) => [group, count.toString()])

  autoTable(doc, {
    startY: currentY,
    head: [["Grupo Cultural", "Cantidad"]],
    body: culturalGroupData,
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246], fontStyle: "bold" },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8 },
  })

  currentY = (doc as any).lastAutoTable.finalY + 15

  if (currentY > pageHeight - 60) {
    doc.addPage()
    currentY = 20
  }

  // Gráfico de grupos culturales (top 5)
  const topGroups = Object.entries(stats.byCulturalGroup)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  doc.setFontSize(10)
  doc.setFont("helvetica", "italic")
  doc.text("Top 5 Grupos Culturales:", 14, currentY)
  currentY += 7

  const maxCultural = Math.max(...topGroups.map(([, count]) => count))
  const colors = [
    [59, 130, 246],
    [16, 185, 129],
    [245, 158, 11],
    [239, 68, 68],
    [168, 85, 247],
  ]

  topGroups.forEach(([group, count], index) => {
    const barWidthCultural = (count / maxCultural) * 100
    doc.setFillColor(...(colors[index] as [number, number, number]))
    doc.rect(14, currentY, barWidthCultural, 6, "F")

    // Truncar nombre si es muy largo
    const groupName = group.length > 40 ? group.substring(0, 37) + "..." : group
    doc.setFontSize(8)
    doc.text(`${groupName}: ${count}`, 120, currentY + 4)
    currentY += 9
  })

  currentY += 15

  // Nueva página para facultades
  doc.addPage()
  currentY = 20

  // 3. TABLA: Total de Participaciones por Facultad
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("3. TOTAL DE PARTICIPACIONES POR FACULTAD", 14, currentY)
  currentY += 7

  const facultyData = Object.entries(stats.byFaculty)
    .sort(([, a], [, b]) => b.total - a.total)
    .map(([faculty, data]) => [
      faculty,
      data.mujer.toString(),
      data.hombre.toString(),
      data.otro.toString(),
      data.total.toString(),
    ])

  autoTable(doc, {
    startY: currentY,
    head: [["Facultad", "Mujer", "Hombre", "Otro", "Total"]],
    body: facultyData,
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246], fontStyle: "bold" },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 7 },
  })

  currentY = (doc as any).lastAutoTable.finalY + 15

  if (currentY > pageHeight - 60) {
    doc.addPage()
    currentY = 20
  }

  // Gráfico de facultades (top 5)
  const topFaculties = Object.entries(stats.byFaculty)
    .sort(([, a], [, b]) => b.total - a.total)
    .slice(0, 5)

  doc.setFontSize(10)
  doc.setFont("helvetica", "italic")
  doc.text("Top 5 Facultades:", 14, currentY)
  currentY += 7

  const maxFaculty = Math.max(...topFaculties.map(([, data]) => data.total))

  topFaculties.forEach(([faculty, data], index) => {
    const barWidthFaculty = (data.total / maxFaculty) * 100
    doc.setFillColor(...(colors[index] as [number, number, number]))
    doc.rect(14, currentY, barWidthFaculty, 6, "F")

    const facultyName = faculty.length > 35 ? faculty.substring(0, 32) + "..." : faculty
    doc.setFontSize(8)
    doc.text(`${facultyName}: ${data.total}`, 120, currentY + 4)
    currentY += 9
  })

  // Nueva página para programas
  doc.addPage()
  currentY = 20

  // 4. TABLA: Total de Participaciones por Programa
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("4. TOTAL DE PARTICIPACIONES POR PROGRAMA", 14, currentY)
  currentY += 7

  const programData = Object.entries(stats.byProgram)
    .sort(([, a], [, b]) => b.total - a.total)
    .map(([program, data]) => [
      program,
      data.mujer.toString(),
      data.hombre.toString(),
      data.otro.toString(),
      data.total.toString(),
    ])

  autoTable(doc, {
    startY: currentY,
    head: [["Programa Académico", "Mujer", "Hombre", "Otro", "Total"]],
    body: programData,
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246], fontStyle: "bold" },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 6 },
  })

  currentY = (doc as any).lastAutoTable.finalY + 15

  if (currentY > pageHeight - 60) {
    doc.addPage()
    currentY = 20
  }

  // Gráfico de programas (top 5)
  const topPrograms = Object.entries(stats.byProgram)
    .sort(([, a], [, b]) => b.total - a.total)
    .slice(0, 5)

  doc.setFontSize(10)
  doc.setFont("helvetica", "italic")
  doc.text("Top 5 Programas Académicos:", 14, currentY)
  currentY += 7

  const maxProgram = Math.max(...topPrograms.map(([, data]) => data.total))

  topPrograms.forEach(([program, data], index) => {
    const barWidthProgram = (data.total / maxProgram) * 100
    doc.setFillColor(...(colors[index] as [number, number, number]))
    doc.rect(14, currentY, barWidthProgram, 6, "F")

    const programName = program.length > 35 ? program.substring(0, 32) + "..." : program
    doc.setFontSize(8)
    doc.text(`${programName}: ${data.total}`, 120, currentY + 4)
    currentY += 9
  })

  if (eventStats && eventStats.totalParticipants > 0) {
    doc.addPage()
    currentY = 20

    // Título para sección de eventos
    doc.setFontSize(18)
    doc.setFont("helvetica", "bold")
    doc.text("EVENTOS ESPECIALES", 14, currentY)
    currentY += 15

    // 5. TABLA: Total de Participaciones por Género (Eventos)
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("5. PARTICIPACIONES EN EVENTOS POR GÉNERO", 14, currentY)
    currentY += 7

    const eventGenderData = [
      ["Mujer", eventStats.byGender.mujer.toString()],
      ["Hombre", eventStats.byGender.hombre.toString()],
      ["Otro", eventStats.byGender.otro.toString()],
      ["TOTAL", eventStats.totalParticipants.toString()],
    ]

    autoTable(doc, {
      startY: currentY,
      head: [["Género", "Cantidad"]],
      body: eventGenderData,
      theme: "grid",
      headStyles: { fillColor: [168, 85, 247], fontStyle: "bold" },
      footStyles: { fillColor: [229, 231, 235], fontStyle: "bold" },
      margin: { left: 14, right: 14 },
    })

    currentY = (doc as any).lastAutoTable.finalY + 15

    // Gráfico de género para eventos
    const maxEventGender = Math.max(eventStats.byGender.mujer, eventStats.byGender.hombre, eventStats.byGender.otro)

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")

    // Barra Mujer
    const eventMujerBarWidth = (eventStats.byGender.mujer / maxEventGender) * barWidth
    doc.setFillColor(236, 72, 153)
    doc.rect(startX, currentY, eventMujerBarWidth, barHeight, "F")
    doc.text(`Mujer: ${eventStats.byGender.mujer}`, startX + barWidth + 5, currentY + 6)

    currentY += 12

    // Barra Hombre
    const eventHombreBarWidth = (eventStats.byGender.hombre / maxEventGender) * barWidth
    doc.setFillColor(59, 130, 246)
    doc.rect(startX, currentY, eventHombreBarWidth, barHeight, "F")
    doc.text(`Hombre: ${eventStats.byGender.hombre}`, startX + barWidth + 5, currentY + 6)

    currentY += 12

    // Barra Otro
    const eventOtroBarWidth = (eventStats.byGender.otro / maxEventGender) * barWidth
    doc.setFillColor(168, 85, 247)
    doc.rect(startX, currentY, eventOtroBarWidth, barHeight, "F")
    doc.text(`Otro: ${eventStats.byGender.otro}`, startX + barWidth + 5, currentY + 6)

    currentY += 20

    if (currentY > pageHeight - 60) {
      doc.addPage()
      currentY = 20
    }

    // 6. TABLA: Participaciones por Evento
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("6. PARTICIPACIONES POR EVENTO", 14, currentY)
    currentY += 7

    const eventData = Object.entries(eventStats.byEvent)
      .sort(([, a], [, b]) => b - a)
      .map(([event, count]) => [event, count.toString()])

    autoTable(doc, {
      startY: currentY,
      head: [["Evento", "Cantidad"]],
      body: eventData,
      theme: "grid",
      headStyles: { fillColor: [168, 85, 247], fontStyle: "bold" },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 8 },
    })

    currentY = (doc as any).lastAutoTable.finalY + 15

    if (currentY > pageHeight - 60) {
      doc.addPage()
      currentY = 20
    }

    // Gráfico de eventos
    const topEvents = Object.entries(eventStats.byEvent)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)

    doc.setFontSize(10)
    doc.setFont("helvetica", "italic")
    doc.text("Top 5 Eventos:", 14, currentY)
    currentY += 7

    const maxEvent = Math.max(...topEvents.map(([, count]) => count))

    topEvents.forEach(([event, count], index) => {
      const barWidthEvent = (count / maxEvent) * 100
      doc.setFillColor(...(colors[index] as [number, number, number]))
      doc.rect(14, currentY, barWidthEvent, 6, "F")

      const eventName = event.length > 40 ? event.substring(0, 37) + "..." : event
      doc.setFontSize(8)
      doc.text(`${eventName}: ${count}`, 120, currentY + 4)
      currentY += 9
    })

    // Nueva página para eventos por facultad
    doc.addPage()
    currentY = 20

    // 7. TABLA: Participaciones en eventos por Facultad
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("7. PARTICIPACIONES EN EVENTOS POR FACULTAD", 14, currentY)
    currentY += 7

    const eventFacultyData = Object.entries(eventStats.byFaculty)
      .sort(([, a], [, b]) => b.total - a.total)
      .map(([faculty, data]) => [
        faculty,
        data.mujer.toString(),
        data.hombre.toString(),
        data.otro.toString(),
        data.total.toString(),
      ])

    autoTable(doc, {
      startY: currentY,
      head: [["Facultad", "Mujer", "Hombre", "Otro", "Total"]],
      body: eventFacultyData,
      theme: "grid",
      headStyles: { fillColor: [168, 85, 247], fontStyle: "bold" },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 7 },
    })

    currentY = (doc as any).lastAutoTable.finalY + 15

    if (currentY > pageHeight - 60) {
      doc.addPage()
      currentY = 20
    }

    // Gráfico de facultades para eventos (top 5)
    const topEventFaculties = Object.entries(eventStats.byFaculty)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, 5)

    doc.setFontSize(10)
    doc.setFont("helvetica", "italic")
    doc.text("Top 5 Facultades en Eventos:", 14, currentY)
    currentY += 7

    const maxEventFaculty = Math.max(...topEventFaculties.map(([, data]) => data.total))

    topEventFaculties.forEach(([faculty, data], index) => {
      const barWidthEventFaculty = (data.total / maxEventFaculty) * 100
      doc.setFillColor(...(colors[index] as [number, number, number]))
      doc.rect(14, currentY, barWidthEventFaculty, 6, "F")

      const facultyName = faculty.length > 35 ? faculty.substring(0, 32) + "..." : faculty
      doc.setFontSize(8)
      doc.text(`${facultyName}: ${data.total}`, 120, currentY + 4)
      currentY += 9
    })

    // Nueva página para eventos por programa
    doc.addPage()
    currentY = 20

    // 8. TABLA: Participaciones en eventos por Programa
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("8. PARTICIPACIONES EN EVENTOS POR PROGRAMA", 14, currentY)
    currentY += 7

    const eventProgramData = Object.entries(eventStats.byProgram)
      .sort(([, a], [, b]) => b.total - a.total)
      .map(([program, data]) => [
        program,
        data.mujer.toString(),
        data.hombre.toString(),
        data.otro.toString(),
        data.total.toString(),
      ])

    autoTable(doc, {
      startY: currentY,
      head: [["Programa Académico", "Mujer", "Hombre", "Otro", "Total"]],
      body: eventProgramData,
      theme: "grid",
      headStyles: { fillColor: [168, 85, 247], fontStyle: "bold" },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 6 },
    })

    currentY = (doc as any).lastAutoTable.finalY + 15

    if (currentY > pageHeight - 60) {
      doc.addPage()
      currentY = 20
    }

    // Gráfico de programas para eventos (top 5)
    const topEventPrograms = Object.entries(eventStats.byProgram)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, 5)

    doc.setFontSize(10)
    doc.setFont("helvetica", "italic")
    doc.text("Top 5 Programas en Eventos:", 14, currentY)
    currentY += 7

    const maxEventProgram = Math.max(...topEventPrograms.map(([, data]) => data.total))

    topEventPrograms.forEach(([program, data], index) => {
      const barWidthEventProgram = (data.total / maxEventProgram) * 100
      doc.setFillColor(...(colors[index] as [number, number, number]))
      doc.rect(14, currentY, barWidthEventProgram, 6, "F")

      const programName = program.length > 35 ? program.substring(0, 32) + "..." : program
      doc.setFontSize(8)
      doc.text(`${programName}: ${data.total}`, 120, currentY + 4)
      currentY += 9
    })
  }

  // Pie de página en todas las páginas
  const totalPages = doc.internal.pages.length - 1
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont("helvetica", "italic")
    doc.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: "center" })
  }

  // Guardar el PDF
  const fileName = `Informe_Asistencia_${new Date().toISOString().split("T")[0]}.pdf`
  doc.save(fileName)
}

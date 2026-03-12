/**
 * Combined Reports System
 * 
 * Generates reports that combine data from both Cultura and Deporte areas
 * for Super Admin users.
 * 
 * Feature: sistema-multi-area
 * Task: 19 - Implementar sistema de reportes combinados
 * Requirements: 9.2, 9.3, 9.4, 9.5
 */

import { getAttendanceRecords, getAllUsers } from './db-router'
import type { Area } from './firebase-config'
import type { AttendanceStats } from './types'

export interface CombinedStats {
  cultura: AttendanceStats
  deporte: AttendanceStats
  combined: {
    totalParticipants: number
    totalCultura: number
    totalDeporte: number
    byGender: {
      mujer: number
      hombre: number
      otro: number
    }
  }
}

/**
 * Generate combined report from both areas
 */
export async function generateCombinedReport(): Promise<CombinedStats> {
  try {
    console.log('[Reports] Generating combined report...')
    
    // Fetch data from both areas
    const [culturaRecords, deporteRecords] = await Promise.all([
      getAttendanceRecords('cultura'),
      getAttendanceRecords('deporte')
    ])
    
    console.log(`[Reports] Cultura: ${culturaRecords.length} records`)
    console.log(`[Reports] Deporte: ${deporteRecords.length} records`)
    
    // Generate stats for each area
    const culturaStats = generateStatsFromRecords(culturaRecords)
    const deporteStats = generateStatsFromRecords(deporteRecords)
    
    // Calculate combined totals
    const combined = {
      totalParticipants: culturaStats.totalParticipants + deporteStats.totalParticipants,
      totalCultura: culturaStats.totalParticipants,
      totalDeporte: deporteStats.totalParticipants,
      byGender: {
        mujer: culturaStats.byGender.mujer + deporteStats.byGender.mujer,
        hombre: culturaStats.byGender.hombre + deporteStats.byGender.hombre,
        otro: culturaStats.byGender.otro + deporteStats.byGender.otro,
      }
    }
    
    console.log('[Reports] Combined report generated successfully')
    
    return {
      cultura: culturaStats,
      deporte: deporteStats,
      combined
    }
  } catch (error) {
    console.error('[Reports] Error generating combined report:', error)
    throw error
  }
}

/**
 * Helper function to generate stats from attendance records
 */
function generateStatsFromRecords(records: any[]): AttendanceStats {
  const stats: AttendanceStats = {
    totalParticipants: records.length,
    byGender: {
      mujer: 0,
      hombre: 0,
      otro: 0,
    },
    byProgram: {},
    byFaculty: {},
    byCulturalGroup: {},
    byMonth: {},
  }

  records.forEach((record) => {
    // Gender stats
    const gender = record.genero.toLowerCase() as "mujer" | "hombre" | "otro"
    stats.byGender[gender]++

    // Program stats
    if (record.programaAcademico) {
      if (!stats.byProgram[record.programaAcademico]) {
        stats.byProgram[record.programaAcademico] = {
          mujer: 0,
          hombre: 0,
          otro: 0,
          total: 0,
        }
      }
      stats.byProgram[record.programaAcademico][gender]++
      stats.byProgram[record.programaAcademico].total++
    }

    // Faculty stats
    if (record.facultad) {
      if (!stats.byFaculty[record.facultad]) {
        stats.byFaculty[record.facultad] = {
          mujer: 0,
          hombre: 0,
          otro: 0,
          total: 0,
        }
      }
      stats.byFaculty[record.facultad][gender]++
      stats.byFaculty[record.facultad].total++
    }

    // Group stats
    if (!stats.byCulturalGroup[record.grupoCultural]) {
      stats.byCulturalGroup[record.grupoCultural] = 0
    }
    stats.byCulturalGroup[record.grupoCultural]++

    // Month stats
    const monthKey = record.timestamp.toISOString().slice(0, 7)
    if (!stats.byMonth[monthKey]) {
      stats.byMonth[monthKey] = {}
    }
    if (!stats.byMonth[monthKey][record.grupoCultural]) {
      stats.byMonth[monthKey][record.grupoCultural] = 0
    }
    stats.byMonth[monthKey][record.grupoCultural]++
  })

  return stats
}

/**
 * Generate PDF report with combined data
 * Includes metrics separated by area and combined totals
 * Requirements: 9.4, 9.5
 */
export async function generateCombinedReportPDF(stats: CombinedStats): Promise<void> {
  console.log('[Reports] Generating combined PDF report...')
  
  try {
    // Dynamic import to avoid SSR issues
    const jsPDF = (await import('jspdf')).default
    const autoTable = (await import('jspdf-autotable')).default
    
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    let yPosition = 20
    
    // Title
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('Reporte Combinado - Universidad del Valle', pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 10
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-CO')}`, pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 15
    
    // Combined Totals Section
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Totales Combinados', 14, yPosition)
    yPosition += 8
    
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Métrica', 'Valor']],
      body: [
        ['Total Participantes', stats.combined.totalParticipants.toString()],
        ['Total Cultura', stats.combined.totalCultura.toString()],
        ['Total Deporte', stats.combined.totalDeporte.toString()],
        ['Mujeres', stats.combined.byGender.mujer.toString()],
        ['Hombres', stats.combined.byGender.hombre.toString()],
        ['Otro', stats.combined.byGender.otro.toString()],
      ],
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      margin: { left: 14 },
    })
    
    yPosition = (doc as any).lastAutoTable.finalY + 15
    
    // Cultura Section
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Área de Cultura', 14, yPosition)
    yPosition += 8
    
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Métrica', 'Valor']],
      body: [
        ['Total Participantes', stats.cultura.totalParticipants.toString()],
        ['Mujeres', stats.cultura.byGender.mujer.toString()],
        ['Hombres', stats.cultura.byGender.hombre.toString()],
        ['Otro', stats.cultura.byGender.otro.toString()],
      ],
      theme: 'grid',
      headStyles: { fillColor: [52, 152, 219] },
      margin: { left: 14 },
    })
    
    yPosition = (doc as any).lastAutoTable.finalY + 10
    
    // Top 5 Cultural Groups
    const culturaGroups = Object.entries(stats.cultura.byCulturalGroup)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
    
    if (culturaGroups.length > 0) {
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('Top 5 Grupos Culturales', 14, yPosition)
      yPosition += 5
      
      autoTable(doc, {
        startY: yPosition,
        head: [['Grupo', 'Participantes']],
        body: culturaGroups.map(([group, count]) => [group, count.toString()]),
        theme: 'striped',
        headStyles: { fillColor: [52, 152, 219] },
        margin: { left: 14 },
      })
      
      yPosition = (doc as any).lastAutoTable.finalY + 15
    }
    
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
    }
    
    // Deporte Section
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Área de Deporte', 14, yPosition)
    yPosition += 8
    
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Métrica', 'Valor']],
      body: [
        ['Total Participantes', stats.deporte.totalParticipants.toString()],
        ['Mujeres', stats.deporte.byGender.mujer.toString()],
        ['Hombres', stats.deporte.byGender.hombre.toString()],
        ['Otro', stats.deporte.byGender.otro.toString()],
      ],
      theme: 'grid',
      headStyles: { fillColor: [46, 204, 113] },
      margin: { left: 14 },
    })
    
    yPosition = (doc as any).lastAutoTable.finalY + 10
    
    // Top 5 Sports Groups
    const deporteGroups = Object.entries(stats.deporte.byCulturalGroup)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
    
    if (deporteGroups.length > 0) {
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('Top 5 Grupos Deportivos', 14, yPosition)
      yPosition += 5
      
      autoTable(doc, {
        startY: yPosition,
        head: [['Grupo', 'Participantes']],
        body: deporteGroups.map(([group, count]) => [group, count.toString()]),
        theme: 'striped',
        headStyles: { fillColor: [46, 204, 113] },
        margin: { left: 14 },
      })
    }
    
    // Save the PDF
    const fileName = `reporte-combinado-${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(fileName)
    
    console.log('[Reports] PDF generated successfully:', fileName)
  } catch (error) {
    console.error('[Reports] Error generating PDF:', error)
    throw error
  }
}

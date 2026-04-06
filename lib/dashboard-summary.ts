import type { AttendanceRecord } from './types'
import type { CulturalGroup } from './db-router'

export interface DashboardSummary {
  totalAsistencias: number
  participantesUnicos: number
  gruposActivos: number
  asistenciasMesActual: number
  asistenciasMesAnterior: number
  porGenero: {
    mujer: number
    hombre: number
    otro: number
  }
  porEstamento: Record<string, number>
  top5Grupos: Array<{ nombre: string; total: number }>
  gruposBajos: Array<{ nombre: string; total: number }>
  tendencia6Meses: Array<{ mes: string; total: number }>
}

function sameYearMonth(date: Date, year: number, month: number): boolean {
  return date.getFullYear() === year && date.getMonth() === month
}

export function computeDashboardSummary(
  records: AttendanceRecord[],
  groups: CulturalGroup[],
  now: Date = new Date()
): DashboardSummary {
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  const prevDate = new Date(currentYear, currentMonth - 1, 1)
  const prevYear = prevDate.getFullYear()
  const prevMonth = prevDate.getMonth()

  // Basic counts
  const totalAsistencias = records.length
  const participantesUnicos = new Set(records.map(r => r.numeroDocumento)).size
  const gruposActivos = groups.length

  // Monthly counts
  const asistenciasMesActual = records.filter(r =>
    sameYearMonth(new Date(r.timestamp), currentYear, currentMonth)
  ).length

  const asistenciasMesAnterior = records.filter(r =>
    sameYearMonth(new Date(r.timestamp), prevYear, prevMonth)
  ).length

  // By gender
  const porGenero = { mujer: 0, hombre: 0, otro: 0 }
  for (const r of records) {
    const g = r.genero.toLowerCase()
    if (g === 'mujer') porGenero.mujer++
    else if (g === 'hombre') porGenero.hombre++
    else porGenero.otro++
  }

  // By estamento
  const porEstamento: Record<string, number> = {}
  for (const r of records) {
    porEstamento[r.estamento] = (porEstamento[r.estamento] ?? 0) + 1
  }

  // Top 5 groups (all time)
  const groupTotals: Record<string, number> = {}
  for (const r of records) {
    groupTotals[r.grupoCultural] = (groupTotals[r.grupoCultural] ?? 0) + 1
  }
  const top5Grupos = Object.entries(groupTotals)
    .map(([nombre, total]) => ({ nombre, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  // Low groups (current month)
  const monthGroupTotals: Record<string, number> = {}
  for (const r of records) {
    if (sameYearMonth(new Date(r.timestamp), currentYear, currentMonth)) {
      monthGroupTotals[r.grupoCultural] = (monthGroupTotals[r.grupoCultural] ?? 0) + 1
    }
  }
  const gruposBajos = Object.entries(monthGroupTotals)
    .map(([nombre, total]) => ({ nombre, total }))
    .sort((a, b) => a.total - b.total)
    .slice(0, 5)

  // Trend: last 6 months including current
  const tendencia6Meses: Array<{ mes: string; total: number }> = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - i, 1)
    const y = d.getFullYear()
    const m = d.getMonth()
    const mes = `${y}-${String(m + 1).padStart(2, '0')}`
    const total = records.filter(r => sameYearMonth(new Date(r.timestamp), y, m)).length
    tendencia6Meses.push({ mes, total })
  }

  return {
    totalAsistencias,
    participantesUnicos,
    gruposActivos,
    asistenciasMesActual,
    asistenciasMesAnterior,
    porGenero,
    porEstamento,
    top5Grupos,
    gruposBajos,
    tendencia6Meses,
  }
}

import type { AttendanceRecord, AttendanceStats } from "./types"
import {
  getAttendanceRecords as getFirestoreRecords,
  generateStats as generateFirestoreStats,
  generateId as generateFirestoreId,
} from "./firestore"

const STORAGE_KEY = "cultural_attendance_records"

// Legacy function for backward compatibility - now uses Firestore
export async function saveAttendanceRecord(record: AttendanceRecord): Promise<void> {
  // This function is now deprecated - use saveUserProfile and saveAttendanceEntry instead
  console.warn("saveAttendanceRecord is deprecated. Use the new Firebase functions instead.")
}

export async function getAttendanceRecords(): Promise<AttendanceRecord[]> {
  try {
    // Try to get records from Firestore first
    return await getFirestoreRecords()
  } catch (error) {
    console.error("Error fetching from Firestore, falling back to localStorage:", error)

    // Fallback to localStorage
    if (typeof window === "undefined") return []

    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []

    try {
      const records = JSON.parse(stored)
      return records.map((record: any) => ({
        ...record,
        timestamp: new Date(record.timestamp),
      }))
    } catch {
      return []
    }
  }
}

export async function generateStats(): Promise<AttendanceStats> {
  try {
    // Try to generate stats from Firestore first
    return await generateFirestoreStats()
  } catch (error) {
    console.error("Error generating stats from Firestore, falling back to localStorage:", error)

    // Fallback to localStorage logic
    const records = await getAttendanceRecords()

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
      // Estadísticas por género
      const gender = record.genero.toLowerCase() as "mujer" | "hombre" | "otro"
      stats.byGender[gender]++

      // Estadísticas por programa académico
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

      // Estadísticas por facultad
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

      // Estadísticas por grupo cultural
      if (!stats.byCulturalGroup[record.grupoCultural]) {
        stats.byCulturalGroup[record.grupoCultural] = 0
      }
      stats.byCulturalGroup[record.grupoCultural]++

      // Estadísticas por mes
      const monthKey = record.timestamp.toISOString().slice(0, 7) // YYYY-MM
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
}

export function generateId(): string {
  return generateFirestoreId()
}

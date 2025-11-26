import type { EventStats, UserProfile, EventAttendanceEntry } from "./types"

// Generar estadísticas de eventos desde los registros
export function generateEventStats(eventRecords: { entry: EventAttendanceEntry; user: UserProfile }[]): EventStats {
  const stats: EventStats = {
    totalParticipants: eventRecords.length,
    byGender: { mujer: 0, hombre: 0, otro: 0 },
    byProgram: {},
    byFaculty: {},
    byEvent: {},
  }

  eventRecords.forEach(({ user }) => {
    const gender = user.genero.toLowerCase() as "mujer" | "hombre" | "otro"
    stats.byGender[gender]++

    if (user.programaAcademico) {
      if (!stats.byProgram[user.programaAcademico]) {
        stats.byProgram[user.programaAcademico] = { mujer: 0, hombre: 0, otro: 0, total: 0 }
      }
      stats.byProgram[user.programaAcademico][gender]++
      stats.byProgram[user.programaAcademico].total++
    }

    if (user.facultad) {
      if (!stats.byFaculty[user.facultad]) {
        stats.byFaculty[user.facultad] = { mujer: 0, hombre: 0, otro: 0, total: 0 }
      }
      stats.byFaculty[user.facultad][gender]++
      stats.byFaculty[user.facultad].total++
    }
  })

  return stats
}

import { collection, getDocs } from "firebase/firestore"
import { db } from "./firebase"
import type { EventAttendanceEntry, UserProfile } from "./types"

const USERS_COLLECTION = "user_profiles"
const EVENT_ATTENDANCE_COLLECTION = "event_attendance_records"

// Convert Firestore timestamp to Date
function timestampToDate(timestamp: any): Date {
  if (timestamp?.toDate) {
    return timestamp.toDate()
  }
  return new Date(timestamp)
}

// Obtener todos los registros de asistencia a eventos con información del usuario
export async function getEventAttendanceRecords(): Promise<{ entry: EventAttendanceEntry; user: UserProfile }[]> {
  try {
    const usersRef = collection(db, USERS_COLLECTION)
    const eventAttendanceRef = collection(db, EVENT_ATTENDANCE_COLLECTION)

    const [usersSnapshot, eventAttendanceSnapshot] = await Promise.all([getDocs(usersRef), getDocs(eventAttendanceRef)])

    // Crear mapa de usuarios
    const users = new Map<string, UserProfile>()
    usersSnapshot.forEach((doc) => {
      const userData = doc.data()
      users.set(doc.id, {
        id: doc.id,
        ...userData,
        createdAt: timestampToDate(userData.createdAt),
        lastAttendance: timestampToDate(userData.lastAttendance),
      } as UserProfile)
    })

    // Combinar asistencias con información del usuario
    const records: { entry: EventAttendanceEntry; user: UserProfile }[] = []
    eventAttendanceSnapshot.forEach((doc) => {
      const entryData = doc.data()
      const user = users.get(entryData.userId)

      if (user) {
        records.push({
          entry: {
            id: doc.id,
            userId: entryData.userId,
            eventId: entryData.eventId,
            timestamp: timestampToDate(entryData.timestamp),
          },
          user,
        })
      }
    })

    return records.sort((a, b) => b.entry.timestamp.getTime() - a.entry.timestamp.getTime())
  } catch (error) {
    console.error("[v0] Error getting event attendance records:", error)
    return []
  }
}

export type { EventAttendanceEntry, UserProfile }

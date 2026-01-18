import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore"
import { db } from "./firebase"
import type {
  AttendanceRecord,
  UserProfile,
  AttendanceEntry,
  AttendanceStats,
  SimilarUser,
  GroupTracking,
  Event,
  EventAttendanceEntry,
  EventStats,
  GroupEnrollment,
  GroupWithEnrollments,
} from "./types"

// Collections
const USERS_COLLECTION = "user_profiles"
const ATTENDANCE_COLLECTION = "attendance_records"
const EVENTS_COLLECTION = "events"
const EVENT_ATTENDANCE_COLLECTION = "event_attendance_records"
const GROUP_ENROLLMENTS_COLLECTION = "group_enrollments"

// Convert Firestore timestamp to Date
function timestampToDate(timestamp: any): Date {
  if (timestamp?.toDate) {
    return timestamp.toDate()
  }
  return new Date(timestamp)
}

function filterUndefinedValues(obj: any): any {
  const filtered: any = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      filtered[key] = value
    }
  }
  return filtered
}

// Save user profile
export async function saveUserProfile(
  profile: Omit<UserProfile, "id" | "createdAt" | "lastAttendance">,
): Promise<string> {
  try {
    const userProfile: Omit<UserProfile, "id"> = {
      ...profile,
      createdAt: new Date(),
      lastAttendance: new Date(),
    }

    const cleanProfile = filterUndefinedValues(userProfile)

    console.log("[v0] Attempting to save user profile to collection:", USERS_COLLECTION)
    console.log("[v0] Profile data:", cleanProfile)
    const docRef = await addDoc(collection(db, USERS_COLLECTION), cleanProfile)
    console.log("[v0] User profile saved with ID:", docRef.id)
    return docRef.id
  } catch (error) {
    console.error("[v0] Error in saveUserProfile:", error)
    throw error
  }
}

// Save attendance entry
export async function saveAttendanceEntry(userId: string, grupoCultural: string): Promise<void> {
  try {
    const attendanceEntry: Omit<AttendanceEntry, "id"> = {
      userId,
      grupoCultural,
      timestamp: new Date(),
    }

    console.log("[v0] Attempting to save attendance entry to collection:", ATTENDANCE_COLLECTION)
    console.log("[v0] Attendance data:", attendanceEntry)
    await addDoc(collection(db, ATTENDANCE_COLLECTION), attendanceEntry)
    console.log("[v0] Attendance entry saved successfully")

    // Update user's last attendance
    console.log("[v0] Updating user's last attendance for user:", userId)
    const userRef = doc(db, USERS_COLLECTION, userId)
    await updateDoc(userRef, {
      lastAttendance: new Date(),
    })
    console.log("[v0] User's last attendance updated successfully")
  } catch (error) {
    console.error("[v0] Error in saveAttendanceEntry:", error)
    throw error
  }
}

// Find similar users for recognition system
export async function findSimilarUsers(
  nombres: string,
  correo: string,
  numeroDocumento: string,
  telefono: string,
): Promise<SimilarUser[]> {
  const usersRef = collection(db, USERS_COLLECTION)
  const snapshot = await getDocs(usersRef)

  const similarUsers: SimilarUser[] = []

  snapshot.forEach((doc) => {
    const user = { id: doc.id, ...doc.data() } as UserProfile
    user.createdAt = timestampToDate(user.createdAt)
    user.lastAttendance = timestampToDate(user.lastAttendance)

    const matchingFields: string[] = []
    let similarity = 0

    // Check exact matches
    if (user.numeroDocumento === numeroDocumento) {
      matchingFields.push("documento")
      similarity += 40
    }

    if (user.correo.toLowerCase() === correo.toLowerCase()) {
      matchingFields.push("correo")
      similarity += 30
    }

    if (user.telefono === telefono) {
      matchingFields.push("telefono")
      similarity += 20
    }

    // Check name similarity (simple approach)
    const userNames = user.nombres.toLowerCase().split(" ")
    const inputNames = nombres.toLowerCase().split(" ")
    const nameMatches = userNames.filter((name) => inputNames.includes(name))

    if (nameMatches.length > 0) {
      matchingFields.push("nombres")
      similarity += (nameMatches.length / Math.max(userNames.length, inputNames.length)) * 10
    }

    if (similarity >= 30) {
      // Threshold for considering a match
      similarUsers.push({
        user,
        similarity,
        matchingFields,
      })
    }
  })

  return similarUsers.sort((a, b) => b.similarity - a.similarity).slice(0, 3)
}

// Get user by ID
export async function getUserById(userId: string): Promise<UserProfile | null> {
  const userRef = doc(db, USERS_COLLECTION, userId)
  const userSnap = await getDoc(userRef)

  if (userSnap.exists()) {
    const userData = userSnap.data()
    return {
      id: userSnap.id,
      ...userData,
      createdAt: timestampToDate(userData.createdAt),
      lastAttendance: timestampToDate(userData.lastAttendance),
    } as UserProfile
  }

  return null
}

// Get all attendance records (for backward compatibility)
export async function getAttendanceRecords(): Promise<AttendanceRecord[]> {
  const usersRef = collection(db, USERS_COLLECTION)
  const attendanceRef = collection(db, ATTENDANCE_COLLECTION)

  const [usersSnapshot, attendanceSnapshot] = await Promise.all([getDocs(usersRef), getDocs(attendanceRef)])

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

  const records: AttendanceRecord[] = []
  attendanceSnapshot.forEach((doc) => {
    const attendanceData = doc.data()
    const user = users.get(attendanceData.userId)

    if (user) {
      records.push({
        id: doc.id,
        timestamp: timestampToDate(attendanceData.timestamp),
        nombres: user.nombres,
        correo: user.correo,
        genero: user.genero,
        etnia: user.etnia,
        tipoDocumento: user.tipoDocumento,
        numeroDocumento: user.numeroDocumento,
        edad: user.edad,
        telefono: user.telefono,
        sede: user.sede,
        estamento: user.estamento,
        codigoEstudiante: user.codigoEstudiante,
        facultad: user.facultad,
        programaAcademico: user.programaAcademico,
        grupoCultural: attendanceData.grupoCultural,
      })
    }
  })

  return records.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

// Generate statistics
export async function generateStats(): Promise<AttendanceStats> {
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

// Get group tracking data
export async function getGroupTracking(): Promise<GroupTracking[]> {
  const usersRef = collection(db, USERS_COLLECTION)
  const attendanceRef = collection(db, ATTENDANCE_COLLECTION)

  const [usersSnapshot, attendanceSnapshot] = await Promise.all([getDocs(usersRef), getDocs(attendanceRef)])

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

  const groupData = new Map<string, Map<string, { count: number; monthlyCount: number; lastAttendance: Date }>>()
  const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM

  attendanceSnapshot.forEach((doc) => {
    const attendanceData = doc.data()
    const timestamp = timestampToDate(attendanceData.timestamp)
    const monthKey = timestamp.toISOString().slice(0, 7)

    if (!groupData.has(attendanceData.grupoCultural)) {
      groupData.set(attendanceData.grupoCultural, new Map())
    }

    const group = groupData.get(attendanceData.grupoCultural)!
    if (!group.has(attendanceData.userId)) {
      group.set(attendanceData.userId, { count: 0, monthlyCount: 0, lastAttendance: timestamp })
    }

    const userStats = group.get(attendanceData.userId)!
    userStats.count++
    if (monthKey === currentMonth) {
      userStats.monthlyCount++
    }
    if (timestamp > userStats.lastAttendance) {
      userStats.lastAttendance = timestamp
    }
  })

  const result: GroupTracking[] = []
  groupData.forEach((participants, groupName) => {
    const participantsList = Array.from(participants.entries())
      .map(([userId, stats]) => {
        const user = users.get(userId)
        return {
          userId,
          userName: user?.nombres || "Usuario desconocido",
          monthlyCount: stats.monthlyCount,
          totalCount: stats.count,
          lastAttendance: stats.lastAttendance,
        }
      })
      .sort((a, b) => b.totalCount - a.totalCount)

    result.push({
      groupName,
      participants: participantsList,
    })
  })

  return result.sort((a, b) => a.groupName.localeCompare(b.groupName))
}

// Delete user function
export async function deleteUser(userId: string): Promise<void> {
  try {
    console.log("[v0] Starting user deletion process for user:", userId)

    // First, delete all attendance records for this user
    const attendanceRef = collection(db, ATTENDANCE_COLLECTION)
    const attendanceQuery = query(attendanceRef, where("userId", "==", userId))
    const attendanceSnapshot = await getDocs(attendanceQuery)

    console.log("[v0] Found", attendanceSnapshot.size, "attendance records to delete")

    // Delete all attendance records
    const deletePromises = attendanceSnapshot.docs.map((doc) => deleteDoc(doc.ref))
    await Promise.all(deletePromises)

    console.log("[v0] All attendance records deleted")

    // Then delete the user profile
    const userRef = doc(db, USERS_COLLECTION, userId)
    await deleteDoc(userRef)

    console.log("[v0] User profile deleted successfully")
  } catch (error) {
    console.error("[v0] Error deleting user:", error)
    throw error
  }
}

// Get all users function
export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const usersRef = collection(db, USERS_COLLECTION)
    const snapshot = await getDocs(usersRef)

    const users: UserProfile[] = []
    snapshot.forEach((doc) => {
      const userData = doc.data()
      users.push({
        id: doc.id,
        ...userData,
        createdAt: timestampToDate(userData.createdAt),
        lastAttendance: timestampToDate(userData.lastAttendance),
      } as UserProfile)
    })

    return users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch (error) {
    console.error("[v0] Error getting all users:", error)
    throw error
  }
}

// Crear evento
export async function createEvent(eventData: Omit<Event, "id" | "createdAt" | "activo">): Promise<string> {
  try {
    const event: Omit<Event, "id"> = {
      ...eventData,
      createdAt: new Date(),
      activo: true,
    }

    console.log("[v0] Creating event:", event)
    const docRef = await addDoc(collection(db, EVENTS_COLLECTION), event)
    console.log("[v0] Event created with ID:", docRef.id)
    return docRef.id
  } catch (error) {
    console.error("[v0] Error creating event:", error)
    throw error
  }
}

// Obtener todos los eventos
export async function getAllEvents(): Promise<Event[]> {
  try {
    const eventsRef = collection(db, EVENTS_COLLECTION)
    const snapshot = await getDocs(eventsRef)

    const events: Event[] = []
    snapshot.forEach((doc) => {
      const eventData = doc.data()
      events.push({
        id: doc.id,
        ...eventData,
        fechaApertura: timestampToDate(eventData.fechaApertura),
        fechaVencimiento: timestampToDate(eventData.fechaVencimiento),
        createdAt: timestampToDate(eventData.createdAt),
      } as Event)
    })

    return events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch (error) {
    console.error("[v0] Error getting events:", error)
    throw error
  }
}

// Obtener eventos activos
export async function getActiveEvents(): Promise<Event[]> {
  try {
    const allEvents = await getAllEvents()
    const now = new Date()

    return allEvents.filter(
      (event) => event.activo && new Date(event.fechaApertura) <= now && new Date(event.fechaVencimiento) >= now,
    )
  } catch (error) {
    console.error("[v0] Error getting active events:", error)
    throw error
  }
}

// Guardar asistencia a evento
export async function saveEventAttendance(userId: string, eventId: string): Promise<void> {
  try {
    const eventAttendance: Omit<EventAttendanceEntry, "id"> = {
      userId,
      eventId,
      timestamp: new Date(),
    }

    console.log("[v0] Saving event attendance:", eventAttendance)
    await addDoc(collection(db, EVENT_ATTENDANCE_COLLECTION), eventAttendance)
    console.log("[v0] Event attendance saved successfully")

    // Actualizar última asistencia del usuario
    const userRef = doc(db, USERS_COLLECTION, userId)
    await updateDoc(userRef, {
      lastAttendance: new Date(),
    })
  } catch (error) {
    console.error("[v0] Error saving event attendance:", error)
    throw error
  }
}

// Obtener estadísticas de eventos
export async function getEventStats(): Promise<EventStats> {
  try {
    const usersRef = collection(db, USERS_COLLECTION)
    const eventAttendanceRef = collection(db, EVENT_ATTENDANCE_COLLECTION)
    const eventsRef = collection(db, EVENTS_COLLECTION)

    const [usersSnapshot, eventAttendanceSnapshot, eventsSnapshot] = await Promise.all([
      getDocs(usersRef),
      getDocs(eventAttendanceRef),
      getDocs(eventsRef),
    ])

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

    const events = new Map<string, Event>()
    eventsSnapshot.forEach((doc) => {
      const eventData = doc.data()
      events.set(doc.id, {
        id: doc.id,
        ...eventData,
        fechaApertura: timestampToDate(eventData.fechaApertura),
        fechaVencimiento: timestampToDate(eventData.fechaVencimiento),
        createdAt: timestampToDate(eventData.createdAt),
      } as Event)
    })

    const stats: EventStats = {
      totalParticipants: 0,
      byGender: { mujer: 0, hombre: 0, otro: 0 },
      byProgram: {},
      byFaculty: {},
      byEvent: {},
    }

    eventAttendanceSnapshot.forEach((doc) => {
      const attendanceData = doc.data()
      const user = users.get(attendanceData.userId)
      const event = events.get(attendanceData.eventId)

      if (user && event) {
        stats.totalParticipants++

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

        if (!stats.byEvent[event.nombre]) {
          stats.byEvent[event.nombre] = 0
        }
        stats.byEvent[event.nombre]++
      }
    })

    return stats
  } catch (error) {
    console.error("[v0] Error getting event stats:", error)
    throw error
  }
}

// Eliminar evento
export async function deleteEvent(eventId: string): Promise<void> {
  try {
    console.log("[v0] Starting event deletion process for event:", eventId)

    // Primero eliminar todas las asistencias a este evento
    const eventAttendanceRef = collection(db, EVENT_ATTENDANCE_COLLECTION)
    const eventAttendanceQuery = query(eventAttendanceRef, where("eventId", "==", eventId))
    const eventAttendanceSnapshot = await getDocs(eventAttendanceQuery)

    console.log("[v0] Found", eventAttendanceSnapshot.size, "event attendance records to delete")

    const deletePromises = eventAttendanceSnapshot.docs.map((doc) => deleteDoc(doc.ref))
    await Promise.all(deletePromises)

    console.log("[v0] All event attendance records deleted")

    // Luego eliminar el evento
    const eventRef = doc(db, EVENTS_COLLECTION, eventId)
    await deleteDoc(eventRef)

    console.log("[v0] Event deleted successfully")
  } catch (error) {
    console.error("[v0] Error deleting event:", error)
    throw error
  }
}

// Alternar estado activo de evento
export async function toggleEventActive(eventId: string, activo: boolean): Promise<void> {
  try {
    const eventRef = doc(db, EVENTS_COLLECTION, eventId)
    await updateDoc(eventRef, { activo })
    console.log("[v0] Event active status updated:", activo)
  } catch (error) {
    console.error("[v0] Error toggling event active:", error)
    throw error
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// ==================== FUNCIONES DE INSCRIPCIÓN A GRUPOS ====================

// Inscribir usuario a un grupo cultural
export async function enrollUserToGroup(userId: string, grupoCultural: string): Promise<string> {
  try {
    // Verificar si ya está inscrito
    const existingEnrollment = await getUserEnrollments(userId)
    if (existingEnrollment.some(e => e.grupoCultural === grupoCultural)) {
      throw new Error("El usuario ya está inscrito en este grupo")
    }

    const enrollment: Omit<GroupEnrollment, "id"> = {
      userId,
      grupoCultural,
      fechaInscripcion: new Date(),
    }

    console.log("[v0] Enrolling user to group:", enrollment)
    const docRef = await addDoc(collection(db, GROUP_ENROLLMENTS_COLLECTION), enrollment)
    console.log("[v0] User enrolled with ID:", docRef.id)
    return docRef.id
  } catch (error) {
    console.error("[v0] Error enrolling user to group:", error)
    throw error
  }
}

// Obtener inscripciones de un usuario
export async function getUserEnrollments(userId: string): Promise<GroupEnrollment[]> {
  try {
    const enrollmentsRef = collection(db, GROUP_ENROLLMENTS_COLLECTION)
    const enrollmentQuery = query(enrollmentsRef, where("userId", "==", userId))
    const snapshot = await getDocs(enrollmentQuery)

    const enrollments: GroupEnrollment[] = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      enrollments.push({
        id: doc.id,
        userId: data.userId,
        grupoCultural: data.grupoCultural,
        fechaInscripcion: timestampToDate(data.fechaInscripcion),
      })
    })

    return enrollments
  } catch (error) {
    console.error("[v0] Error getting user enrollments:", error)
    throw error
  }
}

// Obtener todos los grupos con cantidad de inscritos
export async function getAllGroupsWithEnrollments(): Promise<GroupWithEnrollments[]> {
  try {
    const enrollmentsRef = collection(db, GROUP_ENROLLMENTS_COLLECTION)
    const snapshot = await getDocs(enrollmentsRef)

    const groupCounts = new Map<string, number>()
    snapshot.forEach((doc) => {
      const data = doc.data()
      const current = groupCounts.get(data.grupoCultural) || 0
      groupCounts.set(data.grupoCultural, current + 1)
    })

    const groups: GroupWithEnrollments[] = Array.from(groupCounts.entries()).map(([nombre, totalInscritos]) => ({
      nombre,
      totalInscritos,
    }))

    return groups.sort((a, b) => a.nombre.localeCompare(b.nombre))
  } catch (error) {
    console.error("[v0] Error getting groups with enrollments:", error)
    throw error
  }
}

// Obtener usuarios inscritos en un grupo específico
export async function getGroupEnrolledUsers(grupoCultural: string): Promise<(UserProfile & { fechaInscripcion: Date })[]> {
  try {
    const enrollmentsRef = collection(db, GROUP_ENROLLMENTS_COLLECTION)
    const enrollmentQuery = query(enrollmentsRef, where("grupoCultural", "==", grupoCultural))
    const enrollmentsSnapshot = await getDocs(enrollmentQuery)

    const usersRef = collection(db, USERS_COLLECTION)
    const usersSnapshot = await getDocs(usersRef)

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

    const enrolledUsers: (UserProfile & { fechaInscripcion: Date })[] = []
    enrollmentsSnapshot.forEach((doc) => {
      const data = doc.data()
      const user = users.get(data.userId)
      if (user) {
        enrolledUsers.push({
          ...user,
          fechaInscripcion: timestampToDate(data.fechaInscripcion),
        })
      }
    })

    return enrolledUsers.sort((a, b) => a.nombres.localeCompare(b.nombres))
  } catch (error) {
    console.error("[v0] Error getting group enrolled users:", error)
    throw error
  }
}

// Eliminar inscripción de usuario a grupo
export async function removeUserFromGroup(userId: string, grupoCultural: string): Promise<void> {
  try {
    const enrollmentsRef = collection(db, GROUP_ENROLLMENTS_COLLECTION)
    const enrollmentQuery = query(
      enrollmentsRef, 
      where("userId", "==", userId),
      where("grupoCultural", "==", grupoCultural)
    )
    const snapshot = await getDocs(enrollmentQuery)

    const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref))
    await Promise.all(deletePromises)

    console.log("[v0] User removed from group successfully")
  } catch (error) {
    console.error("[v0] Error removing user from group:", error)
    throw error
  }
}

// Verificar si usuario está inscrito en algún grupo
export async function isUserEnrolledInAnyGroup(userId: string): Promise<boolean> {
  try {
    const enrollments = await getUserEnrollments(userId)
    return enrollments.length > 0
  } catch (error) {
    console.error("[v0] Error checking user enrollment:", error)
    return false
  }
}

import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore"
import { db } from "./firebase"
import type {
  AttendanceRecord,
  UserProfile,
  AttendanceEntry,
  AttendanceStats,
  SimilarUser,
  GroupTracking,
} from "./types"

// Collections
const USERS_COLLECTION = "user_profiles"
const ATTENDANCE_COLLECTION = "attendance_records"

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

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

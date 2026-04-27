import { collection, addDoc, getDocs, doc, getDoc, updateDoc, Timestamp, serverTimestamp, query, where, setDoc, deleteDoc, writeBatch } from "firebase/firestore"
import { getFirestoreForArea, type Area } from './firebase-config'
import { GRUPOS_DEPORTIVOS } from './deporte-groups'
import { 
  logCrossAreaAccess, 
  logRoutingError, 
  logTransaction,
  logDataIsolationViolation 
} from './logger'
import type {
  AttendanceRecord,
  UserProfile,
  Event,
} from "./types"

// CulturalGroup interface (from firestore.ts)
export interface CulturalGroup {
  id: string
  nombre: string
  createdAt: Date
  activo: boolean
}

// Collections
const USERS_COLLECTION = "user_profiles"
const ATTENDANCE_COLLECTION = "attendance_records"
const EVENTS_COLLECTION = "events"
const CULTURAL_GROUPS_COLLECTION = "cultural_groups"

// Validation error class for data isolation violations
export class DataIsolationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DataIsolationError'
  }
}

// Track active transactions per area to prevent cross-database transactions
const activeTransactions = new Map<string, Area>()

/**
 * Validates that an area parameter is specified and valid
 * Requirement 13.5: Validate that each operation specifies explicitly the area objetivo
 */
function validateAreaSpecified(area: Area | undefined | null): asserts area is Area {
  if (!area) {
    // Task 25.1: Log de errores de enrutamiento
    logRoutingError(undefined, 'validateAreaSpecified', 'Area must be specified for all database operations')
    throw new DataIsolationError('Area must be specified for all database operations')
  }
  
  if (area !== 'cultura' && area !== 'deporte') {
    // Task 25.1: Log de errores de enrutamiento
    logRoutingError(area, 'validateAreaSpecified', `Invalid area specified: '${area}'`)
    throw new DataIsolationError(`Invalid area specified: '${area}'. Must be 'cultura' or 'deporte'`)
  }
}

/**
 * Validates that operations don't cross database boundaries
 * Requirement 13.3: Prevent cross-database queries
 */
function validateNoCrossDatabaseOperation(currentArea: Area, requestedArea: Area): void {
  if (currentArea !== requestedArea) {
    // Task 25.1: Log de intentos de acceso cross-área
    logDataIsolationViolation(currentArea, requestedArea, 'validateNoCrossDatabaseOperation')
    throw new DataIsolationError(
      `Cross-database operation detected: attempting to access '${requestedArea}' while operating in '${currentArea}'`
    )
  }
}

/**
 * Starts a transaction scope for an area
 * Requirement 13.4: Validate transaction boundaries - transactions limited to single database
 */
export function beginTransaction(transactionId: string, area: Area): void {
  validateAreaSpecified(area)
  
  if (activeTransactions.has(transactionId)) {
    const existingArea = activeTransactions.get(transactionId)!
    if (existingArea !== area) {
      // Task 25.1: Log de intentos de acceso cross-área
      logDataIsolationViolation(existingArea, area, `beginTransaction(${transactionId})`)
      throw new DataIsolationError(
        `Transaction '${transactionId}' cannot span multiple databases. Already active in '${existingArea}', attempted to use in '${area}'`
      )
    }
  }
  
  activeTransactions.set(transactionId, area)
  // Task 25.1: Log transaction events
  logTransaction(transactionId, area, 'start')
}

/**
 * Ends a transaction scope
 */
export function endTransaction(transactionId: string): void {
  if (activeTransactions.has(transactionId)) {
    const area = activeTransactions.get(transactionId)!
    activeTransactions.delete(transactionId)
    // Task 25.1: Log transaction events
    logTransaction(transactionId, area, 'end')
  }
}

/**
 * Validates that an operation is within an active transaction's area
 */
function validateTransactionBoundary(transactionId: string | undefined, area: Area): void {
  if (transactionId && activeTransactions.has(transactionId)) {
    const transactionArea = activeTransactions.get(transactionId)!
    validateNoCrossDatabaseOperation(transactionArea, area)
  }
}

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

// Save user profile (area-aware) — validates no duplicate cedula/correo/nombre
export async function saveUserProfile(
  area: Area,
  profile: Omit<UserProfile, "id" | "createdAt" | "lastAttendance">,
): Promise<string> {
  validateAreaSpecified(area)
  
  try {
    const db = getFirestoreForArea(area)
    const usersRef = collection(db, USERS_COLLECTION)

    // Check duplicate by cedula
    if (profile.numeroDocumento) {
      const cedulaSnap = await getDocs(query(usersRef, where("numeroDocumento", "==", profile.numeroDocumento)))
      if (!cedulaSnap.empty) {
        throw new Error(`Ya existe un usuario registrado con el número de documento ${profile.numeroDocumento}. Si eres tú, selecciónate de la lista de sugerencias.`)
      }
    }

    // Check duplicate by correo
    if (profile.correo) {
      const correoSnap = await getDocs(query(usersRef, where("correo", "==", profile.correo)))
      if (!correoSnap.empty) {
        throw new Error(`Ya existe un usuario registrado con el correo ${profile.correo}. Si eres tú, selecciónate de la lista de sugerencias.`)
      }
    }

    const userProfile = {
      ...profile,
      createdAt: serverTimestamp(),
      lastAttendance: serverTimestamp(),
    }

    const cleanProfile = filterUndefinedValues(userProfile)

    console.log("[db-router] Attempting to save user profile to area:", area)
    const docRef = await addDoc(collection(db, USERS_COLLECTION), cleanProfile)
    console.log("[db-router] User profile saved with ID:", docRef.id)
    return docRef.id
  } catch (error) {
    console.error("[db-router] Error in saveUserProfile:", error)
    throw error
  }
}

// Save user profile AND enroll to group atomically.
// If enrollment fails, the newly created user is deleted to avoid orphan records.
export async function saveUserProfileAndEnroll(
  area: Area,
  profile: Omit<UserProfile, "id" | "createdAt" | "lastAttendance">,
  grupoCultural: string,
): Promise<{ userId: string; enrollmentId: string }> {
  validateAreaSpecified(area)

  const userId = await saveUserProfile(area, profile)

  try {
    const enrollmentId = await enrollUserToGroup(area, userId, grupoCultural)
    return { userId, enrollmentId }
  } catch (enrollError) {
    // Rollback: delete the user that was just created
    console.error("[db-router] Enrollment failed after user creation, rolling back user:", userId)
    try {
      const db = getFirestoreForArea(area)
      await deleteDoc(doc(db, USERS_COLLECTION, userId))
      console.log("[db-router] Rollback successful — user deleted:", userId)
    } catch (deleteError) {
      console.error("[db-router] Rollback failed — orphan user may exist:", userId, deleteError)
    }
    throw enrollError
  }
}

// Get all users (area-aware)
export async function getAllUsers(area: Area): Promise<UserProfile[]> {
  // Requirement 13.5: Validate area is specified
  validateAreaSpecified(area)
  
  try {
    const db = getFirestoreForArea(area)
    const usersRef = collection(db, USERS_COLLECTION)
    
    // Filter by area field to ensure data isolation
    const q = query(usersRef, where("area", "==", area))
    const snapshot = await getDocs(q)

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

    console.log("[db-router] Retrieved", users.length, "users from area:", area)
    return users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch (error) {
    console.error("[db-router] Error getting all users:", error)
    throw error
  }
}

// Get user by ID (area-aware)
export async function getUserById(area: Area, userId: string): Promise<UserProfile | null> {
  // Requirement 13.5: Validate area is specified
  validateAreaSpecified(area)
  
  try {
    const db = getFirestoreForArea(area)
    const userRef = doc(db, USERS_COLLECTION, userId)
    const userSnap = await getDoc(userRef)

    if (userSnap.exists()) {
      const userData = userSnap.data()
      console.log("[db-router] User found in area:", area)
      return {
        id: userSnap.id,
        ...userData,
        createdAt: timestampToDate(userData.createdAt),
        lastAttendance: timestampToDate(userData.lastAttendance),
      } as UserProfile
    }

    console.log("[db-router] User not found in area:", area)
    return null
  } catch (error) {
    console.error("[db-router] Error getting user by ID:", error)
    throw error
  }
}

// Save attendance entry (area-aware)
export async function saveAttendanceEntry(
  area: Area,
  userId: string,
  grupoCultural: string,
  markedBy?: { id: string; nombre: string; role: string }
): Promise<void> {
  // Requirement 13.5: Validate area is specified
  validateAreaSpecified(area)
  
  try {
    const db = getFirestoreForArea(area)
    
    const attendanceEntry: Record<string, any> = {
      userId,
      grupoCultural,
      timestamp: Timestamp.fromDate(new Date()),
    }

    // Store who marked the attendance (manager info)
    if (markedBy) {
      attendanceEntry.markedById = markedBy.id
      attendanceEntry.markedByNombre = markedBy.nombre
      attendanceEntry.markedByRole = markedBy.role
    }

    console.log("[db-router] Attempting to save attendance entry to area:", area)
    await addDoc(collection(db, ATTENDANCE_COLLECTION), attendanceEntry)
    console.log("[db-router] Attendance entry saved successfully")

    // Update user's last attendance
    const userRef = doc(db, USERS_COLLECTION, userId)
    await updateDoc(userRef, {
      lastAttendance: Timestamp.fromDate(new Date()),
    })
    console.log("[db-router] User's last attendance updated successfully")
  } catch (error) {
    console.error("[db-router] Error in saveAttendanceEntry:", error)
    throw error
  }
}

// Get attendance notifications (records marked by managers, area-aware)
export async function getAttendanceNotifications(area: Area): Promise<Array<{
  id: string
  grupoCultural: string
  timestamp: Date
  markedById: string
  markedByNombre: string
  markedByRole: string
  userCount: number
  userNames: string[]
}>> {
  validateAreaSpecified(area)

  try {
    const db = getFirestoreForArea(area)
    const attendanceRef = collection(db, ATTENDANCE_COLLECTION)

    // Only get records that were marked by a manager
    const q = query(attendanceRef, where("markedById", "!=", null))
    const snapshot = await getDocs(q)

    if (snapshot.empty) return []

    // Group by (markedById + grupoCultural + date-hour bucket) to aggregate
    const buckets = new Map<string, {
      id: string
      grupoCultural: string
      timestamp: Date
      markedById: string
      markedByNombre: string
      markedByRole: string
      userIds: Set<string>
    }>()

    // Get user names
    const userIds = new Set<string>()
    snapshot.docs.forEach(d => userIds.add(d.data().userId))

    const usersRef = collection(db, USERS_COLLECTION)
    const userMap = new Map<string, string>()
    const userIdArray = Array.from(userIds)
    for (let i = 0; i < userIdArray.length; i += 10) {
      const batch = userIdArray.slice(i, i + 10)
      const uq = query(usersRef, where("__name__", "in", batch))
      const uSnap = await getDocs(uq)
      uSnap.docs.forEach(d => userMap.set(d.id, d.data().nombres || ""))
    }

    snapshot.docs.forEach(d => {
      const data = d.data()
      const ts: Date = timestampToDate(data.timestamp)
      // Bucket key: manager + group + YYYY-MM-DD-HH (group by hour)
      const hourKey = `${ts.getFullYear()}-${ts.getMonth()}-${ts.getDate()}-${ts.getHours()}`
      const key = `${data.markedById}_${data.grupoCultural}_${hourKey}`

      if (!buckets.has(key)) {
        buckets.set(key, {
          id: key,
          grupoCultural: data.grupoCultural,
          timestamp: ts,
          markedById: data.markedById,
          markedByNombre: data.markedByNombre || "Desconocido",
          markedByRole: data.markedByRole || "",
          userIds: new Set(),
        })
      }
      buckets.get(key)!.userIds.add(data.userId)
    })

    const result = Array.from(buckets.values()).map(b => ({
      id: b.id,
      grupoCultural: b.grupoCultural,
      timestamp: b.timestamp,
      markedById: b.markedById,
      markedByNombre: b.markedByNombre,
      markedByRole: b.markedByRole,
      userCount: b.userIds.size,
      userNames: Array.from(b.userIds).map(uid => userMap.get(uid) || uid).slice(0, 5),
    }))

    return result.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  } catch (error) {
    console.error("[db-router] Error getting attendance notifications:", error)
    return []
  }
}

// Get all attendance records (area-aware)
export async function getAttendanceRecords(area: Area): Promise<AttendanceRecord[]> {
  // Requirement 13.5: Validate area is specified
  validateAreaSpecified(area)
  
  try {
    const db = getFirestoreForArea(area)
    const usersRef = collection(db, USERS_COLLECTION)
    const attendanceRef = collection(db, ATTENDANCE_COLLECTION)

    // Only filter users by area - attendance records don't have area field yet
    const usersQuery = query(usersRef, where("area", "==", area))
    
    const [usersSnapshot, attendanceSnapshot] = await Promise.all([
      getDocs(usersQuery), 
      getDocs(attendanceRef) // Get all attendance records from this database
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

    const records: AttendanceRecord[] = []
    attendanceSnapshot.forEach((doc) => {
      const attendanceData = doc.data()
      const user = users.get(attendanceData.userId)

      // Only include attendance records for users that belong to this area
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
          codigoEstudiantil: user.codigoEstudiantil,
          facultad: user.facultad,
          programaAcademico: user.programaAcademico,
          grupoCultural: attendanceData.grupoCultural,
        })
      }
    })

    console.log("[db-router] Retrieved", records.length, "attendance records from area:", area)
    return records.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  } catch (error) {
    console.error("[db-router] Error getting attendance records:", error)
    throw error
  }
}

// Get attendance stats for a specific group (OPTIMIZED for managers)
export async function getGroupAttendanceStats(
  area: Area, 
  grupoCultural: string,
  userIds: string[]
): Promise<Record<string, number>> {
  validateAreaSpecified(area)
  
  try {
    const db = getFirestoreForArea(area)
    const attendanceRef = collection(db, ATTENDANCE_COLLECTION)
    
    // Query only attendance records for this specific group
    const q = query(attendanceRef, where("grupoCultural", "==", grupoCultural))
    const snapshot = await getDocs(q)
    
    console.log("[db-router] Found", snapshot.size, "attendance records for group:", grupoCultural, "in area:", area)
    
    // Count attendances per user
    const stats: Record<string, number> = {}
    
    // Initialize all users with 0
    userIds.forEach(userId => {
      stats[userId] = 0
    })
    
    // Count attendances
    snapshot.docs.forEach(doc => {
      const data = doc.data()
      if (stats.hasOwnProperty(data.userId)) {
        stats[data.userId]++
      }
    })
    
    return stats
  } catch (error) {
    console.error("[db-router] Error getting group attendance stats:", error)
    return {}
  }
}

// Get all events (area-aware)
export async function getAllEvents(area: Area): Promise<Event[]> {
  // Requirement 13.5: Validate area is specified
  validateAreaSpecified(area)
  
  try {
    const db = getFirestoreForArea(area)
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

    console.log("[db-router] Retrieved", events.length, "events from area:", area)
    return events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch (error) {
    console.error("[db-router] Error getting events:", error)
    throw error
  }
}

// Get all cultural groups (area-aware)
export async function getAllCulturalGroups(area: Area): Promise<CulturalGroup[]> {
  // Requirement 13.5: Validate area is specified
  validateAreaSpecified(area)
  
  try {
    const db = getFirestoreForArea(area)
    const groupsRef = collection(db, CULTURAL_GROUPS_COLLECTION)
    
    // Don't filter by area field - cultural_groups collection doesn't have area field
    // The database itself (cultura vs deporte) provides the isolation
    const snapshot = await getDocs(groupsRef)

    const groups: CulturalGroup[] = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      groups.push({
        id: doc.id,
        nombre: data.nombre,
        createdAt: timestampToDate(data.createdAt),
        activo: data.activo ?? true,
      })
    })

    console.log("[db-router] Retrieved", groups.length, "cultural groups from area:", area)
    return groups.sort((a, b) => a.nombre.localeCompare(b.nombre))
  } catch (error) {
    console.error("[db-router] Error getting cultural groups:", error)
    throw error
  }
}

// Find similar users for recognition system (area-aware)
export async function findSimilarUsers(
  area: Area,
  nombres: string,
  correo: string,
  numeroDocumento: string,
  telefono: string,
): Promise<Array<{ user: UserProfile; similarity: number; matchingFields: string[] }>> {
  // Requirement 13.5: Validate area is specified
  validateAreaSpecified(area)
  
  try {
    const db = getFirestoreForArea(area)
    const usersRef = collection(db, USERS_COLLECTION)
    const snapshot = await getDocs(usersRef)

    const similarUsers: Array<{ user: UserProfile; similarity: number; matchingFields: string[] }> = []

    snapshot.forEach((doc) => {
      const userData = doc.data()
      const user: UserProfile = {
        id: doc.id,
        ...userData,
        createdAt: timestampToDate(userData.createdAt),
        lastAttendance: timestampToDate(userData.lastAttendance),
      } as UserProfile

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

    console.log("[db-router] Found", similarUsers.length, "similar users in area:", area)
    return similarUsers.sort((a, b) => b.similarity - a.similarity).slice(0, 3)
  } catch (error) {
    console.error("[db-router] Error finding similar users:", error)
    throw error
  }
}

// Get active events (area-aware)
export async function getActiveEvents(area: Area): Promise<Event[]> {
  // Requirement 13.5: Validate area is specified
  validateAreaSpecified(area)
  
  try {
    const allEvents = await getAllEvents(area)
    const now = new Date()

    const activeEvents = allEvents.filter(
      (event) => event.activo && new Date(event.fechaApertura) <= now && new Date(event.fechaVencimiento) >= now,
    )

    console.log("[db-router] Found", activeEvents.length, "active events in area:", area)
    return activeEvents
  } catch (error) {
    console.error("[db-router] Error getting active events:", error)
    throw error
  }
}

// ============================================================================
// EVENT ATTENDANCE FUNCTIONS (area-aware)
// ============================================================================

const EVENT_ATTENDANCE_COLLECTION = "event_attendance_records"

// Save event attendance (area-aware)
export async function saveEventAttendance(area: Area, userId: string, eventId: string): Promise<void> {
  // Requirement 13.5: Validate area is specified
  validateAreaSpecified(area)
  
  try {
    const db = getFirestoreForArea(area)
    const eventAttendanceRef = collection(db, EVENT_ATTENDANCE_COLLECTION)

    // Check if user is already enrolled in this event
    const existingAttendanceQuery = query(
      eventAttendanceRef,
      where("userId", "==", userId),
      where("eventId", "==", eventId)
    )
    const existingAttendanceSnapshot = await getDocs(existingAttendanceQuery)

    if (!existingAttendanceSnapshot.empty) {
      throw new Error("Ya estás inscrito en este evento")
    }

    const eventAttendance = {
      userId,
      eventId,
      timestamp: Timestamp.fromDate(new Date()),
    }

    console.log("[db-router] Saving event attendance to area:", area)
    await addDoc(eventAttendanceRef, eventAttendance)
    console.log("[db-router] Event attendance saved successfully")

    // Update user's last attendance
    const userRef = doc(db, USERS_COLLECTION, userId)
    await updateDoc(userRef, {
      lastAttendance: Timestamp.fromDate(new Date()),
    })
  } catch (error) {
    console.error("[db-router] Error saving event attendance:", error)
    throw error
  }
}

// Get user event enrollments (area-aware)
export async function getUserEventEnrollments(area: Area, userId: string): Promise<string[]> {
  // Requirement 13.5: Validate area is specified
  validateAreaSpecified(area)
  
  try {
    const db = getFirestoreForArea(area)
    const eventAttendanceRef = collection(db, EVENT_ATTENDANCE_COLLECTION)
    
    const userEventsQuery = query(eventAttendanceRef, where("userId", "==", userId))
    const snapshot = await getDocs(userEventsQuery)

    const eventIds: string[] = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      eventIds.push(data.eventId)
    })

    console.log("[db-router] Found", eventIds.length, "event enrollments for user in area:", area)
    return eventIds
  } catch (error) {
    console.error("[db-router] Error getting user event enrollments:", error)
    return []
  }
}

// Create a new cultural group (area-aware)
export async function createCulturalGroup(area: Area, nombre: string): Promise<string> {
  // Requirement 13.5: Validate area is specified
  validateAreaSpecified(area)
  
  try {
    const db = getFirestoreForArea(area)
    
    // Check if a group with this name already exists
    const existingGroups = await getAllCulturalGroups(area)
    if (existingGroups.some(g => g.nombre.toLowerCase() === nombre.toLowerCase())) {
      console.log("[db-router] Group already exists:", nombre)
      throw new Error("Ya existe un grupo con ese nombre")
    }

    // Create group object using serverTimestamp (recommended by Firebase)
    const group = {
      nombre: nombre,
      createdAt: serverTimestamp(),
      activo: true,
    }

    console.log("[db-router] Creating cultural group in area:", area, "- Name:", nombre)
    
    const docRef = await addDoc(collection(db, CULTURAL_GROUPS_COLLECTION), group)
    console.log("[db-router] Cultural group created with ID:", docRef.id)
    return docRef.id
  } catch (error) {
    console.error("[db-router] Error creating cultural group:", error)
    throw error
  }
}

// Get all group enrollments for an area
export async function getAllGroupEnrollments(area: Area): Promise<Array<{
  id: string
  userId: string
  grupoCultural: string
  enrolledAt: Date
}>> {
  validateAreaSpecified(area)
  
  try {
    const db = getFirestoreForArea(area)
    const enrollmentsRef = collection(db, "group_enrollments")
    const snapshot = await getDocs(enrollmentsRef)
    
    const enrollments = snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        userId: data.userId,
        grupoCultural: data.grupoCultural,
        enrolledAt: timestampToDate(data.enrolledAt || data.fechaInscripcion || data.createdAt),
      }
    })
    
    console.log("[db-router] Retrieved", enrollments.length, "group enrollments from area:", area)
    console.log("[db-router] Sample enrollment:", enrollments[0])
    return enrollments
  } catch (error) {
    console.error("[db-router] Error getting group enrollments:", error)
    throw error
  }
}

// Get groups with enrollment counts (area-aware)
export async function getGroupsWithEnrollmentCounts(area: Area): Promise<Array<{
  nombre: string
  totalInscritos: number
  inscritosPorGenero: {
    mujer: number
    hombre: number
    otro: number
  }
}>> {
  validateAreaSpecified(area)
  
  try {
    const db = getFirestoreForArea(area)
    
    console.log("[db-router] Getting groups with enrollment counts for area:", area)
    
    // Get all groups and enrollments
    const [groups, enrollments, users] = await Promise.all([
      getAllCulturalGroups(area),
      getAllGroupEnrollments(area),
      getAllUsers(area)
    ])
    
    console.log("[db-router] Groups:", groups.length, "Enrollments:", enrollments.length, "Users:", users.length)
    
    // Create a map of userId to user data
    const userMap = new Map(users.map(u => [u.id, u]))
    
    // Count enrollments per group
    const groupCounts = new Map<string, {
      total: number
      mujer: number
      hombre: number
      otro: number
    }>()
    
    // Initialize counts for all groups
    groups.forEach(group => {
      groupCounts.set(group.nombre, {
        total: 0,
        mujer: 0,
        hombre: 0,
        otro: 0
      })
    })
    
    // Count enrollments
    let matchedEnrollments = 0
    let unmatchedEnrollments = 0
    
    enrollments.forEach(enrollment => {
      const user = userMap.get(enrollment.userId)
      if (user) {
        matchedEnrollments++
        const counts = groupCounts.get(enrollment.grupoCultural)
        if (counts) {
          counts.total++
          const gender = user.genero.toLowerCase() as 'mujer' | 'hombre' | 'otro'
          if (gender === 'mujer' || gender === 'hombre' || gender === 'otro') {
            counts[gender]++
          }
          console.log("[db-router] Counted enrollment:", enrollment.grupoCultural, "User:", user.nombres, "Gender:", gender)
        } else {
          console.log("[db-router] WARNING: Enrollment for unknown group:", enrollment.grupoCultural)
        }
      } else {
        unmatchedEnrollments++
        console.log("[db-router] WARNING: Enrollment for unknown user:", enrollment.userId)
      }
    })
    
    console.log("[db-router] Matched enrollments:", matchedEnrollments, "Unmatched:", unmatchedEnrollments)
    
    // Convert to result format
    const result = groups.map(group => {
      const counts = groupCounts.get(group.nombre) || { total: 0, mujer: 0, hombre: 0, otro: 0 }
      return {
        nombre: group.nombre,
        totalInscritos: counts.total,
        inscritosPorGenero: {
          mujer: counts.mujer,
          hombre: counts.hombre,
          otro: counts.otro
        }
      }
    })
    
    console.log("[db-router] Calculated enrollment counts for", result.length, "groups in area:", area)
    console.log("[db-router] Groups with enrollments:", result.filter(g => g.totalInscritos > 0).length)
    return result
  } catch (error) {
    console.error("[db-router] Error getting groups with enrollment counts:", error)
    throw error
  }
}

// Enroll user to group (area-aware)
export async function enrollUserToGroup(area: Area, userId: string, grupoCultural: string): Promise<string> {
  validateAreaSpecified(area)
  
  try {
    const db = getFirestoreForArea(area)
    
    console.log("[db-router] Starting enrollment process for user:", userId, "to group:", grupoCultural, "in area:", area)
    
    // Use composite ID to ensure uniqueness — strip all chars invalid in Firestore doc IDs
    const safeGroupName = grupoCultural.replace(/[\s/\\\.#$\[\]]/g, "_")
    const enrollmentId = `${userId}_${safeGroupName}`
    const enrollmentRef = doc(db, "group_enrollments", enrollmentId)
    
    // Check if document already exists
    const existingDoc = await getDoc(enrollmentRef)
    
    if (existingDoc.exists()) {
      console.log("[db-router] User already enrolled in this group (document exists)")
      throw new Error("Ya estás inscrito en este grupo")
    }

    const enrollment = {
      userId,
      grupoCultural,
      enrolledAt: serverTimestamp(),
    }

    console.log("[db-router] Enrolling user to group with data:", enrollment)
    console.log("[db-router] Target database:", area)
    console.log("[db-router] Using composite ID:", enrollmentId)
    
    // Use setDoc with composite ID to ensure uniqueness
    await setDoc(enrollmentRef, enrollment)
    console.log("[db-router] User enrolled successfully with ID:", enrollmentId)
    return enrollmentId
  } catch (error: any) {
    console.error("[db-router] Error enrolling user to group:", error)
    console.error("[db-router] Error code:", error.code)
    console.error("[db-router] Error message:", error.message)
    
    if (error.code === "permission-denied") {
      throw new Error("Error de permisos en Firestore. Verifica que las reglas permitan escritura en 'group_enrollments'")
    }
    
    throw error
  }
}

// Get user enrollments (area-aware)
export async function getUserEnrollments(area: Area, userId: string): Promise<Array<{
  id: string
  userId: string
  grupoCultural: string
  fechaInscripcion: Date
}>> {
  validateAreaSpecified(area)
  
  try {
    const db = getFirestoreForArea(area)
    const enrollmentsRef = collection(db, "group_enrollments")
    const enrollmentQuery = query(enrollmentsRef, where("userId", "==", userId))
    const snapshot = await getDocs(enrollmentQuery)

    const enrollments = snapshot.docs.map(doc => ({
      id: doc.id,
      userId: doc.data().userId,
      grupoCultural: doc.data().grupoCultural,
      fechaInscripcion: timestampToDate(doc.data().enrolledAt || doc.data().fechaInscripcion || doc.data().createdAt),
    }))

    console.log("[db-router] Retrieved", enrollments.length, "enrollments for user in area:", area)
    return enrollments
  } catch (error) {
    console.error("[db-router] Error getting user enrollments:", error)
    throw error
  }
}

// Update user role (area-aware)
export async function updateUserRole(area: Area, userId: string, role: string): Promise<void> {
  validateAreaSpecified(area)
  
  try {
    const db = getFirestoreForArea(area)
    const userRef = doc(db, USERS_COLLECTION, userId)
    
    console.log("[db-router] Updating user role in area:", area, "User:", userId, "New role:", role)
    await updateDoc(userRef, {
      rol: role
    })
    console.log("[db-router] User role updated successfully")
  } catch (error) {
    console.error("[db-router] Error updating user role:", error)
    throw error
  }
}

// Delete user (area-aware)
export async function deleteUser(area: Area, userId: string): Promise<void> {
  validateAreaSpecified(area)
  
  try {
    const db = getFirestoreForArea(area)
    
    console.log("[db-router] Starting user deletion process for user:", userId, "in area:", area)

    // First, delete all attendance records for this user
    const attendanceRef = collection(db, ATTENDANCE_COLLECTION)
    const attendanceQuery = query(attendanceRef, where("userId", "==", userId))
    const attendanceSnapshot = await getDocs(attendanceQuery)

    console.log("[db-router] Found", attendanceSnapshot.size, "attendance records to delete")

    // Delete all attendance records
    const deleteAttendancePromises = attendanceSnapshot.docs.map((doc) => deleteDoc(doc.ref))
    await Promise.all(deleteAttendancePromises)

    console.log("[db-router] All attendance records deleted")

    // Delete all group enrollments for this user
    const enrollmentsRef = collection(db, "group_enrollments")
    const enrollmentsQuery = query(enrollmentsRef, where("userId", "==", userId))
    const enrollmentsSnapshot = await getDocs(enrollmentsQuery)

    console.log("[db-router] Found", enrollmentsSnapshot.size, "enrollment records to delete")

    const deleteEnrollmentPromises = enrollmentsSnapshot.docs.map((doc) => deleteDoc(doc.ref))
    await Promise.all(deleteEnrollmentPromises)

    console.log("[db-router] All enrollment records deleted")

    // Delete all event attendance records for this user
    const eventAttendanceRef = collection(db, "event_attendance_records")
    const eventAttendanceQuery = query(eventAttendanceRef, where("userId", "==", userId))
    const eventAttendanceSnapshot = await getDocs(eventAttendanceQuery)

    console.log("[db-router] Found", eventAttendanceSnapshot.size, "event attendance records to delete")

    const deleteEventAttendancePromises = eventAttendanceSnapshot.docs.map((doc) => deleteDoc(doc.ref))
    await Promise.all(deleteEventAttendancePromises)

    console.log("[db-router] All event attendance records deleted")

    // Then delete the user profile
    const userRef = doc(db, USERS_COLLECTION, userId)
    await deleteDoc(userRef)

    console.log("[db-router] User profile deleted successfully")
  } catch (error) {
    console.error("[db-router] Error deleting user:", error)
    throw error
  }
}

// Create event (area-aware)
export async function createEvent(area: Area, eventData: Omit<Event, "id" | "createdAt" | "activo">): Promise<string> {
  validateAreaSpecified(area)
  
  try {
    const db = getFirestoreForArea(area)
    
    const event = {
      ...eventData,
      createdAt: serverTimestamp(),
      activo: true,
    }

    console.log("[db-router] Creating event in area:", area)
    const docRef = await addDoc(collection(db, EVENTS_COLLECTION), event)
    console.log("[db-router] Event created with ID:", docRef.id)
    return docRef.id
  } catch (error) {
    console.error("[db-router] Error creating event:", error)
    throw error
  }
}

// Delete event (area-aware)
export async function deleteEvent(area: Area, eventId: string): Promise<void> {
  validateAreaSpecified(area)
  
  try {
    const db = getFirestoreForArea(area)
    
    console.log("[db-router] Starting event deletion process for event:", eventId, "in area:", area)

    // First delete all event attendance records
    const eventAttendanceRef = collection(db, "event_attendance_records")
    const eventAttendanceQuery = query(eventAttendanceRef, where("eventId", "==", eventId))
    const eventAttendanceSnapshot = await getDocs(eventAttendanceQuery)

    console.log("[db-router] Found", eventAttendanceSnapshot.size, "event attendance records to delete")

    const deletePromises = eventAttendanceSnapshot.docs.map((doc) => deleteDoc(doc.ref))
    await Promise.all(deletePromises)

    console.log("[db-router] All event attendance records deleted")

    // Then delete the event
    const eventRef = doc(db, EVENTS_COLLECTION, eventId)
    await deleteDoc(eventRef)

    console.log("[db-router] Event deleted successfully")
  } catch (error) {
    console.error("[db-router] Error deleting event:", error)
    throw error
  }
}

// Toggle event active status (area-aware)
export async function toggleEventActive(area: Area, eventId: string, activo: boolean): Promise<void> {
  validateAreaSpecified(area)
  
  try {
    const db = getFirestoreForArea(area)
    const eventRef = doc(db, EVENTS_COLLECTION, eventId)
    await updateDoc(eventRef, { activo })
    console.log("[db-router] Event active status updated to:", activo, "in area:", area)
  } catch (error) {
    console.error("[db-router] Error toggling event active:", error)
    throw error
  }
}

// Update event (area-aware)
export async function updateEvent(area: Area, eventId: string, eventData: Omit<Event, "id" | "createdAt" | "activo">): Promise<void> {
  validateAreaSpecified(area)
  try {
    const db = getFirestoreForArea(area)
    await updateDoc(doc(db, EVENTS_COLLECTION, eventId), {
      nombre: eventData.nombre,
      hora: eventData.hora,
      lugar: eventData.lugar,
      fechaApertura: Timestamp.fromDate(new Date(eventData.fechaApertura)),
      fechaVencimiento: Timestamp.fromDate(new Date(eventData.fechaVencimiento)),
    })
    console.log("[db-router] Event updated:", eventId, "in area:", area)
  } catch (error) {
    console.error("[db-router] Error updating event:", error)
    throw error
  }
}

// Get group tracking data (area-aware)
export async function getGroupTracking(area: Area): Promise<Array<{
  groupName: string
  participants: Array<{
    userId: string
    userName: string
    monthlyCount: number
    totalCount: number
    lastAttendance: Date
  }>
}>> {
  validateAreaSpecified(area)
  
  try {
    const db = getFirestoreForArea(area)
    const usersRef = collection(db, USERS_COLLECTION)
    const attendanceRef = collection(db, ATTENDANCE_COLLECTION)
    const groupsRef = collection(db, CULTURAL_GROUPS_COLLECTION)

    console.log("[db-router] Getting group tracking for area:", area)
    const [usersSnapshot, attendanceSnapshot, groupsSnapshot] = await Promise.all([
      getDocs(usersRef), 
      getDocs(attendanceRef),
      getDocs(groupsRef)
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

    // Initialize groupData with all existing groups
    const groupData = new Map<string, Map<string, { count: number; monthlyCount: number; lastAttendance: Date }>>()
    
    // Add all groups from cultural_groups collection
    groupsSnapshot.forEach((doc) => {
      const groupDoc = doc.data()
      if (!groupData.has(groupDoc.nombre)) {
        groupData.set(groupDoc.nombre, new Map())
      }
    })

    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM

    // Add attendance data
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

    const result: Array<{
      groupName: string
      participants: Array<{
        userId: string
        userName: string
        monthlyCount: number
        totalCount: number
        lastAttendance: Date
      }>
    }> = []
    
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

    console.log("[db-router] Retrieved tracking for", result.length, "groups in area:", area)
    return result.sort((a, b) => a.groupName.localeCompare(b.groupName))
  } catch (error) {
    console.error("[db-router] Error getting group tracking:", error)
    throw error
  }
}

// ============================================================================
// GROUP MANAGER FUNCTIONS (area-aware)
// ============================================================================

const GROUP_MANAGERS_COLLECTION = "group_managers"

// Assign group manager (area-aware)
export async function assignGroupManager(
  area: Area,
  userId: string,
  grupoCultural: string,
  assignedBy: string,
): Promise<void> {
  validateAreaSpecified(area)
  
  try {
    const db = getFirestoreForArea(area)
    
    console.log("[db-router] Assigning group manager in area:", area)
    console.log("[db-router] User:", userId, "Group:", grupoCultural)
    
    // En deporte, ENTRENADOR y MONITOR pueden estar en múltiples grupos
    // En cultura, un encargado solo puede tener un grupo
    const managersRef = collection(db, GROUP_MANAGERS_COLLECTION)
    const q = query(managersRef, where("userId", "==", userId))
    const snapshot = await getDocs(q)

    if (!snapshot.empty) {
      if (area === 'deporte') {
        // Verificar que no esté ya asignado a ESTE mismo grupo
        const alreadyInGroup = snapshot.docs.some(
          (d) => d.data().grupoCultural === grupoCultural
        )
        if (alreadyInGroup) {
          throw new Error("Este entrenador ya está asignado a este grupo")
        }
        // En deporte se permite múltiples grupos — continuar
      } else {
        // En cultura: un encargado = un grupo
        throw new Error("Este usuario ya está encargado de otro grupo")
      }
    }

    const managerRef = doc(collection(db, GROUP_MANAGERS_COLLECTION))
    await setDoc(managerRef, {
      userId,
      grupoCultural,
      assignedAt: serverTimestamp(),
      assignedBy,
    })
    
    console.log("[db-router] Group manager assigned successfully")
  } catch (error) {
    console.error("[db-router] Error assigning group manager:", error)
    throw error
  }
}

// Get group managers (area-aware)
export async function getGroupManagers(area: Area, grupoCultural: string): Promise<Array<{
  id: string
  userId: string
  grupoCultural: string
  assignedAt: Date
  assignedBy: string
  user: UserProfile
}>> {
  validateAreaSpecified(area)
  
  try {
    const db = getFirestoreForArea(area)
    const managersRef = collection(db, GROUP_MANAGERS_COLLECTION)
    const q = query(managersRef, where("grupoCultural", "==", grupoCultural))
    const snapshot = await getDocs(q)

    console.log("[db-router] Found", snapshot.size, "managers for group:", grupoCultural, "in area:", area)

    const managers: Array<{
      id: string
      userId: string
      grupoCultural: string
      assignedAt: Date
      assignedBy: string
      user: UserProfile
    }> = []

    for (const docSnap of snapshot.docs) {
      const managerData = docSnap.data()
      const userRef = doc(db, USERS_COLLECTION, managerData.userId)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists()) {
        const userData = userSnap.data()
        managers.push({
          id: docSnap.id,
          userId: managerData.userId,
          grupoCultural: managerData.grupoCultural,
          assignedAt: timestampToDate(managerData.assignedAt),
          assignedBy: managerData.assignedBy,
          user: {
            id: userSnap.id,
            ...userData,
            createdAt: timestampToDate(userData.createdAt),
            lastAttendance: timestampToDate(userData.lastAttendance),
          } as UserProfile,
        })
      }
    }

    return managers
  } catch (error) {
    console.error("[db-router] Error getting group managers:", error)
    return []
  }
}

// Remove group manager (area-aware)
export async function removeGroupManager(area: Area, managerId: string): Promise<void> {
  validateAreaSpecified(area)
  
  try {
    const db = getFirestoreForArea(area)
    const managerRef = doc(db, GROUP_MANAGERS_COLLECTION, managerId)
    
    console.log("[db-router] Removing group manager:", managerId, "from area:", area)
    await deleteDoc(managerRef)
    console.log("[db-router] Group manager removed successfully")
  } catch (error) {
    console.error("[db-router] Error removing group manager:", error)
    throw error
  }
}

// Get event attendance records with user information (area-aware)
export async function getEventAttendanceRecordsRouter(area: Area): Promise<Array<{
  entry: {
    id: string
    userId: string
    eventId: string
    timestamp: Date
  }
  user: UserProfile
  eventName: string
}>> {
  validateAreaSpecified(area)
  
  try {
    const db = getFirestoreForArea(area)
    const usersRef = collection(db, USERS_COLLECTION)
    const eventAttendanceRef = collection(db, EVENT_ATTENDANCE_COLLECTION)
    const eventsRef = collection(db, EVENTS_COLLECTION)

    console.log("[db-router] Getting event attendance records for area:", area)
    
    const [usersSnapshot, eventAttendanceSnapshot, eventsSnapshot] = await Promise.all([
      getDocs(usersRef),
      getDocs(eventAttendanceRef),
      getDocs(eventsRef),
    ])

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

    // Crear mapa de eventos
    const events = new Map<string, string>()
    eventsSnapshot.forEach((doc) => {
      const eventData = doc.data()
      events.set(doc.id, eventData.nombre)
    })

    // Combinar asistencias con información del usuario y nombre del evento
    const records: Array<{
      entry: {
        id: string
        userId: string
        eventId: string
        timestamp: Date
      }
      user: UserProfile
      eventName: string
    }> = []
    
    eventAttendanceSnapshot.forEach((doc) => {
      const entryData = doc.data()
      const user = users.get(entryData.userId)
      const eventName = events.get(entryData.eventId)

      if (user && eventName) {
        records.push({
          entry: {
            id: doc.id,
            userId: entryData.userId,
            eventId: entryData.eventId,
            timestamp: timestampToDate(entryData.timestamp),
          },
          user,
          eventName,
        })
      }
    })

    console.log("[db-router] Retrieved", records.length, "event attendance records for area:", area)
    return records.sort((a, b) => b.entry.timestamp.getTime() - a.entry.timestamp.getTime())
  } catch (error) {
    console.error("[db-router] Error getting event attendance records:", error)
    return []
  }
}

// Get event by ID (area-aware)
export async function getEventByIdRouter(area: Area, eventId: string): Promise<Event | null> {
  validateAreaSpecified(area)
  
  try {
    const db = getFirestoreForArea(area)
    const eventRef = doc(db, EVENTS_COLLECTION, eventId)
    const eventSnap = await getDoc(eventRef)

    if (!eventSnap.exists()) {
      console.log("[db-router] Event not found:", eventId, "in area:", area)
      return null
    }

    const eventData = eventSnap.data()
    console.log("[db-router] Retrieved event:", eventId, "from area:", area)
    
    return {
      id: eventSnap.id,
      nombre: eventData.nombre,
      fechaApertura: timestampToDate(eventData.fechaApertura),
      fechaVencimiento: timestampToDate(eventData.fechaVencimiento || eventData.fechaCierre),
      hora: eventData.hora,
      lugar: eventData.lugar,
      activo: eventData.activo,
      createdAt: timestampToDate(eventData.createdAt),
    }
  } catch (error) {
    console.error("[db-router] Error getting event by ID:", error)
    return null
  }
}

// Get event attendees (area-aware)
export async function getEventAttendeesRouter(
  area: Area,
  eventId: string
): Promise<Array<UserProfile & { fechaAsistencia: Date }>> {
  validateAreaSpecified(area)
  
  try {
    const db = getFirestoreForArea(area)
    const eventAttendanceRef = collection(db, EVENT_ATTENDANCE_COLLECTION)
    const q = query(eventAttendanceRef, where("eventId", "==", eventId))
    const snapshot = await getDocs(q)

    console.log("[db-router] Found", snapshot.size, "attendees for event:", eventId, "in area:", area)

    const attendees: Array<UserProfile & { fechaAsistencia: Date }> = []

    for (const docSnap of snapshot.docs) {
      const attendanceData = docSnap.data()
      const userRef = doc(db, USERS_COLLECTION, attendanceData.userId)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists()) {
        const userData = userSnap.data()
        attendees.push({
          id: userSnap.id,
          ...userData,
          createdAt: timestampToDate(userData.createdAt),
          lastAttendance: timestampToDate(userData.lastAttendance),
          fechaAsistencia: timestampToDate(attendanceData.timestamp),
        } as UserProfile & { fechaAsistencia: Date })
      }
    }

    return attendees.sort((a, b) => b.fechaAsistencia.getTime() - a.fechaAsistencia.getTime())
  } catch (error) {
    console.error("[db-router] Error getting event attendees:", error)
    return []
  }
}

// ============================================================================
// GROUP ENROLLMENT FUNCTIONS (area-aware)
// ============================================================================

const GROUP_ENROLLMENTS_COLLECTION = "group_enrollments"

// Get users enrolled in a specific group (area-aware)
export async function getGroupEnrolledUsersRouter(
  area: Area,
  grupoCultural: string
): Promise<Array<UserProfile & { fechaInscripcion: Date }>> {
  validateAreaSpecified(area)
  
  try {
    const db = getFirestoreForArea(area)
    const enrollmentsRef = collection(db, GROUP_ENROLLMENTS_COLLECTION)
    const q = query(enrollmentsRef, where("grupoCultural", "==", grupoCultural))
    const snapshot = await getDocs(q)

    console.log("[db-router] Found", snapshot.size, "enrollments for group:", grupoCultural, "in area:", area)

    if (snapshot.empty) {
      return []
    }

    // Get unique user IDs and enrollment dates
    const userEnrollments = new Map<string, Date>()
    snapshot.docs.forEach(doc => {
      const data = doc.data()
      userEnrollments.set(data.userId, timestampToDate(data.enrolledAt))
    })

    const userIds = Array.from(userEnrollments.keys())
    const enrolledUsers: Array<UserProfile & { fechaInscripcion: Date }> = []

    // Fetch users in batches (Firestore 'in' limit is 10)
    const usersRef = collection(db, USERS_COLLECTION)
    for (let i = 0; i < userIds.length; i += 10) {
      const batch = userIds.slice(i, i + 10)
      const userQuery = query(usersRef, where("__name__", "in", batch))
      const userSnapshot = await getDocs(userQuery)
      
      userSnapshot.docs.forEach(doc => {
        const userData = doc.data()
        enrolledUsers.push({
          id: doc.id,
          ...userData,
          createdAt: timestampToDate(userData.createdAt),
          lastAttendance: timestampToDate(userData.lastAttendance),
          fechaInscripcion: userEnrollments.get(doc.id)!,
        } as UserProfile & { fechaInscripcion: Date })
      })
    }

    console.log("[db-router] Retrieved", enrolledUsers.length, "user profiles for group:", grupoCultural, "in area:", area)
    return enrolledUsers.sort((a, b) => b.fechaInscripcion.getTime() - a.fechaInscripcion.getTime())
  } catch (error) {
    console.error("[db-router] Error getting group enrolled users:", error)
    return []
  }
}

// Update cultural group name (area-aware)
export async function updateCulturalGroupName(area: Area, groupId: string, oldName: string, newName: string): Promise<void> {
  validateAreaSpecified(area)

  try {
    const db = getFirestoreForArea(area)

    // Check if another group with the new name already exists
    const existingGroups = await getAllCulturalGroups(area)
    if (existingGroups.some(g => g.id !== groupId && g.nombre.toLowerCase() === newName.toLowerCase())) {
      throw new Error("Ya existe un grupo con ese nombre")
    }

    // Update group name
    const groupRef = doc(db, CULTURAL_GROUPS_COLLECTION, groupId)
    await updateDoc(groupRef, { nombre: newName })

    // Update all enrollments referencing the old name
    const enrollmentsRef = collection(db, "group_enrollments")
    const enrollmentsQuery = query(enrollmentsRef, where("grupoCultural", "==", oldName))
    const enrollmentsSnapshot = await getDocs(enrollmentsQuery)
    await Promise.all(enrollmentsSnapshot.docs.map(d => updateDoc(d.ref, { grupoCultural: newName })))

    // Update all attendance records referencing the old name
    const attendanceRef = collection(db, "attendance_records")
    const attendanceQuery = query(attendanceRef, where("grupoCultural", "==", oldName))
    const attendanceSnapshot = await getDocs(attendanceQuery)
    await Promise.all(attendanceSnapshot.docs.map(d => updateDoc(d.ref, { grupoCultural: newName })))

    // Update group manager assignments
    const managersRef = collection(db, "group_managers")
    const managersQuery = query(managersRef, where("grupoCultural", "==", oldName))
    const managersSnapshot = await getDocs(managersQuery)
    await Promise.all(managersSnapshot.docs.map(d => updateDoc(d.ref, { grupoCultural: newName })))

    console.log("[db-router] Group name updated from", oldName, "to", newName, "in area:", area)
  } catch (error) {
    console.error("[db-router] Error updating cultural group name:", error)
    throw error
  }
}

// Delete cultural group (area-aware)
export async function deleteCulturalGroup(area: Area, groupId: string, groupName: string): Promise<void> {
  validateAreaSpecified(area)

  try {
    const db = getFirestoreForArea(area)

    // Delete the group document
    const groupRef = doc(db, CULTURAL_GROUPS_COLLECTION, groupId)
    await deleteDoc(groupRef)

    // Delete all enrollments for this group
    const enrollmentsRef = collection(db, "group_enrollments")
    const enrollmentsQuery = query(enrollmentsRef, where("grupoCultural", "==", groupName))
    const enrollmentsSnapshot = await getDocs(enrollmentsQuery)
    await Promise.all(enrollmentsSnapshot.docs.map(d => deleteDoc(d.ref)))

    // Remove group manager assignments
    const managersRef = collection(db, "group_managers")
    const managersQuery = query(managersRef, where("grupoCultural", "==", groupName))
    const managersSnapshot = await getDocs(managersQuery)
    await Promise.all(managersSnapshot.docs.map(d => deleteDoc(d.ref)))

    console.log("[db-router] Group deleted:", groupName, "in area:", area)
  } catch (error) {
    console.error("[db-router] Error deleting cultural group:", error)
    throw error
  }
}

// ============================================================================
// REAL EVENTS (eventos reales, separados de convocatorias)
// Colección: real_events / real_event_attendance_records
// ============================================================================

const REAL_EVENTS_COLLECTION = "real_events"
const REAL_EVENT_ATTENDANCE_COLLECTION = "real_event_attendance_records"

export async function getAllRealEvents(area: Area): Promise<Event[]> {
  validateAreaSpecified(area)
  try {
    const db = getFirestoreForArea(area)
    const ref = collection(db, REAL_EVENTS_COLLECTION)
    const snapshot = await getDocs(ref)
    const events: Event[] = []
    snapshot.forEach((d) => {
      const data = d.data()
      events.push({
        id: d.id,
        ...data,
        fechaApertura: timestampToDate(data.fechaApertura),
        fechaVencimiento: timestampToDate(data.fechaVencimiento),
        createdAt: timestampToDate(data.createdAt),
        ...(data.fechaEvento ? { fechaEvento: timestampToDate(data.fechaEvento) } : {}),
      } as Event)
    })
    return events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch (error) {
    console.error("[db-router] Error getting real events:", error)
    throw error
  }
}

export async function getActiveRealEvents(area: Area): Promise<Event[]> {
  validateAreaSpecified(area)
  const all = await getAllRealEvents(area)
  const now = new Date()
  return all.filter(e => e.activo && new Date(e.fechaApertura) <= now && new Date(e.fechaVencimiento) >= now)
}

export async function createRealEvent(area: Area, eventData: Omit<Event, "id" | "createdAt" | "activo">): Promise<string> {
  validateAreaSpecified(area)
  try {
    const db = getFirestoreForArea(area)
    const ref = collection(db, REAL_EVENTS_COLLECTION)
    const docRef = await addDoc(ref, {
      ...eventData,
      fechaApertura: Timestamp.fromDate(new Date(eventData.fechaApertura)),
      fechaVencimiento: Timestamp.fromDate(new Date(eventData.fechaVencimiento)),
      ...(eventData.fechaEvento ? { fechaEvento: Timestamp.fromDate(new Date(eventData.fechaEvento)) } : {}),
      createdAt: serverTimestamp(),
      activo: true,
    })
    return docRef.id
  } catch (error) {
    console.error("[db-router] Error creating real event:", error)
    throw error
  }
}

export async function deleteRealEvent(area: Area, eventId: string): Promise<void> {
  validateAreaSpecified(area)
  try {
    const db = getFirestoreForArea(area)
    await deleteDoc(doc(db, REAL_EVENTS_COLLECTION, eventId))
    // Eliminar asistencias asociadas
    const attRef = collection(db, REAL_EVENT_ATTENDANCE_COLLECTION)
    const q = query(attRef, where("eventId", "==", eventId))
    const snap = await getDocs(q)
    await Promise.all(snap.docs.map(d => deleteDoc(d.ref)))
  } catch (error) {
    console.error("[db-router] Error deleting real event:", error)
    throw error
  }
}

export async function toggleRealEventActive(area: Area, eventId: string, activo: boolean): Promise<void> {
  validateAreaSpecified(area)
  try {
    const db = getFirestoreForArea(area)
    await updateDoc(doc(db, REAL_EVENTS_COLLECTION, eventId), { activo })
  } catch (error) {
    console.error("[db-router] Error toggling real event:", error)
    throw error
  }
}

export async function updateRealEvent(area: Area, eventId: string, eventData: Omit<Event, "id" | "createdAt" | "activo">): Promise<void> {
  validateAreaSpecified(area)
  try {
    const db = getFirestoreForArea(area)
    await updateDoc(doc(db, REAL_EVENTS_COLLECTION, eventId), {
      nombre: eventData.nombre,
      hora: eventData.hora,
      lugar: eventData.lugar,
      fechaApertura: Timestamp.fromDate(new Date(eventData.fechaApertura)),
      fechaVencimiento: Timestamp.fromDate(new Date(eventData.fechaVencimiento)),
      ...(eventData.fechaEvento
        ? { fechaEvento: Timestamp.fromDate(new Date(eventData.fechaEvento)) }
        : { fechaEvento: null }),
    })
    console.log("[db-router] Real event updated:", eventId, "in area:", area)
  } catch (error) {
    console.error("[db-router] Error updating real event:", error)
    throw error
  }
}

export async function getRealEventByIdRouter(area: Area, eventId: string): Promise<Event | null> {
  validateAreaSpecified(area)
  try {
    const db = getFirestoreForArea(area)
    const snap = await getDoc(doc(db, REAL_EVENTS_COLLECTION, eventId))
    if (!snap.exists()) return null
    const d = snap.data()
    return {
      id: snap.id,
      nombre: d.nombre,
      hora: d.hora,
      lugar: d.lugar,
      activo: d.activo,
      fechaApertura: timestampToDate(d.fechaApertura),
      fechaVencimiento: timestampToDate(d.fechaVencimiento),
      createdAt: timestampToDate(d.createdAt),
      ...(d.fechaEvento ? { fechaEvento: timestampToDate(d.fechaEvento) } : {}),
    }
  } catch (error) {
    console.error("[db-router] Error getting real event by ID:", error)
    return null
  }
}

export async function getRealEventAttendeesRouter(
  area: Area,
  eventId: string
): Promise<Array<UserProfile & { fechaAsistencia: Date }>> {
  validateAreaSpecified(area)
  try {
    const db = getFirestoreForArea(area)
    const attRef = collection(db, REAL_EVENT_ATTENDANCE_COLLECTION)
    const q = query(attRef, where("eventId", "==", eventId))
    const snap = await getDocs(q)
    const attendees: Array<UserProfile & { fechaAsistencia: Date }> = []
    for (const docSnap of snap.docs) {
      const data = docSnap.data()
      const userSnap = await getDoc(doc(db, USERS_COLLECTION, data.userId))
      if (userSnap.exists()) {
        const u = userSnap.data()
        attendees.push({
          id: userSnap.id,
          ...u,
          createdAt: timestampToDate(u.createdAt),
          lastAttendance: timestampToDate(u.lastAttendance),
          fechaAsistencia: timestampToDate(data.timestamp),
        } as UserProfile & { fechaAsistencia: Date })
      }
    }
    return attendees.sort((a, b) => b.fechaAsistencia.getTime() - a.fechaAsistencia.getTime())
  } catch (error) {
    console.error("[db-router] Error getting real event attendees:", error)
    return []
  }
}

export async function saveRealEventAttendance(area: Area, userId: string, eventId: string): Promise<void> {
  validateAreaSpecified(area)
  try {
    const db = getFirestoreForArea(area)
    const attRef = collection(db, REAL_EVENT_ATTENDANCE_COLLECTION)
    const existing = query(attRef, where("userId", "==", userId), where("eventId", "==", eventId))
    const snap = await getDocs(existing)
    if (!snap.empty) throw new Error("Ya estás inscrito en este evento")
    await addDoc(attRef, { userId, eventId, timestamp: Timestamp.fromDate(new Date()) })
    await updateDoc(doc(db, USERS_COLLECTION, userId), { lastAttendance: Timestamp.fromDate(new Date()) })
  } catch (error) {
    console.error("[db-router] Error saving real event attendance:", error)
    throw error
  }
}

export async function getUserRealEventEnrollments(area: Area, userId: string): Promise<string[]> {
  validateAreaSpecified(area)
  try {
    const db = getFirestoreForArea(area)
    const attRef = collection(db, REAL_EVENT_ATTENDANCE_COLLECTION)
    const q = query(attRef, where("userId", "==", userId))
    const snap = await getDocs(q)
    return snap.docs.map(d => d.data().eventId as string)
  } catch (error) {
    console.error("[db-router] Error getting user real event enrollments:", error)
    return []
  }
}

export async function getRealEventAttendanceRecords(area: Area): Promise<Array<{
  entry: { id: string; userId: string; eventId: string; timestamp: Date }
  user: UserProfile
  eventName: string
}>> {
  validateAreaSpecified(area)
  try {
    const db = getFirestoreForArea(area)
    const [usersSnap, attSnap, eventsSnap] = await Promise.all([
      getDocs(collection(db, USERS_COLLECTION)),
      getDocs(collection(db, REAL_EVENT_ATTENDANCE_COLLECTION)),
      getDocs(collection(db, REAL_EVENTS_COLLECTION)),
    ])
    const users = new Map<string, UserProfile>()
    usersSnap.forEach(d => {
      const data = d.data()
      users.set(d.id, { id: d.id, ...data, createdAt: timestampToDate(data.createdAt), lastAttendance: timestampToDate(data.lastAttendance) } as UserProfile)
    })
    const events = new Map<string, string>()
    eventsSnap.forEach(d => events.set(d.id, d.data().nombre))

    const records: Array<{ entry: { id: string; userId: string; eventId: string; timestamp: Date }; user: UserProfile; eventName: string }> = []
    attSnap.forEach(d => {
      const data = d.data()
      const user = users.get(data.userId)
      if (user) {
        records.push({
          entry: { id: d.id, userId: data.userId, eventId: data.eventId, timestamp: timestampToDate(data.timestamp) },
          user,
          eventName: events.get(data.eventId) || "Evento desconocido",
        })
      }
    })
    return records
  } catch (error) {
    console.error("[db-router] Error getting real event attendance records:", error)
    throw error
  }
}

// ============================================================================
// REPRESENTACIONES (listas de usuarios por grupo para eventos)
// ============================================================================

const REPRESENTACIONES_COLLECTION = "representaciones"

export interface RepresentacionMember {
  userId: string
  nombres: string
  numeroDocumento: string
  genero: string
  estamento: string
  facultad?: string
  programaAcademico?: string
  grupoCultural: string
}

export interface Representacion {
  id: string
  nombre: string
  fechaEvento: string
  grupoCultural: string
  miembros: RepresentacionMember[]
  createdAt: Date
  area: Area
}

export async function createRepresentacion(
  area: Area,
  data: Omit<Representacion, "id" | "createdAt">
): Promise<string> {
  validateAreaSpecified(area)
  try {
    const db = getFirestoreForArea(area)
    const ref = collection(db, REPRESENTACIONES_COLLECTION)
    // Limpiar undefined de los miembros (Firestore no acepta undefined)
    const cleanMiembros = data.miembros.map(m => ({
      userId: m.userId,
      nombres: m.nombres,
      numeroDocumento: m.numeroDocumento,
      genero: m.genero,
      estamento: m.estamento,
      grupoCultural: m.grupoCultural,
      ...(m.facultad ? { facultad: m.facultad } : {}),
      ...(m.programaAcademico ? { programaAcademico: m.programaAcademico } : {}),
    }))
    const docRef = await addDoc(ref, {
      ...data,
      miembros: cleanMiembros,
      createdAt: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    console.error("[db-router] Error creating representacion:", error)
    throw error
  }
}

export async function getAllRepresentaciones(area: Area): Promise<Representacion[]> {
  validateAreaSpecified(area)
  try {
    const db = getFirestoreForArea(area)
    const ref = collection(db, REPRESENTACIONES_COLLECTION)
    const q = query(ref, where("area", "==", area))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      createdAt: timestampToDate(d.data().createdAt),
    } as Representacion)).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  } catch (error) {
    console.error("[db-router] Error getting representaciones:", error)
    throw error
  }
}

export async function updateRepresentacion(
  area: Area,
  id: string,
  data: Partial<Pick<Representacion, "nombre" | "fechaEvento" | "grupoCultural" | "miembros">>
): Promise<void> {
  validateAreaSpecified(area)
  try {
    const db = getFirestoreForArea(area)
    const cleanData: Record<string, any> = { ...data }
    if (data.miembros) {
      cleanData.miembros = data.miembros.map(m => ({
        userId: m.userId,
        nombres: m.nombres,
        numeroDocumento: m.numeroDocumento,
        genero: m.genero,
        estamento: m.estamento,
        grupoCultural: m.grupoCultural,
        ...(m.facultad ? { facultad: m.facultad } : {}),
        ...(m.programaAcademico ? { programaAcademico: m.programaAcademico } : {}),
      }))
    }
    await updateDoc(doc(db, REPRESENTACIONES_COLLECTION, id), cleanData)
  } catch (error) {
    console.error("[db-router] Error updating representacion:", error)
    throw error
  }
}

export async function deleteRepresentacion(area: Area, id: string): Promise<void> {
  validateAreaSpecified(area)
  try {
    const db = getFirestoreForArea(area)
    await deleteDoc(doc(db, REPRESENTACIONES_COLLECTION, id))
  } catch (error) {
    console.error("[db-router] Error deleting representacion:", error)
    throw error
  }
}

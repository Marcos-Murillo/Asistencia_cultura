import { collection, doc, getDoc, getDocs, setDoc, query, where, updateDoc, deleteDoc } from "firebase/firestore"
import { db } from "./firebase"
import { getFirestoreForArea, type Area } from './firebase-config'
import type { AdminUser, GroupManager, UserProfile, UserRole } from "./types"

const ADMIN_USERS_COLLECTION = "admin_users"
const GROUP_MANAGERS_COLLECTION = "group_managers"
const USERS_COLLECTION = "user_profiles"

// Super Admin credentials - MOVED TO ENVIRONMENT VARIABLES
// Set NEXT_PUBLIC_SUPER_ADMIN_USER and NEXT_PUBLIC_SUPER_ADMIN_PASSWORD in .env.local
const SUPER_ADMIN = {
  usuario: process.env.NEXT_PUBLIC_SUPER_ADMIN_USER || "",
  password: process.env.NEXT_PUBLIC_SUPER_ADMIN_PASSWORD || "",
}

// Verificar super admin
export function verifySuperAdmin(usuario: string, password: string): UserRole | null {
  if (!SUPER_ADMIN.usuario || !SUPER_ADMIN.password) {
    console.error("Super admin credentials not configured in environment variables")
    return null
  }
  
  if (usuario === SUPER_ADMIN.usuario && password === SUPER_ADMIN.password) {
    return "SUPER_ADMIN"
  }
  return null
}

// Crear usuario admin
export async function createAdminUser(
  numeroDocumento: string,
  correo: string,
  nombres: string,
  password: string,
  area: Area,
  createdBy: string,
): Promise<void> {
  try {
    const db = getFirestoreForArea(area)
    const adminRef = doc(collection(db, ADMIN_USERS_COLLECTION))
    await setDoc(adminRef, {
      numeroDocumento,
      correo,
      nombres,
      password,
      area,
      createdAt: new Date(),
      createdBy,
    })
  } catch (error) {
    console.error("Error creating admin user:", error)
    throw error
  }
}

// Actualizar usuario admin
export async function updateAdminUser(
  adminId: string,
  originalArea: Area,
  updates: {
    nombres?: string
    correo?: string
    password?: string
    area?: Area
  }
): Promise<void> {
  try {
    // Si el área cambió, necesitamos mover el documento
    if (updates.area && updates.area !== originalArea) {
      // Obtener el documento original
      const originalDb = getFirestoreForArea(originalArea)
      const originalRef = doc(originalDb, ADMIN_USERS_COLLECTION, adminId)
      const originalDoc = await getDoc(originalRef)
      
      if (!originalDoc.exists()) {
        throw new Error("Admin no encontrado")
      }
      
      // Crear en la nueva área
      const newDb = getFirestoreForArea(updates.area)
      const newRef = doc(collection(newDb, ADMIN_USERS_COLLECTION))
      await setDoc(newRef, {
        ...originalDoc.data(),
        ...updates,
      })
      
      // Eliminar de la área original
      await deleteDoc(originalRef)
    } else {
      // Actualizar en la misma área
      const db = getFirestoreForArea(originalArea)
      const adminRef = doc(db, ADMIN_USERS_COLLECTION, adminId)
      await updateDoc(adminRef, updates)
    }
  } catch (error) {
    console.error("Error updating admin user:", error)
    throw error
  }
}

// Verificar si es admin con contraseña
export async function verifyAdminWithPassword(
  area: Area,
  numeroDocumento: string,
  password: string
): Promise<AdminUser | null> {
  try {
    const db = getFirestoreForArea(area)
    const adminsRef = collection(db, ADMIN_USERS_COLLECTION)
    const q = query(
      adminsRef,
      where("numeroDocumento", "==", numeroDocumento),
      where("password", "==", password),
      where("area", "==", area)
    )
    const snapshot = await getDocs(q)

    if (snapshot.empty) return null

    const doc = snapshot.docs[0]
    return {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    } as AdminUser
  } catch (error) {
    console.error("Error verifying admin:", error)
    return null
  }
}

// Verificar si es admin
export async function verifyAdmin(area: Area, numeroDocumento: string, correo: string): Promise<AdminUser | null> {
  try {
    const db = getFirestoreForArea(area)
    const adminsRef = collection(db, ADMIN_USERS_COLLECTION)
    const q = query(
      adminsRef,
      where("numeroDocumento", "==", numeroDocumento),
      where("correo", "==", correo),
      where("area", "==", area)
    )
    const snapshot = await getDocs(q)

    if (snapshot.empty) return null

    const doc = snapshot.docs[0]
    return {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    } as AdminUser
  } catch (error) {
    console.error("Error verifying admin:", error)
    return null
  }
}

// Verificar admin en ambas áreas (para login)
export async function verifyAdminAnyArea(numeroDocumento: string, password: string): Promise<{ admin: AdminUser; area: Area } | null> {
  try {
    // Intentar en cultura primero
    const culturaAdmin = await verifyAdminWithPassword('cultura', numeroDocumento, password)
    if (culturaAdmin) {
      return { admin: culturaAdmin, area: 'cultura' }
    }
    
    // Intentar en deporte
    const deporteAdmin = await verifyAdminWithPassword('deporte', numeroDocumento, password)
    if (deporteAdmin) {
      return { admin: deporteAdmin, area: 'deporte' }
    }
    
    return null
  } catch (error) {
    console.error("Error verifying admin in any area:", error)
    return null
  }
}

// Obtener todos los admins de ambas áreas
export async function getAllAdmins(): Promise<(AdminUser & { areaLabel: string })[]> {
  try {
    const culturaDb = getFirestoreForArea('cultura')
    const deporteDb = getFirestoreForArea('deporte')
    
    const [culturaSnapshot, deporteSnapshot] = await Promise.all([
      getDocs(collection(culturaDb, ADMIN_USERS_COLLECTION)),
      getDocs(collection(deporteDb, ADMIN_USERS_COLLECTION))
    ])

    const culturaAdmins = culturaSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      areaLabel: 'Cultura',
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as (AdminUser & { areaLabel: string })[]
    
    const deporteAdmins = deporteSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      areaLabel: 'Deporte',
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as (AdminUser & { areaLabel: string })[]

    return [...culturaAdmins, ...deporteAdmins]
  } catch (error) {
    console.error("Error getting admins:", error)
    return []
  }
}

// Actualizar rol de usuario
export async function updateUserRole(userId: string, rol: UserRole): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId)
    await updateDoc(userRef, { rol })
  } catch (error) {
    console.error("Error updating user role:", error)
    throw error
  }
}

// Asignar encargado a grupo
export async function assignGroupManager(
  userId: string,
  grupoCultural: string,
  assignedBy: string,
): Promise<void> {
  try {
    // Verificar que el usuario no esté encargado de otro grupo
    const managersRef = collection(db, GROUP_MANAGERS_COLLECTION)
    const q = query(managersRef, where("userId", "==", userId))
    const snapshot = await getDocs(q)

    if (!snapshot.empty) {
      throw new Error("Este usuario ya está encargado de otro grupo")
    }

    const managerRef = doc(collection(db, GROUP_MANAGERS_COLLECTION))
    await setDoc(managerRef, {
      userId,
      grupoCultural,
      assignedAt: new Date(),
      assignedBy,
    })
  } catch (error) {
    console.error("Error assigning group manager:", error)
    throw error
  }
}

// Obtener encargados de un grupo
export async function getGroupManagers(grupoCultural: string): Promise<(GroupManager & { user: UserProfile })[]> {
  try {
    const managersRef = collection(db, GROUP_MANAGERS_COLLECTION)
    const q = query(managersRef, where("grupoCultural", "==", grupoCultural))
    const snapshot = await getDocs(q)

    const managers: (GroupManager & { user: UserProfile })[] = []

    for (const docSnap of snapshot.docs) {
      const managerData = docSnap.data()
      const userRef = doc(db, USERS_COLLECTION, managerData.userId)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists()) {
        managers.push({
          id: docSnap.id,
          userId: managerData.userId,
          grupoCultural: managerData.grupoCultural,
          assignedAt: managerData.assignedAt?.toDate() || new Date(),
          assignedBy: managerData.assignedBy,
          user: {
            id: userSnap.id,
            ...userSnap.data(),
            createdAt: userSnap.data().createdAt?.toDate() || new Date(),
            lastAttendance: userSnap.data().lastAttendance?.toDate() || new Date(),
          } as UserProfile,
        })
      }
    }

    return managers
  } catch (error) {
    console.error("Error getting group managers:", error)
    return []
  }
}

const MANAGER_ROLES = new Set(["DIRECTOR", "MONITOR", "ENTRENADOR"])

function normalizeDocumento(value: string): string {
  return String(value ?? "").trim().replace(/\s+/g, "")
}

function normalizeEmail(value: string): string {
  return String(value ?? "").trim().toLowerCase()
}

function normalizeRole(value: unknown): string {
  return String(value ?? "").trim().toUpperCase()
}

export type GroupManagerAuthFailureReason = "not_found" | "wrong_role" | "no_group"

export type FisioterapeutaAuthResult = {
  user: UserProfile
  area: Area
  esEncargado: boolean
}

export async function verifyFisioterapeuta(
  numeroDocumento: string,
  correo: string,
): Promise<FisioterapeutaAuthResult | null> {
  try {
    const { matches } = await findProfilesByCredentials("deporte", numeroDocumento, correo)
    const physio = matches.find((profile) => normalizeRole(profile.data.rol) === "FISIOTERAPEUTA")
    if (!physio) return null

    const user = toUserProfile(physio.id, { ...physio.data, rol: "FISIOTERAPEUTA" })
    return {
      user,
      area: "deporte",
      esEncargado: Boolean(physio.data.esFisioterapeutaEncargado),
    }
  } catch (error) {
    console.error("Error verifying fisioterapeuta:", error)
    return null
  }
}

export interface GroupManagerAuthResult {
  user: UserProfile
  grupoCultural: string
  allGroups: string[]
  area: Area
}

function toUserProfile(id: string, data: Record<string, unknown>): UserProfile {
  return {
    ...(data as unknown as UserProfile),
    id,
    rol: (normalizeRole(data.rol) || "ESTUDIANTE") as UserProfile["rol"],
    createdAt: (data.createdAt as Date) || new Date(),
    lastAttendance: (data.lastAttendance as Date) || new Date(),
  }
}

async function findProfilesByCredentials(
  area: Area,
  numeroDocumento: string,
  correo: string,
) {
  const db = getFirestoreForArea(area)
  const usersRef = collection(db, USERS_COLLECTION)
  const docKey = normalizeDocumento(numeroDocumento)
  const emailKey = normalizeEmail(correo)

  const snapshots = await Promise.all([
    getDocs(query(usersRef, where("numeroDocumento", "==", docKey))),
    /^\d+$/.test(docKey)
      ? getDocs(query(usersRef, where("numeroDocumento", "==", Number(docKey))))
      : Promise.resolve(null),
  ])

  const seen = new Set<string>()
  const matches: { id: string; data: Record<string, unknown> }[] = []

  for (const snap of snapshots) {
    if (!snap) continue
    for (const userDoc of snap.docs) {
      if (seen.has(userDoc.id)) continue
      seen.add(userDoc.id)
      const data = userDoc.data() as Record<string, unknown>
      const storedDoc = normalizeDocumento(String(data.numeroDocumento ?? ""))
      const storedEmail = normalizeEmail(String(data.correo ?? ""))
      if (storedDoc === docKey && storedEmail === emailKey) {
        matches.push({ id: userDoc.id, data })
      }
    }
  }

  return { db, matches }
}

async function getAssignedGroupsForUser(
  db: ReturnType<typeof getFirestoreForArea>,
  userId: string,
  numeroDocumento: string,
  gruposAsignados?: unknown,
): Promise<string[]> {
  const managersRef = collection(db, GROUP_MANAGERS_COLLECTION)
  const byUserId = await getDocs(query(managersRef, where("userId", "==", userId)))

  const groups = new Set<string>()
  byUserId.docs.forEach((d) => {
    const name = d.data().grupoCultural as string
    if (name) groups.add(name)
  })

  // Registros antiguos de group_managers usaban numeroDocumento en lugar de userId
  if (groups.size === 0 && numeroDocumento) {
    const byDoc = await getDocs(query(managersRef, where("numeroDocumento", "==", numeroDocumento)))
    byDoc.docs.forEach((d) => {
      const name = d.data().grupoCultural as string
      if (name) groups.add(name)
    })
  }

  if (groups.size === 0 && Array.isArray(gruposAsignados)) {
    gruposAsignados.forEach((name) => {
      if (typeof name === "string" && name.trim()) groups.add(name)
    })
  }

  return Array.from(groups)
}

// Verificar si usuario es encargado de un grupo
export async function verifyGroupManager(
  area: Area,
  numeroDocumento: string,
  correo: string,
): Promise<
  | { user: UserProfile; grupoCultural: string; allGroups: string[] }
  | { reason: GroupManagerAuthFailureReason }
> {
  try {
    const { db, matches } = await findProfilesByCredentials(area, numeroDocumento, correo)

    if (matches.length === 0) {
      console.log(`[auth] No se encontró usuario con esas credenciales en ${area}`)
      return { reason: "not_found" }
    }

    const ranked = [...matches].sort((a, b) => {
      const aManager = MANAGER_ROLES.has(normalizeRole(a.data.rol)) ? 1 : 0
      const bManager = MANAGER_ROLES.has(normalizeRole(b.data.rol)) ? 1 : 0
      return bManager - aManager
    })

    let sawManagerRole = false

    for (const profile of ranked) {
      const rol = normalizeRole(profile.data.rol)
      if (!MANAGER_ROLES.has(rol)) continue
      sawManagerRole = true

      const allGroups = await getAssignedGroupsForUser(
        db,
        profile.id,
        normalizeDocumento(String(profile.data.numeroDocumento ?? numeroDocumento)),
        profile.data.gruposAsignados,
      )

      if (allGroups.length === 0) {
        console.log(`[auth] ${rol} ${profile.id} en ${area} no tiene grupo asignado en group_managers`)
        continue
      }

      const user = toUserProfile(profile.id, { ...profile.data, rol })
      return {
        user,
        grupoCultural: allGroups[0],
        allGroups,
      }
    }

    if (sawManagerRole) {
      return { reason: "no_group" }
    }

    console.log(`[auth] Usuario encontrado en ${area} pero el rol no es DIRECTOR/MONITOR/ENTRENADOR`)
    return { reason: "wrong_role" }
  } catch (error) {
    console.error("Error verifying group manager:", error)
    return { reason: "not_found" }
  }
}

export type GroupManagerAnyAreaResult =
  | GroupManagerAuthResult
  | { error: string; reason: GroupManagerAuthFailureReason }

export async function verifyGroupManagerAnyArea(
  numeroDocumento: string,
  correo: string,
): Promise<GroupManagerAnyAreaResult> {
  try {
    const reasons: GroupManagerAuthFailureReason[] = []

    for (const area of ["cultura", "deporte"] as Area[]) {
      const result = await verifyGroupManager(area, numeroDocumento, correo)
      if (result && "user" in result && result.user) {
        return { ...result, area }
      }
      if (result && "reason" in result && result.reason) {
        reasons.push(result.reason)
      }
    }

    if (reasons.includes("no_group")) {
      return {
        reason: "no_group",
        error:
          "El usuario tiene rol de director, monitor o entrenador, pero no está asignado a ningún grupo. En Usuarios, usa Asignar como encargado y elige el grupo.",
      }
    }

    if (reasons.includes("wrong_role")) {
      return {
        reason: "wrong_role",
        error:
          "Se encontró el usuario, pero su rol no es DIRECTOR, MONITOR, ENTRENADOR ni FISIOTERAPEUTA. Revisa el rol en la ficha de Usuarios.",
      }
    }

    return {
      reason: "not_found",
      error:
        "No se encontró un director, monitor, entrenador o fisioterapeuta con ese documento y correo. Verifica que coincidan exactamente con los datos del perfil (sin espacios extra).",
    }
  } catch (error) {
    console.error("Error verifying group manager in any area:", error)
    return { reason: "not_found", error: "Error al verificar las credenciales" }
  }
}

// Remover encargado de grupo
export async function removeGroupManager(managerId: string): Promise<void> {
  try {
    const managerRef = doc(db, GROUP_MANAGERS_COLLECTION, managerId)
    await deleteDoc(managerRef)
  } catch (error) {
    console.error("Error removing group manager:", error)
    throw error
  }
}

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

// Verificar si usuario es encargado de un grupo
export async function verifyGroupManager(
  area: Area,
  numeroDocumento: string,
  correo: string,
): Promise<{ user: UserProfile; grupoCultural: string; allGroups: string[] } | null> {
  try {
    const db = getFirestoreForArea(area)
    
    // Buscar usuario
    const usersRef = collection(db, USERS_COLLECTION)
    const userQuery = query(usersRef, where("numeroDocumento", "==", numeroDocumento), where("correo", "==", correo))
    const userSnapshot = await getDocs(userQuery)

    if (userSnapshot.empty) return null

    const userDoc = userSnapshot.docs[0]
    const userData = userDoc.data() as UserProfile
    userData.id = userDoc.id

    // Verificar que tenga rol de director, monitor o entrenador
    if (userData.rol !== "DIRECTOR" && userData.rol !== "MONITOR" && userData.rol !== "ENTRENADOR") return null

    // Buscar todas las asignaciones de grupo
    const managersRef = collection(db, GROUP_MANAGERS_COLLECTION)
    const managerQuery = query(managersRef, where("userId", "==", userDoc.id))
    const managerSnapshot = await getDocs(managerQuery)

    if (managerSnapshot.empty) return null

    const allGroups = managerSnapshot.docs.map(d => d.data().grupoCultural as string)

    return {
      user: {
        ...userData,
        createdAt: userData.createdAt || new Date(),
        lastAttendance: userData.lastAttendance || new Date(),
      },
      grupoCultural: allGroups[0],
      allGroups,
    }
  } catch (error) {
    console.error("Error verifying group manager:", error)
    return null
  }
}

// Verificar group manager en ambas áreas (para login)
export async function verifyGroupManagerAnyArea(
  numeroDocumento: string,
  correo: string,
): Promise<{ user: UserProfile; grupoCultural: string; allGroups: string[]; area: Area } | null> {
  try {
    const culturaManager = await verifyGroupManager('cultura', numeroDocumento, correo)
    if (culturaManager) {
      return { ...culturaManager, area: 'cultura' }
    }
    
    const deporteManager = await verifyGroupManager('deporte', numeroDocumento, correo)
    if (deporteManager) {
      return { ...deporteManager, area: 'deporte' }
    }
    
    return null
  } catch (error) {
    console.error("Error verifying group manager in any area:", error)
    return null
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

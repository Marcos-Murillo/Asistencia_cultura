import { collection, doc, getDoc, getDocs, setDoc, query, where, updateDoc } from "firebase/firestore"
import { db } from "./firebase"
import type { AdminUser, GroupManager, UserProfile, UserRole } from "./types"

const ADMIN_USERS_COLLECTION = "admin_users"
const GROUP_MANAGERS_COLLECTION = "group_managers"
const USERS_COLLECTION = "user_profiles"

// Super Admin credentials
const SUPER_ADMIN = {
  usuario: "1007260358",
  password: "romanos812",
}

// Verificar super admin
export function verifySuperAdmin(usuario: string, password: string): boolean {
  return usuario === SUPER_ADMIN.usuario && password === SUPER_ADMIN.password
}

// Crear usuario admin
export async function createAdminUser(
  numeroDocumento: string,
  correo: string,
  nombres: string,
  createdBy: string,
): Promise<void> {
  try {
    const adminRef = doc(collection(db, ADMIN_USERS_COLLECTION))
    await setDoc(adminRef, {
      numeroDocumento,
      correo,
      nombres,
      createdAt: new Date(),
      createdBy,
    })
  } catch (error) {
    console.error("Error creating admin user:", error)
    throw error
  }
}

// Verificar si es admin
export async function verifyAdmin(numeroDocumento: string, correo: string): Promise<AdminUser | null> {
  try {
    const adminsRef = collection(db, ADMIN_USERS_COLLECTION)
    const q = query(adminsRef, where("numeroDocumento", "==", numeroDocumento), where("correo", "==", correo))
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

// Obtener todos los admins
export async function getAllAdmins(): Promise<AdminUser[]> {
  try {
    const adminsRef = collection(db, ADMIN_USERS_COLLECTION)
    const snapshot = await getDocs(adminsRef)

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as AdminUser[]
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
  numeroDocumento: string,
  correo: string,
): Promise<{ user: UserProfile; grupoCultural: string } | null> {
  try {
    // Buscar usuario
    const usersRef = collection(db, USERS_COLLECTION)
    const userQuery = query(usersRef, where("numeroDocumento", "==", numeroDocumento), where("correo", "==", correo))
    const userSnapshot = await getDocs(userQuery)

    if (userSnapshot.empty) return null

    const userDoc = userSnapshot.docs[0]
    const userData = userDoc.data() as UserProfile
    userData.id = userDoc.id

    // Verificar que tenga rol de director o monitor
    if (userData.rol !== "DIRECTOR" && userData.rol !== "MONITOR") return null

    // Buscar asignación de grupo
    const managersRef = collection(db, GROUP_MANAGERS_COLLECTION)
    const managerQuery = query(managersRef, where("userId", "==", userDoc.id))
    const managerSnapshot = await getDocs(managerQuery)

    if (managerSnapshot.empty) return null

    const managerData = managerSnapshot.docs[0].data()

    return {
      user: {
        ...userData,
        createdAt: userData.createdAt || new Date(),
        lastAttendance: userData.lastAttendance || new Date(),
      },
      grupoCultural: managerData.grupoCultural,
    }
  } catch (error) {
    console.error("Error verifying group manager:", error)
    return null
  }
}

// Remover encargado de grupo
export async function removeGroupManager(managerId: string): Promise<void> {
  try {
    const managerRef = doc(db, GROUP_MANAGERS_COLLECTION, managerId)
    await updateDoc(managerRef, { removed: true, removedAt: new Date() })
  } catch (error) {
    console.error("Error removing group manager:", error)
    throw error
  }
}

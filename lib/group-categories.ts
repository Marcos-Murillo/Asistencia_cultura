import { collection, doc, setDoc, getDocs, query, where, deleteDoc } from "firebase/firestore"
import { db } from "./firebase"
import type { GroupCategory, GroupCategoryAssignment } from "./types"

const GROUP_CATEGORIES_COLLECTION = "group_category_assignments"

// Asignar usuarios a una categoría de grupo
export async function assignUsersToCategory(
  userIds: string[],
  grupoCultural: string,
  category: GroupCategory,
): Promise<void> {
  try {
    const promises = userIds.map(async (userId) => {
      // Primero eliminar asignación anterior si existe
      await removeUserFromAllCategories(userId, grupoCultural)
      
      // Crear nueva asignación
      const assignmentRef = doc(collection(db, GROUP_CATEGORIES_COLLECTION))
      await setDoc(assignmentRef, {
        userId,
        grupoCultural,
        category,
        assignedAt: new Date(),
      })
    })

    await Promise.all(promises)
  } catch (error) {
    console.error("Error assigning users to category:", error)
    throw error
  }
}

// Remover usuario de todas las categorías de un grupo
export async function removeUserFromAllCategories(userId: string, grupoCultural: string): Promise<void> {
  try {
    const categoriesRef = collection(db, GROUP_CATEGORIES_COLLECTION)
    const q = query(categoriesRef, where("userId", "==", userId), where("grupoCultural", "==", grupoCultural))
    const snapshot = await getDocs(q)

    const promises = snapshot.docs.map((doc) => deleteDoc(doc.ref))
    await Promise.all(promises)
  } catch (error) {
    console.error("Error removing user from categories:", error)
    throw error
  }
}

// Obtener usuarios por categoría
export async function getUsersByCategory(
  grupoCultural: string,
  category: GroupCategory,
): Promise<GroupCategoryAssignment[]> {
  try {
    const categoriesRef = collection(db, GROUP_CATEGORIES_COLLECTION)
    const q = query(categoriesRef, where("grupoCultural", "==", grupoCultural), where("category", "==", category))
    const snapshot = await getDocs(q)

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      assignedAt: doc.data().assignedAt?.toDate() || new Date(),
    })) as GroupCategoryAssignment[]
  } catch (error) {
    console.error("Error getting users by category:", error)
    return []
  }
}

// Obtener categoría de un usuario en un grupo
export async function getUserCategory(userId: string, grupoCultural: string): Promise<GroupCategory | null> {
  try {
    const categoriesRef = collection(db, GROUP_CATEGORIES_COLLECTION)
    const q = query(categoriesRef, where("userId", "==", userId), where("grupoCultural", "==", grupoCultural))
    const snapshot = await getDocs(q)

    if (snapshot.empty) return null

    return snapshot.docs[0].data().category as GroupCategory
  } catch (error) {
    console.error("Error getting user category:", error)
    return null
  }
}

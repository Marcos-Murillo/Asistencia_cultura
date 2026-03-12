/**
 * Script de diagnóstico para verificar grupos en base de datos de deporte
 * 
 * Este script verifica:
 * 1. Que existan grupos en la colección cultural_groups de deporte
 * 2. Que haya inscripciones en group_enrollments de deporte
 * 3. Que los datos sean consistentes
 */

import { getFirestoreForArea } from '../lib/firebase-config'
import { collection, getDocs } from 'firebase/firestore'

async function diagnoseDeporteGroups() {
  console.log("========== DIAGNÓSTICO DE GRUPOS DE DEPORTE ==========\n")
  
  try {
    const deporteDb = getFirestoreForArea('deporte')
    
    // Verificar cultural_groups
    console.log("--- Colección: cultural_groups ---")
    const groupsRef = collection(deporteDb, 'cultural_groups')
    const groupsSnapshot = await getDocs(groupsRef)
    
    console.log(`Total de grupos: ${groupsSnapshot.size}`)
    
    if (groupsSnapshot.size > 0) {
      console.log("\nGrupos encontrados:")
      groupsSnapshot.forEach((doc, index) => {
        const data = doc.data()
        if (index < 10) { // Mostrar solo los primeros 10
          console.log(`  ${index + 1}. ${data.nombre} (ID: ${doc.id})`)
        }
      })
      if (groupsSnapshot.size > 10) {
        console.log(`  ... y ${groupsSnapshot.size - 10} más`)
      }
    } else {
      console.log("  ⚠️  No se encontraron grupos en cultural_groups")
      console.log("  💡 Sugerencia: Ejecuta el botón 'Inicializar Grupos Deportivos' desde super-admin")
    }
    
    // Verificar group_enrollments
    console.log("\n--- Colección: group_enrollments ---")
    const enrollmentsRef = collection(deporteDb, 'group_enrollments')
    const enrollmentsSnapshot = await getDocs(enrollmentsRef)
    
    console.log(`Total de inscripciones: ${enrollmentsSnapshot.size}`)
    
    if (enrollmentsSnapshot.size > 0) {
      // Contar inscripciones por grupo
      const enrollmentsByGroup = new Map<string, number>()
      enrollmentsSnapshot.forEach((doc) => {
        const data = doc.data()
        const count = enrollmentsByGroup.get(data.grupoCultural) || 0
        enrollmentsByGroup.set(data.grupoCultural, count + 1)
      })
      
      console.log("\nInscripciones por grupo:")
      Array.from(enrollmentsByGroup.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([grupo, count]) => {
          console.log(`  - ${grupo}: ${count} inscrito(s)`)
        })
    } else {
      console.log("  ℹ️  No hay inscripciones todavía")
    }
    
    // Verificar user_profiles
    console.log("\n--- Colección: user_profiles ---")
    const usersRef = collection(deporteDb, 'user_profiles')
    const usersSnapshot = await getDocs(usersRef)
    
    console.log(`Total de usuarios: ${usersSnapshot.size}`)
    
    if (usersSnapshot.size > 0) {
      console.log("\nPrimeros 5 usuarios:")
      usersSnapshot.docs.slice(0, 5).forEach((doc, index) => {
        const data = doc.data()
        console.log(`  ${index + 1}. ${data.nombres} (${data.numeroDocumento})`)
      })
    } else {
      console.log("  ℹ️  No hay usuarios registrados en deporte todavía")
    }
    
  } catch (error) {
    console.error("Error al diagnosticar:", error)
  }
  
  console.log("\n========== FIN DEL DIAGNÓSTICO ==========")
}

// Ejecutar diagnóstico
diagnoseDeporteGroups().catch(console.error)

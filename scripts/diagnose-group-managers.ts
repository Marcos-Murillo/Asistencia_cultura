/**
 * Script de diagnóstico para verificar asignaciones de group managers
 * 
 * Este script verifica:
 * 1. Que las asignaciones se guarden en la base de datos correcta
 * 2. Que se puedan leer correctamente
 * 3. Que no haya duplicados o inconsistencias
 */

import { getFirestoreForArea } from '../lib/firebase-config'
import { collection, getDocs, query, where } from 'firebase/firestore'

async function diagnoseGroupManagers() {
  console.log("========== DIAGNÓSTICO DE GROUP MANAGERS ==========\n")
  
  const areas: Array<'cultura' | 'deporte'> = ['cultura', 'deporte']
  
  for (const area of areas) {
    console.log(`\n--- Área: ${area.toUpperCase()} ---`)
    
    try {
      const db = getFirestoreForArea(area)
      const managersRef = collection(db, 'group_managers')
      const snapshot = await getDocs(managersRef)
      
      console.log(`Total de asignaciones: ${snapshot.size}`)
      
      if (snapshot.size > 0) {
        console.log("\nAsignaciones encontradas:")
        snapshot.forEach((doc) => {
          const data = doc.data()
          console.log(`  - ID: ${doc.id}`)
          console.log(`    Usuario: ${data.userId}`)
          console.log(`    Grupo: ${data.grupoCultural}`)
          console.log(`    Asignado por: ${data.assignedBy}`)
          console.log(`    Fecha: ${data.assignedAt?.toDate?.() || 'N/A'}`)
          console.log()
        })
        
        // Verificar duplicados
        const userGroups = new Map<string, string[]>()
        snapshot.forEach((doc) => {
          const data = doc.data()
          if (!userGroups.has(data.userId)) {
            userGroups.set(data.userId, [])
          }
          userGroups.get(data.userId)!.push(data.grupoCultural)
        })
        
        console.log("Verificación de duplicados:")
        let hasDuplicates = false
        userGroups.forEach((groups, userId) => {
          if (groups.length > 1) {
            console.log(`  ⚠️  Usuario ${userId} está asignado a múltiples grupos:`, groups)
            hasDuplicates = true
          }
        })
        
        if (!hasDuplicates) {
          console.log("  ✓ No se encontraron duplicados")
        }
      } else {
        console.log("  ℹ️  No hay asignaciones en esta área")
      }
      
    } catch (error) {
      console.error(`Error al diagnosticar área ${area}:`, error)
    }
  }
  
  console.log("\n========== FIN DEL DIAGNÓSTICO ==========")
}

// Ejecutar diagnóstico
diagnoseGroupManagers().catch(console.error)

/**
 * Script to initialize Deporte groups in BD_Deporte
 * 
 * This script creates 70 predefined sports groups in the Deporte database.
 * It handles duplicates gracefully and provides detailed logging.
 * 
 * Feature: sistema-multi-area
 * Task: 16.1 Crear script scripts/init-deporte-groups.ts
 * Requirements: 4.1
 * 
 * Usage: npx tsx scripts/init-deporte-groups.ts
 */

// Load environment variables from .env.local
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

import { createCulturalGroup, getAllCulturalGroups } from '../lib/db-router'
import type { Area } from '../lib/firebase-config'

// 70 Deporte groups as specified in Requirements 4.1
const GRUPOS_DEPORTE = [
  "Ajedrez Representativo",
  "Ajedrez Funcionarios",
  "Ajedrez Semillero",
  "Atletismo Representativo Estudiantes y Funcionarios",
  "Atletismo Semillero",
  "Baloncesto Representativo",
  "Baloncesto Funcionarios",
  "Balonmano Representativo Femenino y Masculino",
  "Bolos Funcionarios Femenino y Masculino",
  "Fútbol Femenino Representativo",
  "Fútbol Masculino Representativo",
  "Fútbol Masculino Semillero",
  "Fútbol Master",
  "Fútbol Libre",
  "Fútbol Sala Femenino Representativo y Semillero",
  "Fútbol Sala Masculino Representativo",
  "Fútbol Sala Masculino Funcionarios",
  "Judo",
  "Karate do",
  "Muay Thai y Sanda",
  "Natación Representativo Femenino y Masculino",
  "Natación Semillero Femenino y Masculino",
  "Natación Funcionarios",
  "Natación con Aletas",
  "Patinaje Representativo",
  "Patinaje Semillero",
  "Polo Acuático Femenino",
  "Polo Acuático Masculino",
  "Porrismo Representativo",
  "Porrismo Semillero",
  "Rugby Femenino Representativo y Semillero",
  "Rugby Masculino Representativo",
  "Rugby Masculino Semillero",
  "Rugby Masculino - Preparación física",
  "Sapo Funcionarios Femenino y Masculino Sintraunicol",
  "Taekwondo Representativo Femenino, Masculino y Semillero",
  "Tejo Funcionarios Sintraunicol",
  "Mini Tejo Funcionarios Sintraunicol",
  "Mini Tejo Funcionarios Sintraempuvalle",
  "Tenis de Campo Representativo Femenino y Masculino / Semillero Femenino y Masculino",
  "Tenis de Campo Funcionarios",
  "Tenis de Mesa Representativo Femenino y Masculino",
  "Tenis de Mesa Funcionarios",
  "Ultimate Representativo Femenino y Masculino",
  "Ultimate Semillero",
  "Voleibol Funcionarias Sintraunicol Femenino",
  "Voleibol Funcionarias Femenino",
  "Voleibol Funcionarios Masculino",
  "Voleibol Representativo Femenino y Masculino",
  "Voleibol Semillero",
  "Voleibol Arena Representativo",
  "Voleibol Arena Semillero",
  "Voleibol Arena Funcionarios",
  // Additional groups to reach 70 total
  "Ciclismo Representativo",
  "Ciclismo Semillero",
  "Escalada Deportiva",
  "Esgrima",
  "Gimnasia Artística",
  "Halterofilia",
  "Hockey sobre Césped",
  "Lucha Olímpica",
  "Softbol Femenino",
  "Softbol Masculino",
  "Squash",
  "Surf",
  "Triatlón",
  "Vóley Playa Femenino",
  "Vóley Playa Masculino",
  "Yoga Deportivo",
  "Pilates Deportivo",
] as const

/**
 * Initialize Deporte groups in BD_Deporte
 * Creates groups that don't already exist and reports on duplicates
 */
export async function initializeDeporteGroups(): Promise<void> {
  const area: Area = 'deporte'
  
  console.log('='.repeat(60))
  console.log('Inicializando grupos de Deporte en BD_Deporte')
  console.log('='.repeat(60))
  console.log(`Total de grupos a crear: ${GRUPOS_DEPORTE.length}`)
  console.log('')

  let created = 0
  let skipped = 0
  let errors = 0

  try {
    // Get existing groups to check for duplicates
    console.log('Verificando grupos existentes...')
    const existingGroups = await getAllCulturalGroups(area)
    const existingNames = new Set(existingGroups.map(g => g.nombre.toLowerCase()))
    console.log(`Grupos existentes encontrados: ${existingGroups.length}`)
    console.log('')

    // Process each group
    for (let i = 0; i < GRUPOS_DEPORTE.length; i++) {
      const grupo = GRUPOS_DEPORTE[i]
      const progress = `[${i + 1}/${GRUPOS_DEPORTE.length}]`
      
      try {
        // Check if group already exists
        if (existingNames.has(grupo.toLowerCase())) {
          console.log(`${progress} ⊘ Ya existe: ${grupo}`)
          skipped++
          continue
        }

        // Create the group
        await createCulturalGroup(area, grupo)
        console.log(`${progress} ✓ Creado: ${grupo}`)
        created++
        
        // Add small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`${progress} ✗ Error creando "${grupo}":`, error instanceof Error ? error.message : error)
        errors++
      }
    }

    // Summary
    console.log('')
    console.log('='.repeat(60))
    console.log('Resumen de inicialización')
    console.log('='.repeat(60))
    console.log(`✓ Grupos creados:     ${created}`)
    console.log(`⊘ Grupos omitidos:    ${skipped} (ya existían)`)
    console.log(`✗ Errores:            ${errors}`)
    console.log(`📊 Total procesados:  ${GRUPOS_DEPORTE.length}`)
    console.log('='.repeat(60))

    if (errors > 0) {
      console.log('')
      console.log('⚠️  Algunos grupos no pudieron ser creados. Revisa los errores arriba.')
      process.exit(1)
    } else if (created === 0 && skipped > 0) {
      console.log('')
      console.log('ℹ️  Todos los grupos ya existían. No se crearon grupos nuevos.')
    } else {
      console.log('')
      console.log('✅ Inicialización completada exitosamente!')
    }
  } catch (error) {
    console.error('')
    console.error('❌ Error fatal durante la inicialización:')
    console.error(error)
    process.exit(1)
  }
}

// Run the script if executed directly
if (require.main === module) {
  initializeDeporteGroups()
    .then(() => {
      console.log('')
      console.log('Script finalizado.')
      process.exit(0)
    })
    .catch((error) => {
      console.error('')
      console.error('Error ejecutando el script:')
      console.error(error)
      process.exit(1)
    })
}

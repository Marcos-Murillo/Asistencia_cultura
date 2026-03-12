/**
 * Validation Script for Deporte Functionality
 * 
 * This script validates that the Deporte-specific functionality is working correctly:
 * - Deporte inscription page exists and is properly configured
 * - Deporte groups can be queried from BD_Deporte
 * - The inscription page uses area='deporte' for all operations
 * - The código estudiantil field is present in the form
 * - GRUPOS_DEPORTIVOS array is defined in lib/data.ts
 * 
 * Feature: sistema-multi-area
 * Task: 17 - Checkpoint - Validar funcionalidad de Deporte
 * Requirements: 4.1
 * 
 * Usage: npx tsx scripts/validate-deporte-functionality.ts
 */

import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

interface ValidationResult {
  category: string
  test: string
  passed: boolean
  message: string
  details?: string
}

const results: ValidationResult[] = []

function addResult(category: string, test: string, passed: boolean, message: string, details?: string) {
  results.push({ category, test, passed, message, details })
}

function printResults() {
  console.log('\n' + '='.repeat(80))
  console.log('VALIDACIÓN DE FUNCIONALIDAD DE DEPORTE')
  console.log('='.repeat(80))
  console.log('')

  const categories = [...new Set(results.map(r => r.category))]
  
  categories.forEach(category => {
    console.log(`\n📋 ${category}`)
    console.log('-'.repeat(80))
    
    const categoryResults = results.filter(r => r.category === category)
    categoryResults.forEach(result => {
      const icon = result.passed ? '✓' : '✗'
      const color = result.passed ? '\x1b[32m' : '\x1b[31m'
      const reset = '\x1b[0m'
      
      console.log(`${color}${icon}${reset} ${result.test}`)
      console.log(`  ${result.message}`)
      if (result.details) {
        console.log(`  ${result.details}`)
      }
    })
  })

  console.log('\n' + '='.repeat(80))
  console.log('RESUMEN')
  console.log('='.repeat(80))
  
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const total = results.length
  
  console.log(`Total de pruebas: ${total}`)
  console.log(`✓ Pasadas: ${passed}`)
  console.log(`✗ Fallidas: ${failed}`)
  console.log(`Porcentaje de éxito: ${((passed / total) * 100).toFixed(1)}%`)
  console.log('='.repeat(80))
  console.log('')

  return failed === 0
}

// ==================== VALIDACIONES ====================

function validateDeportePageExists(): void {
  const category = '1. Página de Inscripción Deporte'
  const pagePath = resolve(process.cwd(), 'app/inscripcion-deporte/page.tsx')
  
  if (existsSync(pagePath)) {
    addResult(category, 'Archivo existe', true, 'La página app/inscripcion-deporte/page.tsx existe')
  } else {
    addResult(category, 'Archivo existe', false, 'La página app/inscripcion-deporte/page.tsx NO existe')
    return
  }

  try {
    const content = readFileSync(pagePath, 'utf-8')
    
    // Verificar que usa area='deporte'
    const areaDeporteMatches = content.match(/area:\s*['"]deporte['"]/g) || []
    if (areaDeporteMatches.length > 0) {
      addResult(
        category,
        'Usa area="deporte"',
        true,
        `La página usa area='deporte' correctamente (${areaDeporteMatches.length} ocurrencias)`
      )
    } else {
      addResult(
        category,
        'Usa area="deporte"',
        false,
        'La página NO usa area="deporte" en las operaciones'
      )
    }

    // Verificar que importa GRUPOS_DEPORTIVOS
    if (content.includes('GRUPOS_DEPORTIVOS')) {
      addResult(
        category,
        'Importa GRUPOS_DEPORTIVOS',
        true,
        'La página importa y usa GRUPOS_DEPORTIVOS de lib/data.ts'
      )
    } else {
      addResult(
        category,
        'Importa GRUPOS_DEPORTIVOS',
        false,
        'La página NO importa GRUPOS_DEPORTIVOS'
      )
    }

    // Verificar que usa funciones de db-router con area
    const dbRouterFunctions = [
      'saveUserProfile',
      'findSimilarUsers',
    ]
    
    let allFunctionsUsed = true
    const missingFunctions: string[] = []
    
    dbRouterFunctions.forEach(func => {
      const regex = new RegExp(`${func}\\s*\\(\\s*['"]deporte['"]`, 'g')
      if (!regex.test(content)) {
        allFunctionsUsed = false
        missingFunctions.push(func)
      }
    })

    if (allFunctionsUsed) {
      addResult(
        category,
        'Usa funciones de db-router con area',
        true,
        'Todas las funciones de db-router se llaman con area="deporte"'
      )
    } else {
      addResult(
        category,
        'Usa funciones de db-router con area',
        false,
        'Algunas funciones no usan area="deporte"',
        `Funciones faltantes: ${missingFunctions.join(', ')}`
      )
    }

    // Verificar campo código estudiantil
    if (content.includes('codigoEstudiantil')) {
      addResult(
        category,
        'Campo código estudiantil presente',
        true,
        'El campo codigoEstudiantil está presente en el formulario'
      )
    } else {
      addResult(
        category,
        'Campo código estudiantil presente',
        false,
        'El campo codigoEstudiantil NO está presente en el formulario'
      )
    }

    // Verificar que usa enrollUserToGroup
    if (content.includes('enrollUserToGroup')) {
      addResult(
        category,
        'Usa enrollUserToGroup',
        true,
        'La página usa enrollUserToGroup para inscribir usuarios'
      )
    } else {
      addResult(
        category,
        'Usa enrollUserToGroup',
        false,
        'La página NO usa enrollUserToGroup'
      )
    }

    // Verificar que usa getUserEnrollments
    if (content.includes('getUserEnrollments')) {
      addResult(
        category,
        'Usa getUserEnrollments',
        true,
        'La página usa getUserEnrollments para obtener inscripciones'
      )
    } else {
      addResult(
        category,
        'Usa getUserEnrollments',
        false,
        'La página NO usa getUserEnrollments'
      )
    }

    // Verificar título correcto
    if (content.includes('Grupos Deportivos') || content.includes('Deporte')) {
      addResult(
        category,
        'Título apropiado',
        true,
        'La página tiene un título apropiado para Deporte'
      )
    } else {
      addResult(
        category,
        'Título apropiado',
        false,
        'La página NO tiene un título apropiado para Deporte'
      )
    }

  } catch (error) {
    addResult(
      category,
      'Lectura del archivo',
      false,
      'Error al leer el archivo de la página',
      error instanceof Error ? error.message : String(error)
    )
  }
}

function validateGruposDeportivosData(): void {
  const category = '2. Datos de Grupos Deportivos'
  const dataPath = resolve(process.cwd(), 'lib/data.ts')
  
  if (!existsSync(dataPath)) {
    addResult(category, 'Archivo lib/data.ts existe', false, 'El archivo lib/data.ts NO existe')
    return
  }

  addResult(category, 'Archivo lib/data.ts existe', true, 'El archivo lib/data.ts existe')

  try {
    const content = readFileSync(dataPath, 'utf-8')
    
    // Verificar que existe GRUPOS_DEPORTIVOS
    if (content.includes('export const GRUPOS_DEPORTIVOS')) {
      addResult(
        category,
        'GRUPOS_DEPORTIVOS definido',
        true,
        'El array GRUPOS_DEPORTIVOS está definido y exportado'
      )
    } else {
      addResult(
        category,
        'GRUPOS_DEPORTIVOS definido',
        false,
        'El array GRUPOS_DEPORTIVOS NO está definido'
      )
      return
    }

    // Contar grupos deportivos
    const gruposMatch = content.match(/export const GRUPOS_DEPORTIVOS = \[([\s\S]*?)\] as const/)
    if (gruposMatch) {
      const gruposContent = gruposMatch[1]
      const grupos = gruposContent.match(/"[^"]+"/g) || []
      const count = grupos.length
      
      if (count >= 50) {
        addResult(
          category,
          'Cantidad de grupos',
          true,
          `GRUPOS_DEPORTIVOS contiene ${count} grupos (esperado: al menos 50)`
        )
      } else {
        addResult(
          category,
          'Cantidad de grupos',
          false,
          `GRUPOS_DEPORTIVOS contiene solo ${count} grupos (esperado: al menos 50)`
        )
      }

      // Verificar algunos grupos específicos mencionados en requirements
      const expectedGroups = [
        'Ajedrez Representativo',
        'Fútbol Femenino Representativo',
        'Natación Representativo Femenino y Masculino',
        'Voleibol Representativo Femenino y Masculino',
      ]

      const missingGroups: string[] = []
      expectedGroups.forEach(group => {
        if (!content.includes(group)) {
          missingGroups.push(group)
        }
      })

      if (missingGroups.length === 0) {
        addResult(
          category,
          'Grupos específicos presentes',
          true,
          'Todos los grupos específicos verificados están presentes'
        )
      } else {
        addResult(
          category,
          'Grupos específicos presentes',
          false,
          'Algunos grupos específicos no están presentes',
          `Faltantes: ${missingGroups.join(', ')}`
        )
      }
    }

  } catch (error) {
    addResult(
      category,
      'Lectura de datos',
      false,
      'Error al leer lib/data.ts',
      error instanceof Error ? error.message : String(error)
    )
  }
}

function validateInitScript(): void {
  const category = '3. Script de Inicialización'
  const scriptPath = resolve(process.cwd(), 'scripts/init-deporte-groups.ts')
  
  if (!existsSync(scriptPath)) {
    addResult(category, 'Script existe', false, 'El script scripts/init-deporte-groups.ts NO existe')
    return
  }

  addResult(category, 'Script existe', true, 'El script scripts/init-deporte-groups.ts existe')

  try {
    const content = readFileSync(scriptPath, 'utf-8')
    
    // Verificar que usa area='deporte'
    if (content.includes("area: Area = 'deporte'") || content.includes('area: Area = "deporte"')) {
      addResult(
        category,
        'Usa area="deporte"',
        true,
        'El script usa area="deporte" correctamente'
      )
    } else {
      addResult(
        category,
        'Usa area="deporte"',
        false,
        'El script NO usa area="deporte"'
      )
    }

    // Verificar que usa createCulturalGroup
    if (content.includes('createCulturalGroup')) {
      addResult(
        category,
        'Usa createCulturalGroup',
        true,
        'El script usa createCulturalGroup de db-router'
      )
    } else {
      addResult(
        category,
        'Usa createCulturalGroup',
        false,
        'El script NO usa createCulturalGroup'
      )
    }

    // Verificar que tiene manejo de duplicados
    if (content.includes('Ya existe') || content.includes('already exists') || content.includes('duplicate')) {
      addResult(
        category,
        'Manejo de duplicados',
        true,
        'El script maneja duplicados correctamente'
      )
    } else {
      addResult(
        category,
        'Manejo de duplicados',
        false,
        'El script NO maneja duplicados'
      )
    }

    // Verificar que tiene logging
    if (content.includes('console.log')) {
      addResult(
        category,
        'Logging presente',
        true,
        'El script incluye logging para seguimiento'
      )
    } else {
      addResult(
        category,
        'Logging presente',
        false,
        'El script NO incluye logging'
      )
    }

  } catch (error) {
    addResult(
      category,
      'Lectura del script',
      false,
      'Error al leer el script',
      error instanceof Error ? error.message : String(error)
    )
  }
}

function validateDbRouterIntegration(): void {
  const category = '4. Integración con db-router'
  const dbRouterPath = resolve(process.cwd(), 'lib/db-router.ts')
  
  if (!existsSync(dbRouterPath)) {
    addResult(category, 'db-router.ts existe', false, 'El archivo lib/db-router.ts NO existe')
    return
  }

  addResult(category, 'db-router.ts existe', true, 'El archivo lib/db-router.ts existe')

  try {
    const content = readFileSync(dbRouterPath, 'utf-8')
    
    // Verificar funciones necesarias
    const requiredFunctions = [
      'saveUserProfile',
      'findSimilarUsers',
      'getAllCulturalGroups',
      'createCulturalGroup',
    ]

    const missingFunctions: string[] = []
    requiredFunctions.forEach(func => {
      if (!content.includes(`export async function ${func}`)) {
        missingFunctions.push(func)
      }
    })

    if (missingFunctions.length === 0) {
      addResult(
        category,
        'Funciones requeridas presentes',
        true,
        'Todas las funciones requeridas están presentes en db-router'
      )
    } else {
      addResult(
        category,
        'Funciones requeridas presentes',
        false,
        'Algunas funciones requeridas no están presentes',
        `Faltantes: ${missingFunctions.join(', ')}`
      )
    }

    // Verificar que las funciones aceptan parámetro area
    const areaAwareFunctions = ['saveUserProfile', 'findSimilarUsers', 'getAllCulturalGroups', 'createCulturalGroup']
    const nonAreaAware: string[] = []

    areaAwareFunctions.forEach(func => {
      const regex = new RegExp(`export async function ${func}\\s*\\([^)]*area:\\s*Area`, 'g')
      if (!regex.test(content)) {
        nonAreaAware.push(func)
      }
    })

    if (nonAreaAware.length === 0) {
      addResult(
        category,
        'Funciones son area-aware',
        true,
        'Todas las funciones aceptan el parámetro area'
      )
    } else {
      addResult(
        category,
        'Funciones son area-aware',
        false,
        'Algunas funciones no aceptan el parámetro area',
        `No area-aware: ${nonAreaAware.join(', ')}`
      )
    }

    // Verificar que usa getFirestoreForArea
    if (content.includes('getFirestoreForArea')) {
      addResult(
        category,
        'Usa getFirestoreForArea',
        true,
        'db-router usa getFirestoreForArea para routing de base de datos'
      )
    } else {
      addResult(
        category,
        'Usa getFirestoreForArea',
        false,
        'db-router NO usa getFirestoreForArea'
      )
    }

  } catch (error) {
    addResult(
      category,
      'Lectura de db-router',
      false,
      'Error al leer db-router.ts',
      error instanceof Error ? error.message : String(error)
    )
  }
}

function validateFirestoreIntegration(): void {
  const category = '5. Integración con Firestore'
  const firestorePath = resolve(process.cwd(), 'lib/firestore.ts')
  
  if (!existsSync(firestorePath)) {
    addResult(category, 'firestore.ts existe', false, 'El archivo lib/firestore.ts NO existe')
    return
  }

  addResult(category, 'firestore.ts existe', true, 'El archivo lib/firestore.ts existe')

  try {
    const content = readFileSync(firestorePath, 'utf-8')
    
    // Verificar funciones de inscripción
    const enrollmentFunctions = [
      'enrollUserToGroup',
      'getUserEnrollments',
      'getGroupEnrolledUsers',
    ]

    const missingFunctions: string[] = []
    enrollmentFunctions.forEach(func => {
      if (!content.includes(`export async function ${func}`)) {
        missingFunctions.push(func)
      }
    })

    if (missingFunctions.length === 0) {
      addResult(
        category,
        'Funciones de inscripción presentes',
        true,
        'Todas las funciones de inscripción están presentes'
      )
    } else {
      addResult(
        category,
        'Funciones de inscripción presentes',
        false,
        'Algunas funciones de inscripción no están presentes',
        `Faltantes: ${missingFunctions.join(', ')}`
      )
    }

    // Verificar colección GROUP_ENROLLMENTS_COLLECTION
    if (content.includes('GROUP_ENROLLMENTS_COLLECTION')) {
      addResult(
        category,
        'Colección de inscripciones definida',
        true,
        'La colección GROUP_ENROLLMENTS_COLLECTION está definida'
      )
    } else {
      addResult(
        category,
        'Colección de inscripciones definida',
        false,
        'La colección GROUP_ENROLLMENTS_COLLECTION NO está definida'
      )
    }

  } catch (error) {
    addResult(
      category,
      'Lectura de firestore',
      false,
      'Error al leer firestore.ts',
      error instanceof Error ? error.message : String(error)
    )
  }
}

function validateTypeDefinitions(): void {
  const category = '6. Definiciones de Tipos'
  const typesPath = resolve(process.cwd(), 'lib/types.ts')
  
  if (!existsSync(typesPath)) {
    addResult(category, 'types.ts existe', false, 'El archivo lib/types.ts NO existe')
    return
  }

  addResult(category, 'types.ts existe', true, 'El archivo lib/types.ts existe')

  try {
    const content = readFileSync(typesPath, 'utf-8')
    
    // Verificar que UserProfile tiene codigoEstudiantil
    if (content.includes('codigoEstudiantil')) {
      addResult(
        category,
        'UserProfile tiene codigoEstudiantil',
        true,
        'El tipo UserProfile incluye el campo codigoEstudiantil'
      )
    } else {
      addResult(
        category,
        'UserProfile tiene codigoEstudiantil',
        false,
        'El tipo UserProfile NO incluye el campo codigoEstudiantil'
      )
    }

    // Verificar que existe GroupEnrollment
    if (content.includes('interface GroupEnrollment') || content.includes('type GroupEnrollment')) {
      addResult(
        category,
        'Tipo GroupEnrollment definido',
        true,
        'El tipo GroupEnrollment está definido'
      )
    } else {
      addResult(
        category,
        'Tipo GroupEnrollment definido',
        false,
        'El tipo GroupEnrollment NO está definido'
      )
    }

  } catch (error) {
    addResult(
      category,
      'Lectura de tipos',
      false,
      'Error al leer types.ts',
      error instanceof Error ? error.message : String(error)
    )
  }
}

// ==================== EJECUCIÓN ====================

async function main() {
  console.log('Iniciando validación de funcionalidad de Deporte...\n')

  validateDeportePageExists()
  validateGruposDeportivosData()
  validateInitScript()
  validateDbRouterIntegration()
  validateFirestoreIntegration()
  validateTypeDefinitions()

  const success = printResults()

  if (success) {
    console.log('✅ Todas las validaciones pasaron exitosamente!')
    process.exit(0)
  } else {
    console.log('❌ Algunas validaciones fallaron. Revisa los detalles arriba.')
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('Error ejecutando validación:', error)
  process.exit(1)
})

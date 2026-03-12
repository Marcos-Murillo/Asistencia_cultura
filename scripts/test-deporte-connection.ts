/**
 * Test script to verify connection to BD_Deporte
 * Creates a single test group to verify write permissions
 * 
 * Usage: npx tsx scripts/test-deporte-connection.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

import { createCulturalGroup, getAllCulturalGroups } from '../lib/db-router'

async function testDeporteConnection() {
  console.log('='.repeat(60))
  console.log('Probando conexión a BD_Deporte')
  console.log('='.repeat(60))
  console.log('')

  try {
    // Test 1: Read existing groups
    console.log('Test 1: Leyendo grupos existentes...')
    const existingGroups = await getAllCulturalGroups('deporte')
    console.log(`✓ Lectura exitosa: ${existingGroups.length} grupos encontrados`)
    console.log('')

    // Test 2: Create a test group
    console.log('Test 2: Creando grupo de prueba...')
    const testGroupName = `TEST_GRUPO_${Date.now()}`
    
    try {
      const groupId = await createCulturalGroup('deporte', testGroupName)
      console.log(`✓ Grupo creado exitosamente con ID: ${groupId}`)
      console.log(`✓ Nombre del grupo: ${testGroupName}`)
      console.log('')
      
      // Test 3: Verify the group was created
      console.log('Test 3: Verificando que el grupo se creó...')
      const updatedGroups = await getAllCulturalGroups('deporte')
      const testGroup = updatedGroups.find(g => g.nombre === testGroupName)
      
      if (testGroup) {
        console.log(`✓ Grupo encontrado en la base de datos`)
        console.log(`  ID: ${testGroup.id}`)
        console.log(`  Nombre: ${testGroup.nombre}`)
        console.log(`  Activo: ${testGroup.activo}`)
        console.log('')
      } else {
        console.log('✗ Grupo NO encontrado después de crearlo')
        console.log('')
      }
      
      console.log('='.repeat(60))
      console.log('✅ CONEXIÓN A BD_DEPORTE FUNCIONAL')
      console.log('='.repeat(60))
      console.log('')
      console.log('Puedes proceder a ejecutar el script de inicialización:')
      console.log('  npx tsx scripts/init-deporte-groups.ts')
      console.log('')
      console.log(`Nota: Se creó un grupo de prueba "${testGroupName}"`)
      console.log('Puedes eliminarlo manualmente desde Firebase Console si lo deseas.')
      
    } catch (createError: any) {
      console.error('✗ Error al crear grupo:', createError.message)
      console.error('')
      
      if (createError.message.includes('Ya existe')) {
        console.log('ℹ️  El grupo ya existe (esto es normal si ejecutaste el test antes)')
      } else if (createError.code === 'permission-denied') {
        console.error('❌ ERROR DE PERMISOS')
        console.error('')
        console.error('Las reglas de Firestore están bloqueando la escritura.')
        console.error('Verifica las reglas en Firebase Console:')
        console.error('1. Ve a Firestore Database')
        console.error('2. Selecciona BD_Deporte')
        console.error('3. Ve a la pestaña "Reglas"')
        console.error('4. Asegúrate de que permiten escritura en desarrollo')
      } else {
        console.error('❌ ERROR DESCONOCIDO')
        console.error('Detalles:', createError)
      }
      
      process.exit(1)
    }
    
  } catch (error: any) {
    console.error('❌ Error en la prueba de conexión:', error.message)
    console.error('')
    
    if (error.code === 'app/invalid-credential') {
      console.error('Las credenciales de Firebase son inválidas.')
      console.error('Verifica las variables de entorno en .env.local')
    } else if (error.code === 'unavailable') {
      console.error('No se pudo conectar a Firebase.')
      console.error('Verifica tu conexión a internet.')
    } else {
      console.error('Detalles del error:', error)
    }
    
    process.exit(1)
  }
}

testDeporteConnection()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error fatal:', error)
    process.exit(1)
  })

/**
 * Quick script to check how many Deporte groups exist in BD_Deporte
 * 
 * Usage: npx tsx scripts/check-deporte-groups.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

import { getAllCulturalGroups } from '../lib/db-router'

async function checkDeporteGroups() {
  console.log('='.repeat(60))
  console.log('Verificando grupos en BD_Deporte')
  console.log('='.repeat(60))
  console.log('')

  try {
    const groups = await getAllCulturalGroups('deporte')
    
    console.log(`✓ Grupos encontrados: ${groups.length}`)
    console.log('')
    
    if (groups.length === 0) {
      console.log('⚠️  No se encontraron grupos en BD_Deporte')
      console.log('')
      console.log('Posibles causas:')
      console.log('1. El script init-deporte-groups.ts no se ha ejecutado')
      console.log('2. Hubo errores durante la ejecución')
      console.log('3. Estás conectado a la base de datos incorrecta')
      console.log('')
      console.log('Solución: Ejecuta el script de inicialización:')
      console.log('  npx tsx scripts/init-deporte-groups.ts')
    } else if (groups.length < 70) {
      console.log(`⚠️  Se esperaban 70 grupos, pero solo hay ${groups.length}`)
      console.log('')
      console.log('Puedes ejecutar el script nuevamente para crear los faltantes:')
      console.log('  npx tsx scripts/init-deporte-groups.ts')
      console.log('')
      console.log('Grupos existentes:')
      groups.forEach((g, i) => {
        console.log(`  ${i + 1}. ${g.nombre}`)
      })
    } else {
      console.log('✅ Todos los grupos están presentes!')
      console.log('')
      console.log('Primeros 10 grupos:')
      groups.slice(0, 10).forEach((g, i) => {
        console.log(`  ${i + 1}. ${g.nombre}`)
      })
      console.log(`  ... y ${groups.length - 10} más`)
    }
    
    console.log('')
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('❌ Error al verificar grupos:', error)
    console.error('')
    console.error('Verifica que:')
    console.error('1. Las variables de entorno estén configuradas correctamente')
    console.error('2. BD_Deporte esté configurada en Firebase')
    console.error('3. Las reglas de Firestore permitan lectura')
    process.exit(1)
  }
}

checkDeporteGroups()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })

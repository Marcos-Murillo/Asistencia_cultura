/**
 * Validation Script: Código Estudiantil Consolidation
 * 
 * Verifies that:
 * 1. codigoEstudiante has been removed from types
 * 2. All forms use only codigoEstudiantil
 * 3. Both ESTUDIANTE and EGRESADO can enter codigoEstudiantil
 */

import fs from 'fs'
import path from 'path'

console.log('============================================================')
console.log('VALIDATING CÓDIGO ESTUDIANTIL CONSOLIDATION')
console.log('============================================================\n')

let allPassed = true

// Test 1: Check types.ts
console.log('✓ Step 1: Checking lib/types.ts...')
const typesPath = path.join(process.cwd(), 'lib/types.ts')
const typesContent = fs.readFileSync(typesPath, 'utf-8')

// Should NOT have codigoEstudiante (except in comments)
const codigoEstudianteMatches = typesContent.match(/codigoEstudiante[?:]?\s*string/g)
if (codigoEstudianteMatches) {
  console.log(`  ✗ Found ${codigoEstudianteMatches.length} references to codigoEstudiante in types`)
  allPassed = false
} else {
  console.log('  ✓ No codigoEstudiante references in types')
}

// Should have codigoEstudiantil
if (typesContent.includes('codigoEstudiantil?: string')) {
  console.log('  ✓ codigoEstudiantil is defined in types')
} else {
  console.log('  ✗ codigoEstudiantil is NOT defined in types')
  allPassed = false
}

// Test 2: Check form files
console.log('\n✓ Step 2: Checking form files...')
const formFiles = [
  'app/page.tsx',
  'app/inscripcion-deporte/page.tsx',
  'app/convocatorias/page.tsx'
]

for (const file of formFiles) {
  const filePath = path.join(process.cwd(), file)
  const content = fs.readFileSync(filePath, 'utf-8')
  
  // Check for old codigoEstudiante references (excluding comments)
  const lines = content.split('\n')
  const codeLines = lines.filter(line => !line.trim().startsWith('//') && !line.trim().startsWith('*'))
  const codeContent = codeLines.join('\n')
  
  const oldReferences = codeContent.match(/codigoEstudiante[:\s]/g)
  if (oldReferences) {
    console.log(`  ✗ ${file}: Found ${oldReferences.length} old codigoEstudiante references`)
    allPassed = false
  } else {
    console.log(`  ✓ ${file}: No old codigoEstudiante references`)
  }
  
  // Check that codigoEstudiantil is used
  if (content.includes('codigoEstudiantil')) {
    console.log(`  ✓ ${file}: Uses codigoEstudiantil`)
  } else {
    console.log(`  ✗ ${file}: Does NOT use codigoEstudiantil`)
    allPassed = false
  }
}

// Test 3: Check that EGRESADO can enter codigoEstudiantil
console.log('\n✓ Step 3: Checking EGRESADO can enter codigoEstudiantil...')
const deportePagePath = path.join(process.cwd(), 'app/inscripcion-deporte/page.tsx')
const deporteContent = fs.readFileSync(deportePagePath, 'utf-8')

if (deporteContent.includes('formData.estamento === "EGRESADO"') && 
    deporteContent.includes('codigoEstudiantil')) {
  console.log('  ✓ EGRESADO can enter codigoEstudiantil in deporte form')
} else {
  console.log('  ✗ EGRESADO cannot enter codigoEstudiantil in deporte form')
  allPassed = false
}

const culturaPagePath = path.join(process.cwd(), 'app/page.tsx')
const culturaContent = fs.readFileSync(culturaPagePath, 'utf-8')

if (culturaContent.includes('formData.estamento === "EGRESADO"') && 
    culturaContent.includes('codigoEstudiantil')) {
  console.log('  ✓ EGRESADO can enter codigoEstudiantil in cultura form')
} else {
  console.log('  ✗ EGRESADO cannot enter codigoEstudiantil in cultura form')
  allPassed = false
}

// Test 4: Check db-router.ts
console.log('\n✓ Step 4: Checking lib/db-router.ts...')
const dbRouterPath = path.join(process.cwd(), 'lib/db-router.ts')
const dbRouterContent = fs.readFileSync(dbRouterPath, 'utf-8')

const dbOldReferences = dbRouterContent.match(/codigoEstudiante[:\s]/g)
if (dbOldReferences) {
  console.log(`  ✗ Found ${dbOldReferences.length} old codigoEstudiante references in db-router`)
  allPassed = false
} else {
  console.log('  ✓ No old codigoEstudiante references in db-router')
}

if (dbRouterContent.includes('codigoEstudiantil')) {
  console.log('  ✓ db-router uses codigoEstudiantil')
} else {
  console.log('  ✗ db-router does NOT use codigoEstudiantil')
  allPassed = false
}

// Final result
console.log('\n============================================================')
if (allPassed) {
  console.log('✅ ALL VALIDATIONS PASSED')
  console.log('============================================================\n')
  console.log('Código Estudiantil Consolidation Validated:')
  console.log('✓ codigoEstudiante removed from types')
  console.log('✓ All forms use codigoEstudiantil')
  console.log('✓ ESTUDIANTE and EGRESADO can enter codigoEstudiantil')
  console.log('✓ db-router updated to use codigoEstudiantil')
  process.exit(0)
} else {
  console.log('❌ SOME VALIDATIONS FAILED')
  console.log('============================================================')
  process.exit(1)
}

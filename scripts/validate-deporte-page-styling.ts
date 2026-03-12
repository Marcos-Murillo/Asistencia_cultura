/**
 * Validation Script: Deporte Page Styling
 * 
 * Verifies that the inscripcion-deporte page has:
 * 1. Its own header (not using GlobalHeader)
 * 2. Proper "Sistema Deportivo" branding
 * 3. Green/emerald color scheme (not blue)
 */

import fs from 'fs'
import path from 'path'

console.log('============================================================')
console.log('VALIDATING DEPORTE PAGE STYLING')
console.log('============================================================\n')

let allPassed = true

// Test 1: GlobalHeader excludes inscripcion-deporte
console.log('✓ Step 1: Checking GlobalHeader exclusion...')
const globalHeaderPath = path.join(process.cwd(), 'components/global-header.tsx')
const globalHeaderContent = fs.readFileSync(globalHeaderPath, 'utf-8')

if (globalHeaderContent.includes('pathname === "/inscripcion-deporte"')) {
  console.log('  ✓ GlobalHeader correctly excludes /inscripcion-deporte')
} else {
  console.log('  ✗ GlobalHeader does not exclude /inscripcion-deporte')
  allPassed = false
}

// Test 2: Page has "Sistema Deportivo" branding
console.log('\n✓ Step 2: Checking "Sistema Deportivo" branding...')
const deportePagePath = path.join(process.cwd(), 'app/inscripcion-deporte/page.tsx')
const deportePageContent = fs.readFileSync(deportePagePath, 'utf-8')

if (deportePageContent.includes('Sistema Deportivo')) {
  console.log('  ✓ Page includes "Sistema Deportivo" branding')
} else {
  console.log('  ✗ Page does not include "Sistema Deportivo" branding')
  allPassed = false
}

// Test 3: Page uses green color scheme
console.log('\n✓ Step 3: Checking green color scheme...')
const greenColorPatterns = [
  'from-green-600 to-emerald-600',
  'bg-green-600',
  'hover:bg-green-700',
  'border-green-600',
  'text-green-600'
]

let greenColorsFound = 0
for (const pattern of greenColorPatterns) {
  if (deportePageContent.includes(pattern)) {
    greenColorsFound++
  }
}

if (greenColorsFound >= 4) {
  console.log(`  ✓ Page uses green color scheme (${greenColorsFound}/${greenColorPatterns.length} patterns found)`)
} else {
  console.log(`  ✗ Page does not use enough green colors (${greenColorsFound}/${greenColorPatterns.length} patterns found)`)
  allPassed = false
}

// Test 4: Page has custom header
console.log('\n✓ Step 4: Checking custom header...')
if (deportePageContent.includes('Header Deportivo')) {
  console.log('  ✓ Page has custom deportivo header')
} else {
  console.log('  ✗ Page does not have custom deportivo header')
  allPassed = false
}

// Test 5: No "Sistema Cultural" references
console.log('\n✓ Step 5: Checking for "Sistema Cultural" references...')
if (!deportePageContent.includes('Sistema Cultural')) {
  console.log('  ✓ Page does not reference "Sistema Cultural"')
} else {
  console.log('  ✗ Page still references "Sistema Cultural"')
  allPassed = false
}

// Final result
console.log('\n============================================================')
if (allPassed) {
  console.log('✅ ALL VALIDATIONS PASSED')
  console.log('============================================================\n')
  console.log('Deporte Page Styling Requirements Validated:')
  console.log('✓ GlobalHeader excluded from /inscripcion-deporte')
  console.log('✓ "Sistema Deportivo" branding implemented')
  console.log('✓ Green/emerald color scheme applied')
  console.log('✓ Custom deportivo header created')
  console.log('✓ No "Sistema Cultural" references')
  process.exit(0)
} else {
  console.log('❌ SOME VALIDATIONS FAILED')
  console.log('============================================================')
  process.exit(1)
}

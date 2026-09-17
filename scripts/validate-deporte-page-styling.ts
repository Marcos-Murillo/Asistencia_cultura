/**
 * Validation Script: Deporte participant portal
 */

import fs from 'fs'
import path from 'path'

console.log('============================================================')
console.log('VALIDATING DEPORTE PARTICIPANT PORTAL STYLING')
console.log('============================================================\n')

let allPassed = true

console.log('✓ Step 1: Checking GlobalHeader exclusion...')
const globalHeaderPath = path.join(process.cwd(), 'components/global-header.tsx')
const globalHeaderContent = fs.readFileSync(globalHeaderPath, 'utf-8')

if (globalHeaderContent.includes('/inscripcion-deporte')) {
  console.log('  ✓ GlobalHeader excludes /inscripcion-deporte')
} else {
  console.log('  ✗ GlobalHeader does not exclude /inscripcion-deporte')
  allPassed = false
}

if (globalHeaderContent.includes('pathname === "/"') || globalHeaderContent.includes('"/",')) {
  console.log('  ✓ GlobalHeader excludes the public portal /')
} else {
  console.log('  ✗ GlobalHeader may still show on /')
  allPassed = false
}

console.log('\n✓ Step 2: Checking redirect...')
const deportePagePath = path.join(process.cwd(), 'app/inscripcion-deporte/page.tsx')
const deportePageContent = fs.readFileSync(deportePagePath, 'utf-8')

if (deportePageContent.includes('/?area=deporte')) {
  console.log('  ✓ /inscripcion-deporte redirects to the unified portal')
} else {
  console.log('  ✗ /inscripcion-deporte does not redirect to /?area=deporte')
  allPassed = false
}

console.log('\n✓ Step 3: Checking area switcher in participant profile...')
const profilePath = path.join(process.cwd(), 'components/cultura-user-profile.tsx')
const profileContent = fs.readFileSync(profilePath, 'utf-8')

if (profileContent.includes('Estás en') && profileContent.includes('bg-orange-500')) {
  console.log('  ✓ Profile shows Cultura/Deporte switcher with deporte accent')
} else {
  console.log('  ✗ Profile is missing the visible area switcher')
  allPassed = false
}

if (allPassed) {
  console.log('\n✓ All deporte portal styling checks passed')
  process.exit(0)
} else {
  console.log('\n✗ Some deporte portal styling checks failed')
  process.exit(1)
}

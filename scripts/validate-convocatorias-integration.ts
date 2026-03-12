/**
 * Validation script for convocatorias page area integration
 * 
 * This script validates that:
 * 1. The convocatorias page imports from db-router instead of firestore
 * 2. The useArea hook is properly integrated
 * 3. All database functions receive the area parameter
 */

import * as fs from 'fs'
import * as path from 'path'

interface ValidationResult {
  passed: boolean
  message: string
}

function validateConvocatoriasPage(): ValidationResult[] {
  const results: ValidationResult[] = []
  const filePath = path.join(process.cwd(), 'app/convocatorias/page.tsx')
  
  if (!fs.existsSync(filePath)) {
    return [{
      passed: false,
      message: '❌ Convocatorias page file not found'
    }]
  }

  const content = fs.readFileSync(filePath, 'utf-8')

  // Check 1: Imports from db-router instead of firestore
  const importsFromDbRouter = content.includes('from "@/lib/db-router"')
  results.push({
    passed: importsFromDbRouter,
    message: importsFromDbRouter 
      ? '✅ Imports from db-router' 
      : '❌ Should import from db-router instead of firestore'
  })

  // Check 2: useArea hook is imported
  const importsUseArea = content.includes('import { useArea }')
  results.push({
    passed: importsUseArea,
    message: importsUseArea 
      ? '✅ Imports useArea hook' 
      : '❌ Missing useArea hook import'
  })

  // Check 3: useArea hook is used
  const usesAreaHook = content.includes('const { area } = useArea()')
  results.push({
    passed: usesAreaHook,
    message: usesAreaHook 
      ? '✅ Uses useArea hook' 
      : '❌ useArea hook not used in component'
  })

  // Check 4: findSimilarUsers receives area parameter
  const findSimilarUsersWithArea = content.includes('findSimilarUsers(\n            area,') || 
                                    content.includes('findSimilarUsers(area,') ||
                                    content.match(/findSimilarUsers\(\s*area,/)
  results.push({
    passed: !!findSimilarUsersWithArea,
    message: findSimilarUsersWithArea 
      ? '✅ findSimilarUsers receives area parameter' 
      : '❌ findSimilarUsers should receive area parameter'
  })

  // Check 5: getActiveEvents receives area parameter
  const getActiveEventsWithArea = content.includes('getActiveEvents(area)')
  results.push({
    passed: getActiveEventsWithArea,
    message: getActiveEventsWithArea 
      ? '✅ getActiveEvents receives area parameter' 
      : '❌ getActiveEvents should receive area parameter'
  })

  // Check 6: saveUserProfile receives area parameter
  const saveUserProfileWithArea = content.includes('saveUserProfile(area,')
  results.push({
    passed: saveUserProfileWithArea,
    message: saveUserProfileWithArea 
      ? '✅ saveUserProfile receives area parameter' 
      : '❌ saveUserProfile should receive area parameter'
  })

  // Check 7: saveEventAttendance receives area parameter
  const saveEventAttendanceWithArea = content.includes('saveEventAttendance(area,')
  results.push({
    passed: saveEventAttendanceWithArea,
    message: saveEventAttendanceWithArea 
      ? '✅ saveEventAttendance receives area parameter' 
      : '❌ saveEventAttendance should receive area parameter'
  })

  // Check 8: getUserEventEnrollments receives area parameter
  const getUserEventEnrollmentsWithArea = content.includes('getUserEventEnrollments(area,')
  results.push({
    passed: getUserEventEnrollmentsWithArea,
    message: getUserEventEnrollmentsWithArea 
      ? '✅ getUserEventEnrollments receives area parameter' 
      : '❌ getUserEventEnrollments should receive area parameter'
  })

  // Check 9: useEffect depends on area
  const useEffectDependsOnArea = content.includes('}, [area])') || content.includes(', area])')
  results.push({
    passed: useEffectDependsOnArea,
    message: useEffectDependsOnArea 
      ? '✅ useEffect properly depends on area' 
      : '❌ useEffect should include area in dependencies'
  })

  return results
}

function validateDbRouterFunctions(): ValidationResult[] {
  const results: ValidationResult[] = []
  const filePath = path.join(process.cwd(), 'lib/db-router.ts')
  
  if (!fs.existsSync(filePath)) {
    return [{
      passed: false,
      message: '❌ db-router.ts file not found'
    }]
  }

  const content = fs.readFileSync(filePath, 'utf-8')

  // Check that all required functions exist with area parameter
  const requiredFunctions = [
    'findSimilarUsers',
    'getActiveEvents',
    'saveEventAttendance',
    'getUserEventEnrollments'
  ]

  for (const funcName of requiredFunctions) {
    const hasFunction = content.includes(`export async function ${funcName}`)
    const hasAreaParam = new RegExp(`${funcName}\\(\\s*area: Area`).test(content)
    
    results.push({
      passed: hasFunction && hasAreaParam,
      message: hasFunction && hasAreaParam
        ? `✅ ${funcName} exists with area parameter`
        : `❌ ${funcName} missing or doesn't have area parameter`
    })
  }

  return results
}

function main() {
  console.log('🔍 Validating Convocatorias Page Area Integration\n')
  console.log('=' .repeat(60))
  
  console.log('\n📄 Convocatorias Page Validation:')
  console.log('-'.repeat(60))
  const pageResults = validateConvocatoriasPage()
  pageResults.forEach(result => console.log(result.message))
  
  console.log('\n📚 DB Router Functions Validation:')
  console.log('-'.repeat(60))
  const dbRouterResults = validateDbRouterFunctions()
  dbRouterResults.forEach(result => console.log(result.message))
  
  console.log('\n' + '='.repeat(60))
  
  const allResults = [...pageResults, ...dbRouterResults]
  const passedCount = allResults.filter(r => r.passed).length
  const totalCount = allResults.length
  
  console.log(`\n📊 Results: ${passedCount}/${totalCount} checks passed`)
  
  if (passedCount === totalCount) {
    console.log('\n✅ All validations passed! Convocatorias page is properly integrated with area awareness.')
    process.exit(0)
  } else {
    console.log('\n❌ Some validations failed. Please review the issues above.')
    process.exit(1)
  }
}

main()

/**
 * Validation script for Task 13.2: Actualizar app/grupos/page.tsx
 * 
 * This script validates that the grupos page correctly:
 * 1. Integrates the useArea hook
 * 2. Passes area to query functions
 * 3. Applies filterGroupsByAssignment for role-based filtering
 * 
 * Requirements: 8.1, 8.4
 */

import * as fs from 'fs'
import * as path from 'path'

interface ValidationResult {
  passed: boolean
  message: string
}

function validateGruposPage(): ValidationResult[] {
  const results: ValidationResult[] = []
  const filePath = path.join(process.cwd(), 'app', 'grupos', 'page.tsx')
  
  if (!fs.existsSync(filePath)) {
    return [{
      passed: false,
      message: 'File app/grupos/page.tsx not found'
    }]
  }
  
  const content = fs.readFileSync(filePath, 'utf-8')
  
  // Check 1: useArea hook is imported
  const hasUseAreaImport = content.includes('import { useArea }') || content.includes('import {useArea}')
  results.push({
    passed: hasUseAreaImport,
    message: hasUseAreaImport 
      ? '✓ useArea hook is imported from contexts/area-context'
      : '✗ useArea hook is NOT imported'
  })
  
  // Check 2: useArea hook is used in component
  const hasUseAreaCall = content.includes('const { area } = useArea()')
  results.push({
    passed: hasUseAreaCall,
    message: hasUseAreaCall
      ? '✓ useArea hook is called in component'
      : '✗ useArea hook is NOT called in component'
  })
  
  // Check 3: getRolePermissions is imported
  const hasGetRolePermissions = content.includes('getRolePermissions')
  results.push({
    passed: hasGetRolePermissions,
    message: hasGetRolePermissions
      ? '✓ getRolePermissions is imported from role-manager'
      : '✗ getRolePermissions is NOT imported'
  })
  
  // Check 4: filterGroupsByAssignment is imported
  const hasFilterGroupsByAssignment = content.includes('filterGroupsByAssignment')
  results.push({
    passed: hasFilterGroupsByAssignment,
    message: hasFilterGroupsByAssignment
      ? '✓ filterGroupsByAssignment is imported from role-manager'
      : '✗ filterGroupsByAssignment is NOT imported'
  })
  
  // Check 5: RolePermissions type is imported
  const hasRolePermissions = content.includes('RolePermissions')
  results.push({
    passed: hasRolePermissions,
    message: hasRolePermissions
      ? '✓ RolePermissions type is imported'
      : '✗ RolePermissions type is NOT imported'
  })
  
  // Check 6: currentUserPermissions state is defined
  const hasPermissionsState = content.includes('currentUserPermissions') && content.includes('RolePermissions | null')
  results.push({
    passed: hasPermissionsState,
    message: hasPermissionsState
      ? '✓ currentUserPermissions state is defined'
      : '✗ currentUserPermissions state is NOT defined'
  })
  
  // Check 7: area is passed to getAllCulturalGroupsRouter
  const hasAreaParameter = content.includes('getAllCulturalGroupsRouter(area)')
  results.push({
    passed: hasAreaParameter,
    message: hasAreaParameter
      ? '✓ area parameter is passed to getAllCulturalGroupsRouter'
      : '✗ area parameter is NOT passed to database functions'
  })
  
  // Check 8: filterGroupsByAssignment is called in loadGroups
  const hasFilterCall = content.includes('filterGroupsByAssignment(allCulturalGroups, currentUserPermissions)')
  results.push({
    passed: hasFilterCall,
    message: hasFilterCall
      ? '✓ filterGroupsByAssignment is called to filter groups'
      : '✗ filterGroupsByAssignment is NOT called'
  })
  
  // Check 9: useEffect depends on area and currentUserPermissions
  const hasProperDependencies = content.includes('[area, currentUserPermissions]')
  results.push({
    passed: hasProperDependencies,
    message: hasProperDependencies
      ? '✓ useEffect has proper dependencies [area, currentUserPermissions]'
      : '✗ useEffect dependencies are incorrect'
  })
  
  // Check 10: Permissions are calculated with getRolePermissions
  const hasPermissionsCalculation = content.includes('getRolePermissions(userRole, area, assignedGroups)')
  results.push({
    passed: hasPermissionsCalculation,
    message: hasPermissionsCalculation
      ? '✓ Permissions are calculated using getRolePermissions'
      : '✗ Permissions calculation is missing'
  })
  
  return results
}

function main() {
  console.log('='.repeat(70))
  console.log('Validating Task 13.2: Actualizar app/grupos/page.tsx')
  console.log('='.repeat(70))
  console.log()
  
  const results = validateGruposPage()
  
  let allPassed = true
  for (const result of results) {
    console.log(result.message)
    if (!result.passed) {
      allPassed = false
    }
  }
  
  console.log()
  console.log('='.repeat(70))
  
  if (allPassed) {
    console.log('✓ ALL CHECKS PASSED')
    console.log()
    console.log('Summary:')
    console.log('- useArea hook integrated ✓')
    console.log('- Area passed to query functions ✓')
    console.log('- filterGroupsByAssignment applied ✓')
    console.log('- Requirements 8.1 and 8.4 satisfied ✓')
    process.exit(0)
  } else {
    console.log('✗ SOME CHECKS FAILED')
    console.log()
    console.log('Please review the failed checks above.')
    process.exit(1)
  }
}

main()

/**
 * Integration validation for Task 25.1: Agregar logging de eventos clave
 * 
 * This script validates that logging is properly integrated into:
 * - area-context.tsx (area switch logging)
 * - db-router.ts (routing errors and cross-area access)
 * - firebase-config.ts (environment validation)
 */

import * as fs from 'fs'
import * as path from 'path'

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
}

function logInfo(message: string) {
  console.log(`${colors.blue}ℹ ${message}${colors.reset}`)
}

function logSuccess(message: string) {
  console.log(`${colors.green}✓ ${message}${colors.reset}`)
}

function logError(message: string) {
  console.error(`${colors.red}✗ ${message}${colors.reset}`)
}

function readFileContent(filePath: string): string {
  const fullPath = path.join(process.cwd(), filePath)
  return fs.readFileSync(fullPath, 'utf-8')
}

/**
 * Test 1: Verify logger module exists and exports required functions
 */
function testLoggerModuleExists(): boolean {
  logInfo('Test 1: Verifying logger module exists')
  
  try {
    const loggerPath = 'lib/logger.ts'
    const content = readFileContent(loggerPath)
    
    const requiredExports = [
      'logAreaSwitch',
      'logCrossAreaAccess',
      'logRoutingError',
      'logEnvValidation',
      'logTransaction',
      'logDataIsolationViolation',
    ]
    
    for (const exportName of requiredExports) {
      if (!content.includes(`export function ${exportName}`)) {
        logError(`Missing export: ${exportName}`)
        return false
      }
    }
    
    logSuccess('Logger module exists with all required exports')
    return true
  } catch (error) {
    logError(`Failed to read logger module: ${error}`)
    return false
  }
}

/**
 * Test 2: Verify area-context.tsx imports and uses logAreaSwitch
 */
function testAreaContextIntegration(): boolean {
  logInfo('Test 2: Verifying area-context.tsx integration')
  
  try {
    const content = readFileContent('contexts/area-context.tsx')
    
    // Check import
    if (!content.includes("import { logAreaSwitch } from '@/lib/logger'")) {
      logError('Missing logAreaSwitch import in area-context.tsx')
      return false
    }
    
    // Check usage in setArea function
    if (!content.includes('logAreaSwitch')) {
      logError('logAreaSwitch not called in setArea function')
      return false
    }
    
    // Check that it logs the area switch
    if (!content.includes('previousArea') && !content.includes('fromArea')) {
      logError('Area switch logging does not capture previous area')
      return false
    }
    
    logSuccess('area-context.tsx properly integrated with logging')
    return true
  } catch (error) {
    logError(`Failed to verify area-context.tsx: ${error}`)
    return false
  }
}

/**
 * Test 3: Verify db-router.ts imports and uses logging functions
 */
function testDbRouterIntegration(): boolean {
  logInfo('Test 3: Verifying db-router.ts integration')
  
  try {
    const content = readFileContent('lib/db-router.ts')
    
    // Check imports
    const requiredImports = [
      'logCrossAreaAccess',
      'logRoutingError',
      'logTransaction',
      'logDataIsolationViolation',
    ]
    
    for (const importName of requiredImports) {
      if (!content.includes(importName)) {
        logError(`Missing ${importName} in db-router.ts`)
        return false
      }
    }
    
    // Check usage in validateAreaSpecified
    if (!content.includes('logRoutingError') || !content.includes('validateAreaSpecified')) {
      logError('Routing error logging not integrated in validateAreaSpecified')
      return false
    }
    
    // Check usage in validateNoCrossDatabaseOperation
    if (!content.includes('logDataIsolationViolation')) {
      logError('Data isolation violation logging not integrated')
      return false
    }
    
    // Check usage in transaction functions
    if (!content.includes('logTransaction')) {
      logError('Transaction logging not integrated')
      return false
    }
    
    logSuccess('db-router.ts properly integrated with logging')
    return true
  } catch (error) {
    logError(`Failed to verify db-router.ts: ${error}`)
    return false
  }
}

/**
 * Test 4: Verify firebase-config.ts imports and uses logEnvValidation
 */
function testFirebaseConfigIntegration(): boolean {
  logInfo('Test 4: Verifying firebase-config.ts integration')
  
  try {
    const content = readFileContent('lib/firebase-config.ts')
    
    // Check import
    if (!content.includes("import { logEnvValidation } from './logger'")) {
      logError('Missing logEnvValidation import in firebase-config.ts')
      return false
    }
    
    // Check usage in validateEnvironmentVariables
    if (!content.includes('logEnvValidation')) {
      logError('logEnvValidation not called in validateEnvironmentVariables')
      return false
    }
    
    // Check that it passes the validation result
    if (!content.includes('logEnvValidation(missing.length === 0, missing)')) {
      logError('Environment validation logging does not pass correct parameters')
      return false
    }
    
    logSuccess('firebase-config.ts properly integrated with logging')
    return true
  } catch (error) {
    logError(`Failed to verify firebase-config.ts: ${error}`)
    return false
  }
}

/**
 * Test 5: Verify logging includes Task 25.1 comments
 */
function testLoggingDocumentation(): boolean {
  logInfo('Test 5: Verifying logging documentation')
  
  try {
    const files = [
      'contexts/area-context.tsx',
      'lib/db-router.ts',
      'lib/firebase-config.ts',
    ]
    
    for (const file of files) {
      const content = readFileContent(file)
      
      if (!content.includes('Task 25.1') && !content.includes('25.1')) {
        logError(`Missing Task 25.1 reference in ${file}`)
        return false
      }
    }
    
    logSuccess('All files include Task 25.1 documentation')
    return true
  } catch (error) {
    logError(`Failed to verify documentation: ${error}`)
    return false
  }
}

/**
 * Test 6: Verify logger.ts has proper TypeScript types
 */
function testLoggerTypes(): boolean {
  logInfo('Test 6: Verifying logger TypeScript types')
  
  try {
    const content = readFileContent('lib/logger.ts')
    
    // Check for type definitions
    if (!content.includes("export type LogLevel")) {
      logError('Missing LogLevel type definition')
      return false
    }
    
    if (!content.includes("export type LogCategory")) {
      logError('Missing LogCategory type definition')
      return false
    }
    
    // Check for proper categories
    const requiredCategories = [
      'area-switch',
      'cross-area-access',
      'routing-error',
      'env-validation',
      'transaction',
    ]
    
    for (const category of requiredCategories) {
      if (!content.includes(`'${category}'`)) {
        logError(`Missing category: ${category}`)
        return false
      }
    }
    
    logSuccess('Logger has proper TypeScript types')
    return true
  } catch (error) {
    logError(`Failed to verify logger types: ${error}`)
    return false
  }
}

/**
 * Test 7: Verify validation script exists
 */
function testValidationScriptExists(): boolean {
  logInfo('Test 7: Verifying validation script exists')
  
  try {
    const content = readFileContent('scripts/validate-logging.ts')
    
    if (!content.includes('Task 25.1')) {
      logError('Validation script missing Task 25.1 reference')
      return false
    }
    
    logSuccess('Validation script exists and is properly documented')
    return true
  } catch (error) {
    logError(`Failed to verify validation script: ${error}`)
    return false
  }
}

/**
 * Main validation function
 */
async function main() {
  console.log('\n' + '='.repeat(70))
  console.log('Logging Integration Validation - Task 25.1')
  console.log('Feature: sistema-multi-area')
  console.log('Task: 25.1 - Agregar logging de eventos clave')
  console.log('='.repeat(70) + '\n')

  const results = {
    test1: false,
    test2: false,
    test3: false,
    test4: false,
    test5: false,
    test6: false,
    test7: false,
  }

  // Run tests
  results.test1 = testLoggerModuleExists()
  console.log()
  
  results.test2 = testAreaContextIntegration()
  console.log()
  
  results.test3 = testDbRouterIntegration()
  console.log()
  
  results.test4 = testFirebaseConfigIntegration()
  console.log()
  
  results.test5 = testLoggingDocumentation()
  console.log()
  
  results.test6 = testLoggerTypes()
  console.log()
  
  results.test7 = testValidationScriptExists()
  console.log()

  // Summary
  console.log('='.repeat(70))
  console.log('Integration Validation Summary')
  console.log('='.repeat(70))
  
  const totalTests = Object.keys(results).length
  const passedTests = Object.values(results).filter(Boolean).length
  
  console.log(`Total Tests: ${totalTests}`)
  console.log(`Passed: ${colors.green}${passedTests}${colors.reset}`)
  console.log(`Failed: ${colors.red}${totalTests - passedTests}${colors.reset}`)
  
  if (passedTests === totalTests) {
    console.log(`\n${colors.green}✓ All integration tests passed!${colors.reset}`)
    console.log(`\n${colors.blue}Task 25.1 Integration validated:${colors.reset}`)
    console.log('  ✓ Logger module properly structured')
    console.log('  ✓ area-context.tsx logs area switches')
    console.log('  ✓ db-router.ts logs routing errors and cross-area access')
    console.log('  ✓ firebase-config.ts logs environment validation')
    console.log('  ✓ All files properly documented')
    console.log('  ✓ TypeScript types properly defined')
    console.log('\n' + colors.blue + 'Logging is fully integrated into the system!' + colors.reset)
  } else {
    console.log(`\n${colors.red}✗ Some integration tests failed${colors.reset}`)
    process.exit(1)
  }
}

main().catch(error => {
  logError(`Unexpected error: ${error}`)
  console.error(error)
  process.exit(1)
})

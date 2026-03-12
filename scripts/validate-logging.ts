/**
 * Validation script for Task 25.1: Agregar logging de eventos clave
 * 
 * This script validates that logging is properly implemented for:
 * - Log de cambios de área por Super_Admin
 * - Log de intentos de acceso cross-área
 * - Log de errores de enrutamiento
 * - Log de validación de variables de entorno
 */

import {
  logAreaSwitch,
  logCrossAreaAccess,
  logRoutingError,
  logEnvValidation,
  logTransaction,
  logDataIsolationViolation,
} from '../lib/logger'

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

function logWarning(message: string) {
  console.warn(`${colors.yellow}⚠ ${message}${colors.reset}`)
}

// Capture console output for validation
let capturedLogs: string[] = []
const originalConsoleLog = console.log
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

function startCapture() {
  capturedLogs = []
  console.log = (message: string) => {
    capturedLogs.push(message)
    originalConsoleLog(message)
  }
  console.error = (message: string) => {
    capturedLogs.push(message)
    originalConsoleError(message)
  }
  console.warn = (message: string) => {
    capturedLogs.push(message)
    originalConsoleWarn(message)
  }
}

function stopCapture() {
  console.log = originalConsoleLog
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
}

function validateLogContains(expectedStrings: string[], description: string): boolean {
  const lastLog = capturedLogs[capturedLogs.length - 1]
  
  for (const expected of expectedStrings) {
    if (!lastLog.includes(expected)) {
      logError(`${description}: Missing "${expected}" in log`)
      return false
    }
  }
  
  logSuccess(description)
  return true
}

/**
 * Test 1: Validate area switch logging
 */
function testAreaSwitchLogging(): boolean {
  logInfo('Test 1: Validating area switch logging')
  
  startCapture()
  logAreaSwitch('super-admin-123', 'cultura', 'deporte')
  stopCapture()
  
  return validateLogContains(
    ['[area-switch]', '[INFO]', 'Super_Admin switched area', 'super-admin-123', 'cultura', 'deporte'],
    'Area switch logging includes all required information'
  )
}

/**
 * Test 2: Validate cross-area access logging
 */
function testCrossAreaAccessLogging(): boolean {
  logInfo('Test 2: Validating cross-area access logging')
  
  startCapture()
  logCrossAreaAccess('user-456', 'cultura', 'deporte', 'getAllUsers')
  stopCapture()
  
  return validateLogContains(
    ['[cross-area-access]', '[WARN]', 'Cross-area access attempt detected', 'security-violation'],
    'Cross-area access logging includes security warning'
  )
}

/**
 * Test 3: Validate routing error logging
 */
function testRoutingErrorLogging(): boolean {
  logInfo('Test 3: Validating routing error logging')
  
  startCapture()
  logRoutingError('cultura', 'getUserById', 'User not found in database')
  stopCapture()
  
  return validateLogContains(
    ['[routing-error]', '[ERROR]', 'Database routing error', 'cultura', 'getUserById'],
    'Routing error logging includes error details'
  )
}

/**
 * Test 4: Validate environment validation logging (success)
 */
function testEnvValidationSuccessLogging(): boolean {
  logInfo('Test 4: Validating environment validation logging (success)')
  
  startCapture()
  logEnvValidation(true)
  stopCapture()
  
  return validateLogContains(
    ['[env-validation]', '[INFO]', 'Environment variables validated successfully', '"status":"valid"'],
    'Environment validation success logging is correct'
  )
}

/**
 * Test 5: Validate environment validation logging (failure)
 */
function testEnvValidationFailureLogging(): boolean {
  logInfo('Test 5: Validating environment validation logging (failure)')
  
  const missingVars = ['NEXT_PUBLIC_FIREBASE_DEPORTE_API_KEY', 'NEXT_PUBLIC_FIREBASE_DEPORTE_PROJECT_ID']
  
  startCapture()
  logEnvValidation(false, missingVars)
  stopCapture()
  
  return validateLogContains(
    ['[env-validation]', '[ERROR]', 'Environment variable validation failed', '"status":"invalid"', '"count":2'],
    'Environment validation failure logging includes missing variables'
  )
}

/**
 * Test 6: Validate transaction logging
 */
function testTransactionLogging(): boolean {
  logInfo('Test 6: Validating transaction logging')
  
  startCapture()
  logTransaction('txn-123', 'cultura', 'start')
  stopCapture()
  
  const result1 = validateLogContains(
    ['[transaction]', '[INFO]', 'Transaction start', 'txn-123', 'cultura'],
    'Transaction start logging is correct'
  )
  
  startCapture()
  logTransaction('txn-456', 'deporte', 'error', { reason: 'Connection timeout' })
  stopCapture()
  
  const result2 = validateLogContains(
    ['[transaction]', '[ERROR]', 'Transaction error', 'Connection timeout'],
    'Transaction error logging is correct'
  )
  
  return result1 && result2
}

/**
 * Test 7: Validate data isolation violation logging
 */
function testDataIsolationViolationLogging(): boolean {
  logInfo('Test 7: Validating data isolation violation logging')
  
  startCapture()
  logDataIsolationViolation('cultura', 'deporte', 'beginTransaction')
  stopCapture()
  
  return validateLogContains(
    ['[cross-area-access]', '[ERROR]', 'Data isolation violation detected', '"severity":"critical"'],
    'Data isolation violation logging includes critical severity'
  )
}

/**
 * Test 8: Validate log format consistency
 */
function testLogFormatConsistency(): boolean {
  logInfo('Test 8: Validating log format consistency')
  
  startCapture()
  logAreaSwitch('user', 'cultura', 'deporte')
  stopCapture()
  
  const lastLog = capturedLogs[capturedLogs.length - 1]
  
  // Check for ISO timestamp pattern
  const hasTimestamp = /\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/.test(lastLog)
  if (!hasTimestamp) {
    logError('Log format: Missing ISO timestamp')
    return false
  }
  
  // Check for category
  if (!lastLog.includes('[area-switch]')) {
    logError('Log format: Missing category')
    return false
  }
  
  // Check for level
  if (!lastLog.includes('[INFO]')) {
    logError('Log format: Missing level')
    return false
  }
  
  logSuccess('Log format is consistent with timestamp, category, and level')
  return true
}

/**
 * Main validation function
 */
async function main() {
  console.log('\n' + '='.repeat(70))
  console.log('Logging Validation - Task 25.1')
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
    test8: false,
  }

  // Run tests
  results.test1 = testAreaSwitchLogging()
  console.log()
  
  results.test2 = testCrossAreaAccessLogging()
  console.log()
  
  results.test3 = testRoutingErrorLogging()
  console.log()
  
  results.test4 = testEnvValidationSuccessLogging()
  console.log()
  
  results.test5 = testEnvValidationFailureLogging()
  console.log()
  
  results.test6 = testTransactionLogging()
  console.log()
  
  results.test7 = testDataIsolationViolationLogging()
  console.log()
  
  results.test8 = testLogFormatConsistency()
  console.log()

  // Summary
  console.log('='.repeat(70))
  console.log('Validation Summary')
  console.log('='.repeat(70))
  
  const totalTests = Object.keys(results).length
  const passedTests = Object.values(results).filter(Boolean).length
  
  console.log(`Total Tests: ${totalTests}`)
  console.log(`Passed: ${colors.green}${passedTests}${colors.reset}`)
  console.log(`Failed: ${colors.red}${totalTests - passedTests}${colors.reset}`)
  
  if (passedTests === totalTests) {
    console.log(`\n${colors.green}✓ All validation tests passed!${colors.reset}`)
    console.log(`\n${colors.blue}Task 25.1 Requirements validated:${colors.reset}`)
    console.log('  ✓ Log de cambios de área por Super_Admin')
    console.log('  ✓ Log de intentos de acceso cross-área')
    console.log('  ✓ Log de errores de enrutamiento')
    console.log('  ✓ Log de validación de variables de entorno')
    console.log('\n' + colors.blue + 'Logging implementation is complete and functional!' + colors.reset)
  } else {
    console.log(`\n${colors.red}✗ Some validation tests failed${colors.reset}`)
    process.exit(1)
  }
}

main().catch(error => {
  logError(`Unexpected error: ${error}`)
  console.error(error)
  process.exit(1)
})

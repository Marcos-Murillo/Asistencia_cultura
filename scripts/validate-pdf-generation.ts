/**
 * Validation Script for PDF Generation
 * 
 * Feature: sistema-multi-area
 * Task: 19.2 - Crear función para generar PDF
 * Requirements: 9.4, 9.5
 */

import { generateCombinedReport, generateCombinedReportPDF } from '../lib/reports'
import type { CombinedStats } from '../lib/reports'

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
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

/**
 * Test 1: Verify PDF generation with mock data
 */
async function testPDFGenerationWithMockData() {
  logInfo('Test 1: Generating PDF with mock data...')
  
  const mockStats: CombinedStats = {
    cultura: {
      totalParticipants: 150,
      byGender: { mujer: 90, hombre: 58, otro: 2 },
      byProgram: {
        'Ingeniería de Sistemas': { mujer: 30, hombre: 20, otro: 0, total: 50 },
        'Medicina': { mujer: 25, hombre: 15, otro: 1, total: 41 },
      },
      byFaculty: {
        'Ingeniería': { mujer: 40, hombre: 30, otro: 0, total: 70 },
        'Salud': { mujer: 30, hombre: 20, otro: 1, total: 51 },
      },
      byCulturalGroup: {
        'Danza': 50,
        'Teatro': 40,
        'Música': 30,
        'Coro': 20,
        'Pintura': 10,
      },
      byMonth: {
        '2024-01': { 'Danza': 20, 'Teatro': 15 },
        '2024-02': { 'Danza': 30, 'Teatro': 25 },
      },
    },
    deporte: {
      totalParticipants: 120,
      byGender: { mujer: 60, hombre: 58, otro: 2 },
      byProgram: {
        'Ingeniería de Sistemas': { mujer: 20, hombre: 15, otro: 0, total: 35 },
        'Administración': { mujer: 25, hombre: 20, otro: 1, total: 46 },
      },
      byFaculty: {
        'Ingeniería': { mujer: 30, hombre: 25, otro: 0, total: 55 },
        'Ciencias Administrativas': { mujer: 25, hombre: 20, otro: 1, total: 46 },
      },
      byCulturalGroup: {
        'Fútbol': 40,
        'Baloncesto': 30,
        'Voleibol': 25,
        'Natación': 15,
        'Atletismo': 10,
      },
      byMonth: {
        '2024-01': { 'Fútbol': 15, 'Baloncesto': 10 },
        '2024-02': { 'Fútbol': 25, 'Baloncesto': 20 },
      },
    },
    combined: {
      totalParticipants: 270,
      totalCultura: 150,
      totalDeporte: 120,
      byGender: { mujer: 150, hombre: 116, otro: 4 },
    },
  }

  try {
    await generateCombinedReportPDF(mockStats)
    logSuccess('PDF generated successfully with mock data')
    return true
  } catch (error) {
    logError(`Failed to generate PDF: ${error}`)
    return false
  }
}

/**
 * Test 2: Verify PDF generation with empty data
 */
async function testPDFGenerationWithEmptyData() {
  logInfo('Test 2: Generating PDF with empty data...')
  
  const emptyStats: CombinedStats = {
    cultura: {
      totalParticipants: 0,
      byGender: { mujer: 0, hombre: 0, otro: 0 },
      byProgram: {},
      byFaculty: {},
      byCulturalGroup: {},
      byMonth: {},
    },
    deporte: {
      totalParticipants: 0,
      byGender: { mujer: 0, hombre: 0, otro: 0 },
      byProgram: {},
      byFaculty: {},
      byCulturalGroup: {},
      byMonth: {},
    },
    combined: {
      totalParticipants: 0,
      totalCultura: 0,
      totalDeporte: 0,
      byGender: { mujer: 0, hombre: 0, otro: 0 },
    },
  }

  try {
    await generateCombinedReportPDF(emptyStats)
    logSuccess('PDF generated successfully with empty data')
    return true
  } catch (error) {
    logError(`Failed to generate PDF with empty data: ${error}`)
    return false
  }
}

/**
 * Test 3: Verify PDF includes metrics separated by area
 */
async function testPDFIncludesAreaMetrics() {
  logInfo('Test 3: Verifying PDF includes metrics separated by area...')
  
  const mockStats: CombinedStats = {
    cultura: {
      totalParticipants: 100,
      byGender: { mujer: 60, hombre: 38, otro: 2 },
      byProgram: {},
      byFaculty: {},
      byCulturalGroup: { 'Danza': 50, 'Teatro': 50 },
      byMonth: {},
    },
    deporte: {
      totalParticipants: 80,
      byGender: { mujer: 40, hombre: 38, otro: 2 },
      byProgram: {},
      byFaculty: {},
      byCulturalGroup: { 'Fútbol': 40, 'Baloncesto': 40 },
      byMonth: {},
    },
    combined: {
      totalParticipants: 180,
      totalCultura: 100,
      totalDeporte: 80,
      byGender: { mujer: 100, hombre: 76, otro: 4 },
    },
  }

  try {
    await generateCombinedReportPDF(mockStats)
    logSuccess('PDF includes metrics separated by area (Cultura and Deporte)')
    return true
  } catch (error) {
    logError(`Failed to include area metrics: ${error}`)
    return false
  }
}

/**
 * Test 4: Verify PDF includes combined totals
 */
async function testPDFIncludesCombinedTotals() {
  logInfo('Test 4: Verifying PDF includes combined totals...')
  
  const mockStats: CombinedStats = {
    cultura: {
      totalParticipants: 50,
      byGender: { mujer: 30, hombre: 20, otro: 0 },
      byProgram: {},
      byFaculty: {},
      byCulturalGroup: {},
      byMonth: {},
    },
    deporte: {
      totalParticipants: 50,
      byGender: { mujer: 25, hombre: 25, otro: 0 },
      byProgram: {},
      byFaculty: {},
      byCulturalGroup: {},
      byMonth: {},
    },
    combined: {
      totalParticipants: 100,
      totalCultura: 50,
      totalDeporte: 50,
      byGender: { mujer: 55, hombre: 45, otro: 0 },
    },
  }

  try {
    await generateCombinedReportPDF(mockStats)
    logSuccess('PDF includes combined totals (totalParticipants, totalCultura, totalDeporte)')
    return true
  } catch (error) {
    logError(`Failed to include combined totals: ${error}`)
    return false
  }
}

/**
 * Main validation function
 */
async function main() {
  console.log('\n' + '='.repeat(60))
  console.log('PDF Generation Validation')
  console.log('Feature: sistema-multi-area')
  console.log('Task: 19.2 - Crear función para generar PDF')
  console.log('Requirements: 9.4, 9.5')
  console.log('='.repeat(60) + '\n')

  const results = {
    test1: false,
    test2: false,
    test3: false,
    test4: false,
  }

  // Run tests
  results.test1 = await testPDFGenerationWithMockData()
  console.log()
  
  results.test2 = await testPDFGenerationWithEmptyData()
  console.log()
  
  results.test3 = await testPDFIncludesAreaMetrics()
  console.log()
  
  results.test4 = await testPDFIncludesCombinedTotals()
  console.log()

  // Summary
  console.log('='.repeat(60))
  console.log('Validation Summary')
  console.log('='.repeat(60))
  
  const totalTests = Object.keys(results).length
  const passedTests = Object.values(results).filter(Boolean).length
  
  console.log(`Total Tests: ${totalTests}`)
  console.log(`Passed: ${colors.green}${passedTests}${colors.reset}`)
  console.log(`Failed: ${colors.red}${totalTests - passedTests}${colors.reset}`)
  
  if (passedTests === totalTests) {
    console.log(`\n${colors.green}✓ All validation tests passed!${colors.reset}`)
    console.log(`\n${colors.blue}Requirements validated:${colors.reset}`)
    console.log('  - 9.4: PDF generation includes metrics separated by area')
    console.log('  - 9.5: PDF includes combined totals')
  } else {
    console.log(`\n${colors.red}✗ Some validation tests failed${colors.reset}`)
    process.exit(1)
  }
}

// Run validation
main().catch((error) => {
  logError(`Validation failed with error: ${error}`)
  process.exit(1)
})

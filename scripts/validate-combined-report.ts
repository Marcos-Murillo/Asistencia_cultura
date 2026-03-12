/**
 * Validation script for Combined Report Generation
 * 
 * This script validates that the generateCombinedReport function:
 * 1. Queries statistics from BD_Cultura
 * 2. Queries statistics from BD_Deporte
 * 3. Aggregates data from both areas correctly
 * 
 * Task: 19.1 - Crear función para generar reporte combinado
 * Requirements: 9.3
 */

import { generateCombinedReport } from '../lib/reports'

async function validateCombinedReport() {
  console.log('='.repeat(60))
  console.log('VALIDATING COMBINED REPORT GENERATION')
  console.log('='.repeat(60))
  console.log()

  try {
    console.log('✓ Step 1: Calling generateCombinedReport()...')
    const report = await generateCombinedReport()
    
    console.log()
    console.log('✓ Step 2: Verifying report structure...')
    
    // Verify report has all required sections
    if (!report.cultura) {
      throw new Error('Missing cultura stats in report')
    }
    console.log('  ✓ Cultura stats present')
    
    if (!report.deporte) {
      throw new Error('Missing deporte stats in report')
    }
    console.log('  ✓ Deporte stats present')
    
    if (!report.combined) {
      throw new Error('Missing combined stats in report')
    }
    console.log('  ✓ Combined stats present')
    
    console.log()
    console.log('✓ Step 3: Verifying data aggregation...')
    
    // Verify combined totals match sum of individual areas
    const expectedTotal = report.cultura.totalParticipants + report.deporte.totalParticipants
    if (report.combined.totalParticipants !== expectedTotal) {
      throw new Error(`Combined total mismatch: expected ${expectedTotal}, got ${report.combined.totalParticipants}`)
    }
    console.log(`  ✓ Total participants: ${report.combined.totalParticipants}`)
    
    if (report.combined.totalCultura !== report.cultura.totalParticipants) {
      throw new Error('Cultura total mismatch')
    }
    console.log(`  ✓ Cultura participants: ${report.combined.totalCultura}`)
    
    if (report.combined.totalDeporte !== report.deporte.totalParticipants) {
      throw new Error('Deporte total mismatch')
    }
    console.log(`  ✓ Deporte participants: ${report.combined.totalDeporte}`)
    
    // Verify gender aggregation
    const expectedMujer = report.cultura.byGender.mujer + report.deporte.byGender.mujer
    const expectedHombre = report.cultura.byGender.hombre + report.deporte.byGender.hombre
    const expectedOtro = report.cultura.byGender.otro + report.deporte.byGender.otro
    
    if (report.combined.byGender.mujer !== expectedMujer) {
      throw new Error('Gender (mujer) aggregation mismatch')
    }
    console.log(`  ✓ Gender (mujer): ${report.combined.byGender.mujer}`)
    
    if (report.combined.byGender.hombre !== expectedHombre) {
      throw new Error('Gender (hombre) aggregation mismatch')
    }
    console.log(`  ✓ Gender (hombre): ${report.combined.byGender.hombre}`)
    
    if (report.combined.byGender.otro !== expectedOtro) {
      throw new Error('Gender (otro) aggregation mismatch')
    }
    console.log(`  ✓ Gender (otro): ${report.combined.byGender.otro}`)
    
    console.log()
    console.log('✓ Step 4: Displaying report summary...')
    console.log()
    console.log('  CULTURA AREA:')
    console.log(`    Total: ${report.cultura.totalParticipants}`)
    console.log(`    Mujer: ${report.cultura.byGender.mujer}`)
    console.log(`    Hombre: ${report.cultura.byGender.hombre}`)
    console.log(`    Otro: ${report.cultura.byGender.otro}`)
    console.log()
    console.log('  DEPORTE AREA:')
    console.log(`    Total: ${report.deporte.totalParticipants}`)
    console.log(`    Mujer: ${report.deporte.byGender.mujer}`)
    console.log(`    Hombre: ${report.deporte.byGender.hombre}`)
    console.log(`    Otro: ${report.deporte.byGender.otro}`)
    console.log()
    console.log('  COMBINED TOTALS:')
    console.log(`    Total: ${report.combined.totalParticipants}`)
    console.log(`    Cultura: ${report.combined.totalCultura}`)
    console.log(`    Deporte: ${report.combined.totalDeporte}`)
    console.log(`    Mujer: ${report.combined.byGender.mujer}`)
    console.log(`    Hombre: ${report.combined.byGender.hombre}`)
    console.log(`    Otro: ${report.combined.byGender.otro}`)
    
    console.log()
    console.log('='.repeat(60))
    console.log('✅ ALL VALIDATIONS PASSED')
    console.log('='.repeat(60))
    console.log()
    console.log('Task 19.1 Requirements Validated:')
    console.log('  ✓ generateCombinedReport() implemented in lib/reports.ts')
    console.log('  ✓ Queries statistics from BD_Cultura')
    console.log('  ✓ Queries statistics from BD_Deporte')
    console.log('  ✓ Aggregates data from both areas correctly')
    console.log('  ✓ Requirement 9.3 satisfied')
    console.log()
    
  } catch (error) {
    console.error()
    console.error('❌ VALIDATION FAILED')
    console.error('='.repeat(60))
    console.error('Error:', error instanceof Error ? error.message : error)
    console.error()
    process.exit(1)
  }
}

// Run validation
validateCombinedReport()

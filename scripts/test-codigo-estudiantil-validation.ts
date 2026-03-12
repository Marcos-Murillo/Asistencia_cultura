/**
 * Manual validation test for codigo estudiantil
 * This script tests the validation logic used in the Deporte registration form
 */

// Validation function (same as in the form)
function validateCodigoEstudiantil(value: string): { isValid: boolean; error: string } {
  if (!value) {
    return { isValid: true, error: '' } // Empty is valid (optional field)
  }
  
  if (!/^\d+$/.test(value)) {
    return { isValid: false, error: 'El código estudiantil debe contener solo números' }
  }
  
  return { isValid: true, error: '' }
}

// Real-time validation (allows partial input)
function validateCodigoEstudiantilRealTime(value: string): { isValid: boolean; error: string } {
  if (!value) {
    return { isValid: true, error: '' }
  }
  
  if (!/^\d*$/.test(value)) {
    return { isValid: false, error: 'El código estudiantil debe contener solo números' }
  }
  
  return { isValid: true, error: '' }
}

// Test cases
const testCases = [
  // Valid cases
  { input: '123456', expected: true, description: 'Valid numeric code' },
  { input: '0', expected: true, description: 'Single digit' },
  { input: '999999999', expected: true, description: 'Long numeric code' },
  { input: '', expected: true, description: 'Empty string (optional)' },
  
  // Invalid cases
  { input: '123abc', expected: false, description: 'Contains letters' },
  { input: 'abc123', expected: false, description: 'Starts with letters' },
  { input: '123-456', expected: false, description: 'Contains hyphen' },
  { input: '123.456', expected: false, description: 'Contains period' },
  { input: '123 456', expected: false, description: 'Contains space' },
  { input: ' 123456', expected: false, description: 'Leading space' },
  { input: '123456 ', expected: false, description: 'Trailing space' },
  { input: '123@456', expected: false, description: 'Contains special character' },
]

console.log('Testing Codigo Estudiantil Validation\n')
console.log('=' .repeat(60))

let passed = 0
let failed = 0

testCases.forEach((testCase, index) => {
  const result = validateCodigoEstudiantil(testCase.input)
  const success = result.isValid === testCase.expected
  
  if (success) {
    passed++
    console.log(`✓ Test ${index + 1}: ${testCase.description}`)
    console.log(`  Input: "${testCase.input}"`)
    console.log(`  Expected: ${testCase.expected ? 'Valid' : 'Invalid'}`)
    console.log(`  Result: ${result.isValid ? 'Valid' : 'Invalid'}`)
  } else {
    failed++
    console.log(`✗ Test ${index + 1}: ${testCase.description}`)
    console.log(`  Input: "${testCase.input}"`)
    console.log(`  Expected: ${testCase.expected ? 'Valid' : 'Invalid'}`)
    console.log(`  Result: ${result.isValid ? 'Valid' : 'Invalid'}`)
    console.log(`  Error: ${result.error}`)
  }
  console.log('')
})

console.log('=' .repeat(60))
console.log(`\nTest Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests`)

if (failed === 0) {
  console.log('\n✓ All validation tests passed!')
  process.exit(0)
} else {
  console.log('\n✗ Some tests failed')
  process.exit(1)
}

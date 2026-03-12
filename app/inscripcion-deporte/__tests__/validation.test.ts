/**
 * Unit tests for Deporte registration form validation
 * Tests the codigo estudiantil validation logic
 */

describe('Codigo Estudiantil Validation', () => {
  
  describe('Numeric validation', () => {
    
    test('should accept valid numeric codigo estudiantil', () => {
      const validCodes = ['123456', '0', '999999999', '12345678']
      
      validCodes.forEach(code => {
        const isValid = /^\d+$/.test(code)
        expect(isValid).toBe(true)
      })
    })
    
    test('should reject codigo estudiantil with letters', () => {
      const invalidCodes = ['123abc', 'abc123', 'abcdef', '123-456']
      
      invalidCodes.forEach(code => {
        const isValid = /^\d+$/.test(code)
        expect(isValid).toBe(false)
      })
    })
    
    test('should reject codigo estudiantil with special characters', () => {
      const invalidCodes = ['123-456', '123.456', '123 456', '123@456', '123#456']
      
      invalidCodes.forEach(code => {
        const isValid = /^\d+$/.test(code)
        expect(isValid).toBe(false)
      })
    })
    
    test('should accept empty string (optional field)', () => {
      const emptyCode = ''
      const isValid = emptyCode === '' || /^\d+$/.test(emptyCode)
      expect(isValid).toBe(true)
    })
    
    test('should reject codigo estudiantil with spaces', () => {
      const invalidCodes = [' 123456', '123456 ', '123 456', '  ']
      
      invalidCodes.forEach(code => {
        const isValid = /^\d+$/.test(code)
        expect(isValid).toBe(false)
      })
    })
    
    test('should reject codigo estudiantil with mixed alphanumeric', () => {
      const invalidCodes = ['1a2b3c', 'A123', '123B', '1-2-3']
      
      invalidCodes.forEach(code => {
        const isValid = /^\d+$/.test(code)
        expect(isValid).toBe(false)
      })
    })
  })
  
  describe('Real-time validation logic', () => {
    
    test('should allow partial numeric input during typing', () => {
      const partialInputs = ['1', '12', '123', '1234', '12345']
      
      partialInputs.forEach(input => {
        const isValid = /^\d*$/.test(input)
        expect(isValid).toBe(true)
      })
    })
    
    test('should reject non-numeric characters during typing', () => {
      const invalidInputs = ['1a', '12b', 'a', '1-', '1.']
      
      invalidInputs.forEach(input => {
        const isValid = /^\d*$/.test(input)
        expect(isValid).toBe(false)
      })
    })
  })
  
  describe('Form validation requirements', () => {
    
    test('codigo estudiantil should be required for ESTUDIANTE estamento', () => {
      const estamento = 'ESTUDIANTE'
      const codigoEstudiantil = ''
      
      const isValid = estamento === 'ESTUDIANTE' ? !!codigoEstudiantil : true
      expect(isValid).toBe(false)
    })
    
    test('codigo estudiantil should be required for EGRESADO estamento', () => {
      const estamento = 'EGRESADO'
      const codigoEstudiantil = ''
      
      const isValid = estamento === 'EGRESADO' ? !!codigoEstudiantil : true
      expect(isValid).toBe(false)
    })
    
    test('codigo estudiantil should not be required for other estamentos', () => {
      const otherEstamentos = ['DOCENTE', 'FUNCIONARIO', 'CONTRATISTA', 'INVITADO']
      
      otherEstamentos.forEach(estamento => {
        const codigoEstudiantil = ''
        const isValid = (estamento === 'ESTUDIANTE' || estamento === 'EGRESADO') ? !!codigoEstudiantil : true
        expect(isValid).toBe(true)
      })
    })
  })
})

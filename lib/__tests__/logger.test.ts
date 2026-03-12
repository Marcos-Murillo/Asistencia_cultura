/**
 * Unit tests for logging functionality
 * Task 25.1: Agregar logging de eventos clave
 */

import {
  logAreaSwitch,
  logCrossAreaAccess,
  logRoutingError,
  logEnvValidation,
  logDbOperation,
  logTransaction,
  logDataIsolationViolation,
} from '../logger'

// Mock console methods
const originalConsoleLog = console.log
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

describe('Logger - Task 25.1: Agregar logging de eventos clave', () => {
  let consoleLogSpy: jest.SpyInstance
  let consoleErrorSpy: jest.SpyInstance
  let consoleWarnSpy: jest.SpyInstance

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
    consoleErrorSpy.mockRestore()
    consoleWarnSpy.mockRestore()
  })

  describe('logAreaSwitch - Log de cambios de área por Super_Admin', () => {
    it('should log area switch with correct format', () => {
      logAreaSwitch('user123', 'cultura', 'deporte')

      expect(consoleLogSpy).toHaveBeenCalledTimes(1)
      const logMessage = consoleLogSpy.mock.calls[0][0]
      
      expect(logMessage).toContain('[area-switch]')
      expect(logMessage).toContain('[INFO]')
      expect(logMessage).toContain('Super_Admin switched area')
      expect(logMessage).toContain('user123')
      expect(logMessage).toContain('cultura')
      expect(logMessage).toContain('deporte')
    })

    it('should include metadata in log', () => {
      logAreaSwitch('admin-user', 'deporte', 'cultura')

      const logMessage = consoleLogSpy.mock.calls[0][0]
      expect(logMessage).toContain('"userId":"admin-user"')
      expect(logMessage).toContain('"fromArea":"deporte"')
      expect(logMessage).toContain('"toArea":"cultura"')
    })
  })

  describe('logCrossAreaAccess - Log de intentos de acceso cross-área', () => {
    it('should log cross-area access attempt with warning level', () => {
      logCrossAreaAccess('user456', 'cultura', 'deporte', 'getAllUsers')

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      const logMessage = consoleWarnSpy.mock.calls[0][0]
      
      expect(logMessage).toContain('[cross-area-access]')
      expect(logMessage).toContain('[WARN]')
      expect(logMessage).toContain('Cross-area access attempt detected')
    })

    it('should include security violation severity', () => {
      logCrossAreaAccess('user789', 'deporte', 'cultura', 'saveUserProfile')

      const logMessage = consoleWarnSpy.mock.calls[0][0]
      expect(logMessage).toContain('"severity":"security-violation"')
      expect(logMessage).toContain('"userArea":"deporte"')
      expect(logMessage).toContain('"attemptedArea":"cultura"')
      expect(logMessage).toContain('"operation":"saveUserProfile"')
    })
  })

  describe('logRoutingError - Log de errores de enrutamiento', () => {
    it('should log routing error with error level', () => {
      logRoutingError('cultura', 'getUserById', 'User not found')

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const logMessage = consoleErrorSpy.mock.calls[0][0]
      
      expect(logMessage).toContain('[routing-error]')
      expect(logMessage).toContain('[ERROR]')
      expect(logMessage).toContain('Database routing error')
    })

    it('should handle undefined area', () => {
      logRoutingError(undefined, 'validateArea', 'Area not specified')

      const logMessage = consoleErrorSpy.mock.calls[0][0]
      expect(logMessage).toContain('"area":')
      expect(logMessage).toContain('"operation":"validateArea"')
      expect(logMessage).toContain('"error":"Area not specified"')
    })

    it('should include additional details', () => {
      logRoutingError('deporte', 'saveAttendance', 'Invalid group ID', {
        groupId: 'invalid-123',
        userId: 'user-456',
      })

      const logMessage = consoleErrorSpy.mock.calls[0][0]
      expect(logMessage).toContain('"groupId":"invalid-123"')
      expect(logMessage).toContain('"userId":"user-456"')
    })
  })

  describe('logEnvValidation - Log de validación de variables de entorno', () => {
    it('should log successful validation with info level', () => {
      logEnvValidation(true)

      expect(consoleLogSpy).toHaveBeenCalledTimes(1)
      const logMessage = consoleLogSpy.mock.calls[0][0]
      
      expect(logMessage).toContain('[env-validation]')
      expect(logMessage).toContain('[INFO]')
      expect(logMessage).toContain('Environment variables validated successfully')
      expect(logMessage).toContain('"status":"valid"')
    })

    it('should log failed validation with error level', () => {
      const missing = ['NEXT_PUBLIC_FIREBASE_DEPORTE_API_KEY', 'NEXT_PUBLIC_FIREBASE_DEPORTE_PROJECT_ID']
      logEnvValidation(false, missing)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const logMessage = consoleErrorSpy.mock.calls[0][0]
      
      expect(logMessage).toContain('[env-validation]')
      expect(logMessage).toContain('[ERROR]')
      expect(logMessage).toContain('Environment variable validation failed')
      expect(logMessage).toContain('"status":"invalid"')
      expect(logMessage).toContain('"count":2')
    })

    it('should include list of missing variables', () => {
      const missing = ['VAR1', 'VAR2', 'VAR3']
      logEnvValidation(false, missing)

      const logMessage = consoleErrorSpy.mock.calls[0][0]
      expect(logMessage).toContain('"missingVariables":["VAR1","VAR2","VAR3"]')
    })
  })

  describe('logTransaction', () => {
    it('should log transaction start', () => {
      logTransaction('txn-123', 'cultura', 'start')

      expect(consoleLogSpy).toHaveBeenCalledTimes(1)
      const logMessage = consoleLogSpy.mock.calls[0][0]
      
      expect(logMessage).toContain('[transaction]')
      expect(logMessage).toContain('[INFO]')
      expect(logMessage).toContain('Transaction start')
      expect(logMessage).toContain('"transactionId":"txn-123"')
      expect(logMessage).toContain('"area":"cultura"')
    })

    it('should log transaction end', () => {
      logTransaction('txn-456', 'deporte', 'end')

      const logMessage = consoleLogSpy.mock.calls[0][0]
      expect(logMessage).toContain('Transaction end')
    })

    it('should log transaction error with error level', () => {
      logTransaction('txn-789', 'cultura', 'error', { reason: 'Connection timeout' })

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const logMessage = consoleErrorSpy.mock.calls[0][0]
      
      expect(logMessage).toContain('[ERROR]')
      expect(logMessage).toContain('Transaction error')
      expect(logMessage).toContain('"reason":"Connection timeout"')
    })
  })

  describe('logDataIsolationViolation', () => {
    it('should log data isolation violation with critical severity', () => {
      logDataIsolationViolation('cultura', 'deporte', 'beginTransaction')

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const logMessage = consoleErrorSpy.mock.calls[0][0]
      
      expect(logMessage).toContain('[cross-area-access]')
      expect(logMessage).toContain('[ERROR]')
      expect(logMessage).toContain('Data isolation violation detected')
      expect(logMessage).toContain('"severity":"critical"')
      expect(logMessage).toContain('"currentArea":"cultura"')
      expect(logMessage).toContain('"requestedArea":"deporte"')
    })
  })

  describe('logDbOperation', () => {
    it('should log database operation with debug level', () => {
      logDbOperation('cultura', 'insert', 'user_profiles', { userId: 'user-123' })

      expect(consoleLogSpy).toHaveBeenCalledTimes(1)
      const logMessage = consoleLogSpy.mock.calls[0][0]
      
      expect(logMessage).toContain('[db-operation]')
      expect(logMessage).toContain('[DEBUG]')
      expect(logMessage).toContain('Database operation: insert')
      expect(logMessage).toContain('"area":"cultura"')
      expect(logMessage).toContain('"collection":"user_profiles"')
    })
  })

  describe('Log format consistency', () => {
    it('should include timestamp in ISO format', () => {
      logAreaSwitch('user', 'cultura', 'deporte')

      const logMessage = consoleLogSpy.mock.calls[0][0]
      // Check for ISO timestamp pattern (YYYY-MM-DDTHH:mm:ss.sssZ)
      expect(logMessage).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/)
    })

    it('should include category in all logs', () => {
      logAreaSwitch('user', 'cultura', 'deporte')
      logRoutingError('cultura', 'test', 'error')
      logEnvValidation(true)

      expect(consoleLogSpy.mock.calls[0][0]).toContain('[area-switch]')
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('[routing-error]')
      expect(consoleLogSpy.mock.calls[1][0]).toContain('[env-validation]')
    })

    it('should include level in all logs', () => {
      logAreaSwitch('user', 'cultura', 'deporte')
      logCrossAreaAccess('user', 'cultura', 'deporte', 'test')
      logRoutingError('cultura', 'test', 'error')

      expect(consoleLogSpy.mock.calls[0][0]).toContain('[INFO]')
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('[WARN]')
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('[ERROR]')
    })
  })
})

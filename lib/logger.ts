/**
 * Centralized logging utility for sistema-multi-area
 * Provides structured logging for key system events
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug'
export type LogCategory = 
  | 'area-switch'
  | 'cross-area-access'
  | 'routing-error'
  | 'env-validation'
  | 'db-operation'
  | 'transaction'

interface LogEntry {
  timestamp: string
  level: LogLevel
  category: LogCategory
  message: string
  metadata?: Record<string, any>
}

/**
 * Format and output a log entry
 */
function log(entry: LogEntry): void {
  const prefix = `[${entry.timestamp}] [${entry.category}] [${entry.level.toUpperCase()}]`
  const message = `${prefix} ${entry.message}`
  
  const metadata = entry.metadata ? ` | ${JSON.stringify(entry.metadata)}` : ''
  const fullMessage = message + metadata
  
  switch (entry.level) {
    case 'error':
      console.error(fullMessage)
      break
    case 'warn':
      console.warn(fullMessage)
      break
    case 'debug':
    case 'info':
    default:
      console.log(fullMessage)
      break
  }
}

/**
 * Create a log entry with current timestamp
 */
function createLogEntry(
  level: LogLevel,
  category: LogCategory,
  message: string,
  metadata?: Record<string, any>
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
    metadata,
  }
}

/**
 * Log area switch by Super_Admin
 * Task 25.1: Log de cambios de área por Super_Admin
 */
export function logAreaSwitch(userId: string, fromArea: string, toArea: string): void {
  log(createLogEntry('info', 'area-switch', 'Super_Admin switched area', {
    userId,
    fromArea,
    toArea,
  }))
}

/**
 * Log cross-area access attempts
 * Task 25.1: Log de intentos de acceso cross-área
 */
export function logCrossAreaAccess(
  userId: string,
  userArea: string,
  attemptedArea: string,
  operation: string
): void {
  log(createLogEntry('warn', 'cross-area-access', 'Cross-area access attempt detected', {
    userId,
    userArea,
    attemptedArea,
    operation,
    severity: 'security-violation',
  }))
}

/**
 * Log routing errors
 * Task 25.1: Log de errores de enrutamiento
 */
export function logRoutingError(
  area: string | undefined,
  operation: string,
  error: string,
  details?: Record<string, any>
): void {
  log(createLogEntry('error', 'routing-error', 'Database routing error', {
    area,
    operation,
    error,
    ...details,
  }))
}

/**
 * Log environment variable validation results
 * Task 25.1: Log de validación de variables de entorno
 */
export function logEnvValidation(valid: boolean, missing?: string[]): void {
  if (valid) {
    log(createLogEntry('info', 'env-validation', 'Environment variables validated successfully', {
      status: 'valid',
    }))
  } else {
    log(createLogEntry('error', 'env-validation', 'Environment variable validation failed', {
      status: 'invalid',
      missingVariables: missing,
      count: missing?.length || 0,
    }))
  }
}

/**
 * Log database operations (for debugging)
 */
export function logDbOperation(
  area: string,
  operation: string,
  collection: string,
  details?: Record<string, any>
): void {
  log(createLogEntry('debug', 'db-operation', `Database operation: ${operation}`, {
    area,
    collection,
    ...details,
  }))
}

/**
 * Log transaction events
 */
export function logTransaction(
  transactionId: string,
  area: string,
  action: 'start' | 'end' | 'error',
  details?: Record<string, any>
): void {
  const level = action === 'error' ? 'error' : 'info'
  log(createLogEntry(level, 'transaction', `Transaction ${action}`, {
    transactionId,
    area,
    ...details,
  }))
}

/**
 * Log data isolation violations
 */
export function logDataIsolationViolation(
  currentArea: string,
  requestedArea: string,
  operation: string
): void {
  log(createLogEntry('error', 'cross-area-access', 'Data isolation violation detected', {
    currentArea,
    requestedArea,
    operation,
    severity: 'critical',
  }))
}

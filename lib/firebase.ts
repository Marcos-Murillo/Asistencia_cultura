import { getFirestoreForArea, validateEnvironmentVariables } from './firebase-config'

// Validar variables de entorno al inicializar
const validation = validateEnvironmentVariables()
if (!validation.valid) {
  console.error('⚠️ Firebase initialization warning: Some environment variables are missing')
  console.error('Missing variables:', validation.missing)
}

// Mantener backward compatibility: exportar db como instancia de Cultura
// Esto asegura que el código existente siga funcionando sin cambios
export const db = getFirestoreForArea('cultura')

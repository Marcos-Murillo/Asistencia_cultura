# Guía de Migración - Sistema Multi-Área

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Agregar Nuevas Áreas](#agregar-nuevas-áreas)
3. [Proceso de Inicialización de Grupos](#proceso-de-inicialización-de-grupos)
4. [Troubleshooting Común](#troubleshooting-común)
5. [Validación Post-Migración](#validación-post-migración)

---

## Introducción

Esta guía proporciona instrucciones detalladas para extender el sistema multi-área de la Universidad del Valle. El sistema actualmente soporta dos áreas (Cultura y Deporte) y está diseñado para ser extensible a áreas adicionales.

### Arquitectura del Sistema

El sistema multi-área utiliza:
- **Bases de datos Firebase independientes** por área
- **Enrutador de base de datos** (`lib/db-router.ts`) que dirige consultas según el área
- **Sistema de contexto** (`contexts/area-context.tsx`) que proporciona el área actual
- **Gestión de roles** (`lib/role-manager.ts`) con permisos específicos por área

### Requisitos Previos

Antes de agregar una nueva área, asegúrese de tener:
- Acceso administrativo a Firebase Console
- Permisos para modificar variables de entorno
- Conocimiento de TypeScript y Next.js
- Acceso al repositorio del proyecto

---

## Agregar Nuevas Áreas

### Paso 1: Crear Nueva Base de Datos Firebase

1. **Crear nuevo proyecto en Firebase Console**
   ```
   - Ir a https://console.firebase.google.com/
   - Clic en "Agregar proyecto"
   - Nombre: "Universidad Valle - [Nombre del Área]"
   - Habilitar Google Analytics (opcional)
   ```

2. **Configurar Firestore Database**
   ```
   - En el proyecto Firebase, ir a "Firestore Database"
   - Clic en "Crear base de datos"
   - Seleccionar modo: "Producción" o "Prueba" según necesidad
   - Elegir ubicación: us-central1 (o la más cercana)
   ```

3. **Obtener credenciales del proyecto**
   ```
   - Ir a Configuración del proyecto (ícono de engranaje)
   - Sección "Tus apps" → Seleccionar "Web"
   - Copiar el objeto de configuración Firebase
   ```

### Paso 2: Configurar Variables de Entorno

1. **Agregar variables al archivo `.env.local`**
   ```bash
   # Nueva Área - [Nombre del Área]
   NEXT_PUBLIC_FIREBASE_[AREA]_API_KEY=tu_api_key
   NEXT_PUBLIC_FIREBASE_[AREA]_AUTH_DOMAIN=tu_auth_domain
   NEXT_PUBLIC_FIREBASE_[AREA]_PROJECT_ID=tu_project_id
   NEXT_PUBLIC_FIREBASE_[AREA]_STORAGE_BUCKET=tu_storage_bucket
   NEXT_PUBLIC_FIREBASE_[AREA]_MESSAGING_SENDER_ID=tu_sender_id
   NEXT_PUBLIC_FIREBASE_[AREA]_APP_ID=tu_app_id
   NEXT_PUBLIC_FIREBASE_[AREA]_MEASUREMENT_ID=tu_measurement_id
   ```

   **Ejemplo para área "Investigación":**
   ```bash
   NEXT_PUBLIC_FIREBASE_INVESTIGACION_API_KEY=AIzaSyC...
   NEXT_PUBLIC_FIREBASE_INVESTIGACION_AUTH_DOMAIN=investigacion.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_INVESTIGACION_PROJECT_ID=investigacion-12345
   NEXT_PUBLIC_FIREBASE_INVESTIGACION_STORAGE_BUCKET=investigacion.appspot.com
   NEXT_PUBLIC_FIREBASE_INVESTIGACION_MESSAGING_SENDER_ID=123456789
   NEXT_PUBLIC_FIREBASE_INVESTIGACION_APP_ID=1:123456789:web:abc123
   NEXT_PUBLIC_FIREBASE_INVESTIGACION_MEASUREMENT_ID=G-ABC123
   ```

2. **Agregar variables al entorno de producción**
   - Vercel: Dashboard → Settings → Environment Variables
   - Otras plataformas: Seguir documentación específica

### Paso 3: Actualizar Tipos TypeScript

1. **Modificar `lib/firebase-config.ts`**
   ```typescript
   // Agregar nuevo tipo de área
   export type Area = 'cultura' | 'deporte' | 'investigacion' // Agregar nueva área
   
   // Agregar configuración
   const investigacionConfig: FirebaseConfig = {
     apiKey: process.env.NEXT_PUBLIC_FIREBASE_INVESTIGACION_API_KEY!,
     authDomain: process.env.NEXT_PUBLIC_FIREBASE_INVESTIGACION_AUTH_DOMAIN!,
     projectId: process.env.NEXT_PUBLIC_FIREBASE_INVESTIGACION_PROJECT_ID!,
     storageBucket: process.env.NEXT_PUBLIC_FIREBASE_INVESTIGACION_STORAGE_BUCKET!,
     messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_INVESTIGACION_MESSAGING_SENDER_ID!,
     appId: process.env.NEXT_PUBLIC_FIREBASE_INVESTIGACION_APP_ID!,
     measurementId: process.env.NEXT_PUBLIC_FIREBASE_INVESTIGACION_MEASUREMENT_ID!,
   }
   
   // Agregar instancias
   let investigacionApp: FirebaseApp
   let investigacionDb: Firestore
   ```

2. **Actualizar función de inicialización**
   ```typescript
   export function initializeFirebaseApps(): void {
     // ... código existente para cultura y deporte ...
     
     // Agregar inicialización para nueva área
     if (!investigacionApp) {
       investigacionApp = initializeApp(investigacionConfig, 'investigacion')
       investigacionDb = getFirestore(investigacionApp)
     }
   }
   ```

3. **Actualizar función getFirestoreForArea**
   ```typescript
   export function getFirestoreForArea(area: Area): Firestore {
     initializeFirebaseApps()
     
     switch (area) {
       case 'cultura':
         return culturaDb
       case 'deporte':
         return deporteDb
       case 'investigacion':
         return investigacionDb
       default:
         throw new Error(`Área no válida: ${area}`)
     }
   }
   ```

4. **Actualizar validación de variables de entorno**
   ```typescript
   export function validateEnvironmentVariables(): { valid: boolean; missing: string[] } {
     const required = [
       // ... variables existentes ...
       'NEXT_PUBLIC_FIREBASE_INVESTIGACION_API_KEY',
       'NEXT_PUBLIC_FIREBASE_INVESTIGACION_AUTH_DOMAIN',
       'NEXT_PUBLIC_FIREBASE_INVESTIGACION_PROJECT_ID',
       'NEXT_PUBLIC_FIREBASE_INVESTIGACION_STORAGE_BUCKET',
       'NEXT_PUBLIC_FIREBASE_INVESTIGACION_MESSAGING_SENDER_ID',
       'NEXT_PUBLIC_FIREBASE_INVESTIGACION_APP_ID',
       'NEXT_PUBLIC_FIREBASE_INVESTIGACION_MEASUREMENT_ID',
     ]
     
     const missing = required.filter(key => !process.env[key])
     return { valid: missing.length === 0, missing }
   }
   ```

### Paso 4: Actualizar Componente Area Selector

1. **Modificar `components/area-selector.tsx`**
   ```typescript
   export function AreaSelector() {
     const { area, setArea, canSwitchArea } = useArea()
     
     if (!canSwitchArea) {
       return null
     }
     
     return (
       <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow">
         <span className="text-sm font-medium text-gray-700">Área:</span>
         <select
           value={area}
           onChange={(e) => setArea(e.target.value as Area)}
           className="px-3 py-1 border border-gray-300 rounded-md"
         >
           <option value="cultura">Cultura</option>
           <option value="deporte">Deporte</option>
           <option value="investigacion">Investigación</option> {/* Nueva opción */}
         </select>
       </div>
     )
   }
   ```

### Paso 5: Configurar Reglas de Seguridad Firestore

1. **Copiar reglas de seguridad existentes**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Perfiles de usuario
       match /user_profiles/{userId} {
         allow read: if request.auth != null;
         allow write: if request.auth != null;
       }
       
       // Usuarios administradores
       match /admin_users/{adminId} {
         allow read, write: if request.auth != null && 
           get(/databases/$(database)/documents/admin_users/$(request.auth.uid)).data.role == 'ADMIN';
       }
       
       // Grupos
       match /cultural_groups/{groupId} {
         allow read: if request.auth != null;
         allow write: if request.auth != null && 
           get(/databases/$(database)/documents/admin_users/$(request.auth.uid)).data.role == 'ADMIN';
       }
       
       // Registros de asistencia
       match /attendance_records/{recordId} {
         allow read: if request.auth != null;
         allow write: if request.auth != null;
       }
       
       // Eventos
       match /events/{eventId} {
         allow read: if request.auth != null;
         allow write: if request.auth != null;
       }
       
       // Inscripciones a grupos
       match /group_enrollments/{enrollmentId} {
         allow read: if request.auth != null;
         allow write: if request.auth != null;
       }
       
       // Gestores de grupos
       match /group_managers/{managerId} {
         allow read: if request.auth != null;
         allow write: if request.auth != null && 
           get(/databases/$(database)/documents/admin_users/$(request.auth.uid)).data.role == 'ADMIN';
       }
     }
   }
   ```

2. **Aplicar reglas en Firebase Console**
   ```
   - Ir a Firestore Database → Reglas
   - Pegar las reglas de seguridad
   - Clic en "Publicar"
   ```

### Paso 6: Crear Página de Inscripción (Opcional)

Si el área requiere una página de inscripción personalizada:

1. **Crear `app/inscripcion-[area]/page.tsx`**
   ```typescript
   'use client'
   
   import { useState } from 'react'
   import { useArea } from '@/contexts/area-context'
   import { saveUserProfile } from '@/lib/db-router'
   
   export default function InscripcionInvestigacionPage() {
     const { area } = useArea()
     // ... implementar formulario específico del área
   }
   ```

---

## Proceso de Inicialización de Grupos

### Crear Script de Inicialización

1. **Crear archivo `scripts/init-[area]-groups.ts`**
   ```typescript
   import { createCulturalGroup } from '@/lib/db-router'
   import type { Area } from '@/lib/firebase-config'
   
   const GRUPOS_INVESTIGACION = [
     "Grupo de Investigación 1",
     "Grupo de Investigación 2",
     "Grupo de Investigación 3",
     // ... agregar todos los grupos
   ]
   
   export async function initializeInvestigacionGroups(): Promise<void> {
     const area: Area = 'investigacion'
     
     console.log(`Inicializando grupos de ${area}...`)
     
     for (const grupo of GRUPOS_INVESTIGACION) {
       try {
         await createCulturalGroup(area, grupo)
         console.log(`✓ Creado: ${grupo}`)
       } catch (error) {
         console.error(`✗ Error creando ${grupo}:`, error)
       }
     }
     
     console.log('Inicialización completada')
   }
   
   // Ejecutar si se llama directamente
   if (require.main === module) {
     initializeInvestigacionGroups()
       .then(() => process.exit(0))
       .catch((error) => {
         console.error('Error en inicialización:', error)
         process.exit(1)
       })
   }
   ```

2. **Agregar script al `package.json`**
   ```json
   {
     "scripts": {
       "init:investigacion": "ts-node scripts/init-investigacion-groups.ts"
     }
   }
   ```

### Ejecutar Inicialización

1. **Ejecutar script localmente**
   ```bash
   npm run init:investigacion
   ```

2. **Verificar creación de grupos**
   ```bash
   # Opción 1: Verificar en Firebase Console
   # Ir a Firestore Database → cultural_groups
   
   # Opción 2: Crear script de verificación
   npm run verify:groups -- --area=investigacion
   ```

### Validar Grupos Creados

1. **Crear script de validación `scripts/verify-groups.ts`**
   ```typescript
   import { getAllCulturalGroups } from '@/lib/db-router'
   import type { Area } from '@/lib/firebase-config'
   
   async function verifyGroups(area: Area, expectedCount: number) {
     console.log(`Verificando grupos de ${area}...`)
     
     const groups = await getAllCulturalGroups(area)
     
     console.log(`✓ Grupos encontrados: ${groups.length}`)
     console.log(`✓ Grupos esperados: ${expectedCount}`)
     
     if (groups.length === expectedCount) {
       console.log('✅ Verificación exitosa')
       return true
     } else {
       console.error('❌ Número de grupos no coincide')
       return false
     }
   }
   
   // Uso: ts-node scripts/verify-groups.ts --area=investigacion --count=50
   const area = process.argv[2]?.split('=')[1] as Area
   const count = parseInt(process.argv[3]?.split('=')[1] || '0')
   
   verifyGroups(area, count)
   ```

---

## Troubleshooting Común

### Problema 1: Error "Missing Environment Variables"

**Síntoma:**
```
Error: Missing required environment variables: NEXT_PUBLIC_FIREBASE_[AREA]_API_KEY
```

**Solución:**
1. Verificar que todas las variables estén en `.env.local`
2. Reiniciar el servidor de desarrollo: `npm run dev`
3. Verificar que no haya espacios en blanco en los valores
4. Confirmar que el prefijo `NEXT_PUBLIC_` esté presente

**Verificación:**
```bash
# Listar variables de entorno
printenv | grep FIREBASE
```

### Problema 2: Error "Firebase App Already Exists"

**Síntoma:**
```
Error: Firebase app named '[area]' already exists
```

**Solución:**
1. Verificar que cada área use un nombre único en `initializeApp(config, 'nombre-unico')`
2. Asegurar que la inicialización solo ocurra una vez (usar guards `if (!app)`)
3. Reiniciar la aplicación

**Código correcto:**
```typescript
if (!investigacionApp) {
  investigacionApp = initializeApp(investigacionConfig, 'investigacion')
  investigacionDb = getFirestore(investigacionApp)
}
```

### Problema 3: Consultas Retornan Datos Vacíos

**Síntoma:**
- Las consultas no retornan datos esperados
- Los grupos no aparecen en la interfaz

**Solución:**
1. Verificar que el área esté correctamente configurada en el contexto
2. Confirmar que los datos existan en la base de datos correcta
3. Revisar reglas de seguridad de Firestore

**Debug:**
```typescript
// Agregar logs temporales
console.log('Área actual:', area)
console.log('Base de datos:', getFirestoreForArea(area))
console.log('Resultados:', await getAllCulturalGroups(area))
```

### Problema 4: Error de Permisos en Firestore

**Síntoma:**
```
Error: Missing or insufficient permissions
```

**Solución:**
1. Verificar reglas de seguridad en Firebase Console
2. Confirmar que el usuario esté autenticado
3. Revisar que las reglas permitan la operación específica

**Reglas de prueba (solo desarrollo):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // ⚠️ Solo para desarrollo
    }
  }
}
```

### Problema 5: Área No Cambia en Super Admin

**Síntoma:**
- El selector de área no actualiza los datos
- Los datos siguen mostrando el área anterior

**Solución:**
1. Verificar que `canSwitchArea` sea `true` para Super Admin
2. Confirmar que el contexto se actualice correctamente
3. Revisar que las páginas usen el hook `useArea()`

**Verificación:**
```typescript
const { area, setArea, canSwitchArea } = useArea()
console.log('Puede cambiar área:', canSwitchArea)
console.log('Área actual:', area)
```

### Problema 6: Grupos Duplicados Después de Inicialización

**Síntoma:**
- Los grupos aparecen múltiples veces
- El script de inicialización se ejecutó varias veces

**Solución:**
1. Eliminar grupos duplicados manualmente en Firebase Console
2. Modificar script para verificar existencia antes de crear:

```typescript
async function createGroupIfNotExists(area: Area, groupName: string) {
  const existingGroups = await getAllCulturalGroups(area)
  const exists = existingGroups.some(g => g.nombre === groupName)
  
  if (!exists) {
    await createCulturalGroup(area, groupName)
    console.log(`✓ Creado: ${groupName}`)
  } else {
    console.log(`⊘ Ya existe: ${groupName}`)
  }
}
```

### Problema 7: TypeScript Errors Después de Agregar Área

**Síntoma:**
```
Type '"investigacion"' is not assignable to type 'Area'
```

**Solución:**
1. Verificar que el tipo `Area` incluya la nueva área
2. Reiniciar el servidor TypeScript en el IDE
3. Ejecutar `npm run type-check`

**Verificar tipo:**
```typescript
// lib/firebase-config.ts
export type Area = 'cultura' | 'deporte' | 'investigacion'
```

---

## Validación Post-Migración

### Checklist de Validación

#### 1. Configuración de Base de Datos
- [ ] Variables de entorno configuradas correctamente
- [ ] Conexión a Firebase establecida
- [ ] Reglas de seguridad aplicadas
- [ ] Colecciones creadas en Firestore

#### 2. Inicialización de Grupos
- [ ] Script de inicialización ejecutado
- [ ] Número correcto de grupos creados
- [ ] Grupos visibles en Firebase Console
- [ ] Campo `area` correcto en cada grupo

#### 3. Funcionalidad de Interfaz
- [ ] Selector de área muestra nueva opción (Super Admin)
- [ ] Cambio de área actualiza datos correctamente
- [ ] Páginas cargan sin errores
- [ ] Formularios funcionan correctamente

#### 4. Permisos y Roles
- [ ] Super Admin puede acceder a nueva área
- [ ] Admin del área puede gestionar usuarios
- [ ] Usuarios normales ven solo su área
- [ ] Filtrado por grupos funciona correctamente

#### 5. Operaciones CRUD
- [ ] Crear usuarios en nueva área
- [ ] Leer datos de nueva área
- [ ] Actualizar registros en nueva área
- [ ] Eliminar datos de nueva área

### Scripts de Validación Automatizada

1. **Crear suite de pruebas `tests/area-validation.test.ts`**
   ```typescript
   import { describe, test, expect } from 'vitest'
   import { getFirestoreForArea, validateEnvironmentVariables } from '@/lib/firebase-config'
   import { getAllCulturalGroups } from '@/lib/db-router'
   import type { Area } from '@/lib/firebase-config'
   
   describe('Validación de Nueva Área', () => {
     const area: Area = 'investigacion'
     
     test('Variables de entorno configuradas', () => {
       const validation = validateEnvironmentVariables()
       expect(validation.valid).toBe(true)
       expect(validation.missing).toHaveLength(0)
     })
     
     test('Conexión a base de datos establecida', () => {
       const db = getFirestoreForArea(area)
       expect(db).toBeDefined()
     })
     
     test('Grupos inicializados correctamente', async () => {
       const groups = await getAllCulturalGroups(area)
       expect(groups.length).toBeGreaterThan(0)
       expect(groups.every(g => g.area === area)).toBe(true)
     })
   })
   ```

2. **Ejecutar validación**
   ```bash
   npm run test -- area-validation.test.ts
   ```

### Monitoreo Post-Despliegue

1. **Métricas a monitorear**
   - Tasa de éxito de consultas por área
   - Tiempo de respuesta por área
   - Errores de autenticación
   - Cambios de área por Super Admin

2. **Logs importantes**
   ```typescript
   // Agregar logging en producción
   console.log('[AREA_SWITCH]', { userId, fromArea, toArea, timestamp })
   console.log('[QUERY_ROUTE]', { area, collection, success, duration })
   console.log('[AUTH_DETECT]', { userId, detectedArea, timestamp })
   ```

3. **Alertas recomendadas**
   - Tasa de error > 5% en consultas de nueva área
   - Tiempo de respuesta > 2s en operaciones de nueva área
   - Intentos de acceso cross-área no autorizados

---

## Mejores Prácticas

### 1. Nomenclatura Consistente

- Usar nombres de área en minúsculas: `'investigacion'`, no `'Investigacion'`
- Prefijos de variables de entorno: `NEXT_PUBLIC_FIREBASE_[AREA]_`
- Nombres de scripts: `init-[area]-groups.ts`

### 2. Aislamiento de Datos

- Nunca mezclar datos de diferentes áreas en una consulta
- Validar área antes de cada operación de base de datos
- Usar transacciones solo dentro de una misma área

### 3. Testing

- Escribir tests unitarios para nueva área
- Ejecutar suite de regresión completa
- Validar backward compatibility con áreas existentes

### 4. Documentación

- Actualizar README.md con nueva área
- Documentar grupos específicos del área
- Mantener esta guía actualizada

### 5. Rollback Plan

- Mantener backup de configuración anterior
- Documentar pasos de rollback
- Probar rollback en ambiente de staging

---

## Recursos Adicionales

### Documentación Relacionada

- [README.md](../README.md) - Documentación general del proyecto
- [Design Document](.kiro/specs/sistema-multi-area/design.md) - Diseño técnico del sistema
- [Requirements](.kiro/specs/sistema-multi-area/requirements.md) - Requisitos del sistema

### Comandos Útiles

```bash
# Verificar variables de entorno
npm run env:check

# Inicializar grupos de área
npm run init:[area]

# Verificar grupos creados
npm run verify:groups -- --area=[area]

# Ejecutar tests de área
npm run test -- area-validation

# Limpiar datos de prueba
npm run clean:[area]
```

### Contacto y Soporte

Para preguntas o problemas durante la migración:
- Revisar issues en el repositorio
- Consultar con el equipo de desarrollo
- Verificar logs de Firebase Console

---

## Changelog

### Versión 1.0 (2024)
- Guía inicial para sistema multi-área
- Soporte para Cultura y Deporte
- Instrucciones para agregar nuevas áreas

---

**Última actualización:** 2024
**Mantenido por:** Equipo de Desarrollo Universidad del Valle

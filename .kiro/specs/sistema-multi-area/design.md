# Design Document: Sistema Multi-Área

## Overview

Este documento describe el diseño técnico para implementar un sistema multi-área en la plataforma de la Universidad del Valle, expandiendo la funcionalidad actual del área de Cultura para soportar también el área de Deporte. El diseño se centra en mantener backward compatibility total mientras se introduce una arquitectura escalable que soporta múltiples áreas con bases de datos independientes.

### Principios de Diseño

1. **Separación de Datos**: Cada área mantiene su propia base de datos Firebase completamente independiente
2. **Backward Compatibility**: La funcionalidad existente de Cultura no se modifica
3. **Reutilización de Código**: Los componentes y páginas se reutilizan para ambas áreas mediante un sistema de contexto
4. **Abstracción de Datos**: Una capa de enrutamiento transparente dirige las consultas a la BD correcta

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           Area Context Provider                        │ │
│  │  - Detecta área del usuario                           │ │
│  │  - Proporciona configuración de área                  │ │
│  └────────────────────────────────────────────────────────┘ │
│                            │                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Database Router (lib/db-router.ts)            │ │
│  │  - Enruta consultas según área                        │ │
│  │  - Mantiene instancias de BD separadas               │ │
│  └────────────────────────────────────────────────────────┘ │
│              │                           │                   │
└──────────────┼───────────────────────────┼───────────────────┘
               │                           │
    ┌──────────▼──────────┐     ┌─────────▼──────────┐
    │   BD Cultura        │     │   BD Deporte       │
    │   (Firebase)        │     │   (Firebase)       │
    │   - Existente       │     │   - Nueva          │
    │   - Sin cambios     │     │   - Independiente  │
    └─────────────────────┘     └────────────────────┘
```

### Component Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Shared Components                          │
│  - Navigation                                                 │
│  - User Cards                                                 │
│  - Statistics Dashboards                                      │
│  - Forms                                                      │
│  (Adaptan comportamiento según área del contexto)            │
└──────────────────────────────────────────────────────────────┘
                            │
┌──────────────────────────────────────────────────────────────┐
│                    Area-Specific Pages                        │
│  Cultura:                    Deporte:                         │
│  - /inscripcion             - /inscripcion-deporte            │
│  - Usa BD_Cultura           - Usa BD_Deporte                  │
└──────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Database Configuration

#### Firebase Configuration Manager

**Archivo**: `lib/firebase-config.ts`

```typescript
import { initializeApp, FirebaseApp } from "firebase/app"
import { getFirestore, Firestore } from "firebase/firestore"

export type Area = 'cultura' | 'deporte'

interface FirebaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
  measurementId: string
}

// Configuración para Cultura (existente)
const culturaConfig: FirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID!,
}

// Configuración para Deporte (nueva)
const deporteConfig: FirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_DEPORTE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_DEPORTE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_DEPORTE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_DEPORTE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_DEPORTE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_DEPORTE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_DEPORTE_MEASUREMENT_ID!,
}

// Instancias de Firebase
let culturaApp: FirebaseApp
let deporteApp: FirebaseApp
let culturaDb: Firestore
let deporteDb: Firestore

// Inicializar aplicaciones Firebase
export function initializeFirebaseApps(): void {
  if (!culturaApp) {
    culturaApp = initializeApp(culturaConfig, 'cultura')
    culturaDb = getFirestore(culturaApp)
  }
  
  if (!deporteApp) {
    deporteApp = initializeApp(deporteConfig, 'deporte')
    deporteDb = getFirestore(deporteApp)
  }
}

// Obtener instancia de Firestore según área
export function getFirestoreForArea(area: Area): Firestore {
  initializeFirebaseApps()
  return area === 'cultura' ? culturaDb : deporteDb
}

// Validar que todas las variables de entorno estén presentes
export function validateEnvironmentVariables(): { valid: boolean; missing: string[] } {
  const required = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
    'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID',
    'NEXT_PUBLIC_FIREBASE_DEPORTE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_DEPORTE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_DEPORTE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_DEPORTE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_DEPORTE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_DEPORTE_APP_ID',
    'NEXT_PUBLIC_FIREBASE_DEPORTE_MEASUREMENT_ID',
  ]
  
  const missing = required.filter(key => !process.env[key])
  
  return {
    valid: missing.length === 0,
    missing
  }
}
```

### 2. Area Context System

#### Area Context Provider

**Archivo**: `contexts/area-context.tsx`

```typescript
'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import type { Area } from '@/lib/firebase-config'

interface AreaContextType {
  area: Area
  setArea: (area: Area) => void
  isSuperAdmin: boolean
  canSwitchArea: boolean
}

const AreaContext = createContext<AreaContextType | undefined>(undefined)

interface AreaProviderProps {
  children: React.ReactNode
  initialArea?: Area
  userRole?: 'SUPER_ADMIN' | 'ADMIN_CULTURA' | 'ADMIN_DEPORTE' | 'DIRECTOR' | 'MONITOR' | 'ENTRENADOR' | 'ESTUDIANTE'
}

export function AreaProvider({ children, initialArea = 'cultura', userRole = 'ESTUDIANTE' }: AreaProviderProps) {
  const [area, setAreaState] = useState<Area>(initialArea)
  const isSuperAdmin = userRole === 'SUPER_ADMIN'
  const canSwitchArea = isSuperAdmin
  
  // Persistir área seleccionada en localStorage (solo para super admin)
  useEffect(() => {
    if (isSuperAdmin) {
      const savedArea = localStorage.getItem('selectedArea') as Area | null
      if (savedArea && (savedArea === 'cultura' || savedArea === 'deporte')) {
        setAreaState(savedArea)
      }
    }
  }, [isSuperAdmin])
  
  const setArea = (newArea: Area) => {
    if (canSwitchArea) {
      setAreaState(newArea)
      localStorage.setItem('selectedArea', newArea)
    }
  }
  
  return (
    <AreaContext.Provider value={{ area, setArea, isSuperAdmin, canSwitchArea }}>
      {children}
    </AreaContext.Provider>
  )
}

export function useArea() {
  const context = useContext(AreaContext)
  if (context === undefined) {
    throw new Error('useArea must be used within an AreaProvider')
  }
  return context
}
```

### 3. Database Router

#### Database Router with Area-Aware Functions

**Archivo**: `lib/db-router.ts`

```typescript
import { getFirestoreForArea, type Area } from './firebase-config'
import type { Firestore } from 'firebase/firestore'

// Re-exportar todas las funciones de firestore.ts pero con soporte para área
// Cada función recibe un parámetro adicional 'area' que determina qué BD usar

export async function saveUserProfile(
  area: Area,
  profile: Omit<UserProfile, "id" | "createdAt" | "lastAttendance">
): Promise<string> {
  const db = getFirestoreForArea(area)
  // Implementación usando db en lugar de la instancia global
  // ... resto del código igual que en firestore.ts
}

export async function getAllUsers(area: Area): Promise<UserProfile[]> {
  const db = getFirestoreForArea(area)
  // Implementación usando db
}

// ... todas las demás funciones con el parámetro area
```

### 4. Extended User Model

#### Updated User Types

**Archivo**: `lib/types.ts` (extensiones)

```typescript
// Extensión del tipo UserProfile existente
export interface UserProfile {
  id: string
  nombres: string
  correo: string
  numeroDocumento: string
  telefono: string
  genero: "MUJER" | "HOMBRE" | "OTRO"
  etnia: "AFRO" | "GITANO O ROM" | "INDIGENA" | "MESTIZO" | "PALENQUERO" | "RAIZAL" | "NO SABE" | "NO RESPONDE"
  tipoDocumento: "TARGETA DE IDENTIDAD" | "CEDULA" | "CEDULA DE EXTRANJERIA" | "PASAPORTE"
  edad: number
  sede: string
  estamento: "ESTUDIANTE" | "EGRESADO" | "DOCENTE" | "DOCENTE HORA CATEDRA" | "FUNCIONARIO" | "CONTRATISTA" | "INVITADO"
  codigoEstudiante?: string
  facultad?: string
  programaAcademico?: string
  
  // Nuevos campos para sistema multi-área
  area: 'cultura' | 'deporte'
  codigoEstudiantil?: string  // Solo para Deporte
  gruposAsignados?: string[]  // Solo para Entrenador/Monitor de Deporte
  
  rol?: UserRole
  createdAt: Date
  lastAttendance: Date
}

// Roles extendidos
export type UserRole = 
  | "ESTUDIANTE"
  | "DIRECTOR"      // Cultura: 1 grupo
  | "MONITOR"       // Cultura: 1 grupo, Deporte: N grupos
  | "ENTRENADOR"    // Deporte: N grupos
  | "ADMIN"
  | "SUPER_ADMIN"

// Tipo para determinar área de un usuario
export interface UserAreaInfo {
  area: 'cultura' | 'deporte'
  rol: UserRole
  grupoAsignado?: string      // Para Director/Monitor de Cultura
  gruposAsignados?: string[]  // Para Entrenador/Monitor de Deporte
}
```

### 5. Role Management System

#### Role-Based Access Control

**Archivo**: `lib/role-manager.ts`

```typescript
import type { Area, UserRole, UserProfile } from './types'

export interface RolePermissions {
  canViewAllGroups: boolean
  canViewAllUsers: boolean
  canManageUsers: boolean
  canSwitchArea: boolean
  assignedGroups: string[]
}

export function getRolePermissions(
  userRole: UserRole,
  area: Area,
  user: UserProfile
): RolePermissions {
  switch (userRole) {
    case 'SUPER_ADMIN':
      return {
        canViewAllGroups: true,
        canViewAllUsers: true,
        canManageUsers: true,
        canSwitchArea: true,
        assignedGroups: [],
      }
    
    case 'ADMIN':
      return {
        canViewAllGroups: true,
        canViewAllUsers: true,
        canManageUsers: true,
        canSwitchArea: false,
        assignedGroups: [],
      }
    
    case 'DIRECTOR':
      // Director de Cultura: solo 1 grupo
      return {
        canViewAllGroups: false,
        canViewAllUsers: false,
        canManageUsers: false,
        canSwitchArea: false,
        assignedGroups: user.grupoAsignado ? [user.grupoAsignado] : [],
      }
    
    case 'MONITOR':
      if (area === 'cultura') {
        // Monitor de Cultura: solo 1 grupo
        return {
          canViewAllGroups: false,
          canViewAllUsers: false,
          canManageUsers: false,
          canSwitchArea: false,
          assignedGroups: user.grupoAsignado ? [user.grupoAsignado] : [],
        }
      } else {
        // Monitor de Deporte: múltiples grupos
        return {
          canViewAllGroups: false,
          canViewAllUsers: false,
          canManageUsers: false,
          canSwitchArea: false,
          assignedGroups: user.gruposAsignados || [],
        }
      }
    
    case 'ENTRENADOR':
      // Entrenador de Deporte: múltiples grupos
      return {
        canViewAllGroups: false,
        canViewAllUsers: false,
        canManageUsers: false,
        canSwitchArea: false,
        assignedGroups: user.gruposAsignados || [],
      }
    
    case 'ESTUDIANTE':
    default:
      return {
        canViewAllGroups: false,
        canViewAllUsers: false,
        canManageUsers: false,
        canSwitchArea: false,
        assignedGroups: [],
      }
  }
}

// Filtrar datos según permisos del usuario
export function filterDataByPermissions<T extends { grupoCultural?: string }>(
  data: T[],
  permissions: RolePermissions
): T[] {
  if (permissions.canViewAllGroups) {
    return data
  }
  
  if (permissions.assignedGroups.length === 0) {
    return []
  }
  
  return data.filter(item => 
    item.grupoCultural && permissions.assignedGroups.includes(item.grupoCultural)
  )
}
```

### 6. Area Selector Component

#### UI Component for Super Admin

**Archivo**: `components/area-selector.tsx`

```typescript
'use client'

import { useArea } from '@/contexts/area-context'
import type { Area } from '@/lib/firebase-config'

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
        className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="cultura">Cultura</option>
        <option value="deporte">Deporte</option>
      </select>
    </div>
  )
}
```

### 7. Deporte Groups Initialization

#### Script to Create Deporte Groups

**Archivo**: `scripts/init-deporte-groups.ts`

```typescript
import { createCulturalGroup } from '@/lib/db-router'

const GRUPOS_DEPORTE = [
  "Ajedrez Representativo",
  "Ajedrez Funcionarios",
  "Ajedrez Semillero",
  "Atletismo Representativo Estudiantes y Funcionarios",
  "Atletismo Semillero",
  "Baloncesto Representativo",
  "Baloncesto Funcionarios",
  "Balonmano Representativo Femenino y Masculino",
  "Bolos Funcionarios Femenino y Masculino",
  "Fútbol Femenino Representativo",
  "Fútbol Masculino Representativo",
  "Fútbol Masculino Semillero",
  "Fútbol Master",
  "Fútbol Libre",
  "Fútbol Sala Femenino Representativo y Semillero",
  "Fútbol Sala Masculino Representativo",
  "Fútbol Sala Masculino Funcionarios",
  "Judo",
  "Karate do",
  "Muay Thai y Sanda",
  "Natación Representativo Femenino y Masculino",
  "Natación Semillero Femenino y Masculino",
  "Natación Funcionarios",
  "Natación con Aletas",
  "Patinaje Representativo",
  "Patinaje Semillero",
  "Polo Acuático Femenino",
  "Polo Acuático Masculino",
  "Porrismo Representativo",
  "Porrismo Semillero",
  "Rugby Femenino Representativo y Semillero",
  "Rugby Masculino Representativo",
  "Rugby Masculino Semillero",
  "Rugby Masculino - Preparación física",
  "Sapo Funcionarios Femenino y Masculino Sintraunicol",
  "Taekwondo Representativo Femenino, Masculino y Semillero",
  "Tejo Funcionarios Sintraunicol",
  "Mini Tejo Funcionarios Sintraunicol",
  "Mini Tejo Funcionarios Sintraempuvalle",
  "Tenis de Campo Representativo Femenino y Masculino / Semillero Femenino y Masculino",
  "Tenis de Campo Funcionarios",
  "Tenis de Mesa Representativo Femenino y Masculino",
  "Tenis de Mesa Funcionarios",
  "Ultimate Representativo Femenino y Masculino",
  "Ultimate Semillero",
  "Voleibol Funcionarias Sintraunicol Femenino",
  "Voleibol Funcionarias Femenino",
  "Voleibol Funcionarios Masculino",
  "Voleibol Representativo Femenino y Masculino",
  "Voleibol Semillero",
  "Voleibol Arena Representativo",
  "Voleibol Arena Semillero",
  "Voleibol Arena Funcionarios",
]

export async function initializeDeporteGroups(): Promise<void> {
  console.log('Inicializando grupos de Deporte...')
  
  for (const grupo of GRUPOS_DEPORTE) {
    try {
      await createCulturalGroup('deporte', grupo)
      console.log(`✓ Creado: ${grupo}`)
    } catch (error) {
      console.error(`✗ Error creando ${grupo}:`, error)
    }
  }
  
  console.log('Inicialización completada')
}
```

## Data Models

### User Profile Schema (Extended)

```typescript
{
  // Campos existentes (sin cambios)
  id: string
  nombres: string
  correo: string
  numeroDocumento: string
  telefono: string
  genero: "MUJER" | "HOMBRE" | "OTRO"
  etnia: string
  tipoDocumento: string
  edad: number
  sede: string
  estamento: string
  codigoEstudiante?: string  // Existente (Cultura)
  facultad?: string
  programaAcademico?: string
  rol?: UserRole
  createdAt: Date
  lastAttendance: Date
  
  // Nuevos campos
  area: 'cultura' | 'deporte'
  codigoEstudiantil?: string  // Nuevo (Deporte)
  gruposAsignados?: string[]  // Nuevo (Deporte: Entrenador/Monitor)
}
```

### Group Manager Schema (Extended)

**Cultura** (sin cambios):
```typescript
{
  id: string
  userId: string
  grupoCultural: string  // Un solo grupo
  assignedAt: Date
  assignedBy: string
}
```

**Deporte** (nuevo):
```typescript
{
  id: string
  userId: string
  gruposAsignados: string[]  // Múltiples grupos
  assignedAt: Date
  assignedBy: string
}
```

### Database Collections Structure

**BD Cultura** (sin cambios):
- `user_profiles`
- `attendance_records`
- `events`
- `event_attendance_records`
- `group_enrollments`
- `cultural_groups`
- `admin_users`
- `group_managers`

**BD Deporte** (nueva, misma estructura):
- `user_profiles`
- `attendance_records`
- `events`
- `event_attendance_records`
- `group_enrollments`
- `cultural_groups` (contiene grupos deportivos)
- `admin_users`
- `group_managers` (con estructura extendida para múltiples grupos)

## Correctness Properties

*Una propiedad es una característica o comportamiento que debe ser verdadero en todas las ejecuciones válidas del sistema - esencialmente, una declaración formal sobre lo que el sistema debe hacer. Las propiedades sirven como puente entre especificaciones legibles por humanos y garantías de corrección verificables por máquina.*


### Database Initialization and Configuration Properties

Property 1: Database Connection Establishment
*For any* system initialization, both BD_Cultura and BD_Deporte connections should be successfully established and accessible
**Validates: Requirements 1.3**

Property 2: Area Detection from Authentication
*For any* authenticated user, the Enrutador_Area should correctly identify their area by checking which database contains their user record
**Validates: Requirements 1.4, 2.4**

Property 3: Query Routing by Area
*For any* database query and any user, the query should be automatically routed to the correct database (BD_Cultura or BD_Deporte) based on the user's area
**Validates: Requirements 1.5**

Property 4: Environment Variable Validation
*For any* system startup, if any required environment variable is missing, the system should log a descriptive error identifying the missing variable
**Validates: Requirements 11.2, 11.3**

### User Model and Schema Properties

Property 5: Area Field Presence
*For any* user in the system, the user profile should contain an "area" field with value either 'cultura' or 'deporte'
**Validates: Requirements 2.1**

Property 6: Email Independence Across Areas
*For any* email address, creating users with that email in both BD_Cultura and BD_Deporte should succeed without conflicts, maintaining complete independence
**Validates: Requirements 2.5**

Property 7: Grupos Asignados Array for Deporte
*For any* user with role Entrenador or Monitor in BD_Deporte, the gruposAsignados field should be an array (possibly empty) of group IDs
**Validates: Requirements 2.3**

Property 8: Default Student Role Assignment
*For any* new user created without group assignment, the rol field should be set to "ESTUDIANTE"
**Validates: Requirements 3.7**

### Role Assignment Constraints Properties

Property 9: Single Group Assignment for Cultura Managers
*For any* user with role Director or Monitor in BD_Cultura, they should be assigned to exactly one group (grupoAsignado field contains exactly one group ID)
**Validates: Requirements 3.3, 3.4**

Property 10: Multiple Group Assignment for Deporte Managers
*For any* user with role Entrenador or Monitor in BD_Deporte, they can be assigned to zero or more groups (gruposAsignados array can have any length >= 0)
**Validates: Requirements 3.5, 3.6**

### Data Filtering and Access Control Properties

Property 11: Group Visibility for Cultura Managers
*For any* Director or Monitor in Cultura accessing group pages, only their single assigned group should be visible in the results
**Validates: Requirements 6.6, 6.7, 7.1, 7.2**

Property 12: Group Visibility for Deporte Managers
*For any* Entrenador or Monitor in Deporte accessing group pages, all groups in their gruposAsignados array should be visible, and no other groups
**Validates: Requirements 6.8, 6.9, 7.3, 7.4**

Property 13: Data Filtering by Assigned Groups
*For any* Director, Monitor, or Entrenador accessing student lists, attendance records, or statistics, the data should include only records from their assigned groups
**Validates: Requirements 6.10, 6.11, 7.5, 7.6**

Property 14: Admin Full Visibility
*For any* Admin user accessing any data view, all groups and users from their area should be visible without filtering
**Validates: Requirements 7.7**

Property 15: Super Admin Area-Based Access
*For any* Super_Admin with an area selected, all data queries should return results only from that selected area
**Validates: Requirements 6.1, 6.3, 8.2**

Property 16: Area-Based Data Filtering
*For any* user (non-Super_Admin) accessing any data page, all results should be automatically filtered to show only data from their area
**Validates: Requirements 8.1, 8.3, 8.4, 8.5**

Property 17: Access Denial for Unauthorized Area
*For any* user without permissions for a specific area, attempts to access data from that area should be denied
**Validates: Requirements 6.12**

### Form Validation Properties

Property 18: Conditional Codigo Estudiantil Display
*For any* user on the Deporte inscription form, the "Código Estudiantil" field should be visible if and only if the selected estamento is "ESTUDIANTE" or "EGRESADO"
**Validates: Requirements 5.4, 5.5**

Property 19: Numeric Codigo Estudiantil Validation
*For any* form submission on the Deporte inscription form, if codigo estudiantil is present, it should be validated as numeric before accepting the submission
**Validates: Requirements 5.6**

Property 20: Deporte Form Data Persistence
*For any* valid form submission on /inscripcion-deporte, the user data should be saved to BD_Deporte and not to BD_Cultura
**Validates: Requirements 5.7**

### Group Management Properties

Property 21: Unique Group Names per Area
*For any* group in BD_Deporte, the group name should be unique within that database and the area field should be 'deporte'
**Validates: Requirements 4.2**

Property 22: Area-Filtered Group Queries
*For any* group query, only groups matching the user's area should be returned in the results
**Validates: Requirements 4.3**

### User Interface Properties

Property 23: Codigo Estudiantil Display for Deporte Users
*For any* user card displaying a Deporte user, if the user has a codigoEstudiantil value, it should be included in the displayed fields
**Validates: Requirements 10.1**

Property 24: Cultura User Card Preservation
*For any* user card displaying a Cultura user, the card should display the same fields as before implementation (no codigo estudiantil field)
**Validates: Requirements 10.2, 10.3**

### Combined Report Properties

Property 25: Combined Report Data Aggregation
*For any* Super_Admin request for a combined report, the system should query both BD_Cultura and BD_Deporte and aggregate the results
**Validates: Requirements 9.3**

Property 26: Combined Report Content Structure
*For any* generated combined report PDF, it should contain separate metrics for Cultura, separate metrics for Deporte, and combined totals
**Validates: Requirements 9.5**

### Data Isolation Properties

Property 27: Complete Data Isolation Between Areas
*For any* data write operation, the data should be stored exclusively in the database corresponding to the operation's area (Cultura data only in BD_Cultura, Deporte data only in BD_Deporte), with no cross-database writes
**Validates: Requirements 13.1, 13.2, 13.3**

Property 28: Transaction Boundary Enforcement
*For any* database transaction, all operations within the transaction should target only one database (either BD_Cultura or BD_Deporte, never both)
**Validates: Requirements 13.4**

Property 29: Explicit Area Specification
*For any* database operation, the target area should be explicitly specified in the operation parameters
**Validates: Requirements 13.5**

### Backward Compatibility Properties

Property 30: Cultura Functionality Preservation
*For any* Cultura user performing any action that existed before implementation, the behavior and results should be identical to the pre-implementation system
**Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5**

Property 31: Cultura Database Schema Preservation
*For any* collection or document structure in BD_Cultura, the schema should remain unchanged after implementation (no fields removed, no required fields added)
**Validates: Requirements 1.1**

### Code Reusability Properties

Property 32: Component Area Adaptation
*For any* UI component rendering, the component should dynamically adapt its behavior based on the area provided by the context, without requiring separate component implementations
**Validates: Requirements 14.1, 14.3, 14.4, 14.5**

## Error Handling

### Error Scenarios and Responses

1. **Missing Environment Variables**
   - Detection: On system initialization
   - Response: Log descriptive error with list of missing variables, prevent system startup
   - User Impact: System administrator notified to configure environment

2. **Database Connection Failure**
   - Detection: During Firebase initialization
   - Response: Log connection error with database identifier (Cultura/Deporte), retry with exponential backoff
   - User Impact: Temporary service unavailability, automatic recovery on connection restore

3. **Invalid Area Specification**
   - Detection: When routing database query
   - Response: Throw error with message "Invalid area specified: must be 'cultura' or 'deporte'"
   - User Impact: Operation fails, user sees error message

4. **Cross-Area Data Access Attempt**
   - Detection: When user attempts to access data from unauthorized area
   - Response: Return 403 Forbidden, log security event
   - User Impact: Access denied message displayed

5. **Duplicate Email in Same Area**
   - Detection: During user creation
   - Response: Return validation error "Email already exists in this area"
   - User Impact: User prompted to use different email or login

6. **Invalid Codigo Estudiantil Format**
   - Detection: During form validation
   - Response: Return validation error "Código estudiantil must be numeric"
   - User Impact: Form submission blocked, error message displayed

7. **Group Assignment Constraint Violation**
   - Detection: When assigning groups to Director/Monitor in Cultura
   - Response: Return validation error "Directors and Monitors in Cultura can only be assigned to one group"
   - User Impact: Assignment operation fails, error message displayed

8. **Transaction Spanning Multiple Databases**
   - Detection: During transaction initialization
   - Response: Throw error "Transactions cannot span multiple databases"
   - User Impact: Operation fails, developer notified to split transaction

### Error Recovery Strategies

1. **Database Connection Recovery**
   - Implement connection pooling with health checks
   - Automatic reconnection with exponential backoff
   - Fallback to read-only mode if write operations fail

2. **Data Consistency Recovery**
   - Implement idempotent operations where possible
   - Transaction rollback on partial failures
   - Audit log for tracking data modifications

3. **User Session Recovery**
   - Persist area selection in localStorage for Super_Admin
   - Automatic area detection on session restore
   - Graceful degradation if area cannot be determined

## Testing Strategy

### Dual Testing Approach

The testing strategy employs both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit Tests**: Verify specific examples, edge cases, and error conditions
- **Property Tests**: Verify universal properties across all inputs
- Both approaches are complementary and necessary for complete validation

### Unit Testing Focus

Unit tests should focus on:
- Specific examples demonstrating correct behavior
- Integration points between components (Area Context ↔ Database Router)
- Edge cases (empty gruposAsignados array, missing optional fields)
- Error conditions (invalid area, missing environment variables)

Avoid writing too many unit tests - property-based tests handle comprehensive input coverage.

### Property-Based Testing Configuration

**Library Selection**: Use `fast-check` for TypeScript/JavaScript property-based testing

**Test Configuration**:
- Minimum 100 iterations per property test (due to randomization)
- Each property test must reference its design document property
- Tag format: `Feature: sistema-multi-area, Property {number}: {property_text}`

**Example Property Test Structure**:

```typescript
import fc from 'fast-check'

// Feature: sistema-multi-area, Property 5: Area Field Presence
test('all users have valid area field', () => {
  fc.assert(
    fc.property(
      fc.record({
        nombres: fc.string(),
        correo: fc.emailAddress(),
        area: fc.constantFrom('cultura', 'deporte'),
        // ... other fields
      }),
      async (user) => {
        const savedId = await saveUserProfile(user.area, user)
        const retrieved = await getUserById(user.area, savedId)
        
        expect(retrieved.area).toBeDefined()
        expect(['cultura', 'deporte']).toContain(retrieved.area)
      }
    ),
    { numRuns: 100 }
  )
})

// Feature: sistema-multi-area, Property 9: Single Group Assignment for Cultura Managers
test('Cultura managers assigned to exactly one group', () => {
  fc.assert(
    fc.property(
      fc.record({
        rol: fc.constantFrom('DIRECTOR', 'MONITOR'),
        grupoAsignado: fc.string(),
      }),
      async (manager) => {
        await assignGroupManager('cultura', manager.userId, manager.grupoAsignado)
        const assignments = await getGroupManagers('cultura', manager.grupoAsignado)
        
        const userAssignments = assignments.filter(a => a.userId === manager.userId)
        expect(userAssignments).toHaveLength(1)
      }
    ),
    { numRuns: 100 }
  )
})
```

### Integration Testing

**Critical Integration Points**:
1. Area Context → Database Router
2. Database Router → Firebase Instances
3. Authentication → Area Detection
4. Super Admin Area Selector → Query Routing

**Integration Test Scenarios**:
- User authenticates → Area detected → Correct database queried
- Super Admin switches area → All subsequent queries use new database
- Form submission → Data saved to correct database
- Group manager accesses data → Filtered by assigned groups

### End-to-End Testing

**Critical User Flows**:
1. Cultura user registration and group enrollment (verify no changes from current system)
2. Deporte user registration with codigo estudiantil
3. Super Admin switches between areas and views different data
4. Entrenador assigns to multiple groups and sees all assigned groups
5. Combined report generation with data from both areas

### Test Data Management

**Test Database Setup**:
- Use Firebase Emulator for local testing
- Separate test instances for Cultura and Deporte
- Seed data includes users from both areas with various roles

**Test Data Cleanup**:
- Automated cleanup after each test suite
- Isolated test environments prevent cross-test contamination

### Performance Testing

**Key Performance Metrics**:
- Database query response time (should be < 200ms for 95th percentile)
- Area switching latency (should be < 100ms)
- Combined report generation time (should be < 5s for typical dataset)

**Load Testing Scenarios**:
- Concurrent users from both areas
- Super Admin rapidly switching between areas
- Bulk data operations (enrollment, attendance recording)

### Security Testing

**Security Test Cases**:
- Attempt cross-area data access without permissions
- Attempt to modify area field directly
- Attempt SQL injection in area parameter
- Verify data isolation between databases

### Backward Compatibility Testing

**Regression Test Suite**:
- All existing Cultura functionality must pass unchanged
- Existing Cultura routes return same responses
- Existing Cultura components render identically
- Existing Cultura database queries produce same results

**Compatibility Verification**:
- Run full existing test suite against new implementation
- Compare API responses before and after implementation
- Visual regression testing for UI components

## Implementation Notes

### Migration Strategy

1. **Phase 1: Infrastructure Setup**
   - Add environment variables for BD_Deporte
   - Initialize Firebase configuration manager
   - Validate all environment variables

2. **Phase 2: Database Router Implementation**
   - Create database router with area-aware functions
   - Implement area detection logic
   - Add query routing mechanism

3. **Phase 3: Context System**
   - Implement Area Context Provider
   - Add Area Selector component for Super Admin
   - Integrate context into existing pages

4. **Phase 4: Deporte-Specific Features**
   - Create /inscripcion-deporte page
   - Initialize Deporte groups
   - Implement codigo estudiantil field

5. **Phase 5: Role Extensions**
   - Extend user model with new fields
   - Implement multiple group assignment for Deporte
   - Update role management logic

6. **Phase 6: Testing and Validation**
   - Run backward compatibility tests
   - Execute property-based tests
   - Perform integration testing

7. **Phase 7: Deployment**
   - Deploy to staging environment
   - Validate with real data
   - Deploy to production

### Rollback Plan

If issues are discovered post-deployment:

1. **Immediate Rollback**: Revert to previous version (Cultura-only system)
2. **Data Preservation**: BD_Deporte remains intact for future retry
3. **Investigation**: Analyze logs and error reports
4. **Fix and Redeploy**: Address issues and redeploy

### Monitoring and Observability

**Key Metrics to Monitor**:
- Database connection health (both Cultura and Deporte)
- Query routing success rate
- Area detection accuracy
- Error rates by area
- Response times by area

**Logging Strategy**:
- Log all area switches by Super Admin
- Log all cross-area access attempts (should be zero)
- Log all database routing decisions
- Log all environment variable validation results

**Alerting**:
- Alert on database connection failures
- Alert on elevated error rates
- Alert on cross-area access attempts
- Alert on missing environment variables

## Deployment Considerations

### Environment Variables

Required new environment variables:
```
NEXT_PUBLIC_FIREBASE_DEPORTE_API_KEY=AIzaSyCLe17mMLU6kX5TW0myy_yY1-wAPf3q-Fo
NEXT_PUBLIC_FIREBASE_DEPORTE_AUTH_DOMAIN=cdudemo-94ab9.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DEPORTE_PROJECT_ID=cdudemo-94ab9
NEXT_PUBLIC_FIREBASE_DEPORTE_STORAGE_BUCKET=cdudemo-94ab9.firebasestorage.app
NEXT_PUBLIC_FIREBASE_DEPORTE_MESSAGING_SENDER_ID=537488637769
NEXT_PUBLIC_FIREBASE_DEPORTE_APP_ID=1:537488637769:web:77f5649124cd3ddb472498
NEXT_PUBLIC_FIREBASE_DEPORTE_MEASUREMENT_ID=G-P0R0MH1CHQ
```

### Database Initialization

Before first deployment:
1. Create BD_Deporte Firebase project
2. Configure Firestore security rules (same as BD_Cultura)
3. Run initialization script to create 70 Deporte groups
4. Verify database connectivity

### Security Rules

Firestore security rules for BD_Deporte should mirror BD_Cultura:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profiles - authenticated users can read their own
    match /user_profiles/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Admin users - only admins can read/write
    match /admin_users/{adminId} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/admin_users/$(request.auth.uid)).data.role == 'ADMIN';
    }
    
    // Other collections follow similar patterns
  }
}
```

### Performance Optimization

**Database Indexing**:
- Index on `area` field for all collections
- Composite index on `area` + `grupoCultural` for group queries
- Index on `gruposAsignados` array for Deporte managers

**Caching Strategy**:
- Cache area detection results per session
- Cache group lists per area
- Invalidate cache on area switch

**Query Optimization**:
- Use pagination for large result sets
- Implement lazy loading for group member lists
- Batch queries where possible

## Future Enhancements

### Potential Extensions

1. **Additional Areas**: Architecture supports adding more areas (e.g., "investigacion", "extension")
2. **Cross-Area Reports**: Enhanced reporting with cross-area analytics
3. **Area-Specific Workflows**: Custom workflows per area
4. **Multi-Area Users**: Support for users belonging to multiple areas simultaneously
5. **Chat IA for Deporte**: Extend AI chat system to support Deporte area

### Scalability Considerations

- Current architecture supports unlimited areas
- Database router can be extended with connection pooling
- Area context can support hierarchical areas (sub-areas)
- Role system can be extended with custom permissions per area

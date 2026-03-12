# Task 13.9: Fix Usuarios Page - Area-Aware Operations and Deporte Terminology

## Problems Fixed

### 1. Botones de Cambiar Rol y Eliminar No Funcionaban
Los botones no funcionaban porque las funciones `updateUserRole` y `deleteUser` no eran conscientes del área y estaban usando la base de datos por defecto (cultura).

### 2. Terminología Incorrecta para Deporte
La página usaba "Director" y "Encargado" para todas las áreas, pero en deporte debería decir "Entrenador".

## Solution Implemented

### 1. Created Area-Aware Functions in `lib/db-router.ts`

Added three new area-aware functions:

```typescript
// Update user role (area-aware)
export async function updateUserRole(
  area: Area, 
  userId: string, 
  role: string
): Promise<void>

// Delete user (area-aware)
export async function deleteUser(
  area: Area, 
  userId: string
): Promise<void>

// Get user enrollments (area-aware) - already existed
export async function getUserEnrollments(
  area: Area, 
  userId: string
): Promise<Array<{...}>>
```

These functions:
- Accept an `area` parameter ('cultura' | 'deporte')
- Use `getFirestoreForArea(area)` to get the correct database
- Perform operations on the area-specific database
- The `deleteUser` function also deletes related records (attendance, enrollments, event attendance)

### 2. Updated `/usuarios/page.tsx`

#### Changed Imports
```typescript
// Before
import { deleteUser, getUserEnrollments } from "@/lib/firestore"

// After
import { 
  deleteUser as deleteUserRouter, 
  updateUserRole as updateUserRoleRouter, 
  getUserEnrollments as getUserEnrollmentsRouter 
} from "@/lib/db-router"
```

#### Updated Function Calls
All function calls now include the `area` parameter:
- `deleteUserRouter(area, userId)`
- `updateUserRoleRouter(area, userId, role)`
- `getUserEnrollmentsRouter(area, userId)`

#### Added Dynamic Terminology Based on Area

**Dropdown Menu:**
```typescript
Asignar como {area === 'deporte' ? 'Entrenador' : 'Encargado'}
```

**Role Selection Dialog:**
```typescript
<SelectItem value="DIRECTOR">
  {area === 'deporte' ? 'Entrenador' : 'Director'}
</SelectItem>
```

**Role Description:**
```typescript
Los roles de {area === 'deporte' ? 'Entrenador' : 'Director'} y Monitor 
permiten gestionar grupos {area === 'deporte' ? 'deportivos' : 'culturales'}.
```

**Group Assignment Dialog:**
```typescript
// Title
Asignar como {area === 'deporte' ? 'Entrenador' : 'Encargado'} de Grupo

// Description
Asigna a {user.nombres} como {area === 'deporte' ? 'entrenador' : 'encargado'} 
de un grupo {area === 'deporte' ? 'deportivo' : 'cultural'}

// Label
Grupo {area === 'deporte' ? 'Deportivo' : 'Cultural'}

// Button
Asignar como {area === 'deporte' ? 'Entrenador' : 'Encargado'}
```

## Terminology Changes

### Cultura Area
- Director → Director
- Encargado → Encargado
- Grupo Cultural → Grupo Cultural

### Deporte Area
- Director → Entrenador
- Encargado → Entrenador
- Grupo Cultural → Grupo Deportivo

## Data Flow

### Update Role Flow
1. User clicks "Asignar Rol" in dropdown menu
2. Dialog opens with role selector
3. User selects role (shows "Entrenador" if area is deporte)
4. Calls `updateUserRoleRouter(area, userId, role)`
5. Function updates user in area-specific database
6. Page reloads users from correct database

### Delete User Flow
1. User clicks "Eliminar" in dropdown menu
2. Confirmation dialog appears
3. User confirms deletion
4. Calls `deleteUserRouter(area, userId)`
5. Function deletes:
   - All attendance records for user
   - All group enrollments for user
   - All event attendance records for user
   - User profile
6. All deletions happen in area-specific database
7. Page reloads users from correct database

### View User Details Flow
1. User clicks "Ver Usuario" in dropdown menu
2. Calls `getUserEnrollmentsRouter(area, userId)`
3. Function gets enrollments from area-specific database
4. Dialog shows user details with correct enrollments

## Files Modified

- `lib/db-router.ts` - Added area-aware functions for updateUserRole, deleteUser
- `app/usuarios/page.tsx` - Updated to use area-aware functions and dynamic terminology

## Testing

To verify the fixes work:

1. **Test Role Assignment:**
   - Go to `/usuarios`
   - Switch to deporte area
   - Click on a user's dropdown menu
   - Click "Asignar Rol"
   - Verify it shows "Entrenador" instead of "Director"
   - Assign a role and verify it saves correctly

2. **Test User Deletion:**
   - Go to `/usuarios`
   - Switch to deporte area
   - Click on a user's dropdown menu
   - Click "Eliminar"
   - Confirm deletion
   - Verify user is deleted from deporte database

3. **Test Terminology:**
   - Switch between cultura and deporte areas
   - Verify terminology changes:
     - Cultura: "Director", "Encargado", "Grupo Cultural"
     - Deporte: "Entrenador", "Entrenador", "Grupo Deportivo"

## Database Operations

All operations now correctly target the area-specific database:

- **Cultura**: `cultuaraasistencia` database
- **Deporte**: `cdudemo-94ab9` database

This ensures data isolation and prevents cross-database operations.

# Task 13.15: Corrección de Consistencia en Asignaciones de Group Managers

## Problema Identificado
Cuando se asignaba un entrenador/monitor desde la página de usuarios, no aparecía en la página de grupos. El problema era que la página de usuarios estaba verificando y removiendo asignaciones usando la base de datos por defecto (cultura) en lugar de la base de datos del área actual.

## Causa Raíz
En `app/usuarios/page.tsx`, las funciones `handleAssignGroup` y `handleRemoveGroup` estaban usando:
```typescript
const managersRef = collection(db, "group_managers") // db por defecto = cultura
```

Esto causaba que:
1. Al verificar si un usuario ya tenía grupo asignado, solo buscaba en cultura
2. Al remover un grupo, solo buscaba en cultura
3. Las asignaciones en deporte no se detectaban ni se podían remover correctamente

## Solución Implementada

### 1. Uso de Base de Datos Area-Aware en `handleAssignGroup`
**Antes:**
```typescript
const managersRef = collection(db, "group_managers")
const q = query(managersRef, where("userId", "==", user.id))
```

**Después:**
```typescript
const areaDb = getFirestoreForArea(area)
const managersRef = collection(areaDb, "group_managers")
const q = query(managersRef, where("userId", "==", user.id))
```

### 2. Uso de Base de Datos Area-Aware en `handleRemoveGroup`
**Antes:**
```typescript
const managersRef = collection(db, "group_managers")
const q = query(managersRef, where("userId", "==", userToAssignGroup.id))
```

**Después:**
```typescript
const areaDb = getFirestoreForArea(area)
const managersRef = collection(areaDb, "group_managers")
const q = query(managersRef, where("userId", "==", userToAssignGroup.id))
```

### 3. Logging Agregado
Se agregaron logs para facilitar el debugging:
```typescript
console.log("[Usuarios] Checking if user has assigned group in area:", area)
console.log("[Usuarios] Found", snapshot.size, "assignments")
console.log("[Usuarios] Removing group assignment in area:", area)
```

### 4. Import Agregado
Se agregó el import necesario:
```typescript
import { getFirestoreForArea } from "@/lib/firebase-config"
```

## Flujo Completo Corregido

### Asignar desde Usuarios:
1. Usuario abre diálogo de asignar grupo
2. Sistema verifica en la base de datos del área actual si ya tiene grupo
3. Usuario selecciona grupo y confirma
4. `assignGroupManager(area, userId, group, assignedBy)` guarda en base de datos del área
5. Asignación queda guardada en la base de datos correcta

### Ver en Grupos:
1. Usuario va a página de grupos
2. `loadGroups()` carga grupos del área actual
3. Para cada grupo, llama `getGroupManagers(area, groupName)`
4. `getGroupManagers` busca en la base de datos del área actual
5. Encuentra la asignación y la muestra correctamente

## Verificación de Consistencia
Ambas páginas ahora usan exactamente las mismas funciones:
- `assignGroupManager(area, userId, group, assignedBy)` - Para asignar
- `getGroupManagers(area, groupName)` - Para listar
- `removeGroupManager(area, managerId)` - Para remover

Todas estas funciones:
- Están en `lib/db-router.ts`
- Son area-aware
- Usan `getFirestoreForArea(area)` para obtener la base de datos correcta
- Tienen logging para debugging

## Script de Diagnóstico
Se creó `scripts/diagnose-group-managers.ts` para verificar:
- Asignaciones en cada área
- Duplicados
- Inconsistencias

## Validación
- ✅ No hay errores de TypeScript
- ✅ Ambas páginas usan la misma función area-aware
- ✅ Verificaciones usan la base de datos del área actual
- ✅ Logging agregado para debugging

## Archivos Modificados
- `app/usuarios/page.tsx` - Corregidas funciones para usar base de datos area-aware
- `scripts/diagnose-group-managers.ts` - Script de diagnóstico creado

## Próximos Pasos para el Usuario
1. Ir a página de usuarios en deporte
2. Asignar un usuario como entrenador de un grupo deportivo
3. Ir a página de grupos (sin recargar, solo navegando)
4. Verificar que el entrenador aparezca en la lista de encargados del grupo
5. Probar remover desde usuarios y verificar que desaparezca de grupos
6. Repetir prueba en cultura para verificar que sigue funcionando

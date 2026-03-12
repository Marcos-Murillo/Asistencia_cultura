# Task 13.11: Unificación de Asignaciones de Grupos (Group Managers)

## Problema Identificado
Las funciones de asignación de encargados de grupos (`assignGroupManager`, `getGroupManagers`, `removeGroupManager`) en `lib/auth.ts` no eran area-aware, lo que causaba que:
- Las asignaciones en deporte se guardaban en la base de datos de cultura
- Los encargados asignados desde la página de usuarios no aparecían en la página de grupos
- No había consistencia entre las dos páginas

## Solución Implementada

### 1. Funciones Area-Aware en `lib/db-router.ts`
Se crearon versiones area-aware de las funciones de group managers:

```typescript
// Assign group manager (area-aware)
export async function assignGroupManager(
  area: Area,
  userId: string,
  grupoCultural: string,
  assignedBy: string,
): Promise<void>

// Get group managers (area-aware)
export async function getGroupManagers(
  area: Area, 
  grupoCultural: string
): Promise<Array<{...}>>

// Remove group manager (area-aware)
export async function removeGroupManager(
  area: Area, 
  managerId: string
): Promise<void>
```

Estas funciones:
- Validan que el área esté especificada
- Usan `getFirestoreForArea(area)` para obtener la base de datos correcta
- Guardan/leen de la colección `group_managers` en la base de datos del área correspondiente
- Incluyen logging para debugging

### 2. Actualización de `app/usuarios/page.tsx`
- Importa las funciones desde `lib/db-router` en lugar de `lib/auth`
- Pasa el parámetro `area` a todas las llamadas:
  - `assignGroupManager(area, userId, group, assignedBy)`
  - `removeGroupManager(area, managerId)`

### 3. Actualización de `app/grupos/page.tsx`
- Importa las funciones desde `lib/db-router` en lugar de `lib/auth`
- Pasa el parámetro `area` a todas las llamadas:
  - `getGroupManagers(area, groupName)`
  - `assignGroupManager(area, userId, group, assignedBy)`
  - `removeGroupManager(area, managerId)`

## Flujo Completo
1. Usuario asigna monitor/entrenador desde página de usuarios → se guarda en base de datos del área actual
2. Usuario va a página de grupos → carga encargados desde base de datos del área actual
3. Ambas páginas ahora están sincronizadas y usan la misma base de datos según el área

## Validación
- ✅ No hay errores de TypeScript en los archivos modificados
- ✅ Las funciones validan que el área esté especificada
- ✅ Se usa la base de datos correcta según el área
- ✅ Consistencia entre páginas de usuarios y grupos

## Archivos Modificados
- `lib/db-router.ts` - Agregadas funciones area-aware para group managers
- `app/usuarios/page.tsx` - Actualizado para usar funciones area-aware
- `app/grupos/page.tsx` - Actualizado para usar funciones area-aware

## Próximos Pasos para el Usuario
1. Probar asignar un monitor/entrenador en deporte desde la página de usuarios
2. Verificar que aparezca en la página de grupos cuando se está en el área de deporte
3. Probar asignar desde la página de grupos y verificar consistencia
4. Verificar que en cultura sigue funcionando correctamente

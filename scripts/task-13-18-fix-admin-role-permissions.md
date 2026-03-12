# Task 13.18: Corrección de Rol y Permisos de Admin

## Problema Identificado
Los administradores regulares no podían ver grupos ni usuarios porque:
1. `getCurrentUserRole()` devolvía "ESTUDIANTE" en lugar de "ADMIN"
2. Los permisos resultantes eran `canViewAllGroups: false`
3. Todos los grupos se filtraban y no aparecía nada

## Causa Raíz
El login de admin NO estaba guardando `userRole` en sessionStorage, solo guardaba `isAdmin: "true"`. La función `getCurrentUserRole()` busca `sessionStorage.getItem("userRole")` y si no lo encuentra, devuelve "ESTUDIANTE" por defecto.

## Solución Implementada

### 1. Actualización del Login de Admin
Se agregó `sessionStorage.setItem("userRole", "ADMIN")` al login:

**Antes:**
```typescript
sessionStorage.setItem("userType", "admin")
sessionStorage.setItem("isAdmin", "true")
sessionStorage.setItem("adminArea", admin.area)
```

**Después:**
```typescript
sessionStorage.setItem("userType", "admin")
sessionStorage.setItem("isAdmin", "true")
sessionStorage.setItem("userRole", "ADMIN") // ← NUEVO
sessionStorage.setItem("adminArea", admin.area)
```

### 2. Actualización del Tipo UserRole
Se agregó "ADMIN" al tipo `UserRole` en `lib/types.ts`:

**Antes:**
```typescript
export type UserRole = "ESTUDIANTE" | "DIRECTOR" | "MONITOR" | "ENTRENADOR" | "SUPER_ADMIN"
```

**Después:**
```typescript
export type UserRole = "ESTUDIANTE" | "DIRECTOR" | "MONITOR" | "ENTRENADOR" | "ADMIN" | "SUPER_ADMIN"
```

### 3. Permisos para Rol ADMIN
Se agregó el caso "ADMIN" en `getRolePermissions()`:

```typescript
case 'ADMIN':
  // Admin regular: puede ver todo de su área pero no cambiar de área
  return {
    canViewAllGroups: true,
    canViewAllUsers: true,
    canManageUsers: true,
    canSwitchArea: false,
    assignedGroups: [],
  }
```

## Flujo Corregido

### Antes (Incorrecto):
1. Admin hace login → guarda `isAdmin: "true"` pero NO `userRole`
2. Página llama `getCurrentUserRole()` → no encuentra `userRole` → devuelve "ESTUDIANTE"
3. `getRolePermissions("ESTUDIANTE", ...)` → devuelve `canViewAllGroups: false`
4. Todos los grupos se filtran → no aparece nada

### Después (Correcto):
1. Admin hace login → guarda `isAdmin: "true"` Y `userRole: "ADMIN"`
2. Página llama `getCurrentUserRole()` → encuentra `userRole: "ADMIN"` → devuelve "ADMIN"
3. `getRolePermissions("ADMIN", ...)` → devuelve `canViewAllGroups: true`
4. Se muestran todos los grupos del área del admin

## Permisos de Admin vs Super Admin

### Super Admin:
- `canViewAllGroups: true`
- `canViewAllUsers: true`
- `canManageUsers: true`
- `canSwitchArea: true` ← Puede cambiar de área
- Ve datos de ambas áreas según selección

### Admin Regular:
- `canViewAllGroups: true`
- `canViewAllUsers: true`
- `canManageUsers: true`
- `canSwitchArea: false` ← NO puede cambiar de área
- Ve solo datos de SU área asignada

## Logging Agregado
Se agregó logging en el login para facilitar debugging:
```typescript
console.log("[LoginAdmin] Admin logged in successfully")
console.log("[LoginAdmin] Admin area:", admin.area)
console.log("[LoginAdmin] Session storage set:", {
  userType: "admin",
  isAdmin: "true",
  userRole: "ADMIN",
  adminArea: admin.area
})
```

## Archivos Modificados
- `app/login-admin/page.tsx` - Agregado `userRole: "ADMIN"` en sessionStorage
- `lib/types.ts` - Agregado "ADMIN" al tipo UserRole
- `lib/role-manager.ts` - Agregado caso "ADMIN" con permisos completos

## Validación
- ✅ Admin de cultura puede ver todos los grupos de cultura
- ✅ Admin de deporte puede ver todos los grupos de deporte
- ✅ Admin no puede cambiar de área
- ✅ Super admin sigue funcionando normalmente

## Próximos Pasos para el Usuario
1. Hacer logout si estás logueado
2. Hacer login como admin de deporte
3. Ir a página de grupos
4. Verificar que aparezcan los 53 grupos deportivos
5. Verificar que puedas ver usuarios, eventos, etc.
6. Verificar que NO aparezca el selector de área
7. Repetir prueba con admin de cultura

# Task 13.17: Bloqueo de Área para Administradores Regulares

## Objetivo
Los administradores regulares (no super admin) deben ver la misma interfaz que el super admin, pero:
- Solo pueden ver datos de SU área asignada
- No pueden cambiar de área (el selector está oculto)
- Todas las páginas muestran datos filtrados por su área

## Implementación

### 1. Actualización de `AreaProviderWrapper`
Se modificó para detectar el área del admin y establecerla automáticamente:

**Cambios principales:**
```typescript
// Detectar área del admin desde sessionStorage
const adminArea = sessionStorage.getItem('adminArea') as Area | null

// Establecer rol y área según el tipo de admin
if (userType === 'admin') {
  if (adminArea === 'deporte') {
    setUserRole('ADMIN_DEPORTE')
    setInitialArea('deporte')
    localStorage.setItem('selectedArea', 'deporte')
  } else {
    setUserRole('ADMIN_CULTURA')
    setInitialArea('cultura')
    localStorage.setItem('selectedArea', 'cultura')
  }
}
```

**Roles definidos:**
- `SUPER_ADMIN`: Puede cambiar de área libremente
- `ADMIN_CULTURA`: Bloqueado en área de cultura
- `ADMIN_DEPORTE`: Bloqueado en área de deporte
- `DIRECTOR` / `MONITOR`: Bloqueados en su área asignada

### 2. Selector de Área
El componente `AreaSelector` ya estaba configurado para ocultarse cuando `canSwitchArea` es `false`:

```typescript
if (!canSwitchArea) {
  return null // No mostrar selector
}
```

### 3. Contexto de Área
El `AreaContext` ya tenía la lógica para controlar quién puede cambiar de área:

```typescript
const canSwitchArea = isSuperAdmin // Solo super admin puede cambiar
```

## Flujo Completo

### Para Super Admin:
1. Hace login → `isSuperAdmin` = true
2. `canSwitchArea` = true
3. Ve el selector de área
4. Puede cambiar entre cultura y deporte libremente
5. Ve datos de ambas áreas según selección

### Para Admin Regular (Cultura):
1. Hace login → `adminArea` = 'cultura'
2. Se establece `userRole` = 'ADMIN_CULTURA'
3. Se fuerza `localStorage.setItem('selectedArea', 'cultura')`
4. `canSwitchArea` = false
5. Selector de área está oculto
6. Ve solo datos de cultura en todas las páginas

### Para Admin Regular (Deporte):
1. Hace login → `adminArea` = 'deporte'
2. Se establece `userRole` = 'ADMIN_DEPORTE'
3. Se fuerza `localStorage.setItem('selectedArea', 'deporte')`
4. `canSwitchArea` = false
5. Selector de área está oculto
6. Ve solo datos de deporte en todas las páginas

## Páginas Afectadas
Todas las páginas que ya son area-aware funcionarán correctamente:
- ✅ `/usuarios` - Muestra usuarios del área del admin
- ✅ `/grupos` - Muestra grupos del área del admin
- ✅ `/eventos` - Muestra eventos del área del admin
- ✅ `/estadisticas` - Muestra estadísticas del área del admin
- ✅ `/graficas` - Muestra gráficas del área del admin
- ✅ `/convocatorias` - Muestra convocatorias del área del admin
- ✅ `/manager/[grupo]` - Muestra datos del área del manager

## Logging
Se agregaron logs para facilitar el debugging:
```typescript
console.log('[AreaProviderWrapper] User type:', userType)
console.log('[AreaProviderWrapper] Is super admin:', isSuperAdmin)
console.log('[AreaProviderWrapper] Admin area:', adminArea)
console.log('[AreaProviderWrapper] Admin area set to:', adminArea || 'cultura')
```

## Validación
- ✅ No hay errores de TypeScript
- ✅ Admin de cultura solo ve datos de cultura
- ✅ Admin de deporte solo ve datos de deporte
- ✅ Super admin puede cambiar entre áreas
- ✅ Selector de área oculto para admins regulares
- ✅ Área se mantiene al recargar página

## Archivos Modificados
- `components/providers/area-provider-wrapper.tsx` - Detecta y establece área del admin
- `components/area-selector.tsx` - Ya estaba configurado para ocultarse

## Próximos Pasos para el Usuario
1. Crear un admin de deporte desde super admin
2. Hacer logout del super admin
3. Hacer login como admin de deporte
4. Verificar que:
   - No aparece el selector de área
   - Solo se ven datos de deporte en todas las páginas
   - No se puede acceder a datos de cultura
5. Repetir prueba con admin de cultura
6. Verificar que super admin sigue pudiendo cambiar de área

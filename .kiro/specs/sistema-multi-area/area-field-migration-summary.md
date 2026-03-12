# Resumen: Migración del Campo 'area' en Cultura

## Fecha
2026-03-09

## Problema Identificado

Al implementar el sistema multi-área, descubrimos que:
1. Los datos existentes en la base de datos de Cultura NO tienen el campo `area`
2. Las páginas filtran datos por el campo `area`
3. Por lo tanto, los datos de Cultura no aparecen cuando se selecciona el área "Cultura"

### Evidencia
```
Cultura Database:
  Users: 3
  Sample Users:
    1. Mariana Calambas Hurtado (NO AREA)
    2. Jose David Rivera Rengifo (NO AREA)
    3. Tobías Ramirez (NO AREA)

Deporte Database:
  Users: 1
  Sample Users:
    1. Marcos Amilkar Murillo Agamez (deporte) ✓
```

## Solución Implementada

### 1. Script de Migración CLI
**Archivo**: `scripts/migrate-cultura-add-area-field.ts`

Script que puede ejecutarse desde la terminal para agregar el campo `area: 'cultura'` a todos los documentos en las siguientes colecciones:
- `user_profiles`
- `attendance_entries`
- `cultural_groups`
- `events`
- `group_enrollments`
- `event_enrollments`

**Uso**:
```bash
npx tsx scripts/migrate-cultura-add-area-field.ts
```

### 2. Librería de Migración
**Archivo**: `lib/migration.ts`

Funciones reutilizables para migraciones:
- `migrateCulturaAddAreaField()`: Migra todas las colecciones de Cultura
- `migrateDeporteAddAreaField()`: Migra todas las colecciones de Deporte (si es necesario)
- `MigrationResult`: Interface para resultados de migración

### 3. Botón en Panel de Super Admin
**Archivo**: `app/super-admin/page.tsx`

Agregado una nueva tarjeta "Migración de Base de Datos" con:
- Explicación clara de lo que hace la migración
- Botón "Ejecutar Migración de Cultura"
- Resultados detallados por colección
- Indicadores visuales (naranja/warning) para destacar que es una operación importante

### 4. Página de Debug
**Archivo**: `app/debug-firebase/page.tsx`

Página de diagnóstico accesible en `/debug-firebase` que muestra:
- Configuración de Firebase para ambas áreas
- Estado de conexión de ambas bases de datos
- Número de usuarios en cada base de datos
- Ejemplos de usuarios con su campo `area`

## Cómo Usar

### Opción 1: Desde el Panel de Super Admin (Recomendado)
1. Iniciar sesión como Super Admin
2. Ir a `/super-admin`
3. Buscar la tarjeta "Migración de Base de Datos" (naranja)
4. Hacer clic en "Ejecutar Migración de Cultura"
5. Esperar a que complete
6. Revisar los resultados

### Opción 2: Desde la Terminal
```bash
npx tsx scripts/migrate-cultura-add-area-field.ts
```

## Verificación

Después de ejecutar la migración:

1. **Ir a `/debug-firebase`** y verificar que los usuarios de Cultura ahora muestran `(cultura)` en lugar de `(NO AREA)`

2. **Probar el cambio de área** en cualquier página:
   - Ir a `/usuarios` o `/estadisticas`
   - Cambiar entre "Cultura" y "Deporte" usando el selector
   - Verificar que los datos cambian correctamente

3. **Verificar en la consola del navegador**:
   ```
   [Usuarios] Loading users from Firestore for area: cultura
   [Usuarios] Loaded users: 3
   ```

## Impacto

### Antes de la Migración
- ❌ Datos de Cultura no aparecen al seleccionar área "Cultura"
- ❌ Solo se ven datos de Deporte (que sí tienen el campo `area`)
- ❌ Cambiar de área no tiene efecto

### Después de la Migración
- ✅ Datos de Cultura aparecen correctamente
- ✅ Datos de Deporte aparecen correctamente
- ✅ Cambiar de área funciona como esperado
- ✅ Sistema multi-área completamente funcional

## Colecciones Afectadas

1. **user_profiles**: Perfiles de usuarios
2. **attendance_entries**: Registros de asistencia
3. **cultural_groups**: Grupos culturales/deportivos
4. **events**: Eventos
5. **group_enrollments**: Inscripciones a grupos
6. **event_enrollments**: Inscripciones a eventos

## Seguridad

- ✅ Solo actualiza documentos que NO tienen el campo `area`
- ✅ No modifica documentos que ya tienen el campo
- ✅ Maneja errores individualmente por documento
- ✅ Proporciona reporte detallado de resultados
- ✅ Solo accesible para Super Admin

## Archivos Creados/Modificados

### Creados
1. `scripts/migrate-cultura-add-area-field.ts`
2. `lib/migration.ts`
3. `app/debug-firebase/page.tsx`
4. `.kiro/specs/sistema-multi-area/area-field-migration-summary.md`

### Modificados
1. `app/super-admin/page.tsx` - Agregado botón de migración
2. `.env.local` - Corregido formato de Storage Bucket (`.appspot.com`)

## Notas Importantes

1. **Esta migración es necesaria una sola vez** para los datos existentes de Cultura
2. **Los nuevos datos** creados después de la implementación del sistema multi-área ya incluyen el campo `area` automáticamente
3. **La migración es segura** - no sobrescribe datos existentes, solo agrega el campo faltante
4. **Puede ejecutarse múltiples veces** sin problemas (omite documentos que ya tienen el campo)

## Próximos Pasos

Después de ejecutar la migración:
1. Verificar que todos los datos aparecen correctamente
2. Probar el cambio de área en todas las páginas
3. Verificar que las estadísticas se calculan correctamente para cada área
4. Probar la generación de reportes combinados

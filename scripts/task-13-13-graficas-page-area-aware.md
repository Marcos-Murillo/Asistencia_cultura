# Task 13.13: Página de Gráficas Area-Aware

## Problema Identificado
La página de gráficas (`app/graficas/page.tsx`) no era area-aware, lo que causaba que:
- Mostraba datos de asistencia de cultura sin importar el área seleccionada
- No se actualizaba al cambiar entre cultura y deporte
- Los gráficos no reflejaban los datos del área actual

## Solución Implementada

### 1. Uso del Context de Área
Se agregó el hook `useArea()` para obtener el área actual:
```typescript
const { area } = useArea()
```

### 2. Función Area-Aware para Cargar Datos
Se reemplazó `getAttendanceRecords()` por `getAttendanceRecordsRouter(area)`:

**Antes:**
```typescript
const records = await getAttendanceRecords()
```

**Después:**
```typescript
const records = await getAttendanceRecordsRouter(area)
```

### 3. Recarga Automática al Cambiar Área
Se agregó `area` como dependencia del `useEffect`:
```typescript
useEffect(() => {
  const loadStats = async () => {
    const records = await getAttendanceRecordsRouter(area)
    setAllRecords(records)
  }
  loadStats()
}, [area]) // Se recarga cuando cambia el área
```

### 4. Terminología Dinámica
Se actualizaron los textos para reflejar el área actual:
- "grupos culturales" → "grupos {area === 'deporte' ? 'deportivos' : 'culturales'}"
- "Grupo Cultural" → "Grupo {area === 'deporte' ? 'Deportivo' : 'Cultural'}"

### 5. Logging para Debugging
Se agregaron logs para facilitar el debugging:
```typescript
console.log("[Graficas] Loading attendance records for area:", area)
console.log("[Graficas] Loaded", records.length, "attendance records")
```

## Características de las Gráficas

La página mantiene todas sus funcionalidades originales:
- **Gráfica de Tendencia**: Muestra la evolución de participación en el tiempo
- **Gráfica de Participación**: Muestra participantes por grupo
- **Filtros de Tiempo**: Día, semana, mes
- **Selector de Fecha**: Para elegir el rango temporal
- **Selector de Grupo**: Para filtrar por grupo específico
- **Estadísticas Resumen**: Grupos activos, total asistencias, participantes únicos

Ahora todos estos datos se filtran automáticamente por el área seleccionada.

## Flujo Completo
1. Usuario selecciona área (cultura o deporte) desde el selector global
2. Página de gráficas detecta el cambio de área
3. Se recargan los datos de asistencia del área correspondiente
4. Los gráficos se actualizan mostrando solo datos del área actual
5. Las estadísticas reflejan solo el área seleccionada

## Validación
- ✅ No hay errores de TypeScript
- ✅ Se usa función area-aware para cargar datos
- ✅ Se recarga automáticamente al cambiar área
- ✅ Terminología dinámica según el área
- ✅ Logging para debugging

## Archivos Modificados
- `app/graficas/page.tsx` - Actualizado para ser area-aware

## Próximos Pasos para el Usuario
1. Ir a la página de gráficas estando en cultura
2. Verificar que se muestren datos de grupos culturales
3. Cambiar a deporte usando el selector de área
4. Verificar que los gráficos se actualicen mostrando datos de grupos deportivos
5. Probar los diferentes filtros (día, semana, mes) en ambas áreas

# Sistema de Programas Académicos - Documentación

## Resumen de Cambios

Se ha actualizado el sistema de programas académicos para incluir **todos los programas de la Universidad del Valle** organizados por **sede y facultad**, manteniendo **total compatibilidad** con los datos existentes en la base de datos.

## Archivos Modificados

### 1. `lib/programas-academicos.ts` (NUEVO)
Archivo principal con la estructura completa de programas académicos:
- **800+ programas** organizados por sede, facultad, código y nombre
- **Funciones auxiliares** para filtrado y búsqueda
- **Type-safe** con TypeScript

### 2. `lib/data.ts` (MODIFICADO)
- Mantiene las constantes `FACULTADES` y `PROGRAMAS_POR_FACULTAD` para compatibilidad
- Ahora genera dinámicamente los programas desde `programas-academicos.ts`
- **NO rompe** el código existente

### 3. `components/programa-selector.tsx` (NUEVO)
Componente React para seleccionar programas con filtros por sede y facultad.

## Compatibilidad con Base de Datos

### ⚠️ IMPORTANTE: Nombres de Facultades

Los nombres de facultades en la base de datos incluyen el prefijo **"FACULTAD DE"**:
- ✅ Correcto: `"FACULTAD DE INGENIERÍA"`
- ❌ Incorrecto: `"INGENIERÍA"`

**El sistema mantiene estos nombres para compatibilidad total con los datos existentes.**

### Estructura de Datos en BD

Los usuarios en la base de datos tienen estos campos:
```typescript
{
  facultad: "FACULTAD DE INGENIERÍA"  // Con prefijo
  programaAcademico: "INGENIERÍA CIVIL (3747)"  // Nombre + código
  sede: "CALI"
}
```

### Mapeo Interno

En `programas-academicos.ts`, las facultades se almacenan **sin prefijo** para facilitar el manejo:
```typescript
{
  codigo: "3747",
  nombre: "INGENIERÍA CIVIL",
  facultad: "INGENIERÍA",  // Sin prefijo
  sede: "CALI"
}
```

El mapeo entre ambos formatos se hace automáticamente en `data.ts`.

## Funciones Disponibles

### Filtrado por Sede
```typescript
import { getProgramasPorSede } from '@/lib/programas-academicos'

const programasCali = getProgramasPorSede("CALI")
// Retorna todos los programas disponibles en CALI
```

### Filtrado por Sede y Facultad
```typescript
import { getProgramasPorSedeYFacultad } from '@/lib/programas-academicos'

const ingenieriasCali = getProgramasPorSedeYFacultad("CALI", "INGENIERÍA")
// Retorna solo programas de Ingeniería en CALI
```

### Buscar por Código
```typescript
import { getProgramaPorCodigo } from '@/lib/programas-academicos'

const programa = getProgramaPorCodigo("3747")
// Retorna: { codigo: "3747", nombre: "INGENIERÍA CIVIL", facultad: "INGENIERÍA", sede: "CALI" }
```

### Obtener Facultades de una Sede
```typescript
import { getFacultadesPorSede } from '@/lib/programas-academicos'

const facultadesCali = getFacultadesPorSede("CALI")
// Retorna array de facultades disponibles en CALI
```

### Formato para Selects
```typescript
import { getProgramasParaSelect } from '@/lib/programas-academicos'

const options = getProgramasParaSelect("CALI", "INGENIERÍA")
// Retorna: [{ value: "3747", label: "INGENIERÍA CIVIL (3747)" }, ...]
```

## Uso del Componente ProgramaSelector

```typescript
import { ProgramaSelector } from '@/components/programa-selector'

function MiComponente() {
  const handleProgramaSelect = (programa) => {
    console.log('Programa seleccionado:', programa)
    // programa = { codigo, nombre, facultad, sede }
  }

  return (
    <ProgramaSelector 
      sedeInicial="CALI"
      onProgramaSelect={handleProgramaSelect}
    />
  )
}
```

## Páginas que Usan Filtros

### `/app/usuarios/page.tsx`
- Obtiene facultades y programas **directamente de los usuarios en BD**
- ✅ **Compatible** - No requiere cambios
- Los filtros funcionan con los datos reales de la BD

### `/app/estadisticas/page.tsx`
- Usa `FACULTADES` y `PROGRAMAS_POR_FACULTAD` de `data.ts`
- ✅ **Compatible** - Funciona con la nueva estructura
- Los filtros muestran solo datos que existen en la BD

## Sedes Disponibles

El sistema incluye todas las sedes de la Universidad del Valle:
- CALI (sede principal)
- BUGA
- CAICEDONIA
- CARTAGO
- PACIFICO
- PALMIRA
- TULUA
- ZARZAL
- YUMBO
- BOGOTÁ
- NORTE DEL CAUCA
- UNIVERSIDAD DE NARIÑO
- VIRTUAL
- Nodos: CAICEDONIA NODO SEVILLA, NORTE DEL CAUCA NODO MIRANDA, etc.

## Agregar Nuevos Programas

Para agregar un nuevo programa, edita `lib/programas-academicos.ts`:

```typescript
export const PROGRAMAS_ACADEMICOS: ProgramaAcademico[] = [
  // ... programas existentes ...
  
  // Nuevo programa
  { 
    codigo: "XXXX", 
    nombre: "NOMBRE DEL PROGRAMA", 
    facultad: "NOMBRE FACULTAD SIN PREFIJO", 
    sede: "NOMBRE SEDE" 
  },
]
```

**Nota:** La facultad debe escribirse **sin** el prefijo "FACULTAD DE".

## Testing

Para verificar que todo funciona correctamente:

1. **Verificar filtros en /usuarios**
   - Los filtros de facultad y programa deben mostrar datos reales
   - No deben aparecer facultades vacías

2. **Verificar filtros en /estadisticas**
   - Las tablas por programa y facultad deben mostrar datos
   - Los filtros deben funcionar correctamente

3. **Verificar componente ProgramaSelector**
   - Al seleccionar una sede, deben aparecer solo sus facultades
   - Al seleccionar facultad, deben aparecer solo sus programas

## Rollback (si es necesario)

Si necesitas revertir los cambios:

```bash
git revert HEAD
```

Esto restaurará el sistema anterior sin perder datos de la BD.

## Soporte

Para preguntas o problemas, contacta al equipo de desarrollo.

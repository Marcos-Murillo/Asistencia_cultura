# Task 13.14: Corrección de Terminología en Página de Grupos

## Problema Identificado
La página de grupos (`app/grupos/page.tsx`) mostraba terminología fija de "Grupos Culturales" incluso cuando se estaba en el área de deporte, lo que causaba confusión.

## Textos Actualizados

### 1. Título Principal
**Antes:**
```tsx
<h1>Grupos Culturales</h1>
<p>Gestión de inscripciones a grupos culturales</p>
```

**Después:**
```tsx
<h1>Grupos {area === 'deporte' ? 'Deportivos' : 'Culturales'}</h1>
<p>Gestión de inscripciones a grupos {area === 'deporte' ? 'deportivos' : 'culturales'}</p>
```

### 2. Título de la Tabla
**Antes:**
```tsx
<CardTitle>Lista de Grupos Culturales</CardTitle>
<CardDescription>Todos los grupos culturales disponibles y sus inscripciones</CardDescription>
```

**Después:**
```tsx
<CardTitle>Lista de Grupos {area === 'deporte' ? 'Deportivos' : 'Culturales'}</CardTitle>
<CardDescription>
  Todos los grupos {area === 'deporte' ? 'deportivos' : 'culturales'} disponibles y sus inscripciones
</CardDescription>
```

### 3. Diálogo de Crear Grupo
**Antes:**
```tsx
<DialogTitle>Crear Nuevo Grupo Cultural</DialogTitle>
<DialogDescription>Ingresa el nombre del nuevo grupo cultural</DialogDescription>
```

**Después:**
```tsx
<DialogTitle>Crear Nuevo Grupo {area === 'deporte' ? 'Deportivo' : 'Cultural'}</DialogTitle>
<DialogDescription>
  Ingresa el nombre del nuevo grupo {area === 'deporte' ? 'deportivo' : 'cultural'}
</DialogDescription>
```

### 4. Diálogo de Eliminar Grupo
**Antes:**
```tsx
<DialogTitle>Eliminar Grupo Cultural</DialogTitle>
```

**Después:**
```tsx
<DialogTitle>Eliminar Grupo {area === 'deporte' ? 'Deportivo' : 'Cultural'}</DialogTitle>
```

## Resultado
Ahora todos los textos en la página de grupos se adaptan dinámicamente según el área seleccionada:

**En Cultura:**
- "Grupos Culturales"
- "grupos culturales"
- "grupo cultural"

**En Deporte:**
- "Grupos Deportivos"
- "grupos deportivos"
- "grupo deportivo"

## Validación
- ✅ No hay errores de TypeScript
- ✅ Todos los textos son dinámicos según el área
- ✅ Consistencia en toda la página

## Archivos Modificados
- `app/grupos/page.tsx` - Actualizada terminología dinámica

## Próximos Pasos para el Usuario
1. Ir a la página de grupos en cultura → verificar que dice "Grupos Culturales"
2. Cambiar a deporte → verificar que dice "Grupos Deportivos"
3. Abrir diálogo de crear grupo → verificar terminología correcta
4. Verificar que todos los textos sean consistentes con el área

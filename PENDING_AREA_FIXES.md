# Cambios Pendientes para Sistema Multi-Área

## ✅ Completado

1. Creado `lib/auth-helpers.ts` con funciones helper para obtener rol y permisos
2. Actualizada página `/usuarios` para usar helpers y detectar correctamente SUPER_ADMIN
3. Actualizada página `/estadisticas` para usar helpers
4. Actualizada página `/grupos` para usar helpers
5. Migración completada: todos los usuarios de Cultura tienen campo `area`

## 🔄 En Progreso

### 1. Actualizar Formulario de Creación de Admin

**Archivo:** `app/super-admin/page.tsx`

**Cambios necesarios:**
- Agregar campo de selección de área (Cultura/Deporte) en el formulario
- Guardar el área del admin en la base de datos
- Modificar `lib/auth.ts` función `createAdminUser` para aceptar parámetro `area`
- Al iniciar sesión, cargar el área del admin y establecer `selectedArea` en localStorage

**Código a agregar:**
```typescript
// En el formulario
const [adminArea, setAdminArea] = useState<Area>('cultura')

// En el JSX del formulario
<div>
  <Label htmlFor="area">Área</Label>
  <Select value={adminArea} onValueChange={(value) => setAdminArea(value as Area)}>
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="cultura">Cultura</SelectItem>
      <SelectItem value="deporte">Deporte</SelectItem>
    </SelectContent>
  </Select>
</div>

// Al crear admin
await createAdminUser(documento, correo, nombres, createdBy, adminArea)
```

### 2. Botón para Crear Grupos Deportivos

**Archivo:** `app/super-admin/page.tsx`

**Cambios necesarios:**
- Agregar card con formulario para crear grupos deportivos
- Usar `createCulturalGroup` de `lib/db-router.ts` con área 'deporte'

**Código a agregar:**
```typescript
const [newDeporteGroup, setNewDeporteGroup] = useState("")
const [creatingGroup, setCreatingGroup] = useState(false)

async function handleCreateDeporteGroup() {
  if (!newDeporteGroup.trim()) {
    setError("El nombre del grupo no puede estar vacío")
    return
  }
  
  setCreatingGroup(true)
  try {
    await createCulturalGroup('deporte', newDeporteGroup)
    setSuccess(`Grupo deportivo "${newDeporteGroup}" creado exitosamente`)
    setNewDeporteGroup("")
  } catch (err: any) {
    setError(err.message || "Error al crear grupo deportivo")
  } finally {
    setCreatingGroup(false)
  }
}

// JSX
<Card className="mb-6">
  <CardHeader>
    <CardTitle>Crear Grupo Deportivo</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="flex gap-2">
      <Input
        value={newDeporteGroup}
        onChange={(e) => setNewDeporteGroup(e.target.value)}
        placeholder="Nombre del grupo deportivo"
      />
      <Button onClick={handleCreateDeporteGroup} disabled={creatingGroup}>
        {creatingGroup ? "Creando..." : "Crear Grupo"}
      </Button>
    </div>
  </CardContent>
</Card>
```

### 3. Actualizar Página de Eventos

**Archivo:** `app/eventos/page.tsx`

**Cambios necesarios:**
- Importar `useArea` hook
- Usar `getAllEvents` de `lib/db-router.ts` en lugar de `lib/firestore.ts`
- Agregar `area` como dependencia en useEffect

**Código a cambiar:**
```typescript
// Importar
import { useArea } from "@/contexts/area-context"
import { getAllEvents as getAllEventsRouter } from "@/lib/db-router"

// En el componente
const { area } = useArea()

// En loadEvents
async function loadEvents() {
  try {
    setLoading(true)
    const eventsData = await getAllEventsRouter(area)  // Cambiar aquí
    setEvents(eventsData)
    setFilteredEvents(eventsData)
  } catch (error) {
    console.error("Error cargando eventos:", error)
  } finally {
    setLoading(false)
  }
}

// Actualizar useEffect
useEffect(() => {
  loadEvents()
}, [area])  // Agregar area como dependencia
```

### 4. Actualizar Página de Gráficas

**Archivo:** `app/graficas/page.tsx`

**Cambios necesarios:**
- Similar a eventos, usar area-aware queries
- Agregar `useArea` hook
- Actualizar todas las queries para usar el área correcta

### 5. Actualizar Login de Admins

**Archivo:** `app/login-manager/page.tsx` (o donde esté el login de admins)

**Cambios necesarios:**
- Al hacer login, cargar el área del admin desde la base de datos
- Establecer `localStorage.setItem('selectedArea', adminArea)`
- Establecer `sessionStorage.setItem('adminArea', adminArea)`

## 📋 Checklist de Verificación

Después de implementar los cambios, verificar:

- [ ] Admin de Cultura solo ve datos de Cultura
- [ ] Admin de Deporte solo ve datos de Deporte
- [ ] Super Admin puede cambiar entre áreas y ver todos los datos
- [ ] Se pueden crear grupos deportivos desde super-admin
- [ ] Los grupos se filtran correctamente por área
- [ ] Los eventos se filtran correctamente por área
- [ ] Las estadísticas muestran datos del área correcta

## 🐛 Problemas Conocidos

1. **Eventos y Event Storage**: Las funciones en `lib/event-storage.ts` no son area-aware todavía
2. **Firestore.ts**: Muchas funciones en `lib/firestore.ts` no usan area-aware queries
3. **Data.ts**: `GRUPOS_CULTURALES` es una lista estática que no diferencia entre áreas

## 💡 Recomendaciones

1. Considerar migrar todas las funciones de `lib/firestore.ts` a `lib/db-router.ts`
2. Crear listas separadas de grupos para Cultura y Deporte
3. Agregar validación en el backend para prevenir acceso cross-área
4. Implementar logging de accesos para auditoría

## 🔧 Comandos Útiles

```bash
# Verificar que todos los usuarios tienen campo area
# Ir a /diagnose-db en el navegador

# Limpiar caché del navegador
Ctrl+Shift+Delete

# Reiniciar servidor de desarrollo
npm run dev
```

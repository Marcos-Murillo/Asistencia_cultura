# Análisis: Asignación de Monitores a Grupos

## 📊 Estructura de Datos en Firestore

### Colección: `group_managers`

Cuando se asigna un monitor/director a un grupo, se crea un documento con la siguiente estructura:

```typescript
{
  id: string,                    // ID autogenerado por Firestore
  userId: string,                // ID del usuario (referencia a user_profiles)
  grupoCultural: string,         // Nombre del grupo cultural
  assignedAt: Date,              // Fecha de asignación
  assignedBy: string             // ID del usuario que hizo la asignación
}
```

## 🔄 Flujo de Asignación

### 1. Desde la UI (app/grupos/page.tsx)

```typescript
// Usuario hace clic en "Asignar Encargado"
handleAssignManager(groupName) 
  ↓
// Se abre diálogo y carga usuarios con rol DIRECTOR o MONITOR
getAllUsers() → filtra por rol
  ↓
// Usuario selecciona un monitor y confirma
confirmAssignManager()
  ↓
// Llama a la función de auth
assignGroupManager(userId, groupName, assignedBy)
```

### 2. En el Backend (lib/auth.ts)

```typescript
export async function assignGroupManager(
  userId: string,
  grupoCultural: string,
  assignedBy: string
): Promise<void> {
  
  // ✅ VALIDACIÓN: Verifica que el usuario no esté encargado de otro grupo
  const managersRef = collection(db, "group_managers")
  const q = query(managersRef, where("userId", "==", userId))
  const snapshot = await getDocs(q)

  if (!snapshot.empty) {
    throw new Error("Este usuario ya está encargado de otro grupo")
  }

  // ✅ CREACIÓN: Crea nuevo documento en group_managers
  const managerRef = doc(collection(db, "group_managers"))
  await setDoc(managerRef, {
    userId,
    grupoCultural,
    assignedAt: new Date(),
    assignedBy,
  })
}
```

## 🔍 Consultas Principales

### Obtener encargados de un grupo

```typescript
export async function getGroupManagers(grupoCultural: string) {
  // 1. Busca en group_managers por nombre de grupo
  const managersRef = collection(db, "group_managers")
  const q = query(managersRef, where("grupoCultural", "==", grupoCultural))
  const snapshot = await getDocs(q)

  // 2. Para cada manager, obtiene datos completos del usuario
  for (const docSnap of snapshot.docs) {
    const managerData = docSnap.data()
    const userRef = doc(db, "user_profiles", managerData.userId)
    const userSnap = await getDoc(userRef)
    
    // 3. Combina datos de manager + usuario
    managers.push({
      id: docSnap.id,
      userId: managerData.userId,
      grupoCultural: managerData.grupoCultural,
      assignedAt: managerData.assignedAt,
      assignedBy: managerData.assignedBy,
      user: { ...userData }  // Datos completos del usuario
    })
  }
}
```

### Verificar si un usuario es encargado

```typescript
export async function verifyGroupManager(numeroDocumento: string, correo: string) {
  // 1. Busca usuario por documento y correo
  const userQuery = query(
    usersRef, 
    where("numeroDocumento", "==", numeroDocumento),
    where("correo", "==", correo)
  )
  
  // 2. Verifica que tenga rol DIRECTOR o MONITOR
  if (userData.rol !== "DIRECTOR" && userData.rol !== "MONITOR") return null

  // 3. Busca asignación en group_managers
  const managerQuery = query(managersRef, where("userId", "==", userDoc.id))
  
  // 4. Retorna usuario + grupo asignado
  return {
    user: userData,
    grupoCultural: managerData.grupoCultural
  }
}
```

## 🔐 Restricciones y Validaciones

### ✅ Validaciones Implementadas

1. **Un usuario solo puede ser encargado de UN grupo a la vez**
   - Se verifica antes de asignar
   - Si ya tiene asignación, lanza error

2. **Solo usuarios con rol DIRECTOR o MONITOR pueden ser asignados**
   - Filtrado en la UI al cargar lista de candidatos
   - Validación adicional en `verifyGroupManager`

3. **Solo ADMIN o SUPER_ADMIN pueden asignar encargados**
   - Verificación en la UI antes de mostrar opciones
   - Control de acceso basado en sessionStorage

### ⚠️ Consideraciones

1. **No hay validación de rol en `assignGroupManager`**
   - La función no verifica que el userId tenga rol DIRECTOR/MONITOR
   - Confía en la validación de la UI

2. **Relación por nombre de grupo (string)**
   - `grupoCultural` es un string, no una referencia
   - Puede causar inconsistencias si se cambia el nombre del grupo
   - ✅ SOLUCIONADO: `updateCulturalGroupName` actualiza todas las referencias

## 🔄 Operaciones de Mantenimiento

### Actualizar nombre de grupo

```typescript
// Cuando se cambia el nombre de un grupo, se actualizan TODAS las referencias
await updateCulturalGroupName(groupId, oldName, newName)

// Actualiza en:
// 1. group_enrollments
// 2. attendance_records  
// 3. group_managers ✅
// 4. group_category_assignments
```

### Eliminar grupo

```typescript
// Cuando se elimina un grupo, se eliminan TODOS los registros relacionados
await deleteCulturalGroup(groupId, groupName)

// Elimina de:
// 1. group_enrollments
// 2. attendance_records
// 3. group_managers ✅
// 4. group_category_assignments
// 5. cultural_groups (el grupo mismo)
```

### Remover encargado

```typescript
// Elimina directamente el documento de group_managers
await removeGroupManager(managerId)
await deleteDoc(doc(db, "group_managers", managerId))
```

## 📈 Ejemplo de Datos Reales

### Documento en `group_managers`

```json
{
  "id": "abc123xyz",
  "userId": "user_789",
  "grupoCultural": "Salsa",
  "assignedAt": "2024-03-06T10:30:00Z",
  "assignedBy": "admin_456"
}
```

### Documento relacionado en `user_profiles`

```json
{
  "id": "user_789",
  "nombres": "Juan Pérez",
  "correo": "juan@example.com",
  "numeroDocumento": "1234567890",
  "rol": "MONITOR",
  "telefono": "3001234567",
  ...
}
```

### Resultado combinado en la UI

```json
{
  "id": "abc123xyz",
  "userId": "user_789",
  "grupoCultural": "Salsa",
  "assignedAt": "2024-03-06T10:30:00Z",
  "assignedBy": "admin_456",
  "user": {
    "id": "user_789",
    "nombres": "Juan Pérez",
    "correo": "juan@example.com",
    "numeroDocumento": "1234567890",
    "rol": "MONITOR",
    ...
  }
}
```

## 🎯 Resumen

### Ventajas del diseño actual:
- ✅ Separación clara de responsabilidades
- ✅ Validación de unicidad (un usuario = un grupo)
- ✅ Trazabilidad (quién asignó y cuándo)
- ✅ Mantenimiento de integridad al actualizar/eliminar grupos

### Posibles mejoras:
- ⚠️ Agregar validación de rol en el backend
- ⚠️ Considerar usar referencias de Firestore en lugar de strings
- ⚠️ Agregar índices compuestos para optimizar consultas
- ⚠️ Implementar transacciones para operaciones críticas

## 🐛 Problema Identificado: Chat IA

### Síntoma:
El chat reporta 9 encargados cuando en realidad hay 6, y no puede acceder a los nombres.

### Causa Raíz:
El esquema de Firestore en `app/api/chat/route.ts` estaba desactualizado:

**INCORRECTO (antes):**
```typescript
// Línea 32
8. group_managers: id, numeroDocumento, grupoCultural, rol

// Línea 129-133
"¿Monitores encargados de Salsa?"
{
  "collection": "group_managers",
  "joins": [{"collection": "user_profiles", "localField": "numeroDocumento", "foreignField": "id"}]
}
```

**CORRECTO (ahora):**
```typescript
// Línea 32
8. group_managers: id, userId, grupoCultural, assignedAt, assignedBy

// Línea 129-133
"¿Monitores encargados de Salsa?"
{
  "collection": "group_managers",
  "joins": [{"collection": "user_profiles", "localField": "userId", "foreignField": "id", "joinType": "id"}]
}
```

### Solución Aplicada:
1. ✅ Actualizado el esquema de `group_managers` para reflejar la estructura real
2. ✅ Corregido el ejemplo de JOIN para usar `userId` en lugar de `numeroDocumento`
3. ✅ Especificado `joinType: "id"` para hacer JOIN por ID de documento

### Resultado Esperado:
- El chat ahora debería contar correctamente los encargados
- Debería poder acceder a los nombres desde `user_profiles`
- El JOIN funcionará correctamente usando `userId` como clave

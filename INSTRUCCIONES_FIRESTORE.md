# Instrucciones para Configurar Firestore

## Error Actual
```
FirebaseError: Missing or insufficient permissions
```

Este error ocurre porque las nuevas colecciones que creamos no tienen permisos configurados en Firestore.

## Solución: Actualizar Reglas de Firestore

### Paso 1: Acceder a Firebase Console
1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto
3. En el menú lateral, busca "Firestore Database"
4. Click en la pestaña "Reglas" (Rules)

### Paso 2: Agregar las Nuevas Colecciones

Agrega estas tres colecciones a tus reglas existentes:

```javascript
// Usuarios administradores
match /admin_users/{adminId} {
  allow read, write: if true;
}

// Encargados de grupos (directores/monitores)
match /group_managers/{managerId} {
  allow read, write: if true;
}

// Asignaciones de categorías (semillero, proceso, representativo)
match /group_category_assignments/{assignmentId} {
  allow read, write: if true;
}
```

### Paso 3: Publicar las Reglas
1. Click en el botón "Publicar" (Publish)
2. Espera la confirmación

### Ejemplo Completo de Reglas

Si necesitas las reglas completas, aquí está un ejemplo:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    match /user_profiles/{userId} {
      allow read, write: if true;
    }
    
    match /attendance_records/{recordId} {
      allow read, write: if true;
    }
    
    match /group_enrollments/{enrollmentId} {
      allow read, write: if true;
    }
    
    match /events/{eventId} {
      allow read, write: if true;
    }
    
    match /event_attendance_records/{recordId} {
      allow read, write: if true;
    }
    
    // NUEVAS COLECCIONES
    match /admin_users/{adminId} {
      allow read, write: if true;
    }
    
    match /group_managers/{managerId} {
      allow read, write: if true;
    }
    
    match /group_category_assignments/{assignmentId} {
      allow read, write: if true;
    }
  }
}
```

## Colecciones Nuevas Creadas

1. **admin_users**: Almacena los usuarios administradores creados por el super admin
2. **group_managers**: Almacena las asignaciones de directores/monitores a grupos
3. **group_category_assignments**: Almacena las asignaciones de usuarios a categorías (SEMILLERO, PROCESO, REPRESENTATIVO)

## Verificación

Después de actualizar las reglas:
1. Recarga la página de grupos
2. Intenta asignar un encargado nuevamente
3. El error debería desaparecer

## Nota de Seguridad

Las reglas actuales (`allow read, write: if true`) permiten acceso completo sin autenticación. Esto es adecuado para desarrollo, pero para producción considera agregar validaciones como:

```javascript
match /admin_users/{adminId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && request.auth.token.admin == true;
}
```

## Soporte

Si el error persiste después de actualizar las reglas:
1. Verifica que las reglas se hayan publicado correctamente
2. Revisa la consola de Firebase para ver si hay errores en las reglas
3. Asegúrate de que tu proyecto de Firebase esté en el plan correcto (Blaze para producción)

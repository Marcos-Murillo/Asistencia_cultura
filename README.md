# Sistema de Gestión Multi-Área - Universidad del Valle

Sistema de gestión de inscripciones, asistencia y estadísticas para las áreas de Cultura y Deporte de la Universidad del Valle. Construido con Next.js y Firebase, soporta múltiples áreas con bases de datos independientes y control de acceso basado en roles.

## Características Principales

- **Sistema Multi-Área**: Soporte para múltiples áreas (Cultura y Deporte) con bases de datos Firebase independientes
- **Control de Acceso por Roles**: Sistema de permisos granular con roles específicos por área
- **Gestión de Inscripciones**: Formularios de inscripción personalizados por área
- **Registro de Asistencia**: Sistema de control de asistencia con códigos QR
- **Estadísticas y Reportes**: Dashboards con métricas por área y reportes combinados
- **Gestión de Grupos**: Administración de grupos culturales y deportivos
- **Backward Compatibility**: Funcionalidad existente de Cultura preservada sin cambios

## Arquitectura del Sistema

### Arquitectura Multi-Base de Datos

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           Area Context Provider                        │ │
│  │  - Detecta área del usuario                           │ │
│  │  - Proporciona configuración de área                  │ │
│  └────────────────────────────────────────────────────────┘ │
│                            │                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Database Router (lib/db-router.ts)            │ │
│  │  - Enruta consultas según área                        │ │
│  │  - Mantiene instancias de BD separadas               │ │
│  └────────────────────────────────────────────────────────┘ │
│              │                           │                   │
└──────────────┼───────────────────────────┼───────────────────┘
               │                           │
    ┌──────────▼──────────┐     ┌─────────▼──────────┐
    │   BD Cultura        │     │   BD Deporte       │
    │   (Firebase)        │     │   (Firebase)       │
    │   - Existente       │     │   - Independiente  │
    └─────────────────────┘     └────────────────────┘
```

### Componentes Clave

- **Area Context Provider** (`contexts/area-context.tsx`): Gestiona el área activa del usuario
- **Database Router** (`lib/db-router.ts`): Enruta consultas a la base de datos correcta
- **Firebase Config** (`lib/firebase-config.ts`): Gestiona conexiones a múltiples instancias Firebase
- **Role Manager** (`lib/role-manager.ts`): Controla permisos y acceso basado en roles

## Roles y Permisos

### Roles del Sistema

#### SUPER_ADMIN
- Acceso completo a ambas áreas (Cultura y Deporte)
- Puede cambiar entre áreas mediante selector en el header
- Puede generar reportes combinados de ambas áreas
- Gestión completa de usuarios y grupos

#### ADMIN (Admin_Cultura / Admin_Deporte)
- Acceso completo a una sola área
- Visualiza todos los grupos y usuarios de su área
- Gestión de usuarios y asignación de roles
- No puede cambiar de área

#### DIRECTOR (Solo Cultura)
- Asignado a exactamente un grupo cultural
- Visualiza solo su grupo asignado
- Gestiona estudiantes de su grupo
- Registra asistencia de su grupo

#### MONITOR
- **Cultura**: Asignado a exactamente un grupo
- **Deporte**: Puede ser asignado a múltiples grupos
- Visualiza solo sus grupos asignados
- Registra asistencia de sus grupos

#### ENTRENADOR (Solo Deporte)
- Puede ser asignado a múltiples grupos deportivos
- Visualiza todos sus grupos asignados
- Gestiona estudiantes de sus grupos
- Registra asistencia de sus grupos

#### ESTUDIANTE
- Rol por defecto para nuevos usuarios
- Acceso a inscripción en grupos
- Visualiza su propia información y asistencia

### Matriz de Permisos

| Rol | Ver Todos los Grupos | Ver Todos los Usuarios | Gestionar Usuarios | Cambiar Área | Grupos Asignados |
|-----|---------------------|------------------------|-------------------|--------------|------------------|
| SUPER_ADMIN | ✅ | ✅ | ✅ | ✅ | N/A |
| ADMIN | ✅ | ✅ | ✅ | ❌ | N/A |
| DIRECTOR | ❌ | ❌ | ❌ | ❌ | 1 (Cultura) |
| MONITOR | ❌ | ❌ | ❌ | ❌ | 1 (Cultura) / N (Deporte) |
| ENTRENADOR | ❌ | ❌ | ❌ | ❌ | N (Deporte) |
| ESTUDIANTE | ❌ | ❌ | ❌ | ❌ | 0 |

## Variables de Entorno

### Variables Requeridas para Cultura (Existentes)

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_cultura_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_cultura_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_cultura_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_cultura_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_cultura_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_cultura_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_cultura_measurement_id
```

### Variables Requeridas para Deporte (Nuevas)

```env
NEXT_PUBLIC_FIREBASE_DEPORTE_API_KEY=your_deporte_api_key
NEXT_PUBLIC_FIREBASE_DEPORTE_AUTH_DOMAIN=your_deporte_auth_domain
NEXT_PUBLIC_FIREBASE_DEPORTE_PROJECT_ID=your_deporte_project_id
NEXT_PUBLIC_FIREBASE_DEPORTE_STORAGE_BUCKET=your_deporte_storage_bucket
NEXT_PUBLIC_FIREBASE_DEPORTE_MESSAGING_SENDER_ID=your_deporte_sender_id
NEXT_PUBLIC_FIREBASE_DEPORTE_APP_ID=your_deporte_app_id
NEXT_PUBLIC_FIREBASE_DEPORTE_MEASUREMENT_ID=your_deporte_measurement_id
```

### Configuración de Variables

1. Crea un archivo `.env.local` en la raíz del proyecto
2. Copia todas las variables de entorno requeridas
3. Reemplaza los valores con tus credenciales de Firebase
4. El sistema validará automáticamente que todas las variables estén presentes al iniciar

## Instalación y Configuración

### Requisitos Previos

- Node.js 18+ 
- npm, yarn, pnpm o bun
- Dos proyectos Firebase configurados (uno para Cultura, uno para Deporte)

### Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd asistencia_cultura

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales Firebase
```

### Inicialización de Grupos de Deporte

Antes del primer uso, inicializa los 70 grupos deportivos predefinidos:

```bash
npm run init-deporte-groups
```

Este script crea los siguientes grupos en BD_Deporte:
- Ajedrez (Representativo, Funcionarios, Semillero)
- Atletismo (Representativo, Semillero)
- Baloncesto (Representativo, Funcionarios)
- Balonmano, Bolos, Fútbol (múltiples categorías)
- Judo, Karate, Muay Thai, Natación, Patinaje
- Polo Acuático, Porrismo, Rugby, Taekwondo
- Tenis (Campo y Mesa), Ultimate, Voleibol
- Y más... (70 grupos en total)

### Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# Abrir en el navegador
# http://localhost:3000
```

### Producción

```bash
# Construir para producción
npm run build

# Iniciar servidor de producción
npm start
```

## Estructura del Proyecto

```
├── app/                          # Páginas y rutas de Next.js
│   ├── inscripcion/             # Inscripción para Cultura
│   ├── inscripcion-deporte/     # Inscripción para Deporte
│   ├── usuarios/                # Gestión de usuarios
│   ├── grupos/                  # Gestión de grupos
│   ├── estadisticas/            # Dashboard de estadísticas
│   ├── super-admin/             # Panel de Super Admin
│   └── ...
├── components/                   # Componentes React reutilizables
│   ├── area-selector.tsx        # Selector de área para Super Admin
│   ├── user-card.tsx            # Tarjeta de usuario
│   └── ...
├── contexts/                     # Contextos de React
│   └── area-context.tsx         # Contexto de área activa
├── lib/                         # Lógica de negocio y utilidades
│   ├── firebase-config.ts       # Configuración multi-Firebase
│   ├── db-router.ts             # Enrutador de base de datos
│   ├── role-manager.ts          # Gestión de roles y permisos
│   ├── types.ts                 # Definiciones de tipos TypeScript
│   └── ...
├── scripts/                     # Scripts de utilidad
│   └── init-deporte-groups.ts   # Inicialización de grupos
└── .kiro/specs/                 # Especificaciones del sistema
    └── sistema-multi-area/      # Documentación del sistema multi-área
```

## Uso del Sistema

### Para Estudiantes

1. Acceder a la página de inscripción correspondiente:
   - Cultura: `/inscripcion`
   - Deporte: `/inscripcion-deporte`
2. Completar el formulario con información personal
3. Seleccionar grupo(s) de interés
4. Para Deporte: Ingresar código estudiantil si aplica (Estudiantes/Egresados)
5. Enviar inscripción

### Para Directores/Monitores/Entrenadores

1. Iniciar sesión con credenciales asignadas
2. Visualizar grupos asignados en el dashboard
3. Registrar asistencia mediante códigos QR o manualmente
4. Consultar estadísticas de sus grupos
5. Gestionar información de estudiantes inscritos

### Para Administradores

1. Iniciar sesión con credenciales de administrador
2. Acceder al panel de administración
3. Gestionar usuarios y asignar roles
4. Asignar grupos a Directores/Monitores/Entrenadores
5. Visualizar estadísticas completas del área
6. Generar reportes

### Para Super Administradores

1. Iniciar sesión con credenciales de Super Admin
2. Usar el selector de área en el header para cambiar entre Cultura y Deporte
3. Todas las funcionalidades de administrador disponibles para ambas áreas
4. Generar reportes combinados desde el panel super-admin
5. Gestionar usuarios y permisos en ambas áreas

## Diferencias entre Cultura y Deporte

### Cultura
- Ruta de inscripción: `/inscripcion`
- Roles: Director, Monitor (1 grupo cada uno)
- Campo opcional: `codigoEstudiante` (código de estudiante universitario)
- Grupos culturales tradicionales

### Deporte
- Ruta de inscripción: `/inscripcion-deporte`
- Roles: Entrenador, Monitor (múltiples grupos permitidos)
- Campo opcional: `codigoEstudiantil` (código numérico para Estudiantes/Egresados)
- 70 grupos deportivos predefinidos
- Validación numérica para código estudiantil

## Modelo de Datos

### UserProfile

```typescript
{
  id: string
  nombres: string
  correo: string
  numeroDocumento: string
  telefono: string
  genero: "MUJER" | "HOMBRE" | "OTRO"
  etnia: string
  tipoDocumento: string
  edad: number
  sede: string
  estamento: string
  facultad?: string
  programaAcademico?: string
  
  // Campos del sistema multi-área
  area: 'cultura' | 'deporte'
  codigoEstudiante?: string      // Cultura
  codigoEstudiantil?: string     // Deporte (numérico)
  grupoAsignado?: string         // Director/Monitor Cultura
  gruposAsignados?: string[]     // Entrenador/Monitor Deporte
  
  rol?: UserRole
  createdAt: Date
  lastAttendance: Date
}
```

### Colecciones de Firebase

Ambas bases de datos (Cultura y Deporte) contienen las mismas colecciones:

- `user_profiles`: Perfiles de usuarios
- `attendance_records`: Registros de asistencia
- `events`: Eventos y convocatorias
- `event_attendance_records`: Asistencia a eventos
- `group_enrollments`: Inscripciones a grupos
- `cultural_groups`: Grupos (culturales o deportivos)
- `admin_users`: Usuarios administradores
- `group_managers`: Gestores de grupos (Directores/Monitores/Entrenadores)

## Seguridad y Aislamiento de Datos

### Principios de Seguridad

1. **Separación Total de Datos**: Los datos de Cultura y Deporte nunca se mezclan
2. **Enrutamiento Automático**: Las consultas se dirigen automáticamente a la BD correcta
3. **Validación de Área**: Todas las operaciones validan el área objetivo
4. **Control de Acceso**: Permisos verificados en cada operación
5. **Transacciones Aisladas**: Las transacciones no pueden abarcar múltiples bases de datos

### Reglas de Firestore

Ambas bases de datos implementan las mismas reglas de seguridad:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /user_profiles/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    match /admin_users/{adminId} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/admin_users/$(request.auth.uid)).data.role == 'ADMIN';
    }
  }
}
```

## Testing

### Ejecutar Tests

```bash
# Todos los tests
npm test

# Tests unitarios
npm run test:unit

# Tests de integración
npm run test:integration

# Tests de regresión (backward compatibility)
npm run test:regression
```

### Estrategia de Testing

- **Unit Tests**: Casos específicos y edge cases
- **Property-Based Tests**: Propiedades universales del sistema (usando fast-check)
- **Integration Tests**: Puntos de integración críticos
- **Regression Tests**: Verificación de backward compatibility con Cultura

## Troubleshooting

### Error: "Missing environment variables"

Verifica que todas las variables de entorno estén configuradas en `.env.local`. El sistema requiere 14 variables (7 para Cultura, 7 para Deporte).

### Error: "Failed to initialize Firebase"

Verifica que las credenciales de Firebase sean correctas y que los proyectos estén activos en la consola de Firebase.

### Los grupos de Deporte no aparecen

Ejecuta el script de inicialización: `npm run init-deporte-groups`

### Super Admin no puede cambiar de área

Verifica que el usuario tenga el rol `SUPER_ADMIN` en la base de datos y que el componente `AreaSelector` esté incluido en el header.

### Datos de Cultura no aparecen después de la actualización

El sistema mantiene backward compatibility total. Verifica que:
1. Las variables de entorno de Cultura no hayan cambiado
2. El usuario esté autenticado correctamente
3. El área detectada sea 'cultura'

## Contribuir

Para contribuir al proyecto:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crea un Pull Request

## Documentación Adicional

- [Requirements Document](.kiro/specs/sistema-multi-area/requirements.md)
- [Design Document](.kiro/specs/sistema-multi-area/design.md)
- [Implementation Tasks](.kiro/specs/sistema-multi-area/tasks.md)

## Licencia

[Especificar licencia]

## Contacto

Universidad del Valle - Área de Cultura y Deporte

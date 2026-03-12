# Requirements Document

## Introduction

Este documento especifica los requisitos para implementar un sistema multi-área en la plataforma de la Universidad del Valle, expandiendo la funcionalidad actual del área de Cultura para soportar también el área de Deporte. El sistema debe mantener ambas áreas completamente separadas con bases de datos independientes, garantizando backward compatibility total con la funcionalidad existente de Cultura.

## Glossary

- **Area**: Dominio funcional de la plataforma (Cultura o Deporte)
- **Sistema_Multi_Area**: Sistema que gestiona múltiples áreas con bases de datos independientes
- **BD_Cultura**: Base de datos Firebase existente para el área de Cultura
- **BD_Deporte**: Nueva base de datos Firebase para el área de Deporte
- **Enrutador_Area**: Componente que detecta el área del usuario y dirige las consultas a la BD correspondiente
- **Super_Admin**: Usuario con acceso completo a ambas áreas
- **Admin_Cultura**: Usuario administrador con acceso solo al área de Cultura
- **Admin_Deporte**: Usuario administrador con acceso solo al área de Deporte
- **Director**: Rol en Cultura asignado a un único grupo
- **Monitor**: Rol en Cultura asignado a un único grupo, o rol en Deporte asignado a múltiples grupos
- **Entrenador**: Rol en Deporte asignado a múltiples grupos
- **Estudiante**: Rol por defecto sin asignación de grupo
- **Codigo_Estudiantil**: Identificador numérico único para estudiantes/egresados de Deporte
- **Selector_Area**: Componente UI que permite a Super_Admin cambiar entre áreas
- **Reporte_Combinado**: Documento PDF con estadísticas de ambas áreas

## Requirements

### Requirement 1: Arquitectura Multi-Base de Datos

**User Story:** Como arquitecto del sistema, quiero implementar una arquitectura con bases de datos separadas para cada área, para garantizar aislamiento completo de datos y escalabilidad independiente.

#### Acceptance Criteria

1. THE Sistema_Multi_Area SHALL mantener BD_Cultura sin modificaciones estructurales
2. THE Sistema_Multi_Area SHALL crear BD_Deporte con configuración Firebase independiente
3. WHEN el sistema inicializa, THE Sistema_Multi_Area SHALL establecer conexiones a ambas bases de datos
4. THE Enrutador_Area SHALL detectar el área del usuario autenticado
5. WHEN una consulta se ejecuta, THE Enrutador_Area SHALL dirigir la consulta a la BD correspondiente según el área del usuario
6. THE Sistema_Multi_Area SHALL almacenar las credenciales de BD_Deporte en variables de entorno

### Requirement 2: Modelo de Usuarios Extendido

**User Story:** Como desarrollador, quiero extender el modelo de usuarios para soportar múltiples áreas y asignaciones de grupos, para permitir que usuarios pertenezcan a diferentes áreas con configuraciones específicas.

#### Acceptance Criteria

1. THE Sistema_Multi_Area SHALL agregar el campo "area" con valores 'cultura' o 'deporte' a todos los usuarios
2. THE Sistema_Multi_Area SHALL agregar el campo "codigoEstudiantil" opcional para usuarios de Deporte
3. THE Sistema_Multi_Area SHALL agregar el campo "gruposAsignados" como array de IDs para usuarios de Deporte
4. WHEN un usuario se autentica, THE Sistema_Multi_Area SHALL determinar su área basándose en la BD donde existe
5. THE Sistema_Multi_Area SHALL permitir que un mismo email exista en ambas bases de datos de forma independiente

### Requirement 3: Diferenciación de Roles por Área

**User Story:** Como administrador del sistema, quiero que cada área tenga sus propios roles y reglas de asignación, para reflejar las diferencias operativas entre Cultura y Deporte.

#### Acceptance Criteria

1. WHEN un usuario pertenece a Cultura, THE Sistema_Multi_Area SHALL mantener los roles Director, Monitor, Estudiante y Admin sin cambios
2. WHEN un usuario pertenece a Deporte, THE Sistema_Multi_Area SHALL soportar los roles Entrenador, Monitor, Estudiante y Admin
3. WHEN un Director de Cultura es asignado, THE Sistema_Multi_Area SHALL limitar la asignación a exactamente un grupo
4. WHEN un Monitor de Cultura es asignado, THE Sistema_Multi_Area SHALL limitar la asignación a exactamente un grupo
5. WHEN un Entrenador de Deporte es asignado, THE Sistema_Multi_Area SHALL permitir asignación a múltiples grupos
6. WHEN un Monitor de Deporte es asignado, THE Sistema_Multi_Area SHALL permitir asignación a múltiples grupos
7. THE Sistema_Multi_Area SHALL asignar el rol Estudiante por defecto a nuevos usuarios sin asignación de grupo

### Requirement 4: Gestión de Grupos de Deporte

**User Story:** Como administrador de Deporte, quiero que el sistema tenga precargados todos los grupos deportivos de la universidad, para facilitar la inscripción y asignación de usuarios.

#### Acceptance Criteria

1. WHEN BD_Deporte se inicializa, THE Sistema_Multi_Area SHALL crear 70 grupos deportivos predefinidos
2. THE Sistema_Multi_Area SHALL almacenar cada grupo con nombre único y área 'deporte'
3. WHEN un grupo se consulta, THE Sistema_Multi_Area SHALL retornar solo grupos del área correspondiente

### Requirement 5: Página de Inscripción para Deporte

**User Story:** Como estudiante de Deporte, quiero inscribirme en grupos deportivos mediante un formulario específico, para registrar mi participación incluyendo mi código estudiantil.

#### Acceptance Criteria

1. THE Sistema_Multi_Area SHALL crear la ruta "/inscripcion-deporte" para inscripciones de Deporte
2. THE Sistema_Multi_Area SHALL mantener la ruta "/inscripcion" sin modificaciones para Cultura
3. WHEN un usuario accede a "/inscripcion-deporte", THE Sistema_Multi_Area SHALL mostrar un formulario de inscripción
4. WHEN el usuario selecciona estamento Estudiante o Egresado, THE Sistema_Multi_Area SHALL mostrar el campo "Código Estudiantil"
5. WHEN el usuario selecciona otro estamento, THE Sistema_Multi_Area SHALL ocultar el campo "Código Estudiantil"
6. WHEN el formulario se envía, THE Sistema_Multi_Area SHALL validar que el código estudiantil sea numérico si está presente
7. WHEN el formulario es válido, THE Sistema_Multi_Area SHALL guardar los datos en BD_Deporte

### Requirement 6: Sistema de Roles y Permisos

**User Story:** Como usuario del sistema, quiero que mis permisos y acceso a datos estén limitados según mi rol y área, para garantizar seguridad y separación de responsabilidades.

#### Acceptance Criteria

1. WHEN Super_Admin se autentica, THE Sistema_Multi_Area SHALL permitir acceso a ambas BD_Cultura y BD_Deporte
2. WHEN Super_Admin está activo, THE Sistema_Multi_Area SHALL mostrar un Selector_Area en el header
3. WHEN Super_Admin cambia de área mediante Selector_Area, THE Sistema_Multi_Area SHALL actualizar todas las consultas para usar la BD seleccionada
4. WHEN Admin_Cultura se autentica, THE Sistema_Multi_Area SHALL limitar acceso solo a BD_Cultura
5. WHEN Admin_Deporte se autentica, THE Sistema_Multi_Area SHALL limitar acceso solo a BD_Deporte
6. WHEN Director de Cultura accede a páginas de grupos, THE Sistema_Multi_Area SHALL mostrar solo el grupo al que está asignado
7. WHEN Monitor de Cultura accede a páginas de grupos, THE Sistema_Multi_Area SHALL mostrar solo el grupo al que está asignado
8. WHEN Entrenador de Deporte accede a páginas de grupos, THE Sistema_Multi_Area SHALL mostrar todos los grupos en su array gruposAsignados
9. WHEN Monitor de Deporte accede a páginas de grupos, THE Sistema_Multi_Area SHALL mostrar todos los grupos en su array gruposAsignados
10. WHEN Director, Monitor o Entrenador accede a estadísticas, THE Sistema_Multi_Area SHALL calcular métricas solo con datos de sus grupos asignados
11. WHEN Director, Monitor o Entrenador accede a lista de estudiantes, THE Sistema_Multi_Area SHALL mostrar solo estudiantes inscritos en sus grupos asignados
12. THE Sistema_Multi_Area SHALL denegar acceso a datos de un área cuando el usuario no tiene permisos

### Requirement 7: Visualización de Grupos por Rol

**User Story:** Como director, monitor o entrenador, quiero ver solo los grupos que me corresponden gestionar, para enfocarme en mis responsabilidades específicas.

#### Acceptance Criteria

1. WHEN Director de Cultura accede a la página de grupos, THE Sistema_Multi_Area SHALL mostrar únicamente el grupo almacenado en su campo grupoAsignado
2. WHEN Monitor de Cultura accede a la página de grupos, THE Sistema_Multi_Area SHALL mostrar únicamente el grupo almacenado en su campo grupoAsignado
3. WHEN Entrenador de Deporte accede a la página de grupos, THE Sistema_Multi_Area SHALL mostrar todos los grupos cuyos IDs están en su array gruposAsignados
4. WHEN Monitor de Deporte accede a la página de grupos, THE Sistema_Multi_Area SHALL mostrar todos los grupos cuyos IDs están en su array gruposAsignados
5. WHEN Director, Monitor o Entrenador accede a lista de estudiantes, THE Sistema_Multi_Area SHALL filtrar para mostrar solo estudiantes inscritos en sus grupos asignados
6. WHEN Director, Monitor o Entrenador accede a asistencias, THE Sistema_Multi_Area SHALL mostrar solo registros de asistencia de sus grupos asignados
7. WHEN Admin accede a cualquier vista, THE Sistema_Multi_Area SHALL mostrar todos los grupos del área sin filtros

### Requirement 8: Visualización de Datos Filtrada por Área

**User Story:** Como usuario del sistema, quiero ver solo los datos relevantes a mi área, para evitar confusión y mantener la información organizada.

#### Acceptance Criteria

1. WHEN un usuario accede a cualquier página de datos, THE Sistema_Multi_Area SHALL filtrar resultados según el área del usuario
2. WHEN Super_Admin tiene un área seleccionada, THE Sistema_Multi_Area SHALL mostrar datos solo de esa área
3. WHEN se cargan estadísticas, THE Sistema_Multi_Area SHALL calcular métricas solo con datos del área correspondiente
4. WHEN se listan grupos, THE Sistema_Multi_Area SHALL mostrar solo grupos del área correspondiente
5. WHEN se listan usuarios, THE Sistema_Multi_Area SHALL mostrar solo usuarios del área correspondiente
6. THE Sistema_Multi_Area SHALL mantener la misma interfaz de usuario para ambas áreas

### Requirement 9: Estadísticas y Reportes

**User Story:** Como Super_Admin, quiero generar reportes combinados de ambas áreas, para tener una visión global de la plataforma.

#### Acceptance Criteria

1. WHEN Super_Admin accede al panel de estadísticas, THE Sistema_Multi_Area SHALL mostrar estadísticas del área seleccionada
2. WHEN Super_Admin accede al panel super-admin, THE Sistema_Multi_Area SHALL mostrar un botón para generar Reporte_Combinado
3. WHEN Super_Admin solicita Reporte_Combinado, THE Sistema_Multi_Area SHALL consultar datos de ambas BD_Cultura y BD_Deporte
4. WHEN los datos están recopilados, THE Sistema_Multi_Area SHALL generar un PDF con estadísticas combinadas
5. THE Sistema_Multi_Area SHALL incluir en el PDF métricas separadas por área y totales generales

### Requirement 10: Tarjetas de Usuario

**User Story:** Como usuario que visualiza perfiles, quiero ver información completa incluyendo código estudiantil cuando aplique, para identificar correctamente a los usuarios de Deporte.

#### Acceptance Criteria

1. WHEN se muestra una tarjeta de usuario de Deporte, THE Sistema_Multi_Area SHALL incluir el campo "Código Estudiantil" si existe
2. WHEN se muestra una tarjeta de usuario de Cultura, THE Sistema_Multi_Area SHALL mantener el formato actual sin código estudiantil
3. THE Sistema_Multi_Area SHALL mostrar todos los demás campos existentes sin cambios

### Requirement 11: Variables de Entorno

**User Story:** Como desarrollador, quiero configurar las credenciales de Firebase mediante variables de entorno, para mantener la seguridad y facilitar el despliegue.

#### Acceptance Criteria

1. THE Sistema_Multi_Area SHALL leer las credenciales de BD_Deporte desde variables de entorno
2. THE Sistema_Multi_Area SHALL validar que todas las variables requeridas estén presentes al iniciar
3. WHEN faltan variables de entorno, THE Sistema_Multi_Area SHALL registrar un error descriptivo
4. THE Sistema_Multi_Area SHALL mantener las variables existentes de BD_Cultura sin cambios

### Requirement 12: Backward Compatibility

**User Story:** Como usuario existente de Cultura, quiero que todas las funcionalidades actuales sigan funcionando exactamente igual, para no interrumpir las operaciones actuales.

#### Acceptance Criteria

1. THE Sistema_Multi_Area SHALL mantener todas las rutas existentes de Cultura sin cambios
2. THE Sistema_Multi_Area SHALL mantener todos los componentes existentes de Cultura funcionales
3. WHEN un usuario de Cultura se autentica, THE Sistema_Multi_Area SHALL proporcionar la misma experiencia que antes de la implementación
4. THE Sistema_Multi_Area SHALL ejecutar todas las consultas de Cultura contra BD_Cultura sin modificaciones
5. THE Sistema_Multi_Area SHALL mantener el sistema de chat IA funcionando solo para Cultura sin cambios

### Requirement 13: Separación de Datos

**User Story:** Como arquitecto del sistema, quiero garantizar que los datos de Cultura y Deporte nunca se mezclen, para mantener integridad y cumplir con requisitos de aislamiento.

#### Acceptance Criteria

1. THE Sistema_Multi_Area SHALL almacenar datos de Cultura exclusivamente en BD_Cultura
2. THE Sistema_Multi_Area SHALL almacenar datos de Deporte exclusivamente en BD_Deporte
3. THE Sistema_Multi_Area SHALL prevenir consultas cruzadas entre bases de datos
4. WHEN se ejecuta una transacción, THE Sistema_Multi_Area SHALL limitar la transacción a una única base de datos
5. THE Sistema_Multi_Area SHALL validar que cada operación especifique explícitamente el área objetivo

### Requirement 14: Reutilización de Código

**User Story:** Como desarrollador, quiero reutilizar componentes y páginas existentes para ambas áreas, para minimizar duplicación de código y facilitar mantenimiento.

#### Acceptance Criteria

1. THE Sistema_Multi_Area SHALL utilizar los mismos componentes de UI para ambas áreas
2. THE Sistema_Multi_Area SHALL implementar un sistema de contexto que proporcione el área actual
3. WHEN un componente se renderiza, THE Sistema_Multi_Area SHALL adaptar su comportamiento según el área del contexto
4. THE Sistema_Multi_Area SHALL mantener una única implementación de lógica de negocio que funcione para ambas áreas
5. WHEN se requieren diferencias específicas por área, THE Sistema_Multi_Area SHALL usar configuración condicional basada en el área

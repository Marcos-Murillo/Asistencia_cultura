# Implementation Plan: Sistema Multi-Área

## Overview

Este plan de implementación desglosa el diseño del sistema multi-área en tareas incrementales y ejecutables. Cada tarea construye sobre las anteriores, asegurando progreso validable en cada paso. El enfoque prioriza mantener backward compatibility total con Cultura mientras se introduce la funcionalidad de Deporte.

## Tasks

- [ ] 1. Configurar infraestructura de bases de datos
  - Agregar variables de entorno para BD_Deporte
  - Crear gestor de configuración Firebase
  - Implementar validación de variables de entorno
  - _Requirements: 1.2, 1.3, 11.1, 11.2, 11.3_

- [ ] 2. Implementar sistema de enrutamiento de base de datos
  - [x] 2.1 Crear módulo firebase-config.ts con soporte multi-área
    - Definir tipo Area ('cultura' | 'deporte')
    - Implementar función initializeFirebaseApps()
    - Implementar función getFirestoreForArea(area)
    - Implementar función validateEnvironmentVariables()
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [ ]* 2.2 Escribir property test para inicialización de bases de datos
    - **Property 1: Database Connection Establishment**
    - **Validates: Requirements 1.3**
  
  - [x] 2.3 Crear módulo db-router.ts con funciones conscientes de área
    - Refactorizar saveUserProfile para aceptar parámetro area
    - Refactorizar getAllUsers para aceptar parámetro area
    - Refactorizar getUserById para aceptar parámetro area
    - Refactorizar saveAttendanceEntry para aceptar parámetro area
    - Refactorizar getAttendanceRecords para aceptar parámetro area
    - _Requirements: 1.4, 1.5_
  
  - [ ]* 2.4 Escribir property test para enrutamiento de consultas
    - **Property 3: Query Routing by Area**
    - **Validates: Requirements 1.5**

- [x] 3. Checkpoint - Validar infraestructura de bases de datos
  - Verificar que ambas bases de datos se conectan correctamente
  - Verificar que las consultas se enrutan a la BD correcta
  - Asegurar que todas las pruebas pasan, preguntar al usuario si surgen dudas

- [ ] 4. Implementar sistema de contexto de área
  - [x] 4.1 Crear Area Context Provider
    - Crear contexts/area-context.tsx
    - Implementar AreaProvider component
    - Implementar useArea hook
    - Agregar persistencia de área en localStorage para Super_Admin
    - _Requirements: 14.2_
  
  - [x] 4.2 Integrar Area Context en layout principal
    - Modificar app/layout.tsx para incluir AreaProvider
    - Determinar área inicial basada en usuario autenticado
    - _Requirements: 14.1, 14.3_
  
  - [ ]* 4.3 Escribir unit tests para Area Context
    - Test: Context proporciona área correcta
    - Test: Super_Admin puede cambiar área
    - Test: Usuarios normales no pueden cambiar área
    - _Requirements: 14.2_

- [ ] 5. Extender modelo de usuarios
  - [x] 5.1 Actualizar tipos en lib/types.ts
    - Agregar campo area: 'cultura' | 'deporte' a UserProfile
    - Agregar campo codigoEstudiantil?: string a UserProfile
    - Agregar campo gruposAsignados?: string[] a UserProfile
    - Extender UserRole con 'ENTRENADOR' y 'SUPER_ADMIN'
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [ ]* 5.2 Escribir property test para campo area
    - **Property 5: Area Field Presence**
    - **Validates: Requirements 2.1**
  
  - [ ]* 5.3 Escribir property test para independencia de emails
    - **Property 6: Email Independence Across Areas**
    - **Validates: Requirements 2.5**

- [ ] 6. Implementar sistema de gestión de roles
  - [x] 6.1 Crear módulo lib/role-manager.ts
    - Definir interfaz RolePermissions
    - Implementar función getRolePermissions()
    - Implementar función filterDataByPermissions()
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  
  - [ ]* 6.2 Escribir property test para asignación de grupo único en Cultura
    - **Property 9: Single Group Assignment for Cultura Managers**
    - **Validates: Requirements 3.3, 3.4**
  
  - [ ]* 6.3 Escribir property test para asignación múltiple en Deporte
    - **Property 10: Multiple Group Assignment for Deporte Managers**
    - **Validates: Requirements 3.5, 3.6**
  
  - [ ]* 6.4 Escribir property test para rol por defecto
    - **Property 8: Default Student Role Assignment**
    - **Validates: Requirements 3.7**

- [x] 7. Checkpoint - Validar modelo de usuarios y roles
  - Verificar que los nuevos campos se guardan correctamente
  - Verificar que las restricciones de roles funcionan
  - Asegurar que todas las pruebas pasan, preguntar al usuario si surgen dudas

- [ ] 8. Crear componente selector de área para Super Admin
  - [x] 8.1 Implementar components/area-selector.tsx
    - Crear componente AreaSelector
    - Integrar con useArea hook
    - Mostrar solo si canSwitchArea es true
    - _Requirements: 6.2_
  
  - [x] 8.2 Integrar AreaSelector en navigation/header
    - Agregar AreaSelector al componente de navegación
    - Posicionar en header para fácil acceso
    - _Requirements: 6.2_
  
  - [ ]* 8.3 Escribir unit tests para AreaSelector
    - Test: Selector visible solo para Super_Admin
    - Test: Cambio de área actualiza contexto
    - _Requirements: 6.2_

- [ ] 9. Actualizar sistema de autenticación
  - [x] 9.1 Modificar lib/auth.ts para soporte multi-área
    - Actualizar verifySuperAdmin para retornar rol SUPER_ADMIN
    - Actualizar verifyAdmin para aceptar parámetro area
    - Actualizar verifyGroupManager para aceptar parámetro area
    - _Requirements: 6.1, 6.4, 6.5_
  
  - [ ]* 9.2 Escribir property test para detección de área
    - **Property 2: Area Detection from Authentication**
    - **Validates: Requirements 1.4, 2.4**
  
  - [ ]* 9.3 Escribir property test para acceso de Super_Admin
    - **Property 15: Super Admin Area-Based Access**
    - **Validates: Requirements 6.1, 6.3, 8.2**

- [ ] 10. Implementar filtrado de datos por área
  - [x] 10.1 Actualizar funciones de consulta en db-router.ts
    - Modificar getAllUsers para filtrar por área
    - Modificar getAttendanceRecords para filtrar por área
    - Modificar getAllEvents para filtrar por área
    - Modificar getAllCulturalGroups para filtrar por área
    - _Requirements: 8.1, 8.3, 8.4, 8.5_
  
  - [ ]* 10.2 Escribir property test para filtrado por área
    - **Property 16: Area-Based Data Filtering**
    - **Validates: Requirements 8.1, 8.3, 8.4, 8.5**
  
  - [ ]* 10.3 Escribir property test para denegación de acceso
    - **Property 17: Access Denial for Unauthorized Area**
    - **Validates: Requirements 6.12**

- [x] 11. Checkpoint - Validar autenticación y filtrado
  - Verificar que usuarios se autentican en el área correcta
  - Verificar que los datos se filtran correctamente por área
  - Asegurar que todas las pruebas pasan, preguntar al usuario si surgen dudas

- [ ] 12. Implementar filtrado por grupos asignados
  - [x] 12.1 Crear funciones de filtrado en role-manager.ts
    - Implementar filterGroupsByAssignment()
    - Implementar filterStudentsByAssignment()
    - Implementar filterAttendanceByAssignment()
    - _Requirements: 6.6, 6.7, 6.8, 6.9, 7.1, 7.2, 7.3, 7.4_
  
  - [ ]* 12.2 Escribir property test para visibilidad de grupos en Cultura
    - **Property 11: Group Visibility for Cultura Managers**
    - **Validates: Requirements 6.6, 6.7, 7.1, 7.2**
  
  - [ ]* 12.3 Escribir property test para visibilidad de grupos en Deporte
    - **Property 12: Group Visibility for Deporte Managers**
    - **Validates: Requirements 6.8, 6.9, 7.3, 7.4**
  
  - [ ]* 12.4 Escribir property test para filtrado de datos por grupos
    - **Property 13: Data Filtering by Assigned Groups**
    - **Validates: Requirements 6.10, 6.11, 7.5, 7.6**

- [ ] 13. Actualizar páginas existentes para usar contexto de área
  - [x] 13.1 Actualizar app/usuarios/page.tsx
    - Integrar useArea hook
    - Pasar área a funciones de consulta
    - Aplicar filtrado por grupos asignados
    - _Requirements: 8.1, 8.5_
  
  - [x] 13.2 Actualizar app/grupos/page.tsx
    - Integrar useArea hook
    - Pasar área a funciones de consulta
    - Aplicar filtrado por grupos asignados
    - _Requirements: 8.1, 8.4_
  
  - [x] 13.3 Actualizar app/estadisticas/page.tsx
    - Integrar useArea hook
    - Pasar área a funciones de consulta
    - Aplicar filtrado por grupos asignados
    - _Requirements: 8.1, 8.3_
  
  - [x] 13.4 Actualizar app/convocatorias/page.tsx
    - Integrar useArea hook
    - Pasar área a funciones de consulta
    - _Requirements: 8.1_

- [x] 14. Checkpoint - Validar integración de páginas existentes
  - Verificar que todas las páginas funcionan con el nuevo sistema
  - Verificar que Cultura sigue funcionando exactamente igual
  - Asegurar que todas las pruebas pasan, preguntar al usuario si surgen dudas

- [ ] 15. Crear página de inscripción para Deporte
  - [x] 15.1 Crear app/inscripcion-deporte/page.tsx
    - Copiar estructura de app/inscripcion/page.tsx
    - Modificar para usar área 'deporte'
    - Agregar campo condicional "Código Estudiantil"
    - _Requirements: 5.1, 5.3, 5.4, 5.5_
  
  - [x] 15.2 Implementar validación de código estudiantil
    - Agregar validación numérica en el formulario
    - Mostrar error si formato es inválido
    - _Requirements: 5.6_
  
  - [ ]* 15.3 Escribir property test para display condicional
    - **Property 18: Conditional Codigo Estudiantil Display**
    - **Validates: Requirements 5.4, 5.5**
  
  - [ ]* 15.4 Escribir property test para validación numérica
    - **Property 19: Numeric Codigo Estudiantil Validation**
    - **Validates: Requirements 5.6**
  
  - [ ]* 15.5 Escribir property test para persistencia en BD_Deporte
    - **Property 20: Deporte Form Data Persistence**
    - **Validates: Requirements 5.7**

- [ ] 16. Inicializar grupos de Deporte
  - [x] 16.1 Crear script scripts/init-deporte-groups.ts
    - Definir array GRUPOS_DEPORTE con 70 grupos
    - Implementar función initializeDeporteGroups()
    - Agregar manejo de errores y logging
    - _Requirements: 4.1_
  
  - [x] 16.2 Ejecutar script de inicialización
    - Ejecutar script contra BD_Deporte
    - Verificar que se crearon 70 grupos
    - Verificar que todos tienen área 'deporte'
    - _Requirements: 4.1, 4.2_
  
  - [ ]* 16.3 Escribir property test para nombres únicos de grupos
    - **Property 21: Unique Group Names per Area**
    - **Validates: Requirements 4.2**

- [x] 17. Checkpoint - Validar funcionalidad de Deporte
  - Verificar que la inscripción de Deporte funciona
  - Verificar que los grupos de Deporte se muestran correctamente
  - Asegurar que todas las pruebas pasan, preguntar al usuario si surgen dudas

- [ ] 18. Actualizar componentes de tarjetas de usuario
  - [x] 18.1 Modificar componente de tarjeta de usuario
    - Agregar display condicional de codigoEstudiantil para Deporte
    - Mantener formato existente para Cultura
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [ ]* 18.2 Escribir property test para display de codigo estudiantil
    - **Property 23: Codigo Estudiantil Display for Deporte Users**
    - **Validates: Requirements 10.1**
  
  - [ ]* 18.3 Escribir property test para preservación de tarjetas Cultura
    - **Property 24: Cultura User Card Preservation**
    - **Validates: Requirements 10.2, 10.3**

- [ ] 19. Implementar sistema de reportes combinados
  - [x] 19.1 Crear función para generar reporte combinado
    - Implementar generateCombinedReport() en lib/reports.ts
    - Consultar estadísticas de BD_Cultura
    - Consultar estadísticas de BD_Deporte
    - Agregar datos de ambas áreas
    - _Requirements: 9.3_
  
  - [x] 19.2 Crear función para generar PDF
    - Implementar generateCombinedReportPDF()
    - Incluir métricas separadas por área
    - Incluir totales combinados
    - _Requirements: 9.4, 9.5_
  
  - [x] 19.3 Agregar botón en panel super-admin
    - Modificar app/super-admin/page.tsx
    - Agregar botón "Generar Reporte Combinado"
    - Conectar con función de generación
    - _Requirements: 9.2_
  
  - [ ]* 19.4 Escribir property test para agregación de datos
    - **Property 25: Combined Report Data Aggregation**
    - **Validates: Requirements 9.3**
  
  - [ ]* 19.5 Escribir property test para estructura del reporte
    - **Property 26: Combined Report Content Structure**
    - **Validates: Requirements 9.5**

- [x] 20. Checkpoint - Validar reportes combinados
  - Verificar que el reporte combina datos de ambas áreas
  - Verificar que el PDF se genera correctamente
  - Asegurar que todas las pruebas pasan, preguntar al usuario si surgen dudas

- [ ] 21. Implementar validaciones de aislamiento de datos
  - [x] 21.1 Agregar validaciones en db-router.ts
    - Validar que área está especificada en todas las operaciones
    - Prevenir consultas cruzadas entre bases de datos
    - Validar límites de transacciones
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_
  
  - [ ]* 21.2 Escribir property test para aislamiento de datos
    - **Property 27: Complete Data Isolation Between Areas**
    - **Validates: Requirements 13.1, 13.2, 13.3**
  
  - [ ]* 21.3 Escribir property test para límites de transacciones
    - **Property 28: Transaction Boundary Enforcement**
    - **Validates: Requirements 13.4**
  
  - [ ]* 21.4 Escribir property test para especificación explícita de área
    - **Property 29: Explicit Area Specification**
    - **Validates: Requirements 13.5**

- [ ] 22. Ejecutar suite de pruebas de backward compatibility
  - [x] 22.1 Crear suite de pruebas de regresión
    - Copiar todas las pruebas existentes de Cultura
    - Ejecutar contra nueva implementación
    - Verificar que todos los resultados son idénticos
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
  
  - [ ]* 22.2 Escribir property test para preservación de funcionalidad
    - **Property 30: Cultura Functionality Preservation**
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5**
  
  - [ ]* 22.3 Escribir property test para preservación de schema
    - **Property 31: Cultura Database Schema Preservation**
    - **Validates: Requirements 1.1**

- [x] 23. Checkpoint - Validar backward compatibility
  - Verificar que Cultura funciona exactamente igual que antes
  - Verificar que no hay regresiones
  - Asegurar que todas las pruebas pasan, preguntar al usuario si surgen dudas

- [ ] 24. Actualizar documentación
  - [x] 24.1 Actualizar README.md
    - Documentar nuevas variables de entorno
    - Documentar sistema multi-área
    - Documentar roles y permisos
    - _Requirements: 11.1_
  
  - [x] 24.2 Crear guía de migración
    - Documentar pasos para agregar nuevas áreas
    - Documentar proceso de inicialización de grupos
    - Documentar troubleshooting común

- [ ] 25. Configurar monitoreo y logging
  - [x] 25.1 Agregar logging de eventos clave
    - Log de cambios de área por Super_Admin
    - Log de intentos de acceso cross-área
    - Log de errores de enrutamiento
    - Log de validación de variables de entorno
  
  - [ ] 25.2 Configurar métricas de rendimiento
    - Tiempo de respuesta de consultas por área
    - Tasa de éxito de enrutamiento
    - Latencia de cambio de área

- [ ] 26. Checkpoint final - Validación completa del sistema
  - Ejecutar todas las pruebas (unit, property, integration)
  - Verificar que todas las funcionalidades funcionan correctamente
  - Verificar que Cultura mantiene backward compatibility total
  - Verificar que Deporte tiene todas las funcionalidades requeridas
  - Asegurar que todas las pruebas pasan, preguntar al usuario si surgen dudas

## Notes

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia los requisitos específicos que valida
- Los checkpoints aseguran validación incremental
- Las property tests validan propiedades de corrección universales
- Las unit tests validan ejemplos específicos y casos edge
- La estrategia prioriza backward compatibility - Cultura debe funcionar sin cambios
- El sistema está diseñado para ser extensible a áreas adicionales en el futuro

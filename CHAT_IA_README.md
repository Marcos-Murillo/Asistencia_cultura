# 🤖 Chat IA - Consultas Firebase Firestore

## 📋 Descripción

Sistema de chat inteligente que permite al Super Admin hacer consultas complejas a Firebase Firestore en lenguaje natural usando IA (Groq).

## ✨ Características

- ✅ Consultas en lenguaje natural español
- ✅ Acceso exclusivo para Super Admin
- ✅ Integración con Firebase Firestore existente
- ✅ Respuestas inteligentes con IA (Groq)
- ✅ Interfaz moderna y responsive
- ✅ Ejemplos de consultas predefinidos

## 🚀 Instalación

### 1. Instalar dependencia de Groq

```bash
npm install groq-sdk
```

### 2. Configurar variables de entorno

Agregar en tu archivo `.env.local`:

```env
GROQ_API_KEY=your_groq_api_key_here
```

### 3. Reiniciar el servidor de desarrollo

```bash
npm run dev
```

## 📍 Acceso

- URL: `http://localhost:3000/chat`
- Requisito: Estar autenticado como Super Admin
- Botón en navbar: "Chat IA" (solo visible para Super Admin)

## 💬 Ejemplos de Consultas

```
¿Cuántas asistencias hay hoy en todos los grupos?
¿Estudiantes de comunicación social inscritos en Salsa?
¿Quiénes se inscribieron al último evento?
Top 5 grupos con más asistencias esta semana
¿Usuarios de Danza que son egresados?
¿Cuántos estudiantes hay por facultad?
```

## 🗄️ Colecciones Firestore Disponibles

1. **user_profiles** - Perfiles de usuarios
2. **attendance_records** - Registros de asistencia
3. **group_enrollments** - Inscripciones a grupos
4. **cultural_groups** - Catálogo de grupos
5. **events** - Eventos culturales
6. **event_attendance_records** - Asistencia a eventos
7. **admin_users** - Administradores
8. **group_managers** - Encargados de grupos
9. **group_category_assignments** - Categorías de usuarios

## 🔐 Seguridad

- ✅ Verificación de Super Admin en backend y frontend
- ✅ Solo consultas de lectura (no modificaciones)
- ✅ Límite de 100 resultados por consulta
- ✅ Validación de permisos en cada request

## 🛠️ Tecnologías

- **Next.js 14** - Framework React
- **Firebase Firestore** - Base de datos
- **Groq AI** - Modelo de lenguaje (llama-3.3-70b-versatile)
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos

## 📝 Archivos Creados

```
app/
├── api/
│   └── chat/
│       └── route.ts          # API endpoint para consultas
└── chat/
    └── page.tsx              # Página del chat

components/
└── navigation.tsx            # Actualizado con botón Chat IA

.env.example                  # Variables de entorno de ejemplo
CHAT_IA_README.md            # Este archivo
```

## 🐛 Troubleshooting

### Error: "Cannot find module 'groq-sdk'"
```bash
npm install groq-sdk
```

### Error: "Acceso denegado"
- Verificar que estás autenticado como Super Admin
- Revisar sessionStorage: `userType === "superadmin"`

### Error: "GROQ_API_KEY no definida"
- Agregar la variable en `.env.local`
- Reiniciar el servidor de desarrollo

## 📊 Flujo de Funcionamiento

1. Usuario Super Admin accede a `/chat`
2. Escribe pregunta en lenguaje natural
3. Frontend envía pregunta a `/api/chat`
4. Backend verifica permisos de Super Admin
5. IA (Groq) convierte pregunta a consulta Firestore
6. Se ejecuta la consulta en Firebase
7. IA genera respuesta en español
8. Se muestra resultado al usuario

## 🎯 Próximas Mejoras

- [ ] Historial de consultas
- [ ] Exportar resultados a Excel
- [ ] Gráficas automáticas de resultados
- [ ] Consultas guardadas/favoritas
- [ ] Sugerencias inteligentes mientras escribes

## 📞 Soporte

Para problemas o preguntas, contactar al equipo de desarrollo.

---

**Desarrollado para Sistema Cultural UV** 🎭

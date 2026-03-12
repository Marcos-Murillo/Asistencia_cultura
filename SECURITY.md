# Guía de Seguridad

## Variables de Entorno

Este proyecto utiliza variables de entorno para almacenar información sensible. **NUNCA** commits archivos que contengan credenciales reales.

### Archivos de Configuración

- `.env.example` - Plantilla con valores de ejemplo (SÍ se commitea)
- `.env.local` - Valores reales para desarrollo local (NO se commitea)
- `.env` - Valores reales (NO se commitea)

### Variables Requeridas

#### Firebase - Cultura
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
```

#### Firebase - Deporte
```
NEXT_PUBLIC_FIREBASE_DEPORTE_API_KEY
NEXT_PUBLIC_FIREBASE_DEPORTE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_DEPORTE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_DEPORTE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_DEPORTE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_DEPORTE_APP_ID
NEXT_PUBLIC_FIREBASE_DEPORTE_MEASUREMENT_ID
```

#### APIs Externas
```
GROQ_API_KEY - API de Groq para Chat IA
ELEVENLABS_API_KEY - API de ElevenLabs para síntesis de voz
```

#### Credenciales de Super Admin
```
NEXT_PUBLIC_SUPER_ADMIN_USER - Usuario del super administrador
NEXT_PUBLIC_SUPER_ADMIN_PASSWORD - Contraseña del super administrador
```

## Configuración Inicial

1. Copia `.env.example` a `.env.local`:
   ```bash
   copy .env.example .env.local
   ```

2. Edita `.env.local` con tus credenciales reales

3. Verifica que `.env.local` esté en `.gitignore`

## Mejores Prácticas

1. **Nunca** hardcodees credenciales en el código
2. **Nunca** commits archivos `.env.local` o `.env`
3. Usa `process.env.VARIABLE_NAME` para acceder a variables de entorno
4. Rota las credenciales periódicamente
5. Usa diferentes credenciales para desarrollo y producción
6. Limita los permisos de las API keys al mínimo necesario

## Rotación de Credenciales

Si una credencial se expone:

1. Revoca inmediatamente la credencial comprometida en la consola del servicio
2. Genera una nueva credencial
3. Actualiza `.env.local` con la nueva credencial
4. Notifica al equipo si es necesario

## Verificación de Seguridad

Antes de hacer commit, verifica que no haya secretos:

```bash
# Buscar posibles secretos
grep -r "AIzaSy" . --exclude-dir=node_modules
grep -r "sk-" . --exclude-dir=node_modules
grep -r "gsk_" . --exclude-dir=node_modules
```

## Contacto

Si encuentras una vulnerabilidad de seguridad, repórtala inmediatamente al equipo de desarrollo.

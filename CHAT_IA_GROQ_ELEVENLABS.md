# 🚀 Chat IA con Groq + ElevenLabs (100% GRATIS)

## ✅ Implementación Completa

### Stack Tecnológico
- **Groq AI**: Generación de texto (GRATIS, ilimitado)
- **ElevenLabs**: Síntesis de voz española natural
- **Firebase Firestore**: Base de datos
- **Next.js 14**: Framework

## 🎯 Características

### 1. Consultas en Lenguaje Natural
- "¿Estudiantes de comunicación social en Salsa?"
- "¿Cuántas asistencias hay hoy?"
- "¿Quién está inscrito en Danza?"

### 2. Respuestas con Voz Española
- ✅ Voz femenina natural (Jessica - español)
- ✅ Reproducción automática
- ✅ Botón "Escuchar" en cada mensaje
- ✅ Audio en formato MP3 base64

### 3. Interfaz Moderna
- Diseño inspirado en ElevenLabs UI
- Orbe animado que pulsa al procesar
- Estados visuales: idle, thinking, responding
- Botones de copiar y escuchar
- Auto-scroll inteligente

## 📋 Configuración

### 1. Variables de Entorno (.env.local)

```env
# Groq AI (GRATIS)
GROQ_API_KEY=your_groq_api_key_here

# ElevenLabs (Voz Española)
ELEVENLABS_API_KEY=sk_aa20d022a329146b66a3e83cad0fc9f0693978d105af2104
```

### 2. Dependencias Instaladas

```bash
npm install groq-sdk @elevenlabs/elevenlabs-js
```

## 🔊 Voces Disponibles

### Voz Actual: Jessica (cgSgspJ2msm6clMCkdW9)
- Idioma: Español
- Género: Femenino
- Estilo: Natural y profesional

### Alternativas:
- **Matilda**: Voz femenina cálida
- **Valentino**: Voz masculina seria
- **Bella**: Voz femenina joven

Para cambiar la voz, modifica el ID en `app/api/chat/route.ts`:
```typescript
const audio = await elevenlabs.textToSpeech.convert("VOICE_ID_AQUI", {
  text: response,
  modelId: "eleven_multilingual_v2",
})
```

## 🎨 Componentes Creados

### 1. components/ui/conversation.tsx
- Contenedor de conversación
- Auto-scroll inteligente
- Botón para volver abajo

### 2. components/ui/message.tsx
- Componente de mensaje
- Alineación automática (user/assistant)

### 3. components/ui/response.tsx
- Burbuja de respuesta
- Estilos diferenciados por rol

### 4. components/ui/orb.tsx
- Orbe animado con gradiente
- Estados: talking, listening, idle

## 🔥 Flujo de Funcionamiento

1. **Usuario escribe pregunta** → "¿Estudiantes de Salsa?"
2. **Groq genera queryPlan** → Consulta Firebase
3. **Firebase retorna datos** → 12 estudiantes encontrados
4. **Groq genera respuesta natural** → "Encontré 12 estudiantes..."
5. **ElevenLabs genera audio** → Voz española MP3
6. **Frontend muestra texto + audio** → Reproducción automática

## 📊 Logs del Sistema

```
[Chat] Generando plan de consulta para: ¿Estudiantes de Salsa?
[Chat] Plan generado: { collection: "group_enrollments", ... }
[Chat] Ejecutando consulta en Firestore...
[JOIN] ✅ Encontrado user_profiles para userId: abc123
[Chat] Generando respuesta natural...
[Chat] Generando audio con ElevenLabs...
[Chat] Audio generado exitosamente
```

## 🎯 Ventajas vs OpenAI

| Característica | Groq + ElevenLabs | OpenAI |
|---------------|-------------------|---------|
| Costo | GRATIS | $$ Pago |
| Velocidad | Ultra rápido | Rápido |
| Voz | Español natural | Limitado |
| Límites | Generosos | Restrictivos |
| Calidad | Excelente | Excelente |

## 🔐 Seguridad

- ✅ Solo Super Admin puede acceder
- ✅ Verificación en backend y frontend
- ✅ Queries seguras (solo reads)
- ✅ Límite de 100 resultados por consulta

## 🧪 Pruebas Recomendadas

1. "¿Estudiantes de comunicación social en Salsa?"
   - Debe mostrar nombres reales
   - Debe reproducir audio automáticamente

2. "¿Cuántas asistencias hay hoy?"
   - Debe contar registros de hoy
   - Debe responder con número exacto

3. "¿Quién está inscrito en Danza?"
   - Debe buscar parcialmente "Danza"
   - Debe listar nombres con programas

4. Botón "Escuchar"
   - Debe reproducir audio en español
   - Debe funcionar múltiples veces

## 📝 Archivos Modificados

- `app/api/chat/route.ts` - Backend con Groq + ElevenLabs
- `app/chat/page.tsx` - Frontend con reproducción de audio
- `components/ui/conversation.tsx` - Nuevo componente
- `components/ui/message.tsx` - Nuevo componente
- `components/ui/response.tsx` - Nuevo componente
- `components/ui/orb.tsx` - Nuevo componente
- `.env.example` - Variables actualizadas
- `package.json` - Dependencias actualizadas

## 🚀 Próximos Pasos

1. ✅ Implementado: Texto + Voz
2. 🔄 Opcional: Visualización de forma de onda
3. 🔄 Opcional: Selección de voz en UI
4. 🔄 Opcional: Velocidad de reproducción ajustable
5. 🔄 Opcional: Descarga de audio

## 💡 Notas Importantes

- ElevenLabs tiene límite de 10,000 caracteres/mes en plan gratuito
- Groq es completamente gratis sin límites estrictos
- El audio se genera solo si hay API key configurada
- Si falla el audio, la respuesta de texto sigue funcionando
- Los JOINs están optimizados para traer nombres reales

## 🎉 Resultado Final

Un chatbot profesional que:
- Responde consultas complejas de Firebase
- Genera voz española natural
- Interfaz moderna tipo ElevenLabs
- 100% funcional y GRATIS
- Solo para Super Admin

¡Todo listo para producción! 🚀

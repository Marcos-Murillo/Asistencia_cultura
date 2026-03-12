# Migración del Chat IA de Groq a OpenAI

## Cambios Realizados

### 1. Reemplazo de SDK
- **Antes**: Groq SDK (`groq-sdk`)
- **Ahora**: OpenAI SDK (`openai`)

### 2. Modelo Utilizado
- **Antes**: `llama-3.3-70b-versatile` (Groq)
- **Ahora**: `gpt-4o-mini` (OpenAI)

### 3. Variables de Entorno
Actualizar `.env.local` con:

```env
# OpenAI API Key (para Chat IA)
OPENAI_API_KEY=tu_api_key_de_openai_aqui
```

### 4. Ventajas de OpenAI
- ✅ Más estable y confiable
- ✅ Mejor comprensión de contexto
- ✅ Respuestas más precisas
- ✅ Soporte oficial y documentación completa
- ✅ Mejor manejo de JSON estructurado

### 5. Correcciones Implementadas

#### JOIN Simplificado
- Ahora usa `doc(db, "user_profiles", userId)` directamente
- Elimina lógica compleja de `where()` que no funcionaba
- Logs más claros: `[JOIN] ✅ Encontrado` o `[JOIN] ⚠️ No existe`

#### Respuestas Mejoradas
- Sin asteriscos ni formato markdown excesivo
- Temperatura reducida a 0.2 para mayor consistencia
- Max tokens: 800 (respuestas más concisas)
- Formato natural: "1. Juan Pérez - Comunicación Social"

### 6. Instalación

```bash
npm install openai
```

### 7. Configuración

1. Obtener API key de OpenAI: https://platform.openai.com/api-keys
2. Agregar a `.env.local`:
   ```
   OPENAI_API_KEY=sk-proj-...
   ```
3. Reiniciar el servidor de desarrollo

### 8. Pruebas Recomendadas

Probar estas consultas en `/chat`:
- "¿Estudiantes de comunicación social en Salsa?"
- "¿Cuántos usuarios hay en Danza?"
- "¿Asistencias de hoy?"
- "¿Quién está inscrito en Teatro?"

### 9. Archivos Modificados

- `app/api/chat/route.ts` - Reemplazo completo de Groq por OpenAI
- `.env.example` - Actualización de variables de entorno
- `package.json` - Agregado `openai` como dependencia

### 10. Notas Importantes

- El código mantiene la misma funcionalidad
- Los JOINS ahora funcionan correctamente
- Las respuestas son más naturales y limpias
- Compatible con el historial de conversación existente

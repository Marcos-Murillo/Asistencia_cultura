import { NextRequest, NextResponse } from "next/server"
import { collection, query, where, getDocs, orderBy, limit, Timestamp, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import Groq from "groq-sdk"
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
})

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY || "",
})

// Tono natural para Daniela
const NATURAL_TONE = `Eres Daniela, asistente del Área Cultural de Univalle. Hablas de forma amigable y profesional.
- Saludo: "¡Listo!", "Te tengo", "Aquí va"
- Usa emojis sutiles: ✅, 🎯, 🥇, 🥈, 🥉
- Menciona el total primero
- Cierre útil: "¿Necesitas algo más?"`

// Esquema de Firestore
const FIRESTORE_SCHEMA = `
COLECCIONES:
1. user_profiles: id, nombres, correo, programaAcademico, facultad, estamento, rol, genero, numeroDocumento
2. attendance_records: id, userId, grupoCultural, timestamp
3. group_enrollments: id, userId, grupoCultural, fechaInscripcion
4. cultural_groups: id, nombre, activo
5. events: id, nombre, hora, lugar, fechaApertura, fechaVencimiento, activo
6. event_attendance_records: id, userId, eventId, timestamp
7. admin_users: id, numeroDocumento, rol
8. group_managers: id, userId, grupoCultural, assignedAt, assignedBy (MONITORES/ENCARGADOS DE GRUPOS - userId es referencia a user_profiles)
9. group_category_assignments: id, grupoCultural, categoria

FECHAS ESPECIALES:
- "today" = hoy 00:00
- "yesterday" = ayer 00:00
- "this_week" = lunes de esta semana
- "last_week" = lunes de semana pasada
- "this_month" = día 1 del mes
- "last_month" = día 1 del mes anterior

SINÓNIMOS PROGRAMAS:
- "comunicación social" | "periodismo" → "COMUNICACIÓN SOCIAL - PERIODISMO (3553)"
- "ingeniería de sistemas" | "sistemas" → "INGENIERÍA DE SISTEMAS (3743)"
- "ingeniería civil" | "civil" → "INGENIERÍA CIVIL (3747)"
- "derecho" → "DERECHO"
- "medicina" → "MEDICINA Y CIRUGÍA (3660)"

SINÓNIMOS GRUPOS:
- "salsa" | "bachata" → "SELECCIÓN SALSA, BACHATA Y RITMOS LATINOS"
- "danza contemporánea" → "GRUPO DE DANZA CONTEMPORÁNEA"
- "teatro" → "GRUPO DE TEATRO BIENESTAR UNIVERSITARIO"
- "coro" → "CORO MAGNO"

PALABRAS CLAVE IMPORTANTES:
- "monitores" | "encargados" | "responsables" | "coordinadores" → buscar en group_managers
- "estudiantes" | "inscritos" | "participantes" → buscar en group_enrollments o user_profiles
- "asistencias" | "asistieron" | "fueron" → buscar en attendance_records
- "eventos" → buscar en events o event_attendance_records

REGLAS:
1. Para consultas con usuarios, usa JOINS con user_profiles
2. Para búsquedas parciales, usa el término corto
3. Para rankings, usa orderBy + limit
4. Limita resultados a 100 máximo
5. Para monitores/encargados: buscar en group_managers y hacer JOIN con user_profiles usando userId (NO numeroDocumento)
`

interface QueryPlan {
  collection: string
  filters: Array<{ field: string; operator: string; value: any }>
  orderByField?: string
  orderDirection?: "asc" | "desc"
  limitCount?: number
  joins?: Array<{ 
    collection: string
    localField: string
    foreignField: string
    joinType?: "id" | "field" // "id" = buscar por doc ID, "field" = buscar por campo
  }>
}

async function generateQueryPlan(userQuestion: string, conversationHistory: any[] = []): Promise<QueryPlan> {
  const historyContext = conversationHistory.length > 0
    ? `HISTORIAL:\n${conversationHistory.slice(-3).map((msg: any) => 
        `Usuario: ${msg.user}\nIA: ${msg.ai}`
      ).join('\n\n')}\n`
    : ''

  const prompt = `Eres experta en Firebase Firestore. Convierte esta pregunta en un plan JSON.

${FIRESTORE_SCHEMA}
${historyContext}
PREGUNTA: "${userQuestion}"

EJEMPLOS:

"¿Estudiantes de comunicación social en Salsa?"
{
  "collection": "group_enrollments",
  "filters": [{"field": "grupoCultural", "operator": "==", "value": "Salsa"}],
  "limitCount": 100,
  "joins": [{"collection": "user_profiles", "localField": "userId", "foreignField": "id"}]
}

"¿Cuántas asistencias hoy?"
{
  "collection": "attendance_records",
  "filters": [{"field": "timestamp", "operator": ">=", "value": "today"}],
  "limitCount": 1000
}

"Top 5 grupos esta semana"
{
  "collection": "attendance_records",
  "filters": [{"field": "timestamp", "operator": ">=", "value": "this_week"}],
  "limitCount": 1000
}

"¿Quiénes son monitores?"
{
  "collection": "user_profiles",
  "filters": [{"field": "rol", "operator": "==", "value": "MONITOR"}],
  "limitCount": 100
}

"¿Monitores encargados de Salsa?"
{
  "collection": "group_managers",
  "filters": [{"field": "grupoCultural", "operator": "==", "value": "Salsa"}],
  "limitCount": 100,
  "joins": [{"collection": "user_profiles", "localField": "userId", "foreignField": "id", "joinType": "id"}]
}

Responde SOLO con el JSON, sin explicaciones.`

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      max_tokens: 1000,
    })

    const response = completion.choices[0]?.message?.content || "{}"
    console.log("[Chat] Respuesta LLM:", response)
    
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    const jsonStr = jsonMatch ? jsonMatch[0] : response
    const plan = JSON.parse(jsonStr)
    
    if (!plan.collection) {
      throw new Error("Plan inválido: falta 'collection'")
    }
    
    if (!plan.filters) {
      plan.filters = []
    }
    
    return plan
  } catch (error: any) {
    console.error("[Chat] Error generando plan:", error)
    throw new Error(`Error generando plan: ${error.message}`)
  }
}

function parseSpecialDateValue(value: string): Date {
  const now = new Date()
  
  if (value === "today") {
    now.setHours(0, 0, 0, 0)
    return now
  }
  
  if (value === "yesterday") {
    now.setDate(now.getDate() - 1)
    now.setHours(0, 0, 0, 0)
    return now
  }
  
  if (value === "this_week") {
    const dayOfWeek = now.getDay()
    const diff = now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)
    const monday = new Date(now.setDate(diff))
    monday.setHours(0, 0, 0, 0)
    return monday
  }
  
  if (value === "last_week") {
    const dayOfWeek = now.getDay()
    const diff = now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) - 7
    const lastMonday = new Date(now.setDate(diff))
    lastMonday.setHours(0, 0, 0, 0)
    return lastMonday
  }
  
  if (value === "this_month") {
    return new Date(now.getFullYear(), now.getMonth(), 1)
  }
  
  if (value === "last_month") {
    return new Date(now.getFullYear(), now.getMonth() - 1, 1)
  }
  
  return new Date(value)
}

async function executeFirestoreQuery(plan: QueryPlan): Promise<any[]> {
  try {
    console.log("[Chat] Ejecutando plan:", JSON.stringify(plan, null, 2))
    
    const collectionRef = collection(db, plan.collection)
    
    // Detectar búsqueda parcial
    const hasPartialSearch = plan.filters.some(f => 
      (f.field === "grupoCultural" || f.field === "nombres") && 
      typeof f.value === "string" && f.value.length < 50
    )

    if (hasPartialSearch) {
      console.log("[Chat] Búsqueda parcial detectada")
      
      let q = query(collectionRef, limit(1000))
      const snapshot = await getDocs(q)
      let results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      console.log(`[Chat] Documentos obtenidos: ${results.length}`)
      
      // Log de los primeros resultados para debugging
      if (results.length > 0) {
        console.log("[Chat] Primer resultado completo:", JSON.stringify(results[0], null, 2))
      }
      
      // Filtrar en memoria
      for (const filter of plan.filters) {
        if (filter.field === "grupoCultural" || filter.field === "nombres") {
          const searchTerm = filter.value.toLowerCase()
          results = results.filter((doc: any) => {
            const fieldValue = (doc[filter.field] || "").toLowerCase()
            return fieldValue.includes(searchTerm)
          })
          console.log(`[Chat] Filtrado por ${filter.field} "${searchTerm}": ${results.length} resultados`)
        } else {
          results = results.filter((doc: any) => {
            const docValue = doc[filter.field]
            switch (filter.operator) {
              case "==": return docValue === filter.value
              case "!=": return docValue !== filter.value
              case ">": return docValue > filter.value
              case "<": return docValue < filter.value
              case ">=": return docValue >= filter.value
              case "<=": return docValue <= filter.value
              default: return true
            }
          })
        }
      }
      
      if (plan.orderByField) {
        results.sort((a: any, b: any) => {
          const aVal = a[plan.orderByField!]
          const bVal = b[plan.orderByField!]
          if (plan.orderDirection === "desc") {
            return bVal > aVal ? 1 : -1
          }
          return aVal > bVal ? 1 : -1
        })
      }
      
      const limitCount = plan.limitCount || 100
      results = results.slice(0, limitCount)
      
      // Procesar joins
      if (plan.joins && plan.joins.length > 0) {
        console.log("[JOIN] Iniciando proceso...")
        const joinedResults: any[] = []
        
        for (const result of results) {
          const joinedResult: any = { ...result }
          
          for (const join of plan.joins) {
            let localValue = (result as any)[join.localField]
            
            if (localValue?.path) {
              localValue = localValue.id
            }
            
            if (!localValue) {
              console.log(`[JOIN] ⚠️ No hay valor en ${join.localField}`)
              continue
            }
            
            try {
              // JOIN por ID de documento (método anterior)
              if (!join.joinType || join.joinType === "id") {
                const docRef = doc(db, join.collection, localValue)
                const docSnap = await getDoc(docRef)
                
                if (docSnap.exists()) {
                  joinedResult[`${join.collection}_data`] = {
                    id: docSnap.id,
                    ...docSnap.data()
                  }
                  console.log(`[JOIN] ✅ Encontrado ${join.collection} para ${localValue}`)
                } else {
                  console.log(`[JOIN] ⚠️ No existe ${join.collection}/${localValue}`)
                }
              }
              // JOIN por campo (nuevo método para numeroDocumento, etc.)
              else if (join.joinType === "field") {
                console.log(`[JOIN] Buscando en ${join.collection} donde ${join.foreignField} = ${localValue}`)
                const joinQuery = query(
                  collection(db, join.collection),
                  where(join.foreignField, "==", localValue),
                  limit(1)
                )
                const joinSnapshot = await getDocs(joinQuery)
                
                if (!joinSnapshot.empty) {
                  const joinDoc = joinSnapshot.docs[0]
                  joinedResult[`${join.collection}_data`] = {
                    id: joinDoc.id,
                    ...joinDoc.data()
                  }
                  console.log(`[JOIN] ✅ Encontrado ${join.collection} para ${join.foreignField}=${localValue}`)
                } else {
                  console.log(`[JOIN] ⚠️ No existe ${join.collection} con ${join.foreignField}=${localValue}`)
                }
              }
            } catch (e) {
              console.log(`[JOIN] ❌ Error: ${e}`)
            }
          }
          
          joinedResults.push(joinedResult)
        }
        
        results = joinedResults
        console.log("[JOIN] Completado. Resultados con datos:", 
          results.filter((r: any) => r.user_profiles_data).length
        )
      }
      
      return results
    }
    
    // Consulta normal
    let q = query(collectionRef)

    if (plan.filters && plan.filters.length > 0) {
      for (const filter of plan.filters) {
        let value = filter.value
        
        if (typeof value === "string" && ["today", "yesterday", "this_week", "last_week", "this_month", "last_month"].includes(value)) {
          value = Timestamp.fromDate(parseSpecialDateValue(value))
        }
        
        console.log(`[Chat] Filtro: ${filter.field} ${filter.operator} ${value}`)
        q = query(q, where(filter.field, filter.operator as any, value))
      }
    }

    if (plan.orderByField) {
      console.log(`[Chat] Orden: ${plan.orderByField} ${plan.orderDirection || "asc"}`)
      q = query(q, orderBy(plan.orderByField, plan.orderDirection || "asc"))
    }

    const limitCount = plan.limitCount || 100
    console.log(`[Chat] Límite: ${limitCount}`)
    q = query(q, limit(limitCount))

    console.log("[Chat] Ejecutando consulta...")
    const snapshot = await getDocs(q)
    console.log(`[Chat] Documentos obtenidos: ${snapshot.docs.length}`)
    
    let results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
    // Log de los primeros resultados para debugging
    if (results.length > 0) {
      console.log("[Chat] Primer resultado completo:", JSON.stringify(results[0], null, 2))
    }

    // Procesar joins
    if (plan.joins && plan.joins.length > 0) {
      console.log("[JOIN] Iniciando proceso...")
      const joinedResults: any[] = []
      
      for (const result of results) {
        const joinedResult: any = { ...result }
        
        for (const join of plan.joins) {
          let localValue = (result as any)[join.localField]
          
          if (localValue?.path) {
            localValue = localValue.id
          }
          
          if (!localValue) {
            console.log(`[JOIN] ⚠️ No hay valor en ${join.localField}`)
            continue
          }
          
          try {
            // JOIN por ID de documento (método anterior)
            if (!join.joinType || join.joinType === "id") {
              const docRef = doc(db, join.collection, localValue)
              const docSnap = await getDoc(docRef)
              
              if (docSnap.exists()) {
                joinedResult[`${join.collection}_data`] = {
                  id: docSnap.id,
                  ...docSnap.data()
                }
                console.log(`[JOIN] ✅ Encontrado ${join.collection} para ${localValue}`)
              } else {
                console.log(`[JOIN] ⚠️ No existe ${join.collection}/${localValue}`)
              }
            }
            // JOIN por campo (nuevo método para numeroDocumento, etc.)
            else if (join.joinType === "field") {
              console.log(`[JOIN] Buscando en ${join.collection} donde ${join.foreignField} = ${localValue}`)
              console.log(`[JOIN] Tipo de localValue:`, typeof localValue, localValue)
              
              const joinQuery = query(
                collection(db, join.collection),
                where(join.foreignField, "==", localValue),
                limit(1)
              )
              const joinSnapshot = await getDocs(joinQuery)
              
              console.log(`[JOIN] Resultados encontrados: ${joinSnapshot.size}`)
              
              if (!joinSnapshot.empty) {
                const joinDoc = joinSnapshot.docs[0]
                joinedResult[`${join.collection}_data`] = {
                  id: joinDoc.id,
                  ...joinDoc.data()
                }
                console.log(`[JOIN] ✅ Encontrado ${join.collection} para ${join.foreignField}=${localValue}`)
                console.log(`[JOIN] Datos:`, joinDoc.data())
              } else {
                console.log(`[JOIN] ⚠️ No existe ${join.collection} con ${join.foreignField}=${localValue}`)
                
                // Intentar buscar en toda la colección para ver qué valores existen
                const allDocsQuery = query(collection(db, join.collection), limit(5))
                const allDocsSnapshot = await getDocs(allDocsQuery)
                console.log(`[JOIN] Muestra de documentos en ${join.collection}:`)
                allDocsSnapshot.docs.forEach(doc => {
                  console.log(`  - ${doc.id}:`, doc.data()[join.foreignField])
                })
              }
            }
          } catch (e) {
            console.log(`[JOIN] ❌ Error: ${e}`)
          }
        }
        
        joinedResults.push(joinedResult)
      }
      
      results = joinedResults
      console.log("[JOIN] Completado. Resultados con datos:", 
        results.filter((r: any) => r.user_profiles_data).length
      )
    }

    return results
  } catch (error: any) {
    console.error("[Chat] Error ejecutando consulta:", error)
    throw new Error(`Error en consulta: ${error.message}`)
  }
}

async function generateNaturalResponse(question: string, results: any[], queryPlan: QueryPlan): Promise<string> {
  if (results.length === 0) {
    return "No se encontraron datos para esta consulta."
  }

  // Filtrar por programa académico si se menciona en la pregunta
  let filteredResults = results
  
  if (queryPlan.joins && queryPlan.joins.length > 0) {
    const questionLower = question.toLowerCase()
    
    const programas = [
      { keywords: ['comunicación social', 'comunicacion social'], name: 'COMUNICACIÓN SOCIAL' },
      { keywords: ['ingeniería de sistemas', 'ingenieria de sistemas', 'sistemas'], name: 'INGENIERÍA DE SISTEMAS' },
      { keywords: ['ingeniería civil', 'ingenieria civil', 'civil'], name: 'INGENIERÍA CIVIL' },
      { keywords: ['derecho'], name: 'DERECHO' },
      { keywords: ['medicina'], name: 'MEDICINA' },
    ]
    
    for (const programa of programas) {
      if (programa.keywords.some(keyword => questionLower.includes(keyword))) {
        filteredResults = results.filter((r: any) => {
          const userData = r.user_profiles_data
          if (userData && userData.programaAcademico) {
            return userData.programaAcademico.toUpperCase().includes(programa.name)
          }
          return false
        })
        break
      }
    }
    
    if (filteredResults.length === 0 && results.length > 0) {
      return `No se encontraron estudiantes del programa especificado. Se encontraron ${results.length} estudiantes en total.`
    }
  }

  if (filteredResults.length === 0) {
    return "No se encontraron datos que coincidan con los criterios."
  }

  // Preparar datos limpios
  const cleanResults = filteredResults.slice(0, 20).map((r: any) => {
    const clean: any = {}
    
    if (r.user_profiles_data) {
      clean.nombre = r.user_profiles_data.nombres || "Sin nombre"
      if (r.user_profiles_data.programaAcademico) clean.programa = r.user_profiles_data.programaAcademico
      if (r.user_profiles_data.facultad) clean.facultad = r.user_profiles_data.facultad
      if (r.user_profiles_data.estamento) clean.estamento = r.user_profiles_data.estamento
      if (r.user_profiles_data.rol) clean.rol = r.user_profiles_data.rol
    } else {
      if (r.nombres) clean.nombre = r.nombres
      if (r.programaAcademico) clean.programa = r.programaAcademico
      if (r.facultad) clean.facultad = r.facultad
      if (r.estamento) clean.estamento = r.estamento
      if (r.rol) clean.rol = r.rol
    }
    
    if (r.grupoCultural) clean.grupo = r.grupoCultural
    
    if (r.timestamp) {
      if (r.timestamp.seconds) {
        clean.fecha = new Date(r.timestamp.seconds * 1000).toLocaleDateString('es-CO')
      } else if (r.timestamp.toDate) {
        clean.fecha = r.timestamp.toDate().toLocaleDateString('es-CO')
      }
    }
    
    return clean
  })

  const hasNames = cleanResults.some(r => r.nombre && r.nombre !== "Sin nombre")
  
  if (!hasNames && queryPlan.joins) {
    return `Se encontraron ${filteredResults.length} registros, pero no se pudieron obtener los nombres.`
  }

  const prompt = `${NATURAL_TONE}

PREGUNTA: "${question}"
DATOS (${filteredResults.length} total):
${JSON.stringify(cleanResults, null, 2)}

GUÍA:
1. Saludo: "¡Listo!", "Te tengo"
2. Total: "Encontré X resultados"
3. Lista con ✅ o números
4. Cierre: "¿Necesitas algo más?"

EJEMPLOS:

"¿Cuántas asistencias hoy?"
→ "¡Listo! Hoy: 45 asistencias. ¡Excelente participación!"

"Top 5 grupos"
→ "¡Aquí va el top 5!
🥇 1. Salsa - 89
🥈 2. Danza - 67
🥉 3. Teatro - 54"

"Lista de monitores"
→ "¡Te encontré 4 monitores activos!
✅ 1. Juan Pérez - Salsa
✅ 2. María García - Danza"

Responde como Daniela:`

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      max_tokens: 800,
    })

    let response = completion.choices[0]?.message?.content || "No se pudo generar respuesta."
    
    response = response.replace(/\*\*/g, '')
    response = response.replace(/\*/g, '')
    response = response.replace(/#{1,6}\s/g, '')
    
    return response
  } catch (error: any) {
    console.error("[Chat] Error generando respuesta:", error)
    return `Se encontraron ${filteredResults.length} resultados.`
  }
}

export async function POST(req: NextRequest) {
  try {
    const { message, isSuperAdmin, conversationHistory = [] } = await req.json()

    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: "Acceso denegado. Solo Super Admin." },
        { status: 403 }
      )
    }

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Mensaje inválido" },
        { status: 400 }
      )
    }

    console.log("[Chat] Generando plan para:", message)
    const queryPlan = await generateQueryPlan(message, conversationHistory)
    console.log("[Chat] Plan generado:", JSON.stringify(queryPlan, null, 2))

    console.log("[Chat] Ejecutando consulta...")
    const results = await executeFirestoreQuery(queryPlan)
    console.log("[Chat] Resultados obtenidos:", results.length)
    
    if (results.length > 0) {
      console.log("[Chat] Primer resultado:", JSON.stringify(results[0], null, 2))
    }

    console.log("[Chat] Generando respuesta natural...")
    const response = await generateNaturalResponse(message, results, queryPlan)

    // Generar voz con ElevenLabs
    let audioBase64: string | null = null
    
    if (process.env.ELEVENLABS_API_KEY) {
      try {
        console.log("[Chat] Generando audio...")
        
        const audioStream = await elevenlabs.textToSpeech.convert("cgSgspJ2msm6clMCkdW9", {
          text: response,
          modelId: "eleven_multilingual_v2",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
          },
        })

        const chunks: Uint8Array[] = []
        const reader = audioStream.getReader()
        
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          if (value) chunks.push(value)
        }
        
        const audioBuffer = Buffer.concat(chunks)
        audioBase64 = audioBuffer.toString('base64')
        
        console.log("[Chat] Audio generado exitosamente")
      } catch (audioError: any) {
        console.error("[Chat] Error generando audio:", audioError)
      }
    }

    return NextResponse.json({
      success: true,
      response,
      audioBase64,
      resultsCount: results.length,
      queryPlan,
      rawResults: results.slice(0, 20),
      conversationHistory: [...conversationHistory.slice(-9), { user: message, ai: response }]
    })

  } catch (error: any) {
    console.error("[Chat] Error:", error)
    return NextResponse.json(
      { 
        error: "Error procesando la consulta", 
        details: error.message 
      },
      { status: 500 }
    )
  }
}

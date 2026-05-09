"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Trash2, Play, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { getFirestoreForArea } from "@/lib/firebase-config"
import { collection, addDoc, getDocs, query, where, serverTimestamp, Timestamp, writeBatch } from "firebase/firestore"

const TORNEOS_COL = "torneos"
const TORNEO_EQUIPOS_COL = "torneo_equipos"
const TORNEO_INSCRIPCIONES_COL = "torneo_inscripciones"
const TORNEO_GRUPOS_COL = "torneo_grupos"
const TORNEO_PARTIDOS_COL = "torneo_partidos"
const USERS_COLLECTION = "user_profiles"
const MOCK_TAG = "MOCK_PRUEBA_2024"

// 4 grupos × 4 equipos = 16 equipos
const EQUIPOS_MOCK = [
  // Grupo A
  "Águilas FC", "Tigres United", "Leones SC", "Panteras CF",
  // Grupo B
  "Cóndores AC", "Halcones FC", "Búhos SC", "Jaguares CF",
  // Grupo C
  "Lobos FC", "Osos United", "Zorros SC", "Pumas CF",
  // Grupo D
  "Delfines FC", "Tiburones SC", "Cobras United", "Dragones CF",
]

const CODIGOS_MOCK = [
  "aa11","bb22","cc33","dd44","ee55","ff66","gg77","hh88",
  "ii99","jj00","kk12","ll34","mm56","nn78","oo90","pp13",
]

// Nombres para generar 176 jugadores (16 equipos × 11)
const NOMBRES = [
  "Carlos","Ana","Luis","María","Pedro","Laura","Diego","Sofía","Andrés","Valentina","Sebastián",
  "Camila","Felipe","Isabella","Mateo","Daniela","Santiago","Gabriela","Nicolás","Alejandra","Julián",
  "Natalia","Esteban","Paola","Ricardo","Mónica","Hernán","Claudia","Mauricio","Patricia",
]
const APELLIDOS = [
  "Rodríguez","Martínez","García","López","Sánchez","Torres","Ramírez","Herrera","Vargas","Cruz",
  "Mora","Ríos","Peña","Castillo","Jiménez","Morales","Ortiz","Silva","Rojas","Mendoza",
]

function mockNombre(idx: number) {
  const n = NOMBRES[idx % NOMBRES.length]
  const a = APELLIDOS[Math.floor(idx / NOMBRES.length) % APELLIDOS.length]
  return `${n} ${a} Mock`
}

type LogLine = { type: "ok" | "err" | "info"; text: string }

export default function SeedPruebaPage() {
  const [logs, setLogs] = useState<LogLine[]>([])
  const [running, setRunning] = useState(false)
  const [torneoId, setTorneoId] = useState<string | null>(null)

  function log(type: LogLine["type"], text: string) {
    setLogs(prev => [...prev, { type, text }])
  }

  async function handleSeed() {
    setRunning(true)
    setLogs([])
    const db = getFirestoreForArea("deporte")

    try {
      log("info", "Creando torneo de prueba (4 grupos × 4 equipos × 11 jugadores)...")

      const torneoRef = await addDoc(collection(db, TORNEOS_COL), {
        nombre: "Torneo de Prueba",
        deporte: "futbol",
        tipo: "grupal",
        descripcion: "Torneo mock para pruebas del sistema",
        fechaInicio: Timestamp.fromDate(new Date()),
        fechaFin: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        lugar: "Cancha de Prueba",
        fase: "inscripcion",
        activo: true,
        equiposPorGrupo: 4,
        createdAt: serverTimestamp(),
        _mockTag: MOCK_TAG,
      })
      const tid = torneoRef.id
      setTorneoId(tid)
      log("ok", `Torneo creado: ${tid}`)

      // Crear 16 equipos
      log("info", "Creando 16 equipos...")
      const equipoIds: string[] = []
      for (let i = 0; i < EQUIPOS_MOCK.length; i++) {
        const eRef = await addDoc(collection(db, TORNEO_EQUIPOS_COL), {
          torneoId: tid,
          nombre: EQUIPOS_MOCK[i],
          codigo: CODIGOS_MOCK[i],
          createdAt: serverTimestamp(),
          _mockTag: MOCK_TAG,
        })
        equipoIds.push(eRef.id)
        log("ok", `  ${EQUIPOS_MOCK[i]} (código: ${CODIGOS_MOCK[i]})`)
      }

      // Crear 176 usuarios mock (11 por equipo) e inscribirlos
      log("info", "Creando 176 jugadores mock e inscribiéndolos...")
      let userIdx = 0
      for (let eq = 0; eq < equipoIds.length; eq++) {
        for (let j = 0; j < 11; j++) {
          const nombre = mockNombre(userIdx)
          const doc = `990${String(userIdx).padStart(5, "0")}`
          const uRef = await addDoc(collection(db, USERS_COLLECTION), {
            nombres: nombre,
            correo: `mock${userIdx}@test.com`,
            numeroDocumento: doc,
            genero: j % 3 === 0 ? "MUJER" : "HOMBRE",
            etnia: "MESTIZO",
            tipoDocumento: "CEDULA",
            edad: 20 + (j % 8),
            telefono: `300${String(userIdx).padStart(7, "0")}`,
            sede: "MELENDEZ",
            estamento: "ESTUDIANTE",
            area: "deporte",
            createdAt: serverTimestamp(),
            lastAttendance: serverTimestamp(),
            _mockTag: MOCK_TAG,
          })
          await addDoc(collection(db, TORNEO_INSCRIPCIONES_COL), {
            torneoId: tid,
            userId: uRef.id,
            equipoId: equipoIds[eq],
            fechaInscripcion: serverTimestamp(),
            _mockTag: MOCK_TAG,
          })
          userIdx++
        }
        log("ok", `  ${EQUIPOS_MOCK[eq]}: 11 jugadores inscritos`)
      }

      // Crear 4 grupos de 4 equipos
      log("info", "Creando 4 grupos...")
      const grupos = [
        { nombre: "Grupo A", equipos: equipoIds.slice(0, 4) },
        { nombre: "Grupo B", equipos: equipoIds.slice(4, 8) },
        { nombre: "Grupo C", equipos: equipoIds.slice(8, 12) },
        { nombre: "Grupo D", equipos: equipoIds.slice(12, 16) },
      ]
      for (const g of grupos) {
        await addDoc(collection(db, TORNEO_GRUPOS_COL), {
          torneoId: tid, nombre: g.nombre, equipos: g.equipos, _mockTag: MOCK_TAG,
        })
        log("ok", `  ${g.nombre}: ${g.equipos.map((_,i) => EQUIPOS_MOCK[grupos.indexOf(g)*4+i]).join(", ")}`)
      }

      log("ok", `✅ Seed completo — 16 equipos, 176 jugadores, 4 grupos`)
      log("info", `👉 Ve a /torneos/${tid} para probar`)
    } catch (e: any) {
      log("err", `Error: ${e.message}`)
    } finally {
      setRunning(false)
    }
  }

  async function handleCleanup() {
    if (!confirm("¿Borrar TODOS los datos mock (MOCK_PRUEBA_2024)?")) return
    setRunning(true)
    setLogs([])
    const db = getFirestoreForArea("deporte")
    const cols = [TORNEOS_COL, TORNEO_EQUIPOS_COL, TORNEO_INSCRIPCIONES_COL, TORNEO_GRUPOS_COL, TORNEO_PARTIDOS_COL, USERS_COLLECTION]
    try {
      for (const col of cols) {
        const q = query(collection(db, col), where("_mockTag", "==", MOCK_TAG))
        const snap = await getDocs(q)
        if (snap.empty) { log("info", `${col}: nada que borrar`); continue }
        // Borrar en lotes de 500
        for (let i = 0; i < snap.docs.length; i += 500) {
          const batch = writeBatch(db)
          snap.docs.slice(i, i + 500).forEach(d => batch.delete(d.ref))
          await batch.commit()
        }
        log("ok", `${col}: ${snap.size} documentos eliminados`)
      }
      log("ok", "✅ Limpieza completa")
      setTorneoId(null)
    } catch (e: any) {
      log("err", `Error: ${e.message}`)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/torneos"><Button variant="outline" size="sm">← Torneos</Button></Link>
          <div>
            <h1 className="text-xl font-bold">Seed — Torneo de Prueba</h1>
            <p className="text-sm text-gray-500">Datos mock para probar el sistema completo</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>¿Qué crea el seed?</CardTitle>
            <CardDescription>Todos los datos llevan <code className="bg-gray-100 px-1 rounded">_mockTag: MOCK_PRUEBA_2024</code> para borrarlos fácilmente.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 text-sm">
            <Badge variant="outline">1 torneo grupal fútbol</Badge>
            <Badge variant="outline">16 equipos</Badge>
            <Badge variant="outline">176 jugadores mock</Badge>
            <Badge variant="outline">176 inscripciones</Badge>
            <Badge variant="outline">4 grupos × 4 equipos</Badge>
            <Badge variant="outline">11 jugadores por equipo</Badge>
          </CardContent>
        </Card>

        <div className="flex gap-3 flex-wrap">
          <Button onClick={handleSeed} disabled={running} className="bg-orange-600 hover:bg-orange-700 gap-2">
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Crear datos mock
          </Button>
          <Button onClick={handleCleanup} disabled={running} variant="destructive" className="gap-2">
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Borrar todos los mocks
          </Button>
          {torneoId && (
            <Link href={`/torneos/${torneoId}`}>
              <Button variant="outline" className="gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />Ir al torneo
              </Button>
            </Link>
          )}
        </div>

        {logs.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Log</CardTitle></CardHeader>
            <CardContent>
              <div className="font-mono text-xs space-y-0.5 max-h-96 overflow-y-auto">
                {logs.map((l, i) => (
                  <div key={i} className={`flex items-start gap-2 ${l.type === "err" ? "text-red-600" : l.type === "ok" ? "text-green-700" : "text-gray-500"}`}>
                    {l.type === "ok" && <CheckCircle className="h-3 w-3 mt-0.5 shrink-0" />}
                    {l.type === "err" && <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />}
                    {l.type === "info" && <span className="w-3 shrink-0">›</span>}
                    <span>{l.text}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

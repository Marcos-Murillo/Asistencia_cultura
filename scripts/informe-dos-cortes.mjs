/**
 * Extrae datos reales de Firebase y calcula Corte 1 / Corte 2
 * para Asistencias (cultura+deporte) y Escenarios (gym_cdu).
 */
import { initializeApp } from "firebase/app"
import { getFirestore, collection, getDocs } from "firebase/firestore"
import { writeFileSync, mkdirSync } from "fs"
import { dirname } from "path"

const CULTURA = {
  apiKey: "AIzaSyAKX6N6CI-tHg5xp_mIxRmXVxNbHcqFP9U",
  authDomain: "cultuaraasistencia.firebaseapp.com",
  projectId: "cultuaraasistencia",
  storageBucket: "cultuaraasistencia.firebasestorage.app",
  messagingSenderId: "431009261783",
  appId: "1:431009261783:web:5f1d305ece22d74873a892",
  measurementId: "G-MF6JDY016S",
}

const DEPORTE = {
  apiKey: "AIzaSyBKUpAYXxRUWbMH0V_EwhdZYA8wjIa3vUU",
  authDomain: "estadisticas-8b8f6.firebaseapp.com",
  projectId: "estadisticas-8b8f6",
  storageBucket: "estadisticas-8b8f6.firebasestorage.app",
  messagingSenderId: "884583977038",
  appId: "1:884583977038:web:fd94bd6c39c58e5586b31f",
  measurementId: "G-65TX8XG9FP",
}

const ESCENARIOS = {
  apiKey: "AIzaSyCLgovaXfshvbwyGM-v970AkDiE73Vo0a4",
  authDomain: "espacioscdu.firebaseapp.com",
  projectId: "espacioscdu",
  storageBucket: "espacioscdu.firebasestorage.app",
  messagingSenderId: "547238322401",
  appId: "1:547238322401:web:75e6bb9d40cfba6efb97a0",
}

// Hoy (VM): 2026-11-11. Corte 2 teorico hasta 15 nov; usamos fecha disponible.
const TODAY = new Date("2026-11-11T23:59:59")
const CORTE1_END = new Date("2026-07-31T23:59:59.999")
const CORTE2_START = new Date("2026-08-01T00:00:00")
const CORTE2_END_NOMINAL = new Date("2026-11-15T23:59:59.999")
const CORTE2_END = TODAY < CORTE2_END_NOMINAL ? TODAY : CORTE2_END_NOMINAL

function toDate(value) {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value?.toDate === "function") return value.toDate()
  if (typeof value?.seconds === "number") return new Date(value.seconds * 1000)
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

function parseFechaYMD(fecha, hora) {
  if (!fecha || typeof fecha !== "string") return null
  const [y, m, d] = fecha.split("-").map(Number)
  if (!y || !m || !d) return null
  let hh = 0,
    mm = 0,
    ss = 0
  if (hora && typeof hora === "string") {
    const parts = hora.split(":").map(Number)
    hh = parts[0] || 0
    mm = parts[1] || 0
    ss = parts[2] || 0
  }
  return new Date(y, m - 1, d, hh, mm, ss)
}

function monthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function pctChange(c2, c1) {
  if (c1 === 0) {
    if (c2 === 0) return { pct: 0, label: "sin cambio (0→0)", direction: "igual" }
    return { pct: null, label: `n/a (0→${c2})`, direction: "aumento_desde_cero" }
  }
  const pct = ((c2 - c1) / c1) * 100
  const direction = pct > 0 ? "aumento" : pct < 0 ? "disminucion" : "igual"
  return { pct, label: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`, direction }
}

function bucketByCorte(dates) {
  const corte1 = []
  const corte2 = []
  const other = []
  for (const d of dates) {
    if (d <= CORTE1_END) corte1.push(d)
    else if (d >= CORTE2_START && d <= CORTE2_END) corte2.push(d)
    else other.push(d)
  }
  return { corte1, corte2, other }
}

function monthlyByGroup(records) {
  // records: { date: Date, group: string }[]
  const map = {}
  for (const r of records) {
    const mk = monthKey(r.date)
    if (!map[mk]) map[mk] = {}
    map[mk][r.group] = (map[mk][r.group] || 0) + 1
  }
  return map
}

function totalsByGroup(records) {
  const map = {}
  for (const r of records) {
    map[r.group] = (map[r.group] || 0) + 1
  }
  return map
}

async function loadAttendance(area, config) {
  const app = initializeApp(config, area)
  const db = getFirestore(app)
  const snap = await getDocs(collection(db, "attendance_records"))
  const records = []
  for (const doc of snap.docs) {
    const data = doc.data()
    const date = toDate(data.timestamp)
    if (!date) continue
    records.push({
      id: doc.id,
      date,
      group: data.grupoCultural || data.grupo || "Sin grupo",
      area,
    })
  }
  return records
}

async function loadEscenarios() {
  const app = initializeApp(ESCENARIOS, "escenarios")
  const db = getFirestore(app)

  const [entriesSnap, loansSnap, accessSnap] = await Promise.all([
    getDocs(collection(db, "entries")),
    getDocs(collection(db, "tableTennisLoans")),
    getDocs(collection(db, "tableTennisAccess")),
  ])

  const records = []

  for (const doc of entriesSnap.docs) {
    const data = doc.data()
    const date =
      parseFechaYMD(data.fecha, data.hora) ||
      toDate(data.timestamp) ||
      toDate(data.createdAt)
    if (!date) continue
    const instalacion = data.instalacion || "gimnasio"
    records.push({
      id: doc.id,
      date,
      group: instalacion === "piscina" ? "piscina" : "gimnasio",
      source: "entries",
      raw: { fecha: data.fecha, instalacion },
    })
  }

  for (const doc of loansSnap.docs) {
    const data = doc.data()
    const date =
      parseFechaYMD(data.fecha, data.horaInicio || data.hora) ||
      toDate(data.timestamp) ||
      toDate(data.createdAt)
    if (!date) continue
    records.push({
      id: doc.id,
      date,
      group: "tenis_mesa",
      source: "tableTennisLoans",
      raw: { fecha: data.fecha, estado: data.estado },
    })
  }

  for (const doc of accessSnap.docs) {
    const data = doc.data()
    const date =
      parseFechaYMD(data.fecha, data.hora) ||
      toDate(data.timestamp) ||
      toDate(data.createdAt)
    if (!date) continue
    records.push({
      id: doc.id,
      date,
      group: "tenis_mesa",
      source: "tableTennisAccess",
      raw: { fecha: data.fecha },
    })
  }

  return {
    records,
    counts: {
      entries: entriesSnap.size,
      loans: loansSnap.size,
      access: accessSnap.size,
    },
  }
}

function analyzePlatform(name, records) {
  if (records.length === 0) {
    return {
      name,
      total: 0,
      firstRecord: null,
      lastRecord: null,
      corte1: { total: 0, byGroup: {}, monthly: {} },
      corte2: { total: 0, byGroup: {}, monthly: {} },
      outside: 0,
      change: pctChange(0, 0),
      changeByGroup: {},
    }
  }

  const sorted = [...records].sort((a, b) => a.date - b.date)
  const first = sorted[0].date
  const last = sorted[sorted.length - 1].date

  // Corte 1: desde primer registro hasta 31 jul (solo los que caen en ese rango)
  // Si el primer registro es después del 31 jul, corte1 estaría vacío — still correct per brief.
  const c1 = records.filter((r) => r.date <= CORTE1_END)
  const c2 = records.filter((r) => r.date >= CORTE2_START && r.date <= CORTE2_END)
  const outside = records.length - c1.length - c2.length

  const changeByGroup = {}
  const groups = new Set([...c1, ...c2].map((r) => r.group))
  for (const g of groups) {
    const a = c1.filter((r) => r.group === g).length
    const b = c2.filter((r) => r.group === g).length
    changeByGroup[g] = { corte1: a, corte2: b, ...pctChange(b, a) }
  }

  return {
    name,
    total: records.length,
    firstRecord: first.toISOString(),
    lastRecord: last.toISOString(),
    corte1: {
      total: c1.length,
      from: first.toISOString(),
      to: CORTE1_END.toISOString(),
      byGroup: totalsByGroup(c1),
      monthly: monthlyByGroup(c1),
    },
    corte2: {
      total: c2.length,
      from: CORTE2_START.toISOString(),
      to: CORTE2_END.toISOString(),
      byGroup: totalsByGroup(c2),
      monthly: monthlyByGroup(c2),
    },
    outside,
    change: pctChange(c2.length, c1.length),
    changeByGroup,
  }
}

async function main() {
  console.log("Cargando asistencia cultura...")
  const cultura = await loadAttendance("cultura", CULTURA)
  console.log(`  cultura: ${cultura.length}`)

  console.log("Cargando asistencia deporte...")
  const deporte = await loadAttendance("deporte", DEPORTE)
  console.log(`  deporte: ${deporte.length}`)

  console.log("Cargando escenarios...")
  const esc = await loadEscenarios()
  console.log(`  entries=${esc.counts.entries} loans=${esc.counts.loans} access=${esc.counts.access}`)

  const asistenciasAll = [...cultura, ...deporte]
  const asistencias = analyzePlatform("asistencias", asistenciasAll)
  const asistenciasCultura = analyzePlatform("asistencias_cultura", cultura)
  const asistenciasDeporte = analyzePlatform("asistencias_deporte", deporte)
  const escenarios = analyzePlatform("escenarios", esc.records)

  // Tenis mesa anomaly check in corte 2
  const tenisC2 = esc.records.filter(
    (r) =>
      r.group === "tenis_mesa" &&
      r.date >= CORTE2_START &&
      r.date <= CORTE2_END,
  )

  const out = {
    generatedAt: new Date().toISOString(),
    note:
      "Corte 2 nominal: 2026-08-01 → 2026-11-15. Fecha de extracción: 2026-11-11; Corte 2 usa datos hasta 2026-11-11 inclusive.",
    cortes: {
      corte1_end: CORTE1_END.toISOString(),
      corte2_start: CORTE2_START.toISOString(),
      corte2_end_used: CORTE2_END.toISOString(),
      corte2_end_nominal: CORTE2_END_NOMINAL.toISOString(),
    },
    projects: {
      cultura: CULTURA.projectId,
      deporte: DEPORTE.projectId,
      escenarios: ESCENARIOS.projectId,
      collections: {
        asistencias: "attendance_records",
        escenarios_entries: "entries",
        tenis_loans: "tableTennisLoans",
        tenis_access: "tableTennisAccess",
      },
    },
    asistencias,
    asistenciasCultura,
    asistenciasDeporte,
    escenarios,
    tenisMesaCorte2: {
      expected: 0,
      actual: tenisC2.length,
      anomalous: tenisC2.length > 0,
      sample: tenisC2.slice(0, 10).map((r) => ({
        id: r.id,
        date: r.date.toISOString(),
        source: r.source,
      })),
    },
    rawCounts: {
      cultura: cultura.length,
      deporte: deporte.length,
      escenarios: esc.counts,
    },
  }

  const outPath =
    "/cursor/stores/self/internal/informe-plataformas/data-dos-cortes.json"
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, JSON.stringify(out, null, 2))
  console.log("Wrote", outPath)
  console.log(
    JSON.stringify(
      {
        asistencias: {
          c1: asistencias.corte1.total,
          c2: asistencias.corte2.total,
          change: asistencias.change,
        },
        escenarios: {
          c1: escenarios.corte1.total,
          c2: escenarios.corte2.total,
          change: escenarios.change,
        },
        tenisC2: tenisC2.length,
      },
      null,
      2,
    ),
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

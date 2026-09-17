/**
 * Cruza user_profiles de cultura y deporte por número de documento.
 * Solo lectura. No escribe en Firebase.
 *
 * Usage: npx tsx scripts/audit-participant-documents.ts
 */

import { config } from "dotenv"
import { resolve } from "path"
import { writeFileSync } from "fs"
import { collection, getDocs } from "firebase/firestore"

config({ path: resolve(process.cwd(), ".env.local") })

type RawUser = {
  id: string
  areaStored?: string
  nombres: string
  correo: string
  numeroDocumento: string
  documentoNorm: string
}

type Row = {
  bucket: string
  documento: string
  idCultura?: string
  idDeporte?: string
  correoCultura?: string
  correoDeporte?: string
  nombresCultura?: string
  nombresDeporte?: string
  motivo: string
}

async function main() {
  const { getFirestoreForArea } = await import("../lib/firebase-config")
  const { emailsMatch, namesMatch, normalizeDocumento } = await import("../lib/participant-identity")
  type Area = "cultura" | "deporte"

  async function loadUsers(area: Area): Promise<RawUser[]> {
    const db = getFirestoreForArea(area)
    const snap = await getDocs(collection(db, "user_profiles"))
    return snap.docs.map((d) => {
      const data = d.data()
      const numeroDocumento = String(data.numeroDocumento ?? "")
      return {
        id: d.id,
        areaStored: data.area,
        nombres: String(data.nombres ?? ""),
        correo: String(data.correo ?? ""),
        numeroDocumento,
        documentoNorm: normalizeDocumento(numeroDocumento),
      }
    })
  }

  function indexByDocumento(users: RawUser[]) {
    const map = new Map<string, RawUser[]>()
    const sinDocumento: RawUser[] = []
    for (const user of users) {
      if (!user.documentoNorm) {
        sinDocumento.push(user)
        continue
      }
      const list = map.get(user.documentoNorm) ?? []
      list.push(user)
      map.set(user.documentoNorm, list)
    }
    return { map, sinDocumento }
  }

  console.log("========== INVENTARIO DE DOCUMENTOS PARTICIPANTES ==========\n")
  const [culturaUsers, deporteUsers] = await Promise.all([loadUsers("cultura"), loadUsers("deporte")])
  console.log(`Cultura: ${culturaUsers.length} perfiles`)
  console.log(`Deporte: ${deporteUsers.length} perfiles\n`)

  const cultura = indexByDocumento(culturaUsers)
  const deporte = indexByDocumento(deporteUsers)
  const rows: Row[] = []

  for (const user of cultura.sinDocumento) {
    rows.push({
      bucket: "sin_documento",
      documento: "",
      idCultura: user.id,
      nombresCultura: user.nombres,
      correoCultura: user.correo,
      motivo: "Perfil de cultura sin número de documento",
    })
  }
  for (const user of deporte.sinDocumento) {
    rows.push({
      bucket: "sin_documento",
      documento: "",
      idDeporte: user.id,
      nombresDeporte: user.nombres,
      correoDeporte: user.correo,
      motivo: "Perfil de deporte sin número de documento",
    })
  }

  for (const [doc, list] of cultura.map) {
    if (list.length > 1) {
      rows.push({
        bucket: "dup_interna",
        documento: doc,
        idCultura: list.map((u) => u.id).join("|"),
        nombresCultura: list.map((u) => u.nombres).join(" | "),
        correoCultura: list.map((u) => u.correo).join(" | "),
        motivo: `Documento repetido ${list.length} veces en cultura`,
      })
    }
  }
  for (const [doc, list] of deporte.map) {
    if (list.length > 1) {
      rows.push({
        bucket: "dup_interna",
        documento: doc,
        idDeporte: list.map((u) => u.id).join("|"),
        nombresDeporte: list.map((u) => u.nombres).join(" | "),
        correoDeporte: list.map((u) => u.correo).join(" | "),
        motivo: `Documento repetido ${list.length} veces en deporte`,
      })
    }
  }

  const allDocs = new Set([...cultura.map.keys(), ...deporte.map.keys()])
  for (const doc of allDocs) {
    const cList = cultura.map.get(doc) ?? []
    const dList = deporte.map.get(doc) ?? []
    const c = cList[0]
    const d = dList[0]

    if (c && d) {
      const correoOk = emailsMatch(c.correo, d.correo)
      const nombreOk = namesMatch(c.nombres, d.nombres)
      if (correoOk) {
        rows.push({
          bucket: "match_ok",
          documento: doc,
          idCultura: c.id,
          idDeporte: d.id,
          correoCultura: c.correo,
          correoDeporte: d.correo,
          nombresCultura: c.nombres,
          nombresDeporte: d.nombres,
          motivo: nombreOk ? "Misma persona en ambas bases" : "Correo igual; nombre distinto (revisar)",
        })
      } else {
        rows.push({
          bucket: "match_conflicto",
          documento: doc,
          idCultura: c.id,
          idDeporte: d.id,
          correoCultura: c.correo,
          correoDeporte: d.correo,
          nombresCultura: c.nombres,
          nombresDeporte: d.nombres,
          motivo: "Mismo documento, correo distinto",
        })
      }
    } else if (c) {
      rows.push({
        bucket: "solo_cultura",
        documento: doc,
        idCultura: c.id,
        correoCultura: c.correo,
        nombresCultura: c.nombres,
        motivo: "Solo existe en cultura",
      })
    } else if (d) {
      rows.push({
        bucket: "solo_deporte",
        documento: doc,
        idDeporte: d.id,
        correoDeporte: d.correo,
        nombresDeporte: d.nombres,
        motivo: "Solo existe en deporte",
      })
    }
  }

  const counts = rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.bucket] = (acc[row.bucket] || 0) + 1
    return acc
  }, {})

  console.log("Resumen:")
  for (const bucket of ["match_ok", "match_conflicto", "solo_cultura", "solo_deporte", "dup_interna", "sin_documento"]) {
    console.log(`  ${bucket}: ${counts[bucket] || 0}`)
  }

  const conflictos = rows.filter((r) => r.bucket === "match_conflicto")
  if (conflictos.length) {
    console.log("\nConflictos (muestra):")
    conflictos.slice(0, 15).forEach((row) => {
      console.log(`  ${row.documento} | cultura: ${row.correoCultura} | deporte: ${row.correoDeporte}`)
    })
  }

  const outPath = resolve(process.cwd(), "scripts/audit-participant-documents.report.json")
  writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), counts, rows }, null, 2), "utf-8")
  console.log(`\nReporte escrito en ${outPath}`)
}

main().catch((error) => {
  console.error("Error en inventario:", error)
  process.exit(1)
})

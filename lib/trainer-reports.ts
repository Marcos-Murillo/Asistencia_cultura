import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  FieldPath,
  getDoc,
  getDocs,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore"
import { getFirestoreForArea, getImagesFirestore, type Area } from "./firebase-config"
import { imageToStoredText } from "./image-links"

const USERS_COLLECTION = "user_profiles"
const REPORTS_FIELD = "informesEntrenador"
const REPORT_FILES_COLLECTION = "report_files"
const REPORT_EVIDENCE_COLLECTION = "report_evidence"
const MAX_PDF_BYTES = 500 * 1024

export type ReportFileSlot = "asistencias" | "planificacion_general" | "planificacion_semanal" | "seguridad_social"

export interface TrainerReportData {
  numero: string
  fechaElaboracion: string
  mesCorrespondiente: string
  desde: string
  hasta: string
  nit: string
  nombres: string
  ordenContractual: string
  valorTotal: string
  objeto: string
  supervisor: string
  dependencia: string
  valorCuota: string
  deporte: string
  punto1: string
  punto2: string
  punto3: string
}

export interface TrainerReportSummary {
  periodKey: string
  desde: string
  hasta: string
  numero: string
  fechaElaboracion: string
  adjuntos: Partial<Record<ReportFileSlot, string>>
  puntos: [boolean, boolean, boolean]
  fotosPorPunto: [number, number, number]
}

export interface StoredReportEvidence {
  id: string
  punto: 1 | 2 | 3
  fecha: string
  titulo: string
  pieDeFoto: string
  image: string
}

export interface StoredReportFile {
  slot: ReportFileSlot
  fileName: string
  dataUrl: string
}

export function reportKey(area: Area, userId: string, monthKey: string, grupo: string) {
  return `${area}__${userId}__${monthKey}__${grupo.replace(/\//g, "-").trim()}`
}

function reportsMap(data: Record<string, unknown> | undefined) {
  const stored = data?.[REPORTS_FIELD]
  if (!stored || typeof stored !== "object") return {} as Record<string, Record<string, unknown>>
  return stored as Record<string, Record<string, unknown>>
}

export async function loadTrainerReport(
  area: Area,
  userId: string,
  monthKey: string,
  grupo: string
): Promise<TrainerReportData | null> {
  const snapshot = await getDoc(doc(getFirestoreForArea(area), USERS_COLLECTION, userId))
  const item = reportsMap(snapshot.data())[reportKey(area, userId, monthKey, grupo)]
  if (!item) return null
  return mapReport(item)
}

export async function loadLatestContract(
  area: Area,
  userId: string
): Promise<Partial<TrainerReportData> | null> {
  const snapshot = await getDoc(doc(getFirestoreForArea(area), USERS_COLLECTION, userId))
  const latest = Object.values(reportsMap(snapshot.data()))
    .map((item) => ({ monthKey: String(item.monthKey || ""), data: mapReport(item) }))
    .sort((a, b) => b.monthKey.localeCompare(a.monthKey))[0]
  return latest?.data ?? null
}

export function periodKeyFromRange(desde: string, hasta: string) {
  return `${desde}_${hasta}`
}

export async function listTrainerReportsForGroup(
  area: Area,
  userId: string,
  grupo: string
): Promise<TrainerReportSummary[]> {
  const snapshot = await getDoc(doc(getFirestoreForArea(area), USERS_COLLECTION, userId))
  const items: TrainerReportSummary[] = []
  for (const raw of Object.values(reportsMap(snapshot.data()))) {
    if (String(raw.grupoCultural || "") !== grupo) continue
    const data = mapReport(raw)
    const storedMonth = String(raw.monthKey || "")
    const desde = data.desde || (storedMonth.length === 7 ? `${storedMonth}-01` : "")
    const hasta = data.hasta || (storedMonth.length === 7 ? lastDayOfMonth(storedMonth) : "")
    const adjuntosRaw = raw.adjuntos
    const adjuntos =
      adjuntosRaw && typeof adjuntosRaw === "object"
        ? (adjuntosRaw as Partial<Record<ReportFileSlot, string>>)
        : {}
    const fotosRaw = Array.isArray(raw.fotosPorPunto) ? raw.fotosPorPunto : []
    items.push({
      periodKey: storedMonth || periodKeyFromRange(desde, hasta),
      desde,
      hasta,
      numero: data.numero,
      fechaElaboracion: data.fechaElaboracion,
      adjuntos,
      puntos: [Boolean(data.punto1.trim()), Boolean(data.punto2.trim()), Boolean(data.punto3.trim())],
      fotosPorPunto: [Number(fotosRaw[0] || 0), Number(fotosRaw[1] || 0), Number(fotosRaw[2] || 0)],
    })
  }
  return items.sort((a, b) => (b.hasta || b.desde).localeCompare(a.hasta || a.desde))
}

export async function saveTrainerReport(
  area: Area,
  userId: string,
  grupo: string,
  data: TrainerReportData,
  meta?: { adjuntos?: Partial<Record<ReportFileSlot, string>>; fotosPorPunto?: [number, number, number] }
) {
  const monthKey = data.desde && data.hasta ? periodKeyFromRange(data.desde, data.hasta) : ""
  const key = reportKey(area, userId, monthKey, grupo)
  await updateDoc(doc(getFirestoreForArea(area), USERS_COLLECTION, userId), new FieldPath(REPORTS_FIELD, key), {
    ...data,
    area,
    userId,
    grupoCultural: grupo,
    monthKey,
    reportKey: key,
    adjuntos: meta?.adjuntos || {},
    fotosPorPunto: meta?.fotosPorPunto || [0, 0, 0],
    updatedAt: Timestamp.fromDate(new Date()),
  })
}

export async function markReportFile(
  area: Area,
  userId: string,
  storageKey: string,
  slot: ReportFileSlot,
  fileName: string
) {
  await updateDoc(
    doc(getFirestoreForArea(area), USERS_COLLECTION, userId),
    new FieldPath(REPORTS_FIELD, storageKey, "adjuntos", slot),
    fileName
  )
}

export async function listReportEvidence(key: string): Promise<StoredReportEvidence[]> {
  const snapshot = await getDocs(
    query(collection(getImagesFirestore(), REPORT_EVIDENCE_COLLECTION), where("reportKey", "==", key))
  )
  return snapshot.docs
    .map((item) => {
      const data = item.data()
      const punto = Number(data.punto)
      return {
        id: item.id,
        punto: (punto === 2 || punto === 3 ? punto : 1) as 1 | 2 | 3,
        fecha: String(data.fecha || ""),
        titulo: String(data.titulo || ""),
        pieDeFoto: String(data.pieDeFoto || ""),
        image: String(data.image || ""),
      }
    })
    .sort((a, b) => a.punto - b.punto || a.fecha.localeCompare(b.fecha))
}

export async function replaceReportEvidence(
  key: string,
  area: Area,
  userId: string,
  grupo: string,
  items: StoredReportEvidence[]
) {
  const current = await listReportEvidence(key)
  await Promise.all(current.map((item) => deleteDoc(doc(getImagesFirestore(), REPORT_EVIDENCE_COLLECTION, item.id))))
  await Promise.all(
    items.map((item) =>
      addDoc(collection(getImagesFirestore(), REPORT_EVIDENCE_COLLECTION), {
        reportKey: key,
        area,
        userId,
        grupoCultural: grupo,
        userKey: `${area}__${userId}`,
        groupKey: `${area}__${grupo}`,
        punto: item.punto,
        fecha: item.fecha,
        titulo: item.titulo,
        pieDeFoto: item.pieDeFoto,
        imageKind: "texto",
        image: item.image,
        size: item.image.length,
        updatedAt: Timestamp.fromDate(new Date()),
      })
    )
  )
}

export async function fileToStoredText(file: File): Promise<string> {
  return imageToStoredText(file, file.type, file.size > 1_500_000 ? 640 : 720)
}

export async function listReportFiles(key: string): Promise<StoredReportFile[]> {
  const snapshot = await getDocs(
    query(collection(getImagesFirestore(), REPORT_FILES_COLLECTION), where("reportKey", "==", key))
  )
  return snapshot.docs.map((item) => {
    const data = item.data()
    return {
      slot: data.slot as ReportFileSlot,
      fileName: String(data.fileName || "archivo.pdf"),
      dataUrl: String(data.dataUrl || ""),
    }
  })
}

export async function saveReportPdf(key: string, slot: ReportFileSlot, fileName: string, dataUrl: string) {
  if (!dataUrl.startsWith("data:application/pdf")) {
    throw new Error("El archivo debe ser un PDF")
  }
  const bytes = Math.ceil((dataUrl.split(",")[1]?.length || 0) * 0.75)
  if (bytes > MAX_PDF_BYTES) {
    throw new Error("El PDF supera 500 KB. Comprime el archivo y vuelve a subirlo.")
  }
  await setDoc(doc(getImagesFirestore(), REPORT_FILES_COLLECTION, `${slot}__${key}`.slice(0, 700)), {
    reportKey: key,
    slot,
    fileName,
    dataUrl,
    imageKind: "texto",
    size: dataUrl.length,
    updatedAt: Timestamp.fromDate(new Date()),
  })
}

function lastDayOfMonth(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number)
  const lastDay = new Date(year, month, 0).getDate()
  return `${monthKey}-${String(lastDay).padStart(2, "0")}`
}

function mapReport(data: Record<string, unknown>): TrainerReportData {
  return {
    numero: String(data.numero || ""),
    fechaElaboracion: String(data.fechaElaboracion || ""),
    mesCorrespondiente: String(data.mesCorrespondiente || ""),
    desde: String(data.desde || ""),
    hasta: String(data.hasta || ""),
    nit: String(data.nit || ""),
    nombres: String(data.nombres || ""),
    ordenContractual: String(data.ordenContractual || ""),
    valorTotal: String(data.valorTotal || ""),
    objeto: String(data.objeto || ""),
    supervisor: String(data.supervisor || ""),
    dependencia: String(data.dependencia || ""),
    valorCuota: String(data.valorCuota || ""),
    deporte: String(data.deporte || ""),
    punto1: String(data.punto1 || ""),
    punto2: String(data.punto2 || ""),
    punto3: String(data.punto3 || ""),
  }
}

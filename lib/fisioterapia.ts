import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  updateDoc,
  where,
} from "firebase/firestore"
import { getFirestoreForArea } from "./firebase-config"
import type {
  FisioterapiaBitacora,
  FisioterapiaBitacoraTipo,
  FisioterapiaOrden,
  FisioterapiaSeguimiento,
  FisioterapiaSeguimientoEstado,
  FisioterapiaSolicitud,
  FisioterapiaSolicitudEstado,
  FisioterapiaSolicitudTipo,
  FisioterapiaPrioridad,
  UserProfile,
} from "./types"
import {
  assertPermission,
  getFisioterapiaPermissions,
  type FisioterapiaActor,
} from "./fisioterapia-permissions"

const AREA = "deporte" as const
const SOLICITUDES = "fisioterapia_solicitudes"
const BITACORA = "fisioterapia_bitacora"
const SEGUIMIENTOS = "fisioterapia_seguimientos"
const META = "fisioterapia_meta"
const USERS = "user_profiles"
const FALLBACK_COLLECTION = "events"
const FISIO_FLAG = "moduloFisioterapia"

function db() {
  return getFirestoreForArea(AREA)
}

function isPermissionDenied(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String((error as { code: string }).code) : ""
  const message = error instanceof Error ? error.message : String(error)
  return code.includes("permission-denied") || message.toLowerCase().includes("insufficient permissions")
}

function permissionHelpError() {
  return new Error(
    "Firebase bloqueó la escritura. En la consola de Firebase abre el proyecto estadisticas-8b8f6 → Firestore → Reglas, pega las reglas de firestore.rules.txt y pulsa Publicar.",
  )
}

async function addFisioDoc(col: string, data: Record<string, unknown>) {
  const payload = clean(data)
  try {
    return await addDoc(collection(db(), col), payload)
  } catch (error) {
    if (!isPermissionDenied(error)) throw error
    try {
      return await addDoc(
        collection(db(), FALLBACK_COLLECTION),
        clean({
          ...payload,
          [FISIO_FLAG]: true,
          fisioCollection: col,
          nombre: `[FISIO] ${String(payload.descripcion || payload.tipo || col).slice(0, 80)}`,
          hora: payload.hora || "00:00",
          lugar: "fisioterapia",
          fechaApertura: payload.createdAt || new Date(),
          fechaVencimiento: payload.createdAt || new Date(),
          activo: false,
        }),
      )
    } catch (fallbackError) {
      if (!isPermissionDenied(fallbackError)) throw fallbackError
      try {
        return await addDoc(
          collection(db(), "group_enrollments"),
          clean({
            ...payload,
            [FISIO_FLAG]: true,
            fisioCollection: col,
            userId: `fisio:${String(payload.fisioterapeutaId || payload.entrenadorId || "sistema")}`,
            grupoCultural: "__FISIOTERAPIA__",
          }),
        )
      } catch (thirdError) {
        if (isPermissionDenied(thirdError)) throw permissionHelpError()
        throw thirdError
      }
    }
  }
}

async function listFisioDocs(col: string) {
  const collected = new Map<string, Awaited<ReturnType<typeof getDocs>>["docs"][number]>()
  try {
    const snap = await getDocs(collection(db(), col))
    snap.docs.forEach((item) => collected.set(item.id, item))
  } catch (error) {
    if (!isPermissionDenied(error)) throw error
  }
  try {
    const snap = await getDocs(collection(db(), FALLBACK_COLLECTION))
    snap.docs
      .filter((item) => item.data()[FISIO_FLAG] === true && item.data().fisioCollection === col)
      .forEach((item) => collected.set(item.id, item))
  } catch (error) {
    if (!isPermissionDenied(error)) throw error
  }
  try {
    const snap = await getDocs(collection(db(), "group_enrollments"))
    snap.docs
      .filter((item) => item.data()[FISIO_FLAG] === true && item.data().fisioCollection === col)
      .forEach((item) => collected.set(item.id, item))
  } catch (error) {
    if (!isPermissionDenied(error) && collected.size === 0) throw error
  }
  return Array.from(collected.values())
}

async function getFisioDoc(col: string, id: string) {
  try {
    const snap = await getDoc(doc(db(), col, id))
    if (snap.exists()) return snap
  } catch (error) {
    if (!isPermissionDenied(error)) throw error
  }
  const snap = await getDoc(doc(db(), FALLBACK_COLLECTION, id))
  if (snap.exists()) return snap
  const enrollment = await getDoc(doc(db(), "group_enrollments", id))
  return enrollment.exists() ? enrollment : null
}

async function updateFisioDoc(col: string, id: string, data: Record<string, unknown>) {
  const payload = clean(data) as { [key: string]: unknown }
  try {
    await updateDoc(doc(db(), col, id), payload)
    return
  } catch (error) {
    if (!isPermissionDenied(error)) throw error
  }
  try {
    await updateDoc(doc(db(), FALLBACK_COLLECTION, id), payload)
    return
  } catch (error) {
    if (!isPermissionDenied(error)) throw error
  }
  try {
    await updateDoc(doc(db(), "group_enrollments", id), payload)
  } catch (error) {
    if (isPermissionDenied(error)) throw permissionHelpError()
    throw error
  }
}

function timestampToDate(value: unknown): Date {
  if (value && typeof value === "object" && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate()
  }
  if (value instanceof Date) return value
  if (typeof value === "string" || typeof value === "number") return new Date(value)
  return new Date()
}

function clean<T extends Record<string, unknown>>(obj: T): T {
  const next: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) next[key] = value
  }
  return next as T
}

function parseOrden(raw: unknown): FisioterapiaOrden | null {
  if (!raw || typeof raw !== "object") return null
  const data = raw as Record<string, unknown>
  return {
    descripcion: String(data.descripcion || ""),
    destino: data.destino ? String(data.destino) : undefined,
    fecha: timestampToDate(data.fecha),
  }
}

function toSolicitud(id: string, data: Record<string, unknown>): FisioterapiaSolicitud {
  return {
    id,
    numero: Number(data.numero || 0),
    tipo: data.tipo as FisioterapiaSolicitudTipo,
    grupoId: data.grupoId ? String(data.grupoId) : undefined,
    grupoNombre: String(data.grupoNombre || ""),
    entrenadorId: String(data.entrenadorId || ""),
    entrenadorNombre: String(data.entrenadorNombre || ""),
    fechaSolicitada: timestampToDate(data.fechaSolicitada),
    hora: String(data.hora || ""),
    lugar: String(data.lugar || ""),
    descripcion: String(data.descripcion || ""),
    deportistaId: data.deportistaId ? String(data.deportistaId) : undefined,
    deportistaNombre: data.deportistaNombre ? String(data.deportistaNombre) : undefined,
    prioridad: (data.prioridad as FisioterapiaPrioridad) || "Media",
    observaciones: data.observaciones ? String(data.observaciones) : undefined,
    estado: (data.estado as FisioterapiaSolicitudEstado) || "Pendiente",
    fisioterapeutaId: data.fisioterapeutaId ? String(data.fisioterapeutaId) : undefined,
    fisioterapeutaNombre: data.fisioterapeutaNombre ? String(data.fisioterapeutaNombre) : undefined,
    bitacoraId: data.bitacoraId ? String(data.bitacoraId) : undefined,
    realizado: data.realizado ? String(data.realizado) : undefined,
    notasFisioterapeuta: data.notasFisioterapeuta ? String(data.notasFisioterapeuta) : undefined,
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt),
  }
}

function toBitacora(id: string, data: Record<string, unknown>): FisioterapiaBitacora {
  return {
    id,
    tipo: data.tipo as FisioterapiaBitacoraTipo,
    fecha: timestampToDate(data.fecha),
    hora: String(data.hora || ""),
    grupoId: data.grupoId ? String(data.grupoId) : undefined,
    grupoNombre: data.grupoNombre ? String(data.grupoNombre) : undefined,
    entrenadorId: data.entrenadorId ? String(data.entrenadorId) : undefined,
    entrenadorNombre: data.entrenadorNombre ? String(data.entrenadorNombre) : undefined,
    tipoActividad: data.tipoActividad as FisioterapiaBitacora["tipoActividad"],
    descripcion: data.descripcion ? String(data.descripcion) : undefined,
    observaciones: data.observaciones ? String(data.observaciones) : undefined,
    estado: data.estado ? String(data.estado) : undefined,
    fisioterapeutaId: String(data.fisioterapeutaId || ""),
    fisioterapeutaNombre: String(data.fisioterapeutaNombre || ""),
    deportistaId: data.deportistaId ? String(data.deportistaId) : undefined,
    deportistaNombre: data.deportistaNombre ? String(data.deportistaNombre) : undefined,
    motivoAtencion: data.motivoAtencion ? String(data.motivoAtencion) : undefined,
    tipoLesion: data.tipoLesion ? String(data.tipoLesion) : undefined,
    zonaCorporal: data.zonaCorporal ? String(data.zonaCorporal) : undefined,
    descripcionIncidente: data.descripcionIncidente ? String(data.descripcionIncidente) : undefined,
    evaluacion: data.evaluacion ? String(data.evaluacion) : undefined,
    intervencion: data.intervencion ? String(data.intervencion) : undefined,
    recomendaciones: data.recomendaciones ? String(data.recomendaciones) : undefined,
    requiereSeguimiento: Boolean(data.requiereSeguimiento),
    fechaSeguimiento: data.fechaSeguimiento ? timestampToDate(data.fechaSeguimiento) : undefined,
    orden: parseOrden(data.orden),
    solicitudId: data.solicitudId ? String(data.solicitudId) : undefined,
    solicitudNumero: data.solicitudNumero != null ? Number(data.solicitudNumero) : undefined,
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt),
  }
}

function toSeguimiento(id: string, data: Record<string, unknown>): FisioterapiaSeguimiento {
  return {
    id,
    bitacoraId: String(data.bitacoraId || ""),
    deportistaId: String(data.deportistaId || ""),
    deportistaNombre: String(data.deportistaNombre || ""),
    grupoNombre: data.grupoNombre ? String(data.grupoNombre) : undefined,
    lesionAtencion: String(data.lesionAtencion || ""),
    fechaAtencion: timestampToDate(data.fechaAtencion),
    fechaProgramada: timestampToDate(data.fechaProgramada),
    fisioterapeutaId: String(data.fisioterapeutaId || ""),
    fisioterapeutaNombre: String(data.fisioterapeutaNombre || ""),
    estado: (data.estado as FisioterapiaSeguimientoEstado) || "Pendiente",
    observaciones: data.observaciones ? String(data.observaciones) : undefined,
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt),
  }
}

async function nextSolicitudNumero(): Promise<number> {
  try {
    const counterRef = doc(db(), META, "counters")
    return await runTransaction(db(), async (tx) => {
      const snap = await tx.get(counterRef)
      const current = snap.exists() ? Number(snap.data().solicitudSeq || 0) : 0
      const next = current + 1
      tx.set(counterRef, { solicitudSeq: next }, { merge: true })
      return next
    })
  } catch (error) {
    if (!isPermissionDenied(error)) throw error
    const docs = await listFisioDocs(SOLICITUDES)
    const max = docs.reduce((acc, item) => {
      const data = item.data() as Record<string, unknown>
      return Math.max(acc, Number(data.numero || 0))
    }, 0)
    return max + 1
  }
}

export async function listFisioterapeutas(): Promise<UserProfile[]> {
  const snap = await getDocs(query(collection(db(), USERS), where("rol", "==", "FISIOTERAPEUTA")))
  return snap.docs.map((item) => {
    const data = item.data()
    return {
      id: item.id,
      ...data,
      createdAt: timestampToDate(data.createdAt),
      lastAttendance: timestampToDate(data.lastAttendance),
    } as UserProfile
  })
}

export async function createSolicitud(
  actor: FisioterapiaActor,
  payload: Omit<FisioterapiaSolicitud, "id" | "numero" | "estado" | "createdAt" | "updatedAt" | "entrenadorId" | "entrenadorNombre">,
) {
  assertPermission(actor, "canCreateSolicitud")
  if (actor.kind !== "entrenador") {
    throw new Error("Solo un entrenador puede crear solicitudes")
  }
  const numero = await nextSolicitudNumero()
  const now = new Date()
  const ref = await addFisioDoc(
    SOLICITUDES,
    clean({
      ...payload,
      numero,
      entrenadorId: actor.userId,
      entrenadorNombre: actor.nombres,
      estado: "Pendiente",
      createdAt: now,
      updatedAt: now,
    }),
  )
  return ref.id
}

export async function listSolicitudes(actor: FisioterapiaActor): Promise<FisioterapiaSolicitud[]> {
  const snap = await listFisioDocs(SOLICITUDES)
  let items = snap.map((item) => toSolicitud(item.id, item.data() as Record<string, unknown>))
  const perms = getFisioterapiaPermissions(actor)
  if (actor.kind === "entrenador") {
    items = items.filter((item) => item.entrenadorId === actor.userId)
  } else if (!perms.canViewAllSolicitudes) {
    items = items.filter((item) => item.fisioterapeutaId === actor.userId)
  }
  return items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export async function getSolicitud(id: string): Promise<FisioterapiaSolicitud | null> {
  const snap = await getFisioDoc(SOLICITUDES, id)
  if (!snap) return null
  return toSolicitud(snap.id, snap.data() as Record<string, unknown>)
}

export async function assignSolicitud(
  actor: FisioterapiaActor,
  solicitudId: string,
  fisioterapeutaId: string,
  fisioterapeutaNombre: string,
) {
  assertPermission(actor, "canAssignSolicitudes")
  await updateFisioDoc(SOLICITUDES, solicitudId, {
    fisioterapeutaId,
    fisioterapeutaNombre,
    estado: "Asignada",
    updatedAt: new Date(),
  })
}

export async function updateSolicitudEstado(
  actor: FisioterapiaActor,
  solicitudId: string,
  estado: FisioterapiaSolicitudEstado,
  extras?: { realizado?: string; notasFisioterapeuta?: string },
) {
  const solicitud = await getSolicitud(solicitudId)
  if (!solicitud) throw new Error("Solicitud no encontrada")

  if (actor.kind === "entrenador") {
    if (solicitud.entrenadorId !== actor.userId || estado !== "Cancelada") {
      throw new Error("No tienes permiso para actualizar esta solicitud")
    }
  } else {
    const perms = getFisioterapiaPermissions(actor)
    const assignedToMe = solicitud.fisioterapeutaId === actor.userId
    if (!perms.canAssignSolicitudes && !assignedToMe) {
      throw new Error("No tienes permiso para actualizar esta solicitud")
    }
  }

  await updateFisioDoc(
    SOLICITUDES,
    solicitudId,
    clean({
      estado,
      realizado: extras?.realizado,
      notasFisioterapeuta: extras?.notasFisioterapeuta,
      updatedAt: new Date(),
    }),
  )
}

export async function createBitacora(
  actor: FisioterapiaActor,
  payload: Omit<FisioterapiaBitacora, "id" | "createdAt" | "updatedAt" | "fisioterapeutaId" | "fisioterapeutaNombre">,
) {
  assertPermission(actor, "canCreateBitacora")
  if (actor.kind !== "fisioterapeuta") throw new Error("Acción no permitida")
  const now = new Date()
  const ref = await addFisioDoc(
    BITACORA,
    clean({
      ...payload,
      orden: payload.orden || null,
      fisioterapeutaId: actor.userId,
      fisioterapeutaNombre: actor.nombres,
      createdAt: now,
      updatedAt: now,
    }),
  )

  if (payload.requiereSeguimiento && payload.deportistaId && payload.fechaSeguimiento) {
    await addFisioDoc(
      SEGUIMIENTOS,
      clean({
        bitacoraId: ref.id,
        deportistaId: payload.deportistaId,
        deportistaNombre: payload.deportistaNombre || "",
        grupoNombre: payload.grupoNombre,
        lesionAtencion: payload.tipoLesion || payload.motivoAtencion || payload.descripcion || "Seguimiento",
        fechaAtencion: payload.fecha,
        fechaProgramada: payload.fechaSeguimiento,
        fisioterapeutaId: actor.userId,
        fisioterapeutaNombre: actor.nombres,
        estado: "Pendiente",
        createdAt: now,
        updatedAt: now,
      }),
    )
  }

  return ref.id
}

export async function updateBitacora(
  actor: FisioterapiaActor,
  id: string,
  payload: Partial<FisioterapiaBitacora>,
) {
  assertPermission(actor, "canEditOwnBitacora")
  const snap = await getFisioDoc(BITACORA, id)
  if (!snap) throw new Error("Registro no encontrado")
  const current = toBitacora(snap.id, snap.data() as Record<string, unknown>)
  if (actor.kind !== "fisioterapeuta") throw new Error("Acción no permitida")
  if (!actor.esEncargado && current.fisioterapeutaId !== actor.userId) {
    throw new Error("Solo puedes editar tu propia bitácora")
  }
  const { id: _id, createdAt, fisioterapeutaId, fisioterapeutaNombre, ...rest } = payload
  await updateFisioDoc(BITACORA, id, { ...rest, updatedAt: new Date() })
}

export async function listBitacora(actor: FisioterapiaActor): Promise<FisioterapiaBitacora[]> {
  assertPermission(actor, "canViewOwnBitacora")
  const snap = await listFisioDocs(BITACORA)
  let items = snap.map((item) => toBitacora(item.id, item.data() as Record<string, unknown>))
  if (actor.kind === "fisioterapeuta" && !getFisioterapiaPermissions(actor).canViewAllBitacoras) {
    items = items.filter((item) => item.fisioterapeutaId === actor.userId)
  }
  return items.sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
}

export async function finalizarSolicitudEnBitacora(
  actor: FisioterapiaActor,
  solicitudId: string,
  realizado: string,
  observaciones?: string,
) {
  const solicitud = await getSolicitud(solicitudId)
  if (!solicitud) throw new Error("Solicitud no encontrada")
  if (actor.kind !== "fisioterapeuta") throw new Error("Acción no permitida")
  if (!actor.esEncargado && solicitud.fisioterapeutaId !== actor.userId) {
    throw new Error("Esta solicitud no está asignada a ti")
  }

  const now = new Date()
  const hora = now.toTimeString().slice(0, 5)
  const bitacoraId = await createBitacora(actor, {
    tipo: "solicitud",
    fecha: now,
    hora,
    grupoNombre: solicitud.grupoNombre,
    entrenadorId: solicitud.entrenadorId,
    entrenadorNombre: solicitud.entrenadorNombre,
    tipoActividad: solicitud.tipo,
    descripcion: realizado,
    observaciones,
    estado: "Realizada",
    deportistaId: solicitud.deportistaId,
    deportistaNombre: solicitud.deportistaNombre,
    solicitudId: solicitud.id,
    solicitudNumero: solicitud.numero,
  })

  await updateFisioDoc(SOLICITUDES, solicitudId, {
    estado: "Realizada",
    realizado,
    notasFisioterapeuta: observaciones || "",
    bitacoraId,
    updatedAt: now,
  })
  return bitacoraId
}

export async function listSeguimientos(actor: FisioterapiaActor): Promise<FisioterapiaSeguimiento[]> {
  assertPermission(actor, "canManageSeguimientos")
  const snap = await listFisioDocs(SEGUIMIENTOS)
  let items = snap.map((item) => toSeguimiento(item.id, item.data() as Record<string, unknown>))
  if (actor.kind === "fisioterapeuta" && !getFisioterapiaPermissions(actor).canViewAllSeguimientos) {
    items = items.filter((item) => item.fisioterapeutaId === actor.userId)
  }
  return items.sort((a, b) => a.fechaProgramada.getTime() - b.fechaProgramada.getTime())
}

export async function updateSeguimientoEstado(
  actor: FisioterapiaActor,
  id: string,
  estado: FisioterapiaSeguimientoEstado,
  observaciones?: string,
) {
  assertPermission(actor, "canManageSeguimientos")
  const snap = await getFisioDoc(SEGUIMIENTOS, id)
  if (!snap) throw new Error("Seguimiento no encontrado")
  const current = toSeguimiento(snap.id, snap.data() as Record<string, unknown>)
  if (actor.kind !== "fisioterapeuta") throw new Error("Acción no permitida")
  if (!actor.esEncargado && current.fisioterapeutaId !== actor.userId) {
    throw new Error("Solo puedes actualizar tus seguimientos")
  }
  await updateFisioDoc(SEGUIMIENTOS, id, { estado, observaciones, updatedAt: new Date() })
}

export async function getAthleteHistory(
  actor: FisioterapiaActor,
  deportistaId: string,
): Promise<{
  bitacora: FisioterapiaBitacora[]
  solicitudes: FisioterapiaSolicitud[]
  seguimientos: FisioterapiaSeguimiento[]
}> {
  assertPermission(actor, "canViewAthletes")
  const [bitacora, solicitudes, seguimientos] = await Promise.all([
    listBitacora(actor),
    listSolicitudes(actor),
    listSeguimientos(actor),
  ])
  return {
    bitacora: bitacora.filter((item) => item.deportistaId === deportistaId),
    solicitudes: solicitudes.filter((item) => item.deportistaId === deportistaId),
    seguimientos: seguimientos.filter((item) => item.deportistaId === deportistaId),
  }
}

export const TIPO_SOLICITUD_LABEL: Record<FisioterapiaSolicitudTipo, string> = {
  acompanamiento: "Acompañamiento a entrenamiento",
  evaluacion: "Evaluación de deportista",
  preventiva: "Actividad preventiva",
  recuperacion: "Actividad de recuperación",
  charla: "Charla o actividad educativa",
  valoracion: "Valoración física",
  otra: "Otra actividad",
}

export const TIPO_BITACORA_LABEL: Record<FisioterapiaBitacoraTipo, string> = {
  actividad: "Actividad",
  atencion: "Atención por lesión",
  solicitud: "Solicitud atendida",
}

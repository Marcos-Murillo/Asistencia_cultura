import {
  addDoc,
  collection,
  getDocs,
  limit,
  query,
  Timestamp,
  where,
} from "firebase/firestore"
import { getFirestoreForArea, type Area } from "./firebase-config"
import { getPrestamosDb } from "./prestamos-firebase"

export const ASISTENCIA_REGISTRO_URL = "https://asistencia-cdr.vercel.app/"

export const SEDES_PRESTAMO = ["melendez", "san_fernando"] as const
export type SedePrestamo = (typeof SEDES_PRESTAMO)[number]

export const SEDE_PRESTAMO_LABEL: Record<SedePrestamo, string> = {
  melendez: "Meléndez",
  san_fernando: "San Fernando",
}

const SEDE_ALIAS: Record<string, SedePrestamo> = {
  melendez: "melendez",
  meléndez: "melendez",
  "san fernando": "san_fernando",
  san_fernando: "san_fernando",
  sanfernando: "san_fernando",
}

export function resolveSedePrestamo(value?: string | null): SedePrestamo {
  const key = (value ?? "").trim().toLowerCase().replace(/\s+/g, " ")
  return SEDE_ALIAS[key] ?? SEDE_ALIAS[key.replace(/\s+/g, "_")] ?? "melendez"
}

export function requiereCartaMelendez(sede: SedePrestamo): boolean {
  return sede === "melendez"
}

export interface EscenarioPrestamo {
  id: string
  nombre: string
  tipo: string
  capacidad: number
  ubicacion: string
  estado: string
  horariosDisponibles: string[]
  cantidad: number
  sede: SedePrestamo
}

export interface ParticipantePrestamo {
  asistenciaUserId: string
  nombres: string
  correo: string
  numeroDocumento: string
  codigoEstudiantil?: string
  estamento?: string
  programaAcademico?: string
}

export interface ReservaPrestamo {
  id: string
  sede: SedePrestamo
  solicitanteNumeroDocumento: string
  usuarioNombre: string
  canchaNombre: string
  fecha: string
  horaInicio: string
  horaFin: string
  estado: "pendiente" | "aprobada" | "rechazada" | "cancelada" | "completada"
  motivoRechazo?: string
  unidadAsignada?: number
  cartaFirmada?: string
}

export interface UsuarioAsistenciaBusqueda {
  id: string
  nombres: string
  correo: string
  numeroDocumento: string
  codigoEstudiantil?: string
  estamento?: string
  facultad?: string
  programaAcademico?: string
  telefono?: string
}

const TIPOS: Record<string, string> = {
  futbol: "Fútbol",
  futbol_sala: "Fútbol sala",
  baloncesto: "Baloncesto",
  basquet: "Baloncesto",
  tenis: "Tenis",
  voleibol: "Voleibol",
  voley: "Voleibol",
}

export function labelTipoEscenario(tipo: string): string {
  return TIPOS[tipo] ?? tipo
}

function mapEscenario(id: string, data: Record<string, unknown>): EscenarioPrestamo {
  const horarios = Array.isArray(data.horariosDisponibles)
    ? data.horariosDisponibles.map((h) => String(h))
    : []
  return {
    id,
    nombre: String(data.nombre ?? ""),
    tipo: String(data.tipo ?? ""),
    capacidad: Number(data.capacidad ?? 0),
    ubicacion: String(data.ubicacion ?? ""),
    estado: String(data.estado ?? "disponible"),
    horariosDisponibles: horarios,
    cantidad: Number(data.cantidad ?? 1) || 1,
    sede: resolveSedePrestamo(String(data.sede ?? "")),
  }
}

function mapReserva(id: string, data: Record<string, unknown>): ReservaPrestamo {
  return {
    id,
    sede: resolveSedePrestamo(String(data.sede ?? "")),
    solicitanteNumeroDocumento: String(data.solicitanteNumeroDocumento ?? ""),
    usuarioNombre: String(data.usuarioNombre ?? ""),
    canchaNombre: String(data.canchaNombre ?? ""),
    fecha: String(data.fecha ?? ""),
    horaInicio: String(data.horaInicio ?? ""),
    horaFin: String(data.horaFin ?? ""),
    estado: (data.estado as ReservaPrestamo["estado"]) ?? "pendiente",
    motivoRechazo: data.motivoRechazo ? String(data.motivoRechazo) : undefined,
    unidadAsignada: data.unidadAsignada != null ? Number(data.unidadAsignada) : undefined,
    cartaFirmada: data.cartaFirmada ? String(data.cartaFirmada) : undefined,
  }
}

export async function listarEscenarios(): Promise<EscenarioPrestamo[]> {
  const db = getPrestamosDb()
  const snap = await getDocs(collection(db, "escenarios"))
  return snap.docs
    .map((d) => mapEscenario(d.id, d.data() as Record<string, unknown>))
    .filter((e) => e.estado === "disponible")
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
}

export async function listarReservasActivas(): Promise<
  { canchaId: string; fecha: string; horaInicio: string; unidadAsignada?: number; sede: string }[]
> {
  const db = getPrestamosDb()
  const snap = await getDocs(
    query(collection(db, "reservas"), where("estado", "in", ["pendiente", "aprobada"])),
  )
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      canchaId: String(data.canchaId ?? ""),
      fecha: String(data.fecha ?? ""),
      horaInicio: String(data.horaInicio ?? ""),
      unidadAsignada: data.unidadAsignada != null ? Number(data.unidadAsignada) : undefined,
      sede: String(data.sede ?? ""),
    }
  })
}

export async function listarReservasDeUsuario(numeroDocumento: string): Promise<ReservaPrestamo[]> {
  const documento = numeroDocumento.trim()
  if (!documento) return []
  const db = getPrestamosDb()
  const snap = await getDocs(
    query(collection(db, "reservas"), where("solicitanteNumeroDocumento", "==", documento)),
  )
  return snap.docs
    .map((d) => mapReserva(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
}

function mapUsuario(id: string, data: Record<string, unknown>): UsuarioAsistenciaBusqueda {
  return {
    id,
    nombres: String(data.nombres ?? ""),
    correo: String(data.correo ?? ""),
    numeroDocumento: String(data.numeroDocumento ?? ""),
    codigoEstudiantil: data.codigoEstudiantil ? String(data.codigoEstudiantil) : undefined,
    estamento: data.estamento ? String(data.estamento) : undefined,
    facultad: data.facultad ? String(data.facultad) : undefined,
    programaAcademico: data.programaAcademico ? String(data.programaAcademico) : undefined,
    telefono: data.telefono ? String(data.telefono) : undefined,
  }
}

async function buscarEnArea(area: Area, term: string): Promise<UsuarioAsistenciaBusqueda | null> {
  const db = getFirestoreForArea(area)
  const porDocumento = await getDocs(
    query(collection(db, "user_profiles"), where("numeroDocumento", "==", term), limit(1)),
  )
  if (!porDocumento.empty) {
    const docSnap = porDocumento.docs[0]
    return mapUsuario(docSnap.id, docSnap.data() as Record<string, unknown>)
  }
  const porCodigo = await getDocs(
    query(collection(db, "user_profiles"), where("codigoEstudiantil", "==", term), limit(1)),
  )
  if (!porCodigo.empty) {
    const docSnap = porCodigo.docs[0]
    return mapUsuario(docSnap.id, docSnap.data() as Record<string, unknown>)
  }
  return null
}

/** Busca en Deporte y luego en Cultura. No escribe nada en esas bases. */
export async function buscarUsuarioAsistencia(term: string): Promise<UsuarioAsistenciaBusqueda | null> {
  const value = term.trim()
  if (!value) return null
  const deporte = await buscarEnArea("deporte", value)
  if (deporte) return deporte
  return buscarEnArea("cultura", value)
}

export function calcularHoraFin(inicio: string): string {
  const [h, m] = inicio.split(":").map(Number)
  return `${String(h + 1).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

export async function crearReservaPrestamo(input: {
  sede: SedePrestamo
  solicitante: UsuarioAsistenciaBusqueda
  canchaId: string
  canchaNombre: string
  fecha: string
  horaInicio: string
  horaFin: string
  participantes: ParticipantePrestamo[]
  cartaFirmada?: string | null
}): Promise<string> {
  const db = getPrestamosDb()
  const solicitante = input.solicitante
  const payload: Record<string, unknown> = {
    sede: input.sede,
    origen: "asistencia",
    solicitanteGymUserId: solicitante.id,
    solicitanteNumeroDocumento: solicitante.numeroDocumento,
    usuarioId: solicitante.id,
    usuarioNombre: solicitante.nombres,
    usuarioEmail: solicitante.correo,
    canchaId: input.canchaId,
    canchaNombre: input.canchaNombre,
    fecha: input.fecha,
    horaInicio: input.horaInicio,
    horaFin: input.horaFin,
    estado: "pendiente",
    cartaFirmada: input.cartaFirmada ?? null,
    participantes: input.participantes.map((p) => ({
      ...p,
      gymUserId: p.asistenciaUserId,
    })),
    totalParticipantes: input.participantes.length + 1,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  }
  if (solicitante.codigoEstudiantil) payload.codigoEstudiantil = solicitante.codigoEstudiantil
  if (solicitante.programaAcademico) payload.programaAcademico = solicitante.programaAcademico
  if (solicitante.telefono) payload.telefono = solicitante.telefono
  if (solicitante.estamento) payload.estamento = solicitante.estamento

  const ref = await addDoc(collection(db, "reservas"), payload)
  return ref.id
}

import type { Area } from "./firebase-config"
import {
  findSimilarUsers,
  getUserByNumeroDocumento,
  saveUserProfile,
  updateUserCodigoEstudiantil,
} from "./db-router"
import type { SimilarUser, UserProfile } from "./types"

export class ParticipantIdentityError extends Error {
  constructor(
    message: string,
    public code: "NOT_FOUND" | "CONFLICT" | "EMAIL_MISMATCH" | "DUPLICATE",
  ) {
    super(message)
    this.name = "ParticipantIdentityError"
  }
}

export type PortalIdentity = {
  documento: string
  correo: string
  profile: UserProfile
  cultura?: UserProfile
  deporte?: UserProfile
}

export function normalizeDocumento(value?: string | null): string {
  return (value ?? "").replace(/\s+/g, "").trim()
}

export function normalizeEmail(value?: string | null): string {
  return (value ?? "").trim().toLowerCase()
}

export function normalizeName(value?: string | null): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ")
}

export function emailsMatch(a?: string | null, b?: string | null): boolean {
  const left = normalizeEmail(a)
  const right = normalizeEmail(b)
  return Boolean(left && right && left === right)
}

export function namesMatch(a?: string | null, b?: string | null): boolean {
  const left = normalizeName(a)
  const right = normalizeName(b)
  return Boolean(left && right && left === right)
}

function personalFieldsFromProfile(
  source: UserProfile,
  area: Area,
): Omit<UserProfile, "id" | "createdAt" | "lastAttendance"> {
  return {
    area,
    nombres: source.nombres,
    correo: source.correo,
    numeroDocumento: source.numeroDocumento,
    telefono: source.telefono,
    genero: source.genero,
    etnia: source.etnia,
    tipoDocumento: source.tipoDocumento,
    edad: source.edad,
    sede: source.sede,
    estamento: source.estamento,
    ...(source.codigoEstudiantil ? { codigoEstudiantil: source.codigoEstudiantil } : {}),
    ...(source.facultad ? { facultad: source.facultad } : {}),
    ...(source.programaAcademico ? { programaAcademico: source.programaAcademico } : {}),
  }
}

export function buildPortalIdentity(cultura?: UserProfile | null, deporte?: UserProfile | null): PortalIdentity | null {
  const profile = cultura ?? deporte ?? null
  if (!profile) return null
  return {
    documento: profile.numeroDocumento,
    correo: profile.correo,
    profile,
    cultura: cultura ?? undefined,
    deporte: deporte ?? undefined,
  }
}

export async function lookupParticipantByDocumento(numeroDocumento: string): Promise<
  | { status: "not_found" }
  | { status: "conflict"; cultura: UserProfile; deporte: UserProfile }
  | { status: "found"; identity: PortalIdentity }
> {
  const documento = numeroDocumento.trim()
  if (!documento) return { status: "not_found" }

  const [cultura, deporte] = await Promise.all([
    getUserByNumeroDocumento("cultura", documento),
    getUserByNumeroDocumento("deporte", documento),
  ])

  if (!cultura && !deporte) return { status: "not_found" }

  if (cultura && deporte && !emailsMatch(cultura.correo, deporte.correo)) {
    return { status: "conflict", cultura, deporte }
  }

  const identity = buildPortalIdentity(cultura, deporte)
  if (!identity) return { status: "not_found" }
  return { status: "found", identity }
}

export async function loginParticipant(numeroDocumento: string, correo: string): Promise<PortalIdentity> {
  const lookup = await lookupParticipantByDocumento(numeroDocumento)

  if (lookup.status === "not_found") {
    throw new ParticipantIdentityError(
      "No encontramos un usuario con ese número de documento. Si no tienes un usuario, selecciona “No tengo un usuario”.",
      "NOT_FOUND",
    )
  }

  if (lookup.status === "conflict") {
    throw new ParticipantIdentityError(
      "Este documento aparece en Cultura y en Deporte con correos distintos. Escribe a bienestar para unificar tu cuenta antes de ingresar.",
      "CONFLICT",
    )
  }

  if (!emailsMatch(lookup.identity.correo, correo)) {
    throw new ParticipantIdentityError(
      "El correo no coincide con el registrado para ese documento. Verifica e intenta nuevamente.",
      "EMAIL_MISMATCH",
    )
  }

  return lookup.identity
}

export async function findSimilarUsersBothAreas(
  nombres: string,
  correo: string,
  numeroDocumento: string,
  telefono: string,
): Promise<SimilarUser[]> {
  const [cultura, deporte] = await Promise.all([
    findSimilarUsers("cultura", nombres, correo, numeroDocumento, telefono),
    findSimilarUsers("deporte", nombres, correo, numeroDocumento, telefono),
  ])

  const merged = new Map<string, SimilarUser>()
  for (const item of [...cultura, ...deporte]) {
    const key = normalizeDocumento(item.user.numeroDocumento) || `${item.user.area}:${item.user.id}`
    const prev = merged.get(key)
    if (!prev || item.similarity > prev.similarity) {
      merged.set(key, item)
    }
  }

  return Array.from(merged.values()).sort((a, b) => b.similarity - a.similarity)
}

export async function identityFromUser(user: UserProfile): Promise<PortalIdentity> {
  const lookup = await lookupParticipantByDocumento(user.numeroDocumento)
  if (lookup.status === "conflict") {
    throw new ParticipantIdentityError(
      "Este documento aparece en Cultura y en Deporte con correos distintos. Escribe a bienestar para unificar tu cuenta.",
      "CONFLICT",
    )
  }
  if (lookup.status === "found") return lookup.identity
  const identity = buildPortalIdentity(user.area === "deporte" ? null : user, user.area === "deporte" ? user : null)
  if (!identity) {
    throw new ParticipantIdentityError("No se pudo armar el perfil del participante.", "NOT_FOUND")
  }
  return identity
}

export async function ensureUserInArea(targetArea: Area, source: UserProfile): Promise<UserProfile> {
  const lookup = await lookupParticipantByDocumento(source.numeroDocumento)
  if (lookup.status === "conflict") {
    throw new ParticipantIdentityError(
      "Este documento aparece en Cultura y en Deporte con correos distintos. No se puede inscribir hasta unificar la cuenta.",
      "CONFLICT",
    )
  }

  const existing = lookup.status === "found" ? lookup.identity[targetArea] : undefined
  if (existing) return existing

  const personal = personalFieldsFromProfile(source, targetArea)
  const id = await saveUserProfile(targetArea, personal)
  return {
    ...personal,
    id,
    createdAt: new Date(),
    lastAttendance: new Date(),
  }
}

export async function updateCodigoEstudiantilForIdentity(
  identity: PortalIdentity,
  codigoEstudiantil: string,
): Promise<PortalIdentity> {
  const tasks: Promise<void>[] = []
  if (identity.cultura) {
    tasks.push(updateUserCodigoEstudiantil("cultura", identity.cultura.id, codigoEstudiantil))
  }
  if (identity.deporte) {
    tasks.push(updateUserCodigoEstudiantil("deporte", identity.deporte.id, codigoEstudiantil))
  }
  await Promise.all(tasks)

  const codigo = codigoEstudiantil.replace(/\D/g, "").slice(0, 9)
  return {
    ...identity,
    profile: { ...identity.profile, codigoEstudiantil: codigo },
    cultura: identity.cultura ? { ...identity.cultura, codigoEstudiantil: codigo } : undefined,
    deporte: identity.deporte ? { ...identity.deporte, codigoEstudiantil: codigo } : undefined,
  }
}

export function mergeIdentityUser(identity: PortalIdentity, area: Area, user: UserProfile): PortalIdentity {
  const next: PortalIdentity = {
    ...identity,
    [area]: user,
    profile: identity.profile.id ? identity.profile : user,
  }
  if (area === "cultura") next.cultura = user
  if (area === "deporte") next.deporte = user
  next.profile = next.cultura ?? next.deporte ?? user
  next.documento = next.profile.numeroDocumento
  next.correo = next.profile.correo
  return next
}

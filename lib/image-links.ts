import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  Timestamp,
  where,
  type DocumentData,
} from "firebase/firestore"
import { getImagesFirestore, type Area } from "./firebase-config"
import type { ImageLink, ImagePurpose, ImageStorageKind } from "./types"

/** Un avatar por usuario. El documento guarda texto o un enlace, no el archivo original. */
export const USER_AVATARS_COLLECTION = "user_avatars"

/** Fotos que un encargado adjunta al registrar asistencia de un grupo. */
export const ATTENDANCE_IMAGES_COLLECTION = "attendance_images"

/** Tope del texto guardado en el documento para no acercarse al límite de 1 MB. */
const MAX_STORED_CHARS = 120_000
const AVATAR_MAX_EDGE = 256
const ATTENDANCE_MAX_EDGE = 720
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])

export type ImageInput =
  | { kind: "enlace"; url: string; fileName?: string }
  | { kind: "texto"; data: Blob; fileName?: string; contentType?: string }

export interface AttendanceImageTarget {
  /** Encargado que sube la foto (monitor, director o entrenador). */
  userId: string
  grupoCultural: string
  /** Se completa cuando la foto quede atada a un registro concreto de asistencia. */
  attendanceId?: string | null
}

interface PreparedImage {
  imageKind: ImageStorageKind
  image: string
  contentType: string
  size: number
  fileName: string
}

export function userImageKey(area: Area, userId: string): string {
  return `${area}__${requireSegment("userId", userId)}`
}

export function groupImageKey(area: Area, grupoCultural: string): string {
  return `${area}__${requireSegment("grupoCultural", grupoCultural)}`
}

export function avatarDocId(area: Area, userId: string): string {
  return `avatar__${userImageKey(area, userId)}`
}

export async function pingImagesDatabase(): Promise<{ projectId: string; reachable: boolean }> {
  const db = getImagesFirestore()
  await getDocs(query(collection(db, USER_AVATARS_COLLECTION), limit(1)))
  return {
    projectId: db.app.options.projectId ?? "",
    reachable: true,
  }
}

/** Escribe y borra un enlace corto para confirmar que Firestore acepta la imagen como texto. */
export async function verifyImagesWriteAccess(): Promise<void> {
  const db = getImagesFirestore()
  const checkRef = doc(db, "connection_checks", "ping")
  await setDoc(checkRef, {
    purpose: "healthcheck",
    imageKind: "enlace",
    image: "https://example.com/ping.png",
    checkedAt: Timestamp.fromDate(new Date()),
  })
  await deleteDoc(checkRef)
}

export async function getUserAvatar(area: Area, userId: string): Promise<ImageLink | null> {
  const db = getImagesFirestore()
  const snapshot = await getDoc(doc(db, USER_AVATARS_COLLECTION, avatarDocId(area, userId)))
  if (!snapshot.exists()) return null
  return mapImageLink(snapshot.id, snapshot.data())
}

export async function uploadUserAvatar(
  area: Area,
  userId: string,
  input: ImageInput
): Promise<ImageLink> {
  const safeUserId = requireSegment("userId", userId)
  const prepared = await prepareImage(input, AVATAR_MAX_EDGE)
  const previous = await getUserAvatar(area, safeUserId)
  const now = new Date()
  const link: ImageLink = {
    id: avatarDocId(area, safeUserId),
    purpose: "avatar",
    area,
    userId: safeUserId,
    grupoCultural: null,
    attendanceId: null,
    userKey: userImageKey(area, safeUserId),
    groupKey: null,
    ...prepared,
    createdAt: previous?.createdAt ?? now,
    updatedAt: now,
  }

  const { id: avatarId, ...avatarData } = link
  await setDoc(doc(getImagesFirestore(), USER_AVATARS_COLLECTION, avatarId), toFirestore(avatarData))
  return link
}

export async function deleteUserAvatar(area: Area, userId: string): Promise<void> {
  const current = await getUserAvatar(area, userId)
  if (!current) return
  await deleteDoc(doc(getImagesFirestore(), USER_AVATARS_COLLECTION, current.id))
}

export async function uploadAttendanceImage(
  area: Area,
  target: AttendanceImageTarget,
  input: ImageInput
): Promise<ImageLink> {
  const userId = requireSegment("userId", target.userId)
  const grupoCultural = requireSegment("grupoCultural", target.grupoCultural)
  const attendanceId = target.attendanceId?.trim() || null
  const prepared = await prepareImage(input, ATTENDANCE_MAX_EDGE)
  const now = new Date()
  const link: Omit<ImageLink, "id"> = {
    purpose: "asistencia" satisfies ImagePurpose,
    area,
    userId,
    grupoCultural,
    attendanceId,
    userKey: userImageKey(area, userId),
    groupKey: groupImageKey(area, grupoCultural),
    ...prepared,
    createdAt: now,
    updatedAt: now,
  }

  const created = await addDoc(
    collection(getImagesFirestore(), ATTENDANCE_IMAGES_COLLECTION),
    toFirestore(link)
  )
  return { id: created.id, ...link }
}

export async function getAttendanceImagesForGroup(
  area: Area,
  grupoCultural: string
): Promise<ImageLink[]> {
  const db = getImagesFirestore()
  const snapshot = await getDocs(
    query(
      collection(db, ATTENDANCE_IMAGES_COLLECTION),
      where("groupKey", "==", groupImageKey(area, grupoCultural))
    )
  )
  return snapshot.docs
    .map((item) => mapImageLink(item.id, item.data()))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export async function getImagesForUser(area: Area, userId: string): Promise<ImageLink[]> {
  const avatar = await getUserAvatar(area, userId)
  const db = getImagesFirestore()
  const snapshot = await getDocs(
    query(
      collection(db, ATTENDANCE_IMAGES_COLLECTION),
      where("userKey", "==", userImageKey(area, userId))
    )
  )
  const attendance = snapshot.docs.map((item) => mapImageLink(item.id, item.data()))
  return [...(avatar ? [avatar] : []), ...attendance].sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
  )
}

/** Convierte una foto a texto corto para guardarla en Firestore. */
export async function imageToStoredText(data: Blob, contentType?: string, maxEdge = 720): Promise<string> {
  const type = (contentType || data.type || "").toLowerCase()
  if (!ALLOWED_TYPES.has(type)) {
    throw new Error("La imagen debe ser JPG, PNG, WEBP o GIF")
  }
  if (data.size <= 0) {
    throw new Error("La imagen está vacía")
  }
  return compactImage(data, maxEdge)
}

async function prepareImage(input: ImageInput, maxEdge: number): Promise<PreparedImage> {
  if (input.kind === "enlace") {
    const image = normalizeLink(input.url)
    return {
      imageKind: "enlace",
      image,
      contentType: "text/uri-list",
      size: image.length,
      fileName: fileLabel(input.fileName, "enlace"),
    }
  }

  const contentType = (input.contentType || input.data.type || "").toLowerCase()
  if (!ALLOWED_TYPES.has(contentType)) {
    throw new Error("La imagen debe ser JPG, PNG, WEBP o GIF")
  }
  if (input.data.size <= 0) {
    throw new Error("La imagen está vacía")
  }

  const image = await compactImage(input.data, maxEdge)
  return {
    imageKind: "texto",
    image,
    contentType: image.startsWith("data:image/jpeg") ? "image/jpeg" : contentType,
    size: image.length,
    fileName: fileLabel(input.fileName, "imagen"),
  }
}

function normalizeLink(url: string): string {
  const trimmed = url?.trim()
  if (!trimmed || trimmed.length > 2000) {
    throw new Error("El enlace de la imagen no es válido")
  }
  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    throw new Error("El enlace de la imagen no es válido")
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("El enlace debe empezar por http o https")
  }
  return trimmed
}

async function compactImage(blob: Blob, maxEdge: number): Promise<string> {
  if (typeof document !== "undefined") {
    const resized = await resizeWithCanvas(blob, maxEdge)
    assertStoredSize(resized)
    return resized
  }

  const raw = await blobToDataUrl(blob)
  assertStoredSize(raw)
  return raw
}

function resizeWithCanvas(blob: Blob, maxEdge: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(blob)
    const image = new Image()
    image.onload = () => {
      const longest = Math.max(image.width, image.height) || 1
      const scale = Math.min(1, maxEdge / longest)
      const width = Math.max(1, Math.round(image.width * scale))
      const height = Math.max(1, Math.round(image.height * scale))
      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext("2d")
      URL.revokeObjectURL(objectUrl)
      if (!context) {
        reject(new Error("No se pudo preparar la imagen"))
        return
      }
      context.drawImage(image, 0, 0, width, height)
      let quality = 0.72
      let jpeg = canvas.toDataURL("image/jpeg", quality)
      while (jpeg.length > MAX_STORED_CHARS && quality > 0.45) {
        quality = Math.round((quality - 0.08) * 100) / 100
        jpeg = canvas.toDataURL("image/jpeg", quality)
      }
      resolve(jpeg)
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error("No se pudo leer la imagen"))
    }
    image.src = objectUrl
  })
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let binary = ""
  const chunk = 0x8000
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk))
  }
  const type = blob.type || "image/jpeg"
  return `data:${type};base64,${btoa(binary)}`
}

function assertStoredSize(image: string): void {
  if (image.length > MAX_STORED_CHARS) {
    throw new Error("La imagen ocupa demasiado. Elige una más pequeña o guarda solo un enlace.")
  }
}

function fileLabel(fileName: string | undefined, fallback: string): string {
  const cleaned = (fileName || fallback)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80)
  return cleaned || fallback
}

function requireSegment(label: string, value: string): string {
  const trimmed = value?.trim()
  if (!trimmed || trimmed.includes("/")) {
    throw new Error(`${label} no es válido para enlazar la imagen`)
  }
  return trimmed
}

function toFirestore(link: Omit<ImageLink, "id">): DocumentData {
  return {
    ...link,
    createdAt: Timestamp.fromDate(link.createdAt),
    updatedAt: Timestamp.fromDate(link.updatedAt),
  }
}

function mapImageLink(id: string, data: DocumentData): ImageLink {
  const legacyUrl = typeof data.downloadUrl === "string" ? data.downloadUrl : ""
  const image = String(data.image || legacyUrl || "")
  const imageKind: ImageStorageKind =
    data.imageKind === "texto" || data.imageKind === "enlace"
      ? data.imageKind
      : image.startsWith("data:")
        ? "texto"
        : "enlace"

  return {
    id,
    purpose: data.purpose === "asistencia" ? "asistencia" : "avatar",
    area: data.area === "deporte" ? "deporte" : "cultura",
    userId: String(data.userId ?? ""),
    grupoCultural: data.grupoCultural ? String(data.grupoCultural) : null,
    attendanceId: data.attendanceId ? String(data.attendanceId) : null,
    userKey: String(data.userKey ?? ""),
    groupKey: data.groupKey ? String(data.groupKey) : null,
    imageKind,
    image,
    contentType: String(data.contentType ?? ""),
    size: Number(data.size ?? image.length),
    fileName: String(data.fileName ?? ""),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  }
}

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate()
  if (value instanceof Date) return value
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }
  return new Date(0)
}

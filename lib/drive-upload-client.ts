import type { Area } from "./firebase-config"
import { isFileQuestionType, QUESTION_UPLOAD_LIMITS } from "./inscription-form"
import type { DriveFileLink, InscriptionQuestionType } from "./types"

const CHUNK_SIZE = 256 * 1024

export async function uploadInscriptionFile(params: {
  file: File
  area: Area
  eventId: string
  questionId: string
  questionType: InscriptionQuestionType
  userId: string
  userName: string
  userDocument?: string
  onProgress?: (percent: number) => void
}): Promise<DriveFileLink> {
  if (!isFileQuestionType(params.questionType)) {
    throw new Error("Tipo de archivo no válido")
  }

  const limits = QUESTION_UPLOAD_LIMITS[params.questionType]
  if (params.file.size > limits.maxBytes) {
    throw new Error(`El archivo supera el máximo permitido (${limits.label})`)
  }
  if (params.file.type && !limits.mime.includes(params.file.type)) {
    throw new Error(`Formato no permitido. Usa: ${limits.label}`)
  }

  const initResponse = await fetch("/api/drive/init", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      area: params.area,
      eventId: params.eventId,
      questionId: params.questionId,
      fileName: params.file.name,
      mimeType: params.file.type || limits.mime[0],
      size: params.file.size,
      userId: params.userId,
      userName: params.userName,
      userDocument: params.userDocument,
    }),
  })

  const initPayload = await initResponse.json().catch(() => ({}))
  if (!initResponse.ok) {
    throw new Error(initPayload.error || "No se pudo iniciar la subida")
  }

  const sessionUri = initPayload.sessionUri as string
  let uploaded = 0
  let fileId: string | null = null

  while (uploaded < params.file.size) {
    const end = Math.min(uploaded + CHUNK_SIZE, params.file.size)
    const chunk = params.file.slice(uploaded, end)
    const contentRange = `bytes ${uploaded}-${end - 1}/${params.file.size}`
    const chunkResponse = await fetch("/api/drive/chunk", {
      method: "PUT",
      headers: {
        "X-Session-Uri": sessionUri,
        "Content-Range": contentRange,
        "Content-Type": params.file.type || limits.mime[0],
      },
      body: chunk,
    })

    const chunkPayload = await chunkResponse.json().catch(() => ({}))
    if (!chunkResponse.ok) {
      throw new Error(chunkPayload.error || "Error subiendo el archivo a Drive")
    }

    uploaded = end
    params.onProgress?.(Math.round((uploaded / params.file.size) * 100))
    if (chunkPayload.fileId) {
      fileId = chunkPayload.fileId
    }
  }

  if (!fileId) {
    throw new Error("Drive no devolvió el identificador del archivo")
  }

  const completeResponse = await fetch("/api/drive/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileId }),
  })
  const completePayload = await completeResponse.json().catch(() => ({}))
  if (!completeResponse.ok) {
    throw new Error(completePayload.error || "No se pudo publicar el archivo")
  }

  return completePayload as DriveFileLink
}

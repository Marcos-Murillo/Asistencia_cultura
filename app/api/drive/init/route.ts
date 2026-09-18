import { NextResponse } from "next/server"
import { getFirestoreForArea, type Area } from "@/lib/firebase-config"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { FILE_QUESTION_TYPES, QUESTION_UPLOAD_LIMITS, sanitizeInscriptionForm } from "@/lib/inscription-form"
import { ensureEventAndUserFolders, safeDriveFileName, startResumableUpload } from "@/lib/google-drive"

export const runtime = "nodejs"

function isArea(value: unknown): value is Area {
  return value === "cultura" || value === "deporte"
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { area, eventId, questionId, fileName, mimeType, size, userId, userName, userDocument } = body as {
      area?: unknown
      eventId?: string
      questionId?: string
      fileName?: string
      mimeType?: string
      size?: number
      userId?: string
      userName?: string
      userDocument?: string
    }

    if (!isArea(area) || !eventId || !questionId || !fileName || typeof size !== "number" || !userId || !userName) {
      return NextResponse.json({ error: "Datos de subida incompletos" }, { status: 400 })
    }

    const db = getFirestoreForArea(area)
    const eventRef = doc(db, "events", eventId)
    const eventSnap = await getDoc(eventRef)
    if (!eventSnap.exists()) {
      return NextResponse.json({ error: "La convocatoria no existe" }, { status: 404 })
    }

    const eventData = eventSnap.data()
    const form = sanitizeInscriptionForm(eventData.inscriptionForm)
    const question = form.questions.find((item) => item.id === questionId)
    if (!form.enabled || !question || !FILE_QUESTION_TYPES.includes(question.type)) {
      return NextResponse.json({ error: "Esta pregunta no admite archivos" }, { status: 400 })
    }

    const type = question.type as "pdf" | "photo" | "video" | "audio"
    const limits = QUESTION_UPLOAD_LIMITS[type]
    if (size <= 0 || size > limits.maxBytes) {
      return NextResponse.json({ error: `El archivo supera el máximo (${limits.label})` }, { status: 400 })
    }

    const resolvedMime = String(mimeType || "")
    if (resolvedMime && !limits.mime.includes(resolvedMime)) {
      return NextResponse.json({ error: `Formato no permitido. ${limits.label}` }, { status: 400 })
    }

    const folders = await ensureEventAndUserFolders({
      eventId,
      eventName: String(eventData.nombre || "Convocatoria"),
      existingEventFolderId: eventData.driveFolderId,
      userId,
      userName,
      userDocument,
    })

    if (folders.eventFolderId && folders.eventFolderId !== eventData.driveFolderId) {
      await updateDoc(eventRef, { driveFolderId: folders.eventFolderId })
    }

    const sessionUri = await startResumableUpload({
      fileName: safeDriveFileName(fileName),
      mimeType: resolvedMime || limits.mime[0],
      size,
      parentFolderId: folders.userFolderId,
    })

    return NextResponse.json({ sessionUri })
  } catch (error) {
    console.error("[drive/init]", error)
    const message = error instanceof Error ? error.message : "No se pudo iniciar la subida"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

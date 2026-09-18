import { NextResponse } from "next/server"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { getFirestoreForArea, type Area } from "@/lib/firebase-config"
import { createDriveFolder, driveFolderExists, getDriveFolderId, renameDriveFolder, safeDriveFolderName } from "@/lib/google-drive"

export const runtime = "nodejs"

function isArea(value: unknown): value is Area {
  return value === "cultura" || value === "deporte"
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      area?: unknown
      eventId?: string
      eventName?: string
    }
    if (!isArea(body.area) || !body.eventId || !body.eventName?.trim()) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
    }

    const db = getFirestoreForArea(body.area)
    const eventRef = doc(db, "events", body.eventId)
    const eventSnap = await getDoc(eventRef)
    if (!eventSnap.exists()) {
      return NextResponse.json({ error: "La convocatoria no existe" }, { status: 404 })
    }

    const eventData = eventSnap.data()
    let folderId = String(eventData.driveFolderId || "")
    const folderName = safeDriveFolderName(body.eventName)

    if (folderId && (await driveFolderExists(folderId))) {
      await renameDriveFolder(folderId, folderName)
    } else {
      folderId = await createDriveFolder(getDriveFolderId(), folderName)
      await updateDoc(eventRef, { driveFolderId: folderId })
    }

    return NextResponse.json({ folderId })
  } catch (error) {
    console.error("[drive/ensure-event-folder]", error)
    const message = error instanceof Error ? error.message : "No se pudo crear la carpeta"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

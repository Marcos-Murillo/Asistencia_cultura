import { NextResponse } from "next/server"
import { publishDriveFile } from "@/lib/google-drive"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const { fileId } = (await request.json()) as { fileId?: string }
    if (!fileId || !/^[a-zA-Z0-9_-]+$/.test(fileId)) {
      return NextResponse.json({ error: "Archivo inválido" }, { status: 400 })
    }

    const published = await publishDriveFile(fileId)
    return NextResponse.json(published)
  } catch (error) {
    console.error("[drive/complete]", error)
    const message = error instanceof Error ? error.message : "No se pudo publicar el archivo"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { assertDriveSessionUri, proxyDriveChunk } from "@/lib/google-drive"

export const runtime = "nodejs"

export async function PUT(request: Request) {
  try {
    const sessionUri = request.headers.get("x-session-uri") || ""
    const contentRange = request.headers.get("content-range") || ""
    const contentType = request.headers.get("content-type") || "application/octet-stream"
    assertDriveSessionUri(sessionUri)

    if (!/^bytes \d+-\d+\/\d+$/.test(contentRange)) {
      return NextResponse.json({ error: "Rango de subida inválido" }, { status: 400 })
    }

    const buffer = Buffer.from(await request.arrayBuffer())
    if (buffer.length > 512 * 1024) {
      return NextResponse.json({ error: "El fragmento es demasiado grande" }, { status: 413 })
    }

    const driveResponse = await proxyDriveChunk({
      sessionUri,
      body: buffer,
      contentRange,
      contentType,
    })

    if (driveResponse.status === 308) {
      return NextResponse.json({ ok: true })
    }

    const payload = await driveResponse.json().catch(() => ({}))
    if (!driveResponse.ok) {
      return NextResponse.json(
        { error: payload.error?.message || "Error enviando el archivo a Drive" },
        { status: driveResponse.status },
      )
    }

    return NextResponse.json({ ok: true, fileId: payload.id })
  } catch (error) {
    console.error("[drive/chunk]", error)
    const message = error instanceof Error ? error.message : "Error en la subida"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

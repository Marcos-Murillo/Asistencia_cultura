import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_SIZE = 5 * 1024 * 1024

function prestamosBase() {
  return (process.env.PRESTAMOS_APP_URL || "http://localhost:3000").replace(/\/$/, "")
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file")
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 })
    }
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Solo se aceptan archivos PDF" }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "El archivo supera el límite de 5 MB" }, { status: 400 })
    }

    const outgoing = new FormData()
    outgoing.append("file", new Blob([await file.arrayBuffer()], { type: "application/pdf" }), file.name)

    const upstream = await fetch(`${prestamosBase()}/api/upload`, { method: "POST", body: outgoing })
    const data = await upstream.json().catch(() => ({}))
    if (!upstream.ok || !data?.url) {
      return NextResponse.json({
        uploaded: false,
        error: data?.error || "No se pudo guardar la carta en el Drive de Préstamos.",
      })
    }
    return NextResponse.json({ uploaded: true, url: data.url, fileId: data.fileId })
  } catch {
    return NextResponse.json({
      uploaded: false,
      error:
        "No hay conexión con la app de escenarios. Ábrela en http://localhost:3000 y conecta su Drive en /conectar-drive.",
    })
  }
}

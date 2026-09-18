import { NextResponse } from "next/server"
import { createDriveAuthUrl } from "@/lib/google-drive"

export const runtime = "nodejs"

export async function GET() {
  try {
    const url = createDriveAuthUrl()
    return NextResponse.redirect(url)
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo iniciar OAuth"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

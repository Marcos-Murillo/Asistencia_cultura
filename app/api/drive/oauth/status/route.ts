import { NextResponse } from "next/server"
import { isDriveOAuthReady } from "@/lib/google-drive"

export const runtime = "nodejs"

export async function GET() {
  return NextResponse.json({ ready: isDriveOAuthReady() })
}

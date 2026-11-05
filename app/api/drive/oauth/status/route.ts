import { NextResponse } from "next/server"
import { oauthDebugInfo, probeDriveAuth } from "@/lib/google-drive"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const reason = await probeDriveAuth()
  return NextResponse.json({ ready: reason === "ok", reason, ...oauthDebugInfo(request) })
}

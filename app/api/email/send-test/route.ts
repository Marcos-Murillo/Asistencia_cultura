import { NextRequest, NextResponse } from "next/server"
import { renderManagerAttendanceReportEmail } from "@/lib/email/render-attendance-report-email"
import { sendAttendanceReportEmail } from "@/lib/email/resend"

/**
 * Envío de prueba (solo desarrollo / con secreto).
 * POST { "to": "tu@correounivalle.edu.co", "periodo": "...", "secret": "..." }
 */
export async function POST(request: NextRequest) {
  const cronSecret = process.env.EMAIL_TEST_SECRET ?? process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json(
      { error: "EMAIL_TEST_SECRET o CRON_SECRET no configurado." },
      { status: 503 },
    )
  }

  let body: { to?: string; periodo?: string; secret?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  if (body.secret !== cronSecret) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const to = body.to?.trim()
  if (!to) {
    return NextResponse.json({ error: "Falta el campo to" }, { status: 400 })
  }

  const periodo = body.periodo?.trim() ?? "del 1 al 15 de junio de 2026 (prueba)"

  const html = await renderManagerAttendanceReportEmail({
    periodo,
    previewText: `Reporte de asistencias — ${periodo}`,
  })

  const result = await sendAttendanceReportEmail({
    to,
    subject: `[Prueba] Reporte de asistencias — ${periodo}`,
    html,
    idempotencyKey: `test/${to}/${periodo}`,
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 })
  }

  return NextResponse.json({ ok: true, id: result.data?.id })
}

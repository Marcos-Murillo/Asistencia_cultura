import { NextRequest, NextResponse } from "next/server"
import { renderManagerAttendanceReportEmail } from "@/lib/email/render-attendance-report-email"

/**
 * Vista previa HTML de la plantilla institucional.
 * GET /api/email/preview?periodo=del%201%20al%2015%20de%20junio%20de%202026
 */
export async function GET(request: NextRequest) {
  const periodo =
    request.nextUrl.searchParams.get("periodo") ??
    "del 1 al 15 de junio de 2026"

  const bodyHtml = request.nextUrl.searchParams.get("bodyHtml") ?? undefined

  const html = await renderManagerAttendanceReportEmail({
    periodo,
    bodyHtml,
    previewText: `Reporte de asistencias — ${periodo}`,
  })

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}

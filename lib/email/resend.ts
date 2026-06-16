import { Resend } from "resend"
import { EMAIL_FROM, EMAIL_REPLY_TO } from "@/lib/email/config"

let resendClient: Resend | null = null

export function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error("RESEND_API_KEY no está configurada en las variables de entorno.")
  }
  if (!resendClient) {
    resendClient = new Resend(apiKey)
  }
  return resendClient
}

export type SendAttendanceReportEmailInput = {
  to: string | string[]
  subject: string
  html: string
  idempotencyKey?: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
  }>
}

export async function sendAttendanceReportEmail(input: SendAttendanceReportEmailInput) {
  const resend = getResendClient()

  const { data, error } = await resend.emails.send(
    {
      from: EMAIL_FROM,
      replyTo: EMAIL_REPLY_TO,
      to: input.to,
      subject: input.subject,
      html: input.html,
      attachments: input.attachments,
      tags: [{ name: "tipo", value: "reporte-asistencias" }],
    },
    input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : undefined,
  )

  if (error) {
    return { ok: false as const, error }
  }

  return { ok: true as const, data }
}

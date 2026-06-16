/** Configuración de correos institucionales — Área de Cultura / CRD */

export const EMAIL_FROM =
  process.env.EMAIL_FROM ?? "Área de Cultura <areacultura.cdr@correounivalle.edu.co>"

export const EMAIL_REPLY_TO =
  process.env.EMAIL_REPLY_TO ?? "areacultura.cdr@correounivalle.edu.co"

/** URL pública base para imágenes en /public/email (producción o ngrok en local) */
export function getEmailAssetsBaseUrl(): string {
  const explicit = process.env.EMAIL_ASSETS_BASE_URL?.replace(/\/$/, "")
  if (explicit) return explicit

  const vercel = process.env.VERCEL_URL
  if (vercel) return `https://${vercel}`

  const app = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "")
  if (app) return app

  return "http://localhost:3000"
}

/** Ruta en /public/email del logo de cabecera (override con EMAIL_HEADER_IMAGE) */
export const EMAIL_HEADER_IMAGE_PATH =
  process.env.EMAIL_HEADER_IMAGE ?? "/email/header-vicerrectoria-cultura.png"

export function emailAsset(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`
  const encoded = normalized
    .split("/")
    .map((segment, index) => (index === 0 || !segment ? segment : encodeURIComponent(segment)))
    .join("/")
  return `${getEmailAssetsBaseUrl()}${encoded}`
}

import { NextResponse } from "next/server"
import { getOAuth2Client, saveRefreshToken } from "@/lib/google-drive"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const oauthError = url.searchParams.get("error")

  if (oauthError) {
    return htmlResponse(`Google denegó el acceso (${oauthError}).`, false)
  }
  if (!code) {
    return htmlResponse("Falta el código de autorización.", false)
  }

  try {
    const oauth = getOAuth2Client(`${url.origin}/api/drive/oauth/callback`)
    const { tokens } = await oauth.getToken(code)
    if (!tokens.refresh_token) {
      return htmlResponse(
        "Google no envió refresh token. Revoca el acceso de la app en tu cuenta de Google e intenta de nuevo con prompt=consent.",
        false,
      )
    }

    saveRefreshToken(tokens.refresh_token)
    return htmlResponse(
      `Drive quedó conectado con tu Gmail.<br/><br/>En el servidor local el token se guardó en el disco. En Vercel se pierde al reiniciar: copia esto en las variables de entorno como <code>GOOGLE_DRIVE_REFRESH_TOKEN</code> y vuelve a desplegar:<br/><textarea readonly style="width:100%;height:6rem;margin-top:0.75rem">${tokens.refresh_token}</textarea>`,
      true,
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error intercambiando el código"
    return htmlResponse(message, false)
  }
}

function htmlResponse(message: string, ok: boolean) {
  const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>Google Drive</title>
    <style>
      body { font-family: sans-serif; max-width: 40rem; margin: 4rem auto; padding: 0 1rem; }
      .ok { color: #166534; }
      .bad { color: #991b1b; }
    </style>
  </head>
  <body>
    <h1 class="${ok ? "ok" : "bad"}">${ok ? "Listo" : "No se pudo conectar"}</h1>
    <p>${message}</p>
    <p><a href="/conectar-drive">Volver</a></p>
  </body>
</html>`
  return new NextResponse(html, {
    status: ok ? 200 : 400,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}

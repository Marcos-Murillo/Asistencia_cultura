"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

type DriveStatus = "ok" | "missing" | "invalid"

export default function ConectarDrivePage() {
  const [status, setStatus] = useState<DriveStatus | null>(null)
  const [callbackUri, setCallbackUri] = useState("")
  const [clientId, setClientId] = useState("")
  const pageOrigin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"
  const redirectUri = callbackUri || `${pageOrigin}/api/drive/oauth/callback`

  useEffect(() => {
    fetch("/api/drive/oauth/status")
      .then((response) => response.json())
      .then((payload) => {
        if (payload.callbackUri) setCallbackUri(payload.callbackUri)
        if (payload.clientId) setClientId(payload.clientId)
        if (payload.reason === "ok" || payload.reason === "invalid" || payload.reason === "missing") {
          setStatus(payload.reason)
          return
        }
        setStatus(payload.ready ? "ok" : "missing")
      })
      .catch(() => setStatus("missing"))
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle>Conectar Google Drive</CardTitle>
          <CardDescription>
            La cuenta de servicio no tiene cuota en Drive personal. Hay que autorizar una vez con el Gmail dueño de la
            carpeta de inscripciones.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "ok" ? (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">Drive ya está conectado con OAuth.</AlertDescription>
            </Alert>
          ) : status === "invalid" ? (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertDescription className="text-amber-900">
                El permiso venció o fue revocado. Quítalo en tu cuenta de Google y pulsa Conectar de nuevo. En el
                cliente OAuth, la URI de redirección debe ser exactamente:
                <code className="mt-2 block break-all rounded bg-white p-2 text-xs">{redirectUri}</code>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <AlertDescription>
                En el cliente OAuth de tipo <strong>Aplicación web</strong> (no Escritorio), en
                <strong> URIs de redireccionamiento autorizados</strong>, pega exactamente esto y guarda:
                <code className="mt-2 block break-all rounded bg-white p-2 text-xs">{redirectUri}</code>
                También en <strong>Orígenes de JavaScript autorizados</strong>:
                <code className="mt-2 block break-all rounded bg-white p-2 text-xs">
                  {typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}
                </code>
                Espera 1–2 minutos, reinicia el servidor y vuelve a conectar.
              </AlertDescription>
            </Alert>
          )}

          <p className="text-xs text-slate-600">
            Esta URI tiene que estar en el cliente OAuth de Google, sin barra al final:
            <code className="mt-1 block break-all rounded bg-slate-100 p-2">{redirectUri}</code>
            {clientId ? (
              <>
                Cliente:
                <code className="mt-1 block break-all rounded bg-slate-100 p-2">{clientId}</code>
              </>
            ) : null}
          </p>

          <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700">
            <li>Usa la misma cuenta de Google que creó la carpeta de inscripciones.</li>
            <li>Acepta el permiso de Drive.</li>
            <li>Vuelve a inscribirte con un PDF o una foto de prueba.</li>
          </ol>

          <Button asChild>
            <a href="/api/drive/oauth/start">Conectar con Google</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

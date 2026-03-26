"use client"

import { Suspense, useEffect } from "react"
import { useSearchParams } from "next/navigation"

// The actual auth work is done server-side by GET /api/auth/sso
// This page just forwards the browser there immediately
function SSOContent() {
  const params = useSearchParams()

  useEffect(() => {
    const token = params.get("token")
    const redirect = params.get("redirect") ?? "/usuarios"

    if (!token) {
      window.location.href = process.env.NEXT_PUBLIC_CDR_URL ?? "/"
      return
    }

    // Forward to the API route as a GET — it sets the cookie AND redirects in one shot
    window.location.href = `/api/auth/sso?token=${encodeURIComponent(token)}&redirect=${encodeURIComponent(redirect)}`
  }, [params])

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#6b7280", fontSize: 15 }}>Autenticando...</p>
    </div>
  )
}

export default function SSOPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#6b7280", fontSize: 15 }}>Cargando...</p>
      </div>
    }>
      <SSOContent />
    </Suspense>
  )
}

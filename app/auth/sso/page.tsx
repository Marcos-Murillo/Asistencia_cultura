"use client"

import { Suspense } from "react"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

function SSOContent() {
  const router = useRouter()
  const params = useSearchParams()
  const [error, setError] = useState("")

  useEffect(() => {
    const token = params.get("token")
    const redirect = params.get("redirect") ?? "/usuarios"

    if (!token) {
      setError("Token no proporcionado.")
      return
    }

    fetch("/api/auth/sso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) {
          setError(data.error ?? "Error al autenticar.")
          return
        }

        const role: string = data.role
        const area: string = data.area

        if (role === "SUPER_ADMIN") {
          sessionStorage.setItem("userType", "superadmin")
          sessionStorage.setItem("isSuperAdmin", "true")
          sessionStorage.setItem("isAdmin", "true")
        } else {
          sessionStorage.setItem("userType", "admin")
          sessionStorage.setItem("isSuperAdmin", "false")
          sessionStorage.setItem("isAdmin", "true")
          sessionStorage.setItem("userRole", "ADMIN")
          sessionStorage.setItem("adminArea", area)
          localStorage.setItem("selectedArea", area)
          window.dispatchEvent(new CustomEvent("areaChanged", { detail: { area } }))
        }

        router.replace(redirect)
      })
      .catch(() => setError("Error de conexión."))
  }, [params, router])

  if (error) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
        <p style={{ color: "#dc2626", fontSize: 16 }}>{error}</p>
        <a href={process.env.NEXT_PUBLIC_CDR_URL ?? "/"} style={{ color: "#6366f1", textDecoration: "underline" }}>
          Volver a CDR
        </a>
      </div>
    )
  }

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

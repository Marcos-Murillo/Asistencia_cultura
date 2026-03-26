"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

function SSOHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState("")

  useEffect(() => {
    const token = searchParams.get("token")
    if (!token) { setError("Token no proporcionado."); return }

    fetch("/api/auth/verify-sso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return }

        const { role, area, nombre, uid } = data

        // Sync sessionStorage so existing pages work without changes
        if (role === "SUPER_ADMIN") {
          sessionStorage.setItem("userType", "superadmin")
          sessionStorage.setItem("isSuperAdmin", "true")
          sessionStorage.setItem("isAdmin", "true")
          sessionStorage.setItem("userId", uid ?? "")
          sessionStorage.setItem("userName", nombre ?? "")
        } else {
          sessionStorage.setItem("userType", "admin")
          sessionStorage.setItem("isSuperAdmin", "false")
          sessionStorage.setItem("isAdmin", "true")
          sessionStorage.setItem("userRole", "ADMIN")
          sessionStorage.setItem("adminArea", area)
          sessionStorage.setItem("userId", uid ?? "")
          sessionStorage.setItem("userName", nombre ?? "")
          localStorage.setItem("selectedArea", area)
          window.dispatchEvent(new CustomEvent("areaChanged", { detail: { area } }))
        }

        // Route by role — ignore redirect param, always go to the correct page
        const destination = role === "SUPER_ADMIN" ? "/super-admin" : "/usuarios"
        router.replace(destination)
      })
      .catch(() => setError("Error al verificar el acceso."))
  }, [searchParams, router])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <p className="text-red-600 text-sm">{error}</p>
        <a
          href="https://cdr-landing-ruddy.vercel.app"
          className="text-sm underline text-gray-500"
        >
          Volver a CDR
        </a>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500 text-sm">Iniciando sesión...</p>
    </div>
  )
}

export default function SSOPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500 text-sm">Cargando...</p>
      </div>
    }>
      <SSOHandler />
    </Suspense>
  )
}

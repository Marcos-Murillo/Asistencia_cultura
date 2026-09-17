"use client"

import { useEffect, useState, type ReactNode } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

const tabs = [
  { href: "/resumen-fisioterapia", label: "Actividades" },
  { href: "/resumen-fisioterapia/deportistas", label: "Deportistas atendidos" },
  { href: "/resumen-fisioterapia/estadisticas", label: "Estadísticas" },
]

function usePlatformAdminGate() {
  const router = useRouter()
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    const userType = sessionStorage.getItem("userType")
    const isAdmin = sessionStorage.getItem("isAdmin") === "true"
    const isSuperAdmin = sessionStorage.getItem("isSuperAdmin") === "true"
    if ((userType === "admin" && isAdmin) || (userType === "superadmin" && isSuperAdmin) || isAdmin || isSuperAdmin) {
      setAllowed(true)
      return
    }
    router.replace("/login-admin")
  }, [router])

  return allowed
}

export default function ResumenFisioterapiaLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const allowed = usePlatformAdminGate()

  if (!allowed) {
    return <p className="p-6 text-sm text-gray-500">Verificando acceso...</p>
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Fisioterapia</h1>
        <p className="text-sm text-gray-500">Resumen de registros clínicos del área de deporte.</p>
      </div>
      <div className="flex flex-wrap gap-2 border-b pb-3">
        {tabs.map((tab) => {
          const active = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium",
                active ? "bg-teal-800 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200",
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
      {children}
    </div>
  )
}

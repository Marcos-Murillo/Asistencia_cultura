"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { BarChart3, FileText, Home } from "lucide-react"

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-900">Sistema Cultural UV</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Link href="/">
              <Button variant={pathname === "/" ? "default" : "ghost"} size="sm" className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                Registro
              </Button>
            </Link>
            <Link href="/estadisticas">
              <Button
                variant={pathname === "/estadisticas" ? "default" : "ghost"}
                size="sm"
                className="flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                Estadísticas
              </Button>
            </Link>
            <Link href="/graficas">
              <Button
                variant={pathname === "/graficas" ? "default" : "ghost"}
                size="sm"
                className="flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Gráficas
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { BarChart3, FileText, Home, Users, Calendar } from "lucide-react"

export function Navigation() {
  const pathname = usePathname()
  const isRegistrationPage = pathname === "/"

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-900">Sistema Cultural UV</h1>
          </div>
          <div className="flex items-center space-x-2">
            {!isRegistrationPage && (
              <>
                <Link href="/">
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
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
                <Link href="/eventos">
                  <Button
                    variant={pathname === "/eventos" || pathname === "/eventos/estadisticas" ? "default" : "ghost"}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    Eventos
                  </Button>
                </Link>
                <Link href="/usuarios">
                  <Button
                    variant={pathname === "/usuarios" ? "default" : "ghost"}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    Usuarios
                  </Button>
                </Link>
                <Link href="/grupos">
                  <Button
                    variant={pathname === "/grupos" ? "default" : "ghost"}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    Grupos
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

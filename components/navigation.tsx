"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart3, FileText, Home, Users, Calendar, UsersRound, Megaphone, Shield } from "lucide-react"

export function Navigation() {
  const pathname = usePathname()
  const isRegistrationPage = pathname === "/"
  const isConvocatoriasPage = pathname === "/convocatorias"
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Verificar si el usuario es super admin
    const userType = sessionStorage.getItem("userType")
    setIsSuperAdmin(userType === "superadmin")
  }, [])

  // No renderizar el badge hasta que el componente esté montado
  if (!mounted) {
    return (
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">Sistema Cultural UV</h1>
            </div>
            <div className="flex items-center space-x-2">
              {!isRegistrationPage && !isConvocatoriasPage && (
                <>
                  <Link href="/">
                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                      <Home className="w-4 h-4" />
                      Asistencia
                    </Button>
                  </Link>
                  <Link href="/convocatorias">
                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                      <Megaphone className="w-4 h-4" />
                      Convocatorias
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
                  <Link href="/grupos">
                    <Button
                      variant={pathname.startsWith("/grupos") ? "default" : "ghost"}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <UsersRound className="w-4 h-4" />
                      Grupos
                    </Button>
                  </Link>
                  <Link href="/eventos">
                    <Button
                      variant={pathname.startsWith("/eventos") ? "default" : "ghost"}
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
                </>
              )}
              {(isRegistrationPage || isConvocatoriasPage) && (
                <div className="flex items-center gap-2">
                  <Link href="/">
                    <Button 
                      variant={isRegistrationPage ? "default" : "ghost"} 
                      size="sm" 
                      className="flex items-center gap-2"
                    >
                      <Home className="w-4 h-4" />
                      Asistencia a Grupos
                    </Button>
                  </Link>
                  <Link href="/convocatorias">
                    <Button 
                      variant={isConvocatoriasPage ? "default" : "ghost"} 
                      size="sm" 
                      className="flex items-center gap-2"
                    >
                      <Megaphone className="w-4 h-4" />
                      Inscripción a Eventos
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-900">Sistema Cultural UV</h1>
            {isSuperAdmin && (
              <Badge className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Super Admin
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {!isRegistrationPage && !isConvocatoriasPage && (
              <>
                <Link href="/">
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    Asistencia
                  </Button>
                </Link>
                <Link href="/convocatorias">
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <Megaphone className="w-4 h-4" />
                    Convocatorias
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
                <Link href="/grupos">
                  <Button
                    variant={pathname.startsWith("/grupos") ? "default" : "ghost"}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <UsersRound className="w-4 h-4" />
                    Grupos
                  </Button>
                </Link>
                <Link href="/eventos">
                  <Button
                    variant={pathname.startsWith("/eventos") ? "default" : "ghost"}
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
                {isSuperAdmin && (
                  <Link href="/super-admin">
                    <Button
                      variant={pathname === "/super-admin" ? "default" : "ghost"}
                      size="sm"
                      className="flex items-center gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700"
                    >
                      <Shield className="w-4 h-4" />
                      Panel Admin
                    </Button>
                  </Link>
                )}
              </>
            )}
            {(isRegistrationPage || isConvocatoriasPage) && (
              <div className="flex items-center gap-2">
                <Link href="/">
                  <Button 
                    variant={isRegistrationPage ? "default" : "ghost"} 
                    size="sm" 
                    className="flex items-center gap-2"
                  >
                    <Home className="w-4 h-4" />
                    Asistencia a Grupos
                  </Button>
                </Link>
                <Link href="/convocatorias">
                  <Button 
                    variant={isConvocatoriasPage ? "default" : "ghost"} 
                    size="sm" 
                    className="flex items-center gap-2"
                  >
                    <Megaphone className="w-4 h-4" />
                    Inscripción a Eventos
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

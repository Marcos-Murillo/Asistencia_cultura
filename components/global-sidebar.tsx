"use client"

import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Home, 
  Users, 
  Users2, 
  Calendar, 
  BarChart3, 
  MessageSquare, 
  Shield,
  Menu,
  X,
  UsersRound,
  FileText,
  Megaphone,
  UserCog
} from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface GlobalSidebarProps {
  isOpen: boolean
  onToggle: () => void
}

interface NavItem {
  icon: any
  label: string
  path: string
  superAdminOnly?: boolean
}

export function GlobalSidebar({ isOpen, onToggle }: GlobalSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  useEffect(() => {
    const userType = sessionStorage.getItem("userType")
    const isSuperAdminFlag = sessionStorage.getItem("isSuperAdmin")
    console.log('[GlobalSidebar] userType:', userType)
    console.log('[GlobalSidebar] isSuperAdmin:', isSuperAdminFlag)
    setIsSuperAdmin(userType === "superadmin" && isSuperAdminFlag === "true")
  }, [pathname]) // Re-check when pathname changes

  // Páginas generales
  const generalNavItems: NavItem[] = [
    { icon: Home, label: "Inscripciones", path: "/" },
    { icon: Megaphone, label: "Convocatorias", path: "/convocatorias" },
    { icon: Users, label: "Usuarios", path: "/usuarios" },
    { icon: Users2, label: "Grupos", path: "/grupos" },
    { icon: Calendar, label: "Eventos", path: "/eventos" },
    { icon: BarChart3, label: "Estadísticas", path: "/estadisticas" },
    { icon: FileText, label: "Gráficas", path: "/graficas" },
  ]

  // Páginas exclusivas de Super Admin
  const superAdminNavItems: NavItem[] = [
    { icon: UserCog, label: "Super Admin", path: "/super-admin", superAdminOnly: true },
    { icon: MessageSquare, label: "Chat IA", path: "/chat", superAdminOnly: true },
  ]

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-white border-r shadow-lg transition-transform duration-300 z-50 w-64",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-gray-900">Navegación</h2>
            {isSuperAdmin && (
              <Badge className="bg-purple-600 text-xs">
                <Shield className="w-3 h-3 mr-1" />
                SUP-A
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onToggle}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-73px)]">
          {/* Páginas Generales */}
          <div className="space-y-1">
            {generalNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path))
              
              return (
                <Button
                  key={item.path}
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    isActive && "bg-blue-600 hover:bg-blue-700"
                  )}
                  onClick={() => {
                    router.push(item.path)
                    onToggle()
                  }}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Button>
              )
            })}
          </div>

          {/* Separador y Páginas de Super Admin */}
          {isSuperAdmin && (
            <>
              <Separator className="my-4" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-purple-600 px-3 py-2 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Super Admin
                </p>
                {superAdminNavItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path))
                  
                  return (
                    <Button
                      key={item.path}
                      variant={isActive ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start",
                        isActive 
                          ? "bg-purple-600 hover:bg-purple-700" 
                          : "hover:bg-purple-50"
                      )}
                      onClick={() => {
                        router.push(item.path)
                        onToggle()
                      }}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </Button>
                  )
                })}
              </div>
            </>
          )}
        </nav>
      </aside>
    </>
  )
}

"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Shield, Menu, Settings, LogOut, User } from "lucide-react"
import { GlobalSidebar } from "./global-sidebar"
import { AreaSelector } from "./area-selector"
import { useArea } from "@/contexts/area-context"
import { cn } from "@/lib/utils"
import type { Area } from "@/lib/firebase-config"

export function GlobalHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { area } = useArea()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userName, setUserName] = useState("")

  useEffect(() => {
    const userType = sessionStorage.getItem("userType")
    const adminStatus = sessionStorage.getItem("isAdmin") === "true"
    const superAdminStatus = sessionStorage.getItem("isSuperAdmin") === "true"
    const name = sessionStorage.getItem("userName") || ""
    
    console.log('[GlobalHeader] userType:', userType)
    console.log('[GlobalHeader] isAdmin:', adminStatus)
    console.log('[GlobalHeader] isSuperAdmin:', superAdminStatus)
    
    setIsSuperAdmin(userType === "superadmin" && superAdminStatus)
    setIsAdmin(adminStatus && userType !== "superadmin")
    setUserName(name)
    
    // Forzar área para admins no super admin
    if (!superAdminStatus && (userType === "admin" || userType === "manager")) {
      const adminArea = sessionStorage.getItem("adminArea") as Area | null
      const managerArea = sessionStorage.getItem("userArea") as Area | null
      const forcedArea = adminArea || managerArea
      
      if (forcedArea) {
        console.log('[GlobalHeader] Forcing area to:', forcedArea)
        localStorage.setItem('selectedArea', forcedArea)
      }
    }
  }, [pathname])

  const handleLogout = () => {
    sessionStorage.clear()
    localStorage.clear()
    router.push("/login")
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  // No mostrar en páginas de login, página principal, ni páginas de manager
  const hideHeaderPaths = ["/", "/login", "/login-admin", "/login-manager", "/convocatorias", "/inscripcion-deporte", "/convocatorias-deporte"]
  const isManagerPage = pathname.startsWith("/manager/")
  
  if (hideHeaderPaths.includes(pathname) || isManagerPage) {
    return null
  }

  return (
    <>
      <div className="bg-white border-b shadow-sm sticky top-0 z-30">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-gray-900">Sistema {area === 'deporte' ? 'Deportivo' : 'Cultural'}</h1>
            
            {/* Indicador de Área */}
            <Badge 
              className={cn(
                "text-xs font-medium",
                area === 'deporte' 
                  ? "bg-green-600 hover:bg-green-700 text-white" 
                  : "bg-orange-600 hover:bg-orange-700 text-white"
              )}
            >
              {area === 'deporte' ? 'Deporte' : 'Cultura'}
            </Badge>
            
            {isSuperAdmin && (
              <Badge className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1">
                <Shield className="w-3 h-3" />
                SUP-A
              </Badge>
            )}
            {isAdmin && (
              <Badge className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1">
                <Settings className="w-3 h-3" />
                Admin
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {/* AreaSelector para Super Admin */}
            <AreaSelector />
            
            {/* Avatar con dropdown */}
            {(isSuperAdmin || isAdmin) && userName && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 h-10 px-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-sm">
                        {getInitials(userName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                      {userName}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{userName}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {isSuperAdmin ? "Super Administrador" : "Administrador"}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      <GlobalSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
    </>
  )
}

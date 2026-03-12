"use client"

import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  UsersRound
} from "lucide-react"
import { useState, useEffect } from "react"

export function SidebarNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const userType = sessionStorage.getItem("userType")
    setIsSuperAdmin(userType === "superadmin")
  }, [])

  const navItems = [
    { icon: Home, label: "Inicio", path: "/" },
    { icon: Users, label: "Usuarios", path: "/usuarios" },
    { icon: Users2, label: "Grupos", path: "/grupos" },
    { icon: Calendar, label: "Eventos", path: "/eventos" },
    { icon: UsersRound, label: "Equipos", path: "/equipos" },
    { icon: BarChart3, label: "Estadísticas", path: "/estadisticas" },
  ]

  if (isSuperAdmin) {
    navItems.push({ icon: MessageSquare, label: "Chat IA", path: "/chat" })
  }

  return (
    <>
      {/* Header con toggle para móvil */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <h1 className="text-xl font-bold text-gray-900">Sistema Cultural</h1>
          </div>
          <Badge className={isSuperAdmin ? "bg-purple-600" : "bg-blue-600"}>
            <Shield className="w-3 h-3 mr-1" />
            {isSuperAdmin ? "SUP-A" : "Admin"}
          </Badge>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed right-0 top-[57px] h-[calc(100vh-57px)] bg-white border-l shadow-lg transition-transform duration-300 z-30 w-64 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } lg:translate-x-0`}
      >
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.path
            
            return (
              <Button
                key={item.path}
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start ${
                  isActive ? "bg-purple-600 hover:bg-purple-700" : ""
                }`}
                onClick={() => {
                  router.push(item.path)
                  setIsOpen(false)
                }}
              >
                <Icon className="w-4 h-4 mr-2" />
                {item.label}
              </Button>
            )
          })}
        </nav>
      </aside>

      {/* Overlay para móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}

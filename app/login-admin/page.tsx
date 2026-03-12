"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Shield } from "lucide-react"
import { verifyAdminWithPassword } from "@/lib/auth"
import type { Area } from "@/lib/firebase-config"

export default function LoginAdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [documento, setDocumento] = useState("")
  const [password, setPassword] = useState("")
  const [area, setArea] = useState<Area>("cultura")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const admin = await verifyAdminWithPassword(area, documento, password)
      
      if (admin) {
        // Limpiar cualquier sesión anterior
        sessionStorage.clear()
        localStorage.clear()
        
        // Establecer nueva sesión
        sessionStorage.setItem("userType", "admin")
        sessionStorage.setItem("userId", admin.id)
        sessionStorage.setItem("userName", admin.nombres)
        sessionStorage.setItem("isAdmin", "true")
        sessionStorage.setItem("isSuperAdmin", "false")
        sessionStorage.setItem("userRole", "ADMIN")
        sessionStorage.setItem("adminArea", admin.area)
        localStorage.setItem("selectedArea", admin.area)
        
        // Disparar evento personalizado para que el AreaContext se actualice
        window.dispatchEvent(new CustomEvent('areaChanged', { detail: { area: admin.area } }))
        
        // Verificar que se guardó correctamente
        const savedUserRole = sessionStorage.getItem("userRole")
        console.log("[LoginAdmin] ========== LOGIN SUCCESS ==========")
        console.log("[LoginAdmin] Admin logged in:", admin.nombres)
        console.log("[LoginAdmin] Admin area:", admin.area)
        console.log("[LoginAdmin] Verification - userRole saved as:", savedUserRole)
        console.log("[LoginAdmin] All session storage:")
        console.log("[LoginAdmin] - userType:", sessionStorage.getItem("userType"))
        console.log("[LoginAdmin] - isAdmin:", sessionStorage.getItem("isAdmin"))
        console.log("[LoginAdmin] - isSuperAdmin:", sessionStorage.getItem("isSuperAdmin"))
        console.log("[LoginAdmin] - userRole:", sessionStorage.getItem("userRole"))
        console.log("[LoginAdmin] - adminArea:", sessionStorage.getItem("adminArea"))
        console.log("[LoginAdmin] localStorage.selectedArea:", localStorage.getItem("selectedArea"))
        console.log("[LoginAdmin] =======================================")
        
        // Pequeño delay para asegurar que se guarde
        await new Promise(resolve => setTimeout(resolve, 100))
        
        router.push("/usuarios")
      } else {
        setError("Credenciales incorrectas o área incorrecta")
      }
    } catch (err) {
      setError("Error al iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Administrador</CardTitle>
          <CardDescription>Acceso al panel de administración</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="area">Área</Label>
              <Select value={area} onValueChange={(value) => setArea(value as Area)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cultura">Cultura</SelectItem>
                  <SelectItem value="deporte">Deporte</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="documento">Número de Documento</Label>
              <Input
                id="documento"
                type="text"
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                placeholder="Ingresa tu documento"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Verificando..." : "Ingresar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

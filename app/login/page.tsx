"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, UserCog } from "lucide-react"
import { verifySuperAdmin, verifyAdmin } from "@/lib/auth"

export default function LoginPage() {
  const router = useRouter()
  const [loginType, setLoginType] = useState<"super" | "admin" | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Super Admin
  const [superUsuario, setSuperUsuario] = useState("")
  const [superPassword, setSuperPassword] = useState("")

  // Admin
  const [adminDocumento, setAdminDocumento] = useState("")
  const [adminCorreo, setAdminCorreo] = useState("")

  const handleSuperAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (verifySuperAdmin(superUsuario, superPassword)) {
        sessionStorage.setItem("userType", "superadmin")
        sessionStorage.setItem("userId", superUsuario)
        router.push("/estadisticas")
      } else {
        setError("Credenciales incorrectas")
      }
    } catch (err) {
      setError("Error al iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const admin = await verifyAdmin(adminDocumento, adminCorreo)
      if (admin) {
        sessionStorage.setItem("userType", "admin")
        sessionStorage.setItem("userId", admin.id)
        sessionStorage.setItem("userName", admin.nombres)
        router.push("/estadisticas")
      } else {
        setError("No se encontró un administrador con estas credenciales")
      }
    } catch (err) {
      setError("Error al iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  if (!loginType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Sistema de Gestión Cultural</h1>
            <p className="text-gray-600">Selecciona tu tipo de acceso</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-purple-300"
              onClick={() => setLoginType("super")}
            >
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <Shield className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-2xl">Super Administrador</CardTitle>
                <CardDescription>Acceso completo al sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Crear usuarios administradores</li>
                  <li>• Acceso a todas las funcionalidades</li>
                  <li>• Gestión completa del sistema</li>
                </ul>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-300"
              onClick={() => setLoginType("admin")}
            >
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <UserCog className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl">Administrador</CardTitle>
                <CardDescription>Gestión de datos y estadísticas</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Ver estadísticas y gráficas</li>
                  <li>• Gestionar grupos y eventos</li>
                  <li>• Administrar usuarios</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (loginType === "super") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
            <CardTitle className="text-2xl">Super Administrador</CardTitle>
            <CardDescription>Ingresa tus credenciales</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSuperAdminLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="usuario">Usuario</Label>
                <Input
                  id="usuario"
                  type="text"
                  value={superUsuario}
                  onChange={(e) => setSuperUsuario(e.target.value)}
                  placeholder="Ingresa tu usuario"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={superPassword}
                  onChange={(e) => setSuperPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  required
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setLoginType(null)} className="flex-1">
                  Volver
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Verificando..." : "Ingresar"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <UserCog className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Administrador</CardTitle>
          <CardDescription>Ingresa tus credenciales</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="documento">Número de Documento</Label>
              <Input
                id="documento"
                type="text"
                value={adminDocumento}
                onChange={(e) => setAdminDocumento(e.target.value)}
                placeholder="Ingresa tu documento"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="correo">Correo Electrónico</Label>
              <Input
                id="correo"
                type="email"
                value={adminCorreo}
                onChange={(e) => setAdminCorreo(e.target.value)}
                placeholder="Ingresa tu correo"
                required
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setLoginType(null)} className="flex-1">
                Volver
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Verificando..." : "Ingresar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

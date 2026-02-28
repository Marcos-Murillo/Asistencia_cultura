"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Users } from "lucide-react"
import { verifyGroupManager } from "@/lib/auth"

export default function LoginManagerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [documento, setDocumento] = useState("")
  const [correo, setCorreo] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await verifyGroupManager(documento, correo)
      
      if (result) {
        sessionStorage.setItem("userType", "manager")
        sessionStorage.setItem("userId", result.user.id)
        sessionStorage.setItem("userName", result.user.nombres)
        sessionStorage.setItem("userRole", result.user.rol || "")
        sessionStorage.setItem("grupoCultural", result.grupoCultural)
        
        router.push(`/manager/${encodeURIComponent(result.grupoCultural)}`)
      } else {
        setError("No se encontró un director o monitor con estas credenciales o no está asignado a ningún grupo")
      }
    } catch (err) {
      setError("Error al iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Director / Monitor</CardTitle>
          <CardDescription>Acceso a gestión de grupo cultural</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
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
              <Label htmlFor="correo">Correo Electrónico</Label>
              <Input
                id="correo"
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="Ingresa tu correo"
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

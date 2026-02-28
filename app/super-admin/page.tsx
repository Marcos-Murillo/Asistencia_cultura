"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Navigation } from "@/components/navigation"
import { UserPlus, Users } from "lucide-react"
import { createAdminUser, getAllAdmins } from "@/lib/auth"
import type { AdminUser } from "@/lib/types"

export default function SuperAdminPage() {
  const router = useRouter()
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  // Form
  const [nombres, setNombres] = useState("")
  const [documento, setDocumento] = useState("")
  const [correo, setCorreo] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    const userType = sessionStorage.getItem("userType")
    if (userType !== "superadmin") {
      router.push("/login")
      return
    }
    loadAdmins()
  }, [router])

  async function loadAdmins() {
    setLoading(true)
    try {
      const data = await getAllAdmins()
      setAdmins(data)
    } catch (err) {
      console.error("Error loading admins:", err)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateAdmin(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccess("")
    setCreating(true)

    try {
      const createdBy = sessionStorage.getItem("userId") || "superadmin"
      await createAdminUser(documento, correo, nombres, createdBy)
      setSuccess("Administrador creado exitosamente")
      setNombres("")
      setDocumento("")
      setCorreo("")
      loadAdmins()
    } catch (err: any) {
      setError(err.message || "Error al crear administrador")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Navigation />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel de Super Administrador</h1>
          <p className="text-gray-600">Gestiona los usuarios administradores del sistema</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Formulario para crear admin */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Crear Nuevo Administrador
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateAdmin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombres">Nombres Completos</Label>
                  <Input
                    id="nombres"
                    value={nombres}
                    onChange={(e) => setNombres(e.target.value)}
                    placeholder="Ej: Juan Pérez"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="documento">Número de Documento</Label>
                  <Input
                    id="documento"
                    value={documento}
                    onChange={(e) => setDocumento(e.target.value)}
                    placeholder="Ej: 1234567890"
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
                    placeholder="Ej: admin@univalle.edu.co"
                    required
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-600">{success}</p>
                  </div>
                )}

                <Button type="submit" disabled={creating} className="w-full">
                  {creating ? "Creando..." : "Crear Administrador"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Lista de admins */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Administradores Registrados ({admins.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">Cargando...</div>
              ) : admins.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No hay administradores registrados</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Documento</TableHead>
                        <TableHead>Correo</TableHead>
                        <TableHead>Fecha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {admins.map((admin) => (
                        <TableRow key={admin.id}>
                          <TableCell className="font-medium">{admin.nombres}</TableCell>
                          <TableCell>{admin.numeroDocumento}</TableCell>
                          <TableCell>{admin.correo}</TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {new Date(admin.createdAt).toLocaleDateString("es-CO")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

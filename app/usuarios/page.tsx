"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, Users, Trash2, Calendar, Mail, Phone, User, AlertTriangle, CheckCircle } from "lucide-react"
import { Navigation } from "@/components/navigation"
import DeleteUserDialog from "@/components/delete-user-dialog"
import { getAllUsers, deleteUser } from "@/lib/firestore"
import type { UserProfile } from "@/lib/types"

export default function UsuariosPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const loadUsers = async () => {
    try {
      console.log("[v0] Loading users from Firestore...")
      const usersList = await getAllUsers()
      console.log("[v0] Loaded users:", usersList.length)
      setUsers(usersList)
      setFilteredUsers(usersList)
      setError(null)
    } catch (error) {
      console.error("[v0] Error loading users:", error)
      setError("Error al cargar los usuarios. Verifica la conexión a Firebase.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers(users)
    } else {
      const filtered = users.filter(
        (user) =>
          `${user.nombres} `.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.correo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.numeroDocumento.includes(searchTerm),
      )
      setFilteredUsers(filtered)
    }
  }, [searchTerm, users])

  const getInitials = (nombres: string) => {
    const firstInitial = nombres.charAt(0).toUpperCase()
    return `${firstInitial}`
  }

  const handleDeleteUser = (user: UserProfile) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId)
      setSuccess("Usuario eliminado exitosamente")
      await loadUsers() // Reload users after deletion

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error("Error deleting user:", error)
      throw error // Re-throw to be handled by the dialog
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Navigation />
        <div className="p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-lg text-gray-600">Cargando usuarios...</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navigation />
      <div className="p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
              <p className="text-gray-600 mt-1">Administrar perfiles de usuarios registrados</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                <Users className="w-4 h-4 mr-1" />
                {filteredUsers.length} usuarios
              </Badge>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Buscar Usuarios
              </CardTitle>
              <CardDescription>Busca por nombre, correo electrónico o número de documento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Escribe el nombre, correo o documento del usuario..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Users List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Lista de Usuarios
              </CardTitle>
              <CardDescription>
                {filteredUsers.length === users.length
                  ? `Mostrando todos los ${filteredUsers.length} usuarios registrados`
                  : `Mostrando ${filteredUsers.length} de ${users.length} usuarios`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Contacto</TableHead>
                        <TableHead>Documento</TableHead>
                        <TableHead>Estamento</TableHead>
                        <TableHead>Facultad</TableHead>
                        <TableHead>Programa</TableHead>
                        <TableHead>Última Asistencia</TableHead>
                        <TableHead className="text-center">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-blue-100 text-blue-700">
                                  {getInitials(user.nombres)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">
                                  {user.nombres}
                                </div>
                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                  <Badge
                                    variant="outline"
                                    className={
                                      user.genero === "MUJER"
                                        ? "bg-pink-100 text-pink-800"
                                        : user.genero === "HOMBRE"
                                          ? "bg-blue-100 text-blue-800"
                                          : "bg-purple-100 text-purple-800"
                                    }
                                  >
                                    {user.genero}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="w-3 h-3 text-gray-400" />
                                <span className="truncate max-w-[200px]">{user.correo}</span>
                              </div>
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Phone className="w-3 h-3 text-gray-400" />
                                {user.telefono}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">{user.numeroDocumento}</div>
                              <div className="text-gray-500">{user.tipoDocumento}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{user.estamento}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">{user.facultad || "N/A"}</TableCell>
                          <TableCell className="max-w-[250px] truncate">{user.programaAcademico || "N/A"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Calendar className="w-4 h-4" />
                              {new Date(user.lastAttendance).toLocaleDateString("es-CO")}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(user)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm
                    ? "No se encontraron usuarios con ese criterio de búsqueda"
                    : "No hay usuarios registrados"}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delete User Dialog */}
          <DeleteUserDialog
            user={userToDelete}
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onConfirm={confirmDeleteUser}
          />
        </div>
      </div>
    </div>
  )
}

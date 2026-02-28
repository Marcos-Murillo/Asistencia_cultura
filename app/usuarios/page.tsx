"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { Navigation } from "@/components/navigation"
import DeleteUserDialog from "@/components/delete-user-dialog"
import { getAllUsers, deleteUser, getUserEnrollments, getUserEventEnrollments } from "@/lib/firestore"
import { getAttendanceRecords } from "@/lib/storage"
import { updateUserRole } from "@/lib/auth"
import type { UserProfile, GroupEnrollment, AttendanceRecord, UserRole } from "@/lib/types"
import { 
  Users, 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  MoreVertical, 
  Eye, 
  Trash2,
  UserCog,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Mail,
  Phone,
  GraduationCap,
  Building2,
  User as UserIcon,
  Music
} from "lucide-react"

const ITEMS_PER_PAGE = 20

export default function UsuariosPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [facultadFilter, setFacultadFilter] = useState("")
  const [programaFilter, setProgramaFilter] = useState("")
  const [grupoCulturalFilter, setGrupoCulturalFilter] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [userDetailsOpen, setUserDetailsOpen] = useState(false)
  const [userGroups, setUserGroups] = useState<GroupEnrollment[]>([])
  const [userEvents, setUserEvents] = useState<string[]>([])
  const [userAttendances, setUserAttendances] = useState<AttendanceRecord[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [userToAssignRole, setUserToAssignRole] = useState<UserProfile | null>(null)
  const [selectedRole, setSelectedRole] = useState<UserRole>("ESTUDIANTE")
  const [isAssigningRole, setIsAssigningRole] = useState(false)

  const loadUsers = async () => {
    try {
      console.log("[Usuarios] Loading users from Firestore...")
      const usersList = await getAllUsers()
      console.log("[Usuarios] Loaded users:", usersList.length)
      setUsers(usersList)
      setFilteredUsers(usersList)
      setError(null)
    } catch (error) {
      console.error("[Usuarios] Error loading users:", error)
      setError("Error al cargar los usuarios. Verifica la conexión a Firebase.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    let filtered = users

    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (user) =>
          user.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.correo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.numeroDocumento.includes(searchTerm)
      )
    }

    if (facultadFilter) {
      filtered = filtered.filter((user) => user.facultad === facultadFilter)
    }

    if (programaFilter) {
      filtered = filtered.filter((user) => user.programaAcademico === programaFilter)
    }

    if (grupoCulturalFilter) {
      // Filtrar por grupo cultural requiere cargar las inscripciones
      // Por ahora lo dejamos como placeholder
    }

    setFilteredUsers(filtered)
    setCurrentPage(1)
  }, [searchTerm, facultadFilter, programaFilter, grupoCulturalFilter, users])

  const getInitials = (nombres: string) => {
    const parts = nombres.split(" ")
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase()
    }
    return nombres.charAt(0).toUpperCase()
  }

  const handleDeleteUser = (user: UserProfile) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId)
      setSuccess("Usuario eliminado exitosamente")
      await loadUsers()
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error("Error deleting user:", error)
      throw error
    }
  }

  const handleViewUser = async (user: UserProfile) => {
    setSelectedUser(user)
    setUserDetailsOpen(true)
    
    // Cargar información adicional del usuario
    try {
      const [groups, events, allAttendances] = await Promise.all([
        getUserEnrollments(user.id),
        getUserEventEnrollments(user.id),
        getAttendanceRecords()
      ])
      
      setUserGroups(groups)
      setUserEvents(events)
      setUserAttendances(allAttendances.filter(a => a.numeroDocumento === user.numeroDocumento))
    } catch (error) {
      console.error("Error loading user details:", error)
    }
  }

  const handleAssignRole = (user: UserProfile) => {
    setUserToAssignRole(user)
    setSelectedRole(user.rol || "ESTUDIANTE")
    setRoleDialogOpen(true)
  }

  const confirmAssignRole = async () => {
    if (!userToAssignRole) return

    setIsAssigningRole(true)
    try {
      await updateUserRole(userToAssignRole.id, selectedRole)
      setSuccess(`Rol actualizado a ${selectedRole} exitosamente`)
      await loadUsers()
      setRoleDialogOpen(false)
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error("Error assigning role:", error)
      setError("Error al asignar el rol")
      setTimeout(() => setError(null), 3000)
    } finally {
      setIsAssigningRole(false)
    }
  }

  // Obtener opciones únicas para los filtros
  const facultades: ComboboxOption[] = Array.from(new Set(users.map(u => u.facultad).filter(Boolean)))
    .map(f => ({ value: f!, label: f! }))
    .sort((a, b) => a.label.localeCompare(b.label))

  const programas: ComboboxOption[] = Array.from(new Set(users.map(u => u.programaAcademico).filter(Boolean)))
    .map(p => ({ value: p!, label: p! }))
    .sort((a, b) => a.label.localeCompare(b.label))

  // Paginación
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentUsers = filteredUsers.slice(startIndex, endIndex)

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

          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Buscar y Filtrar Usuarios
              </CardTitle>
              <CardDescription>Busca por nombre, correo o documento, y filtra por facultad o programa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, correo o documento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Facultad</label>
                  <Combobox
                    options={facultades}
                    value={facultadFilter}
                    onValueChange={setFacultadFilter}
                    placeholder="Todas las facultades"
                    searchPlaceholder="Buscar facultad..."
                    emptyText="No se encontró la facultad"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Programa</label>
                  <Combobox
                    options={programas}
                    value={programaFilter}
                    onValueChange={setProgramaFilter}
                    placeholder="Todos los programas"
                    searchPlaceholder="Buscar programa..."
                    emptyText="No se encontró el programa"
                  />
                </div>

                {(facultadFilter || programaFilter || searchTerm) && (
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm("")
                        setFacultadFilter("")
                        setProgramaFilter("")
                        setGrupoCulturalFilter("")
                      }}
                      className="w-full"
                    >
                      Limpiar Filtros
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tabla de Usuarios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="w-5 h-5" />
                Lista de Usuarios
              </CardTitle>
              <CardDescription>
                Mostrando {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} de {filteredUsers.length} usuarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentUsers.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Usuario</TableHead>
                          <TableHead>Estamento</TableHead>
                          <TableHead>Facultad</TableHead>
                          <TableHead>Programa</TableHead>
                          <TableHead className="text-center">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback className="bg-blue-100 text-blue-700">
                                    {getInitials(user.nombres)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{user.nombres}</div>
                                  <div className="text-sm text-gray-500">{user.correo}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{user.estamento}</Badge>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {user.facultad || "N/A"}
                            </TableCell>
                            <TableCell className="max-w-[250px] truncate">
                              {user.programaAcademico || "N/A"}
                            </TableCell>
                            <TableCell className="text-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleViewUser(user)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Ver Usuario
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleAssignRole(user)}>
                                    <UserCog className="h-4 w-4 mr-2" />
                                    Asignar Rol
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteUser(user)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Eliminar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Paginación */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div className="text-sm text-gray-600">
                        Página {currentPage} de {totalPages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Anterior
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Siguiente
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm || facultadFilter || programaFilter
                    ? "No se encontraron usuarios con ese criterio de búsqueda"
                    : "No hay usuarios registrados"}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dialog de Detalles del Usuario */}
          <Dialog open={userDetailsOpen} onOpenChange={setUserDetailsOpen}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">Perfil del Usuario</DialogTitle>
                <DialogDescription>Información completa y detallada</DialogDescription>
              </DialogHeader>
              
              {selectedUser && (
                <div className="space-y-6">
                  {/* Header con Avatar y Info Principal */}
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
                    <div className="flex items-start gap-6">
                      <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                        <AvatarFallback className="bg-white text-blue-600 text-2xl font-bold">
                          {getInitials(selectedUser.nombres)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold mb-2">{selectedUser.nombres}</h2>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge className="bg-white/20 text-white hover:bg-white/30">
                            {selectedUser.genero}
                          </Badge>
                          <Badge className="bg-white/20 text-white hover:bg-white/30">
                            {selectedUser.estamento}
                          </Badge>
                          <Badge className="bg-white/20 text-white hover:bg-white/30">
                            {selectedUser.edad} años
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <span>{selectedUser.correo}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{selectedUser.telefono}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Grid de Información */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Información Personal */}
                    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
                          <UserIcon className="h-5 w-5" />
                          Información Personal
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Etnia</p>
                          <p className="font-medium text-gray-900">{selectedUser.etnia}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Tipo de Documento</p>
                          <p className="font-medium text-gray-900">{selectedUser.tipoDocumento}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Número de Documento</p>
                          <p className="font-medium text-gray-900">{selectedUser.numeroDocumento}</p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Información Institucional */}
                    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2 text-purple-900">
                          <Building2 className="h-5 w-5" />
                          Información Institucional
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Sede</p>
                          <p className="font-medium text-gray-900">{selectedUser.sede}</p>
                        </div>
                        {selectedUser.codigoEstudiante && (
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Código Estudiante</p>
                            <p className="font-medium text-gray-900">{selectedUser.codigoEstudiante}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Información Académica */}
                    {(selectedUser.facultad || selectedUser.programaAcademico) && (
                      <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 md:col-span-2">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2 text-green-900">
                            <GraduationCap className="h-5 w-5" />
                            Información Académica
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedUser.facultad && (
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Facultad</p>
                              <p className="font-medium text-gray-900">{selectedUser.facultad}</p>
                            </div>
                          )}
                          {selectedUser.programaAcademico && (
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Programa Académico</p>
                              <p className="font-medium text-gray-900">{selectedUser.programaAcademico}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Grupos Inscritos */}
                    <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2 text-orange-900">
                          <Music className="h-5 w-5" />
                          Grupos Culturales
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {userGroups.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {userGroups.map((group) => (
                              <Badge key={group.id} className="bg-orange-500 text-white hover:bg-orange-600">
                                {group.grupoCultural}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No está inscrito en ningún grupo</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Eventos Inscritos */}
                    <Card className="border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-rose-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2 text-pink-900">
                          <Calendar className="h-5 w-5" />
                          Eventos Inscritos
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {userEvents.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-900">
                              {userEvents.length} evento(s) inscrito(s)
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {Array.from(new Set(userEvents)).map((eventId, index) => (
                                <Badge key={index} className="bg-pink-500 text-white hover:bg-pink-600">
                                  Evento {index + 1}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No está inscrito en ningún evento</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Última Asistencia */}
                    <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 md:col-span-2">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2 text-indigo-900">
                          <Calendar className="h-5 w-5" />
                          Historial de Asistencia
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-white rounded-lg">
                          <p className="text-2xl font-bold text-indigo-600">{userAttendances.length}</p>
                          <p className="text-xs text-gray-500 font-medium">Total Asistencias</p>
                        </div>
                        <div className="md:col-span-2 p-4 bg-white rounded-lg">
                          <p className="text-xs text-gray-500 font-medium mb-1">Última Asistencia</p>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(selectedUser.lastAttendance).toLocaleDateString("es-CO", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Delete User Dialog */}
          <DeleteUserDialog
            user={userToDelete}
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onConfirm={confirmDeleteUser}
          />

          {/* Assign Role Dialog */}
          <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Asignar Rol de Usuario</DialogTitle>
                <DialogDescription>
                  Selecciona el rol para {userToAssignRole?.nombres}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rol</label>
                  <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ESTUDIANTE">Estudiante</SelectItem>
                      <SelectItem value="DIRECTOR">Director</SelectItem>
                      <SelectItem value="MONITOR">Monitor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Nota:</strong> Los roles de Director y Monitor permiten gestionar grupos culturales.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setRoleDialogOpen(false)}
                  disabled={isAssigningRole}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmAssignRole}
                  disabled={isAssigningRole}
                  className="flex-1"
                >
                  {isAssigningRole ? "Asignando..." : "Asignar Rol"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}

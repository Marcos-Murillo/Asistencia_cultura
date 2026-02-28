"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Navigation } from "@/components/navigation"
import { Users, Eye, Music, MoreVertical, UserPlus, CheckCircle, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { getAllGroupsWithEnrollments, getAllUsers } from "@/lib/firestore"
import { assignGroupManager, getGroupManagers } from "@/lib/auth"
import { GRUPOS_CULTURALES } from "@/lib/data"
import type { GroupWithEnrollments, UserProfile, GroupManager } from "@/lib/types"

export default function GruposPage() {
  const [groups, setGroups] = useState<GroupWithEnrollments[]>([])
  const [loading, setLoading] = useState(true)
  const [managerDialogOpen, setManagerDialogOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<string>("")
  const [availableManagers, setAvailableManagers] = useState<UserProfile[]>([])
  const [selectedManager, setSelectedManager] = useState<string>("")
  const [isAssigning, setIsAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [groupManagers, setGroupManagers] = useState<Record<string, (GroupManager & { user: UserProfile })[]>>({})
  const [viewManagersDialogOpen, setViewManagersDialogOpen] = useState(false)
  const [viewingGroup, setViewingGroup] = useState<string>("")

  useEffect(() => {
    loadGroups()
  }, [])

  async function loadGroups() {
    try {
      const enrolledGroups = await getAllGroupsWithEnrollments()
      
      // Combinar con todos los grupos culturales (incluso los sin inscritos)
      const allGroups: GroupWithEnrollments[] = GRUPOS_CULTURALES.map(nombre => {
        const existing = enrolledGroups.find(g => g.nombre === nombre)
        return existing || { nombre, totalInscritos: 0 }
      })

      setGroups(allGroups)

      // Cargar encargados de cada grupo
      const managersMap: Record<string, (GroupManager & { user: UserProfile })[]> = {}
      for (const group of allGroups) {
        const managers = await getGroupManagers(group.nombre)
        managersMap[group.nombre] = managers
      }
      setGroupManagers(managersMap)
    } catch (error) {
      console.error("Error cargando grupos:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignManager = async (groupName: string) => {
    setSelectedGroup(groupName)
    setManagerDialogOpen(true)
    
    // Cargar usuarios con rol de director o monitor
    try {
      const allUsers = await getAllUsers()
      const managers = allUsers.filter(u => u.rol === "DIRECTOR" || u.rol === "MONITOR")
      setAvailableManagers(managers)
    } catch (error) {
      console.error("Error cargando managers:", error)
      setError("Error al cargar la lista de directores y monitores")
    }
  }

  const confirmAssignManager = async () => {
    if (!selectedManager || !selectedGroup) return

    setIsAssigning(true)
    setError(null)
    
    try {
      const assignedBy = sessionStorage.getItem("userId") || "admin"
      await assignGroupManager(selectedManager, selectedGroup, assignedBy)
      setSuccess(`Encargado asignado exitosamente a ${selectedGroup}`)
      await loadGroups()
      setManagerDialogOpen(false)
      setSelectedManager("")
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      setError(error.message || "Error al asignar encargado")
      setTimeout(() => setError(null), 3000)
    } finally {
      setIsAssigning(false)
    }
  }

  const handleViewManagers = (groupName: string) => {
    setViewingGroup(groupName)
    setViewManagersDialogOpen(true)
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const totalInscritos = groups.reduce((sum, g) => sum + g.totalInscritos, 0)
  const gruposConInscritos = groups.filter(g => g.totalInscritos > 0).length

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navigation />
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Grupos Culturales</h1>
            <p className="text-gray-600 mt-2">Gestión de inscripciones a grupos culturales</p>
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

          {/* Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Inscritos</p>
                    <p className="text-2xl font-bold text-gray-900">{totalInscritos}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-full">
                    <Music className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Grupos Activos</p>
                    <p className="text-2xl font-bold text-gray-900">{gruposConInscritos}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Music className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Grupos</p>
                    <p className="text-2xl font-bold text-gray-900">{groups.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabla de Grupos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="w-5 h-5" />
                Lista de Grupos Culturales
              </CardTitle>
              <CardDescription>
                Todos los grupos culturales disponibles y sus inscripciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Grupo</TableHead>
                      <TableHead className="text-center">Total Inscritos</TableHead>
                      <TableHead className="text-center">Encargados</TableHead>
                      <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groups.map((group) => {
                      const managers = groupManagers[group.nombre] || []
                      return (
                        <TableRow key={group.nombre}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-purple-100 text-purple-700">
                                  {getInitials(group.nombre)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{group.nombre}</div>
                                <div className="text-sm text-gray-500">
                                  {group.totalInscritos > 0 
                                    ? `${group.totalInscritos} persona${group.totalInscritos !== 1 ? 's' : ''} inscrita${group.totalInscritos !== 1 ? 's' : ''}`
                                    : "Sin inscripciones"
                                  }
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge 
                              variant="secondary" 
                              className={`text-base ${
                                group.totalInscritos > 0 
                                  ? "bg-blue-100 text-blue-800" 
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {group.totalInscritos}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {managers.length > 0 ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewManagers(group.nombre)}
                              >
                                {managers.length} encargado{managers.length !== 1 ? 's' : ''}
                              </Button>
                            ) : (
                              <span className="text-sm text-gray-500">Sin encargados</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/grupos/${encodeURIComponent(group.nombre)}`}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Ver Grupo
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAssignManager(group.nombre)}>
                                  <UserPlus className="h-4 w-4 mr-2" />
                                  Asignar Encargado
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Dialog para asignar encargado */}
          <Dialog open={managerDialogOpen} onOpenChange={setManagerDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Asignar Encargado</DialogTitle>
                <DialogDescription>
                  Selecciona un director o monitor para el grupo {selectedGroup}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {availableManagers.length > 0 ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Director / Monitor</label>
                      <Select value={selectedManager} onValueChange={setSelectedManager}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un encargado" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableManagers.map((manager) => (
                            <SelectItem key={manager.id} value={manager.id}>
                              {manager.nombres} - {manager.rol}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-sm text-amber-800">
                        <strong>Nota:</strong> Un usuario solo puede ser encargado de un grupo a la vez.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No hay directores o monitores disponibles.</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Asigna roles de Director o Monitor desde la página de Usuarios.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setManagerDialogOpen(false)
                    setSelectedManager("")
                  }}
                  disabled={isAssigning}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmAssignManager}
                  disabled={isAssigning || !selectedManager}
                  className="flex-1"
                >
                  {isAssigning ? "Asignando..." : "Asignar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Dialog para ver encargados */}
          <Dialog open={viewManagersDialogOpen} onOpenChange={setViewManagersDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Encargados de {viewingGroup}</DialogTitle>
                <DialogDescription>
                  Lista de directores y monitores asignados a este grupo
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-3 py-4">
                {groupManagers[viewingGroup]?.map((manager) => (
                  <div key={manager.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Avatar>
                      <AvatarFallback className="bg-blue-100 text-blue-700">
                        {manager.user.nombres.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{manager.user.nombres}</p>
                      <p className="text-sm text-gray-500">{manager.user.correo}</p>
                    </div>
                    <Badge variant="secondary">{manager.user.rol}</Badge>
                  </div>
                ))}
              </div>

              <Button onClick={() => setViewManagersDialogOpen(false)} className="w-full">
                Cerrar
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}

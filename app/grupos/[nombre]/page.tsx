"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Navigation } from "@/components/navigation"
import * as XLSX from "xlsx"
import { 
  Users, 
  Search, 
  Download, 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight,
  Mail,
  Phone,
  Calendar
} from "lucide-react"
import Link from "next/link"
import { getGroupEnrolledUsers } from "@/lib/firestore"
import { FACULTADES, PROGRAMAS_POR_FACULTAD } from "@/lib/data"
import type { UserProfile } from "@/lib/types"
import Loading from "./loading"

type EnrolledUser = UserProfile & { fechaInscripcion: Date }

const ITEMS_PER_PAGE = 15

export default function GrupoDetallePage() {
  const params = useParams()
  const groupName = decodeURIComponent(params.nombre as string)
  
  const [users, setUsers] = useState<EnrolledUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterFaculty, setFilterFaculty] = useState("todas")
  const [filterProgram, setFilterProgram] = useState("todos")
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    loadUsers()
  }, [groupName])

  async function loadUsers() {
    try {
      const enrolledUsers = await getGroupEnrolledUsers(groupName)
      setUsers(enrolledUsers)
    } catch (error) {
      console.error("Error cargando usuarios:", error)
    } finally {
      setLoading(false)
    }
  }

  // Filtrar usuarios
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = searchTerm === "" || 
        user.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.correo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.numeroDocumento.includes(searchTerm)
      
      const matchesFaculty = filterFaculty === "todas" || user.facultad === filterFaculty
      const matchesProgram = filterProgram === "todos" || user.programaAcademico === filterProgram

      return matchesSearch && matchesFaculty && matchesProgram
    })
  }, [users, searchTerm, filterFaculty, filterProgram])

  // Paginación
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Reset página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterFaculty, filterProgram])

  // Programas disponibles según facultad seleccionada
  const availablePrograms = filterFaculty !== "todas" 
    ? PROGRAMAS_POR_FACULTAD[filterFaculty] || []
    : []

  // Descargar Excel
  const handleDownloadExcel = () => {
    // Preparar datos para Excel
    const data = filteredUsers.map(user => ({
      "Nombres": user.nombres,
      "Correo": user.correo,
      "Documento": user.numeroDocumento,
      "Teléfono": user.telefono,
      "Género": user.genero,
      "Facultad": user.facultad || "N/A",
      "Programa": user.programaAcademico || "N/A",
      "Estamento": user.estamento,
      "Fecha Inscripción": user.fechaInscripcion.toLocaleDateString()
    }))

    // Crear libro de trabajo
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inscritos")

    // Descargar archivo
    XLSX.writeFile(workbook, `inscritos_${groupName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`)
  }

  if (loading) {
    return <Loading />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Link href="/grupos">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Grupos
            </Button>
          </Link>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{groupName}</h1>
              <p className="text-gray-600 mt-1">{users.length} personas inscritas</p>
            </div>
            <Button onClick={handleDownloadExcel} className="bg-green-600 hover:bg-green-700">
              <Download className="h-4 w-4 mr-2" />
              Descargar Excel
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Búsqueda */}
              <div className="space-y-2">
                <Label>Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Nombre, correo o documento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Facultad */}
              <div className="space-y-2">
                <Label>Facultad</Label>
                <Select 
                  value={filterFaculty} 
                  onValueChange={(value) => {
                    setFilterFaculty(value)
                    setFilterProgram("todos")
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las facultades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas las facultades</SelectItem>
                    {FACULTADES.map((facultad) => (
                      <SelectItem key={facultad} value={facultad}>
                        {facultad}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Programa */}
              <div className="space-y-2">
                <Label>Programa</Label>
                <Select 
                  value={filterProgram} 
                  onValueChange={setFilterProgram}
                  disabled={filterFaculty === "todas"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los programas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los programas</SelectItem>
                    {availablePrograms.map((programa) => (
                      <SelectItem key={programa} value={programa}>
                        {programa}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Resultados */}
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Mostrando {paginatedUsers.length} de {filteredUsers.length} resultados
              </p>
              {(searchTerm || filterFaculty !== "todas" || filterProgram !== "todos") && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setSearchTerm("")
                    setFilterFaculty("todas")
                    setFilterProgram("todos")
                  }}
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabla de usuarios */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Facultad / Programa</TableHead>
                    <TableHead>Estamento</TableHead>
                    <TableHead>Inscripción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        {users.length === 0 
                          ? "No hay usuarios inscritos en este grupo"
                          : "No se encontraron usuarios con los filtros aplicados"
                        }
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-600 font-medium">
                                {user.nombres.split(" ").map(n => n[0]).slice(0, 2).join("")}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{user.nombres}</p>
                              <Badge 
                                variant="outline" 
                                className={
                                  user.genero === "MUJER" 
                                    ? "text-pink-600 border-pink-200" 
                                    : user.genero === "HOMBRE"
                                    ? "text-blue-600 border-blue-200"
                                    : "text-purple-600 border-purple-200"
                                }
                              >
                                {user.genero}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-600 truncate max-w-[150px]">{user.correo}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-600">{user.telefono}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-gray-900">{user.numeroDocumento}</span>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-900 line-clamp-1">
                              {user.facultad || "N/A"}
                            </p>
                            <p className="text-xs text-gray-500 line-clamp-1">
                              {user.programaAcademico || "N/A"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{user.estamento}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="h-3 w-3" />
                            {user.fechaInscripcion.toLocaleDateString()}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <p className="text-sm text-gray-500">
                  Página {currentPage} de {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="bg-transparent"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="bg-transparent"
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

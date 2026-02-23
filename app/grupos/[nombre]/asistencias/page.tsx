"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { Navigation } from "@/components/navigation"
import { getGroupTracking } from "@/lib/firestore"
import type { GroupTracking } from "@/lib/types"
import { Calendar, ChevronLeft, ChevronRight, ArrowLeft, Users } from "lucide-react"
import Link from "next/link"
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, format } from "date-fns"
import { es } from "date-fns/locale"

type TimeFilter = "day" | "week" | "month"
const ITEMS_PER_PAGE = 15

export default function GrupoAsistenciasPage() {
  const params = useParams()
  const groupName = decodeURIComponent(params.nombre as string)
  
  const [groupData, setGroupData] = useState<GroupTracking | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("month")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    loadGroupData()
  }, [groupName])

  async function loadGroupData() {
    try {
      const tracking = await getGroupTracking()
      const group = tracking.find(g => g.groupName === groupName)
      setGroupData(group || null)
    } catch (error) {
      console.error("Error loading group data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getDateRange = (date: Date, filter: TimeFilter) => {
    switch (filter) {
      case "day":
        return {
          start: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          end: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59)
        }
      case "week":
        return {
          start: startOfWeek(date, { locale: es }),
          end: endOfWeek(date, { locale: es })
        }
      case "month":
        return {
          start: startOfMonth(date),
          end: endOfMonth(date)
        }
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navigation />
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-gray-600">Cargando asistencias...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!groupData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navigation />
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500">
                No se encontró información del grupo
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Filtrar participantes por fecha
  const filteredParticipants = selectedDate
    ? groupData.participants.filter(p => {
        const range = getDateRange(selectedDate, timeFilter)
        return isWithinInterval(new Date(p.lastAttendance), range)
      })
    : groupData.participants

  // Paginación
  const totalPages = Math.ceil(filteredParticipants.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentParticipants = filteredParticipants.slice(startIndex, endIndex)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link href="/estadisticas">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{groupName}</h1>
              <p className="text-gray-600 mt-1">Lista de asistencias del grupo</p>
            </div>
          </div>

          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros de Asistencia</CardTitle>
              <CardDescription>Filtra las asistencias por período de tiempo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Filtrar por:</span>
                  <Select value={timeFilter} onValueChange={(value: TimeFilter) => setTimeFilter(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Día</SelectItem>
                      <SelectItem value="week">Semana</SelectItem>
                      <SelectItem value="month">Mes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Fecha:</span>
                  <DatePicker
                    date={selectedDate}
                    onDateChange={setSelectedDate}
                    placeholder="Seleccionar fecha"
                  />
                </div>

                {selectedDate && (
                  <div className="text-sm text-gray-600">
                    Mostrando: {format(getDateRange(selectedDate, timeFilter).start, "PPP", { locale: es })}
                    {" - "}
                    {format(getDateRange(selectedDate, timeFilter).end, "PPP", { locale: es })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Estadísticas Rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Participantes</p>
                    <p className="text-2xl font-bold text-gray-900">{groupData.participants.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-full">
                    <Calendar className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Asistencias Filtradas</p>
                    <p className="text-2xl font-bold text-gray-900">{filteredParticipants.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Asistencias</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {groupData.participants.reduce((sum, p) => sum + p.totalCount, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabla de Asistencias */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Lista de Asistentes
              </CardTitle>
              <CardDescription>
                Mostrando {startIndex + 1}-{Math.min(endIndex, filteredParticipants.length)} de {filteredParticipants.length} asistentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentParticipants.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Participante</TableHead>
                          <TableHead className="text-center">Este Mes</TableHead>
                          <TableHead className="text-center">Total</TableHead>
                          <TableHead className="text-center">Última Asistencia</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentParticipants.map((participant) => (
                          <TableRow key={participant.userId}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback className="bg-blue-100 text-blue-700">
                                    {getInitials(participant.userName)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{participant.userName}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant="secondary"
                                className={`${
                                  participant.monthlyCount > 0 
                                    ? "bg-green-100 text-green-800" 
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {participant.monthlyCount}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant="default"
                                className={`${
                                  participant.totalCount >= 5
                                    ? "bg-blue-600 text-white"
                                    : participant.totalCount >= 3
                                      ? "bg-blue-500 text-white"
                                      : "bg-gray-600 text-white"
                                }`}
                              >
                                {participant.totalCount}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Calendar className="w-3 h-3 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  {new Date(participant.lastAttendance).toLocaleDateString("es-CO")}
                                </span>
                              </div>
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
                  No se encontraron asistentes para el período seleccionado
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

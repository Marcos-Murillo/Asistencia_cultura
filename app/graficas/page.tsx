"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, TrendingUp } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { DatePicker } from "@/components/ui/date-picker"
import { getAttendanceRecords } from "@/lib/storage"
import type { AttendanceRecord } from "@/lib/types"
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Line, LineChart } from "recharts"
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, isWithinInterval, eachDayOfInterval, isSameDay } from "date-fns"
import { es } from "date-fns/locale"

type TimeFilter = "day" | "week" | "month"

export default function GraficasPage() {
  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filtros para gráfica de tendencia
  const [trendTimeFilter, setTrendTimeFilter] = useState<TimeFilter>("month")
  const [trendSelectedDate, setTrendSelectedDate] = useState<Date | undefined>(new Date())
  
  // Filtros para gráfica de participación
  const [participationTimeFilter, setParticipationTimeFilter] = useState<TimeFilter>("month")
  const [participationSelectedDate, setParticipationSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedGroup, setSelectedGroup] = useState<string>("all")

  useEffect(() => {
    const loadStats = async () => {
      try {
        const records = await getAttendanceRecords()
        setAllRecords(records)
      } catch (error) {
        console.error("Error loading stats:", error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Navigation />
        <div className="p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-lg text-gray-600">Cargando gráficas...</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Función para filtrar datos por rango de fecha
  const getDateRange = (date: Date, filter: TimeFilter) => {
    switch (filter) {
      case "day":
        return {
          start: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          end: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59)
        }
      case "week":
        return {
          start: startOfWeek(date, { locale: es, weekStartsOn: 1 }),
          end: endOfWeek(date, { locale: es, weekStartsOn: 1 })
        }
      case "month":
        return {
          start: startOfMonth(date),
          end: endOfMonth(date)
        }
    }
  }

  // Preparar datos para gráfica de tendencia
  const getTrendData = () => {
    if (!trendSelectedDate) return []

    const range = getDateRange(trendSelectedDate, trendTimeFilter)
    const filteredRecords = allRecords.filter(record => 
      isWithinInterval(new Date(record.timestamp), range)
    )

    if (trendTimeFilter === "day") {
      // Para día: agrupar por grupo cultural
      const groupCounts: { [key: string]: number } = {}
      filteredRecords.forEach(record => {
        groupCounts[record.grupoCultural] = (groupCounts[record.grupoCultural] || 0) + 1
      })

      return Object.entries(groupCounts)
        .map(([grupo, count]) => ({
          label: grupo.length > 20 ? grupo.substring(0, 20) + "..." : grupo,
          labelCompleto: grupo,
          asistentes: count,
        }))
        .sort((a, b) => b.asistentes - a.asistentes)
        .slice(0, 10)
    } else if (trendTimeFilter === "week") {
      // Para semana: agrupar por día
      const days = eachDayOfInterval(range)
      return days.map(day => {
        const dayRecords = filteredRecords.filter(record => 
          isSameDay(new Date(record.timestamp), day)
        )
        return {
          label: format(day, "EEEE", { locale: es }),
          labelCompleto: format(day, "PPP", { locale: es }),
          asistentes: dayRecords.length,
        }
      })
    } else {
      // Para mes: agrupar por día del mes
      const days = eachDayOfInterval(range)
      return days.map(day => {
        const dayRecords = filteredRecords.filter(record => 
          isSameDay(new Date(record.timestamp), day)
        )
        return {
          label: format(day, "d", { locale: es }),
          labelCompleto: format(day, "PPP", { locale: es }),
          asistentes: dayRecords.length,
        }
      })
    }
  }

  // Preparar datos para gráfica de participación
  const getParticipationData = () => {
    if (!participationSelectedDate) return []

    const range = getDateRange(participationSelectedDate, participationTimeFilter)
    const filteredRecords = allRecords.filter(record => 
      isWithinInterval(new Date(record.timestamp), range)
    )

    if (participationTimeFilter === "day") {
      // Para día: agrupar por grupo cultural
      const groupCounts: { [key: string]: number } = {}
      filteredRecords.forEach(record => {
        if (selectedGroup === "all" || record.grupoCultural === selectedGroup) {
          groupCounts[record.grupoCultural] = (groupCounts[record.grupoCultural] || 0) + 1
        }
      })

      return Object.entries(groupCounts)
        .map(([grupo, count]) => ({
          label: grupo.length > 20 ? grupo.substring(0, 20) + "..." : grupo,
          labelCompleto: grupo,
          participantes: count,
        }))
        .sort((a, b) => b.participantes - a.participantes)
    } else if (participationTimeFilter === "week") {
      // Para semana: agrupar por día
      const days = eachDayOfInterval(range)
      return days.map(day => {
        const dayRecords = filteredRecords.filter(record => {
          const recordDate = new Date(record.timestamp)
          return isSameDay(recordDate, day) && 
            (selectedGroup === "all" || record.grupoCultural === selectedGroup)
        })
        return {
          label: format(day, "EEEE", { locale: es }),
          labelCompleto: format(day, "PPP", { locale: es }),
          participantes: dayRecords.length,
        }
      })
    } else {
      // Para mes: agrupar por día del mes
      const days = eachDayOfInterval(range)
      return days.map(day => {
        const dayRecords = filteredRecords.filter(record => {
          const recordDate = new Date(record.timestamp)
          return isSameDay(recordDate, day) && 
            (selectedGroup === "all" || record.grupoCultural === selectedGroup)
        })
        return {
          label: format(day, "d", { locale: es }),
          labelCompleto: format(day, "PPP", { locale: es }),
          participantes: dayRecords.length,
        }
      })
    }
  }

  const trendData = getTrendData()
  const participationData = getParticipationData()

  const chartConfig: ChartConfig = {
    participantes: {
      label: "Participantes",
      color: "#4FC0EB",
    },
    asistentes: {
      label: "Asistentes",
      color: "#7A56D0",
    },
  }

  const availableGroups = Array.from(new Set(allRecords.map(r => r.grupoCultural))).sort()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navigation />
      <div className="p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gráficas de Participación</h1>
              <p className="text-gray-600 mt-1">Visualización de asistencia a grupos culturales</p>
            </div>
          </div>

          {/* Gráfica de Tendencia */}
          <Card className="border-2 border-purple-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <TrendingUp className="w-5 h-5" />
                Tendencia de Participación
              </CardTitle>
              <CardDescription>Evolución del total de participantes en el tiempo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {/* Filtros de Tendencia */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-purple-900">Filtrar por:</span>
                  <Select value={trendTimeFilter} onValueChange={(value: TimeFilter) => setTrendTimeFilter(value)}>
                    <SelectTrigger className="w-32 border-purple-300">
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
                  <span className="text-sm font-medium text-purple-900">Fecha:</span>
                  <DatePicker
                    date={trendSelectedDate}
                    onDateChange={setTrendSelectedDate}
                    placeholder="Seleccionar fecha"
                  />
                </div>

                {trendSelectedDate && (
                  <div className="text-sm text-purple-700 font-medium">
                    {format(getDateRange(trendSelectedDate, trendTimeFilter).start, "PPP", { locale: es })}
                    {" - "}
                    {format(getDateRange(trendSelectedDate, trendTimeFilter).end, "PPP", { locale: es })}
                  </div>
                )}
              </div>

              {trendData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    {trendTimeFilter === "day" ? (
                      <BarChart data={trendData} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" stroke="#E9D5FF" />
                        <XAxis type="number" stroke="#7A56D0" />
                        <YAxis 
                          type="category" 
                          dataKey="label" 
                          width={150} 
                          tick={{ fontSize: 12, fill: "#7A56D0" }} 
                        />
                        <ChartTooltip
                          content={<ChartTooltipContent />}
                          labelFormatter={(value, payload) => {
                            const item = payload?.[0]?.payload
                            return item?.labelCompleto || value
                          }}
                        />
                        <Bar dataKey="asistentes" fill="#7A56D0" radius={[0, 8, 8, 0]} />
                      </BarChart>
                    ) : (
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E9D5FF" />
                        <XAxis
                          dataKey="label"
                          stroke="#7A56D0"
                          tick={{ fontSize: 12, fill: "#7A56D0" }}
                        />
                        <YAxis stroke="#7A56D0" />
                        <ChartTooltip
                          content={<ChartTooltipContent />}
                          labelFormatter={(value, payload) => {
                            const item = payload?.[0]?.payload
                            return item?.labelCompleto || value
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="asistentes"
                          stroke="#7A56D0"
                          strokeWidth={3}
                          dot={{ fill: "#7A56D0", strokeWidth: 2, r: 5 }}
                        />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 text-purple-300" />
                  <p className="text-lg font-medium">No hay datos disponibles</p>
                  <p className="text-sm">No hay registros para el rango de fecha seleccionado</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gráfica de Participación Total */}
          <Card className="border-2 border-cyan-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50">
              <CardTitle className="flex items-center gap-2 text-cyan-900">
                <BarChart3 className="w-5 h-5" />
                Participación Total por Grupo Cultural
              </CardTitle>
              <CardDescription>Número de participantes por grupo cultural</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {/* Filtros de Participación */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-200 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-cyan-900">Grupo:</span>
                  <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                    <SelectTrigger className="w-48 border-cyan-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los grupos</SelectItem>
                      {availableGroups.map((group) => (
                        <SelectItem key={group} value={group}>
                          {group.length > 40 ? group.substring(0, 40) + "..." : group}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-cyan-900">Filtrar por:</span>
                  <Select value={participationTimeFilter} onValueChange={(value: TimeFilter) => setParticipationTimeFilter(value)}>
                    <SelectTrigger className="w-32 border-cyan-300">
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
                  <span className="text-sm font-medium text-cyan-900">Fecha:</span>
                  <DatePicker
                    date={participationSelectedDate}
                    onDateChange={setParticipationSelectedDate}
                    placeholder="Seleccionar fecha"
                  />
                </div>

                {participationSelectedDate && (
                  <div className="text-sm text-cyan-700 font-medium w-full sm:w-auto">
                    {format(getDateRange(participationSelectedDate, participationTimeFilter).start, "PPP", { locale: es })}
                    {" - "}
                    {format(getDateRange(participationSelectedDate, participationTimeFilter).end, "PPP", { locale: es })}
                  </div>
                )}
              </div>

              {participationData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[500px]">
                  <ResponsiveContainer width="100%" height="100%">
                    {participationTimeFilter === "day" ? (
                      <BarChart data={participationData} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" stroke="#CFFAFE" />
                        <XAxis type="number" stroke="#0891B2" />
                        <YAxis 
                          type="category" 
                          dataKey="label" 
                          width={150} 
                          tick={{ fontSize: 12, fill: "#0891B2" }} 
                        />
                        <ChartTooltip
                          content={<ChartTooltipContent />}
                          labelFormatter={(value, payload) => {
                            const item = payload?.[0]?.payload
                            return item?.labelCompleto || value
                          }}
                        />
                        <Bar dataKey="participantes" fill="#4FC0EB" radius={[0, 8, 8, 0]} />
                      </BarChart>
                    ) : (
                      <LineChart data={participationData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#CFFAFE" />
                        <XAxis
                          dataKey="label"
                          stroke="#0891B2"
                          tick={{ fontSize: 12, fill: "#0891B2" }}
                        />
                        <YAxis stroke="#0891B2" />
                        <ChartTooltip
                          content={<ChartTooltipContent />}
                          labelFormatter={(value, payload) => {
                            const item = payload?.[0]?.payload
                            return item?.labelCompleto || value
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="participantes"
                          stroke="#4FC0EB"
                          strokeWidth={3}
                          dot={{ fill: "#4FC0EB", strokeWidth: 2, r: 5 }}
                        />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-cyan-300" />
                  <p className="text-lg font-medium">No hay datos disponibles</p>
                  <p className="text-sm">No hay registros para los filtros seleccionados</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">
                    {availableGroups.length}
                  </p>
                  <p className="text-sm text-gray-600 font-medium">Grupos Activos</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">
                    {allRecords.length}
                  </p>
                  <p className="text-sm text-gray-600 font-medium">Total Asistencias</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-600">
                    {new Set(allRecords.map(r => r.numeroDocumento)).size}
                  </p>
                  <p className="text-sm text-gray-600 font-medium">Participantes Únicos</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

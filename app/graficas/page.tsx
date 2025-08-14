"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, Calendar, TrendingUp } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { generateStats } from "@/lib/storage"
import type { AttendanceStats } from "@/lib/types"
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Line, LineChart } from "recharts"

export default function GraficasPage() {
  const [stats, setStats] = useState<AttendanceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"total" | "monthly">("total")
  const [selectedMonth, setSelectedMonth] = useState<string>("")

  useEffect(() => {
    const loadStats = async () => {
      try {
        const generatedStats = await generateStats()
        setStats(generatedStats)

        // Set default month to the latest available
        const months = Object.keys(generatedStats.byMonth).sort()
        if (months.length > 0) {
          setSelectedMonth(months[months.length - 1])
        }
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

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Navigation />
        <div className="p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-lg text-gray-600">Error al cargar las gráficas</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Prepare data for total view
  const totalData = Object.entries(stats.byCulturalGroup)
    .map(([grupo, count]) => ({
      grupo: grupo.length > 30 ? grupo.substring(0, 30) + "..." : grupo,
      grupoCompleto: grupo,
      participantes: count,
    }))
    .sort((a, b) => b.participantes - a.participantes)

  // Prepare data for monthly view
  const monthlyData =
    selectedMonth && stats.byMonth[selectedMonth]
      ? Object.entries(stats.byMonth[selectedMonth])
          .map(([grupo, count]) => ({
            grupo: grupo.length > 30 ? grupo.substring(0, 30) + "..." : grupo,
            grupoCompleto: grupo,
            participantes: count,
          }))
          .sort((a, b) => b.participantes - a.participantes)
      : []

  // Prepare data for monthly trend
  const monthlyTrendData = Object.entries(stats.byMonth)
    .map(([month, groups]) => ({
      mes: month,
      total: Object.values(groups).reduce((sum, count) => sum + count, 0),
    }))
    .sort((a, b) => a.mes.localeCompare(b.mes))

  const chartConfig: ChartConfig = {
    participantes: {
      label: "Participantes",
      color: "hsl(var(--chart-1))",
    },
    total: {
      label: "Total",
      color: "hsl(var(--chart-2))",
    },
  }

  const availableMonths = Object.keys(stats.byMonth).sort()

  const formatMonthName = (monthKey: string) => {
    const [year, month] = monthKey.split("-")
    const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1)
    return date.toLocaleDateString("es-ES", { year: "numeric", month: "long" })
  }

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
            {/* Removed the Link component as it's not needed with the Navigation component */}
          </div>

          {/* Controls */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">Vista:</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === "total" ? "default" : "outline"}
                    onClick={() => setViewMode("total")}
                    size="sm"
                  >
                    Total General
                  </Button>
                  <Button
                    variant={viewMode === "monthly" ? "default" : "outline"}
                    onClick={() => setViewMode("monthly")}
                    size="sm"
                  >
                    Por Mes
                  </Button>
                </div>

                {viewMode === "monthly" && availableMonths.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Seleccionar mes" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableMonths.map((month) => (
                          <SelectItem key={month} value={month}>
                            {formatMonthName(month)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Monthly Trend Chart */}
          {monthlyTrendData.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Tendencia de Participación por Mes
                </CardTitle>
                <CardDescription>Evolución del total de participantes a lo largo del tiempo</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="mes"
                        tickFormatter={(value) => formatMonthName(value)}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis />
                      <ChartTooltip
                        content={<ChartTooltipContent />}
                        labelFormatter={(value) => formatMonthName(value as string)}
                      />
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="var(--color-total)"
                        strokeWidth={3}
                        dot={{ fill: "var(--color-total)", strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Main Chart */}
          <Card>
            <CardHeader>
              <CardTitle>
                {viewMode === "total"
                  ? "Participación Total por Grupo Cultural"
                  : `Participación en ${formatMonthName(selectedMonth)}`}
              </CardTitle>
              <CardDescription>
                {viewMode === "total"
                  ? "Número total de participantes por grupo cultural desde el inicio"
                  : "Número de participantes por grupo cultural en el mes seleccionado"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(viewMode === "total" ? totalData : monthlyData).length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[600px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={viewMode === "total" ? totalData : monthlyData}
                      layout="horizontal"
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="grupo" width={200} tick={{ fontSize: 12 }} />
                      <ChartTooltip
                        content={<ChartTooltipContent />}
                        labelFormatter={(value, payload) => {
                          const item = payload?.[0]?.payload
                          return item?.grupoCompleto || value
                        }}
                      />
                      <Bar dataKey="participantes" fill="var(--color-participantes)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No hay datos disponibles</p>
                  <p className="text-sm">
                    {viewMode === "monthly"
                      ? "No hay registros para el mes seleccionado"
                      : "No hay registros de asistencia"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {viewMode === "total" ? Object.keys(stats.byCulturalGroup).length : Object.keys(monthlyData).length}
                  </p>
                  <p className="text-sm text-gray-600">Grupos Activos</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {viewMode === "total"
                      ? Math.max(...Object.values(stats.byCulturalGroup), 0)
                      : selectedMonth && stats.byMonth[selectedMonth]
                        ? Math.max(...Object.values(stats.byMonth[selectedMonth]), 0)
                        : 0}
                  </p>
                  <p className="text-sm text-gray-600">Máximo por Grupo</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {viewMode === "total"
                      ? stats.totalParticipants
                      : selectedMonth && stats.byMonth[selectedMonth]
                        ? Object.values(stats.byMonth[selectedMonth]).reduce((sum, count) => sum + count, 0)
                        : 0}
                  </p>
                  <p className="text-sm text-gray-600">Total Participantes</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

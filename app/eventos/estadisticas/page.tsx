"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Navigation } from "@/components/navigation"
import { getEventStats } from "@/lib/firestore"
import type { EventStats } from "@/lib/types"
import { Users, Calendar } from "lucide-react"

export default function EventStatisticsPage() {
  const [stats, setStats] = useState<EventStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      setLoading(true)
      const eventStats = await getEventStats()
      setStats(eventStats)
    } catch (error) {
      console.error("Error cargando estadísticas de eventos:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando estadísticas...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500">No hay estadísticas disponibles</div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Navigation />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Estadísticas de Eventos</h1>
          <p className="text-gray-600 mt-2">Análisis detallado de participación en eventos especiales</p>
        </div>

        {/* Resumen general */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Participantes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.totalParticipants}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Mujeres</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-pink-600">{stats.byGender.mujer}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Hombres</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.byGender.hombre}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Otro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{stats.byGender.otro}</div>
            </CardContent>
          </Card>
        </div>

        {/* Participantes por Evento */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Participantes por Evento
            </CardTitle>
            <CardDescription>Número de asistentes a cada evento</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(stats.byEvent).length === 0 ? (
              <p className="text-center text-gray-500 py-8">No hay eventos con asistencias registradas</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(stats.byEvent)
                  .sort((a, b) => b[1] - a[1])
                  .map(([evento, count]) => (
                    <div key={evento} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-900">{evento}</span>
                      <Badge variant="secondary" className="text-lg px-3 py-1">
                        {count}
                      </Badge>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Participantes por Programa Académico */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Participantes por Programa Académico
            </CardTitle>
            <CardDescription>Distribución por género y programa</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(stats.byProgram).length === 0 ? (
              <p className="text-center text-gray-500 py-8">No hay programas académicos registrados</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Programa Académico</th>
                      <th className="text-center py-3 px-4 font-semibold text-pink-600">Mujer</th>
                      <th className="text-center py-3 px-4 font-semibold text-blue-600">Hombre</th>
                      <th className="text-center py-3 px-4 font-semibold text-purple-600">Otro</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(stats.byProgram)
                      .sort((a, b) => b[1].total - a[1].total)
                      .map(([programa, data]) => (
                        <tr key={programa} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 text-gray-900">{programa}</td>
                          <td className="text-center py-3 px-4">
                            <Badge variant="secondary" className="bg-pink-100 text-pink-700">
                              {data.mujer}
                            </Badge>
                          </td>
                          <td className="text-center py-3 px-4">
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                              {data.hombre}
                            </Badge>
                          </td>
                          <td className="text-center py-3 px-4">
                            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                              {data.otro}
                            </Badge>
                          </td>
                          <td className="text-center py-3 px-4">
                            <Badge variant="default">{data.total}</Badge>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Participantes por Facultad */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Participantes por Facultad
            </CardTitle>
            <CardDescription>Distribución por género y facultad</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(stats.byFaculty).length === 0 ? (
              <p className="text-center text-gray-500 py-8">No hay facultades registradas</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Facultad</th>
                      <th className="text-center py-3 px-4 font-semibold text-pink-600">Mujer</th>
                      <th className="text-center py-3 px-4 font-semibold text-blue-600">Hombre</th>
                      <th className="text-center py-3 px-4 font-semibold text-purple-600">Otro</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(stats.byFaculty)
                      .sort((a, b) => b[1].total - a[1].total)
                      .map(([facultad, data]) => (
                        <tr key={facultad} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 text-gray-900">{facultad}</td>
                          <td className="text-center py-3 px-4">
                            <Badge variant="secondary" className="bg-pink-100 text-pink-700">
                              {data.mujer}
                            </Badge>
                          </td>
                          <td className="text-center py-3 px-4">
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                              {data.hombre}
                            </Badge>
                          </td>
                          <td className="text-center py-3 px-4">
                            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                              {data.otro}
                            </Badge>
                          </td>
                          <td className="text-center py-3 px-4">
                            <Badge variant="default">{data.total}</Badge>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

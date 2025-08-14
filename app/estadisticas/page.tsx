"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Users, GraduationCap, Building2 } from "lucide-react"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { GroupTrackingComponent } from "@/components/group-traking"
import { generateStats } from "@/lib/storage"
import type { AttendanceStats } from "@/lib/types"

export default function EstadisticasPage() {
  const [stats, setStats] = useState<AttendanceStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const generatedStats = await generateStats()
        setStats(generatedStats)
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
              <div className="text-lg text-gray-600">Cargando estadísticas...</div>
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
              <div className="text-lg text-gray-600">Error al cargar las estadísticas</div>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Estadísticas de Asistencia</h1>
              <p className="text-gray-600 mt-1">Grupos Culturales - Universidad del Valle</p>
            </div>
            <Link href="/">
              <button className="flex items-center gap-2 bg-transparent border border-gray-300 rounded px-4 py-2 text-gray-600 hover:bg-gray-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                >
                  <path d="M19 12H5M12 19l-7-7m7 7l7-7"></path>
                </svg>
                Volver al Registro
              </button>
            </Link>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Participantes</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalParticipants}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-pink-500 rounded-full" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Mujeres</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.byGender.mujer}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-blue-500 rounded-full" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Hombres</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.byGender.hombre}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-purple-500 rounded-full" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Otro</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.byGender.otro}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Programs Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Asistencias por Programa Académico
              </CardTitle>
              <CardDescription>Distribución de participantes por programa académico y género</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(stats.byProgram).length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[300px]">Programa Académico</TableHead>
                        <TableHead className="text-center">Mujer</TableHead>
                        <TableHead className="text-center">Hombre</TableHead>
                        <TableHead className="text-center">Otro</TableHead>
                        <TableHead className="text-center font-semibold">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(stats.byProgram)
                        .sort(([, a], [, b]) => b.total - a.total)
                        .map(([programa, data]) => (
                          <TableRow key={programa}>
                            <TableCell className="font-medium">{programa}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className="bg-pink-100 text-pink-800">
                                {data.mujer}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                {data.hombre}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                                {data.otro}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="default" className="bg-gray-800 text-white">
                                {data.total}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No hay datos de programas académicos disponibles</div>
              )}
            </CardContent>
          </Card>

          {/* Faculties Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Asistencias por Facultad
              </CardTitle>
              <CardDescription>Distribución de participantes por facultad y género</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(stats.byFaculty).length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[300px]">Facultad</TableHead>
                        <TableHead className="text-center">Mujer</TableHead>
                        <TableHead className="text-center">Hombre</TableHead>
                        <TableHead className="text-center">Otro</TableHead>
                        <TableHead className="text-center font-semibold">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(stats.byFaculty)
                        .sort(([, a], [, b]) => b.total - a.total)
                        .map(([facultad, data]) => (
                          <TableRow key={facultad}>
                            <TableCell className="font-medium">{facultad}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className="bg-pink-100 text-pink-800">
                                {data.mujer}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                {data.hombre}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                                {data.otro}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="default" className="bg-gray-800 text-white">
                                {data.total}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No hay datos de facultades disponibles</div>
              )}
            </CardContent>
          </Card>

          {/* Cultural Groups Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen por Grupo Cultural</CardTitle>
              <CardDescription>Número total de asistentes por grupo cultural</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(stats.byCulturalGroup).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(stats.byCulturalGroup)
                    .sort(([, a], [, b]) => b - a)
                    .map(([grupo, count]) => (
                      <div key={grupo} className="p-4 bg-white rounded-lg border">
                        <h4 className="font-medium text-sm text-gray-900 mb-2 line-clamp-2">{grupo}</h4>
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold text-blue-600">{count}</span>
                          <Badge variant="outline">participantes</Badge>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No hay datos de grupos culturales disponibles</div>
              )}
            </CardContent>
          </Card>

          {/* Group Tracking Component */}
          <GroupTrackingComponent />
        </div>
      </div>
    </div>
  )
}

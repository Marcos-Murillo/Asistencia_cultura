"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Navigation } from "@/components/navigation"
import { Users, Eye, Music } from "lucide-react"
import Link from "next/link"
import { getAllGroupsWithEnrollments } from "@/lib/firestore"
import { GRUPOS_CULTURALES } from "@/lib/data"
import type { GroupWithEnrollments } from "@/lib/types"

export default function GruposPage() {
  const [groups, setGroups] = useState<GroupWithEnrollments[]>([])
  const [loading, setLoading] = useState(true)

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
    } catch (error) {
      console.error("Error cargando grupos:", error)
    } finally {
      setLoading(false)
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
                      <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groups.map((group) => (
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
                          <Link href={`/grupos/${encodeURIComponent(group.nombre)}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Grupo
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

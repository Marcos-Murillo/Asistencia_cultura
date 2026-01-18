"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Navigation } from "@/components/navigation"
import { Users, Eye, Music, Palette, Theater, Mic2 } from "lucide-react"
import Link from "next/link"
import { getAllGroupsWithEnrollments } from "@/lib/firestore"
import { GRUPOS_CULTURALES } from "@/lib/data"
import type { GroupWithEnrollments } from "@/lib/types"

// Iconos para diferentes tipos de grupos
const getGroupIcon = (groupName: string) => {
  const name = groupName.toLowerCase()
  if (name.includes("danza") || name.includes("ballet") || name.includes("folclor")) {
    return <Theater className="h-8 w-8" />
  }
  if (name.includes("música") || name.includes("orquesta") || name.includes("coro") || name.includes("estudiantina")) {
    return <Music className="h-8 w-8" />
  }
  if (name.includes("teatro") || name.includes("títeres")) {
    return <Mic2 className="h-8 w-8" />
  }
  if (name.includes("arte") || name.includes("plásticas")) {
    return <Palette className="h-8 w-8" />
  }
  return <Users className="h-8 w-8" />
}

// Colores para las cards
const cardColors = [
  "from-blue-500 to-blue-600",
  "from-purple-500 to-purple-600",
  "from-green-500 to-green-600",
  "from-orange-500 to-orange-600",
  "from-pink-500 to-pink-600",
  "from-teal-500 to-teal-600",
  "from-indigo-500 to-indigo-600",
  "from-rose-500 to-rose-600",
  "from-cyan-500 to-cyan-600",
  "from-amber-500 to-amber-600",
]

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Grupos Culturales</h1>
          <p className="text-gray-600 mt-2">Gestión de inscripciones a grupos culturales</p>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
                  <Theater className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Grupos</p>
                  <p className="text-2xl font-bold text-gray-900">{groups.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grid de Grupos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group, index) => (
            <Card 
              key={group.nombre} 
              className="overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className={`bg-gradient-to-r ${cardColors[index % cardColors.length]} p-4 text-white`}>
                <div className="flex items-center justify-between">
                  {getGroupIcon(group.nombre)}
                  <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
                    {group.totalInscritos} inscritos
                  </Badge>
                </div>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg line-clamp-2">{group.nombre}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Users className="h-4 w-4" />
                    <span>{group.totalInscritos} personas inscritas</span>
                  </div>
                  <Link href={`/grupos/${encodeURIComponent(group.nombre)}`}>
                    <Button variant="outline" size="sm" className="bg-transparent">
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Grupo
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

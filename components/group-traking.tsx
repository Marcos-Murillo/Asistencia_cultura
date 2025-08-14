"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Calendar, Users, TrendingUp } from "lucide-react"
import { getGroupTracking } from "@/lib/firestore"
import type { GroupTracking } from "@/lib/types"

export function GroupTrackingComponent() {
  const [groupTracking, setGroupTracking] = useState<GroupTracking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadGroupTracking = async () => {
      try {
        const tracking = await getGroupTracking()
        setGroupTracking(tracking)
      } catch (error) {
        console.error("Error loading group tracking:", error)
      } finally {
        setLoading(false)
      }
    }

    loadGroupTracking()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Seguimiento de Grupos Culturales
          </CardTitle>
          <CardDescription>Cargando datos de seguimiento...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-500">Cargando...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (groupTracking.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Seguimiento de Grupos Culturales
          </CardTitle>
          <CardDescription>Asistencia detallada por participante en cada grupo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">No hay datos de seguimiento disponibles</div>
        </CardContent>
      </Card>
    )
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Seguimiento de Grupos Culturales
        </CardTitle>
        <CardDescription>Asistencia detallada por participante en cada grupo - Mes actual vs Total</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {groupTracking.map((group) => (
          <div key={group.groupName} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{group.groupName}</h3>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {group.participants.length} participante{group.participants.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {group.participants.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Participante</TableHead>
                      <TableHead className="text-center">Este Mes</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-center">Última Asistencia</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.participants.map((participant) => (
                      <TableRow key={participant.userId}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
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
                              participant.monthlyCount > 0 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
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
                            <span className="text-sm text-gray-600">{formatDate(participant.lastAttendance)}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                No hay participantes registrados en este grupo
              </div>
            )}

            {/* Summary for this group */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <p className="text-sm text-gray-600">Participantes Activos (Este Mes)</p>
                <p className="text-xl font-bold text-green-600">
                  {group.participants.filter((p) => p.monthlyCount > 0).length}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Asistencias Este Mes</p>
                <p className="text-xl font-bold text-blue-600">
                  {group.participants.reduce((sum, p) => sum + p.monthlyCount, 0)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Asistencias Totales</p>
                <p className="text-xl font-bold text-gray-800">
                  {group.participants.reduce((sum, p) => sum + p.totalCount, 0)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

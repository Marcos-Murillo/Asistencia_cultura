"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { TrendingUp, TrendingDown, Minus, Eye, Music } from "lucide-react"
import { getGroupTracking } from "@/lib/firestore"
import type { GroupTracking } from "@/lib/types"
import Link from "next/link"

export function GroupTrackingTable() {
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
            <Music className="w-5 h-5" />
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
            <Music className="w-5 h-5" />
            Seguimiento de Grupos Culturales
          </CardTitle>
          <CardDescription>Resumen de asistencia por grupo</CardDescription>
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

  // Calcular asistencia de la última semana vs semana anterior
  const getWeeklyTrend = (participants: GroupTracking["participants"]) => {
    const now = new Date()
    const lastWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const twoWeeksAgoStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    let lastWeekCount = 0
    let previousWeekCount = 0

    participants.forEach((p) => {
      const lastAttendance = new Date(p.lastAttendance)
      
      if (lastAttendance >= lastWeekStart) {
        lastWeekCount++
      } else if (lastAttendance >= twoWeeksAgoStart && lastAttendance < lastWeekStart) {
        previousWeekCount++
      }
    })

    return {
      current: lastWeekCount,
      previous: previousWeekCount,
      trend: lastWeekCount > previousWeekCount ? "up" : lastWeekCount < previousWeekCount ? "down" : "stable"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="w-5 h-5" />
          Seguimiento de Grupos Culturales
        </CardTitle>
        <CardDescription>Resumen de asistencia y tendencias por grupo</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Grupo</TableHead>
                <TableHead className="text-center">Total Asistentes</TableHead>
                <TableHead className="text-center">Asistencia Última Semana</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupTracking.map((group) => {
                const weeklyTrend = getWeeklyTrend(group.participants)
                const totalParticipants = group.participants.length

                return (
                  <TableRow key={group.groupName}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-purple-100 text-purple-700">
                            {getInitials(group.groupName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{group.groupName}</div>
                          <div className="text-sm text-gray-500">
                            {group.participants.reduce((sum, p) => sum + p.totalCount, 0)} asistencias totales
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-base">
                        {totalParticipants}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Badge
                          variant="secondary"
                          className={`text-base ${
                            weeklyTrend.trend === "up"
                              ? "bg-green-100 text-green-800"
                              : weeklyTrend.trend === "down"
                                ? "bg-red-100 text-red-800"
                                : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {weeklyTrend.current}
                        </Badge>
                        {weeklyTrend.trend === "up" && (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        )}
                        {weeklyTrend.trend === "down" && (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                        {weeklyTrend.trend === "stable" && (
                          <Minus className="h-4 w-4 text-purple-600" />
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {weeklyTrend.trend === "up" && `+${weeklyTrend.current - weeklyTrend.previous} vs semana anterior`}
                        {weeklyTrend.trend === "down" && `${weeklyTrend.current - weeklyTrend.previous} vs semana anterior`}
                        {weeklyTrend.trend === "stable" && "Sin cambios"}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Link href={`/grupos/${encodeURIComponent(group.groupName)}/asistencias`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Asistentes
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

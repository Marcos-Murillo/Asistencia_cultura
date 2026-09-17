"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { listFisioterapeutas, listSolicitudes } from "@/lib/fisioterapia"
import { useFisioActor } from "@/lib/fisioterapia-session"
import type { FisioterapiaSolicitud, UserProfile } from "@/lib/types"

export default function FisioterapeutasPage() {
  const router = useRouter()
  const actor = useFisioActor()
  const [fisios, setFisios] = useState<UserProfile[]>([])
  const [solicitudes, setSolicitudes] = useState<FisioterapiaSolicitud[]>([])

  useEffect(() => {
    if (actor?.kind === "fisioterapeuta" && !actor.esEncargado) {
      router.replace("/fisioterapia")
    }
  }, [actor, router])

  useEffect(() => {
    if (!actor) return
    Promise.all([listFisioterapeutas(), listSolicitudes(actor)]).then(([f, s]) => {
      setFisios(f)
      setSolicitudes(s)
    })
  }, [actor])

  if (!actor || actor.kind !== "fisioterapeuta" || !actor.esEncargado) return null

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Fisioterapeutas</h1>
        <p className="text-sm text-slate-500">Equipo clínico del área de deporte.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {fisios.map((user) => {
          const assigned = solicitudes.filter((item) => item.fisioterapeutaId === user.id && item.estado !== "Realizada" && item.estado !== "Cancelada")
          return (
            <Card key={user.id}>
              <CardHeader>
                <CardTitle className="text-base">{user.nombres}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-slate-600">{user.correo}</p>
                {user.esFisioterapeutaEncargado ? (
                  <Badge className="bg-teal-800">Encargado</Badge>
                ) : (
                  <Badge variant="secondary">Fisioterapeuta</Badge>
                )}
                <p>{assigned.length} actividades activas</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

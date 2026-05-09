"use client"

import { useParams } from "next/navigation"
import { GroupAttendanceReport } from "@/components/group-attendance-report"
import { useArea } from "@/contexts/area-context"

export default function GrupoAsistenciasPage() {
  const params = useParams()
  const groupName = decodeURIComponent(params.nombre as string)
  const { area } = useArea()

  return <GroupAttendanceReport groupName={groupName} area={area} />
}

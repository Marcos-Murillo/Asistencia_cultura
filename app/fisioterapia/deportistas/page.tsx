"use client"

import { useEffect, useMemo, useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Combobox } from "@/components/ui/combobox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getAllUsers, getAllGroupEnrollments, listDeportiveGroups } from "@/lib/db-router"
import { listBitacora } from "@/lib/fisioterapia"
import { useFisioActor } from "@/lib/fisioterapia-session"
import { AthleteHistoryDrawer } from "@/components/fisioterapia/athlete-history-drawer"
import { lastAtencionLabel } from "@/components/fisioterapia/hover-entities"
import { CompactGroupButton, MobileRecordCard } from "@/components/fisioterapia/compact-filters"
import type { FisioterapiaBitacora, UserProfile } from "@/lib/types"

export default function DeportistasPage() {
  const actor = useFisioActor()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [enrollments, setEnrollments] = useState<Array<{ userId: string; grupoCultural: string }>>([])
  const [groups, setGroups] = useState<string[]>([])
  const [bitacora, setBitacora] = useState<FisioterapiaBitacora[]>([])
  const [q, setQ] = useState("")
  const [grupo, setGrupo] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    if (!actor) return
    Promise.all([
      getAllUsers("deporte"),
      getAllGroupEnrollments("deporte"),
      listDeportiveGroups(),
      listBitacora(actor),
    ]).then(([u, e, g, b]) => {
      setUsers(u.filter((item) => item.rol !== "FISIOTERAPEUTA" && item.rol !== "SUPER_ADMIN"))
      setEnrollments(e)
      setGroups(g.map((item) => item.nombre))
      setBitacora(b)
    })
  }, [actor])

  const filtered = useMemo(() => {
    return users.filter((user) => {
      if (q && !user.nombres.toLowerCase().includes(q.toLowerCase()) && !user.numeroDocumento.includes(q)) return false
      if (grupo) {
        const inGroup = enrollments.some((item) => item.userId === user.id && item.grupoCultural === grupo)
        if (!inGroup) return false
      }
      return true
    })
  }, [users, q, grupo, enrollments])

  if (!actor) return null

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Deportistas</h1>
        <p className="text-sm text-slate-500">
          {groups.length} grupos conectados desde la base de datos. Solo lectura del perfil.
        </p>
      </div>
      <div className="flex min-w-0 items-center gap-1.5 md:hidden">
        <CompactGroupButton
          groups={groups.map((name) => ({ value: name, label: name }))}
          value={grupo}
          onChange={setGrupo}
        />
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-slate-400" />
          <Input className="h-8 pl-7 text-xs" placeholder="Buscar" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      <div className="hidden gap-3 md:grid md:grid-cols-2">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
          <Input className="h-11 pl-8" placeholder="Buscar por nombre o documento" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Combobox
          options={[{ value: "", label: "Todos los grupos" }, ...groups.map((name) => ({ value: name, label: name }))]}
          value={grupo}
          onValueChange={setGrupo}
        />
      </div>
      <div className="space-y-1.5 md:hidden">
        {filtered.slice(0, 80).map((user) => {
          const userGroups = enrollments.filter((item) => item.userId === user.id).map((item) => item.grupoCultural)
          return (
            <MobileRecordCard
              key={user.id}
              title={userGroups[0] || user.nombres}
              subtitle={user.nombres}
              onClick={() => setSelectedId(user.id)}
            />
          )
        })}
      </div>
      <div className="hidden overflow-hidden rounded-md border bg-white md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Grupos</TableHead>
              <TableHead>Última atención</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.slice(0, 80).map((user) => {
              const userGroups = enrollments.filter((item) => item.userId === user.id).map((item) => item.grupoCultural)
              return (
                <TableRow key={user.id} className="cursor-pointer" onClick={() => setSelectedId(user.id)}>
                  <TableCell className="font-medium">{user.nombres}</TableCell>
                  <TableCell>{user.numeroDocumento}</TableCell>
                  <TableCell className="max-w-xs truncate">{userGroups.join(", ") || "—"}</TableCell>
                  <TableCell>{lastAtencionLabel(bitacora, user.id) || "—"}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      <AthleteHistoryDrawer
        open={Boolean(selectedId)}
        onOpenChange={(v) => !v && setSelectedId(null)}
        actor={actor}
        deportistaId={selectedId}
      />
    </div>
  )
}

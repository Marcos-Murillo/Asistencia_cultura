"use client"

import { useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Crown, Users2, Award } from "lucide-react"

interface TeamMember {
  id: string
  nombres: string
  rol: "DIRECTOR" | "MONITOR"
  numeroDocumento: string
  correo?: string
  programaAcademico?: string
  facultad?: string
  categoria?: "SEMILLERO" | "PROCESO" | "REPRESENTATIVO"
  area?: 'cultura' | 'deporte'
  codigoEstudiantil?: string
}

interface TeamHierarchyProps {
  grupo: string
  director?: TeamMember
  semillero: TeamMember[]
  proceso: TeamMember[]
  representativo: TeamMember[]
  onMemberMove?: (memberId: string, newCategory: string) => void
}

export function TeamHierarchyDiagram({
  grupo,
  director,
  semillero,
  proceso,
  representativo,
  onMemberMove,
}: TeamHierarchyProps) {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [draggedMember, setDraggedMember] = useState<string | null>(null)

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const handleDragStart = (memberId: string) => {
    setDraggedMember(memberId)
  }

  const handleDrop = (category: string) => {
    if (draggedMember && onMemberMove) {
      onMemberMove(draggedMember, category)
    }
    setDraggedMember(null)
  }

  const MemberAvatar = ({ member, draggable = false }: { member: TeamMember; draggable?: boolean }) => (
    <div
      className={`flex flex-col items-center gap-2 ${draggable ? "cursor-move" : "cursor-pointer"}`}
      draggable={draggable}
      onDragStart={() => draggable && handleDragStart(member.id)}
      onClick={() => setSelectedMember(member)}
    >
      <Avatar className="w-16 h-16 border-2 border-white shadow-lg hover:scale-110 transition-transform">
        <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-500 text-white font-semibold">
          {getInitials(member.nombres)}
        </AvatarFallback>
      </Avatar>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-900">{member.nombres.split(" ")[0]}</p>
        <p className="text-xs text-gray-500">{member.nombres.split(" ").slice(1).join(" ")}</p>
      </div>
    </div>
  )

  const CategorySection = ({
    title,
    icon: Icon,
    color,
    members,
    category,
  }: {
    title: string
    icon: any
    color: string
    members: TeamMember[]
    category: string
  }) => (
    <div
      className={`relative p-6 rounded-2xl ${color} min-h-[200px]`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => handleDrop(category)}
    >
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5" />
        <h3 className="font-semibold text-lg">{title}</h3>
        <Badge variant="secondary" className="ml-auto">
          {members.length}
        </Badge>
      </div>
      <div className="flex flex-wrap gap-4 justify-center">
        {members.map((member) => (
          <MemberAvatar key={member.id} member={member} draggable />
        ))}
        {members.length === 0 && (
          <p className="text-sm text-gray-500 italic">Sin monitores asignados</p>
        )}
      </div>
    </div>
  )

  return (
    <div className="relative">
      {/* Director en el centro superior */}
      <div className="flex flex-col items-center mb-8">
        <Badge className="mb-4 bg-yellow-500">
          <Crown className="w-3 h-3 mr-1" />
          CEO / Director
        </Badge>
        {director ? (
          <MemberAvatar member={director} />
        ) : (
          <div className="text-center text-gray-500">
            <p className="text-sm">Sin director asignado</p>
          </div>
        )}
      </div>

      {/* Línea conectora */}
      <div className="flex justify-center mb-8">
        <div className="w-px h-12 bg-gradient-to-b from-gray-300 to-transparent"></div>
      </div>

      {/* Categorías en grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CategorySection
          title="Semillero"
          icon={Users2}
          color="bg-red-50 border-2 border-red-200"
          members={semillero}
          category="SEMILLERO"
        />
        <CategorySection
          title="Proceso"
          icon={Users2}
          color="bg-green-50 border-2 border-green-200"
          members={proceso}
          category="PROCESO"
        />
        <CategorySection
          title="Representativo"
          icon={Award}
          color="bg-yellow-50 border-2 border-yellow-200"
          members={representativo}
          category="REPRESENTATIVO"
        />
      </div>

      {/* Dialog de información del miembro */}
      <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Información del Miembro</DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20">
                  <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-500 text-white text-xl">
                    {getInitials(selectedMember.nombres)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{selectedMember.nombres}</h3>
                  <Badge>{selectedMember.rol}</Badge>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Cédula:</span>
                  <span className="font-medium">{selectedMember.numeroDocumento}</span>
                </div>
                {selectedMember.correo && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Correo:</span>
                    <span className="font-medium">{selectedMember.correo}</span>
                  </div>
                )}
                {selectedMember.area === 'deporte' && selectedMember.codigoEstudiantil && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Código Estudiantil:</span>
                    <span className="font-medium">{selectedMember.codigoEstudiantil}</span>
                  </div>
                )}
                {selectedMember.programaAcademico && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Programa:</span>
                    <span className="font-medium">{selectedMember.programaAcademico}</span>
                  </div>
                )}
                {selectedMember.facultad && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Facultad:</span>
                    <span className="font-medium">{selectedMember.facultad}</span>
                  </div>
                )}
                {selectedMember.categoria && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Categoría:</span>
                    <Badge variant="outline">{selectedMember.categoria}</Badge>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

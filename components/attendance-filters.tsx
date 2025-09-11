"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, X, Filter } from "lucide-react"
import { FACULTADES, PROGRAMAS_POR_FACULTAD, GRUPOS_CULTURALES } from "@/lib/data"

interface AttendanceFiltersProps {
  onFiltersChange: (filters: FilterState) => void
  attendanceCount: number
}

export interface FilterState {
  nombre: string
  facultad: string
  programa: string
  grupoCultural: string
}

export default function AttendanceFilters({ onFiltersChange, attendanceCount }: AttendanceFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    nombre: "",
    facultad: "defaultFacultad",
    programa: "defaultPrograma",
    grupoCultural: "defaultGrupoCultural",
  })

  const [isExpanded, setIsExpanded] = useState(false)

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value }

    // Si cambia la facultad, limpiar el programa
    if (key === "facultad") {
      newFilters.programa = "defaultPrograma"
    }

    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const clearFilters = () => {
    const emptyFilters = {
      nombre: "",
      facultad: "defaultFacultad",
      programa: "defaultPrograma",
      grupoCultural: "defaultGrupoCultural",
    }
    setFilters(emptyFilters)
    onFiltersChange(emptyFilters)
  }

  const hasActiveFilters =
    filters.nombre !== "" ||
    filters.facultad !== "defaultFacultad" ||
    filters.programa !== "defaultPrograma" ||
    filters.grupoCultural !== "defaultGrupoCultural"

  const programasDisponibles =
    filters.facultad && filters.facultad !== "defaultFacultad" ? PROGRAMAS_POR_FACULTAD[filters.facultad] || [] : []

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Búsqueda
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              {attendanceCount} registros
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="md:hidden">
              {isExpanded ? "Ocultar" : "Mostrar"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className={`space-y-4 ${!isExpanded ? "hidden md:block" : ""}`}>
        {/* Búsqueda por nombre */}
        <div className="space-y-2">
          <Label htmlFor="nombre">Buscar por nombre</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="nombre"
              placeholder="Escribe el nombre de la persona..."
              value={filters.nombre}
              onChange={(e) => handleFilterChange("nombre", e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filtros por categorías */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Facultad */}
          <div className="space-y-2">
            <Label>Facultad</Label>
            <Select value={filters.facultad} onValueChange={(value) => handleFilterChange("facultad", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar facultad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="defaultFacultad">Todas las facultades</SelectItem>
                {FACULTADES.map((facultad) => (
                  <SelectItem key={facultad} value={facultad}>
                    {facultad}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Programa */}
          <div className="space-y-2">
            <Label>Programa</Label>
            <Select
              value={filters.programa}
              onValueChange={(value) => handleFilterChange("programa", value)}
              disabled={!filters.facultad || filters.facultad === "defaultFacultad"}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar programa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="defaultPrograma">Todos los programas</SelectItem>
                {programasDisponibles.map((programa) => (
                  <SelectItem key={programa} value={programa}>
                    {programa}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Grupo Cultural */}
          <div className="space-y-2">
            <Label>Grupo Cultural</Label>
            <Select value={filters.grupoCultural} onValueChange={(value) => handleFilterChange("grupoCultural", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar grupo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="defaultGrupoCultural">Todos los grupos</SelectItem>
                {GRUPOS_CULTURALES.map((grupo) => (
                  <SelectItem key={grupo} value={grupo}>
                    {grupo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filtros activos y botón limpiar */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
            <span className="text-sm text-muted-foreground">Filtros activos:</span>
            {filters.nombre && (
              <Badge variant="outline" className="gap-1">
                Nombre: {filters.nombre}
                <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange("nombre", "")} />
              </Badge>
            )}
            {filters.facultad && filters.facultad !== "defaultFacultad" && (
              <Badge variant="outline" className="gap-1">
                {filters.facultad.replace("FACULTAD DE ", "")}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFilterChange("facultad", "defaultFacultad")}
                />
              </Badge>
            )}
            {filters.programa && filters.programa !== "defaultPrograma" && (
              <Badge variant="outline" className="gap-1">
                {filters.programa.split(" (")[0]}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFilterChange("programa", "defaultPrograma")}
                />
              </Badge>
            )}
            {filters.grupoCultural && filters.grupoCultural !== "defaultGrupoCultural" && (
              <Badge variant="outline" className="gap-1">
                {filters.grupoCultural.length > 30
                  ? `${filters.grupoCultural.substring(0, 30)}...`
                  : filters.grupoCultural}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFilterChange("grupoCultural", "defaultGrupoCultural")}
                />
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-2">
              Limpiar todos
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

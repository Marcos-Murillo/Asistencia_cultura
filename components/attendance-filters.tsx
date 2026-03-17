"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, X, Filter, ChevronDown } from "lucide-react"
import { FACULTADES, PROGRAMAS_POR_FACULTAD } from "@/lib/data"
import { getAllCulturalGroups as getAllCulturalGroupsRouter } from "@/lib/db-router"
import { GRUPOS_DEPORTIVOS } from "@/lib/deporte-groups"
import type { Area } from "@/lib/firebase-config"

interface AttendanceFiltersProps {
  onFiltersChange: (filters: FilterState) => void
  attendanceCount: number
  area?: Area
}

export interface FilterState {
  nombre: string
  facultad: string
  programa: string
  grupoCultural: string
}

// Combobox con búsqueda para grupos
function GrupoCombobox({
  grupos,
  value,
  onChange,
  label,
}: {
  grupos: string[]
  value: string
  onChange: (val: string) => void
  label: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  const filtered = search.trim()
    ? grupos.filter(g => g.toLowerCase().includes(search.toLowerCase()))
    : grupos

  const displayValue = value === "defaultGrupoCultural" ? "" : value

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <div
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer"
        onClick={() => setOpen(o => !o)}
      >
        <span className={displayValue ? "" : "text-muted-foreground"}>
          {displayValue || `Todos los grupos`}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          <div className="p-2">
            <Input
              autoFocus
              placeholder={`Buscar ${label.toLowerCase()}...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-8"
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            <div
              className="px-3 py-2 text-sm cursor-pointer hover:bg-accent"
              onClick={() => { onChange("defaultGrupoCultural"); setSearch(""); setOpen(false) }}
            >
              Todos los grupos
            </div>
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted-foreground">Sin resultados</div>
            )}
            {filtered.map(g => (
              <div
                key={g}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-accent ${value === g ? "bg-accent font-medium" : ""}`}
                onClick={() => { onChange(g); setSearch(""); setOpen(false) }}
              >
                {g}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AttendanceFilters({ onFiltersChange, attendanceCount, area = 'cultura' }: AttendanceFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    nombre: "",
    facultad: "defaultFacultad",
    programa: "defaultPrograma",
    grupoCultural: "defaultGrupoCultural",
  })
  const [grupos, setGrupos] = useState<string[]>([])
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    if (area === 'deporte') {
      setGrupos([...GRUPOS_DEPORTIVOS].sort())
    } else {
      getAllCulturalGroupsRouter(area)
        .then(groups => setGrupos(groups.filter(g => g.activo).map(g => g.nombre).sort()))
        .catch(err => console.error("[AttendanceFilters] Error loading groups:", err))
    }
  }, [area])

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

          {/* Grupo Cultural / Deportivo */}
          <div className="space-y-2">
            <Label>Grupo {area === 'deporte' ? 'Deportivo' : 'Cultural'}</Label>
            <GrupoCombobox
              grupos={grupos}
              value={filters.grupoCultural}
              onChange={(value) => handleFilterChange("grupoCultural", value)}
              label={area === 'deporte' ? 'grupo deportivo' : 'grupo cultural'}
            />
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

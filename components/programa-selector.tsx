"use client"

import { useState, useMemo } from "react"
import { 
  getProgramasPorSede, 
  getProgramasPorSedeYFacultad,
  type ProgramaAcademico 
} from "@/lib/programas-academicos"
import { SEDES } from "@/lib/data"

interface ProgramaSelectorProps {
  onProgramaSelect?: (programa: ProgramaAcademico) => void
  sedeInicial?: string
  facultadInicial?: string
}

/**
 * Componente selector de programas académicos con filtros por sede y facultad
 * Muestra solo los programas disponibles según la sede y facultad seleccionadas
 */
export function ProgramaSelector({ 
  onProgramaSelect, 
  sedeInicial, 
  facultadInicial 
}: ProgramaSelectorProps) {
  const [sedeSeleccionada, setSedeSeleccionada] = useState<string>(sedeInicial || "")
  const [facultadSeleccionada, setFacultadSeleccionada] = useState<string>(facultadInicial || "")
  const [programaSeleccionado, setProgramaSeleccionado] = useState<string>("")

  // Obtener facultades disponibles según la sede seleccionada
  const facultadesDisponibles = useMemo(() => {
    if (!sedeSeleccionada) return []
    const programas = getProgramasPorSede(sedeSeleccionada)
    return Array.from(new Set(programas.map(p => p.facultad))).sort()
  }, [sedeSeleccionada])

  // Obtener programas disponibles según sede y facultad
  const programasDisponibles = useMemo(() => {
    if (!sedeSeleccionada) return []
    
    if (facultadSeleccionada) {
      return getProgramasPorSedeYFacultad(sedeSeleccionada, facultadSeleccionada)
    }
    
    return getProgramasPorSede(sedeSeleccionada)
  }, [sedeSeleccionada, facultadSeleccionada])

  const handleSedeChange = (sede: string) => {
    setSedeSeleccionada(sede)
    setFacultadSeleccionada("") // Reset facultad cuando cambia la sede
    setProgramaSeleccionado("") // Reset programa
  }

  const handleFacultadChange = (facultad: string) => {
    setFacultadSeleccionada(facultad)
    setProgramaSeleccionado("") // Reset programa cuando cambia la facultad
  }

  const handleProgramaChange = (codigoPrograma: string) => {
    setProgramaSeleccionado(codigoPrograma)
    const programa = programasDisponibles.find(p => p.codigo === codigoPrograma)
    if (programa && onProgramaSelect) {
      onProgramaSelect(programa)
    }
  }

  return (
    <div className="space-y-4">
      {/* Selector de Sede */}
      <div>
        <label htmlFor="sede" className="block text-sm font-medium mb-2">
          Sede
        </label>
        <select
          id="sede"
          value={sedeSeleccionada}
          onChange={(e) => handleSedeChange(e.target.value)}
          className="w-full p-2 border rounded-md"
        >
          <option value="">Seleccione una sede</option>
          {SEDES.filter(s => s !== "NINGUNA").map((sede) => (
            <option key={sede} value={sede}>
              {sede}
            </option>
          ))}
        </select>
      </div>

      {/* Selector de Facultad (solo si hay sede seleccionada) */}
      {sedeSeleccionada && (
        <div>
          <label htmlFor="facultad" className="block text-sm font-medium mb-2">
            Facultad (Opcional)
          </label>
          <select
            id="facultad"
            value={facultadSeleccionada}
            onChange={(e) => handleFacultadChange(e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="">Todas las facultades</option>
            {facultadesDisponibles.map((facultad) => (
              <option key={facultad} value={facultad}>
                {facultad}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {facultadesDisponibles.length} facultad(es) disponible(s) en {sedeSeleccionada}
          </p>
        </div>
      )}

      {/* Selector de Programa (solo si hay sede seleccionada) */}
      {sedeSeleccionada && programasDisponibles.length > 0 && (
        <div>
          <label htmlFor="programa" className="block text-sm font-medium mb-2">
            Programa Académico
          </label>
          <select
            id="programa"
            value={programaSeleccionado}
            onChange={(e) => handleProgramaChange(e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="">Seleccione un programa</option>
            {programasDisponibles.map((programa) => (
              <option key={programa.codigo} value={programa.codigo}>
                {programa.nombre} ({programa.codigo})
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {programasDisponibles.length} programa(s) disponible(s)
          </p>
        </div>
      )}

      {/* Mensaje si no hay programas */}
      {sedeSeleccionada && programasDisponibles.length === 0 && (
        <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-md">
          No hay programas disponibles para la sede y facultad seleccionadas.
        </div>
      )}
    </div>
  )
}

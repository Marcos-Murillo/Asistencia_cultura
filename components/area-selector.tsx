'use client'

import { useArea } from '@/contexts/area-context'
import type { Area } from '@/lib/firebase-config'

export function AreaSelector() {
  const { area, setArea, canSwitchArea } = useArea()
  
  if (!canSwitchArea) {
    return null
  }
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-700 hidden sm:inline">Área:</span>
      <select
        value={area}
        onChange={(e) => setArea(e.target.value as Area)}
        className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
        aria-label="Seleccionar área"
      >
        <option value="cultura">Cultura</option>
        <option value="deporte">Deporte</option>
      </select>
    </div>
  )
}

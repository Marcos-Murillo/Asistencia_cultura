'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import type { Area } from '@/lib/firebase-config'
import { logAreaSwitch } from '@/lib/logger'

interface AreaContextType {
  area: Area
  setArea: (area: Area) => void
  isSuperAdmin: boolean
  canSwitchArea: boolean
}

const AreaContext = createContext<AreaContextType | undefined>(undefined)

interface AreaProviderProps {
  children: React.ReactNode
}

export function AreaProvider({ children }: AreaProviderProps) {
  // Detectar si es super admin
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const superAdminStatus = sessionStorage.getItem('isSuperAdmin') === 'true'
      setIsSuperAdmin(superAdminStatus)
    }
  }, [])
  
  const canSwitchArea = isSuperAdmin
  
  // Leer área de localStorage
  const getInitialArea = (): Area => {
    if (typeof window !== 'undefined') {
      const savedArea = localStorage.getItem('selectedArea') as Area | null
      if (savedArea && (savedArea === 'cultura' || savedArea === 'deporte')) {
        console.log('[AreaProvider] Loading area from localStorage:', savedArea)
        return savedArea
      }
    }
    console.log('[AreaProvider] Using default area: cultura')
    return 'cultura'
  }
  
  const [area, setAreaState] = useState<Area>(getInitialArea)
  
  // Escuchar evento personalizado de cambio de área (disparado por el login)
  useEffect(() => {
    const handleAreaChanged = (event: CustomEvent) => {
      const newArea = event.detail.area as Area
      if (newArea && (newArea === 'cultura' || newArea === 'deporte') && newArea !== area) {
        console.log('[AreaProvider] Custom event areaChanged, updating to:', newArea)
        setAreaState(newArea)
      }
    }
    
    window.addEventListener('areaChanged', handleAreaChanged as EventListener)
    return () => window.removeEventListener('areaChanged', handleAreaChanged as EventListener)
  }, [area])
  
  // Revisar localStorage periódicamente para detectar cambios del login (fallback)
  useEffect(() => {
    const checkLocalStorage = () => {
      const savedArea = localStorage.getItem('selectedArea') as Area | null
      if (savedArea && (savedArea === 'cultura' || savedArea === 'deporte') && savedArea !== area) {
        console.log('[AreaProvider] Detected area change in localStorage:', savedArea)
        setAreaState(savedArea)
      }
    }
    
    // Revisar inmediatamente
    checkLocalStorage()
    
    // Revisar cada 500ms (solo cuando no es super admin para no interferir con cambios manuales)
    const interval = setInterval(() => {
      if (!isSuperAdmin) {
        checkLocalStorage()
      }
    }, 500)
    
    return () => clearInterval(interval)
  }, [area, isSuperAdmin])
  
  // Escuchar cambios en localStorage (para sincronizar entre tabs)
  useEffect(() => {
    const handleStorageChange = () => {
      const newArea = localStorage.getItem('selectedArea') as Area | null
      if (newArea && (newArea === 'cultura' || newArea === 'deporte') && newArea !== area) {
        console.log('[AreaProvider] Storage event, updating area to:', newArea)
        setAreaState(newArea)
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [area])
  
  const setArea = (newArea: Area) => {
    console.log('[AreaProvider] setArea called - current:', area, 'new:', newArea, 'canSwitch:', canSwitchArea)
    
    if (canSwitchArea) {
      const previousArea = area
      console.log('[AreaProvider] Updating area from', previousArea, 'to', newArea)
      setAreaState(newArea)
      localStorage.setItem('selectedArea', newArea)
      
      // Log area switch by Super_Admin
      logAreaSwitch('super-admin', previousArea, newArea)
      
      console.log('[AreaProvider] Area updated successfully to:', newArea)
    } else {
      console.warn('[AreaProvider] Cannot switch area - not super admin')
    }
  }
  
  return (
    <AreaContext.Provider value={{ area, setArea, isSuperAdmin, canSwitchArea }}>
      {children}
    </AreaContext.Provider>
  )
}

export function useArea() {
  const context = useContext(AreaContext)
  if (context === undefined) {
    throw new Error('useArea must be used within an AreaProvider')
  }
  return context
}

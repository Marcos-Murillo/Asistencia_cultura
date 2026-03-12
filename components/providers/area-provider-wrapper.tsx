'use client'

import { useEffect } from 'react'
import { AreaProvider } from '@/contexts/area-context'
import type { Area } from '@/lib/firebase-config'

interface AreaProviderWrapperProps {
  children: React.ReactNode
}

export function AreaProviderWrapper({ children }: AreaProviderWrapperProps) {
  return <AreaProvider>{children}</AreaProvider>
}

// Hook para forzar el área del admin/manager
export function useForceAreaOnLogin() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const userType = sessionStorage.getItem('userType')
    const isSuperAdmin = sessionStorage.getItem('isSuperAdmin') === 'true'
    
    // Solo forzar área para admins y managers, no para super admin
    if (!isSuperAdmin && (userType === 'admin' || userType === 'manager')) {
      const adminArea = sessionStorage.getItem('adminArea') as Area | null
      const managerArea = sessionStorage.getItem('userArea') as Area | null
      const forcedArea = adminArea || managerArea
      
      if (forcedArea) {
        console.log('[useForceAreaOnLogin] Forcing area to:', forcedArea)
        localStorage.setItem('selectedArea', forcedArea)
        // Forzar recarga para que el contexto tome el área correcta
        window.dispatchEvent(new Event('storage'))
      }
    }
  }, [])
}

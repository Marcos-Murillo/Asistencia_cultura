'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield } from 'lucide-react'

interface SuperAdminGuardProps {
  children: React.ReactNode
}

export function SuperAdminGuard({ children }: SuperAdminGuardProps) {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      const userType = sessionStorage.getItem('userType')
      const isSuperAdmin = sessionStorage.getItem('isSuperAdmin')
      
      console.log('[SuperAdminGuard] Checking authorization...')
      console.log('[SuperAdminGuard] userType:', userType)
      console.log('[SuperAdminGuard] isSuperAdmin:', isSuperAdmin)
      
      if (userType === 'superadmin' && isSuperAdmin === 'true') {
        console.log('[SuperAdminGuard] ✅ Authorized')
        setIsAuthorized(true)
      } else {
        console.log('[SuperAdminGuard] ❌ Not authorized, redirecting to login')
        router.push('/login')
      }
      
      setIsChecking(false)
    }

    checkAuth()
  }, [router])

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-purple-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}

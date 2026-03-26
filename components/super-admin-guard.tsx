'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield } from 'lucide-react'

interface SuperAdminGuardProps {
  children: React.ReactNode
}

function getSessionCookie(): { role?: string; isSuperAdmin?: boolean } | null {
  try {
    const match = document.cookie.split('; ').find((c) => c.startsWith('asistencias_session='))
    if (!match) return null
    const value = match.split('=')[1]
    return JSON.parse(atob(decodeURIComponent(value)))
  } catch {
    return null
  }
}

export function SuperAdminGuard({ children }: SuperAdminGuardProps) {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    let attempts = 0
    const MAX_ATTEMPTS = 10
    const INTERVAL = 100 // ms

    const checkAuth = () => {
      attempts++

      // Primary: sessionStorage (set by /auth/sso page)
      const userType = sessionStorage.getItem('userType')
      const isSuperAdmin = sessionStorage.getItem('isSuperAdmin')

      if (userType === 'superadmin' && isSuperAdmin === 'true') {
        setIsAuthorized(true)
        setIsChecking(false)
        return
      }

      // Fallback: cookie set by /api/auth/sso (not httpOnly so readable here)
      const cookie = getSessionCookie()
      if (cookie?.role === 'SUPER_ADMIN') {
        sessionStorage.setItem('userType', 'superadmin')
        sessionStorage.setItem('isSuperAdmin', 'true')
        sessionStorage.setItem('isAdmin', 'true')
        setIsAuthorized(true)
        setIsChecking(false)
        return
      }

      // Retry while waiting for /auth/sso to finish setting sessionStorage
      if (attempts < MAX_ATTEMPTS) {
        setTimeout(checkAuth, INTERVAL)
        return
      }

      // Exhausted retries — not authorized
      const cdrUrl = process.env.NEXT_PUBLIC_CDR_URL ?? '/'
      router.replace(cdrUrl)
      setIsChecking(false)
    }

    // First check after a short delay to let /auth/sso settle
    const t = setTimeout(checkAuth, 80)
    return () => clearTimeout(t)
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

  if (!isAuthorized) return null

  return <>{children}</>
}

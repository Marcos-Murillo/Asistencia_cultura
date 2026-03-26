import { NextRequest, NextResponse } from 'next/server'
import type { NextMiddleware } from 'next/server'

// Routes that do NOT require CDR authentication
const PUBLIC_ROUTES = [
  '/',
  '/convocatorias',
  '/convocatorias-deporte',
  '/inscripcion-deporte',
  '/login-manager',
  '/auth/sso',
]

// Prefix-based public routes (e.g. /manager/[grupo])
const PUBLIC_PREFIXES = ['/manager/', '/inscripcion']

const SESSION_COOKIE = 'asistencias_session'

function isPublic(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return true
  // Next.js internals & static files
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) return true
  return false
}

export const middleware: NextMiddleware = (req: NextRequest) => {
  const { pathname } = req.nextUrl

  if (isPublic(pathname)) return NextResponse.next()

  // Check for valid session cookie set by /auth/sso
  const session = req.cookies.get(SESSION_COOKIE)?.value
  if (session) {
    try {
      const data = JSON.parse(atob(session))
      if (data?.role && data?.exp && data.exp > Date.now()) {
        return NextResponse.next()
      }
    } catch {
      // invalid cookie — fall through to redirect
    }
  }

  // No valid session → redirect to CDR
  const cdrUrl = process.env.NEXT_PUBLIC_CDR_URL ?? 'http://localhost:3000'
  return NextResponse.redirect(new URL(cdrUrl))
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}

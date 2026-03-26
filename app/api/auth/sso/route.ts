import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const SSO_SECRET = new TextEncoder().encode(process.env.SSO_SECRET ?? '')
const SESSION_COOKIE = 'asistencias_session'
const SESSION_TTL_MS = 8 * 60 * 60 * 1000

function buildSession(uid: string, nombre: string, role: string, area: string) {
  return btoa(JSON.stringify({ uid, nombre, role, area, exp: Date.now() + SESSION_TTL_MS }))
}

function setCookie(res: NextResponse, value: string) {
  res.cookies.set(SESSION_COOKIE, value, {
    httpOnly: false, // readable by client guards
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
    secure: process.env.NODE_ENV === 'production',
  })
}

// GET /api/auth/sso?token=xxx&redirect=/super-admin
// Called directly by the browser — sets cookie AND redirects in one response
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const token = searchParams.get('token')
  const redirect = searchParams.get('redirect') ?? '/usuarios'

  if (!token) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  try {
    const { payload } = await jwtVerify(token, SSO_SECRET)

    const role = (payload.role ?? payload.rol) as string
    const area = (payload.area ?? 'cultura') as string
    const nombre = (payload.nombre ?? '') as string
    const uid = (payload.uid ?? '') as string

    if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url))
    }

    const sessionValue = buildSession(uid, nombre, role, area)
    const destination = new URL(redirect, req.url)
    const res = NextResponse.redirect(destination)
    setCookie(res, sessionValue)
    return res
  } catch {
    return NextResponse.redirect(new URL('/', req.url))
  }
}

// POST kept for backward compatibility (returns JSON, used by guards as fallback)
export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()
    if (!token) {
      return NextResponse.json({ error: 'Token requerido.' }, { status: 400 })
    }

    const { payload } = await jwtVerify(token, SSO_SECRET)

    const role = (payload.role ?? payload.rol) as string
    const area = (payload.area ?? 'cultura') as string
    const nombre = (payload.nombre ?? '') as string
    const uid = (payload.uid ?? '') as string

    if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Rol no autorizado.' }, { status: 403 })
    }

    const sessionValue = buildSession(uid, nombre, role, area)
    const res = NextResponse.json({ ok: true, role, area })
    setCookie(res, sessionValue)
    return res
  } catch (err) {
    console.error('[sso-validate]', err)
    return NextResponse.json({ error: 'Token inválido o expirado.' }, { status: 401 })
  }
}

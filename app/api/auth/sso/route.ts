import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const SSO_SECRET = new TextEncoder().encode(process.env.SSO_SECRET ?? '')
const SESSION_COOKIE = 'asistencias_session'
// 8 hours in ms
const SESSION_TTL_MS = 8 * 60 * 60 * 1000

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

    // Only SUPER_ADMIN and ADMIN are allowed through CDR SSO
    if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Rol no autorizado.' }, { status: 403 })
    }

    // Build a lightweight session payload (no sensitive data)
    const sessionData = {
      uid,
      nombre,
      role,
      area,
      exp: Date.now() + SESSION_TTL_MS,
    }

    const sessionValue = btoa(JSON.stringify(sessionData))

    const res = NextResponse.json({ ok: true, role, area })
    res.cookies.set(SESSION_COOKIE, sessionValue, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_TTL_MS / 1000,
      // secure: true — enable in production
    })

    return res
  } catch (err) {
    console.error('[sso-validate]', err)
    return NextResponse.json({ error: 'Token inválido o expirado.' }, { status: 401 })
  }
}

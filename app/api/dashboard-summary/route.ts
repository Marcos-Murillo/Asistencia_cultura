import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { getAttendanceRecords, getAllCulturalGroups } from '@/lib/db-router'
import { computeDashboardSummary } from '@/lib/dashboard-summary'

export const runtime = 'nodejs'

const SSO_SECRET = new TextEncoder().encode(process.env.SSO_SECRET ?? '')

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Extract Bearer token
  const authHeader = request.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return NextResponse.json({ error: 'Token requerido.' }, { status: 401 })
  }

  // Verify JWT
  let payload: { role?: string }
  try {
    const result = await jwtVerify(token, SSO_SECRET)
    payload = result.payload as { role?: string }
  } catch (err) {
    const msg = (err as Error).message ?? ''
    if (msg.includes('expired')) {
      return NextResponse.json({ error: 'Token expirado.' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Token inválido.' }, { status: 401 })
  }

  // Check role
  const role = payload.role
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Rol no autorizado.' }, { status: 403 })
  }

  // Fetch data from Firestore
  try {
    const [records, groups] = await Promise.all([
      getAttendanceRecords('cultura'),
      getAllCulturalGroups('cultura'),
    ])

    const summary = computeDashboardSummary(records, groups)
    return NextResponse.json(summary)
  } catch (err) {
    console.error('[dashboard-summary] Firestore error:', err)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}

'use client'

import { useEffect, useState, useRef } from 'react'
import { useArea } from '@/contexts/area-context'
import { getAllUsers } from '@/lib/db-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { UserProfile } from '@/lib/types'

export default function TestAreaSwitchPage() {
  const { area } = useArea()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadCount, setLoadCount] = useState(0)
  const previousAreaRef = useRef<string>(area)

  // Log every render
  console.log('🎨 COMPONENT RENDER - Area:', area, 'Previous:', previousAreaRef.current)

  useEffect(() => {
    const timestamp = new Date().toISOString()
    console.log('='.repeat(80))
    console.log(`[${timestamp}] 🔄 useEffect TRIGGERED!`)
    console.log(`[${timestamp}] Current area:`, area)
    console.log(`[${timestamp}] Previous area:`, previousAreaRef.current)
    console.log(`[${timestamp}] Area changed:`, area !== previousAreaRef.current)
    console.log(`[${timestamp}] Load count:`, loadCount + 1)
    console.log('='.repeat(80))
    
    previousAreaRef.current = area
    setLoadCount(prev => prev + 1)
    setLoading(true)
    setError(null)
    
    console.log(`[${timestamp}] 📡 Calling getAllUsers('${area}')...`)
    
    getAllUsers(area)
      .then(data => {
        const ts = new Date().toISOString()
        console.log(`[${ts}] ✅ SUCCESS: Loaded ${data.length} users for area: ${area}`)
        console.log(`[${ts}] Users with area field:`, data.filter(u => u.area === area).length)
        console.log(`[${ts}] Users with wrong area:`, data.filter(u => u.area && u.area !== area).length)
        console.log(`[${ts}] Users without area:`, data.filter(u => !u.area).length)
        console.log(`[${ts}] First 3 users:`, data.slice(0, 3).map(u => ({ 
          name: u.nombres, 
          area: u.area || 'NO AREA',
          email: u.correo 
        })))
        setUsers(data)
      })
      .catch(err => {
        const ts = new Date().toISOString()
        console.error(`[${ts}] ❌ ERROR loading users:`, err)
        setError(err.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [area]) // Re-run when area changes

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Test Area Switching</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Current State</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-semibold">Current Area:</span>{' '}
              <Badge variant={area === 'cultura' ? 'default' : 'secondary'}>
                {area}
              </Badge>
            </div>
            <div>
              <span className="font-semibold">Load Count:</span> {loadCount}
            </div>
            <div>
              <span className="font-semibold">Loading:</span> {loading ? 'Yes' : 'No'}
            </div>
            <div>
              <span className="font-semibold">Users Loaded:</span> {users.length}
            </div>
            {error && (
              <div className="text-red-600">
                <span className="font-semibold">Error:</span> {error}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Users ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div>Loading...</div>
            ) : users.length === 0 ? (
              <div className="text-gray-500">No users found for area: {area}</div>
            ) : (
              <div className="space-y-2">
                {users.slice(0, 10).map((user, i) => (
                  <div key={user.id} className="border-b pb-2">
                    <div className="font-medium">{i + 1}. {user.nombres}</div>
                    <div className="text-sm text-gray-600">
                      Area: <Badge variant="outline">{user.area || 'NO AREA'}</Badge>
                      {' | '}
                      Email: {user.correo}
                    </div>
                  </div>
                ))}
                {users.length > 10 && (
                  <div className="text-sm text-gray-500 pt-2">
                    ... and {users.length - 10} more
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-blue-50">
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>1. Open the browser console (F12)</p>
            <p>2. Use the Area selector in the header to switch between Cultura and Deporte</p>
            <p>3. Watch the console logs and the "Load Count" above</p>
            <p>4. The users list should update automatically</p>
            <p className="font-semibold text-blue-900 mt-4">
              Expected behavior: Load Count should increase and users should change when you switch areas
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

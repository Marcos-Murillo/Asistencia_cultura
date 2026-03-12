'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getFirestoreForArea } from '@/lib/firebase-config'
import { collection, getDocs, query, limit } from 'firebase/firestore'

export default function DebugFirebasePage() {
  const [culturaConfig, setCulturaConfig] = useState<any>(null)
  const [deporteConfig, setDeporteConfig] = useState<any>(null)
  const [culturaData, setCulturaData] = useState<any>(null)
  const [deporteData, setDeporteData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check environment variables
    setCulturaConfig({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✓ Set' : '✗ Missing',
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'Missing',
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'Missing',
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'Missing',
    })

    setDeporteConfig({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_DEPORTE_API_KEY ? '✓ Set' : '✗ Missing',
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_DEPORTE_AUTH_DOMAIN || 'Missing',
      projectId: process.env.NEXT_PUBLIC_FIREBASE_DEPORTE_PROJECT_ID || 'Missing',
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_DEPORTE_STORAGE_BUCKET || 'Missing',
    })

    // Test database connections
    async function testConnections() {
      try {
        // Test Cultura
        const culturaDb = getFirestoreForArea('cultura')
        const culturaUsersRef = collection(culturaDb, 'user_profiles')
        const culturaQuery = query(culturaUsersRef, limit(3))
        const culturaSnapshot = await getDocs(culturaQuery)
        
        setCulturaData({
          status: 'Connected',
          users: culturaSnapshot.size,
          samples: culturaSnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().nombres,
            area: doc.data().area || 'NO AREA'
          }))
        })

        // Test Deporte
        const deporteDb = getFirestoreForArea('deporte')
        const deporteUsersRef = collection(deporteDb, 'user_profiles')
        const deporteQuery = query(deporteUsersRef, limit(3))
        const deporteSnapshot = await getDocs(deporteQuery)
        
        setDeporteData({
          status: 'Connected',
          users: deporteSnapshot.size,
          samples: deporteSnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().nombres,
            area: doc.data().area || 'NO AREA'
          }))
        })
      } catch (err: any) {
        setError(err.message)
      }
    }

    testConnections()
  }, [])

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Firebase Configuration Debug</h1>

      {error && (
        <Card className="mb-6 border-red-500">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm">{error}</pre>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Cultura Config */}
        <Card>
          <CardHeader>
            <CardTitle>Cultura Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            {culturaConfig && (
              <div className="space-y-2 text-sm">
                <div>API Key: <Badge>{culturaConfig.apiKey}</Badge></div>
                <div>Auth Domain: {culturaConfig.authDomain}</div>
                <div>Project ID: {culturaConfig.projectId}</div>
                <div>Storage Bucket: {culturaConfig.storageBucket}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deporte Config */}
        <Card>
          <CardHeader>
            <CardTitle>Deporte Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            {deporteConfig && (
              <div className="space-y-2 text-sm">
                <div>API Key: <Badge>{deporteConfig.apiKey}</Badge></div>
                <div>Auth Domain: {deporteConfig.authDomain}</div>
                <div>Project ID: {deporteConfig.projectId}</div>
                <div>Storage Bucket: {deporteConfig.storageBucket}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cultura Data */}
        <Card>
          <CardHeader>
            <CardTitle>Cultura Database</CardTitle>
          </CardHeader>
          <CardContent>
            {culturaData ? (
              <div className="space-y-2">
                <div>Status: <Badge variant="default">{culturaData.status}</Badge></div>
                <div>Users: {culturaData.users}</div>
                {culturaData.samples.length > 0 && (
                  <div className="mt-4">
                    <p className="font-semibold mb-2">Sample Users:</p>
                    {culturaData.samples.map((user: any, i: number) => (
                      <div key={i} className="text-sm">
                        {i + 1}. {user.name} ({user.area})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>Loading...</div>
            )}
          </CardContent>
        </Card>

        {/* Deporte Data */}
        <Card>
          <CardHeader>
            <CardTitle>Deporte Database</CardTitle>
          </CardHeader>
          <CardContent>
            {deporteData ? (
              <div className="space-y-2">
                <div>Status: <Badge variant="default">{deporteData.status}</Badge></div>
                <div>Users: {deporteData.users}</div>
                {deporteData.samples.length > 0 && (
                  <div className="mt-4">
                    <p className="font-semibold mb-2">Sample Users:</p>
                    {deporteData.samples.map((user: any, i: number) => (
                      <div key={i} className="text-sm">
                        {i + 1}. {user.name} ({user.area})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>Loading...</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getFirestoreForArea } from '@/lib/firebase-config'
import { collection, getDocs, query, limit } from 'firebase/firestore'

export default function DiagnoseDBPage() {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const diagnose = async () => {
    setLoading(true)
    const diagnostics: any = {}

    try {
      // Test Cultura database
      console.log('🔍 Testing CULTURA database...')
      const culturaDb = getFirestoreForArea('cultura')
      const culturaUsersRef = collection(culturaDb, 'user_profiles')
      const culturaQuery = query(culturaUsersRef, limit(5))
      const culturaSnapshot = await getDocs(culturaQuery)
      
      diagnostics.cultura = {
        totalSampled: culturaSnapshot.size,
        users: culturaSnapshot.docs.map(doc => ({
          id: doc.id,
          nombre: doc.data().nombres,
          area: doc.data().area || 'NO AREA',
          correo: doc.data().correo
        }))
      }
      
      // Count users with and without area
      const culturaAllRef = collection(culturaDb, 'user_profiles')
      const culturaAllSnapshot = await getDocs(culturaAllRef)
      diagnostics.cultura.total = culturaAllSnapshot.size
      diagnostics.cultura.withArea = culturaAllSnapshot.docs.filter(d => d.data().area).length
      diagnostics.cultura.withoutArea = culturaAllSnapshot.docs.filter(d => !d.data().area).length

      // Test Deporte database
      console.log('🔍 Testing DEPORTE database...')
      const deporteDb = getFirestoreForArea('deporte')
      const deporteUsersRef = collection(deporteDb, 'user_profiles')
      const deporteQuery = query(deporteUsersRef, limit(5))
      const deporteSnapshot = await getDocs(deporteQuery)
      
      diagnostics.deporte = {
        totalSampled: deporteSnapshot.size,
        users: deporteSnapshot.docs.map(doc => ({
          id: doc.id,
          nombre: doc.data().nombres,
          area: doc.data().area || 'NO AREA',
          correo: doc.data().correo
        }))
      }
      
      // Count users with and without area
      const deporteAllRef = collection(deporteDb, 'user_profiles')
      const deporteAllSnapshot = await getDocs(deporteAllRef)
      diagnostics.deporte.total = deporteAllSnapshot.size
      diagnostics.deporte.withArea = deporteAllSnapshot.docs.filter(d => d.data().area).length
      diagnostics.deporte.withoutArea = deporteAllSnapshot.docs.filter(d => !d.data().area).length

      setResults(diagnostics)
    } catch (error: any) {
      diagnostics.error = error.message
      setResults(diagnostics)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Database Diagnostics</h1>
      
      <Button onClick={diagnose} disabled={loading}>
        {loading ? 'Diagnosing...' : 'Run Diagnostics'}
      </Button>

      {results && (
        <div className="mt-6 space-y-6">
          {results.error && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800">Error</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-600">{results.error}</p>
              </CardContent>
            </Card>
          )}

          {results.cultura && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-800">CULTURA Database</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-white rounded p-3">
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold">{results.cultura.total}</p>
                  </div>
                  <div className="bg-green-50 rounded p-3">
                    <p className="text-sm text-gray-600">With Area Field</p>
                    <p className="text-2xl font-bold text-green-600">{results.cultura.withArea}</p>
                  </div>
                  <div className="bg-red-50 rounded p-3">
                    <p className="text-sm text-gray-600">Without Area Field</p>
                    <p className="text-2xl font-bold text-red-600">{results.cultura.withoutArea}</p>
                  </div>
                </div>
                <h3 className="font-semibold mb-2">Sample Users (first 5):</h3>
                <div className="space-y-2">
                  {results.cultura.users.map((user: any) => (
                    <div key={user.id} className="bg-white rounded p-2 text-sm">
                      <p className="font-medium">{user.nombre}</p>
                      <p className="text-gray-600">{user.correo}</p>
                      <p className={`text-xs ${user.area === 'NO AREA' ? 'text-red-600' : 'text-green-600'}`}>
                        Area: {user.area}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {results.deporte && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800">DEPORTE Database</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-white rounded p-3">
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold">{results.deporte.total}</p>
                  </div>
                  <div className="bg-green-50 rounded p-3">
                    <p className="text-sm text-gray-600">With Area Field</p>
                    <p className="text-2xl font-bold text-green-600">{results.deporte.withArea}</p>
                  </div>
                  <div className="bg-red-50 rounded p-3">
                    <p className="text-sm text-gray-600">Without Area Field</p>
                    <p className="text-2xl font-bold text-red-600">{results.deporte.withoutArea}</p>
                  </div>
                </div>
                <h3 className="font-semibold mb-2">Sample Users (first 5):</h3>
                <div className="space-y-2">
                  {results.deporte.users.map((user: any) => (
                    <div key={user.id} className="bg-white rounded p-2 text-sm">
                      <p className="font-medium">{user.nombre}</p>
                      <p className="text-gray-600">{user.correo}</p>
                      <p className={`text-xs ${user.area === 'NO AREA' ? 'text-red-600' : 'text-green-600'}`}>
                        Area: {user.area}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useArea } from "@/contexts/area-context"

export default function DebugAreaPage() {
  const { area } = useArea()
  const [sessionData, setSessionData] = useState<Record<string, string>>({})
  const [localData, setLocalData] = useState<Record<string, string>>({})

  useEffect(() => {
    // Leer todos los datos de sessionStorage
    const session: Record<string, string> = {}
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key) {
        session[key] = sessionStorage.getItem(key) || ""
      }
    }
    setSessionData(session)

    // Leer todos los datos de localStorage
    const local: Record<string, string> = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        local[key] = localStorage.getItem(key) || ""
      }
    }
    setLocalData(local)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="container mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Debug Area Context</h1>

        <Card>
          <CardHeader>
            <CardTitle>useArea() Hook</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-lg">
                <strong>Current Area:</strong> <span className="text-blue-600">{area}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>sessionStorage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(sessionData).map(([key, value]) => (
                <div key={key} className="flex gap-2">
                  <strong className="min-w-[200px]">{key}:</strong>
                  <span className="text-gray-700">{value}</span>
                </div>
              ))}
              {Object.keys(sessionData).length === 0 && (
                <p className="text-gray-500">No data in sessionStorage</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>localStorage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(localData).map(([key, value]) => (
                <div key={key} className="flex gap-2">
                  <strong className="min-w-[200px]">{key}:</strong>
                  <span className="text-gray-700">{value}</span>
                </div>
              ))}
              {Object.keys(localData).length === 0 && (
                <p className="text-gray-500">No data in localStorage</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

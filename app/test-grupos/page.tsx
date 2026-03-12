"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useArea } from "@/contexts/area-context"
import { getCurrentUserRole, isSuperAdmin as checkIsSuperAdmin, isAdmin as checkIsAdmin } from "@/lib/auth-helpers"
import { getRolePermissions } from "@/lib/role-manager"
import { getGroupsWithEnrollmentCounts, getAllCulturalGroups as getAllCulturalGroupsRouter } from "@/lib/db-router"

export default function TestGruposPage() {
  const { area } = useArea()
  const [diagnostics, setDiagnostics] = useState<any>({})
  const [groups, setGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function diagnose() {
      try {
        // 1. Leer sessionStorage
        const sessionData = {
          userType: sessionStorage.getItem("userType"),
          isAdmin: sessionStorage.getItem("isAdmin"),
          isSuperAdmin: sessionStorage.getItem("isSuperAdmin"),
          userRole: sessionStorage.getItem("userRole"),
          adminArea: sessionStorage.getItem("adminArea"),
          userName: sessionStorage.getItem("userName"),
        }

        // 2. Leer localStorage
        const localData = {
          selectedArea: localStorage.getItem("selectedArea"),
        }

        // 3. Obtener rol y permisos
        const userRole = getCurrentUserRole()
        const adminStatus = checkIsAdmin()
        const superAdminStatus = checkIsSuperAdmin()
        const permissions = getRolePermissions(userRole, area, [])

        // 4. Intentar cargar grupos
        console.log("[TestGrupos] Attempting to load groups for area:", area)
        const groupsWithCounts = await getGroupsWithEnrollmentCounts(area)
        console.log("[TestGrupos] Groups loaded:", groupsWithCounts.length)
        
        const allCulturalGroups = await getAllCulturalGroupsRouter(area)
        console.log("[TestGrupos] Cultural groups loaded:", allCulturalGroups.length)

        setGroups(groupsWithCounts)
        setDiagnostics({
          sessionData,
          localData,
          userRole,
          adminStatus,
          superAdminStatus,
          permissions,
          area,
          groupsCount: groupsWithCounts.length,
          culturalGroupsCount: allCulturalGroups.length,
        })
      } catch (error) {
        console.error("[TestGrupos] Error:", error)
        setDiagnostics({ error: String(error) })
      } finally {
        setLoading(false)
      }
    }

    diagnose()
  }, [area])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold mb-4">Cargando diagnóstico...</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="container mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Test Grupos - Diagnóstico</h1>

        <Card>
          <CardHeader>
            <CardTitle>SessionStorage</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(diagnostics.sessionData, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>LocalStorage</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(diagnostics.localData, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rol y Permisos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>User Role:</strong> {diagnostics.userRole}</p>
              <p><strong>Is Admin:</strong> {String(diagnostics.adminStatus)}</p>
              <p><strong>Is Super Admin:</strong> {String(diagnostics.superAdminStatus)}</p>
              <p><strong>Current Area:</strong> {diagnostics.area}</p>
              <pre className="bg-gray-100 p-4 rounded overflow-auto mt-4">
                {JSON.stringify(diagnostics.permissions, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Grupos Cargados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              <strong>Total grupos con conteos:</strong> {diagnostics.groupsCount}
            </p>
            <p className="mb-4">
              <strong>Total grupos culturales:</strong> {diagnostics.culturalGroupsCount}
            </p>
            {groups.length > 0 ? (
              <div className="space-y-2">
                <p className="font-semibold">Primeros 5 grupos:</p>
                <pre className="bg-gray-100 p-4 rounded overflow-auto">
                  {JSON.stringify(groups.slice(0, 5), null, 2)}
                </pre>
              </div>
            ) : (
              <p className="text-red-600">No se cargaron grupos</p>
            )}
          </CardContent>
        </Card>

        {diagnostics.error && (
          <Card className="border-red-300">
            <CardHeader>
              <CardTitle className="text-red-600">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-red-50 p-4 rounded overflow-auto text-red-800">
                {diagnostics.error}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Users, FileText, Database, AlertTriangle, Edit, RefreshCw } from "lucide-react"
import { createAdminUser, getAllAdmins, updateAdminUser } from "@/lib/auth"
import { generateCombinedReport, generateCombinedReportPDF } from "@/lib/reports"
import { migrateCulturaAddAreaField } from "@/lib/migration"
import { createCulturalGroup, getAllCulturalGroups } from "@/lib/db-router"
import { GRUPOS_DEPORTIVOS } from "@/lib/deporte-groups"
import { SuperAdminGuard } from "@/components/super-admin-guard"
import type { AdminUser } from "@/lib/types"
import type { MigrationResult } from "@/lib/migration"
import type { Area } from "@/lib/firebase-config"

export default function SuperAdminPage() {
  const [admins, setAdmins] = useState<(AdminUser & { areaLabel: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [migrating, setMigrating] = useState(false)
  const [migrationResults, setMigrationResults] = useState<MigrationResult[] | null>(null)

  // Form states
  const [nombres, setNombres] = useState("")
  const [documento, setDocumento] = useState("")
  const [correo, setCorreo] = useState("")
  const [password, setPassword] = useState("")
  const [adminArea, setAdminArea] = useState<Area>("cultura")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Edit dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<(AdminUser & { areaLabel: string }) | null>(null)
  const [editNombres, setEditNombres] = useState("")
  const [editCorreo, setEditCorreo] = useState("")
  const [editPassword, setEditPassword] = useState("")
  const [editArea, setEditArea] = useState<Area>("cultura")
  const [isUpdating, setIsUpdating] = useState(false)

  // Create deporte group states
  const [initializingGroups, setInitializingGroups] = useState(false)
  const [groupsInitialized, setGroupsInitialized] = useState(false)

  useEffect(() => {
    loadAdmins()
    checkDeporteGroups()
  }, [])

  async function checkDeporteGroups() {
    try {
      const groups = await getAllCulturalGroups('deporte')
      setGroupsInitialized(groups.length > 0)
    } catch (err) {
      console.error("Error checking deporte groups:", err)
    }
  }

  async function loadAdmins() {
    setLoading(true)
    try {
      const data = await getAllAdmins()
      setAdmins(data)
    } catch (err) {
      console.error("Error loading admins:", err)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateAdmin(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!password || password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      return
    }

    setCreating(true)

    try {
      const createdBy = sessionStorage.getItem("userId") || "superadmin"
      await createAdminUser(documento, correo, nombres, password, adminArea, createdBy)
      setSuccess(`Administrador de ${adminArea === 'cultura' ? 'Cultura' : 'Deporte'} creado exitosamente`)
      setNombres("")
      setDocumento("")
      setCorreo("")
      setPassword("")
      setAdminArea("cultura")
      loadAdmins()
    } catch (err: any) {
      setError(err.message || "Error al crear administrador")
    } finally {
      setCreating(false)
    }
  }

  function handleEditAdmin(admin: AdminUser & { areaLabel: string }) {
    setEditingAdmin(admin)
    setEditNombres(admin.nombres)
    setEditCorreo(admin.correo)
    setEditPassword("")
    // Si el admin no tiene área definida, usar 'cultura' por defecto
    setEditArea(admin.area || 'cultura')
    setEditDialogOpen(true)
    
    console.log("[SuperAdmin] Editing admin:", admin.id, "Area:", admin.area || 'cultura (default)')
  }

  async function handleUpdateAdmin() {
    if (!editingAdmin) return

    setError("")
    setSuccess("")
    setIsUpdating(true)

    try {
      const updates: any = {
        nombres: editNombres,
        correo: editCorreo,
        area: editArea,
      }

      if (editPassword && editPassword.length >= 6) {
        updates.password = editPassword
      }

      // Si el admin original no tiene área, usar 'cultura' por defecto
      const originalArea = editingAdmin.area || 'cultura'
      
      console.log("[SuperAdmin] Updating admin:", editingAdmin.id)
      console.log("[SuperAdmin] Original area:", originalArea)
      console.log("[SuperAdmin] New area:", editArea)
      console.log("[SuperAdmin] Updates:", updates)

      await updateAdminUser(editingAdmin.id, originalArea, updates)
      setSuccess("Administrador actualizado exitosamente")
      setEditDialogOpen(false)
      loadAdmins()
    } catch (err: any) {
      console.error("[SuperAdmin] Error updating admin:", err)
      setError(err.message || "Error al actualizar administrador")
    } finally {
      setIsUpdating(false)
    }
  }

  async function handleGenerateCombinedReport() {
    setGeneratingReport(true)
    setError("")
    setSuccess("")

    try {
      const stats = await generateCombinedReport()
      await generateCombinedReportPDF(stats)
      setSuccess(`Reporte generado: ${stats.combined.totalParticipants} participantes totales (Cultura: ${stats.combined.totalCultura}, Deporte: ${stats.combined.totalDeporte})`)
    } catch (err: any) {
      setError(err.message || "Error al generar reporte combinado")
    } finally {
      setGeneratingReport(false)
    }
  }

  async function handleMigrateCultura() {
    setMigrating(true)
    setError("")
    setSuccess("")
    setMigrationResults(null)

    try {
      const results = await migrateCulturaAddAreaField()
      setMigrationResults(results)
      
      const totalUpdated = results.reduce((sum, r) => sum + r.updated, 0)
      const totalErrors = results.reduce((sum, r) => sum + r.errors, 0)
      
      if (totalErrors > 0) {
        setError(`Migración completada con ${totalErrors} errores. ${totalUpdated} documentos actualizados.`)
      } else {
        setSuccess(`Migración exitosa: ${totalUpdated} documentos actualizados con el campo 'area: cultura'`)
      }
    } catch (err: any) {
      setError(err.message || "Error al ejecutar la migración")
    } finally {
      setMigrating(false)
    }
  }

  async function handleInitializeDeporteGroups() {
    const confirmed = window.confirm(
      `¿Estás seguro de que deseas crear ${GRUPOS_DEPORTIVOS.length} grupos deportivos?\n\n` +
      "Esta acción creará todos los grupos deportivos predefinidos en la base de datos de Deporte."
    )

    if (!confirmed) return
    
    setInitializingGroups(true)
    setError("")
    setSuccess("")

    try {
      let created = 0
      let errors = 0
      const errorMessages: string[] = []

      for (const groupName of GRUPOS_DEPORTIVOS) {
        try {
          await createCulturalGroup('deporte', groupName)
          created++
        } catch (err: any) {
          errors++
          errorMessages.push(`${groupName}: ${err.message}`)
        }
      }

      if (errors > 0) {
        setError(`Se crearon ${created} grupos con ${errors} errores. Revisa la consola para más detalles.`)
        console.error("Errores al crear grupos:", errorMessages)
      } else {
        setSuccess(`¡Éxito! Se crearon ${created} grupos deportivos correctamente.`)
        setGroupsInitialized(true)
      }
    } catch (err: any) {
      setError(err.message || "Error al inicializar grupos deportivos")
    } finally {
      setInitializingGroups(false)
    }
  }

  return (
    <SuperAdminGuard>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel de Super Administrador</h1>
          <p className="text-gray-600">Gestiona los usuarios administradores y configuraciones del sistema</p>
        </div>

        {/* Global Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Combined Report Button */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Reportes Combinados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Genera un reporte que combina datos de asistencia de Cultura y Deporte
              </p>
              <Button 
                onClick={handleGenerateCombinedReport}
                disabled={generatingReport}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {generatingReport ? "Generando..." : "Generar Reporte Combinado"}
              </Button>
            </CardContent>
          </Card>

          {/* Initialize Deporte Groups */}
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-green-600" />
                Inicializar Grupos Deportivos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Crea automáticamente todos los {GRUPOS_DEPORTIVOS.length} grupos deportivos predefinidos
              </p>
              {groupsInitialized ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-green-800">
                    ✓ Los grupos deportivos ya han sido inicializados
                  </p>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    ⚠ Los grupos deportivos aún no han sido creados
                  </p>
                </div>
              )}
              <Button 
                onClick={handleInitializeDeporteGroups} 
                disabled={initializingGroups}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {initializingGroups ? "Creando grupos..." : `Crear ${GRUPOS_DEPORTIVOS.length} Grupos Deportivos`}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Database Migration */}
        <Card className="mb-6 border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-orange-600" />
              Migración de Base de Datos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-orange-900 mb-1">
                    Agregar campo 'area' a documentos de Cultura
                  </p>
                  <p className="text-xs text-orange-700">
                    Esta operación agrega el campo <code className="bg-orange-100 px-1 rounded">area: 'cultura'</code> a todos los documentos 
                    en la base de datos de Cultura que no lo tengan.
                  </p>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleMigrateCultura}
              disabled={migrating}
              variant="outline"
              className="border-orange-600 text-orange-600 hover:bg-orange-50"
            >
              {migrating ? "Migrando..." : "Ejecutar Migración de Cultura"}
            </Button>

            {migrationResults && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-semibold">Resultados de la migración:</p>
                {migrationResults.map((result, index) => (
                  <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                    <span className="font-medium">{result.collection}:</span>{' '}
                    <span className="text-green-600">{result.updated} actualizados</span>,{' '}
                    <span className="text-gray-600">{result.skipped} omitidos</span>
                    {result.errors > 0 && (
                      <span className="text-red-600">, {result.errors} errores</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Formulario para crear admin */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Crear Nuevo Administrador
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateAdmin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombres">Nombres Completos</Label>
                  <Input
                    id="nombres"
                    value={nombres}
                    onChange={(e) => setNombres(e.target.value)}
                    placeholder="Ej: Juan Pérez"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="documento">Número de Documento</Label>
                  <Input
                    id="documento"
                    value={documento}
                    onChange={(e) => setDocumento(e.target.value)}
                    placeholder="Ej: 1234567890"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="correo">Correo Electrónico</Label>
                  <Input
                    id="correo"
                    type="email"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    placeholder="Ej: admin@univalle.edu.co"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="area">Área</Label>
                  <Select value={adminArea} onValueChange={(value) => setAdminArea(value as Area)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cultura">Cultura</SelectItem>
                      <SelectItem value="deporte">Deporte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" disabled={creating} className="w-full">
                  {creating ? "Creando..." : "Crear Administrador"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Lista de admins */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Administradores Registrados ({admins.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">Cargando...</div>
              ) : admins.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No hay administradores registrados</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Área</TableHead>
                        <TableHead>Documento</TableHead>
                        <TableHead className="text-center">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {admins.map((admin) => (
                        <TableRow key={admin.id}>
                          <TableCell className="font-medium">{admin.nombres}</TableCell>
                          <TableCell>
                            <Badge variant={admin.area === 'cultura' ? 'default' : 'secondary'}>
                              {admin.areaLabel}
                            </Badge>
                          </TableCell>
                          <TableCell>{admin.numeroDocumento}</TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditAdmin(admin)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Edit Admin Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Administrador</DialogTitle>
              <DialogDescription>
                Actualiza la información del administrador
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nombres">Nombres Completos</Label>
                <Input
                  id="edit-nombres"
                  value={editNombres}
                  onChange={(e) => setEditNombres(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-correo">Correo Electrónico</Label>
                <Input
                  id="edit-correo"
                  type="email"
                  value={editCorreo}
                  onChange={(e) => setEditCorreo(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-password">Nueva Contraseña (opcional)</Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Dejar vacío para no cambiar"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-area">Área</Label>
                <Select value={editArea} onValueChange={(value) => setEditArea(value as Area)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cultura">Cultura</SelectItem>
                    <SelectItem value="deporte">Deporte</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleUpdateAdmin}
                  disabled={isUpdating}
                  className="flex-1"
                >
                  {isUpdating ? "Actualizando..." : "Actualizar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      </div>
    </SuperAdminGuard>
  )
}

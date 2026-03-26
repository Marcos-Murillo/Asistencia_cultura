"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  AlertTriangle, 
  CheckCircle, 
  Search, 
  Wrench,
  Users,
  Database
} from "lucide-react"
import { collection, getDocs, doc, updateDoc, setDoc, query, where } from "firebase/firestore"
import { getFirestoreForArea } from "@/lib/firebase-config"

interface ProblematicUser {
  id: string
  nombres: string
  correo: string
  numeroDocumento: string
  area?: string
  grupoCultural?: string
  grupoDeportivo?: string
  grupo?: string
  problemas: string[]
  database: 'cultura' | 'deporte'
}

interface MissingEnrollmentUser {
  id: string
  nombres: string
  correo: string
  numeroDocumento: string
  area: string
  grupoEnPerfil: string
  campoGrupo: 'grupoCultural' | 'grupoDeportivo' | 'grupo'
  database: 'cultura' | 'deporte'
}

export default function DiagnosticoUsuariosPage() {
  const [loading, setLoading] = useState(false)
  const [scanning, setScanningMessage] = useState("")
  const [usuarios, setUsuarios] = useState<ProblematicUser[]>([])
  const [missingEnrollments, setMissingEnrollments] = useState<MissingEnrollmentUser[]>([])
  const [fixing, setFixing] = useState(false)
  const [fixedCount, setFixedCount] = useState(0)
  const [creatingEnrollments, setCreatingEnrollments] = useState(false)
  const [enrollmentsCreated, setEnrollmentsCreated] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function diagnosticar() {
    setLoading(true)
    setError(null)
    setSuccess(null)
    setUsuarios([])
    setMissingEnrollments([])
    setFixedCount(0)
    setEnrollmentsCreated(0)

    try {
      const problematicUsers: ProblematicUser[] = []
      const usersWithMissingEnrollments: MissingEnrollmentUser[] = []

      // Escanear BD Cultura
      setScanningMessage("Escaneando base de datos de Cultura...")
      const culturaDb = getFirestoreForArea('cultura')
      const culturaUsersRef = collection(culturaDb, "user_profiles")
      const culturaEnrollmentsRef = collection(culturaDb, "group_enrollments")
      const [culturaSnapshot, culturaEnrollmentsSnapshot] = await Promise.all([
        getDocs(culturaUsersRef),
        getDocs(culturaEnrollmentsRef)
      ])

      console.log("[Diagnostico] Usuarios en Cultura:", culturaSnapshot.size)
      console.log("[Diagnostico] Enrollments en Cultura:", culturaEnrollmentsSnapshot.size)

      // Crear mapa de enrollments existentes
      const culturaEnrollmentsByUser = new Map<string, Set<string>>()
      culturaEnrollmentsSnapshot.docs.forEach(doc => {
        const data = doc.data()
        if (!culturaEnrollmentsByUser.has(data.userId)) {
          culturaEnrollmentsByUser.set(data.userId, new Set())
        }
        culturaEnrollmentsByUser.get(data.userId)!.add(data.grupoCultural)
      })

      culturaSnapshot.docs.forEach(doc => {
        const data = doc.data()
        const problemas: string[] = []

        // Verificar campo area
        if (!data.area || data.area === '') {
          problemas.push("Campo 'area' vacío o inexistente")
        }

        // Verificar campos de grupo (pueden tener nombres diferentes)
        const tieneGrupoCultural = data.grupoCultural && data.grupoCultural !== ''
        const tieneGrupoDeportivo = data.grupoDeportivo && data.grupoDeportivo !== ''
        const tieneGrupo = data.grupo && data.grupo !== ''

        if (!tieneGrupoCultural && !tieneGrupoDeportivo && !tieneGrupo) {
          problemas.push("Sin grupo asignado (grupoCultural, grupoDeportivo, grupo)")
        }

        // Si tiene problemas, agregarlo
        if (problemas.length > 0) {
          problematicUsers.push({
            id: doc.id,
            nombres: data.nombres || 'Sin nombre',
            correo: data.correo || 'Sin correo',
            numeroDocumento: data.numeroDocumento || 'Sin documento',
            area: data.area,
            grupoCultural: data.grupoCultural,
            grupoDeportivo: data.grupoDeportivo,
            grupo: data.grupo,
            problemas,
            database: 'cultura'
          })
        }

        // Verificar si tiene grupo en perfil pero no enrollment
        const grupoEnPerfil = data.grupoCultural || data.grupoDeportivo || data.grupo
        if (grupoEnPerfil && grupoEnPerfil !== '') {
          const userEnrollments = culturaEnrollmentsByUser.get(doc.id)
          if (!userEnrollments || !userEnrollments.has(grupoEnPerfil)) {
            usersWithMissingEnrollments.push({
              id: doc.id,
              nombres: data.nombres || 'Sin nombre',
              correo: data.correo || 'Sin correo',
              numeroDocumento: data.numeroDocumento || 'Sin documento',
              area: data.area || 'cultura',
              grupoEnPerfil: grupoEnPerfil,
              campoGrupo: data.grupoCultural ? 'grupoCultural' : (data.grupoDeportivo ? 'grupoDeportivo' : 'grupo'),
              database: 'cultura'
            })
          }
        }
      })

      // Escanear BD Deporte
      setScanningMessage("Escaneando base de datos de Deporte...")
      const deporteDb = getFirestoreForArea('deporte')
      const deporteUsersRef = collection(deporteDb, "user_profiles")
      const deporteEnrollmentsRef = collection(deporteDb, "group_enrollments")
      const [deporteSnapshot, deporteEnrollmentsSnapshot] = await Promise.all([
        getDocs(deporteUsersRef),
        getDocs(deporteEnrollmentsRef)
      ])

      console.log("[Diagnostico] Usuarios en Deporte:", deporteSnapshot.size)
      console.log("[Diagnostico] Enrollments en Deporte:", deporteEnrollmentsSnapshot.size)

      // Crear mapa de enrollments existentes
      const deporteEnrollmentsByUser = new Map<string, Set<string>>()
      deporteEnrollmentsSnapshot.docs.forEach(doc => {
        const data = doc.data()
        if (!deporteEnrollmentsByUser.has(data.userId)) {
          deporteEnrollmentsByUser.set(data.userId, new Set())
        }
        deporteEnrollmentsByUser.get(data.userId)!.add(data.grupoCultural)
      })

      deporteSnapshot.docs.forEach(doc => {
        const data = doc.data()
        const problemas: string[] = []

        // Verificar campo area
        if (!data.area || data.area === '') {
          problemas.push("Campo 'area' vacío o inexistente")
        }

        // Verificar campos de grupo
        const tieneGrupoCultural = data.grupoCultural && data.grupoCultural !== ''
        const tieneGrupoDeportivo = data.grupoDeportivo && data.grupoDeportivo !== ''
        const tieneGrupo = data.grupo && data.grupo !== ''

        if (!tieneGrupoCultural && !tieneGrupoDeportivo && !tieneGrupo) {
          problemas.push("Sin grupo asignado (grupoCultural, grupoDeportivo, grupo)")
        }

        // Si tiene problemas, agregarlo
        if (problemas.length > 0) {
          problematicUsers.push({
            id: doc.id,
            nombres: data.nombres || 'Sin nombre',
            correo: data.correo || 'Sin correo',
            numeroDocumento: data.numeroDocumento || 'Sin documento',
            area: data.area,
            grupoCultural: data.grupoCultural,
            grupoDeportivo: data.grupoDeportivo,
            grupo: data.grupo,
            problemas,
            database: 'deporte'
          })
        }

        // Verificar si tiene grupo en perfil pero no enrollment
        const grupoEnPerfil = data.grupoCultural || data.grupoDeportivo || data.grupo
        if (grupoEnPerfil && grupoEnPerfil !== '') {
          const userEnrollments = deporteEnrollmentsByUser.get(doc.id)
          if (!userEnrollments || !userEnrollments.has(grupoEnPerfil)) {
            usersWithMissingEnrollments.push({
              id: doc.id,
              nombres: data.nombres || 'Sin nombre',
              correo: data.correo || 'Sin correo',
              numeroDocumento: data.numeroDocumento || 'Sin documento',
              area: data.area || 'deporte',
              grupoEnPerfil: grupoEnPerfil,
              campoGrupo: data.grupoCultural ? 'grupoCultural' : (data.grupoDeportivo ? 'grupoDeportivo' : 'grupo'),
              database: 'deporte'
            })
          }
        }
      })

      setUsuarios(problematicUsers)
      setMissingEnrollments(usersWithMissingEnrollments)
      setScanningMessage("")
      
      const totalIssues = problematicUsers.length + usersWithMissingEnrollments.length
      if (totalIssues === 0) {
        setSuccess("✅ No se encontraron usuarios con problemas")
      } else {
        setSuccess(`Se encontraron ${problematicUsers.length} usuarios con campos faltantes y ${usersWithMissingEnrollments.length} usuarios sin enrollment`)
      }

    } catch (err) {
      console.error("[Diagnostico] Error:", err)
      setError("Error al diagnosticar usuarios: " + (err as Error).message)
      setScanningMessage("")
    } finally {
      setLoading(false)
    }
  }

  async function crearEnrollmentsFaltantes() {
    if (missingEnrollments.length === 0) return

    setCreatingEnrollments(true)
    setError(null)
    setSuccess(null)
    let created = 0

    try {
      for (const usuario of missingEnrollments) {
        const db = getFirestoreForArea(usuario.database)
        const enrollmentsRef = collection(db, "group_enrollments")
        
        // Verificar que el grupo existe en el perfil
        if (!usuario.grupoEnPerfil || usuario.grupoEnPerfil === '') {
          console.log(`[Crear Enrollments] Usuario ${usuario.id}: Sin grupo en perfil, saltando`)
          continue
        }

        // Verificar si ya existe el enrollment (doble verificación)
        const existingQuery = query(
          enrollmentsRef,
          where("userId", "==", usuario.id),
          where("grupoCultural", "==", usuario.grupoEnPerfil)
        )
        const existingSnapshot = await getDocs(existingQuery)

        if (!existingSnapshot.empty) {
          console.log(`[Crear Enrollments] Usuario ${usuario.id}: Enrollment ya existe, saltando`)
          continue
        }

        // Crear enrollment
        const enrollmentData = {
          userId: usuario.id,
          grupoCultural: usuario.grupoEnPerfil,
          enrolledAt: new Date(),
          createdBy: 'migracion-automatica'
        }

        await setDoc(doc(enrollmentsRef), enrollmentData)
        created++
        console.log(`[Crear Enrollments] Usuario ${usuario.id}: Enrollment creado para grupo ${usuario.grupoEnPerfil}`)
      }

      setEnrollmentsCreated(created)
      setSuccess(`✅ Se crearon ${created} enrollments correctamente`)
      
      // Limpiar lista después de crear
      setTimeout(() => {
        setMissingEnrollments([])
      }, 2000)

    } catch (err) {
      console.error("[Crear Enrollments] Error:", err)
      setError("Error al crear enrollments: " + (err as Error).message)
    } finally {
      setCreatingEnrollments(false)
    }
  }

  async function repararUsuarios() {
    if (usuarios.length === 0) return

    setFixing(true)
    setError(null)
    setSuccess(null)
    let fixed = 0

    try {
      for (const usuario of usuarios) {
        const db = getFirestoreForArea(usuario.database)
        const userRef = doc(db, "user_profiles", usuario.id)
        
        const updates: any = {}

        // Reparar campo area
        if (!usuario.area || usuario.area === '') {
          updates.area = usuario.database
          console.log(`[Reparar] Usuario ${usuario.id}: Agregando area=${usuario.database}`)
        }

        // Normalizar campo de grupo a 'grupoCultural'
        let grupoFinal = usuario.grupoCultural

        // Si no tiene grupoCultural pero tiene otro campo de grupo, usar ese
        if (!grupoFinal || grupoFinal === '') {
          if (usuario.grupoDeportivo && usuario.grupoDeportivo !== '') {
            grupoFinal = usuario.grupoDeportivo
            updates.grupoCultural = usuario.grupoDeportivo
            console.log(`[Reparar] Usuario ${usuario.id}: Copiando grupoDeportivo -> grupoCultural`)
          } else if (usuario.grupo && usuario.grupo !== '') {
            grupoFinal = usuario.grupo
            updates.grupoCultural = usuario.grupo
            console.log(`[Reparar] Usuario ${usuario.id}: Copiando grupo -> grupoCultural`)
          }
        }

        // Si hay actualizaciones, aplicarlas
        if (Object.keys(updates).length > 0) {
          await updateDoc(userRef, updates)
          fixed++
          console.log(`[Reparar] Usuario ${usuario.id}: Actualizado`, updates)

          // Si tiene grupo, crear enrollment si no existe
          if (grupoFinal && grupoFinal !== '') {
            const enrollmentsRef = collection(db, "group_enrollments")
            const enrollmentDoc = doc(enrollmentsRef)
            
            await setDoc(enrollmentDoc, {
              userId: usuario.id,
              grupoCultural: grupoFinal,
              enrolledAt: new Date(),
              createdBy: 'sistema-diagnostico'
            })
            
            console.log(`[Reparar] Usuario ${usuario.id}: Enrollment creado para grupo ${grupoFinal}`)
          }
        }
      }

      setFixedCount(fixed)
      setSuccess(`✅ Se repararon ${fixed} usuarios correctamente`)
      
      // Limpiar lista después de reparar
      setTimeout(() => {
        setUsuarios([])
      }, 2000)

    } catch (err) {
      console.error("[Reparar] Error:", err)
      setError("Error al reparar usuarios: " + (err as Error).message)
    } finally {
      setFixing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4 md:p-6">
      <div className="container mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Database className="h-6 w-6" />
              Diagnóstico y Reparación de Usuarios
            </CardTitle>
            <CardDescription>
              Encuentra y repara usuarios con campos faltantes o inconsistentes
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Alertas */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Acciones */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <Button
                onClick={diagnosticar}
                disabled={loading || fixing}
                className="flex-1"
                size="lg"
              >
                <Search className="h-5 w-5 mr-2" />
                {loading ? "Escaneando..." : "Diagnosticar Usuarios"}
              </Button>

              <Button
                onClick={repararUsuarios}
                disabled={usuarios.length === 0 || fixing || loading}
                variant="default"
                className="flex-1 bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <Wrench className="h-5 w-5 mr-2" />
                {fixing ? "Reparando..." : `Reparar ${usuarios.length} Usuarios`}
              </Button>

              <Button
                onClick={crearEnrollmentsFaltantes}
                disabled={missingEnrollments.length === 0 || creatingEnrollments || loading}
                variant="default"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                <Users className="h-5 w-5 mr-2" />
                {creatingEnrollments ? "Creando..." : `Crear ${missingEnrollments.length} Enrollments`}
              </Button>
            </div>

            {scanning && (
              <p className="text-sm text-gray-600 mt-4 text-center animate-pulse">
                {scanning}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Estadísticas */}
        {(usuarios.length > 0 || missingEnrollments.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                  <p className="text-2xl font-bold">{usuarios.length}</p>
                  <p className="text-sm text-gray-600">Campos faltantes</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                  <p className="text-2xl font-bold">{missingEnrollments.length}</p>
                  <p className="text-sm text-gray-600">Sin enrollment</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Database className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-2xl font-bold">
                    {usuarios.filter(u => u.database === 'cultura').length + missingEnrollments.filter(u => u.database === 'cultura').length}
                  </p>
                  <p className="text-sm text-gray-600">En BD Cultura</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Database className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="text-2xl font-bold">
                    {usuarios.filter(u => u.database === 'deporte').length + missingEnrollments.filter(u => u.database === 'deporte').length}
                  </p>
                  <p className="text-sm text-gray-600">En BD Deporte</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Lista de usuarios con campos faltantes */}
        {usuarios.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Usuarios con Campos Faltantes ({usuarios.length})
              </CardTitle>
              <CardDescription>
                Usuarios con campos area o grupo vacíos o inconsistentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {usuarios.map((usuario) => (
                  <Card key={usuario.id} className="border-orange-200">
                    <CardContent className="pt-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="font-semibold">{usuario.nombres}</h4>
                          <p className="text-sm text-gray-600">{usuario.correo}</p>
                          <p className="text-xs text-gray-500">Doc: {usuario.numeroDocumento}</p>
                          
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              BD: {usuario.database}
                            </Badge>
                            {usuario.area && (
                              <Badge variant="secondary" className="text-xs">
                                Area: {usuario.area}
                              </Badge>
                            )}
                            {usuario.grupoCultural && (
                              <Badge className="bg-blue-100 text-blue-800 text-xs">
                                grupoCultural: {usuario.grupoCultural}
                              </Badge>
                            )}
                            {usuario.grupoDeportivo && (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                grupoDeportivo: {usuario.grupoDeportivo}
                              </Badge>
                            )}
                            {usuario.grupo && (
                              <Badge className="bg-purple-100 text-purple-800 text-xs">
                                grupo: {usuario.grupo}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          {usuario.problemas.map((problema, idx) => (
                            <Badge key={idx} variant="destructive" className="text-xs">
                              {problema}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de usuarios sin enrollment */}
        {missingEnrollments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-yellow-600" />
                Usuarios Sin Enrollment ({missingEnrollments.length})
              </CardTitle>
              <CardDescription>
                Usuarios con grupo en perfil pero sin registro en group_enrollments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {missingEnrollments.map((usuario) => (
                  <Card key={usuario.id} className="border-yellow-200 bg-yellow-50">
                    <CardContent className="pt-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="font-semibold">{usuario.nombres}</h4>
                          <p className="text-sm text-gray-600">{usuario.correo}</p>
                          <p className="text-xs text-gray-500">Doc: {usuario.numeroDocumento}</p>
                          
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              BD: {usuario.database}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              Area: {usuario.area}
                            </Badge>
                            <Badge className="bg-purple-100 text-purple-800 text-xs">
                              Grupo: {usuario.grupoEnPerfil}
                            </Badge>
                            <Badge className="bg-gray-100 text-gray-800 text-xs">
                              Campo: {usuario.campoGrupo}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <Badge variant="default" className="bg-yellow-600 text-xs">
                            Sin enrollment
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {enrollmentsCreated > 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-blue-600" />
                <h3 className="text-xl font-bold text-blue-800 mb-2">
                  ¡Enrollments Creados!
                </h3>
                <p className="text-blue-700">
                  Se crearon {enrollmentsCreated} enrollments exitosamente
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {fixedCount > 0 && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-600" />
                <h3 className="text-xl font-bold text-green-800 mb-2">
                  ¡Reparación Completada!
                </h3>
                <p className="text-green-700">
                  Se repararon {fixedCount} usuarios exitosamente
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

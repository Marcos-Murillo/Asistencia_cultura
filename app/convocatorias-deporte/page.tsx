"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { User, CheckCircle, AlertCircle, Calendar } from "lucide-react"
import {
  GENEROS,
  GENEROS_LABELS,
  ETNIAS,
  TIPOS_DOCUMENTO,
  SEDES,
  ESTAMENTOS,
  FACULTADES,
  PROGRAMAS_POR_FACULTAD,
} from "@/lib/data"
import {
  saveUserProfile,
  saveUserProfileAndEnroll,
  findSimilarUsers,
  getActiveEvents,
  saveEventAttendance,
  getUserEventEnrollments,
  getActiveRealEvents,
  saveRealEventAttendance,
  getUserRealEventEnrollments,
  getAllTorneos,
  inscribirEnTorneo,
  getEquipoByCodigo,
} from "@/lib/db-router"
import type { FormData, SimilarUser, UserProfile, Event } from "@/lib/types"
import type { Torneo } from "@/lib/types"

export default function ConvocatoriasDeportePage() {
  const area: 'deporte' = 'deporte' // Área hardcoded para deporte
  const { toast } = useToast()
  const [formData, setFormData] = useState<FormData>({
    nombres: "",
    correo: "",
    genero: "",
    etnia: "",
    tipoDocumento: "",
    numeroDocumento: "",
    edad: "",
    telefono: "",
    sede: "",
    estamento: "",
    codigoEstudiantil: "",
    facultad: "",
    programaAcademico: "",
    grupoCultural: "",
    eventoId: "",
  })

  const [isCheckingSimilarity, setIsCheckingSimilarity] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [similarUsers, setSimilarUsers] = useState<SimilarUser[]>([])
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [activeEvents, setActiveEvents] = useState<Event[]>([])
  const [activeRealEvents, setActiveRealEvents] = useState<Event[]>([])
  const [activeTorneos, setActiveTorneos] = useState<Torneo[]>([])
  const [codigoEquipo, setCodigoEquipo] = useState("")
  const [codigoEquipoError, setCodigoEquipoError] = useState("")  const [currentStep, setCurrentStep] = useState(1)
  const [userEventEnrollments, setUserEventEnrollments] = useState<string[]>([])
  const [userRealEventEnrollments, setUserRealEventEnrollments] = useState<string[]>([])

  const requiresAcademicInfo = formData.estamento === "ESTUDIANTE" || formData.estamento === "EGRESADO"
  const totalSteps = selectedUser ? 1 : requiresAcademicInfo ? 4 : 3

  useEffect(() => {
    loadActiveEvents()
  }, [area])

  useEffect(() => {
    const checkSimilarity = async () => {
      if (
        formData.nombres.length > 2 ||
        formData.correo.length > 5 ||
        formData.numeroDocumento.length > 3 ||
        formData.telefono.length > 5
      ) {
        setIsCheckingSimilarity(true)
        try {
          const similar = await findSimilarUsers(
            area,
            formData.nombres,
            formData.correo,
            formData.numeroDocumento,
            formData.telefono,
          )
          setSimilarUsers(similar)
          setShowSuggestions(similar.length > 0)
        } catch (error) {
          console.error("Error checking similarity:", error)
        } finally {
          setIsCheckingSimilarity(false)
        }
      } else {
        setSimilarUsers([])
        setShowSuggestions(false)
      }
    }

    const timeoutId = setTimeout(checkSimilarity, 500)
    return () => clearTimeout(timeoutId)
  }, [formData.nombres, formData.correo, formData.numeroDocumento, formData.telefono, area])

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value }

      if (field === "facultad") {
        newData.programaAcademico = ""
      }

      if (field === "estamento" && value !== "ESTUDIANTE" && value !== "EGRESADO") {
        newData.codigoEstudiantil = ""
        newData.facultad = ""
        newData.programaAcademico = ""
      }

      if (field === "estamento" && value === "EGRESADO") {
        // Egresados también tienen código estudiantil
      }

      return newData
    })
  }

  const handleSelectUser = async (user: UserProfile) => {
    setSelectedUser(user)
    setFormData({
      nombres: user.nombres,
      correo: user.correo,
      genero: user.genero,
      etnia: user.etnia,
      tipoDocumento: user.tipoDocumento,
      numeroDocumento: user.numeroDocumento,
      edad: user.edad.toString(),
      telefono: user.telefono,
      sede: user.sede,
      estamento: user.estamento,
      codigoEstudiantil: user.codigoEstudiantil || "",
      facultad: user.facultad || "",
      programaAcademico: user.programaAcademico || "",
      grupoCultural: "",
      eventoId: "",
    })
    setShowSuggestions(false)
    setCurrentStep(1)

    // Cargar eventos en los que ya está inscrito
    const enrolledEvents = await getUserEventEnrollments(area, user.id)
    setUserEventEnrollments(enrolledEvents)
    const enrolledRealEvents = await getUserRealEventEnrollments(area, user.id)
    setUserRealEventEnrollments(enrolledRealEvents)

    toast({
      title: "Usuario reconocido",
      description: `¡Hola ${user.nombres}! Selecciona el evento al que deseas inscribirte.`,
    })
  }

  const handleDismissSuggestions = () => {
    setShowSuggestions(false)
    setSelectedUser(null)
  }

  const validateStep = (step: number): boolean => {
    if (selectedUser) {
      return !!formData.eventoId
    }

    switch (step) {
      case 1:
        return !!(
          formData.nombres &&
          formData.correo &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo) &&
          formData.genero &&
          formData.etnia &&
          formData.tipoDocumento &&
          formData.numeroDocumento &&
          formData.edad &&
          formData.telefono
        )
      case 2:
        return !!(formData.sede && formData.estamento)
      case 3:
        if (formData.estamento === "ESTUDIANTE") {
          return !!(formData.codigoEstudiantil && formData.codigoEstudiantil.length === 9 && formData.facultad && formData.programaAcademico)
        }
        if (formData.estamento === "EGRESADO") {
          return !!(formData.codigoEstudiantil && formData.codigoEstudiantil.length === 9 && formData.facultad && formData.programaAcademico)
        }
        // No es estudiante/egresado: paso 3 es selección de evento
        return !!formData.eventoId
      case 4:
        return !!formData.eventoId
      default:
        return false
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps))
    } else {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos antes de continuar.",
        variant: "destructive",
      })
    }
  }

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  async function loadActiveEvents() {
    try {
      const [convocatorias, eventos, torneos] = await Promise.all([
        getActiveEvents(area),
        getActiveRealEvents(area),
        getAllTorneos(),
      ])
      setActiveEvents(convocatorias)
      setActiveRealEvents(eventos)
      setActiveTorneos(torneos.filter(t => t.activo && t.fase === "inscripcion"))
    } catch (error) {
      console.error("Error cargando eventos activos:", error)
    }
  }

  async function handleSubmit() {
    if (!formData.eventoId) {
      setError("Debes seleccionar un evento")
      return
    }

    // Si es torneo grupal, validar código de equipo
    const torneoSeleccionado = activeTorneos.find(t => `torneo_${t.id}` === formData.eventoId)
    if (torneoSeleccionado?.tipo === "grupal") {
      if (!codigoEquipo.trim()) {
        setCodigoEquipoError("Debes ingresar el código del equipo")
        return
      }
      const equipo = await getEquipoByCodigo(torneoSeleccionado.id, codigoEquipo.trim().toLowerCase())
      if (!equipo) {
        setCodigoEquipoError("Código de equipo inválido. Verifica con tu capitán.")
        return
      }
      setCodigoEquipoError("")
    }

    if (isSubmitting) {
      console.log("[Convocatorias] Submit already in progress, ignoring duplicate click")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      let userId: string

      if (selectedUser) {
        userId = selectedUser.id
        console.log("[Convocatorias] Saving event attendance for user:", userId, "event:", formData.eventoId)
        const torneoSel = activeTorneos.find(t => `torneo_${t.id}` === formData.eventoId)
        if (torneoSel) {
          let equipoId: string | undefined
          if (torneoSel.tipo === "grupal") {
            const eq = await getEquipoByCodigo(torneoSel.id, codigoEquipo.trim().toLowerCase())
            equipoId = eq?.id
          }
          await inscribirEnTorneo(torneoSel.id, userId, equipoId)
        } else {
          const isRealEvent = activeRealEvents.some(e => e.id === formData.eventoId)
          if (isRealEvent) {
            await saveRealEventAttendance(area, userId, formData.eventoId)
          } else {
            await saveEventAttendance(area, userId, formData.eventoId)
          }
        }
      } else {
        const userProfile = {
          area,
          nombres: formData.nombres,
          correo: formData.correo,
          genero: formData.genero as any,
          etnia: formData.etnia as any,
          tipoDocumento: formData.tipoDocumento as any,
          numeroDocumento: formData.numeroDocumento,
          edad: Number.parseInt(formData.edad),
          telefono: formData.telefono,
          sede: formData.sede as any,
          estamento: formData.estamento as any,
          ...(formData.estamento === "ESTUDIANTE" &&
            formData.codigoEstudiantil && {
              codigoEstudiantil: formData.codigoEstudiantil,
            }),
          ...((formData.estamento === "ESTUDIANTE" || formData.estamento === "EGRESADO") &&
            formData.facultad && {
              facultad: formData.facultad,
            }),
          ...((formData.estamento === "ESTUDIANTE" || formData.estamento === "EGRESADO") &&
            formData.programaAcademico && {
              programaAcademico: formData.programaAcademico,
            }),
        }

        console.log("[Convocatorias] Creating new user profile:", userProfile)
        userId = await saveUserProfile(area, userProfile)
        console.log("[Convocatorias] New user created with ID:", userId)

        console.log("[Convocatorias] Saving event attendance for user:", userId, "event:", formData.eventoId)
        const torneoSel2 = activeTorneos.find(t => `torneo_${t.id}` === formData.eventoId)
        if (torneoSel2) {
          let equipoId2: string | undefined
          if (torneoSel2.tipo === "grupal") {
            const eq2 = await getEquipoByCodigo(torneoSel2.id, codigoEquipo.trim().toLowerCase())
            equipoId2 = eq2?.id
          }
          await inscribirEnTorneo(torneoSel2.id, userId, equipoId2)
        } else {
          const isRealEvent2 = activeRealEvents.some(e => e.id === formData.eventoId)
          if (isRealEvent2) {
            await saveRealEventAttendance(area, userId, formData.eventoId)
          } else {
            await saveEventAttendance(area, userId, formData.eventoId)
          }
        }
      }

      console.log("[Convocatorias] Event attendance saved successfully")

      setSuccess(true)
      setTimeout(() => {
        setFormData({
          nombres: "",
          correo: "",
          genero: "",
          etnia: "",
          tipoDocumento: "",
          numeroDocumento: "",
          edad: "",
          telefono: "",
          sede: "",
          estamento: "",
          codigoEstudiantil: "",
          facultad: "",
          programaAcademico: "",
          grupoCultural: "",
          eventoId: "",
        })
        setCurrentStep(1)
        setSuccess(false)
        setSelectedUser(null)
        setSimilarUsers([])
        setUserEventEnrollments([])
        setUserRealEventEnrollments([])
      }, 3000)
    } catch (error: any) {
      console.error("Error saving event attendance:", error)
      setError(error.message || "Hubo un problema al registrar la inscripción. Por favor intenta nuevamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    if (selectedUser) {
      return (
        <div className="space-y-4">
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Usuario reconocido:</strong> {selectedUser.nombres}
              <br />
              <span className="text-sm text-green-600">
                Última asistencia: {selectedUser.lastAttendance.toLocaleDateString()}
              </span>
            </AlertDescription>
          </Alert>

          {renderEventSelection()}
        </div>
      )
    }

    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            {showSuggestions && similarUsers.length > 0 && (
              <Alert className="border-blue-200 bg-blue-50">
                <User className="h-4 w-4 text-blue-600" />
                <AlertDescription>
                  <div className="space-y-3">
                    <p className="text-blue-800 font-medium">¿Eres alguno de estos usuarios?</p>
                    {similarUsers.map((similar) => (
                      <div
                        key={similar.user.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-white rounded-lg border cursor-pointer hover:bg-gray-50 gap-3"
                        onClick={() => handleSelectUser(similar.user)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{similar.user.nombres}</p>
                          <p className="text-sm text-gray-600 truncate">{similar.user.correo}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {similar.matchingFields.map((field) => (
                              <Badge key={field} variant="secondary" className="text-xs">
                                {field}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button size="sm" className="w-full sm:w-auto shrink-0">
                          Seleccionar
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDismissSuggestions}
                      className="w-full text-gray-600"
                    >
                      No soy ninguno de estos usuarios
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {isCheckingSimilarity && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">Verificando si ya tienes un registro...</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombres">Nombres y Apellidos *</Label>
                <Input
                  id="nombres"
                  value={formData.nombres}
                  onChange={(e) => handleInputChange("nombres", e.target.value)}
                  placeholder="Ingresa tu nombre completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="correo">Correo Institucional *</Label>
                <Input
                  id="correo"
                  type="email"
                  value={formData.correo}
                  onChange={(e) => handleInputChange("correo", e.target.value)}
                  placeholder="correo@ejemplo.com"
                />
                {formData.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo) && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Ingresa un correo electrónico válido
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="genero">Género *</Label>
                <Select value={formData.genero} onValueChange={(value) => handleInputChange("genero", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tu género" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENEROS.map((genero) => (
                      <SelectItem key={genero} value={genero}>
                        {GENEROS_LABELS[genero]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="etnia">Etnia *</Label>
                <Select value={formData.etnia} onValueChange={(value) => handleInputChange("etnia", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tu etnia" />
                  </SelectTrigger>
                  <SelectContent>
                    {ETNIAS.map((etnia) => (
                      <SelectItem key={etnia} value={etnia}>
                        {etnia}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipoDocumento">Tipo de Documento *</Label>
                <Select
                  value={formData.tipoDocumento}
                  onValueChange={(value) => handleInputChange("tipoDocumento", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tipo de documento" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_DOCUMENTO.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="numeroDocumento">Número de Documento *</Label>
                <Input
                  id="numeroDocumento"
                  value={formData.numeroDocumento}
                  onChange={(e) => handleInputChange("numeroDocumento", e.target.value)}
                  placeholder="Número de documento"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edad">Edad *</Label>
                <Input
                  id="edad"
                  type="number"
                  value={formData.edad}
                  onChange={(e) => handleInputChange("edad", e.target.value)}
                  placeholder="Tu edad"
                  min="1"
                  max="120"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono - Celular *</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => handleInputChange("telefono", e.target.value)}
                  placeholder="Número de teléfono"
                />
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sede">Sede a la que Pertenece *</Label>
              <Select value={formData.sede} onValueChange={(value) => handleInputChange("sede", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tu sede" />
                </SelectTrigger>
                <SelectContent>
                  {SEDES.map((sede) => (
                    <SelectItem key={sede} value={sede}>
                      {sede}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estamento">Estamento *</Label>
              <Select value={formData.estamento} onValueChange={(value) => handleInputChange("estamento", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tu estamento" />
                </SelectTrigger>
                <SelectContent>
                  {ESTAMENTOS.map((estamento) => (
                    <SelectItem key={estamento} value={estamento}>
                      {estamento}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      case 3:
        if (formData.estamento === "ESTUDIANTE" || formData.estamento === "EGRESADO") {
          return (
            <div className="space-y-4">
              {(formData.estamento === "ESTUDIANTE" || formData.estamento === "EGRESADO") && (
                <div className="space-y-2">
                  <Label htmlFor="codigoEstudiantil">Código Estudiantil * (9 dígitos, ej: 202625413)</Label>
                  <Input
                    id="codigoEstudiantil"
                    value={formData.codigoEstudiantil}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 9)
                      handleInputChange("codigoEstudiantil", val)
                    }}
                    placeholder="202625413"
                    maxLength={9}
                    inputMode="numeric"
                  />
                  {formData.codigoEstudiantil && formData.codigoEstudiantil.length !== 9 && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      El código debe tener exactamente 9 dígitos
                    </p>
                  )}
                  {(!formData.codigoEstudiantil || formData.codigoEstudiantil.length === 9) && (
                    <p className="text-xs text-gray-500">Ingresa el código completo de 9 dígitos</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="facultad">
                  {formData.estamento === "EGRESADO" ? "Facultad de la que Egresó *" : "Facultad a la que Pertenece *"}
                </Label>
                <Select value={formData.facultad} onValueChange={(value) => handleInputChange("facultad", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tu facultad" />
                  </SelectTrigger>
                  <SelectContent>
                    {FACULTADES.map((facultad) => (
                      <SelectItem key={facultad} value={facultad}>
                        {facultad}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.facultad && (
                <div className="space-y-2">
                  <Label htmlFor="programaAcademico">
                    {formData.estamento === "EGRESADO" ? "Programa del que Egresó *" : "Programa Académico *"}
                  </Label>
                  <Select
                    value={formData.programaAcademico}
                    onValueChange={(value) => handleInputChange("programaAcademico", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tu programa académico" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROGRAMAS_POR_FACULTAD[formData.facultad]?.map((programa) => (
                        <SelectItem key={programa} value={programa}>
                          {programa}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )
        }
        return renderEventSelection()

      case 4:
        return renderEventSelection()

      default:
        return null
    }
  }

  const renderEventSelection = () => {
    const availableConvocatorias = activeEvents.filter(e => !userEventEnrollments.includes(e.id))
    const enrolledConvocatorias = activeEvents.filter(e => userEventEnrollments.includes(e.id))
    const availableRealEvents = activeRealEvents.filter(e => !userRealEventEnrollments.includes(e.id))
    const enrolledRealEvents = activeRealEvents.filter(e => userRealEventEnrollments.includes(e.id))

    const allEnrolled = [...enrolledConvocatorias, ...enrolledRealEvents]
    const totalAvailable = availableConvocatorias.length + availableRealEvents.length + activeTorneos.length

    // Torneo seleccionado (si aplica)
    const torneoSeleccionado = activeTorneos.find(t => `torneo_${t.id}` === formData.eventoId)

    if (activeEvents.length === 0 && activeRealEvents.length === 0 && activeTorneos.length === 0) {
      return (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>No hay convocatorias ni eventos disponibles en este momento.</strong>
            <p className="text-sm mt-1">Por favor vuelve más tarde.</p>
          </AlertDescription>
        </Alert>
      )
    }

    const selectedEventInfo = [
      ...activeEvents.map(e => ({ ...e, _tipo: "convocatoria" as const })),
      ...activeRealEvents.map(e => ({ ...e, _tipo: "evento" as const })),
    ].find(e => e.id === formData.eventoId)

    return (
      <div className="space-y-4">
        {allEnrolled.length > 0 && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Ya estás inscrito en:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                {allEnrolled.map(e => <li key={e.id}>• {e.nombre}</li>)}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {totalAvailable === 0 && allEnrolled.length > 0 ? (
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Ya estás inscrito en todas las convocatorias y eventos disponibles.</strong>
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="eventoId">Selecciona la Convocatoria o Evento *</Label>
              <Select value={formData.eventoId} onValueChange={(value) => handleInputChange("eventoId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una opción" />
                </SelectTrigger>
                <SelectContent>
                  {availableConvocatorias.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-purple-600 bg-purple-50">CONVOCATORIAS</div>
                      {availableConvocatorias.map(e => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.nombre} - {e.hora} ({e.lugar})
                        </SelectItem>
                      ))}
                    </>
                  )}
                  {availableRealEvents.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50">EVENTOS</div>
                      {availableRealEvents.map(e => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.nombre} - {e.hora} ({e.lugar})
                        </SelectItem>
                      ))}
                    </>
                  )}
                  {activeTorneos.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-orange-600 bg-orange-50">TORNEOS</div>
                      {activeTorneos.map(t => (
                        <SelectItem key={`torneo_${t.id}`} value={`torneo_${t.id}`}>
                          🏆 {t.nombre} ({t.tipo === "grupal" ? "Grupal" : "Individual"} · {t.lugar})
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Código de equipo para torneos grupales */}
            {torneoSeleccionado?.tipo === "grupal" && (
              <div className="space-y-2 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <Label htmlFor="codigoEquipo" className="text-orange-800 font-medium">
                  🏆 Código del equipo *
                </Label>
                <p className="text-xs text-orange-600">Este torneo es grupal. Ingresa el código que te dio el capitán de tu equipo.</p>
                <Input
                  id="codigoEquipo"
                  value={codigoEquipo}
                  onChange={e => { setCodigoEquipo(e.target.value.toLowerCase()); setCodigoEquipoError("") }}
                  placeholder="Ej: a1b2"
                  className="font-mono uppercase tracking-widest text-center text-lg border-orange-300 focus:border-orange-500"
                  maxLength={4}
                />
                {codigoEquipoError && <p className="text-xs text-red-600">{codigoEquipoError}</p>}
              </div>
            )}

            {selectedEventInfo && (
              <div className={`p-4 rounded-lg border ${selectedEventInfo._tipo === "evento" ? "bg-blue-50 border-blue-200" : "bg-purple-50 border-purple-200"}`}>
                <div className="flex items-start gap-3">
                  <Calendar className={`h-5 w-5 mt-0.5 ${selectedEventInfo._tipo === "evento" ? "text-blue-600" : "text-purple-600"}`} />
                  <div className="text-sm">
                    <p className={`font-medium ${selectedEventInfo._tipo === "evento" ? "text-blue-800" : "text-purple-800"}`}>
                      {selectedEventInfo._tipo === "evento" ? "Evento" : "Convocatoria"}: {selectedEventInfo.nombre}
                    </p>
                    <p className="text-xs mt-1 text-gray-500">
                      Asegúrate de seleccionar la opción correcta antes de confirmar tu inscripción.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {torneoSeleccionado && (
              <div className="p-4 rounded-lg border bg-orange-50 border-orange-200">
                <div className="flex items-start gap-3">
                  <span className="text-lg">🏆</span>
                  <div className="text-sm">
                    <p className="font-medium text-orange-800">Torneo: {torneoSeleccionado.nombre}</p>
                    <p className="text-xs text-orange-600 mt-1">{torneoSeleccionado.tipo === "grupal" ? "Modalidad grupal — necesitas el código de tu equipo." : "Modalidad individual."}</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  const getStepTitle = () => {
    if (selectedUser) {
      return "Seleccionar Evento"
    }

    switch (currentStep) {
      case 1:
        return "Información Personal"
      case 2:
        return "Información Institucional"
      case 3:
        return formData.estamento === "ESTUDIANTE" || formData.estamento === "EGRESADO"
          ? "Información Académica"
          : "Seleccionar Evento"
      case 4:
        return "Seleccionar Evento"
      default:
        return ""
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      <div className="p-4">
        <div className="max-w-2xl mx-auto">
          {/* Link a torneos para usuarios no-admin */}
          <div className="flex justify-end mb-3">
            <a href="/torneos" className="flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 font-medium bg-orange-50 border border-orange-200 rounded-lg px-3 py-1.5 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
              Ver Torneos
            </a>
          </div>
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-900">Inscripción a Convocatorias</CardTitle>
              <CardDescription className="text-lg">
                Eventos Deportivos - Universidad del Valle
              </CardDescription>
              {!selectedUser && (
                <>
                  <div className="flex justify-center mt-4">
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4].slice(0, totalSteps).map((step) => (
                        <div key={step} className="flex items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                              step === currentStep
                                ? "bg-purple-600 text-white"
                                : step < currentStep
                                  ? "bg-green-500 text-white"
                                  : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {step < currentStep ? "✓" : step}
                          </div>
                          {step < totalSteps && <div className="w-8 h-0.5 bg-gray-300" />}
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{getStepTitle()}</p>
                </>
              )}
            </CardHeader>

            <CardContent className="space-y-6">
              {success ? (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>¡Inscripción exitosa!</strong>
                    <br />
                    Tu inscripción al evento ha sido registrada correctamente.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  {error && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">{error}</AlertDescription>
                    </Alert>
                  )}

                  {renderStep()}

                  <div className="flex gap-3 pt-4">
                    {!selectedUser && currentStep > 1 && (
                      <Button variant="outline" onClick={handlePrevious} className="flex-1">
                        Anterior
                      </Button>
                    )}

                    {(selectedUser || currentStep === totalSteps) ? (
                      <Button
                        onClick={handleSubmit}
                        disabled={
                          isSubmitting || 
                          !validateStep(currentStep) || 
                          (!!selectedUser && 
                            activeEvents.filter(e => !userEventEnrollments.includes(e.id)).length === 0 &&
                            activeRealEvents.filter(e => !userRealEventEnrollments.includes(e.id)).length === 0
                          )
                        }
                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                      >
                        {isSubmitting ? "Registrando..." : "Confirmar Inscripción"}
                      </Button>
                    ) : (
                      <Button
                        onClick={handleNext}
                        disabled={!validateStep(currentStep)}
                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                      >
                        Siguiente
                      </Button>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Toaster />
    </div>
  )
}

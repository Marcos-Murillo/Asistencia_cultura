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
import { Navigation } from "@/components/navigation"
import { User, CheckCircle, AlertCircle, Calendar } from "lucide-react"
import {
  GENEROS,
  ETNIAS,
  TIPOS_DOCUMENTO,
  SEDES,
  ESTAMENTOS,
  FACULTADES,
  PROGRAMAS_POR_FACULTAD,
} from "@/lib/data"
import {
  saveUserProfile,
  findSimilarUsers,
  getActiveEvents,
  saveEventAttendance,
  getUserEventEnrollments,
} from "@/lib/firestore"
import type { FormData, SimilarUser, UserProfile, Event } from "@/lib/types"

export default function ConvocatoriasPage() {
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
    codigoEstudiante: "",
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
  const [currentStep, setCurrentStep] = useState(1)
  const [userEventEnrollments, setUserEventEnrollments] = useState<string[]>([])

  const requiresAcademicInfo = formData.estamento === "ESTUDIANTE" || formData.estamento === "EGRESADO"
  const totalSteps = selectedUser ? 1 : requiresAcademicInfo ? 4 : 3

  useEffect(() => {
    loadActiveEvents()
  }, [])

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
  }, [formData.nombres, formData.correo, formData.numeroDocumento, formData.telefono])

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value }

      if (field === "facultad") {
        newData.programaAcademico = ""
      }

      if (field === "estamento" && value !== "ESTUDIANTE" && value !== "EGRESADO") {
        newData.codigoEstudiante = ""
        newData.facultad = ""
        newData.programaAcademico = ""
      }

      if (field === "estamento" && value === "EGRESADO") {
        newData.codigoEstudiante = ""
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
      codigoEstudiante: user.codigoEstudiante || "",
      facultad: user.facultad || "",
      programaAcademico: user.programaAcademico || "",
      grupoCultural: "",
      eventoId: "",
    })
    setShowSuggestions(false)
    setCurrentStep(1)

    // Cargar eventos en los que ya está inscrito
    const enrolledEvents = await getUserEventEnrollments(user.id)
    setUserEventEnrollments(enrolledEvents)

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
          return !!(formData.codigoEstudiante && formData.facultad && formData.programaAcademico)
        }
        if (formData.estamento === "EGRESADO") {
          return !!(formData.facultad && formData.programaAcademico)
        }
        return true
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
      const events = await getActiveEvents()
      setActiveEvents(events)
    } catch (error) {
      console.error("Error cargando eventos activos:", error)
    }
  }

  async function handleSubmit() {
    if (!formData.eventoId) {
      setError("Debes seleccionar un evento")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      let userId: string

      if (selectedUser) {
        userId = selectedUser.id
      } else {
        const userProfile = {
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
            formData.codigoEstudiante && {
              codigoEstudiante: formData.codigoEstudiante,
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
        userId = await saveUserProfile(userProfile)
        console.log("[Convocatorias] New user created with ID:", userId)
      }

      console.log("[Convocatorias] Saving event attendance for user:", userId, "event:", formData.eventoId)
      await saveEventAttendance(userId, formData.eventoId)
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
          codigoEstudiante: "",
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
                <Label htmlFor="correo">Correo Electrónico *</Label>
                <Input
                  id="correo"
                  type="email"
                  value={formData.correo}
                  onChange={(e) => handleInputChange("correo", e.target.value)}
                  placeholder="correo@ejemplo.com"
                />
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
                        {genero}
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
              {formData.estamento === "ESTUDIANTE" && (
                <div className="space-y-2">
                  <Label htmlFor="codigoEstudiante">Código del Estudiante *</Label>
                  <Input
                    id="codigoEstudiante"
                    value={formData.codigoEstudiante}
                    onChange={(e) => handleInputChange("codigoEstudiante", e.target.value)}
                    placeholder="Código estudiantil"
                  />
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
    if (activeEvents.length === 0) {
      return (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>No hay eventos disponibles en este momento.</strong>
            <p className="text-sm mt-1">Por favor vuelve más tarde para ver las convocatorias activas.</p>
          </AlertDescription>
        </Alert>
      )
    }

    const availableEvents = activeEvents.filter(e => !userEventEnrollments.includes(e.id))
    const enrolledEvents = activeEvents.filter(e => userEventEnrollments.includes(e.id))

    return (
      <div className="space-y-4">
        {enrolledEvents.length > 0 && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Ya estás inscrito en:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                {enrolledEvents.map((evento) => (
                  <li key={evento.id}>• {evento.nombre}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {availableEvents.length === 0 && enrolledEvents.length > 0 ? (
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Ya estás inscrito en todos los eventos disponibles.</strong>
              <p className="text-sm mt-1">No hay más eventos disponibles para inscripción en este momento.</p>
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="eventoId">Selecciona el Evento *</Label>
              <Select value={formData.eventoId} onValueChange={(value) => handleInputChange("eventoId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un evento" />
                </SelectTrigger>
                <SelectContent>
                  {availableEvents.map((evento) => (
                    <SelectItem key={evento.id} value={evento.id}>
                      {evento.nombre} - {evento.hora} ({evento.lugar})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.eventoId && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Información del Evento</p>
                    <p className="mt-1">
                      {activeEvents.find((e) => e.id === formData.eventoId)?.nombre}
                    </p>
                    <p className="text-xs mt-1 text-blue-600">
                      Asegúrate de seleccionar el evento correcto antes de confirmar tu inscripción.
                    </p>
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
      <Navigation />
      <div className="p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-900">Inscripción a Convocatorias</CardTitle>
              <CardDescription className="text-lg">Eventos Culturales - Universidad del Valle</CardDescription>
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
                          (!!selectedUser && activeEvents.filter(e => !userEventEnrollments.includes(e.id)).length === 0)
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

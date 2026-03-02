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
import { User, CheckCircle, AlertCircle } from "lucide-react"
import {
  GENEROS,
  ETNIAS,
  TIPOS_DOCUMENTO,
  SEDES,
  ESTAMENTOS,
  FACULTADES,
  PROGRAMAS_POR_FACULTAD,
  GRUPOS_CULTURALES,
} from "@/lib/data"
import {
  saveUserProfile,
  findSimilarUsers,
  getUserEnrollments,
  enrollUserToGroup,
} from "@/lib/firestore"
import type { FormData, SimilarUser, UserProfile, GroupEnrollment } from "@/lib/types"

export default function RegistroAsistencia() {
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
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [similarUsers, setSimilarUsers] = useState<SimilarUser[]>([])
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [userEnrollments, setUserEnrollments] = useState<GroupEnrollment[]>([])
  const [showEnrollmentForm, setShowEnrollmentForm] = useState(false)
  const [selectedGroupToEnroll, setSelectedGroupToEnroll] = useState("")
  const [isEnrolling, setIsEnrolling] = useState(false)

  const requiresAcademicInfo = formData.estamento === "ESTUDIANTE" || formData.estamento === "EGRESADO"
  const totalSteps = selectedUser ? 1 : requiresAcademicInfo ? 4 : 3

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

      // Reset dependent fields when faculty changes
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
    setCurrentStep(1) // Go directly to cultural group selection

    // Cargar inscripciones del usuario
    await loadUserEnrollments(user.id)

    toast({
      title: "Usuario reconocido",
      description: `¡Hola ${user.nombres}! Selecciona el grupo al que deseas inscribirte.`,
    })
  }

  const handleDismissSuggestions = () => {
    setShowSuggestions(false)
    setSelectedUser(null)
  }

  const validateStep = (step: number): boolean => {
    if (selectedUser) {
      return !!formData.grupoCultural
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
        return !!formData.grupoCultural
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

  // Cargar inscripciones del usuario cuando se selecciona uno
  async function loadUserEnrollments(userId: string) {
    try {
      const enrollments = await getUserEnrollments(userId)
      setUserEnrollments(enrollments)
    } catch (error) {
      console.error("Error cargando inscripciones:", error)
      setUserEnrollments([])
    }
  }

  // Inscribir usuario a un grupo
  async function handleEnrollToGroup() {
    if (!selectedGroupToEnroll || !selectedUser) return

    setIsEnrolling(true)
    try {
      await enrollUserToGroup(selectedUser.id, selectedGroupToEnroll)
      await loadUserEnrollments(selectedUser.id)
      setShowEnrollmentForm(false)
      setSelectedGroupToEnroll("")
      toast({
        title: "Inscripción exitosa",
        description: `Te has inscrito al grupo ${selectedGroupToEnroll}`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo completar la inscripción",
        variant: "destructive",
      })
    } finally {
      setIsEnrolling(false)
    }
  }

  async function handleSubmit() {
    if (!formData.grupoCultural) {
      setError("Debes seleccionar un grupo cultural")
      return
    }

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

        console.log("[v0] Creating new user profile:", userProfile)
        userId = await saveUserProfile(userProfile)
        console.log("[v0] New user created with ID:", userId)
      }

      // Solo inscribir al grupo, no registrar asistencia
      console.log("[v0] Enrolling user to group:", userId, "group:", formData.grupoCultural)
      await enrollUserToGroup(userId, formData.grupoCultural)
      console.log("[v0] User enrolled successfully")

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
      }, 3000)
    } catch (error) {
      console.error("Error saving enrollment:", error)
      setError("Hubo un problema al inscribirte. Por favor intenta nuevamente.")
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

          {renderCulturalGroupStep()}
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
              {/* Solo mostrar código estudiante para ESTUDIANTE */}
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
        // Si no es estudiante ni egresado, ir directamente a selección de grupo cultural
        return renderCulturalGroupStep()

      case 4:
        return renderCulturalGroupStep()

      default:
        return null
    }
  }

  const renderCulturalGroupStep = () => {
    const isRecognizedUser = !!selectedUser
    const hasEnrollments = userEnrollments.length > 0
    const enrolledGroups = userEnrollments.map(e => e.grupoCultural)

    if (isRecognizedUser && !hasEnrollments && !showEnrollmentForm) {
      return (
        <div className="space-y-6">
          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Inscríbete en un grupo cultural para comenzar.</strong>
              <p className="text-sm mt-1">Una vez inscrito, el director o monitor del grupo registrará tu asistencia.</p>
            </AlertDescription>
          </Alert>

          <Button 
            onClick={() => setShowEnrollmentForm(true)} 
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Inscribirme en un Grupo
          </Button>
        </div>
      )
    }

    if (isRecognizedUser && showEnrollmentForm) {
      const availableGroups = GRUPOS_CULTURALES.filter(g => !enrolledGroups.includes(g))
      
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="groupEnrollment">Selecciona el Grupo Cultural al que deseas inscribirte</Label>
            <Select value={selectedGroupToEnroll} onValueChange={setSelectedGroupToEnroll}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un grupo cultural" />
              </SelectTrigger>
              <SelectContent>
                {availableGroups.map((grupo) => (
                  <SelectItem key={grupo} value={grupo}>
                    {grupo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowEnrollmentForm(false)
                setSelectedGroupToEnroll("")
              }}
              className="flex-1 bg-transparent"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleEnrollToGroup} 
              disabled={!selectedGroupToEnroll || isEnrolling}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isEnrolling ? "Inscribiendo..." : "Confirmar Inscripción"}
            </Button>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="grupoCultural">
            {isRecognizedUser ? "Mis Grupos Inscritos" : "Grupo Cultural *"}
          </Label>
          <Select value={formData.grupoCultural} onValueChange={(value) => handleInputChange("grupoCultural", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona el grupo cultural" />
            </SelectTrigger>
            <SelectContent>
              {isRecognizedUser ? (
                enrolledGroups.map((grupo) => (
                  <SelectItem key={grupo} value={grupo}>
                    {grupo}
                  </SelectItem>
                ))
              ) : (
                GRUPOS_CULTURALES.map((grupo) => (
                  <SelectItem key={grupo} value={grupo}>
                    {grupo}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {isRecognizedUser && enrolledGroups.length < GRUPOS_CULTURALES.length && (
          <Button 
            variant="outline" 
            onClick={() => setShowEnrollmentForm(true)}
            className="w-full bg-transparent"
          >
            Inscribirme en otro grupo
          </Button>
        )}

        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
          {isRecognizedUser 
            ? "Selecciona el grupo al que deseas inscribirte o al que ya estás inscrito."
            : "Selecciona el grupo cultural al que deseas inscribirte."
          }
        </div>
      </div>
    )
  }

  const getStepTitle = () => {
    if (selectedUser) {
      return "Seleccionar Grupo Cultural"
    }

    switch (currentStep) {
      case 1:
        return "Información Personal"
      case 2:
        return "Información Institucional"
      case 3:
        return formData.estamento === "ESTUDIANTE" || formData.estamento === "EGRESADO"
          ? "Información Académica"
          : "Seleccionar Grupo Cultural"
      case 4:
        return "Seleccionar Grupo Cultural"
      default:
        return ""
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />
      <div className="p-3 md:p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="text-center px-4 py-4 md:px-6 md:py-6">
              <CardTitle className="text-xl md:text-2xl font-bold text-gray-900">
                Sistema de Inscripción a Grupos Culturales
              </CardTitle>
              <CardDescription className="text-base md:text-lg">Universidad del Valle</CardDescription>
              {!selectedUser && (
                <>
                  <div className="flex justify-center mt-3 md:mt-4">
                    <div className="flex space-x-2">
                      {Array.from({ length: totalSteps }, (_, i) => (
                        <div
                          key={i}
                          className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full ${i + 1 <= currentStep ? "bg-blue-600" : "bg-gray-300"}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs md:text-sm text-gray-600 mt-2">
                    Paso {currentStep} de {totalSteps}: {getStepTitle()}
                  </p>
                </>
              )}
              {selectedUser && <p className="text-xs md:text-sm text-green-600 mt-2 font-medium">{getStepTitle()}</p>}
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6 px-4 md:px-6">
              {renderStep()}

              <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 md:pt-6">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1 || !!selectedUser}
                  className="w-full sm:w-auto px-6 bg-transparent order-2 sm:order-1"
                >
                  Anterior
                </Button>

                {currentStep === totalSteps || selectedUser ? (
                  <Button onClick={handleSubmit} className="w-full sm:w-auto px-6 bg-green-600 hover:bg-green-700 order-1 sm:order-2">
                    Inscribirme al Grupo
                  </Button>
                ) : (
                  <Button onClick={handleNext} className="w-full sm:w-auto px-6 order-1 sm:order-2">
                    Siguiente
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {error && (
        <Alert variant="destructive" className="fixed bottom-4 left-4 right-4 md:left-1/2 md:right-auto md:transform md:-translate-x-1/2 md:max-w-md z-50">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert
          variant="default"
          className="fixed bottom-4 left-4 right-4 md:left-1/2 md:right-auto md:transform md:-translate-x-1/2 md:max-w-md bg-green-50 border-green-200 z-50"
        >
          <AlertDescription className="text-green-800">
            Te has inscrito al grupo exitosamente.
          </AlertDescription>
        </Alert>
      )}
      <Toaster />
    </div>
  )
}

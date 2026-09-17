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
import { User, AlertCircle } from "lucide-react"
import { CulturaUserProfile } from "@/components/cultura-user-profile"
import {
  GENEROS,
  GENEROS_LABELS,
  ETNIAS,
  TIPOS_DOCUMENTO,
  SEDES,
  ESTAMENTOS,
  FACULTADES,
  PROGRAMAS_POR_FACULTAD,
  isDocenteEstamento,
} from "@/lib/data"
import {
  saveUserProfile,
  getAllCulturalGroups as getAllCulturalGroupsRouter,
} from "@/lib/db-router"
import {
  findSimilarUsersBothAreas,
  identityFromUser,
  loginParticipant,
  lookupParticipantByDocumento,
  type PortalIdentity,
} from "@/lib/participant-identity"
import type { Area } from "@/lib/firebase-config"
import type { FormData, SimilarUser, UserProfile } from "@/lib/types"

export default function RegistroAsistencia() {
  const { toast } = useToast()
  const [gruposPorArea, setGruposPorArea] = useState<{ cultura: string[]; deporte: string[] }>({
    cultura: [],
    deporte: [],
  })
  const [, setLoadingGroups] = useState(true)
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
  const [error, setError] = useState("")
  const [similarUsers, setSimilarUsers] = useState<SimilarUser[]>([])
  const [identity, setIdentity] = useState<PortalIdentity | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [authMode, setAuthMode] = useState<"login" | "registro" | "perfil">("login")
  const [loginDocumento, setLoginDocumento] = useState("")
  const [loginCorreo, setLoginCorreo] = useState("")
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [showPostRegistroQuestion, setShowPostRegistroQuestion] = useState(false)
  const [registroArea, setRegistroArea] = useState<Area | "">("")

  const requiresAcademicInfo = formData.estamento === "ESTUDIANTE" || formData.estamento === "EGRESADO"
  const requiresFacultyOnly = isDocenteEstamento(formData.estamento)
  const areaStep = (requiresAcademicInfo || requiresFacultyOnly) ? 4 : 3
  const totalSteps = areaStep

  // Cargar grupos de cultura y deporte
  useEffect(() => {
    const loadGroups = async () => {
      try {
        setLoadingGroups(true)
        const [culturaGroups, deporteGroups] = await Promise.all([
          getAllCulturalGroupsRouter("cultura"),
          getAllCulturalGroupsRouter("deporte"),
        ])
        setGruposPorArea({
          cultura: culturaGroups.filter((g) => g.activo).map((g) => g.nombre).sort(),
          deporte: deporteGroups.filter((g) => g.activo).map((g) => g.nombre).sort(),
        })
      } catch (error) {
        console.error("[RegistroAsistencia] Error loading groups:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los grupos. Por favor recarga la página.",
          variant: "destructive",
        })
      } finally {
        setLoadingGroups(false)
      }
    }

    loadGroups()
  }, [])

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setIsLoggingIn(true)
    try {
      const nextIdentity = await loginParticipant(loginDocumento, loginCorreo)
      setIdentity(nextIdentity)
      setAuthMode("perfil")
      setShowPostRegistroQuestion(false)
      toast({
        title: "Ingreso exitoso",
        description: `¡Hola ${nextIdentity.profile.nombres}!`,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "No fue posible iniciar sesión. Intenta nuevamente."
      setError(message)
    } finally {
      setIsLoggingIn(false)
    }
  }

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
          const similar = await findSimilarUsersBothAreas(
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

      if (field === "estamento" && value !== "ESTUDIANTE" && value !== "EGRESADO" && !isDocenteEstamento(value)) {
        newData.codigoEstudiantil = ""
        newData.facultad = ""
        newData.programaAcademico = ""
      }

      if (field === "estamento" && value === "EGRESADO") {
        newData.codigoEstudiantil = ""
      }

      if (field === "estamento" && isDocenteEstamento(value)) {
        newData.codigoEstudiantil = ""
        newData.programaAcademico = ""
      }

      return newData
    })
  }

  const handleSelectUser = async (user: UserProfile) => {
    try {
      const nextIdentity = await identityFromUser(user)
      setIdentity(nextIdentity)
      setShowSuggestions(false)
      setAuthMode("perfil")
      setShowPostRegistroQuestion(false)
      toast({
        title: "Usuario reconocido",
        description: `¡Hola ${nextIdentity.profile.nombres}! Ya tienes una cuenta registrada.`,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "No fue posible abrir tu perfil."
      setError(message)
      toast({ title: "No se pudo ingresar", description: message, variant: "destructive" })
    }
  }

  const handleDismissSuggestions = () => {
    setShowSuggestions(false)
    setIdentity(null)
  }

  const validateStep = (step: number): boolean => {
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
        if (requiresAcademicInfo) {
          if (formData.estamento === "ESTUDIANTE") {
            return !!(formData.codigoEstudiantil && formData.codigoEstudiantil.length === 9 && formData.facultad && formData.programaAcademico)
          }
          if (formData.estamento === "EGRESADO") {
            return !!(formData.facultad && formData.programaAcademico)
          }
        }
        if (requiresFacultyOnly) {
          return !!formData.facultad
        }
        return registroArea === "cultura" || registroArea === "deporte"
      case 4:
        return registroArea === "cultura" || registroArea === "deporte"
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

  async function handleSubmit() {
    if (!validateStep(currentStep)) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos antes de continuar.",
        variant: "destructive",
      })
      return
    }

    if (!registroArea) {
      toast({
        title: "Elige un área",
        description: "Indica si perteneces a Cultura o a Deporte para guardar tu registro.",
        variant: "destructive",
      })
      return
    }

    if (isSubmitting) return

    setError("")
    setIsSubmitting(true)

    try {
      const userProfile = {
        area: registroArea,
        nombres: formData.nombres,
        correo: formData.correo,
        genero: formData.genero as UserProfile["genero"],
        etnia: formData.etnia as UserProfile["etnia"],
        tipoDocumento: formData.tipoDocumento as UserProfile["tipoDocumento"],
        numeroDocumento: formData.numeroDocumento,
        edad: Number.parseInt(formData.edad),
        telefono: formData.telefono,
        sede: formData.sede as UserProfile["sede"],
        estamento: formData.estamento as UserProfile["estamento"],
        ...(formData.estamento === "ESTUDIANTE" &&
          formData.codigoEstudiantil && {
            codigoEstudiantil: formData.codigoEstudiantil,
          }),
        ...((formData.estamento === "ESTUDIANTE" ||
          formData.estamento === "EGRESADO" ||
          isDocenteEstamento(formData.estamento)) &&
          formData.facultad && {
            facultad: formData.facultad,
          }),
        ...((formData.estamento === "ESTUDIANTE" || formData.estamento === "EGRESADO") &&
          formData.programaAcademico && {
            programaAcademico: formData.programaAcademico,
          }),
      }

      const existing = await lookupParticipantByDocumento(formData.numeroDocumento)
      if (existing.status === "conflict") {
        throw new Error(
          "Este documento ya existe en Cultura y Deporte con correos distintos. Escribe a bienestar para unificar tu cuenta.",
        )
      }
      if (existing.status === "found") {
        setIdentity(existing.identity)
        setAuthMode("perfil")
        setShowPostRegistroQuestion(false)
        toast({
          title: "Ya tienes cuenta",
          description: "Encontramos tu perfil. Ingresaste con el documento registrado.",
        })
        return
      }

      const userId = await saveUserProfile(registroArea, userProfile)

      const nextUser: UserProfile = {
        id: userId,
        area: registroArea,
        nombres: formData.nombres,
        correo: formData.correo,
        genero: formData.genero as UserProfile["genero"],
        etnia: formData.etnia as UserProfile["etnia"],
        tipoDocumento: formData.tipoDocumento as UserProfile["tipoDocumento"],
        numeroDocumento: formData.numeroDocumento,
        edad: Number.parseInt(formData.edad),
        telefono: formData.telefono,
        sede: formData.sede as UserProfile["sede"],
        estamento: formData.estamento as UserProfile["estamento"],
        codigoEstudiantil: formData.codigoEstudiantil || undefined,
        facultad: formData.facultad || undefined,
        programaAcademico: formData.programaAcademico || undefined,
        createdAt: new Date(),
        lastAttendance: new Date(),
      }

      setIdentity({
        documento: nextUser.numeroDocumento,
        correo: nextUser.correo,
        profile: nextUser,
        cultura: registroArea === "cultura" ? nextUser : undefined,
        deporte: registroArea === "deporte" ? nextUser : undefined,
      })
      setAuthMode("perfil")
      setShowPostRegistroQuestion(true)
      toast({
        title: "¡Registro exitoso!",
        description: "Tu cuenta fue creada. Desde tu perfil puedes inscribirte a actividades.",
      })
    } catch (error: unknown) {
      const err = error as { message?: string; code?: string }
      let errorMessage = "Hubo un problema al registrar tu cuenta. Por favor intenta nuevamente."

      if (err.message) {
        errorMessage = err.message
      } else if (err.code === "permission-denied") {
        errorMessage = "Error de permisos. Verifica la configuración de Firestore."
      } else if (err.code === "unavailable") {
        errorMessage = "No se pudo conectar con el servidor. Verifica tu conexión."
      }

      setError(errorMessage)
      toast({
        title: "Error en el registro",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderLogin = () => {
    return (
      <div className="space-y-6">
        <CardHeader className="text-center px-4 py-4 md:px-6 md:py-6">
          <CardTitle className="text-xl md:text-2xl font-bold text-gray-900">Cultura y Deporte</CardTitle>
          <CardDescription className="text-base md:text-lg">Ingresa con tu documento y correo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-6 px-4 md:px-6">
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-documento">Número de Documento</Label>
              <Input
                id="login-documento"
                value={loginDocumento}
                onChange={(e) => setLoginDocumento(e.target.value)}
                placeholder="Ingresa tu documento"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-correo">Correo Institucional</Label>
              <Input
                id="login-correo"
                type="email"
                value={loginCorreo}
                onChange={(e) => setLoginCorreo(e.target.value)}
                placeholder="correo@correounivalle.edu.co"
                required
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" disabled={isLoggingIn} className="w-full">
              {isLoggingIn ? "Verificando..." : "Ingresar"}
            </Button>

            <div className="text-center space-y-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setError("")
                  setAuthMode("registro")
                }}
                className="w-full"
              >
                No tengo un usuario
              </Button>
              <p className="text-xs text-gray-600">
                Si tienes algún problema al ingresar comunícanos a{" "}
                <a className="underline" href="mailto:areacultura.cdr@correounivalle.edu.co">
                  areacultura.cdr@correounivalle.edu.co
                </a>
              </p>
            </div>
          </form>
        </CardContent>
      </div>
    )
  }

  const renderPerfil = () => {
    if (!identity) return null

    return (
      <CulturaUserProfile
        identity={identity}
        showPostRegistroQuestion={showPostRegistroQuestion}
        onDismissQuestion={() => setShowPostRegistroQuestion(false)}
        onIdentityUpdated={setIdentity}
        gruposPorArea={gruposPorArea}
        initialArea={
          registroArea === "cultura" || registroArea === "deporte"
            ? registroArea
            : identity.deporte && !identity.cultura
              ? "deporte"
              : "cultura"
        }
        onLogout={() => {
          setAuthMode("login")
          setIdentity(null)
          setRegistroArea("")
          setShowPostRegistroQuestion(false)
          setError("")
        }}
      />
    )
  }

  const renderStep = () => {
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
        if (isDocenteEstamento(formData.estamento)) {
          return (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="facultad">Facultad a la que Pertenece *</Label>
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
            </div>
          )
        }
        if (formData.estamento === "ESTUDIANTE" || formData.estamento === "EGRESADO") {
          return (
            <div className="space-y-4">
              {formData.estamento === "ESTUDIANTE" && (
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
        return renderAreaChoice()

      case 4:
        return renderAreaChoice()

      default:
        return null
    }
  }

  const renderAreaChoice = () => (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 text-center">
        Esta elección define dónde se guarda tu perfil. Si después te inscribes en la otra área, se copiará tu información.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setRegistroArea("cultura")}
          className={`rounded-xl border-2 p-5 text-left transition ${
            registroArea === "cultura"
              ? "border-violet-600 bg-violet-50"
              : "border-gray-200 bg-white hover:border-violet-300"
          }`}
        >
          <p className="text-lg font-semibold text-gray-900">Cultura</p>
          <p className="mt-1 text-sm text-gray-600">Grupos, convocatorias y eventos culturales</p>
        </button>
        <button
          type="button"
          onClick={() => setRegistroArea("deporte")}
          className={`rounded-xl border-2 p-5 text-left transition ${
            registroArea === "deporte"
              ? "border-orange-500 bg-orange-50"
              : "border-gray-200 bg-white hover:border-orange-300"
          }`}
        >
          <p className="text-lg font-semibold text-gray-900">Deporte</p>
          <p className="mt-1 text-sm text-gray-600">Grupos, convocatorias y eventos deportivos</p>
        </button>
      </div>
    </div>
  )

  const getStepTitle = () => {
    if (currentStep === areaStep) return "Área a la que perteneces"
    switch (currentStep) {
      case 1:
        return "Información Personal"
      case 2:
        return "Información Institucional"
      case 3:
        return formData.estamento === "ESTUDIANTE" || formData.estamento === "EGRESADO"
          ? "Información Académica"
          : "Facultad"
      default:
        return ""
    }
  }

  return (
    <div className={authMode === "perfil" ? "min-h-screen" : "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100"}>
      {authMode === "perfil" ? (
        renderPerfil()
      ) : (
      <div className="p-3 md:p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg">
            {authMode === "login" ? (
              renderLogin()
            ) : (
              <>
                <CardHeader className="text-center px-4 py-4 md:px-6 md:py-6">
                  <CardTitle className="text-xl md:text-2xl font-bold text-gray-900">
                    Registro de Usuario
                  </CardTitle>
                    <CardDescription className="text-base md:text-lg">Cultura y Deporte — Universidad del Valle</CardDescription>
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
                </CardHeader>
                <CardContent className="space-y-4 md:space-y-6 px-4 md:px-6">
                  {renderStep()}

                  <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 md:pt-6">
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={currentStep === 1}
                      className="w-full sm:w-auto px-6 bg-transparent order-2 sm:order-1"
                    >
                      Anterior
                    </Button>

                    {currentStep === totalSteps ? (
                      <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full sm:w-auto px-6 bg-green-600 hover:bg-green-700 order-1 sm:order-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? "Registrando..." : "Completar registro"}
                      </Button>
                    ) : (
                      <Button onClick={handleNext} className="w-full sm:w-auto px-6 order-1 sm:order-2">
                        Siguiente
                      </Button>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setAuthMode("login")
                      setError("")
                    }}
                  >
                    Volver al login
                  </Button>
                </CardContent>
              </>
            )}
          </Card>
        </div>
      </div>
      )}
      {authMode !== "perfil" && error && (
        <Alert variant="destructive" className="fixed bottom-4 left-4 right-4 md:left-1/2 md:right-auto md:transform md:-translate-x-1/2 md:max-w-md z-50">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Toaster />
    </div>
  )
}

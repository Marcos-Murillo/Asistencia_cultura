// Tipos para el sistema de registro de asistencia cultural

export interface AttendanceRecord {
  id: string
  timestamp: Date
  nombres: string
  correo: string
  genero: "MUJER" | "HOMBRE" | "OTRO"
  etnia: "AFRO" | "GITANO O ROM" | "INDIGENA" | "MESTIZO" | "PALENQUERO" | "RAIZAL" | "NO SABE" | "NO RESPONDE"
  tipoDocumento: "TARGETA DE IDENTIDAD" | "CEDULA" | "CEDULA DE EXTRANJERIA" | "PASAPORTE"
  numeroDocumento: string
  edad: number
  telefono: string
  sede:
    | "SAN FERNANDO"
    | "MELENDEZ"
    | "BUGA"
    | "TULUA"
    | "SEDE PASIFICO"
    | "PALMIRA"
    | "CAICEDONIA"
    | "CARTAGO"
    | "NORTE DEL CAUCA"
    | "YUMBO"
    | "ZARZAL"
    | "NINGUNA"
  estamento: "ESTUDIANTE" | "EGRESADO" | "DOCENTE" | "DOCENTE HORA CATEDRA" | "FUNCIONARIO" | "CONTRATISTA" | "INVITADO"

  // Campos condicionales para estudiantes y egresados
  codigoEstudiantil?: string
  facultad?: string
  programaAcademico?: string

  // Grupo cultural al que asistió
  grupoCultural: string
}

export interface AttendanceStats {
  totalParticipants: number
  byGender: {
    mujer: number
    hombre: number
    otro: number
  }
  byProgram: Record<
    string,
    {
      mujer: number
      hombre: number
      otro: number
      total: number
    }
  >
  byFaculty: Record<
    string,
    {
      mujer: number
      hombre: number
      otro: number
      total: number
    }
  >
  byCulturalGroup: Record<string, number>
  byMonth: Record<string, Record<string, number>>
}

export interface FormData {
  nombres: string
  correo: string
  genero: string
  etnia: string
  tipoDocumento: string
  numeroDocumento: string
  edad: string
  telefono: string
  sede: string
  estamento: string
  codigoEstudiantil?: string
  facultad?: string
  programaAcademico?: string
  grupoCultural: string
  eventoId?: string
}

export interface UserProfile {
  id: string
  nombres: string
  correo: string
  numeroDocumento: string
  telefono: string
  genero: "MUJER" | "HOMBRE" | "OTRO"
  etnia: "AFRO" | "GITANO O ROM" | "INDIGENA" | "MESTIZO" | "PALENQUERO" | "RAIZAL" | "NO SABE" | "NO RESPONDE"
  tipoDocumento: "TARGETA DE IDENTIDAD" | "CEDULA" | "CEDULA DE EXTRANJERIA" | "PASAPORTE"
  edad: number
  sede:
    | "SAN FERNANDO"
    | "MELENDEZ"
    | "BUGA"
    | "TULUA"
    | "SEDE PASIFICO"
    | "PALMIRA"
    | "CAICEDONIA"
    | "CARTAGO"
    | "NORTE DEL CAUCA"
    | "YUMBO"
    | "ZARZAL"
    | "NINGUNA"
  estamento: "ESTUDIANTE" | "EGRESADO" | "DOCENTE" | "DOCENTE HORA CATEDRA" | "FUNCIONARIO" | "CONTRATISTA" | "INVITADO"
  codigoEstudiantil?: string
  facultad?: string
  programaAcademico?: string
  area: 'cultura' | 'deporte'
  gruposAsignados?: string[]
  rol?: "ESTUDIANTE" | "DIRECTOR" | "MONITOR" | "ENTRENADOR" | "FISIOTERAPEUTA" | "SUPER_ADMIN"
  esFisioterapeutaEncargado?: boolean
  createdAt: Date
  lastAttendance: Date
}

export interface AttendanceEntry {
  id: string
  userId: string
  grupoCultural: string
  timestamp: Date
}

export interface GroupTracking {
  groupName: string
  participants: {
    userId: string
    userName: string
    monthlyCount: number
    totalCount: number
    lastAttendance: Date
  }[]
}

export type InscriptionQuestionType = "text" | "multiple_choice" | "pdf" | "photo" | "video" | "audio"

export interface QuestionVisibilityRule {
  questionId: string
  values: string[]
}

export interface InscriptionQuestion {
  id: string
  label: string
  type: InscriptionQuestionType
  required: boolean
  options?: string[]
  allowMultiple?: boolean
  visibleIf?: QuestionVisibilityRule
}

export interface EventInscriptionForm {
  enabled: boolean
  questions: InscriptionQuestion[]
}

export interface DriveFileLink {
  fileId: string
  name: string
  mimeType: string
  webViewLink: string
  webContentLink?: string
}

export interface InscriptionAnswer {
  questionId: string
  label: string
  type: InscriptionQuestionType
  text?: string
  selected?: string[]
  files?: DriveFileLink[]
}

export interface EventFormResponse {
  id: string
  eventId: string
  userId: string
  answers: InscriptionAnswer[]
  submittedAt: Date
}

export interface Event {
  id: string
  nombre: string
  hora: string
  lugar: string
  fechaEvento?: Date
  fechaApertura: Date
  fechaVencimiento: Date
  createdAt: Date
  activo: boolean
  inscriptionForm?: EventInscriptionForm
  driveFolderId?: string
}

export interface EventAttendanceEntry {
  id: string
  userId: string
  eventId: string
  timestamp: Date
}

export interface EventStats {
  totalParticipants: number
  byGender: {
    mujer: number
    hombre: number
    otro: number
  }
  byProgram: Record<
    string,
    {
      mujer: number
      hombre: number
      otro: number
      total: number
    }
  >
  byFaculty: Record<
    string,
    {
      mujer: number
      hombre: number
      otro: number
      total: number
    }
  >
  byEvent: Record<string, number>
}

export interface CinecluEvent {
  id: string
  pelicula: string
  fecha: Date
  createdAt: Date
}

export interface CinecluAttendanceEntry {
  id: string
  userId: string
  cinecluEventId: string
  timestamp: Date
}

export interface SimilarUser {
  user: UserProfile
  similarity: number
  matchingFields: string[]
}

// Inscripción a grupos culturales
export interface GroupEnrollment {
  id: string
  userId: string
  grupoCultural: string
  fechaInscripcion: Date
}

export interface EventEnrollment {
  id: string
  userId: string
  eventId: string
  fechaInscripcion: Date
}


export interface GroupWithEnrollments {
  nombre: string
  totalInscritos: number
}

// Tipos para sistema de autenticación y roles
export interface AdminUser {
  id: string
  numeroDocumento: string
  correo: string
  nombres: string
  area: 'cultura' | 'deporte'
  password: string
  createdAt: Date
  createdBy: string
}

export interface GroupManager {
  id: string
  userId: string
  grupoCultural: string
  assignedAt: Date
  assignedBy: string
}

export type UserRole = "ESTUDIANTE" | "DIRECTOR" | "MONITOR" | "ENTRENADOR" | "FISIOTERAPEUTA" | "ADMIN" | "SUPER_ADMIN"

export type GroupCategory = "SEMILLERO" | "PROCESO" | "REPRESENTATIVO"

export interface GroupCategoryAssignment {
  id: string
  userId: string
  grupoCultural: string
  category: GroupCategory
  assignedAt: Date
}

// ============================================================================
// TORNEOS DEPORTIVOS
// ============================================================================

export type TorneoTipo = 'individual' | 'grupal'
export type TorneoDeporte = 'futbol' | 'baloncesto' | 'voleibol' | 'tenis_mesa' | 'ajedrez' | 'natacion' | 'atletismo' | 'otro'
export type TorneoFase = 'inscripcion' | 'grupos' | 'eliminatorias' | 'finalizado'

export interface Torneo {
  id: string
  nombre: string
  deporte: TorneoDeporte
  tipo: TorneoTipo
  descripcion?: string
  fechaInicio: Date
  fechaFin: Date
  lugar: string
  fase: TorneoFase
  activo: boolean
  createdAt: Date
  // Solo para grupales
  equiposPorGrupo?: number
}

export interface TorneoEquipo {
  id: string
  torneoId: string
  nombre: string
  codigo: string // ej: "a1b2"
  createdAt: Date
}

export interface TorneoInscripcion {
  id: string
  torneoId: string
  userId: string
  // Para grupal: equipoId
  equipoId?: string
  fechaInscripcion: Date
}

export interface TorneoGrupo {
  id: string
  torneoId: string
  nombre: string // "Grupo A", "Grupo B"...
  equipos: string[] // equipoIds (grupal) o userIds (individual)
}

// Estadísticas por deporte
export interface EstadisticasJugador {
  userId: string
  // Fútbol
  goles?: number
  asistencias?: number
  tarjetasAmarillas?: number
  tarjetasRojas?: number
  // Baloncesto
  puntos?: number
  rebotes?: number
  // Voleibol
  aces?: number
  bloqueos?: number
  // Tenis de mesa / Ajedrez
  puntosIndividuales?: number
  // Natación / Atletismo
  tiempoSegundos?: number
  posicion?: number
  // General
  minutosJugados?: number
}

export interface TorneoPartido {
  id: string
  torneoId: string
  grupoId?: string // null si es eliminatoria
  fase: 'grupos' | 'octavos' | 'cuartos' | 'semifinal' | 'final' | 'tercer_puesto'
  ronda?: number
  posicionBracket?: number // para el árbol de eliminatorias
  // Participantes (equipoId o userId según tipo)
  local: string
  visitante: string
  // Resultados
  golesLocal?: number
  golesVisitante?: number
  jugado: boolean
  fecha?: Date
  lugar?: string
  // Estadísticas por jugador
  estadisticas?: EstadisticasJugador[]
}

// Tabla de posiciones (calculada)
export interface PosicionGrupo {
  equipoId: string
  nombre: string
  pj: number // partidos jugados
  pg: number // ganados
  pe: number // empatados
  pp: number // perdidos
  gf: number // goles a favor
  gc: number // goles en contra
  dg: number // diferencia de goles
  pts: number // puntos
}

// ============================================================================
// FISIOTERAPIA DEPORTIVA
// ============================================================================

export type FisioterapiaSolicitudTipo =
  | "acompanamiento"
  | "evaluacion"
  | "preventiva"
  | "recuperacion"
  | "charla"
  | "valoracion"
  | "otra"

export type FisioterapiaSolicitudEstado =
  | "Pendiente"
  | "Asignada"
  | "En proceso"
  | "Realizada"
  | "Cancelada"

export type FisioterapiaPrioridad = "Baja" | "Media" | "Alta" | "Urgente"

export type FisioterapiaBitacoraTipo = "actividad" | "atencion" | "solicitud"

export type FisioterapiaSeguimientoEstado = "Pendiente" | "Realizado" | "No asistió" | "Cancelado"

export interface FisioterapiaOrden {
  descripcion: string
  destino?: string
  fecha: Date
}

export interface FisioterapiaSolicitud {
  id: string
  numero: number
  tipo: FisioterapiaSolicitudTipo
  grupoId?: string
  grupoNombre: string
  entrenadorId: string
  entrenadorNombre: string
  fechaSolicitada: Date
  hora: string
  lugar: string
  descripcion: string
  deportistaId?: string
  deportistaNombre?: string
  prioridad: FisioterapiaPrioridad
  observaciones?: string
  estado: FisioterapiaSolicitudEstado
  fisioterapeutaId?: string
  fisioterapeutaNombre?: string
  bitacoraId?: string
  realizado?: string
  notasFisioterapeuta?: string
  createdAt: Date
  updatedAt: Date
}

export interface FisioterapiaBitacora {
  id: string
  tipo: FisioterapiaBitacoraTipo
  fecha: Date
  hora: string
  grupoId?: string
  grupoNombre?: string
  entrenadorId?: string
  entrenadorNombre?: string
  tipoActividad?: FisioterapiaSolicitudTipo | "acompanamiento_entrenamiento"
  descripcion?: string
  observaciones?: string
  estado?: string
  fisioterapeutaId: string
  fisioterapeutaNombre: string
  deportistaId?: string
  deportistaNombre?: string
  motivoAtencion?: string
  tipoLesion?: string
  zonaCorporal?: string
  descripcionIncidente?: string
  evaluacion?: string
  intervencion?: string
  recomendaciones?: string
  requiereSeguimiento?: boolean
  fechaSeguimiento?: Date
  orden?: FisioterapiaOrden | null
  solicitudId?: string
  solicitudNumero?: number
  createdAt: Date
  updatedAt: Date
}

export interface FisioterapiaSeguimiento {
  id: string
  bitacoraId: string
  deportistaId: string
  deportistaNombre: string
  grupoNombre?: string
  lesionAtencion: string
  fechaAtencion: Date
  fechaProgramada: Date
  fisioterapeutaId: string
  fisioterapeutaNombre: string
  estado: FisioterapiaSeguimientoEstado
  observaciones?: string
  createdAt: Date
  updatedAt: Date
}

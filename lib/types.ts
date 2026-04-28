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
  rol?: "ESTUDIANTE" | "DIRECTOR" | "MONITOR" | "ENTRENADOR" | "SUPER_ADMIN"
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

export type UserRole = "ESTUDIANTE" | "DIRECTOR" | "MONITOR" | "ENTRENADOR" | "ADMIN" | "SUPER_ADMIN"

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

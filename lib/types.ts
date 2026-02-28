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

  // Campos condicionales para estudiantes
  codigoEstudiante?: string
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
  codigoEstudiante?: string
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
  codigoEstudiante?: string
  facultad?: string
  programaAcademico?: string
  rol?: "ESTUDIANTE" | "DIRECTOR" | "MONITOR"
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

export type UserRole = "ESTUDIANTE" | "DIRECTOR" | "MONITOR"

export type GroupCategory = "SEMILLERO" | "PROCESO" | "REPRESENTATIVO"

export interface GroupCategoryAssignment {
  id: string
  userId: string
  grupoCultural: string
  category: GroupCategory
  assignedAt: Date
}

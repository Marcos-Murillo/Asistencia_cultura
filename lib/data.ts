// Datos de referencia para el sistema

// Importar la nueva estructura de programas académicos
import { 
  PROGRAMAS_ACADEMICOS, 
  getProgramasPorFacultad, 
  getProgramasPorSede,
  getProgramasPorSedeYFacultad,
  formatProgramaParaSelect,
  type ProgramaAcademico 
} from './programas-academicos'

export const GENEROS = ["MUJER", "HOMBRE", "OTRO"] as const
export const GENEROS_LABELS: Record<string, string> = {
  MUJER: "Femenino",
  HOMBRE: "Masculino",
  OTRO: "Otro",
}

export const ETNIAS = [
  "AFRO",
  "GITANO O ROM",
  "INDIGENA",
  "MESTIZO",
  "PALENQUERO",
  "RAIZAL",
  "NO SABE",
  "NO RESPONDE",
] as const

export const TIPOS_DOCUMENTO = ["TARJETA DE IDENTIDAD", "CEDULA", "CEDULA DE EXTRANJERIA", "PASAPORTE"] as const

export const SEDES = [
  "CALI",
  "BUGA",
  "CAICEDONIA",
  "CARTAGO",
  "PACIFICO",
  "PALMIRA",
  "TULUA",
  "ZARZAL",
  "YUMBO",
  "BOGOTÁ",
  "NORTE DEL CAUCA",
  "UNIVERSIDAD DE NARIÑO",
  "VIRTUAL",
  "CAICEDONIA NODO SEVILLA",
  "NORTE DEL CAUCA NODO MIRANDA",
  "NORTE DEL CAUCA NODO JAMUNDI",
  "PALMIRA NODO FLORIDA",
  "PALMIRA NODO CANDELARIA",
  "NORTE DEL CAUCA NODO SUÁREZ",
  "NINGUNA",
] as const

export const ESTAMENTOS = [
  "ESTUDIANTE",
  "EGRESADO",
  "DOCENTE",
  "DOCENTE HORA CATEDRA",
  "FUNCIONARIO",
  "CONTRATISTA",
  "INVITADO",
] as const

export function isDocenteEstamento(estamento: string): boolean {
  return estamento === "DOCENTE" || estamento === "DOCENTE HORA CATEDRA"
}

export const FACULTADES = [
  "FACULTAD DE ARTES INTEGRADAS",
  "FACULTAD DE CIENCIAS DE LA ADMINISTRACIÓN",
  "FACULTAD DE CIENCIAS NATURALES Y EXACTAS",
  "FACULTAD DE CIENCIAS SOCIALES Y ECONÓMICO",
  "FACULTAD DE DERECHO Y CIENCIAS POLÍTICAS",
  "FACULTAD DE EDUCACIÓN Y PEDAGOGÍA",
  "FACULTAD DE HUMANIDADES",
  "FACULTAD DE INGENIERÍA",
  "FACULTAD DE PSICOLOGÍA",
  "FACULTAD DE SALUD",
] as const

// Mantener compatibilidad con código existente - Programas por facultad
export const PROGRAMAS_POR_FACULTAD: Record<string, string[]> = {
  "FACULTAD DE CIENCIAS NATURALES Y EXACTAS": Array.from(
    new Set(
      PROGRAMAS_ACADEMICOS
        .filter(p => p.facultad === "CIENCIAS NATURALES Y EXACTAS")
        .map(p => formatProgramaParaSelect(p))
    )
  ),
  "FACULTAD DE HUMANIDADES": Array.from(
    new Set(
      PROGRAMAS_ACADEMICOS
        .filter(p => p.facultad === "HUMANIDADES")
        .map(p => formatProgramaParaSelect(p))
    )
  ),
  "FACULTAD DE CIENCIAS SOCIALES Y ECONÓMICO": Array.from(
    new Set(
      PROGRAMAS_ACADEMICOS
        .filter(p => p.facultad === "CIENCIAS SOCIALES Y ECONÓMICAS")
        .map(p => formatProgramaParaSelect(p))
    )
  ),
  "FACULTAD DE EDUCACIÓN Y PEDAGOGÍA": Array.from(
    new Set(
      PROGRAMAS_ACADEMICOS
        .filter(p => p.facultad === "EDUCACIÓN Y PEDAGOGÍA")
        .map(p => formatProgramaParaSelect(p))
    )
  ),
  "FACULTAD DE PSICOLOGÍA": Array.from(
    new Set(
      PROGRAMAS_ACADEMICOS
        .filter(p => p.facultad === "PSICOLOGÍA")
        .map(p => formatProgramaParaSelect(p))
    )
  ),
  "FACULTAD DE ARTES INTEGRADAS": Array.from(
    new Set(
      PROGRAMAS_ACADEMICOS
        .filter(p => p.facultad === "ARTES INTEGRADAS")
        .map(p => formatProgramaParaSelect(p))
    )
  ),
  "FACULTAD DE SALUD": Array.from(
    new Set(
      PROGRAMAS_ACADEMICOS
        .filter(p => p.facultad === "SALUD")
        .map(p => formatProgramaParaSelect(p))
    )
  ),
  "FACULTAD DE INGENIERÍA": Array.from(
    new Set(
      PROGRAMAS_ACADEMICOS
        .filter(p => p.facultad === "INGENIERÍA")
        .map(p => formatProgramaParaSelect(p))
    )
  ),
  "FACULTAD DE CIENCIAS DE LA ADMINISTRACIÓN": Array.from(
    new Set(
      PROGRAMAS_ACADEMICOS
        .filter(p => p.facultad === "CIENCIAS DE LA ADMINISTRACIÓN")
        .map(p => formatProgramaParaSelect(p))
    )
  ),
  "FACULTAD DE DERECHO Y CIENCIAS POLÍTICAS": Array.from(
    new Set(
      PROGRAMAS_ACADEMICOS
        .filter(p => p.facultad === "DERECHO Y CIENCIA POLÍTICA")
        .map(p => formatProgramaParaSelect(p))
    )
  ),
}

// Array de facultades con sus programas (formato para componentes de UI)
export const FACULTADES_PROGRAMAS = FACULTADES.map(facultad => ({
  nombre: facultad,
  programas: PROGRAMAS_POR_FACULTAD[facultad] || []
}))

// Exportar funciones auxiliares para usar en componentes
export { 
  PROGRAMAS_ACADEMICOS, 
  getProgramasPorFacultad, 
  getProgramasPorSede,
  getProgramasPorSedeYFacultad,
  formatProgramaParaSelect,
  type ProgramaAcademico 
}

export const GRUPOS_CULTURALES = [
  "COLECTIVO UNIVERSITARIO AUTOGESTIONADO DE COMUNICACIÓN POPULAR - CUAP",
  "CORO MAGNO DE LA UNIVERSIDAD DEL VALLE",
  "ESTUDIANTINA DE LA UNIVERSIDAD DEL VALLE",
  "GRUPO CAPOEIRA DE LA UNIVERSIDAD DEL VALLE",
  "GRUPO DE ARTE URBANO Y FREESTYLE DE LA UNIVERSIDAD DEL VALLE",
  "GRUPO DE BAILES LATINOS DE LA UNIVERSIDAD DEL VALLE",
  "GRUPO DE MURALISMO LA UNIVERSIDAD DEL VALLE",
  "GRUPO DE DANZA CONTEMPORÁNEA DE LA UNIVERSIDAD DEL VALLE",
  "GRUPO DE DANZA ARABE, ORIENTAL Y TRIBAL DE LA UNIVERSIDAD DEL VALLE",
  "GRUPO DE DANZA URBANA Y BREACKING DE LA UNIVERSIDAD DEL VALLE",
  "GRUPO DE DANZA URBANA Y LABORATORIO ARTÍSTICO DE LA UNIVERSIDAD DEL VALLE",
  "GRUPO DE MÚSICA Y DANZA CARMEN LÓPEZ DE DE LA UNIVERSIDAD DEL VALLE",
  "GRUPO DE NARRACIÓN ORAL Y CUENTERÍA EL PEROL DE LA UNIVERSIDAD DEL VALLE",
  "GRUPO DE POESÍA DE LA UNIVERSIDAD DEL VALLE",
  "GRUPO DE TEATRO BIENESTAR UNIVERSITARIO DE LA UNIVERSIDAD DEL VALLE",
  "ORQUESTA DE SALSA Y MÚSICA LATINA DE LA UNIVERSIDAD DEL VALLE",
  "SELECCIÓN SALSA, BACHATA Y RITMOS LATINOS DE LA UNIVERSIDAD DEL VALLE",
  "UNIVALLUNO DE CANCIÓN",
  "TALLER DE VOCES LIBRES, EXPRESIÓN Y COMUNICACIÓN",
  "BAILE RECREATIVO"
] as const

export const GRUPOS_DEPORTIVOS = [
  "Ajedrez Representativo",
  "Ajedrez Funcionarios",
  "Ajedrez Semillero",
  "Atletismo Representativo Estudiantes y Funcionarios",
  "Atletismo Semillero",
  "Baloncesto Representativo",
  "Baloncesto Funcionarios",
  "Balonmano Representativo Femenino y Masculino",
  "Bolos Funcionarios Femenino y Masculino",
  "Fútbol Femenino Representativo",
  "Fútbol Masculino Representativo",
  "Fútbol Masculino Semillero",
  "Fútbol Master",
  "Fútbol Libre",
  "Fútbol Sala Femenino Representativo y Semillero",
  "Fútbol Sala Masculino Representativo",
  "Fútbol Sala Masculino Funcionarios",
  "Judo",
  "Karate do",
  "Muay Thai y Sanda",
  "Natación Representativo Femenino y Masculino",
  "Natación Semillero Femenino y Masculino",
  "Natación Funcionarios",
  "Natación con Aletas",
  "Patinaje Representativo",
  "Patinaje Semillero",
  "Polo Acuático Femenino",
  "Polo Acuático Masculino",
  "Porrismo Representativo",
  "Porrismo Semillero",
  "Rugby Femenino Representativo y Semillero",
  "Rugby Masculino Representativo",
  "Rugby Masculino Semillero",
  "Rugby Masculino - Preparación física",
  "Sapo Funcionarios Femenino y Masculino Sintraunicol",
  "Taekwondo Representativo Femenino, Masculino y Semillero",
  "Tejo Funcionarios Sintraunicol",
  "Mini Tejo Funcionarios Sintraunicol",
  "Mini Tejo Funcionarios Sintraempuvalle",
  "Tenis de Campo Representativo Femenino y Masculino / Semillero Femenino y Masculino",
  "Tenis de Campo Funcionarios",
  "Tenis de Mesa Representativo Femenino y Masculino",
  "Tenis de Mesa Funcionarios",
  "Ultimate Representativo Femenino y Masculino",
  "Ultimate Semillero",
  "Voleibol Funcionarias Sintraunicol Femenino",
  "Voleibol Funcionarias Femenino",
  "Voleibol Funcionarios Masculino",
  "Voleibol Representativo Femenino y Masculino",
  "Voleibol Semillero",
  "Voleibol Arena Representativo",
  "Voleibol Arena Semillero",
  "Voleibol Arena Funcionarios",
] as const

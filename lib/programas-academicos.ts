// Estructura completa de programas académicos por sede y facultad
// Actualizado con la lista completa de programas de la Universidad del Valle

export interface ProgramaAcademico {
  codigo: string
  nombre: string
  facultad: string
  sede: string
}

// Lista completa de programas académicos organizados por sede
export const PROGRAMAS_ACADEMICOS: ProgramaAcademico[] = [
  // CALI - CIENCIAS NATURALES Y EXACTAS
  { codigo: "2131", nombre: "TECNOLOGÍA QUÍMICA", facultad: "CIENCIAS NATURALES Y EXACTAS", sede: "CALI" },
  { codigo: "2134", nombre: "TECNOLOGÍA EN ANÁLISIS Y LABORATORIO QUÍMICO", facultad: "CIENCIAS NATURALES Y EXACTAS", sede: "CALI" },
  { codigo: "3140", nombre: "BIOLOGÍA", facultad: "CIENCIAS NATURALES Y EXACTAS", sede: "CALI" },
  { codigo: "3146", nombre: "FÍSICA", facultad: "CIENCIAS NATURALES Y EXACTAS", sede: "CALI" },
  { codigo: "3147", nombre: "MATEMÁTICAS", facultad: "CIENCIAS NATURALES Y EXACTAS", sede: "CALI" },
  { codigo: "3148", nombre: "QUÍMICA", facultad: "CIENCIAS NATURALES Y EXACTAS", sede: "CALI" },
  { codigo: "3150", nombre: "AGROINDUSTRIA", facultad: "CIENCIAS NATURALES Y EXACTAS", sede: "CALI" },
  { codigo: "7173", nombre: "MAESTRÍA EN CIENCIAS - QUÍMICA", facultad: "CIENCIAS NATURALES Y EXACTAS", sede: "CALI" },
  { codigo: "7178", nombre: "MAESTRÍA EN CIENCIAS - FÍSICA", facultad: "CIENCIAS NATURALES Y EXACTAS", sede: "CALI" },
  { codigo: "7179", nombre: "MAESTRÍA EN CIENCIAS - MATEMÁTICAS", facultad: "CIENCIAS NATURALES Y EXACTAS", sede: "CALI" },
  { codigo: "7180", nombre: "MAESTRÍA EN CIENCIAS - BIOLOGÍA", facultad: "CIENCIAS NATURALES Y EXACTAS", sede: "CALI" },
  { codigo: "7182", nombre: "MAESTRÍA EN BIOTECNOLOGÍA", facultad: "CIENCIAS NATURALES Y EXACTAS", sede: "CALI" },
  { codigo: "9190", nombre: "DOCTORADO EN CIENCIAS DEL MAR", facultad: "CIENCIAS NATURALES Y EXACTAS", sede: "CALI" },
  { codigo: "9193", nombre: "DOCTORADO EN CIENCIAS QUÍMICAS", facultad: "CIENCIAS NATURALES Y EXACTAS", sede: "CALI" },
  { codigo: "9194", nombre: "DOCTORADO EN CIENCIAS - BIOLOGÍA", facultad: "CIENCIAS NATURALES Y EXACTAS", sede: "CALI" },
  { codigo: "9195", nombre: "DOCTORADO EN CIENCIAS - FÍSICA", facultad: "CIENCIAS NATURALES Y EXACTAS", sede: "CALI" },
  { codigo: "9196", nombre: "DOCTORADO EN CIENCIAS MATEMÁTICAS", facultad: "CIENCIAS NATURALES Y EXACTAS", sede: "CALI" },
  { codigo: "9197", nombre: "DOCTORADO EN CIENCIAS AMBIENTALES", facultad: "CIENCIAS NATURALES Y EXACTAS", sede: "CALI" },

  // CALI - HUMANIDADES
  { codigo: "3247", nombre: "HISTORIA", facultad: "HUMANIDADES", sede: "CALI" },
  { codigo: "3249", nombre: "TRABAJO SOCIAL", facultad: "HUMANIDADES", sede: "CALI" },
  { codigo: "3250", nombre: "LICENCIATURA EN FILOSOFÍA", facultad: "HUMANIDADES", sede: "CALI" },
  { codigo: "3251", nombre: "LICENCIATURA EN HISTORIA", facultad: "HUMANIDADES", sede: "CALI" },
  { codigo: "3252", nombre: "LICENCIATURA EN LITERATURA", facultad: "HUMANIDADES", sede: "CALI" },
  { codigo: "3256", nombre: "LICENCIATURA EN CIENCIAS SOCIALES", facultad: "HUMANIDADES", sede: "CALI" },
  { codigo: "3260", nombre: "PROFESIONAL EN FILOSOFÍA", facultad: "HUMANIDADES", sede: "CALI" },
  { codigo: "3261", nombre: "GEOGRAFÍA", facultad: "HUMANIDADES", sede: "CALI" },
  { codigo: "3262", nombre: "LICENCIATURA EN ESPAÑOL Y FILOLOGÍA", facultad: "HUMANIDADES", sede: "CALI" },
  { codigo: "3263", nombre: "LICENCIATURA EN LENGUAS EXTRANJERAS INGLÉS - FRANCÉS", facultad: "HUMANIDADES", sede: "CALI" },
  { codigo: "3266", nombre: "LICENCIATURA EN EDUCACIÓN BÁSICA CON ÉNFASIS EN CIENCIAS SOCIALES", facultad: "HUMANIDADES", sede: "CALI" },
  { codigo: "3267", nombre: "LICENCIATURA EN LENGUAS EXTRANJERAS CON ÉNFASIS EN INGLÉS Y FRANCÉS", facultad: "HUMANIDADES", sede: "CALI" },
  { codigo: "3268", nombre: "INTERPRETACIÓN PARA SORDOS Y GUÍA-INTERPRETACIÓN PARA SORDOCIEGOS", facultad: "HUMANIDADES", sede: "CALI" },
  { codigo: "5294", nombre: "ESPECIALIZACIÓN EN INTERVENCIÓN SOCIAL COMUNITARIA", facultad: "HUMANIDADES", sede: "CALI" },
  { codigo: "7270", nombre: "MAESTRÍA EN LINGÜÍSTICA Y ESPAÑOL", facultad: "HUMANIDADES", sede: "CALI" },
  { codigo: "7273", nombre: "MAESTRÍA EN FILOSOFÍA", facultad: "HUMANIDADES", sede: "CALI" },
  { codigo: "7274", nombre: "MAESTRÍA EN LITERATURA COLOMBIANA Y LATINOAMERICANA", facultad: "HUMANIDADES", sede: "CALI" },
  { codigo: "7276", nombre: "MAESTRÍA EN HISTORIA", facultad: "HUMANIDADES", sede: "CALI" },
  { codigo: "7277", nombre: "MAESTRÍA EN INTERVENCIÓN SOCIAL", facultad: "HUMANIDADES", sede: "CALI" },
  { codigo: "7278", nombre: "MAESTRÍA EN ESTUDIOS INTERLINGÜÍSTICOS E INTERCULTURALES", facultad: "HUMANIDADES", sede: "CALI" },
  { codigo: "7279", nombre: "MAESTRÍA EN GEOGRAFÍA", facultad: "HUMANIDADES", sede: "CALI" },
  { codigo: "7280", nombre: "MAESTRÍA EN DIDÁCTICA DE LA LITERATURA", facultad: "HUMANIDADES", sede: "CALI" },
  { codigo: "9202", nombre: "DOCTORADO EN HUMANIDADES", facultad: "HUMANIDADES", sede: "CALI" },
  { codigo: "9203", nombre: "DOCTORADO EN FILOSOFÍA", facultad: "HUMANIDADES", sede: "CALI" },
  { codigo: "9204", nombre: "DOCTORADO EN ESTUDIOS PARA LA PAZ", facultad: "HUMANIDADES", sede: "CALI" },

  // CALI - CIENCIAS SOCIALES Y ECONÓMICAS
  { codigo: "3340", nombre: "ECONOMÍA", facultad: "CIENCIAS SOCIALES Y ECONÓMICAS", sede: "CALI" },
  { codigo: "3350", nombre: "SOCIOLOGÍA", facultad: "CIENCIAS SOCIALES Y ECONÓMICAS", sede: "CALI" },
  { codigo: "5384", nombre: "ESPECIALIZACIÓN EN PROCESOS DE INTERVENCIÓN SOCIAL", facultad: "CIENCIAS SOCIALES Y ECONÓMICAS", sede: "CALI" },
  { codigo: "7380", nombre: "MAESTRÍA EN ECONOMÍA APLICADA", facultad: "CIENCIAS SOCIALES Y ECONÓMICAS", sede: "CALI" },
  { codigo: "7381", nombre: "MAESTRÍA EN SOCIOLOGÍA", facultad: "CIENCIAS SOCIALES Y ECONÓMICAS", sede: "CALI" },
  { codigo: "9301", nombre: "DOCTORADO EN SOCIOLOGÍA", facultad: "CIENCIAS SOCIALES Y ECONÓMICAS", sede: "CALI" },
  { codigo: "9302", nombre: "DOCTORADO EN ECONOMÍA APLICADA", facultad: "CIENCIAS SOCIALES Y ECONÓMICAS", sede: "CALI" },

  // CALI - EDUCACIÓN Y PEDAGOGÍA
  { codigo: "3464", nombre: "RECREACIÓN", facultad: "EDUCACIÓN Y PEDAGOGÍA", sede: "CALI" },
  { codigo: "3467", nombre: "LICENCIATURA EN EDUCACIÓN BÁSICA CON ÉNFASIS EN CIENCIAS NATURALES Y EDUCACIÓN AMBIENTAL", facultad: "EDUCACIÓN Y PEDAGOGÍA", sede: "CALI" },
  { codigo: "3469", nombre: "LICENCIATURA EN EDUCACIÓN BÁSICA CON ÉNFASIS EN MATEMÁTICAS", facultad: "EDUCACIÓN Y PEDAGOGÍA", sede: "CALI" },
  { codigo: "3484", nombre: "LICENCIATURA EN EDUCACIÓN FÍSICA Y DEPORTES", facultad: "EDUCACIÓN Y PEDAGOGÍA", sede: "CALI" },
  { codigo: "3486", nombre: "LICENCIATURA EN EDUCACIÓN POPULAR", facultad: "EDUCACIÓN Y PEDAGOGÍA", sede: "CALI" },
  { codigo: "3487", nombre: "LICENCIATURA EN MATEMÁTICAS Y FÍSICA", facultad: "EDUCACIÓN Y PEDAGOGÍA", sede: "CALI" },
  { codigo: "3490", nombre: "LICENCIATURA EN EDUCACIÓN FÍSICA Y DEPORTE", facultad: "EDUCACIÓN Y PEDAGOGÍA", sede: "CALI" },
  { codigo: "3491", nombre: "LICENCIATURA EN CIENCIAS NATURALES Y EDUCACIÓN AMBIENTAL", facultad: "EDUCACIÓN Y PEDAGOGÍA", sede: "CALI" },
  { codigo: "3492", nombre: "LICENCIATURA EN MATEMÁTICAS", facultad: "EDUCACIÓN Y PEDAGOGÍA", sede: "CALI" },
  { codigo: "3493", nombre: "LICENCIATURA EN FÍSICA", facultad: "EDUCACIÓN Y PEDAGOGÍA", sede: "CALI" },
  { codigo: "3494", nombre: "LICENCIATURA EN EDUCACIÓN INFANTIL", facultad: "EDUCACIÓN Y PEDAGOGÍA", sede: "CALI" },
  { codigo: "3495", nombre: "LICENCIATURA EN EDUCACIÓN INFANTIL (SEDE ORIENTE)", facultad: "EDUCACIÓN Y PEDAGOGÍA", sede: "CALI" },
  { codigo: "7405", nombre: "MAESTRÍA EN EDUCACIÓN - ÉNFASIS EN EDUCACIÓN POPULAR Y DESARROLLO COMUNITARIO", facultad: "EDUCACIÓN Y PEDAGOGÍA", sede: "CALI" },
  { codigo: "7412", nombre: "MAESTRÍA EN EDUCACIÓN - ÉNFASIS EN EDUCACIÓN MATEMÁTICA", facultad: "EDUCACIÓN Y PEDAGOGÍA", sede: "CALI" },
  { codigo: "7414", nombre: "MAESTRÍA EN EDUCACIÓN - ÉNFASIS EN ENSEÑANZA DE LAS CIENCIAS NATURALES", facultad: "EDUCACIÓN Y PEDAGOGÍA", sede: "CALI" },
  { codigo: "7415", nombre: "MAESTRÍA EN EDUCACIÓN - ÉNFASIS EN PEDAGOGÍA DEL ENTRENAMIENTO DEPORTIVO", facultad: "EDUCACIÓN Y PEDAGOGÍA", sede: "CALI" },
  { codigo: "7421", nombre: "MAESTRÍA EN EDUCACIÓN ÉNFASIS EN PEDAGOGÍA DE LA EDUCACIÓN SUPERIOR", facultad: "EDUCACIÓN Y PEDAGOGÍA", sede: "CALI" },
  { codigo: "7490", nombre: "MAESTRÍA EN EDUCACIÓN", facultad: "EDUCACIÓN Y PEDAGOGÍA", sede: "CALI" },
  { codigo: "9405", nombre: "DOCTORADO INTERINSTITUCIONAL EN EDUCACIÓN", facultad: "EDUCACIÓN Y PEDAGOGÍA", sede: "CALI" },

  // CALI - PSICOLOGÍA
  { codigo: "3411", nombre: "PRIMERA INFANCIA", facultad: "PSICOLOGÍA", sede: "CALI" },
  { codigo: "3461", nombre: "PSICOLOGÍA", facultad: "PSICOLOGÍA", sede: "CALI" },
  { codigo: "7416", nombre: "MAESTRÍA EN PSICOLOGÍA", facultad: "PSICOLOGÍA", sede: "CALI" },
  { codigo: "9410", nombre: "DOCTORADO EN PSICOLOGÍA", facultad: "PSICOLOGÍA", sede: "CALI" },

  // CALI - ARTES INTEGRADAS
  { codigo: "2503", nombre: "TECNOLOGÍA EN CONSTRUCCIÓN DE EDIFICACIONES E INFRAESTRUCTURA URBANA (CICLO PROPEDÉUTICO)", facultad: "ARTES INTEGRADAS", sede: "CALI" },
  { codigo: "3541", nombre: "LICENCIATURA EN MÚSICA", facultad: "ARTES INTEGRADAS", sede: "CALI" },
  { codigo: "3542", nombre: "LICENCIATURA EN DANZA CLÁSICA", facultad: "ARTES INTEGRADAS", sede: "CALI" },
  { codigo: "3545", nombre: "ARQUITECTURA", facultad: "ARTES INTEGRADAS", sede: "CALI" },
  { codigo: "3548", nombre: "COMUNICACIÓN SOCIAL", facultad: "ARTES INTEGRADAS", sede: "CALI" },
  { codigo: "3550", nombre: "DISEÑO INDUSTRIAL", facultad: "ARTES INTEGRADAS", sede: "CALI" },
  { codigo: "3551", nombre: "DISEÑO GRÁFICO", facultad: "ARTES INTEGRADAS", sede: "CALI" },
  { codigo: "3552", nombre: "MÚSICA", facultad: "ARTES INTEGRADAS", sede: "CALI" },
  { codigo: "3553", nombre: "COMUNICACIÓN SOCIAL - PERIODISMO", facultad: "ARTES INTEGRADAS", sede: "CALI" },
  { codigo: "3554", nombre: "CONSTRUCCIÓN", facultad: "ARTES INTEGRADAS", sede: "CALI" },
  { codigo: "3555", nombre: "LICENCIATURA EN ARTE DRAMÁTICO", facultad: "ARTES INTEGRADAS", sede: "CALI" },
  { codigo: "3556", nombre: "LICENCIATURA EN ARTES VISUALES", facultad: "ARTES INTEGRADAS", sede: "CALI" },
  { codigo: "3560", nombre: "LICENCIATURA EN DANZA", facultad: "ARTES INTEGRADAS", sede: "CALI" },
  { codigo: "5580", nombre: "ESPECIALIZACIÓN EN ADMINISTRACIÓN DE EMPRESAS DE LA CONSTRUCCIÓN", facultad: "ARTES INTEGRADAS", sede: "CALI" },
  { codigo: "5581", nombre: "ESPECIALIZACIÓN EN PAISAJISMO", facultad: "ARTES INTEGRADAS", sede: "CALI" },
  { codigo: "5583", nombre: "ESPECIALIZACIÓN EN ADMINISTRACIÓN Y DESARROLLO INMOBILIARIO", facultad: "ARTES INTEGRADAS", sede: "CALI" },
  { codigo: "5584", nombre: "ESPECIALIZACIÓN EN MANTENIMIENTO Y CONSERVACIÓN DE EDIFICACIONES", facultad: "ARTES INTEGRADAS", sede: "CALI" },
  { codigo: "7576", nombre: "MAESTRÍA EN ARQUITECTURA Y URBANISMO", facultad: "ARTES INTEGRADAS", sede: "CALI" },
  { codigo: "7577", nombre: "MAESTRÍA EN INTERNACIONALIZACIÓN DE LAS EMPRESAS DEL SECTOR DE LA CONSTRUCCIÓN", facultad: "ARTES INTEGRADAS", sede: "CALI" },
  { codigo: "7579", nombre: "MAESTRÍA EN CULTURAS AUDIOVISUALES", facultad: "ARTES INTEGRADAS", sede: "CALI" },
  { codigo: "7580", nombre: "MAESTRÍA EN MÚSICA", facultad: "ARTES INTEGRADAS", sede: "CALI" },
  { codigo: "7581", nombre: "MAESTRÍA EN VALORACIÓN Y TASACIÓN DE BIENES", facultad: "ARTES INTEGRADAS", sede: "CALI" },
  { codigo: "9501", nombre: "DOCTORADO EN GESTIÓN URBANA Y DEL TERRITORIO", facultad: "ARTES INTEGRADAS", sede: "CALI" },

  // CALI - SALUD
  { codigo: "2635", nombre: "TECNOLOGÍA EN ATENCIÓN PREHOSPITALARIA", facultad: "SALUD", sede: "CALI" },
  { codigo: "3645", nombre: "ENFERMERÍA", facultad: "SALUD", sede: "CALI" },
  { codigo: "3646", nombre: "FISIOTERAPIA", facultad: "SALUD", sede: "CALI" },
  { codigo: "3647", nombre: "BACTERIOLOGÍA Y LABORATORIO CLÍNICO", facultad: "SALUD", sede: "CALI" },
  { codigo: "3648", nombre: "FONOAUDIOLOGÍA", facultad: "SALUD", sede: "CALI" },
  { codigo: "3651", nombre: "TERAPIA OCUPACIONAL", facultad: "SALUD", sede: "CALI" },
  { codigo: "3660", nombre: "MEDICINA", facultad: "SALUD", sede: "CALI" },
  { codigo: "3661", nombre: "ODONTOLOGÍA", facultad: "SALUD", sede: "CALI" },
  { codigo: "5601", nombre: "ESPECIALIZACIÓN EN CIRUGÍA GENERAL", facultad: "SALUD", sede: "CALI" },
  { codigo: "5602", nombre: "ESPECIALIZACIÓN EN ANESTESIOLOGÍA", facultad: "SALUD", sede: "CALI" },
  { codigo: "5603", nombre: "ESPECIALIZACIÓN EN NEUROCIRUGÍA", facultad: "SALUD", sede: "CALI" },
  { codigo: "5604", nombre: "ESPECIALIZACIÓN EN OFTALMOLOGÍA", facultad: "SALUD", sede: "CALI" },
  { codigo: "5605", nombre: "ESPECIALIZACIÓN EN OTORRINOLARINGOLOGÍA", facultad: "SALUD", sede: "CALI" },
  { codigo: "5606", nombre: "ESPECIALIZACIÓN EN NEUROLOGÍA", facultad: "SALUD", sede: "CALI" },
  { codigo: "5607", nombre: "ESPECIALIZACIÓN EN UROLOGÍA", facultad: "SALUD", sede: "CALI" },
  { codigo: "5608", nombre: "ESPECIALIZACIÓN EN MEDICINA FÍSICA Y REHABILITACIÓN", facultad: "SALUD", sede: "CALI" },
  { codigo: "5609", nombre: "ESPECIALIZACIÓN EN PEDIATRÍA", facultad: "SALUD", sede: "CALI" },
  { codigo: "5610", nombre: "ESPECIALIZACIÓN EN MEDICINA INTERNA", facultad: "SALUD", sede: "CALI" },
  { codigo: "5611", nombre: "ESPECIALIZACIÓN EN GINECOLOGÍA Y OBSTETRICIA", facultad: "SALUD", sede: "CALI" },
  { codigo: "5615", nombre: "ESPECIALIZACIÓN EN PSIQUIATRÍA", facultad: "SALUD", sede: "CALI" },
  { codigo: "5616", nombre: "ESPECIALIZACIÓN EN DERMATOLOGÍA", facultad: "SALUD", sede: "CALI" },
  { codigo: "5618", nombre: "ESPECIALIZACIÓN EN RADIODIAGNÓSTICO", facultad: "SALUD", sede: "CALI" },
  { codigo: "5620", nombre: "ESPECIALIZACIÓN EN ANATOMÍA PATOLÓGICA Y PATOLOGÍA CLÍNICA", facultad: "SALUD", sede: "CALI" },
  { codigo: "5621", nombre: "ESPECIALIZACIÓN EN ORTOPEDIA Y TRAUMATOLOGÍA", facultad: "SALUD", sede: "CALI" },
  { codigo: "5622", nombre: "ESPECIALIZACIÓN EN MEDICINA FAMILIAR", facultad: "SALUD", sede: "CALI" },
  { codigo: "5623", nombre: "ESPECIALIZACIÓN EN NEFROLOGÍA", facultad: "SALUD", sede: "CALI" },
  { codigo: "5624", nombre: "ESPECIALIZACIÓN EN CARDIOLOGÍA", facultad: "SALUD", sede: "CALI" },
  { codigo: "5628", nombre: "ESPECIALIZACIÓN EN AUDITORÍA EN SALUD", facultad: "SALUD", sede: "CALI" },
  { codigo: "5629", nombre: "ESPECIALIZACIÓN EN ANESTESIOLOGÍA Y REANIMACIÓN", facultad: "SALUD", sede: "CALI" },
  { codigo: "5630", nombre: "ESPECIALIZACIÓN EN INFECTOLOGÍA PEDIÁTRICA", facultad: "SALUD", sede: "CALI" },
  { codigo: "5631", nombre: "ESPECIALIZACIÓN EN CIRUGÍA ONCOLÓGICA", facultad: "SALUD", sede: "CALI" },
  { codigo: "5632", nombre: "ESPECIALIZACIÓN EN CIRUGÍA PLÁSTICA: RECONSTRUCTIVA Y ESTÉTICA", facultad: "SALUD", sede: "CALI" },
  { codigo: "5633", nombre: "ESPECIALIZACIÓN EN INFECTOLOGÍA", facultad: "SALUD", sede: "CALI" },
  { codigo: "5638", nombre: "ESPECIALIZACIÓN EN NEONATOLOGÍA", facultad: "SALUD", sede: "CALI" },
  { codigo: "5639", nombre: "ESPECIALIZACIÓN EN CIRUGÍA PEDIÁTRICA", facultad: "SALUD", sede: "CALI" },
  { codigo: "5641", nombre: "ESPECIALIZACIÓN EN GERIATRÍA", facultad: "SALUD", sede: "CALI" },
  { codigo: "5642", nombre: "ESPECIALIZACIÓN EN RADIOLOGÍA E IMÁGENES DIAGNÓSTICAS", facultad: "SALUD", sede: "CALI" },
  { codigo: "5671", nombre: "ESPECIALIZACIÓN EN ENFERMERÍA NEFROLÓGICA", facultad: "SALUD", sede: "CALI" },
  { codigo: "5672", nombre: "ESPECIALIZACIÓN EN ENFERMERÍA MATERNO PERINATAL", facultad: "SALUD", sede: "CALI" },
  { codigo: "5673", nombre: "ESPECIALIZACIÓN EN ENFERMERÍA NEONATAL", facultad: "SALUD", sede: "CALI" },
  { codigo: "5676", nombre: "ESPECIALIZACIÓN EN PERIODONCIA", facultad: "SALUD", sede: "CALI" },
  { codigo: "5677", nombre: "ESPECIALIZACIÓN EN CIRUGÍA PLÁSTICA, ESTÉTICA, MAXILOFACIAL Y DE LA MANO", facultad: "SALUD", sede: "CALI" },
  { codigo: "5678", nombre: "ESPECIALIZACIÓN EN ODONTOLOGÍA PEDIÁTRICA Y ORTOPEDIA MAXILAR", facultad: "SALUD", sede: "CALI" },
  { codigo: "5679", nombre: "ESPECIALIZACIÓN EN ORTODONCIA", facultad: "SALUD", sede: "CALI" },
  { codigo: "5680", nombre: "ESPECIALIZACIÓN EN REHABILITACIÓN ORAL", facultad: "SALUD", sede: "CALI" },
  { codigo: "5681", nombre: "ESPECIALIZACIÓN EN DERMATOLOGÍA Y CIRUGÍA DERMATOLÓGICA", facultad: "SALUD", sede: "CALI" },
  { codigo: "5682", nombre: "ESPECIALIZACIÓN EN FISIOTERAPIA CARDIOPULMONAR", facultad: "SALUD", sede: "CALI" },
  { codigo: "5683", nombre: "ESPECIALIZACIÓN EN ENFERMERÍA EN CUIDADO CRÍTICO DEL ADULTO", facultad: "SALUD", sede: "CALI" },
  { codigo: "5684", nombre: "ESPECIALIZACIÓN EN ENFERMERÍA EN CUIDADO A LAS PERSONAS CON HERIDAS Y OSTOMÍAS", facultad: "SALUD", sede: "CALI" },
  { codigo: "5685", nombre: "ESPECIALIZACIÓN EN MEDICINA CRÍTICA Y CUIDADO INTENSIVO", facultad: "SALUD", sede: "CALI" },
  { codigo: "5686", nombre: "ESPECIALIZACIÓN EN ENFERMERÍA EN SALUD MENTAL Y PSIQUIATRÍA", facultad: "SALUD", sede: "CALI" },
  { codigo: "5687", nombre: "ESPECIALIZACIÓN EN CIRUGÍA DE TRAUMA Y EMERGENCIAS", facultad: "SALUD", sede: "CALI" },
  { codigo: "5688", nombre: "ESPECIALIZACIÓN EN PATOLOGÍA", facultad: "SALUD", sede: "CALI" },
  { codigo: "5690", nombre: "ESPECIALIZACIÓN EN OTOLOGÍA Y NEUROTOLOGÍA", facultad: "SALUD", sede: "CALI" },
  { codigo: "5691", nombre: "ESPECIALIZACIÓN EN ENDODONCIA", facultad: "SALUD", sede: "CALI" },
  { codigo: "5692", nombre: "ESPECIALIZACIÓN EN MEDICINA REPRODUCTIVA", facultad: "SALUD", sede: "CALI" },
  { codigo: "5693", nombre: "ESPECIALIZACIÓN EN ENFERMERÍA EN CUIDADO CRÍTICO PEDIÁTRICO", facultad: "SALUD", sede: "CALI" },
  { codigo: "5694", nombre: "ESPECIALIZACIÓN EN ENFERMERÍA ONCOLÓGICA", facultad: "SALUD", sede: "CALI" },
  { codigo: "5695", nombre: "ESPECIALIZACIÓN EN CIRUGÍA ORAL Y MAXILOFACIAL", facultad: "SALUD", sede: "CALI" },
  { codigo: "5696", nombre: "ESPECIALIZACIÓN EN MEDICINA MATERNO FETAL", facultad: "SALUD", sede: "CALI" },
  { codigo: "5697", nombre: "ESPECIALIZACIÓN EN NEUROPSIQUIATRÍA", facultad: "SALUD", sede: "CALI" },
  { codigo: "5698", nombre: "ESPECIALIZACIÓN EN CIRUGÍA VASCULAR PERIFÉRICA", facultad: "SALUD", sede: "CALI" },
  { codigo: "7605", nombre: "MAESTRÍA EN ECONOMÍA DE LA SALUD", facultad: "SALUD", sede: "CALI" },
  { codigo: "7610", nombre: "MAESTRÍA EN GESTIÓN DE LA CALIDAD PARA LABORATORIOS", facultad: "SALUD", sede: "CALI" },
  { codigo: "7620", nombre: "MAESTRÍA EN FISIOTERAPIA", facultad: "SALUD", sede: "CALI" },
  { codigo: "7670", nombre: "MAESTRÍA EN CIENCIAS BIOMÉDICAS", facultad: "SALUD", sede: "CALI" },
  { codigo: "7671", nombre: "MAESTRÍA EN CIENCIAS ODONTOLÓGICAS", facultad: "SALUD", sede: "CALI" },
  { codigo: "7672", nombre: "MAESTRÍA EN TERAPIA OCUPACIONAL", facultad: "SALUD", sede: "CALI" },
  { codigo: "7680", nombre: "MAESTRÍA EN SALUD PÚBLICA", facultad: "SALUD", sede: "CALI" },
  { codigo: "7681", nombre: "MAESTRÍA EN SALUD OCUPACIONAL", facultad: "SALUD", sede: "CALI" },
  { codigo: "7682", nombre: "MAESTRÍA EN ADMINISTRACIÓN DE SALUD", facultad: "SALUD", sede: "CALI" },
  { codigo: "7689", nombre: "MAESTRÍA EN EPIDEMIOLOGÍA", facultad: "SALUD", sede: "CALI" },
  { codigo: "7691", nombre: "MAESTRÍA EN ENFERMERÍA - ÉNFASIS EN CUIDADO AL ADULTO Y AL ANCIANO", facultad: "SALUD", sede: "CALI" },
  { codigo: "7692", nombre: "MAESTRÍA EN ENFERMERÍA - ÉNFASIS EN CUIDADO MATERNO-INFANTIL", facultad: "SALUD", sede: "CALI" },
  { codigo: "7693", nombre: "MAESTRÍA EN ENFERMERÍA - ÉNFASIS EN CUIDADO AL NIÑO", facultad: "SALUD", sede: "CALI" },
  { codigo: "9680", nombre: "DOCTORADO EN SALUD", facultad: "SALUD", sede: "CALI" },
  { codigo: "9681", nombre: "DOCTORADO EN ERGONOMÍA", facultad: "SALUD", sede: "CALI" },
  { codigo: "9695", nombre: "DOCTORADO EN CIENCIAS BIOMÉDICAS", facultad: "SALUD", sede: "CALI" },

  // CALI - INGENIERÍA
  { codigo: "2710", nombre: "TECNOLOGÍA ELECTRÓNICA", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "2711", nombre: "TECNOLOGÍA EN SISTEMAS DE INFORMACIÓN", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "2712", nombre: "TECNOLOGÍA EN ALIMENTOS", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "2713", nombre: "TECNOLOGÍA EN MANEJO Y CONSERVACIÓN DE SUELOS Y AGUAS", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "2715", nombre: "TECNOLOGÍA EN ECOLOGÍA Y MANEJO AMBIENTAL", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "2724", nombre: "TECNOLOGÍA EN DESARROLLO DE SOFTWARE", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "2725", nombre: "TECNOLOGÍA EN ELECTRÓNICA INDUSTRIAL", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "2726", nombre: "TECNOLOGÍA DE PROCESAMIENTO DE ALIMENTOS", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "3740", nombre: "INGENIERÍA TOPOGRÁFICA", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "3741", nombre: "INGENIERÍA DE MATERIALES", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "3743", nombre: "INGENIERÍA DE SISTEMAS", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "3744", nombre: "INGENIERÍA ELECTRÓNICA", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "3745", nombre: "INGENIERÍA AGRÍCOLA", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "3746", nombre: "INGENIERÍA ELÉCTRICA", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "3747", nombre: "INGENIERÍA CIVIL", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "3748", nombre: "INGENIERÍA MECÁNICA", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "3749", nombre: "INGENIERÍA QUÍMICA", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "3751", nombre: "INGENIERÍA INDUSTRIAL", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "3752", nombre: "ESTADÍSTICA", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "3753", nombre: "INGENIERÍA DE ALIMENTOS", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "3754", nombre: "INGENIERÍA SANITARIA Y AMBIENTAL", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "3755", nombre: "INGENIERÍA GEOMÁTICA", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "5751", nombre: "ESPECIALIZACIÓN EN GEOMÁTICA", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "5753", nombre: "ESPECIALIZACIÓN EN GEOTECNIA", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "5754", nombre: "ESPECIALIZACIÓN EN GERENCIA DE PROYECTOS DE CONSTRUCCIÓN", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "5755", nombre: "ESPECIALIZACIÓN EN SANEAMIENTO AMBIENTAL", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "5756", nombre: "ESPECIALIZACIÓN EN VENTILACIÓN, CLIMATIZACIÓN Y REFRIGERACIÓN", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "5758", nombre: "ESPECIALIZACIÓN EN SISTEMAS ELECTRÓNICOS INTELIGENTES", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "5772", nombre: "ESPECIALIZACIÓN EN ESTRUCTURAS", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "5775", nombre: "ESPECIALIZACIÓN EN REDES DE COMUNICACIÓN", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "5778", nombre: "ESPECIALIZACIÓN EN AUTOMATIZACIÓN INDUSTRIAL", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "5785", nombre: "ESPECIALIZACIÓN EN SISTEMAS DE TRANSMISIÓN Y DISTRIBUCIÓN DE ENERGÍA ELÉCTRICA", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "5796", nombre: "ESPECIALIZACIÓN EN ESTADÍSTICA APLICADA", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "7712", nombre: "MAESTRÍA EN INGENIERÍA - ÉNFASIS EN AUTOMÁTICA", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "7713", nombre: "MAESTRÍA EN INGENIERÍA - ÉNFASIS EN INGENIERÍA CIVIL", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "7714", nombre: "MAESTRÍA EN INGENIERÍA - ÉNFASIS EN INGENIERÍA ELÉCTRICA", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "7715", nombre: "MAESTRÍA EN INGENIERÍA - ÉNFASIS EN INGENIERÍA ELECTRÓNICA", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "7716", nombre: "MAESTRÍA EN INGENIERÍA - ÉNFASIS EN INGENIERÍA INDUSTRIAL", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "7717", nombre: "MAESTRÍA EN INGENIERÍA - ÉNFASIS EN INGENIERÍA DE LOS MATERIALES", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "7718", nombre: "MAESTRÍA EN INGENIERÍA - ÉNFASIS EN INGENIERÍA MECÁNICA", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "7719", nombre: "MAESTRÍA EN INGENIERÍA - ÉNFASIS EN INGENIERÍA QUÍMICA", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "7720", nombre: "MAESTRÍA EN INGENIERÍA - ÉNFASIS EN INGENIERÍA SANITARIA Y AMBIENTAL", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "7721", nombre: "MAESTRÍA EN INGENIERÍA - ÉNFASIS EN INGENIERÍA DE SISTEMAS Y COMPUTACIÓN", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "7722", nombre: "MAESTRÍA EN INGENIERÍA - ÉNFASIS EN INGENIERÍA AEROESPACIAL", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "7723", nombre: "MAESTRÍA EN ESTADÍSTICA", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "7724", nombre: "MAESTRÍA EN GESTIÓN INTEGRADA DE LOS RECURSOS HÍDRICOS", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "7725", nombre: "MAESTRÍA EN LOGÍSTICA Y GESTIÓN DE CADENAS DE ABASTECIMIENTO", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "7726", nombre: "MAESTRÍA EN REDES DE COMUNICACIÓN", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "7727", nombre: "MAESTRÍA EN ANALÍTICA E INTELIGENCIA DE NEGOCIOS", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "7730", nombre: "MAESTRÍA EN INGENIERÍA DE PROCESOS INDUSTRIALES SOSTENIBLES", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "7731", nombre: "MAESTRÍA EN INGENIERÍA CIVIL", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "7732", nombre: "MAESTRÍA EN AUTOMATIZACIÓN", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "7733", nombre: "MAESTRÍA EN TRANSFORMACIÓN DIGITAL DE LAS REDES ELÉCTRICAS", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "7734", nombre: "MAESTRÍA EN SISTEMAS ELECTRÓNICOS INTELIGENTES", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "7735", nombre: "MAESTRÍA EN GESTIÓN FINANCIERA", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "7787", nombre: "MAESTRÍA EN DESARROLLO SUSTENTABLE", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "7788", nombre: "MAESTRÍA EN INGENIERÍA DE ALIMENTOS", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "9701", nombre: "DOCTORADO EN INGENIERÍA - ÉNFASIS EN INGENIERÍA DE ALIMENTOS", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "9702", nombre: "DOCTORADO EN INGENIERÍA - ÉNFASIS EN CIENCIAS DE LA COMPUTACIÓN", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "9703", nombre: "DOCTORADO EN INGENIERÍA - ÉNFASIS EN INGENIERÍA ELÉCTRICA Y ELECTRÓNICA", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "9704", nombre: "DOCTORADO EN INGENIERÍA - ÉNFASIS EN INGENIERÍA DE LOS MATERIALES", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "9705", nombre: "DOCTORADO EN INGENIERÍA - ÉNFASIS EN INGENIERÍA QUÍMICA", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "9706", nombre: "DOCTORADO EN INGENIERÍA - ÉNFASIS EN INGENIERÍA SANITARIA Y AMBIENTAL", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "9707", nombre: "DOCTORADO EN INGENIERÍA - ÉNFASIS EN INGENIERÍA INDUSTRIAL", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "9708", nombre: "DOCTORADO EN INGENIERÍA - ÉNFASIS MECÁNICA DE SÓLIDOS", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "9709", nombre: "DOCTORADO EN INGENIERÍA ELÉCTRICA Y ELECTRÓNICA", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "9710", nombre: "DOCTORADO EN MECÁNICA APLICADA", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "9711", nombre: "DOCTORADO EN INGENIERÍA MECÁNICA", facultad: "INGENIERÍA", sede: "CALI" },
  { codigo: "9712", nombre: "DOCTORADO EN BIOINGENIERÍA", facultad: "INGENIERÍA", sede: "CALI" },

  // CALI - CIENCIAS DE LA ADMINISTRACIÓN
  { codigo: "3841", nombre: "CONTADURÍA PÚBLICA", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "CALI" },
  { codigo: "3845", nombre: "ADMINISTRACIÓN DE EMPRESAS", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "CALI" },
  { codigo: "3847", nombre: "ADMINISTRACIÓN PÚBLICA", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "CALI" },
  { codigo: "3848", nombre: "FINANZAS Y BANCA", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "CALI" },
  { codigo: "3849", nombre: "ADMINISTRACIÓN TURÍSTICA", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "CALI" },
  { codigo: "3850", nombre: "GESTIÓN DEL EMPRENDIMIENTO Y LA INNOVACIÓN", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "CALI" },
  { codigo: "3857", nombre: "COMERCIO EXTERIOR", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "CALI" },
  { codigo: "5882", nombre: "ESPECIALIZACIÓN EN FINANZAS", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "CALI" },
  { codigo: "5889", nombre: "ESPECIALIZACIÓN EN GERENCIA DE MARKETING ESTRATÉGICO", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "CALI" },
  { codigo: "5890", nombre: "ESPECIALIZACIÓN EN CALIDAD DE LA GESTIÓN Y PRODUCTIVIDAD", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "CALI" },
  { codigo: "5891", nombre: "ESPECIALIZACIÓN EN GESTIÓN TRIBUTARIA", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "CALI" },
  { codigo: "5892", nombre: "ESPECIALIZACIÓN EN GERENCIA PÚBLICA", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "CALI" },
  { codigo: "5893", nombre: "ESPECIALIZACIÓN EN ALTA GERENCIA", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "CALI" },
  { codigo: "7878", nombre: "MAESTRÍA EN CIENCIAS DE LA ORGANIZACIÓN", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "CALI" },
  { codigo: "7879", nombre: "MAESTRÍA EN POLÍTICAS PÚBLICAS", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "CALI" },
  { codigo: "7880", nombre: "MAESTRÍA EN ADMINISTRACIÓN", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "CALI" },
  { codigo: "7881", nombre: "MAESTRÍA EN CONTABILIDAD", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "CALI" },
  { codigo: "7883", nombre: "MAESTRÍA EN COMERCIO INTERNACIONAL", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "CALI" },
  { codigo: "7884", nombre: "MAESTRÍA EN CALIDAD PARA LA GESTIÓN DE LAS ORGANIZACIONES", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "CALI" },
  { codigo: "7885", nombre: "MAESTRÍA EN GERENCIA DE PROYECTOS", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "CALI" },
  { codigo: "7886", nombre: "MAESTRÍA EN PROSPECTIVA E INNOVACIÓN", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "CALI" },
  { codigo: "9801", nombre: "DOCTORADO EN ADMINISTRACIÓN", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "CALI" },
  { codigo: "9802", nombre: "DOCTORADO EN GOBIERNO, POLÍTICA PÚBLICA Y ADMINISTRACIÓN PÚBLICA", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "CALI" },

  // CALI - DERECHO Y CIENCIA POLÍTICA
  { codigo: "3489", nombre: "ESTUDIOS POLÍTICOS Y RESOLUCIÓN DE CONFLICTOS", facultad: "DERECHO Y CIENCIA POLÍTICA", sede: "CALI" },
  { codigo: "3D01", nombre: "DERECHO", facultad: "DERECHO Y CIENCIA POLÍTICA", sede: "CALI" },

  // BUGA - HUMANIDADES
  { codigo: "3251", nombre: "LICENCIATURA EN HISTORIA", facultad: "HUMANIDADES", sede: "BUGA" },
  { codigo: "3252", nombre: "LICENCIATURA EN LITERATURA", facultad: "HUMANIDADES", sede: "BUGA" },
  { codigo: "7273", nombre: "MAESTRÍA EN FILOSOFÍA", facultad: "HUMANIDADES", sede: "BUGA" },
  { codigo: "7280", nombre: "MAESTRÍA EN DIDÁCTICA DE LA LITERATURA", facultad: "HUMANIDADES", sede: "BUGA" },

  // BUGA - PSICOLOGÍA
  { codigo: "3461", nombre: "PSICOLOGÍA", facultad: "PSICOLOGÍA", sede: "BUGA" },

  // BUGA - ARTES INTEGRADAS
  { codigo: "3541", nombre: "LICENCIATURA EN MÚSICA", facultad: "ARTES INTEGRADAS", sede: "BUGA" },
  { codigo: "3548", nombre: "COMUNICACIÓN SOCIAL", facultad: "ARTES INTEGRADAS", sede: "BUGA" },
  { codigo: "3553", nombre: "COMUNICACIÓN SOCIAL - PERIODISMO", facultad: "ARTES INTEGRADAS", sede: "BUGA" },

  // BUGA - INGENIERÍA
  { codigo: "2710", nombre: "TECNOLOGÍA ELECTRÓNICA", facultad: "INGENIERÍA", sede: "BUGA" },
  { codigo: "2711", nombre: "TECNOLOGÍA EN SISTEMAS DE INFORMACIÓN", facultad: "INGENIERÍA", sede: "BUGA" },
  { codigo: "2724", nombre: "TECNOLOGÍA EN DESARROLLO DE SOFTWARE", facultad: "INGENIERÍA", sede: "BUGA" },
  { codigo: "2725", nombre: "TECNOLOGÍA EN ELECTRÓNICA INDUSTRIAL", facultad: "INGENIERÍA", sede: "BUGA" },
  { codigo: "3751", nombre: "INGENIERÍA INDUSTRIAL", facultad: "INGENIERÍA", sede: "BUGA" },
  { codigo: "7725", nombre: "MAESTRÍA EN LOGÍSTICA Y GESTIÓN DE CADENAS DE ABASTECIMIENTO", facultad: "INGENIERÍA", sede: "BUGA" },

  // BUGA - CIENCIAS DE LA ADMINISTRACIÓN
  { codigo: "2835", nombre: "TECNOLOGÍA EN DIRECCIÓN DE EMPRESAS TURÍSTICAS Y HOTELERAS", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "BUGA" },
  { codigo: "2840", nombre: "TECNOLOGÍA EN GESTIÓN DE ORGANIZACIONES TURÍSTICAS", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "BUGA" },
  { codigo: "3841", nombre: "CONTADURÍA PÚBLICA", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "BUGA" },
  { codigo: "3845", nombre: "ADMINISTRACIÓN DE EMPRESAS", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "BUGA" },
  { codigo: "3857", nombre: "COMERCIO EXTERIOR", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "BUGA" },

  // CAICEDONIA - HUMANIDADES
  { codigo: "3252", nombre: "LICENCIATURA EN LITERATURA", facultad: "HUMANIDADES", sede: "CAICEDONIA" },

  // CAICEDONIA - INGENIERÍA
  { codigo: "2711", nombre: "TECNOLOGÍA EN SISTEMAS DE INFORMACIÓN", facultad: "INGENIERÍA", sede: "CAICEDONIA" },
  { codigo: "2716", nombre: "TECNOLOGÍA AGROAMBIENTAL", facultad: "INGENIERÍA", sede: "CAICEDONIA" },
  { codigo: "2724", nombre: "TECNOLOGÍA EN DESARROLLO DE SOFTWARE", facultad: "INGENIERÍA", sede: "CAICEDONIA" },
  { codigo: "2728", nombre: "TECNOLOGÍA EN PRODUCCIÓN AGROAMBIENTAL", facultad: "INGENIERÍA", sede: "CAICEDONIA" },
  { codigo: "3745", nombre: "INGENIERÍA AGRÍCOLA", facultad: "INGENIERÍA", sede: "CAICEDONIA" },
  { codigo: "3751", nombre: "INGENIERÍA INDUSTRIAL", facultad: "INGENIERÍA", sede: "CAICEDONIA" },

  // CAICEDONIA - CIENCIAS DE LA ADMINISTRACIÓN
  { codigo: "2835", nombre: "TECNOLOGÍA EN DIRECCIÓN DE EMPRESAS TURÍSTICAS Y HOTELERAS", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "CAICEDONIA" },
  { codigo: "2840", nombre: "TECNOLOGÍA EN GESTIÓN DE ORGANIZACIONES TURÍSTICAS", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "CAICEDONIA" },
  { codigo: "3841", nombre: "CONTADURÍA PÚBLICA", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "CAICEDONIA" },
  { codigo: "3845", nombre: "ADMINISTRACIÓN DE EMPRESAS", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "CAICEDONIA" },

  // CARTAGO - CIENCIAS NATURALES Y EXACTAS
  { codigo: "3150", nombre: "AGROINDUSTRIA", facultad: "CIENCIAS NATURALES Y EXACTAS", sede: "CARTAGO" },

  // CARTAGO - HUMANIDADES
  { codigo: "3249", nombre: "TRABAJO SOCIAL", facultad: "HUMANIDADES", sede: "CARTAGO" },

  // CARTAGO - EDUCACIÓN Y PEDAGOGÍA
  { codigo: "7420", nombre: "MAESTRÍA EN EDUCACIÓN ÉNFASIS EN LENGUAJE", facultad: "EDUCACIÓN Y PEDAGOGÍA", sede: "CARTAGO" },

  // CARTAGO - INGENIERÍA
  { codigo: "2710", nombre: "TECNOLOGÍA ELECTRÓNICA", facultad: "INGENIERÍA", sede: "CARTAGO" },
  { codigo: "2716", nombre: "TECNOLOGÍA AGROAMBIENTAL", facultad: "INGENIERÍA", sede: "CARTAGO" },
  { codigo: "2725", nombre: "TECNOLOGÍA EN ELECTRÓNICA INDUSTRIAL", facultad: "INGENIERÍA", sede: "CARTAGO" },
  { codigo: "2728", nombre: "TECNOLOGÍA EN PRODUCCIÓN AGROAMBIENTAL", facultad: "INGENIERÍA", sede: "CARTAGO" },
  { codigo: "3744", nombre: "INGENIERÍA ELECTRÓNICA", facultad: "INGENIERÍA", sede: "CARTAGO" },

  // CARTAGO - CIENCIAS DE LA ADMINISTRACIÓN
  { codigo: "2835", nombre: "TECNOLOGÍA EN DIRECCIÓN DE EMPRESAS TURÍSTICAS Y HOTELERAS", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "CARTAGO" },
  { codigo: "2840", nombre: "TECNOLOGÍA EN GESTIÓN DE ORGANIZACIONES TURÍSTICAS", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "CARTAGO" },
  { codigo: "3841", nombre: "CONTADURÍA PÚBLICA", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "CARTAGO" },
  { codigo: "3845", nombre: "ADMINISTRACIÓN DE EMPRESAS", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "CARTAGO" },
  { codigo: "5889", nombre: "ESPECIALIZACIÓN EN GERENCIA DE MARKETING ESTRATÉGICO", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "CARTAGO" },
  { codigo: "5893", nombre: "ESPECIALIZACIÓN EN ALTA GERENCIA", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "CARTAGO" },

  // PACIFICO - HUMANIDADES
  { codigo: "3249", nombre: "TRABAJO SOCIAL", facultad: "HUMANIDADES", sede: "PACIFICO" },

  // PACIFICO - CIENCIAS SOCIALES Y ECONÓMICAS
  { codigo: "5384", nombre: "ESPECIALIZACIÓN EN PROCESOS DE INTERVENCIÓN SOCIAL", facultad: "CIENCIAS SOCIALES Y ECONÓMICAS", sede: "PACIFICO" },

  // PACIFICO - EDUCACIÓN Y PEDAGOGÍA
  { codigo: "3467", nombre: "LICENCIATURA EN EDUCACIÓN BÁSICA CON ÉNFASIS EN CIENCIAS NATURALES Y EDUCACIÓN AMBIENTAL", facultad: "EDUCACIÓN Y PEDAGOGÍA", sede: "PACIFICO" },
  { codigo: "3469", nombre: "LICENCIATURA EN EDUCACIÓN BÁSICA CON ÉNFASIS EN MATEMÁTICAS", facultad: "EDUCACIÓN Y PEDAGOGÍA", sede: "PACIFICO" },
  { codigo: "3491", nombre: "LICENCIATURA EN CIENCIAS NATURALES Y EDUCACIÓN AMBIENTAL", facultad: "EDUCACIÓN Y PEDAGOGÍA", sede: "PACIFICO" },
  { codigo: "3492", nombre: "LICENCIATURA EN MATEMÁTICAS", facultad: "EDUCACIÓN Y PEDAGOGÍA", sede: "PACIFICO" },

  // PACIFICO - ARTES INTEGRADAS
  { codigo: "3541", nombre: "LICENCIATURA EN MÚSICA", facultad: "ARTES INTEGRADAS", sede: "PACIFICO" },
  { codigo: "3555", nombre: "LICENCIATURA EN ARTE DRAMÁTICO", facultad: "ARTES INTEGRADAS", sede: "PACIFICO" },
  { codigo: "3560", nombre: "LICENCIATURA EN DANZA", facultad: "ARTES INTEGRADAS", sede: "PACIFICO" },

  // PACIFICO - INGENIERÍA
  { codigo: "2710", nombre: "TECNOLOGÍA ELECTRÓNICA", facultad: "INGENIERÍA", sede: "PACIFICO" },
  { codigo: "2711", nombre: "TECNOLOGÍA EN SISTEMAS DE INFORMACIÓN", facultad: "INGENIERÍA", sede: "PACIFICO" },
  { codigo: "2712", nombre: "TECNOLOGÍA EN ALIMENTOS", facultad: "INGENIERÍA", sede: "PACIFICO" },
  { codigo: "2718", nombre: "TECNOLOGÍA EN LOGÍSTICA PORTUARIA Y DEL TRANSPORTE", facultad: "INGENIERÍA", sede: "PACIFICO" },
  { codigo: "2719", nombre: "TECNOLOGÍA EN MANTENIMIENTO DE EQUIPO PORTUARIO Y DEL TRANSPORTE", facultad: "INGENIERÍA", sede: "PACIFICO" },
  { codigo: "2724", nombre: "TECNOLOGÍA EN DESARROLLO DE SOFTWARE", facultad: "INGENIERÍA", sede: "PACIFICO" },
  { codigo: "2725", nombre: "TECNOLOGÍA EN ELECTRÓNICA INDUSTRIAL", facultad: "INGENIERÍA", sede: "PACIFICO" },
  { codigo: "2727", nombre: "TECNOLOGÍA EN MANTENIMIENTO DE EQUIPOS INDUSTRIALES", facultad: "INGENIERÍA", sede: "PACIFICO" },

  // PACIFICO - CIENCIAS DE LA ADMINISTRACIÓN
  { codigo: "2834", nombre: "TECNOLOGÍA EN GESTIÓN PORTUARIA", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "PACIFICO" },
  { codigo: "3841", nombre: "CONTADURÍA PÚBLICA", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "PACIFICO" },
  { codigo: "3845", nombre: "ADMINISTRACIÓN DE EMPRESAS", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "PACIFICO" },
  { codigo: "3857", nombre: "COMERCIO EXTERIOR", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "PACIFICO" },
  { codigo: "5882", nombre: "ESPECIALIZACIÓN EN FINANZAS", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "PACIFICO" },

  // PALMIRA - CIENCIAS NATURALES Y EXACTAS
  { codigo: "2133", nombre: "TECNOLOGÍA EN AGROFORESTERÍA", facultad: "CIENCIAS NATURALES Y EXACTAS", sede: "PALMIRA" },
  { codigo: "2135", nombre: "TECNOLOGÍA EN MANEJO DE LA PRODUCCIÓN AGROFORESTAL", facultad: "CIENCIAS NATURALES Y EXACTAS", sede: "PALMIRA" },
  { codigo: "7182", nombre: "MAESTRÍA EN BIOTECNOLOGÍA", facultad: "CIENCIAS NATURALES Y EXACTAS", sede: "PALMIRA" },

  // PALMIRA - HUMANIDADES
  { codigo: "3252", nombre: "LICENCIATURA EN LITERATURA", facultad: "HUMANIDADES", sede: "PALMIRA" },

  // PALMIRA - EDUCACIÓN Y PEDAGOGÍA
  { codigo: "3484", nombre: "LICENCIATURA EN EDUCACIÓN FÍSICA Y DEPORTES", facultad: "EDUCACIÓN Y PEDAGOGÍA", sede: "PALMIRA" },
  { codigo: "3490", nombre: "LICENCIATURA EN EDUCACIÓN FÍSICA Y DEPORTE", facultad: "EDUCACIÓN Y PEDAGOGÍA", sede: "PALMIRA" },

  // PALMIRA - PSICOLOGÍA
  { codigo: "3461", nombre: "PSICOLOGÍA", facultad: "PSICOLOGÍA", sede: "PALMIRA" },

  // PALMIRA - INGENIERÍA
  { codigo: "2710", nombre: "TECNOLOGÍA ELECTRÓNICA", facultad: "INGENIERÍA", sede: "PALMIRA" },
  { codigo: "2711", nombre: "TECNOLOGÍA EN SISTEMAS DE INFORMACIÓN", facultad: "INGENIERÍA", sede: "PALMIRA" },
  { codigo: "2712", nombre: "TECNOLOGÍA EN ALIMENTOS", facultad: "INGENIERÍA", sede: "PALMIRA" },
  { codigo: "2716", nombre: "TECNOLOGÍA AGROAMBIENTAL", facultad: "INGENIERÍA", sede: "PALMIRA" },
  { codigo: "2721", nombre: "TECNOLOGÍA EN CONSTRUCCIONES SOLDADAS", facultad: "INGENIERÍA", sede: "PALMIRA" },
  { codigo: "2722", nombre: "TECNOLOGÍA EN MANTENIMIENTO DE SISTEMAS ELECTROMECÁNICOS", facultad: "INGENIERÍA", sede: "PALMIRA" },
  { codigo: "2724", nombre: "TECNOLOGÍA EN DESARROLLO DE SOFTWARE", facultad: "INGENIERÍA", sede: "PALMIRA" },
  { codigo: "2725", nombre: "TECNOLOGÍA EN ELECTRÓNICA INDUSTRIAL", facultad: "INGENIERÍA", sede: "PALMIRA" },
  { codigo: "2726", nombre: "TECNOLOGÍA DE PROCESAMIENTO DE ALIMENTOS", facultad: "INGENIERÍA", sede: "PALMIRA" },
  { codigo: "2728", nombre: "TECNOLOGÍA EN PRODUCCIÓN AGROAMBIENTAL", facultad: "INGENIERÍA", sede: "PALMIRA" },
  { codigo: "3751", nombre: "INGENIERÍA INDUSTRIAL", facultad: "INGENIERÍA", sede: "PALMIRA" },

  // PALMIRA - CIENCIAS DE LA ADMINISTRACIÓN
  { codigo: "2839", nombre: "TECNOLOGÍA EN GESTIÓN LOGÍSTICA", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "PALMIRA" },
  { codigo: "3841", nombre: "CONTADURÍA PÚBLICA", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "PALMIRA" },
  { codigo: "3845", nombre: "ADMINISTRACIÓN DE EMPRESAS", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "PALMIRA" },
  { codigo: "7885", nombre: "MAESTRÍA EN GERENCIA DE PROYECTOS", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "PALMIRA" },

  // TULUA - CIENCIAS NATURALES Y EXACTAS
  { codigo: "3150", nombre: "AGROINDUSTRIA", facultad: "CIENCIAS NATURALES Y EXACTAS", sede: "TULUA" },

  // TULUA - HUMANIDADES
  { codigo: "3249", nombre: "TRABAJO SOCIAL", facultad: "HUMANIDADES", sede: "TULUA" },

  // TULUA - EDUCACIÓN Y PEDAGOGÍA
  { codigo: "7418", nombre: "MAESTRÍA EN EDUCACIÓN - ÉNFASIS EN EDUCACIÓN MATEMÁTICAS Y CIENCIAS EXPERIMENTALES", facultad: "EDUCACIÓN Y PEDAGOGÍA", sede: "TULUA" },
  { codigo: "7420", nombre: "MAESTRÍA EN EDUCACIÓN ÉNFASIS EN LENGUAJE", facultad: "EDUCACIÓN Y PEDAGOGÍA", sede: "TULUA" },

  // TULUA - ARTES INTEGRADAS
  { codigo: "2503", nombre: "TECNOLOGÍA EN CONSTRUCCIÓN DE EDIFICACIONES E INFRAESTRUCTURA URBANA (CICLO PROPEDÉUTICO)", facultad: "ARTES INTEGRADAS", sede: "TULUA" },
  { codigo: "3554", nombre: "CONSTRUCCIÓN", facultad: "ARTES INTEGRADAS", sede: "TULUA" },

  // TULUA - SALUD
  { codigo: "3643", nombre: "NUTRICIÓN Y DIETÉTICA", facultad: "SALUD", sede: "TULUA" },
  { codigo: "5628", nombre: "ESPECIALIZACIÓN EN AUDITORÍA EN SALUD", facultad: "SALUD", sede: "TULUA" },
  { codigo: "7681", nombre: "MAESTRÍA EN SALUD OCUPACIONAL", facultad: "SALUD", sede: "TULUA" },

  // TULUA - INGENIERÍA
  { codigo: "2710", nombre: "TECNOLOGÍA ELECTRÓNICA", facultad: "INGENIERÍA", sede: "TULUA" },
  { codigo: "2711", nombre: "TECNOLOGÍA EN SISTEMAS DE INFORMACIÓN", facultad: "INGENIERÍA", sede: "TULUA" },
  { codigo: "2712", nombre: "TECNOLOGÍA EN ALIMENTOS", facultad: "INGENIERÍA", sede: "TULUA" },
  { codigo: "2724", nombre: "TECNOLOGÍA EN DESARROLLO DE SOFTWARE", facultad: "INGENIERÍA", sede: "TULUA" },
  { codigo: "2725", nombre: "TECNOLOGÍA EN ELECTRÓNICA INDUSTRIAL", facultad: "INGENIERÍA", sede: "TULUA" },
  { codigo: "3743", nombre: "INGENIERÍA DE SISTEMAS", facultad: "INGENIERÍA", sede: "TULUA" },
  { codigo: "3753", nombre: "INGENIERÍA DE ALIMENTOS", facultad: "INGENIERÍA", sede: "TULUA" },

  // TULUA - CIENCIAS DE LA ADMINISTRACIÓN
  { codigo: "3841", nombre: "CONTADURÍA PÚBLICA", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "TULUA" },
  { codigo: "3845", nombre: "ADMINISTRACIÓN DE EMPRESAS", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "TULUA" },
  { codigo: "5889", nombre: "ESPECIALIZACIÓN EN GERENCIA DE MARKETING ESTRATÉGICO", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "TULUA" },
  { codigo: "5890", nombre: "ESPECIALIZACIÓN EN CALIDAD DE LA GESTIÓN Y PRODUCTIVIDAD", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "TULUA" },
  { codigo: "5892", nombre: "ESPECIALIZACIÓN EN GERENCIA PÚBLICA", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "TULUA" },
  { codigo: "7880", nombre: "MAESTRÍA EN ADMINISTRACIÓN", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "TULUA" },
  { codigo: "7885", nombre: "MAESTRÍA EN GERENCIA DE PROYECTOS", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "TULUA" },

  // ZARZAL - HUMANIDADES
  { codigo: "3249", nombre: "TRABAJO SOCIAL", facultad: "HUMANIDADES", sede: "ZARZAL" },

  // ZARZAL - EDUCACIÓN Y PEDAGOGÍA
  { codigo: "3469", nombre: "LICENCIATURA EN EDUCACIÓN BÁSICA CON ÉNFASIS EN MATEMÁTICAS", facultad: "EDUCACIÓN Y PEDAGOGÍA", sede: "ZARZAL" },
  { codigo: "3490", nombre: "LICENCIATURA EN EDUCACIÓN FÍSICA Y DEPORTE", facultad: "EDUCACIÓN Y PEDAGOGÍA", sede: "ZARZAL" },
  { codigo: "3492", nombre: "LICENCIATURA EN MATEMÁTICAS", facultad: "EDUCACIÓN Y PEDAGOGÍA", sede: "ZARZAL" },

  // ZARZAL - INGENIERÍA
  { codigo: "2710", nombre: "TECNOLOGÍA ELECTRÓNICA", facultad: "INGENIERÍA", sede: "ZARZAL" },
  { codigo: "2711", nombre: "TECNOLOGÍA EN SISTEMAS DE INFORMACIÓN", facultad: "INGENIERÍA", sede: "ZARZAL" },
  { codigo: "2712", nombre: "TECNOLOGÍA EN ALIMENTOS", facultad: "INGENIERÍA", sede: "ZARZAL" },
  { codigo: "2716", nombre: "TECNOLOGÍA AGROAMBIENTAL", facultad: "INGENIERÍA", sede: "ZARZAL" },
  { codigo: "2724", nombre: "TECNOLOGÍA EN DESARROLLO DE SOFTWARE", facultad: "INGENIERÍA", sede: "ZARZAL" },
  { codigo: "2725", nombre: "TECNOLOGÍA EN ELECTRÓNICA INDUSTRIAL", facultad: "INGENIERÍA", sede: "ZARZAL" },
  { codigo: "2726", nombre: "TECNOLOGÍA DE PROCESAMIENTO DE ALIMENTOS", facultad: "INGENIERÍA", sede: "ZARZAL" },
  { codigo: "2728", nombre: "TECNOLOGÍA EN PRODUCCIÓN AGROAMBIENTAL", facultad: "INGENIERÍA", sede: "ZARZAL" },
  { codigo: "3744", nombre: "INGENIERÍA ELECTRÓNICA", facultad: "INGENIERÍA", sede: "ZARZAL" },
  { codigo: "3745", nombre: "INGENIERÍA AGRÍCOLA", facultad: "INGENIERÍA", sede: "ZARZAL" },
  { codigo: "3751", nombre: "INGENIERÍA INDUSTRIAL", facultad: "INGENIERÍA", sede: "ZARZAL" },

  // ZARZAL - CIENCIAS DE LA ADMINISTRACIÓN
  { codigo: "2835", nombre: "TECNOLOGÍA EN DIRECCIÓN DE EMPRESAS TURÍSTICAS Y HOTELERAS", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "ZARZAL" },
  { codigo: "2840", nombre: "TECNOLOGÍA EN GESTIÓN DE ORGANIZACIONES TURÍSTICAS", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "ZARZAL" },
  { codigo: "3841", nombre: "CONTADURÍA PÚBLICA", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "ZARZAL" },
  { codigo: "3845", nombre: "ADMINISTRACIÓN DE EMPRESAS", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "ZARZAL" },
  { codigo: "3857", nombre: "COMERCIO EXTERIOR", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "ZARZAL" },
  { codigo: "5882", nombre: "ESPECIALIZACIÓN EN FINANZAS", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "ZARZAL" },
  { codigo: "5892", nombre: "ESPECIALIZACIÓN EN GERENCIA PÚBLICA", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "ZARZAL" },

  // YUMBO - CIENCIAS NATURALES Y EXACTAS
  { codigo: "2131", nombre: "TECNOLOGÍA QUÍMICA", facultad: "CIENCIAS NATURALES Y EXACTAS", sede: "YUMBO" },
  { codigo: "2133", nombre: "TECNOLOGÍA EN AGROFORESTERÍA", facultad: "CIENCIAS NATURALES Y EXACTAS", sede: "YUMBO" },
  { codigo: "2134", nombre: "TECNOLOGÍA EN ANÁLISIS Y LABORATORIO QUÍMICO", facultad: "CIENCIAS NATURALES Y EXACTAS", sede: "YUMBO" },

  // YUMBO - INGENIERÍA
  { codigo: "2710", nombre: "TECNOLOGÍA ELECTRÓNICA", facultad: "INGENIERÍA", sede: "YUMBO" },
  { codigo: "2711", nombre: "TECNOLOGÍA EN SISTEMAS DE INFORMACIÓN", facultad: "INGENIERÍA", sede: "YUMBO" },
  { codigo: "2722", nombre: "TECNOLOGÍA EN MANTENIMIENTO DE SISTEMAS ELECTROMECÁNICOS", facultad: "INGENIERÍA", sede: "YUMBO" },
  { codigo: "2724", nombre: "TECNOLOGÍA EN DESARROLLO DE SOFTWARE", facultad: "INGENIERÍA", sede: "YUMBO" },
  { codigo: "2725", nombre: "TECNOLOGÍA EN ELECTRÓNICA INDUSTRIAL", facultad: "INGENIERÍA", sede: "YUMBO" },

  // YUMBO - CIENCIAS DE LA ADMINISTRACIÓN
  { codigo: "2839", nombre: "TECNOLOGÍA EN GESTIÓN LOGÍSTICA", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "YUMBO" },
  { codigo: "3845", nombre: "ADMINISTRACIÓN DE EMPRESAS", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "YUMBO" },
  { codigo: "3857", nombre: "COMERCIO EXTERIOR", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "YUMBO" },
  { codigo: "5893", nombre: "ESPECIALIZACIÓN EN ALTA GERENCIA", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "YUMBO" },

  // BOGOTÁ - ARTES INTEGRADAS
  { codigo: "7578", nombre: "MAESTRÍA EN CREACIÓN Y DIRECCIÓN ESCÉNICA", facultad: "ARTES INTEGRADAS", sede: "BOGOTÁ" },

  // NORTE DEL CAUCA - CIENCIAS NATURALES Y EXACTAS
  { codigo: "3150", nombre: "AGROINDUSTRIA", facultad: "CIENCIAS NATURALES Y EXACTAS", sede: "NORTE DEL CAUCA" },

  // NORTE DEL CAUCA - HUMANIDADES
  { codigo: "3249", nombre: "TRABAJO SOCIAL", facultad: "HUMANIDADES", sede: "NORTE DEL CAUCA" },

  // NORTE DEL CAUCA - EDUCACIÓN Y PEDAGOGÍA
  { codigo: "3469", nombre: "LICENCIATURA EN EDUCACIÓN BÁSICA CON ÉNFASIS EN MATEMÁTICAS", facultad: "EDUCACIÓN Y PEDAGOGÍA", sede: "NORTE DEL CAUCA" },
  { codigo: "3492", nombre: "LICENCIATURA EN MATEMÁTICAS", facultad: "EDUCACIÓN Y PEDAGOGÍA", sede: "NORTE DEL CAUCA" },
  { codigo: "7405", nombre: "MAESTRÍA EN EDUCACIÓN - ÉNFASIS EN EDUCACIÓN POPULAR Y DESARROLLO COMUNITARIO", facultad: "EDUCACIÓN Y PEDAGOGÍA", sede: "NORTE DEL CAUCA" },
  { codigo: "7412", nombre: "MAESTRÍA EN EDUCACIÓN - ÉNFASIS EN EDUCACIÓN MATEMÁTICA", facultad: "EDUCACIÓN Y PEDAGOGÍA", sede: "NORTE DEL CAUCA" },
  { codigo: "7414", nombre: "MAESTRÍA EN EDUCACIÓN - ÉNFASIS EN ENSEÑANZA DE LAS CIENCIAS NATURALES", facultad: "EDUCACIÓN Y PEDAGOGÍA", sede: "NORTE DEL CAUCA" },

  // NORTE DEL CAUCA - INGENIERÍA
  { codigo: "2711", nombre: "TECNOLOGÍA EN SISTEMAS DE INFORMACIÓN", facultad: "INGENIERÍA", sede: "NORTE DEL CAUCA" },
  { codigo: "2724", nombre: "TECNOLOGÍA EN DESARROLLO DE SOFTWARE", facultad: "INGENIERÍA", sede: "NORTE DEL CAUCA" },

  // NORTE DEL CAUCA - CIENCIAS DE LA ADMINISTRACIÓN
  { codigo: "2837", nombre: "TECNOLOGÍA EN GESTIÓN DE LA CALIDAD", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "NORTE DEL CAUCA" },
  { codigo: "2838", nombre: "TECNOLOGÍA EN GESTIÓN DEL TALENTO HUMANO", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "NORTE DEL CAUCA" },
  { codigo: "2839", nombre: "TECNOLOGÍA EN GESTIÓN LOGÍSTICA", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "NORTE DEL CAUCA" },
  { codigo: "3841", nombre: "CONTADURÍA PÚBLICA", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "NORTE DEL CAUCA" },
  { codigo: "3845", nombre: "ADMINISTRACIÓN DE EMPRESAS", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "NORTE DEL CAUCA" },
  { codigo: "7879", nombre: "MAESTRÍA EN POLÍTICAS PÚBLICAS", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "NORTE DEL CAUCA" },

  // NORTE DEL CAUCA - DERECHO Y CIENCIA POLÍTICA
  { codigo: "3489", nombre: "ESTUDIOS POLÍTICOS Y RESOLUCIÓN DE CONFLICTOS", facultad: "DERECHO Y CIENCIA POLÍTICA", sede: "NORTE DEL CAUCA" },

  // UNIVERSIDAD DE NARIÑO - CIENCIAS DE LA ADMINISTRACIÓN
  { codigo: "7879", nombre: "MAESTRÍA EN POLÍTICAS PÚBLICAS", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "UNIVERSIDAD DE NARIÑO" },
  { codigo: "7880", nombre: "MAESTRÍA EN ADMINISTRACIÓN", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "UNIVERSIDAD DE NARIÑO" },

  // VIRTUAL - INGENIERÍA
  { codigo: "7728", nombre: "MAESTRÍA EN GESTIÓN DE ACTIVOS Y MANTENIMIENTO", facultad: "INGENIERÍA", sede: "VIRTUAL" },
  { codigo: "7729", nombre: "MAESTRÍA EN COMPUTACIÓN PARA EL DESARROLLO DE APLICACIONES INTELIGENTES", facultad: "INGENIERÍA", sede: "VIRTUAL" },

  // VIRTUAL - CIENCIAS DE LA ADMINISTRACIÓN
  { codigo: "5890", nombre: "ESPECIALIZACIÓN EN CALIDAD DE LA GESTIÓN Y PRODUCTIVIDAD", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "VIRTUAL" },
  { codigo: "5892", nombre: "ESPECIALIZACIÓN EN GERENCIA PÚBLICA", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "VIRTUAL" },

  // CAICEDONIA NODO SEVILLA - INGENIERÍA
  { codigo: "2716", nombre: "TECNOLOGÍA AGROAMBIENTAL", facultad: "INGENIERÍA", sede: "CAICEDONIA NODO SEVILLA" },
  { codigo: "2724", nombre: "TECNOLOGÍA EN DESARROLLO DE SOFTWARE", facultad: "INGENIERÍA", sede: "CAICEDONIA NODO SEVILLA" },

  // CAICEDONIA NODO SEVILLA - CIENCIAS DE LA ADMINISTRACIÓN
  { codigo: "2840", nombre: "TECNOLOGÍA EN GESTIÓN DE ORGANIZACIONES TURÍSTICAS", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "CAICEDONIA NODO SEVILLA" },
  { codigo: "3841", nombre: "CONTADURÍA PÚBLICA", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "CAICEDONIA NODO SEVILLA" },
  { codigo: "3845", nombre: "ADMINISTRACIÓN DE EMPRESAS", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "CAICEDONIA NODO SEVILLA" },

  // NORTE DEL CAUCA NODO MIRANDA - CIENCIAS DE LA ADMINISTRACIÓN
  { codigo: "2838", nombre: "TECNOLOGÍA EN GESTIÓN DEL TALENTO HUMANO", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "NORTE DEL CAUCA NODO MIRANDA" },
  { codigo: "2839", nombre: "TECNOLOGÍA EN GESTIÓN LOGÍSTICA", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "NORTE DEL CAUCA NODO MIRANDA" },
  { codigo: "3845", nombre: "ADMINISTRACIÓN DE EMPRESAS", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "NORTE DEL CAUCA NODO MIRANDA" },

  // NORTE DEL CAUCA NODO JAMUNDI - CIENCIAS DE LA ADMINISTRACIÓN
  { codigo: "3845", nombre: "ADMINISTRACIÓN DE EMPRESAS", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "NORTE DEL CAUCA NODO JAMUNDI" },

  // PALMIRA NODO FLORIDA - EDUCACIÓN Y PEDAGOGÍA
  { codigo: "3490", nombre: "LICENCIATURA EN EDUCACIÓN FÍSICA Y DEPORTE", facultad: "EDUCACIÓN Y PEDAGOGÍA", sede: "PALMIRA NODO FLORIDA" },

  // PALMIRA NODO FLORIDA - CIENCIAS DE LA ADMINISTRACIÓN
  { codigo: "3841", nombre: "CONTADURÍA PÚBLICA", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "PALMIRA NODO FLORIDA" },
  { codigo: "3845", nombre: "ADMINISTRACIÓN DE EMPRESAS", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "PALMIRA NODO FLORIDA" },

  // PALMIRA NODO CANDELARIA - CIENCIAS NATURALES Y EXACTAS
  { codigo: "2135", nombre: "TECNOLOGÍA EN MANEJO DE LA PRODUCCIÓN AGROFORESTAL", facultad: "CIENCIAS NATURALES Y EXACTAS", sede: "PALMIRA NODO CANDELARIA" },

  // PALMIRA NODO CANDELARIA - CIENCIAS DE LA ADMINISTRACIÓN
  { codigo: "2839", nombre: "TECNOLOGÍA EN GESTIÓN LOGÍSTICA", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "PALMIRA NODO CANDELARIA" },

  // NORTE DEL CAUCA NODO SUÁREZ - CIENCIAS NATURALES Y EXACTAS
  { codigo: "2135", nombre: "TECNOLOGÍA EN MANEJO DE LA PRODUCCIÓN AGROFORESTAL", facultad: "CIENCIAS NATURALES Y EXACTAS", sede: "NORTE DEL CAUCA NODO SUÁREZ" },
  { codigo: "3150", nombre: "AGROINDUSTRIA", facultad: "CIENCIAS NATURALES Y EXACTAS", sede: "NORTE DEL CAUCA NODO SUÁREZ" },

  // NORTE DEL CAUCA NODO SUÁREZ - EDUCACIÓN Y PEDAGOGÍA
  { codigo: "3490", nombre: "LICENCIATURA EN EDUCACIÓN FÍSICA Y DEPORTE", facultad: "EDUCACIÓN Y PEDAGOGÍA", sede: "NORTE DEL CAUCA NODO SUÁREZ" },

  // NORTE DEL CAUCA NODO SUÁREZ - CIENCIAS DE LA ADMINISTRACIÓN
  { codigo: "2840", nombre: "TECNOLOGÍA EN GESTIÓN DE ORGANIZACIONES TURÍSTICAS", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "NORTE DEL CAUCA NODO SUÁREZ" },
  { codigo: "3845", nombre: "ADMINISTRACIÓN DE EMPRESAS", facultad: "CIENCIAS DE LA ADMINISTRACIÓN", sede: "NORTE DEL CAUCA NODO SUÁREZ" },
]


// Funciones auxiliares para trabajar con los programas académicos

/**
 * Obtiene todos los programas de una sede específica
 */
export function getProgramasPorSede(sede: string): ProgramaAcademico[] {
  return PROGRAMAS_ACADEMICOS.filter(p => p.sede === sede)
}

/**
 * Obtiene todos los programas de una facultad específica
 */
export function getProgramasPorFacultad(facultad: string): ProgramaAcademico[] {
  return PROGRAMAS_ACADEMICOS.filter(p => p.facultad === facultad)
}

/**
 * Obtiene todos los programas de una sede y facultad específicas
 */
export function getProgramasPorSedeYFacultad(sede: string, facultad: string): ProgramaAcademico[] {
  return PROGRAMAS_ACADEMICOS.filter(p => p.sede === sede && p.facultad === facultad)
}

/**
 * Obtiene un programa por su código
 */
export function getProgramaPorCodigo(codigo: string): ProgramaAcademico | undefined {
  return PROGRAMAS_ACADEMICOS.find(p => p.codigo === codigo)
}

/**
 * Obtiene todas las sedes únicas
 */
export function getSedesUnicas(): string[] {
  return Array.from(new Set(PROGRAMAS_ACADEMICOS.map(p => p.sede))).sort()
}

/**
 * Obtiene todas las facultades únicas
 */
export function getFacultadesUnicas(): string[] {
  return Array.from(new Set(PROGRAMAS_ACADEMICOS.map(p => p.facultad))).sort()
}

/**
 * Obtiene las facultades disponibles en una sede específica
 */
export function getFacultadesPorSede(sede: string): string[] {
  const programas = getProgramasPorSede(sede)
  return Array.from(new Set(programas.map(p => p.facultad))).sort()
}

/**
 * Formatea un programa para mostrar en un select (código + nombre)
 */
export function formatProgramaParaSelect(programa: ProgramaAcademico): string {
  return `${programa.nombre} (${programa.codigo})`
}

/**
 * Obtiene los programas formateados para un select, filtrados por sede y opcionalmente por facultad
 */
export function getProgramasParaSelect(sede?: string, facultad?: string): Array<{ value: string; label: string }> {
  let programas = PROGRAMAS_ACADEMICOS

  if (sede) {
    programas = programas.filter(p => p.sede === sede)
  }

  if (facultad) {
    programas = programas.filter(p => p.facultad === facultad)
  }

  return programas
    .map(p => ({
      value: p.codigo,
      label: formatProgramaParaSelect(p)
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

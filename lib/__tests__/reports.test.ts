/**
 * Tests for Combined Reports System
 * 
 * Feature: sistema-multi-area
 * Task: 19.1 - Crear función para generar reporte combinado
 * Requirements: 9.3
 */

import { generateCombinedReport } from '../reports'
import type { AttendanceRecord } from '../types'

// Mock the db-router module
jest.mock('../db-router', () => ({
  getAttendanceRecords: jest.fn(),
  getAllUsers: jest.fn(),
}))

import { getAttendanceRecords } from '../db-router'

const mockGetAttendanceRecords = getAttendanceRecords as jest.MockedFunction<typeof getAttendanceRecords>

describe('generateCombinedReport', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should query statistics from both BD_Cultura and BD_Deporte', async () => {
    // Arrange
    const culturaRecords: AttendanceRecord[] = [
      {
        id: '1',
        timestamp: new Date('2024-01-15'),
        nombres: 'Juan Pérez',
        correo: 'juan@example.com',
        genero: 'HOMBRE',
        etnia: 'MESTIZO',
        tipoDocumento: 'CEDULA',
        numeroDocumento: '123456',
        edad: 20,
        telefono: '555-0001',
        sede: 'Meléndez',
        estamento: 'ESTUDIANTE',
        grupoCultural: 'Danza',
        facultad: 'Ingeniería',
        programaAcademico: 'Sistemas',
      },
    ]

    const deporteRecords: AttendanceRecord[] = [
      {
        id: '2',
        timestamp: new Date('2024-01-16'),
        nombres: 'María García',
        correo: 'maria@example.com',
        genero: 'MUJER',
        etnia: 'MESTIZO',
        tipoDocumento: 'CEDULA',
        numeroDocumento: '789012',
        edad: 22,
        telefono: '555-0002',
        sede: 'Meléndez',
        estamento: 'ESTUDIANTE',
        grupoCultural: 'Fútbol',
        facultad: 'Salud',
        programaAcademico: 'Medicina',
      },
    ]

    mockGetAttendanceRecords.mockImplementation(async (area) => {
      if (area === 'cultura') return culturaRecords
      if (area === 'deporte') return deporteRecords
      return []
    })

    // Act
    const result = await generateCombinedReport()

    // Assert
    expect(mockGetAttendanceRecords).toHaveBeenCalledWith('cultura')
    expect(mockGetAttendanceRecords).toHaveBeenCalledWith('deporte')
    expect(mockGetAttendanceRecords).toHaveBeenCalledTimes(2)
  })

  it('should aggregate data from both areas correctly', async () => {
    // Arrange
    const culturaRecords: AttendanceRecord[] = [
      {
        id: '1',
        timestamp: new Date('2024-01-15'),
        nombres: 'Juan Pérez',
        correo: 'juan@example.com',
        genero: 'HOMBRE',
        etnia: 'MESTIZO',
        tipoDocumento: 'CEDULA',
        numeroDocumento: '123456',
        edad: 20,
        telefono: '555-0001',
        sede: 'Meléndez',
        estamento: 'ESTUDIANTE',
        grupoCultural: 'Danza',
        facultad: 'Ingeniería',
        programaAcademico: 'Sistemas',
      },
      {
        id: '2',
        timestamp: new Date('2024-01-16'),
        nombres: 'Ana López',
        correo: 'ana@example.com',
        genero: 'MUJER',
        etnia: 'MESTIZO',
        tipoDocumento: 'CEDULA',
        numeroDocumento: '234567',
        edad: 21,
        telefono: '555-0003',
        sede: 'Meléndez',
        estamento: 'ESTUDIANTE',
        grupoCultural: 'Teatro',
        facultad: 'Artes',
        programaAcademico: 'Artes Visuales',
      },
    ]

    const deporteRecords: AttendanceRecord[] = [
      {
        id: '3',
        timestamp: new Date('2024-01-17'),
        nombres: 'María García',
        correo: 'maria@example.com',
        genero: 'MUJER',
        etnia: 'MESTIZO',
        tipoDocumento: 'CEDULA',
        numeroDocumento: '789012',
        edad: 22,
        telefono: '555-0002',
        sede: 'Meléndez',
        estamento: 'ESTUDIANTE',
        grupoCultural: 'Fútbol',
        facultad: 'Salud',
        programaAcademico: 'Medicina',
      },
    ]

    mockGetAttendanceRecords.mockImplementation(async (area) => {
      if (area === 'cultura') return culturaRecords
      if (area === 'deporte') return deporteRecords
      return []
    })

    // Act
    const result = await generateCombinedReport()

    // Assert
    expect(result.combined.totalParticipants).toBe(3)
    expect(result.combined.totalCultura).toBe(2)
    expect(result.combined.totalDeporte).toBe(1)
    expect(result.combined.byGender.mujer).toBe(2)
    expect(result.combined.byGender.hombre).toBe(1)
    expect(result.combined.byGender.otro).toBe(0)
  })

  it('should handle empty records from one area', async () => {
    // Arrange
    const culturaRecords: AttendanceRecord[] = [
      {
        id: '1',
        timestamp: new Date('2024-01-15'),
        nombres: 'Juan Pérez',
        correo: 'juan@example.com',
        genero: 'HOMBRE',
        etnia: 'MESTIZO',
        tipoDocumento: 'CEDULA',
        numeroDocumento: '123456',
        edad: 20,
        telefono: '555-0001',
        sede: 'Meléndez',
        estamento: 'ESTUDIANTE',
        grupoCultural: 'Danza',
        facultad: 'Ingeniería',
        programaAcademico: 'Sistemas',
      },
    ]

    const deporteRecords: AttendanceRecord[] = []

    mockGetAttendanceRecords.mockImplementation(async (area) => {
      if (area === 'cultura') return culturaRecords
      if (area === 'deporte') return deporteRecords
      return []
    })

    // Act
    const result = await generateCombinedReport()

    // Assert
    expect(result.combined.totalParticipants).toBe(1)
    expect(result.combined.totalCultura).toBe(1)
    expect(result.combined.totalDeporte).toBe(0)
  })

  it('should generate separate stats for each area', async () => {
    // Arrange
    const culturaRecords: AttendanceRecord[] = [
      {
        id: '1',
        timestamp: new Date('2024-01-15'),
        nombres: 'Juan Pérez',
        correo: 'juan@example.com',
        genero: 'HOMBRE',
        etnia: 'MESTIZO',
        tipoDocumento: 'CEDULA',
        numeroDocumento: '123456',
        edad: 20,
        telefono: '555-0001',
        sede: 'Meléndez',
        estamento: 'ESTUDIANTE',
        grupoCultural: 'Danza',
        facultad: 'Ingeniería',
        programaAcademico: 'Sistemas',
      },
    ]

    const deporteRecords: AttendanceRecord[] = [
      {
        id: '2',
        timestamp: new Date('2024-01-16'),
        nombres: 'María García',
        correo: 'maria@example.com',
        genero: 'MUJER',
        etnia: 'MESTIZO',
        tipoDocumento: 'CEDULA',
        numeroDocumento: '789012',
        edad: 22,
        telefono: '555-0002',
        sede: 'Meléndez',
        estamento: 'ESTUDIANTE',
        grupoCultural: 'Fútbol',
        facultad: 'Salud',
        programaAcademico: 'Medicina',
      },
    ]

    mockGetAttendanceRecords.mockImplementation(async (area) => {
      if (area === 'cultura') return culturaRecords
      if (area === 'deporte') return deporteRecords
      return []
    })

    // Act
    const result = await generateCombinedReport()

    // Assert
    expect(result.cultura).toBeDefined()
    expect(result.deporte).toBeDefined()
    expect(result.cultura.totalParticipants).toBe(1)
    expect(result.deporte.totalParticipants).toBe(1)
    expect(result.cultura.byGender.hombre).toBe(1)
    expect(result.deporte.byGender.mujer).toBe(1)
  })
})

describe('generateCombinedReportPDF', () => {
  // Mock jsPDF and jspdf-autotable
  const mockSave = jest.fn()
  const mockText = jest.fn()
  const mockSetFontSize = jest.fn()
  const mockSetFont = jest.fn()
  const mockAddPage = jest.fn()
  
  const mockDoc = {
    save: mockSave,
    text: mockText,
    setFontSize: mockSetFontSize,
    setFont: mockSetFont,
    addPage: mockAddPage,
    internal: {
      pageSize: {
        getWidth: () => 210,
        getHeight: () => 297,
      },
    },
    lastAutoTable: {
      finalY: 100,
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock dynamic imports
    jest.mock('jspdf', () => ({
      default: jest.fn(() => mockDoc),
    }))
    
    jest.mock('jspdf-autotable', () => ({
      default: jest.fn(),
    }))
  })

  it('should include metrics separated by area', async () => {
    // Arrange
    const { generateCombinedReportPDF } = await import('../reports')
    
    const mockStats = {
      cultura: {
        totalParticipants: 100,
        byGender: { mujer: 60, hombre: 38, otro: 2 },
        byProgram: {},
        byFaculty: {},
        byCulturalGroup: { 'Danza': 50, 'Teatro': 50 },
        byMonth: {},
      },
      deporte: {
        totalParticipants: 80,
        byGender: { mujer: 40, hombre: 38, otro: 2 },
        byProgram: {},
        byFaculty: {},
        byCulturalGroup: { 'Fútbol': 40, 'Baloncesto': 40 },
        byMonth: {},
      },
      combined: {
        totalParticipants: 180,
        totalCultura: 100,
        totalDeporte: 80,
        byGender: { mujer: 100, hombre: 76, otro: 4 },
      },
    }

    // Act & Assert - should not throw
    await expect(generateCombinedReportPDF(mockStats)).resolves.not.toThrow()
  })

  it('should include combined totals', async () => {
    // Arrange
    const { generateCombinedReportPDF } = await import('../reports')
    
    const mockStats = {
      cultura: {
        totalParticipants: 50,
        byGender: { mujer: 30, hombre: 20, otro: 0 },
        byProgram: {},
        byFaculty: {},
        byCulturalGroup: {},
        byMonth: {},
      },
      deporte: {
        totalParticipants: 50,
        byGender: { mujer: 25, hombre: 25, otro: 0 },
        byProgram: {},
        byFaculty: {},
        byCulturalGroup: {},
        byMonth: {},
      },
      combined: {
        totalParticipants: 100,
        totalCultura: 50,
        totalDeporte: 50,
        byGender: { mujer: 55, hombre: 45, otro: 0 },
      },
    }

    // Act & Assert - should not throw
    await expect(generateCombinedReportPDF(mockStats)).resolves.not.toThrow()
  })

  it('should handle empty data gracefully', async () => {
    // Arrange
    const { generateCombinedReportPDF } = await import('../reports')
    
    const mockStats = {
      cultura: {
        totalParticipants: 0,
        byGender: { mujer: 0, hombre: 0, otro: 0 },
        byProgram: {},
        byFaculty: {},
        byCulturalGroup: {},
        byMonth: {},
      },
      deporte: {
        totalParticipants: 0,
        byGender: { mujer: 0, hombre: 0, otro: 0 },
        byProgram: {},
        byFaculty: {},
        byCulturalGroup: {},
        byMonth: {},
      },
      combined: {
        totalParticipants: 0,
        totalCultura: 0,
        totalDeporte: 0,
        byGender: { mujer: 0, hombre: 0, otro: 0 },
      },
    }

    // Act & Assert - should not throw
    await expect(generateCombinedReportPDF(mockStats)).resolves.not.toThrow()
  })
})

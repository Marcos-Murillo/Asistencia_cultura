import * as XLSX from "xlsx"
import { TIPO_BITACORA_LABEL } from "@/lib/fisioterapia"
import type { FisioterapiaBitacora, FisioterapiaSeguimiento } from "@/lib/types"

export function exportBitacoraExcel(records: FisioterapiaBitacora[], filename: string) {
  const rows = records.map((item) => ({
    ID: item.id,
    Fecha: item.fecha.toLocaleDateString("es-CO"),
    Hora: item.hora,
    Fisioterapeuta: item.fisioterapeutaNombre,
    "Tipo de registro": TIPO_BITACORA_LABEL[item.tipo],
    Grupo: item.grupoNombre || "",
    Entrenador: item.entrenadorNombre || "",
    Deportista: item.deportistaNombre || "",
    Actividad: item.tipoActividad || "",
    Descripción: item.descripcion || item.descripcionIncidente || "",
    "Atención/lesión": item.tipoLesion || item.motivoAtencion || "",
    Estado: item.estado || "",
    Seguimiento: item.requiereSeguimiento ? item.fechaSeguimiento?.toLocaleDateString("es-CO") || "Sí" : "",
    Observaciones: item.observaciones || "",
  }))
  const sheet = XLSX.utils.json_to_sheet(rows)
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, sheet, "Bitacora")
  XLSX.writeFile(book, filename)
}

export function exportFisioAdminReport(
  records: FisioterapiaBitacora[],
  seguimientos: FisioterapiaSeguimiento[],
  filename: string,
) {
  const bitacoraRows = records.map((item) => ({
    Fecha: item.fecha.toLocaleDateString("es-CO"),
    Hora: item.hora,
    Grupo: item.grupoNombre || "",
    Fisioterapeuta: item.fisioterapeutaNombre,
    Tipo: TIPO_BITACORA_LABEL[item.tipo],
    Deportista: item.deportistaNombre || "",
    Entrenador: item.entrenadorNombre || "",
    Descripción: item.descripcion || item.descripcionIncidente || "",
    Lesión: item.tipoLesion || item.motivoAtencion || "",
    Intervención: item.intervencion || "",
    Orden: item.orden?.descripcion || "",
    "Destino orden": item.orden?.destino || "",
    Seguimiento: item.requiereSeguimiento ? "Sí" : "No",
    Observaciones: item.observaciones || "",
  }))
  const seguimientosRows = seguimientos.map((item) => ({
    Deportista: item.deportistaNombre,
    Atención: item.lesionAtencion,
    Programada: item.fechaProgramada.toLocaleDateString("es-CO"),
    Estado: item.estado,
    Fisioterapeuta: item.fisioterapeutaNombre,
  }))
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(bitacoraRows), "Registros")
  XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(seguimientosRows), "Seguimientos")
  XLSX.writeFile(book, filename)
}

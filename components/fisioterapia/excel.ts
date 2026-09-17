import * as XLSX from "xlsx"
import { TIPO_BITACORA_LABEL } from "@/lib/fisioterapia"
import type { FisioterapiaBitacora } from "@/lib/types"

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

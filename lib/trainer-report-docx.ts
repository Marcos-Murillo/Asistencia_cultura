import {
  AlignmentType,
  Document,
  Footer,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx"
import { ACTIVIDADES_INFORME } from "./trainer-report-template"

export interface InformeEvidenciaDoc {
  punto: 1 | 2 | 3
  fecha: string
  titulo: string
  pieDeFoto: string
  image: string
}

export interface InformeDocInput {
  numero: string
  fechaElaboracion: string
  mesCorrespondiente: string
  nit: string
  nombres: string
  ordenContractual: string
  valorTotal: string
  objeto: string
  supervisor: string
  dependencia: string
  valorCuota: string
  deporte: string
  punto1: string
  punto2: string
  punto3: string
  evidencias: InformeEvidenciaDoc[]
}

const FONT = "Calibri"

function run(text: string, options?: { bold?: boolean; italics?: boolean; size?: number; color?: string }) {
  return new TextRun({
    text,
    font: FONT,
    bold: options?.bold,
    italics: options?.italics,
    size: options?.size ?? 22,
    color: options?.color,
  })
}

function paragraph(children: TextRun[], options?: { after?: number; center?: boolean }) {
  return new Paragraph({
    spacing: { after: options?.after ?? 120 },
    alignment: options?.center ? AlignmentType.CENTER : AlignmentType.LEFT,
    children,
  })
}

function field(label: string, value: string) {
  return paragraph([run(`${label}: `, { bold: true }), run(value.trim() || "—")])
}

function bodyParagraphs(text: string) {
  const blocks = text.split(/\n+/).map((line) => line.trim()).filter(Boolean)
  if (blocks.length === 0) return [paragraph([run("—")])]
  return blocks.map((block) => paragraph([run(block)], { after: 160 }))
}

function dataUrlBytes(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] || ""
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index)
  return bytes
}

function imageType(dataUrl: string): "jpg" | "png" | "gif" {
  if (dataUrl.startsWith("data:image/png")) return "png"
  if (dataUrl.startsWith("data:image/gif")) return "gif"
  return "jpg"
}

function measureImage(dataUrl: string) {
  return new Promise<{ width: number; height: number }>((resolve) => {
    const image = new Image()
    image.onload = () => resolve({ width: image.width || 4, height: image.height || 3 })
    image.onerror = () => resolve({ width: 4, height: 3 })
    image.src = dataUrl
  })
}

function fit(width: number, height: number, maxWidth: number, maxHeight: number) {
  const scale = Math.min(maxWidth / width, maxHeight / height, 1)
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

async function photoCell(item: InformeEvidenciaDoc, nombreCampo: string) {
  const measured = await measureImage(item.image)
  const size = fit(measured.width, measured.height, 250, 180)
  return new TableCell({
    width: { size: 50, type: WidthType.PERCENTAGE },
    margins: { top: 80, bottom: 80, left: 80, right: 80 },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            type: imageType(item.image),
            data: dataUrlBytes(item.image),
            transformation: size,
            altText: { title: item.pieDeFoto || item.titulo, description: item.pieDeFoto || item.titulo, name: item.titulo || "evidencia" },
          }),
        ],
      }),
      paragraph([run(item.pieDeFoto || "Foto de la actividad", { italics: true, size: 18 })], { center: true, after: 40 }),
      paragraph([run(`Fecha: ${item.fecha || "—"}`, { size: 18 })], { center: true, after: 20 }),
      paragraph([run(`${nombreCampo}: ${item.titulo || "—"}`, { size: 18 })], { center: true, after: 40 }),
    ],
  })
}

async function photoTable(items: InformeEvidenciaDoc[], nombreCampo: string) {
  const rows: TableRow[] = []
  for (let index = 0; index < items.length; index += 2) {
    const left = await photoCell(items[index], nombreCampo)
    const right = items[index + 1]
      ? await photoCell(items[index + 1], nombreCampo)
      : new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          children: [paragraph([run("")])],
        })
    rows.push(new TableRow({ children: [left, right] }))
  }
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows,
  })
}

export async function buildTrainerReportDocx(input: InformeDocInput): Promise<Blob> {
  const logoResponse = await fetch("/informe-logo-univalle.jpeg")
  const logo = logoResponse.ok ? new Uint8Array(await logoResponse.arrayBuffer()) : null
  const puntos = [input.punto1, input.punto2, input.punto3]
  const children: (Paragraph | Table)[] = []

  if (logo) {
    children.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new ImageRun({
            type: "jpg",
            data: logo,
            transformation: { width: 46, height: 66 },
            altText: { title: "Universidad del Valle", description: "Logo institucional", name: "logo" },
          }),
        ],
      })
    )
  }
  children.push(
    paragraph([run("VICERRECTORÍA DE BIENESTAR UNIVERSITARIO", { bold: true, color: "C00000", size: 20 })], { center: true, after: 40 }),
    paragraph([run("UNIVERSIDAD DEL VALLE", { bold: true, color: "C00000", size: 20 })], { center: true, after: 200 }),
    paragraph([run(`INFORME DE ACTIVIDADES No. ${input.numero.trim() || ""}`.trim(), { bold: true, size: 28 })], { center: true, after: 200 }),
    field("Fecha de elaboración", input.fechaElaboracion),
    field("Mes correspondiente", input.mesCorrespondiente),
    field("NIT", input.nit),
    field("Nombres y apellidos", input.nombres),
    field("No. Orden Contractual", input.ordenContractual),
    field("Valor total del contrato", input.valorTotal),
    field("Objeto del Contrato", input.objeto),
    field("Supervisor/a", input.supervisor),
    field("Dependencia", input.dependencia),
    field("Valor Pago cuota", input.valorCuota),
    field("Deporte", input.deporte),
    paragraph([run("PRODUCTOS Y/O INFORMES", { bold: true, size: 26 })], { center: true, after: 200 })
  )

  for (const actividad of ACTIVIDADES_INFORME) {
    const evidencias = input.evidencias.filter((item) => item.punto === actividad.punto)
    children.push(
      paragraph([run(actividad.titulo, { bold: true, size: 24 })], { after: 80 }),
      paragraph([run(actividad.descripcion)], { after: 160 }),
      paragraph([run(`Punto ${actividad.punto}`, { bold: true })], { after: 80 }),
      ...bodyParagraphs(puntos[actividad.punto - 1] || ""),
      paragraph([run("Evidencia:", { bold: true })], { after: 80 }),
      ...actividad.evidencias.map((line) => paragraph([run(line, { size: 20 })], { after: 60 })),
      paragraph([run("Registro fotográfico:", { bold: true, size: 20 })], { after: 80 })
    )
    if (evidencias.length > 0) {
      children.push(await photoTable(evidencias, actividad.nombreCampo))
    } else {
      children.push(paragraph([run("Sin registro fotográfico en este punto.")], { after: 160 }))
    }
  }

  children.push(
    paragraph([run("")], { after: 300 }),
    paragraph([run("________________________________")], { center: true, after: 40 }),
    paragraph([run(input.nombres.trim() || "Nombre del responsable", { bold: true })], { center: true, after: 20 }),
    paragraph([run("Nombre del Responsable")], { center: true, after: 20 }),
    paragraph([run("Firma")], { center: true, after: 40 })
  )

  const document = new Document({
    sections: [
      {
        properties: { page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
        footers: {
          default: new Footer({
            children: [
              paragraph(
                [run("Vicerrectoría de Bienestar Universitario — Universidad del Valle", { size: 16, color: "666666" })],
                { center: true, after: 0 }
              ),
            ],
          }),
        },
        children,
      },
    ],
  })

  return Packer.toBlob(document)
}

"use client"

import { useEffect, useState } from "react"
import JSZip from "jszip"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Check, Download, Eye, FileText, ImagePlus, Loader2, Plus, Trash2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { attendancePdfFileName, buildGroupAttendancePdf } from "@/lib/attendance-pdf"
import { getAttendanceRecords } from "@/lib/db-router"
import type { Area } from "@/lib/firebase-config"
import { ACTIVIDADES_INFORME, DEPENDENCIA_INFORME } from "@/lib/trainer-report-template"
import { buildTrainerReportDocx } from "@/lib/trainer-report-docx"
import {
  fileToStoredText,
  listReportEvidence,
  listReportFiles,
  listTrainerReportsForGroup,
  loadLatestContract,
  loadTrainerReport,
  markReportFile,
  replaceReportEvidence,
  reportKey,
  saveReportPdf,
  saveTrainerReport,
  type ReportFileSlot,
  type StoredReportEvidence,
  type StoredReportFile,
  type TrainerReportData,
  type TrainerReportSummary,
} from "@/lib/trainer-reports"
import { cn } from "@/lib/utils"

type SectionId = ReportFileSlot | "informe"

const SECTIONS: { id: SectionId; label: string; help: string }[] = [
  { id: "asistencias", label: "Informe de asistencias", help: "PDF de quienes asistieron en este periodo." },
  { id: "planificacion_general", label: "Planificación general", help: "Documento de todo el semestre." },
  { id: "planificacion_semanal", label: "Planificación semanal", help: "Planificación de las semanas de este periodo." },
  { id: "seguridad_social", label: "Seguridad social", help: "PDF del pago o planilla de seguridad social." },
  { id: "informe", label: "Informe de actividades", help: "Documento con los tres puntos y las fotos de evidencia." },
]

const MAIN_DRAWER =
  "!inset-y-3 !right-3 !h-auto !w-[min(94vw,33vw)] !min-w-[300px] !max-w-none overflow-hidden !rounded-3xl border bg-white shadow-2xl"
const NESTED_DRAWER =
  "!inset-y-3 !h-auto !w-[min(94vw,33vw)] !min-w-[300px] !max-w-none overflow-hidden !rounded-3xl border bg-white shadow-2xl !z-[70] max-lg:!right-3 lg:!right-[calc(33vw+1.5rem)]"

function todayKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
}

function prettyDate(iso: string) {
  if (!iso) return ""
  const [year, month, day] = iso.split("-").map(Number)
  return format(new Date(year, month - 1, day), "d MMM yyyy", { locale: es })
}

function monthName(iso: string) {
  if (!iso) return ""
  const [year, month] = iso.split("-").map(Number)
  const label = format(new Date(year, month - 1, 1), "MMMM yyyy", { locale: es })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function rangeTitle(desde: string, hasta: string) {
  const start = monthName(desde)
  const end = monthName(hasta)
  if (!start) return "Informe"
  if (start === end) return start
  return `${start.replace(/ \d{4}$/, "")} – ${end}`
}

function emptyReport(nombre: string, deporte: string, desde: string, hasta: string): TrainerReportData {
  return {
    numero: "",
    fechaElaboracion: todayKey(),
    mesCorrespondiente: rangeTitle(desde, hasta),
    desde,
    hasta,
    nit: "",
    nombres: nombre,
    ordenContractual: "",
    valorTotal: "",
    objeto: "",
    supervisor: "",
    dependencia: DEPENDENCIA_INFORME,
    valorCuota: "",
    deporte,
    punto1: "",
    punto2: "",
    punto3: "",
  }
}

function photoCounts(evidencias: StoredReportEvidence[]): [number, number, number] {
  return [1, 2, 3].map((punto) => evidencias.filter((item) => item.punto === punto && item.image).length) as [
    number,
    number,
    number,
  ]
}

function fileNames(files: Partial<Record<ReportFileSlot, StoredReportFile>>) {
  return Object.fromEntries(
    (Object.values(files).filter(Boolean) as StoredReportFile[]).map((file) => [file.slot, file.fileName])
  ) as Partial<Record<ReportFileSlot, string>>
}

function sectionReady(
  id: SectionId,
  files: Partial<Record<ReportFileSlot, StoredReportFile>>,
  form: TrainerReportData,
  evidencias: StoredReportEvidence[]
) {
  if (id === "informe") {
    const counts = photoCounts(evidencias)
    return [1, 2, 3].every((punto) => form[`punto${punto}` as "punto1" | "punto2" | "punto3"].trim() && counts[punto - 1] > 0)
  }
  return Boolean(files[id])
}

function summaryReady(summary: TrainerReportSummary, id: SectionId) {
  if (id === "informe") {
    return summary.puntos.every(Boolean) && summary.fotosPorPunto.every((count) => count > 0)
  }
  return Boolean(summary.adjuntos[id])
}

function readyCount(summary: TrainerReportSummary) {
  return SECTIONS.filter((section) => summaryReady(summary, section.id)).length
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ""))
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"))
    reader.readAsDataURL(file)
  })
}

export function TrainerInformePanel({
  area,
  groupName,
  managerName,
  userId,
}: {
  area: Area
  groupName: string
  managerName: string
  userId: string
}) {
  const [summaries, setSummaries] = useState<TrainerReportSummary[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [packageOpen, setPackageOpen] = useState(false)
  const [askingDates, setAskingDates] = useState(false)
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const [period, setPeriod] = useState("")
  const [form, setForm] = useState<TrainerReportData>(() => emptyReport(managerName, groupName, "", ""))
  const [evidencias, setEvidencias] = useState<StoredReportEvidence[]>([])
  const [files, setFiles] = useState<Partial<Record<ReportFileSlot, StoredReportFile>>>({})
  const [detailLoading, setDetailLoading] = useState(false)
  const [section, setSection] = useState<{ id: SectionId; mode: "edit" | "preview" } | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const storageKey = userId && period ? reportKey(area, userId, period, groupName) : ""

  async function refreshList() {
    if (!userId) return
    const items = await listTrainerReportsForGroup(area, userId, groupName)
    setSummaries(items)
  }

  useEffect(() => {
    let active = true
    if (!userId) {
      setListLoading(false)
      return
    }
    listTrainerReportsForGroup(area, userId, groupName)
      .then((items) => {
        if (active) setSummaries(items)
      })
      .catch((loadError) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "No se pudieron leer los informes")
      })
      .finally(() => {
        if (active) setListLoading(false)
      })
    return () => {
      active = false
    }
  }, [area, groupName, userId])

  function update<K extends keyof TrainerReportData>(field: K, value: TrainerReportData[K]) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function persist(nextFiles = files, nextEvidence = evidencias, nextForm = form) {
    if (!userId) throw new Error("No se identificó al entrenador")
    await saveTrainerReport(area, userId, groupName, nextForm, {
      adjuntos: fileNames(nextFiles),
      fotosPorPunto: photoCounts(nextEvidence),
    })
    const key = reportKey(area, userId, periodKeyOf(nextForm), groupName)
    await replaceReportEvidence(key, area, userId, groupName, nextEvidence)
    await Promise.all(
      (Object.values(nextFiles).filter(Boolean) as StoredReportFile[]).map((file) =>
        saveReportPdf(key, file.slot, file.fileName, file.dataUrl)
      )
    )
  }

  async function loadDetail(periodKey: string, range: { desde: string; hasta: string }) {
    setDetailLoading(true)
    setError("")
    const key = reportKey(area, userId, periodKey, groupName)
    try {
      const [saved, previous] = await Promise.all([
        loadTrainerReport(area, userId, periodKey, groupName),
        loadLatestContract(area, userId),
      ])
      let evidence: StoredReportEvidence[] = []
      let attached: StoredReportFile[] = []
      try {
        ;[evidence, attached] = await Promise.all([listReportEvidence(key), listReportFiles(key)])
      } catch (imageError) {
        setError(imageError instanceof Error ? imageError.message : "No se pudieron leer los archivos del informe")
      }
      const base = emptyReport(managerName, groupName, range.desde, range.hasta)
      setForm({
        ...base,
        ...(previous
          ? {
              nit: previous.nit,
              ordenContractual: previous.ordenContractual,
              valorTotal: previous.valorTotal,
              objeto: previous.objeto,
              supervisor: previous.supervisor,
              dependencia: previous.dependencia || base.dependencia,
              valorCuota: previous.valorCuota,
            }
          : {}),
        ...(saved || {}),
        desde: saved?.desde || range.desde,
        hasta: saved?.hasta || range.hasta,
        nombres: saved?.nombres || managerName || base.nombres,
        deporte: saved?.deporte || groupName,
        mesCorrespondiente: saved?.mesCorrespondiente || base.mesCorrespondiente,
      })
      setEvidencias(evidence)
      setFiles(Object.fromEntries(attached.map((file) => [file.slot, file])))
    } finally {
      setDetailLoading(false)
    }
  }

  function openSummary(summary: TrainerReportSummary) {
    setAskingDates(false)
    setSection(null)
    setMessage("")
    setError("")
    setDesde(summary.desde)
    setHasta(summary.hasta)
    setPeriod(summary.periodKey)
    setPackageOpen(true)
    loadDetail(summary.periodKey, summary).catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "No se pudo abrir el informe")
    })
  }

  function openCreate() {
    setAskingDates(true)
    setSection(null)
    setMessage("")
    setError("")
    setDesde("")
    setHasta("")
    setPeriod("")
    setForm(emptyReport(managerName, groupName, "", ""))
    setFiles({})
    setEvidencias([])
    setPackageOpen(true)
  }

  async function confirmDates() {
    if (!desde || !hasta) {
      setError("Indica desde qué fecha hasta qué fecha va el informe.")
      return
    }
    if (desde > hasta) {
      setError("La fecha inicial tiene que ser anterior a la fecha final.")
      return
    }
    const existing = summaries.find((item) => item.desde === desde && item.hasta === hasta)
    if (existing) {
      openSummary(existing)
      return
    }
    setSaving(true)
    setError("")
    try {
      const previous = await loadLatestContract(area, userId)
      const next = {
        ...emptyReport(managerName, groupName, desde, hasta),
        ...(previous
          ? {
              nit: previous.nit || "",
              ordenContractual: previous.ordenContractual || "",
              valorTotal: previous.valorTotal || "",
              objeto: previous.objeto || "",
              supervisor: previous.supervisor || "",
              dependencia: previous.dependencia || DEPENDENCIA_INFORME,
              valorCuota: previous.valorCuota || "",
            }
          : {}),
      }
      await saveTrainerReport(area, userId, groupName, next, { adjuntos: {}, fotosPorPunto: [0, 0, 0] })
      setForm(next)
      setPeriod(`${desde}_${hasta}`)
      setAskingDates(false)
      await refreshList()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo crear el informe")
    } finally {
      setSaving(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setError("")
    setMessage("")
    try {
      await persist()
      await refreshList()
      setMessage("Informe guardado.")
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo guardar")
    } finally {
      setSaving(false)
    }
  }

  async function handlePdf(slot: ReportFileSlot, file: File | null) {
    if (!file) return
    setError("")
    try {
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        throw new Error("El archivo debe ser un PDF")
      }
      if (file.size > 500 * 1024) {
        throw new Error("El PDF supera 500 KB. Comprime el archivo y vuelve a subirlo.")
      }
      const dataUrl = await readFileAsDataUrl(file)
      const stored = { slot, fileName: file.name, dataUrl }
      const next = { ...files, [slot]: stored }
      setFiles(next)
      if (userId && storageKey) {
        await saveReportPdf(storageKey, slot, file.name, dataUrl)
        await markReportFile(area, userId, storageKey, slot, file.name)
        await refreshList()
      }
      setMessage(`${file.name} quedó anexo.`)
    } catch (pdfError) {
      setError(pdfError instanceof Error ? pdfError.message : "No se pudo anexar el PDF")
    }
  }

  async function handleAttendancePdf() {
    setError("")
    setMessage("")
    try {
      const records = (await getAttendanceRecords(area)).filter((record) => record.grupoCultural === groupName)
      const pdf = buildGroupAttendancePdf({
        records,
        groupName,
        area,
        managerDisplayName: form.nombres || managerName,
        desde: form.desde,
        hasta: form.hasta,
      })
      const fileName = attendancePdfFileName(groupName, form.desde, form.hasta)
      const dataUrl = await readFileAsDataUrl(new File([pdf.output("blob")], fileName, { type: "application/pdf" }))
      const stored = { slot: "asistencias" as const, fileName, dataUrl }
      setFiles((current) => ({ ...current, asistencias: stored }))
      if (userId && storageKey) {
        await saveReportPdf(storageKey, "asistencias", fileName, dataUrl)
        await markReportFile(area, userId, storageKey, "asistencias", fileName)
        await refreshList()
      }
      setMessage("El PDF de asistencias quedó incluido.")
    } catch (pdfError) {
      setError(pdfError instanceof Error ? pdfError.message : "No se pudo generar el PDF de asistencias")
    }
  }

  async function handleGenerateDocx() {
    setError("")
    try {
      const blob = await buildTrainerReportDocx({ ...form, evidencias })
      downloadBlob(blob, `informe_${groupName.replace(/\s+/g, "_")}_${period}.docx`)
    } catch (docxError) {
      setError(docxError instanceof Error ? docxError.message : "No se pudo generar el informe")
    }
  }

  async function handleDownloadPackage() {
    setSaving(true)
    setError("")
    try {
      await persist()
      await refreshList()
      const zip = new JSZip()
      zip.file(`informe_${period}.docx`, await buildTrainerReportDocx({ ...form, evidencias }))
      for (const file of Object.values(files)) {
        if (!file?.dataUrl) continue
        const binary = atob(file.dataUrl.split(",")[1] || "")
        const bytes = new Uint8Array(binary.length)
        for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index)
        zip.file(file.fileName, bytes)
      }
      downloadBlob(await zip.generateAsync({ type: "blob" }), `informe_${groupName.replace(/\s+/g, "_")}_${period}.zip`)
      setMessage("Paquete descargado.")
    } catch (packageError) {
      setError(packageError instanceof Error ? packageError.message : "No se pudo armar el paquete")
    } finally {
      setSaving(false)
    }
  }

  function downloadStored(file: StoredReportFile) {
    const binary = atob(file.dataUrl.split(",")[1] || "")
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index)
    downloadBlob(new Blob([bytes], { type: "application/pdf" }), file.fileName)
  }

  const activeSection = SECTIONS.find((item) => item.id === section?.id)

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-neutral-500">Entregas de {groupName}</p>
          <h2 className="text-3xl font-semibold tracking-tight text-neutral-950">Informes</h2>
        </div>
        <Button type="button" onClick={openCreate} className="rounded-full px-5">
          <Plus className="mr-2 h-4 w-4" />
          Crear informe
        </Button>
      </div>

      {error && !packageOpen && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {listLoading ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="h-36 animate-pulse rounded-2xl bg-white" />
          <div className="h-36 animate-pulse rounded-2xl bg-white" />
        </div>
      ) : summaries.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-white px-6 py-16 text-center">
          <p className="text-lg font-medium text-neutral-900">Todavía no hay informes</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">
            Crea el primero e indica el periodo. Cada tarjeta reúne las asistencias, las planificaciones, la seguridad social y el informe escrito.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {summaries.map((summary) => {
            const done = readyCount(summary)
            const complete = done === SECTIONS.length
            const [year, , day] = (summary.desde || summary.fechaElaboracion || "0000-01-01").split("-")
            return (
              <button
                key={summary.periodKey}
                type="button"
                onClick={() => openSummary(summary)}
                className="group flex gap-4 rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex w-20 shrink-0 flex-col items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
                  <span className="text-[11px] uppercase tracking-wide">{monthName(summary.desde).slice(0, 3)}</span>
                  <span className="text-2xl font-semibold leading-none">{Number(day) || "—"}</span>
                  <span className="text-[11px]">{year}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-xs text-neutral-500">
                      {prettyDate(summary.desde)} – {prettyDate(summary.hasta)}
                    </p>
                    <span className={cn("shrink-0 text-xs font-medium", complete ? "text-emerald-700" : "text-amber-700")}>
                      {complete ? "Completo" : "Incompleto"}
                    </span>
                  </div>
                  <h3 className="mt-1 truncate text-lg font-semibold tracking-tight text-neutral-950 group-hover:underline">
                    {rangeTitle(summary.desde, summary.hasta)}
                  </h3>
                  <p className="mt-1 text-sm text-neutral-600">{done} de {SECTIONS.length} documentos listos</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {SECTIONS.map((item) => {
                      const ok = summaryReady(summary, item.id)
                      return (
                        <span
                          key={item.id}
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px]",
                            ok ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-500"
                          )}
                        >
                          {ok ? "Listo · " : ""}
                          {item.label.replace("Informe de ", "")}
                        </span>
                      )
                    })}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <Sheet open={packageOpen} onOpenChange={(open) => { setPackageOpen(open); if (!open) setSection(null) }}>
        <SheetContent side="right" className={MAIN_DRAWER}>
          <SheetHeader className="border-b px-5 py-5">
            <SheetTitle>{askingDates ? "Nuevo informe" : rangeTitle(form.desde || desde, form.hasta || hasta)}</SheetTitle>
            <SheetDescription>
              {askingDates
                ? `Periodo del informe de ${groupName}.`
                : `${prettyDate(form.desde || desde)} – ${prettyDate(form.hasta || hasta)}`}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {message && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">{message}</AlertDescription>
              </Alert>
            )}
            {askingDates ? (
              <div className="space-y-4">
                <Field label="Desde" type="date" value={desde} onChange={setDesde} />
                <Field label="Hasta" type="date" value={hasta} onChange={setHasta} />
                <Button type="button" className="w-full rounded-full" onClick={confirmDates} disabled={saving}>
                  {saving ? "Creando..." : "Continuar"}
                </Button>
              </div>
            ) : detailLoading ? (
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Abriendo el informe...
              </div>
            ) : (
              <div className="space-y-3">
                {SECTIONS.map((item) => {
                  const ready = sectionReady(item.id, files, form, evidencias)
                  return (
                    <div key={item.id} className="rounded-2xl border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-neutral-950">{item.label}</p>
                          <p className="mt-1 text-xs text-neutral-500">{item.help}</p>
                        </div>
                        <span className={cn("inline-flex items-center gap-1 text-xs", ready ? "text-emerald-700" : "text-neutral-400")}>
                          <Check className="h-3.5 w-3.5" />
                          {ready ? "Listo" : "Pendiente"}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button type="button" size="sm" className="rounded-full" onClick={() => setSection({ id: item.id, mode: "edit" })}>
                          Llenar
                        </Button>
                        <Button type="button" size="sm" variant="outline" className="rounded-full" onClick={() => setSection({ id: item.id, mode: "preview" })}>
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          Ver
                        </Button>
                        {item.id !== "informe" && files[item.id] && (
                          <Button type="button" size="sm" variant="ghost" className="rounded-full" onClick={() => downloadStored(files[item.id] as StoredReportFile)}>
                            <Download className="mr-1.5 h-3.5 w-3.5" />
                            Descargar
                          </Button>
                        )}
                        {item.id === "informe" && (
                          <Button type="button" size="sm" variant="ghost" className="rounded-full" onClick={handleGenerateDocx}>
                            <Download className="mr-1.5 h-3.5 w-3.5" />
                            Word
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
                <Button type="button" variant="outline" className="w-full rounded-full" onClick={handleDownloadPackage} disabled={saving}>
                  {saving ? "Preparando..." : "Descargar todo el periodo"}
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={Boolean(section)} onOpenChange={(open) => { if (!open) setSection(null) }}>
        <SheetContent side="right" nested className={NESTED_DRAWER}>
          <SheetHeader className="border-b px-5 py-5">
            <SheetTitle>{activeSection?.label}</SheetTitle>
            <SheetDescription>{section?.mode === "preview" ? "Así va quedando." : activeSection?.help}</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-5 py-5">
            {section?.mode === "preview" ? (
              <Preview
                id={section.id}
                form={form}
                evidencias={evidencias}
                file={section.id === "informe" ? undefined : files[section.id]}
              />
            ) : section?.id === "informe" ? (
              <div className="space-y-4">
                <div className="grid gap-3">
                  <Field label="Informe de actividades No." value={form.numero} onChange={(value) => update("numero", value)} />
                  <Field label="Fecha de elaboración" type="date" value={form.fechaElaboracion} onChange={(value) => update("fechaElaboracion", value)} />
                  <Field label="Mes correspondiente" value={form.mesCorrespondiente} onChange={(value) => update("mesCorrespondiente", value)} />
                  <Field label="NIT" value={form.nit} onChange={(value) => update("nit", value)} />
                  <Field label="Nombres y apellidos" value={form.nombres} onChange={(value) => update("nombres", value)} />
                  <Field label="No. orden contractual" value={form.ordenContractual} onChange={(value) => update("ordenContractual", value)} />
                  <Field label="Valor total del contrato" value={form.valorTotal} onChange={(value) => update("valorTotal", value)} />
                  <Field label="Valor pago cuota" value={form.valorCuota} onChange={(value) => update("valorCuota", value)} />
                  <Field label="Deporte" value={form.deporte} onChange={(value) => update("deporte", value)} />
                  <Field label="Supervisor/a" value={form.supervisor} onChange={(value) => update("supervisor", value)} />
                  <Field label="Dependencia" value={form.dependencia} onChange={(value) => update("dependencia", value)} />
                  <div className="space-y-2">
                    <Label>Objeto del contrato</Label>
                    <Textarea value={form.objeto} onChange={(event) => update("objeto", event.target.value)} />
                  </div>
                </div>
                {ACTIVIDADES_INFORME.map((actividad) => (
                  <PuntoCard
                    key={actividad.punto}
                    titulo={actividad.titulo}
                    descripcion={actividad.descripcion}
                    nombreCampo={actividad.nombreCampo}
                    texto={form[`punto${actividad.punto}` as "punto1" | "punto2" | "punto3"]}
                    onTexto={(value) => update(`punto${actividad.punto}` as "punto1" | "punto2" | "punto3", value)}
                    evidencias={evidencias.filter((item) => item.punto === actividad.punto)}
                    onAdd={(item) => setEvidencias((current) => [...current, { ...item, id: crypto.randomUUID(), punto: actividad.punto }])}
                    onRemove={(id) => setEvidencias((current) => current.filter((item) => item.id !== id))}
                  />
                ))}
                <div className="flex gap-2">
                  <Button type="button" className="rounded-full" onClick={handleSave} disabled={saving}>
                    {saving ? "Guardando..." : "Guardar"}
                  </Button>
                  <Button type="button" variant="outline" className="rounded-full" onClick={() => setSection({ id: "informe", mode: "preview" })}>
                    <Eye className="mr-1.5 h-4 w-4" />
                    Ver
                  </Button>
                </div>
              </div>
            ) : section ? (
              <PdfEditor
                id={section.id as ReportFileSlot}
                help={activeSection?.help || ""}
                file={files[section.id as ReportFileSlot]}
                onUpload={(file) => handlePdf(section.id as ReportFileSlot, file)}
                onGenerate={section.id === "asistencias" ? handleAttendancePdf : undefined}
                onPreview={() => setSection({ id: section.id, mode: "preview" })}
              />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function periodKeyOf(form: TrainerReportData) {
  return form.desde && form.hasta ? `${form.desde}_${form.hasta}` : ""
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  )
}

function PdfEditor({
  id,
  help,
  file,
  onUpload,
  onGenerate,
  onPreview,
}: {
  id: ReportFileSlot
  help: string
  file?: StoredReportFile
  onUpload: (file: File | null) => void
  onGenerate?: () => void
  onPreview: () => void
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-600">{help}</p>
      {id === "asistencias" && onGenerate && (
        <Button type="button" className="rounded-full" onClick={onGenerate}>
          <FileText className="mr-2 h-4 w-4" />
          Generar PDF del periodo
        </Button>
      )}
      {id !== "asistencias" && (
        <div className="space-y-2">
          <Label>PDF, máximo 500 KB</Label>
          <Input
            type="file"
            accept="application/pdf,.pdf"
            onChange={(event) => {
              const selected = event.target.files?.[0] || null
              event.target.value = ""
              onUpload(selected)
            }}
          />
        </div>
      )}
      {file && <p className="text-xs text-emerald-700">Incluido: {file.fileName}</p>}
      <Button type="button" variant="outline" className="rounded-full" onClick={onPreview}>
        <Eye className="mr-1.5 h-4 w-4" />
        Ver
      </Button>
    </div>
  )
}

function Preview({
  id,
  form,
  evidencias,
  file,
}: {
  id: SectionId
  form: TrainerReportData
  evidencias: StoredReportEvidence[]
  file?: StoredReportFile
}) {
  if (id === "informe") return <WordPreview form={form} evidencias={evidencias} />
  if (!file?.dataUrl) {
    return <p className="text-sm text-neutral-500">Todavía no hay un PDF para este documento.</p>
  }
  return <PdfFrame dataUrl={file.dataUrl} />
}

function PdfFrame({ dataUrl }: { dataUrl: string }) {
  const [url, setUrl] = useState("")
  useEffect(() => {
    const binary = atob(dataUrl.split(",")[1] || "")
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index)
    const blobUrl = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }))
    setUrl(blobUrl)
    return () => URL.revokeObjectURL(blobUrl)
  }, [dataUrl])
  if (!url) return null
  return <iframe title="Vista previa del PDF" src={url} className="h-[68vh] w-full rounded-xl border bg-white" />
}

function WordPreview({ form, evidencias }: { form: TrainerReportData; evidencias: StoredReportEvidence[] }) {
  return (
    <article className="space-y-3 rounded-xl border bg-white p-4 text-sm shadow-sm">
      <img src="/informe-logo-univalle.jpeg" alt="Universidad del Valle" className="h-14 w-auto" />
      <p className="text-center text-xs font-semibold text-red-700">VICERRECTORÍA DE BIENESTAR UNIVERSITARIO</p>
      <p className="text-center text-xs font-semibold text-red-700">UNIVERSIDAD DEL VALLE</p>
      <h3 className="text-center text-base font-semibold">INFORME DE ACTIVIDADES {form.numero ? `No. ${form.numero}` : ""}</h3>
      <PreviewLine label="Fecha de elaboración" value={form.fechaElaboracion} />
      <PreviewLine label="Mes correspondiente" value={form.mesCorrespondiente} />
      <PreviewLine label="NIT" value={form.nit} />
      <PreviewLine label="Nombres y apellidos" value={form.nombres} />
      <PreviewLine label="No. orden contractual" value={form.ordenContractual} />
      <PreviewLine label="Valor total del contrato" value={form.valorTotal} />
      <PreviewLine label="Objeto del contrato" value={form.objeto} />
      <PreviewLine label="Supervisor/a" value={form.supervisor} />
      <PreviewLine label="Dependencia" value={form.dependencia} />
      <PreviewLine label="Valor pago cuota" value={form.valorCuota} />
      <PreviewLine label="Deporte" value={form.deporte} />
      {ACTIVIDADES_INFORME.map((actividad) => (
        <section key={actividad.punto} className="space-y-2 border-t pt-3">
          <h4 className="font-semibold">{actividad.titulo}</h4>
          <p className="text-xs text-neutral-600">{actividad.descripcion}</p>
          <p className="whitespace-pre-wrap">{form[`punto${actividad.punto}` as "punto1" | "punto2" | "punto3"] || "Sin texto todavía."}</p>
          <div className="grid grid-cols-2 gap-2">
            {evidencias.filter((item) => item.punto === actividad.punto).map((item) => (
              <figure key={item.id} className="space-y-1">
                <img src={item.image} alt={item.pieDeFoto} className="h-24 w-full rounded object-cover" />
                <figcaption className="text-[11px] text-neutral-600">{item.pieDeFoto}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      ))}
    </article>
  )
}

function PreviewLine({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="font-medium">{label}: </span>
      {value.trim() || "—"}
    </p>
  )
}

function PuntoCard({
  titulo,
  descripcion,
  nombreCampo,
  texto,
  onTexto,
  evidencias,
  onAdd,
  onRemove,
}: {
  titulo: string
  descripcion: string
  nombreCampo: string
  texto: string
  onTexto: (value: string) => void
  evidencias: StoredReportEvidence[]
  onAdd: (item: Omit<StoredReportEvidence, "id" | "punto">) => void
  onRemove: (id: string) => void
}) {
  const [fecha, setFecha] = useState(todayKey())
  const [nombre, setNombre] = useState("")
  const [pie, setPie] = useState("")
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState("")

  async function addPhoto(file: File | null) {
    if (!file) return
    setBusy(true)
    setLocalError("")
    try {
      if (!pie.trim()) throw new Error("Escribe el pie de foto antes de subir la imagen.")
      const image = await fileToStoredText(file)
      onAdd({ fecha, titulo: nombre.trim(), pieDeFoto: pie.trim(), image })
      setPie("")
      setNombre("")
    } catch (photoError) {
      setLocalError(photoError instanceof Error ? photoError.message : "No se pudo agregar la foto")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border p-3">
      <div>
        <p className="font-medium">{titulo}</p>
        <p className="mt-1 text-xs text-neutral-500">{descripcion}</p>
      </div>
      <Textarea value={texto} onChange={(event) => onTexto(event.target.value)} className="min-h-28" />
      <Field label="Fecha" type="date" value={fecha} onChange={setFecha} />
      <Field label={nombreCampo} value={nombre} onChange={setNombre} />
      <div className="space-y-2">
        <Label>Pie de foto</Label>
        <Input value={pie} placeholder="Foto de ensayo del día 17 de septiembre" onChange={(event) => setPie(event.target.value)} />
      </div>
      <Input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        disabled={busy}
        onChange={(event) => {
          const file = event.target.files?.[0] || null
          event.target.value = ""
          addPhoto(file)
        }}
      />
      {busy && <p className="text-xs text-neutral-500">Preparando la imagen...</p>}
      {localError && <p className="text-xs text-red-600">{localError}</p>}
      <div className="space-y-2">
        {evidencias.map((item) => (
          <figure key={item.id} className="rounded-xl border p-2">
            <img src={item.image} alt={item.pieDeFoto} className="h-28 w-full rounded object-cover" />
            <figcaption className="mt-1 text-xs text-neutral-700">
              {item.pieDeFoto} · {item.fecha || "sin fecha"}
            </figcaption>
            <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(item.id)}>
              <Trash2 className="mr-1 h-4 w-4" />
              Quitar
            </Button>
          </figure>
        ))}
        {evidencias.length === 0 && (
          <p className="flex items-center gap-2 text-sm text-neutral-500">
            <ImagePlus className="h-4 w-4" />
            Aún no hay fotos en este punto.
          </p>
        )}
      </div>
    </div>
  )
}

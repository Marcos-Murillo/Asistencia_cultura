"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts"
import { Download, PieChart as PieChartIcon } from "lucide-react"

type AttendeeLike = {
  genero?: string
  facultad?: string
  estamento?: string
  programaAcademico?: string
}

const GENDER_COLORS: Record<string, string> = {
  MUJER: "#ec4899",
  HOMBRE: "#3b82f6",
  OTRO: "#8b5cf6",
}

const GENDER_LABELS: Record<string, string> = {
  MUJER: "Mujeres",
  HOMBRE: "Hombres",
  OTRO: "Otro",
}

const BAR_COLORS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6"]

function countBy(items: string[]) {
  const map: Record<string, number> = {}
  items.forEach((item) => {
    const key = item?.trim() ? item : "Sin dato"
    map[key] = (map[key] || 0) + 1
  })
  return Object.entries(map)
    .map(([name, cantidad]) => ({ name, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)
}

function shortFaculty(name: string) {
  return name.replace(/^FACULTAD DE\s+/i, "")
}

function chartHeight(count: number, min = 260) {
  return Math.max(min, count * 32 + 48)
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "")
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

type JsPdfDoc = {
  setFontSize: (n: number) => void
  setTextColor: (r: number, g?: number, b?: number) => void
  setFillColor: (r: number, g: number, b: number) => void
  text: (t: string, x: number, y: number, opts?: { maxWidth?: number }) => void
  triangle: (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, style: string) => void
  rect: (x: number, y: number, w: number, h: number, style: string) => void
  addPage: () => void
  save: (name: string) => void
  internal: { pageSize: { getWidth: () => number; getHeight: () => number } }
}

function drawPie(
  pdf: JsPdfDoc,
  cx: number,
  cy: number,
  r: number,
  slices: { value: number; fill: string }[]
) {
  const sum = slices.reduce((s, x) => s + x.value, 0) || 1
  let start = -Math.PI / 2
  slices.forEach((slice) => {
    if (slice.value <= 0) return
    const sweep = (slice.value / sum) * Math.PI * 2
    const [rr, gg, bb] = hexToRgb(slice.fill)
    pdf.setFillColor(rr, gg, bb)
    const steps = Math.max(14, Math.ceil((sweep * 180) / Math.PI / 2))
    for (let i = 0; i < steps; i++) {
      const a1 = start + (sweep * i) / steps
      const a2 = start + (sweep * (i + 1)) / steps
      pdf.triangle(
        cx,
        cy,
        cx + r * Math.cos(a1),
        cy + r * Math.sin(a1),
        cx + r * Math.cos(a2),
        cy + r * Math.sin(a2),
        "F"
      )
    }
    start += sweep
  })
}

function ensureSpace(pdf: JsPdfDoc, y: number, needed: number, margin: number) {
  const pageHeight = pdf.internal.pageSize.getHeight()
  if (y + needed > pageHeight - margin) {
    pdf.addPage()
    return margin
  }
  return y
}

function drawHBars(
  pdf: JsPdfDoc,
  x: number,
  y: number,
  width: number,
  items: { name: string; cantidad: number }[],
  colors: string[],
  margin: number
) {
  const maxVal = Math.max(...items.map((i) => i.cantidad), 1)
  const labelW = 58
  const rowH = 8
  items.forEach((item, i) => {
    y = ensureSpace(pdf, y, rowH + 2, margin)
    const barW = ((item.cantidad / maxVal) * (width - labelW - 18))
    pdf.setFontSize(8)
    pdf.setTextColor(40)
    pdf.text(item.name.length > 32 ? `${item.name.slice(0, 32)}…` : item.name, x, y + 4.5)
    const [rr, gg, bb] = hexToRgb(colors[i % colors.length])
    pdf.setFillColor(rr, gg, bb)
    pdf.rect(x + labelW, y, Math.max(barW, 0.8), 5.2, "F")
    pdf.setFontSize(8)
    pdf.text(String(item.cantidad), x + labelW + barW + 2, y + 4.5)
    y += rowH
  })
  return y
}

export function AttendeeCharts({
  attendees,
  title,
  compact = false,
}: {
  attendees: AttendeeLike[]
  title: string
  compact?: boolean
}) {
  const [downloading, setDownloading] = useState(false)
  const total = attendees.length

  const genderData = useMemo(() => {
    const counts = { MUJER: 0, HOMBRE: 0, OTRO: 0 }
    attendees.forEach((a) => {
      const g = (a.genero || "").toUpperCase()
      if (g === "MUJER") counts.MUJER++
      else if (g === "HOMBRE") counts.HOMBRE++
      else counts.OTRO++
    })
    return (["MUJER", "HOMBRE", "OTRO"] as const)
      .filter((key) => key !== "OTRO" || counts[key] > 0)
      .map((key) => ({
        key,
        name: GENDER_LABELS[key],
        value: counts[key],
        percent: total > 0 ? Math.round((counts[key] / total) * 1000) / 10 : 0,
        fill: GENDER_COLORS[key],
      }))
  }, [attendees, total])

  const facultyData = useMemo(
    () => countBy(attendees.map((a) => shortFaculty(a.facultad || ""))),
    [attendees]
  )
  const estamentoData = useMemo(
    () => countBy(attendees.map((a) => a.estamento || "")),
    [attendees]
  )
  const programData = useMemo(
    () => countBy(attendees.map((a) => a.programaAcademico || "")),
    [attendees]
  )

  const genderConfig: ChartConfig = {
    MUJER: { label: "Mujeres", color: GENDER_COLORS.MUJER },
    HOMBRE: { label: "Hombres", color: GENDER_COLORS.HOMBRE },
    OTRO: { label: "Otro", color: GENDER_COLORS.OTRO },
  }
  const barConfig: ChartConfig = {
    cantidad: { label: "Cantidad", color: "#6366f1" },
  }

  async function downloadPdf() {
    if (downloading) return
    setDownloading(true)
    try {
      const jsPDF = (await import("jspdf")).default
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" }) as unknown as JsPdfDoc
      const pageWidth = pdf.internal.pageSize.getWidth()
      const margin = 14
      const contentW = pageWidth - margin * 2
      let y = 16

      pdf.setFontSize(15)
      pdf.setTextColor(20)
      pdf.text(title.slice(0, 90), margin, y)
      y += 7
      pdf.setFontSize(10)
      pdf.setTextColor(90)
      pdf.text(`Gráficas de inscritos · Total: ${total} · ${new Date().toLocaleDateString("es-CO")}`, margin, y)
      y += 10

      pdf.setFontSize(12)
      pdf.setTextColor(20)
      pdf.text("Porcentaje de mujeres y hombres", margin, y)
      y += 8
      const pieR = 28
      const pieCx = margin + pieR + 8
      drawPie(pdf, pieCx, y + pieR, pieR, genderData)
      let legendY = y + 6
      genderData.forEach((g) => {
        const [rr, gg, bb] = hexToRgb(g.fill)
        pdf.setFillColor(rr, gg, bb)
        pdf.rect(margin + pieR * 2 + 22, legendY - 3.2, 4, 4, "F")
        pdf.setFontSize(10)
        pdf.setTextColor(40)
        pdf.text(`${g.name}: ${g.value} (${g.percent}%)`, margin + pieR * 2 + 28, legendY)
        legendY += 7
      })
      y += pieR * 2 + 14

      y = ensureSpace(pdf, y, 20, margin)
      pdf.setFontSize(12)
      pdf.setTextColor(20)
      pdf.text("Cantidad por facultad", margin, y)
      y += 6
      y = drawHBars(pdf, margin, y, contentW, facultyData, BAR_COLORS, margin) + 8

      y = ensureSpace(pdf, y, 20, margin)
      pdf.setFontSize(12)
      pdf.setTextColor(20)
      pdf.text("Cantidad por estamento", margin, y)
      y += 6
      y = drawHBars(pdf, margin, y, contentW, estamentoData, ["#0ea5e9"], margin) + 8

      y = ensureSpace(pdf, y, 20, margin)
      pdf.setFontSize(12)
      pdf.setTextColor(20)
      pdf.text("Cantidad por programa", margin, y)
      y += 6
      drawHBars(pdf, margin, y, contentW, programData, ["#10b981"], margin)

      const slug = title.replace(/\s+/g, "_").replace(/[^\wÀ-ÿ-]/g, "").slice(0, 60)
      pdf.save(`graficas_${slug || "inscritos"}_${new Date().toISOString().split("T")[0]}.pdf`)
    } catch (error) {
      console.error("[AttendeeCharts] Error generando PDF:", error)
    } finally {
      setDownloading(false)
    }
  }

  if (total === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          No hay inscritos para generar gráficas
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            Gráficas de inscritos
          </h2>
          <p className="text-sm text-gray-500">Distribución por género, facultad, estamento y programa</p>
        </div>
        <Button onClick={downloadPdf} disabled={downloading} className="bg-rose-600 hover:bg-rose-700 gap-2">
          <Download className="h-4 w-4" />
          {downloading ? "Generando PDF..." : "Descargar gráficas en PDF"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 bg-white p-1">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Porcentaje de mujeres y hombres</CardTitle>
            <CardDescription>Diagrama de torta sobre el total de inscritos</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={genderConfig} className="mx-auto aspect-square max-h-[320px]">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={genderData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={compact ? 40 : 55}
                  outerRadius={compact ? 80 : 100}
                  paddingAngle={2}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {genderData.map((entry) => (
                    <Cell key={entry.key} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="flex flex-wrap justify-center gap-4 mt-2 text-sm">
              {genderData.map((g) => (
                <div key={g.key} className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: g.fill }} />
                  <span>
                    {g.name}: <strong>{g.value}</strong> ({g.percent}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Cantidad por facultad</CardTitle>
            <CardDescription>Diagrama de barras</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={barConfig} className="w-full aspect-auto" style={{ height: chartHeight(facultyData.length) }}>
              <BarChart data={facultyData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={compact ? 90 : 130} tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="cantidad" radius={[0, 4, 4, 0]}>
                  {facultyData.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Cantidad por estamento</CardTitle>
            <CardDescription>Diagrama de barras</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={barConfig} className="w-full aspect-auto" style={{ height: chartHeight(estamentoData.length, 240) }}>
              <BarChart data={estamentoData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={compact ? 100 : 140} tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="cantidad" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Cantidad por programa</CardTitle>
            <CardDescription>Diagrama de barras</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={barConfig}
              className="w-full aspect-auto"
              style={{ height: chartHeight(Math.min(programData.length, 20), 280) }}
            >
              <BarChart data={programData.slice(0, 20)} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={compact ? 110 : 160}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v: string) => (v.length > 28 ? `${v.slice(0, 28)}…` : v)}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="cantidad" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
            {programData.length > 20 && (
              <p className="text-xs text-gray-500 mt-2">Se muestran los 20 programas con más inscritos.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

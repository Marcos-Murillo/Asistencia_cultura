"use client"

import type { ReactNode } from "react"
import { FisioterapiaShell } from "@/components/fisioterapia/shell"

export default function FisioterapiaLayout({ children }: { children: ReactNode }) {
  return <FisioterapiaShell>{children}</FisioterapiaShell>
}

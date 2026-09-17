"use client"

import { useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Activity,
  CalendarClock,
  ClipboardList,
  FileSpreadsheet,
  HeartPulse,
  Home,
  LogOut,
  MoreHorizontal,
  NotebookPen,
  Plus,
  Users,
  UserRound,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { requireFisioSession } from "@/lib/fisioterapia-session"

const navCore = [
  { href: "/fisioterapia", label: "Inicio", icon: Home },
  { href: "/fisioterapia/bitacora", label: "Mi Bitácora", icon: NotebookPen },
  { href: "/fisioterapia/actividades", label: "Mis Actividades", icon: ClipboardList },
  { href: "/fisioterapia/solicitudes", label: "Solicitudes", icon: Activity },
  { href: "/fisioterapia/seguimientos", label: "Seguimientos", icon: CalendarClock },
  { href: "/fisioterapia/deportistas", label: "Deportistas", icon: Users },
]

const navEncargadoExtra = [
  { href: "/fisioterapia/equipo", label: "Bitácoras del equipo", icon: NotebookPen },
  { href: "/fisioterapia/fisioterapeutas", label: "Fisioterapeutas", icon: UserRound },
  { href: "/fisioterapia/reportes", label: "Reportes", icon: FileSpreadsheet },
]

const mobileTabs = [
  { href: "/fisioterapia", label: "Inicio", icon: Home },
  { href: "/fisioterapia/bitacora", label: "Bitácora", icon: NotebookPen },
  { href: "/fisioterapia/solicitudes", label: "Solicitudes", icon: Activity },
]

export function FisioterapiaShell({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const actor = requireFisioSession()
  const esEncargado = actor?.kind === "fisioterapeuta" && actor.esEncargado
  const items = useMemo(
    () => (esEncargado ? [...navCore, ...navEncargadoExtra] : navCore),
    [esEncargado],
  )
  const [moreOpen, setMoreOpen] = useState(false)

  useEffect(() => {
    if (!requireFisioSession()) {
      window.location.replace("/login-manager")
    }
  }, [])

  if (!actor || actor.kind !== "fisioterapeuta") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f7f8] text-slate-600">
        Verificando acceso clínico...
      </div>
    )
  }

  const firstName = actor.nombres.split(" ")[0] || actor.nombres
  const moreActive = !mobileTabs.some((tab) => tab.href === pathname)

  return (
    <TooltipProvider>
      <div className="fisioterapia-shell min-h-screen bg-[#f4f7f8] text-slate-800">
        <div className="flex min-h-screen">
          <aside className="hidden w-64 shrink-0 border-r border-teal-900/10 bg-[#0f3d3e] text-teal-50 md:flex md:flex-col">
            <div className="px-5 py-6">
              <div className="flex items-center gap-2">
                <HeartPulse className="h-6 w-6 text-teal-200" />
                <div>
                  <p className="text-sm font-semibold tracking-wide">Fisioterapia</p>
                  <p className="text-xs text-teal-200/80">Gestión clínica deportiva</p>
                </div>
              </div>
            </div>
            <Separator className="bg-white/10" />
            <ScrollArea className="flex-1 px-3 py-4">
              <nav className="space-y-1">
                {items.map((item) => {
                  const active = pathname === item.href
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium leading-none",
                        active ? "bg-white/15 text-white" : "text-teal-100/85 hover:bg-white/10 hover:text-white",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
            </ScrollArea>
            <div className="border-t border-white/10 p-4">
              <p className="truncate text-sm font-medium">{actor.nombres}</p>
              <p className="text-xs text-teal-200/80">
                {esEncargado ? "Fisioterapeuta encargado" : "Fisioterapeuta"}
              </p>
              <Button
                variant="outline"
                className="mt-3 h-9 w-full justify-center border-white/20 bg-transparent text-teal-50 hover:bg-white/10 hover:text-white"
                onClick={() => {
                  sessionStorage.clear()
                  router.push("/login-manager")
                }}
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </Button>
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
            <header className="sticky top-0 z-30 hidden border-b bg-white/90 backdrop-blur md:block">
              <div className="flex items-center justify-between gap-3 px-6 py-3">
                <p className="text-sm text-slate-500">Registro clínico rápido · grupos deportivos existentes</p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-800">
                      Área deporte
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Usa la base de datos de deporte, sin duplicar deportistas ni grupos</TooltipContent>
                </Tooltip>
              </div>
            </header>

            <header className="sticky top-0 z-30 md:hidden">
              <div className="flex h-12 items-center justify-between bg-[#0f3d3e] px-3 pt-[env(safe-area-inset-top)] text-white">
                <div className="min-w-0">
                  <p className="text-[10px] leading-none text-teal-200">Fisioterapia</p>
                  <p className="truncate text-[13px] font-semibold leading-tight">{firstName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMoreOpen(true)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10"
                  aria-label="Más opciones"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            </header>

            <main className="min-w-0 flex-1 overflow-x-hidden px-3 py-3 pb-20 md:px-6 md:py-6 md:pb-6">{children}</main>
          </div>
        </div>

        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-teal-900/10 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
          <div className="grid h-14 grid-cols-5">
            {mobileTabs.map((tab) => {
              const Icon = tab.icon
              const active = pathname === tab.href
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium",
                    active ? "text-teal-800" : "text-slate-400",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </Link>
              )
            })}
            <Link
              href="/fisioterapia/bitacora?nuevo=1"
              className="flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-teal-800"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-800 text-white">
                <Plus className="h-4 w-4" />
              </span>
              Nuevo
            </Link>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium",
                moreActive ? "text-teal-800" : "text-slate-400",
              )}
            >
              <MoreHorizontal className="h-4 w-4" />
              Más
            </button>
          </div>
        </nav>

        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetContent side="right" className="bg-[#f4f7f8] sm:max-w-xs">
            <SheetHeader>
              <SheetTitle className="text-base">Menú</SheetTitle>
            </SheetHeader>
            <div className="space-y-1.5 px-3">
              {items.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className="flex h-9 items-center gap-2 rounded-lg bg-white px-3 text-xs font-medium shadow-sm"
                  >
                    <Icon className="h-3.5 w-3.5 text-teal-800" />
                    {item.label}
                  </Link>
                )
              })}
              <button
                type="button"
                className="flex h-9 w-full items-center gap-2 rounded-lg bg-white px-3 text-left text-xs font-medium text-red-600 shadow-sm"
                onClick={() => {
                  sessionStorage.clear()
                  router.push("/login-manager")
                }}
              >
                <LogOut className="h-3.5 w-3.5" />
                Cerrar sesión
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </TooltipProvider>
  )
}

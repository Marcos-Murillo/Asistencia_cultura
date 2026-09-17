"use client"

import { useEffect, useState } from "react"
import { Mail, Phone, UserPlus, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { getUserById } from "@/lib/db-router"
import { listFisioterapeutas } from "@/lib/fisioterapia"
import type { UserProfile } from "@/lib/types"

function vcardEscape(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;")
}

function downloadVCard(name: string, phone: string, email: string, roleLabel: string) {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${vcardEscape(name)}`,
    `N:;${vcardEscape(name)};;;`,
    `TITLE:${vcardEscape(roleLabel)}`,
    "ORG:Bienestar Deporte",
    phone ? `TEL;TYPE=CELL:${phone}` : "",
    email ? `EMAIL;TYPE=INTERNET:${email}` : "",
    "END:VCARD",
  ].filter(Boolean)
  const blob = new Blob([`${lines.join("\r\n")}\r\n`], { type: "text/vcard;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${name.replace(/[^\wáéíóúñÁÉÍÓÚÑ]+/gi, "_") || "contacto"}.vcf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function ContactPersonDrawer({
  open,
  onOpenChange,
  nested,
  userId,
  fallbackName,
  roleLabel,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  nested?: boolean
  userId?: string
  fallbackName?: string
  roleLabel: string
}) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) {
      setUser(null)
      return
    }
    let cancelled = false
    setLoading(true)
    ;(async () => {
      let profile: UserProfile | null = null
      if (userId) {
        try {
          profile = await getUserById("deporte", userId)
        } catch {
          profile = null
        }
      }
      if (!profile && (userId || fallbackName) && roleLabel.toLowerCase().includes("fisioterapeuta")) {
        const fisios = await listFisioterapeutas()
        profile =
          fisios.find((item) => item.id === userId) ||
          fisios.find((item) => item.nombres === fallbackName) ||
          null
      }
      if (!cancelled) setUser(profile)
    })()
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, userId, fallbackName, roleLabel])

  const name = user?.nombres || fallbackName || "Sin nombre"
  const phone = user?.telefono?.replace(/\s+/g, "") || ""
  const email = user?.correo || ""

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent nested={nested} side="bottom" className="max-h-[85dvh] gap-0 border-white/40 bg-white/55 backdrop-blur-2xl sm:max-w-md">
        <DrawerHeader>
          <DrawerTitle>Contactar {roleLabel}</DrawerTitle>
          <DrawerDescription>Datos del perfil en la base de deporte.</DrawerDescription>
        </DrawerHeader>
        <ScrollArea className="min-h-0 flex-1 overflow-y-auto px-6 pb-8">
          {loading ? (
            <p className="text-sm text-slate-500">Cargando contacto...</p>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center gap-2 rounded-lg bg-teal-50 p-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-800 text-white">
                  <UserRound className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold">{name}</p>
                  <p className="text-xs text-slate-500">{roleLabel}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <p><span className="text-slate-500">Documento:</span> {user?.numeroDocumento || "No registrado"}</p>
                <p><span className="text-slate-500">Correo:</span> {email || "No registrado"}</p>
                <p><span className="text-slate-500">Teléfono:</span> {user?.telefono || "No registrado"}</p>
                {user?.sede && <p><span className="text-slate-500">Sede:</span> {user.sede}</p>}
              </div>
              <div className="grid gap-2">
                {phone && (
                  <Button asChild className="h-9 justify-center bg-teal-800 hover:bg-teal-700">
                    <a href={`tel:${phone}`}>
                      <Phone className="h-4 w-4" />
                      Llamar
                    </a>
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="h-9 justify-center"
                  onClick={() => downloadVCard(name, phone, email, roleLabel)}
                >
                  <UserPlus className="h-4 w-4" />
                  Guardar contacto
                </Button>
                {email && (
                  <Button asChild variant="outline" className="h-9 justify-center">
                    <a href={`mailto:${email}`}>
                      <Mail className="h-4 w-4" />
                      Enviar correo
                    </a>
                  </Button>
                )}
                <Button variant="ghost" className="h-9 justify-center" onClick={() => onOpenChange(false)}>
                  Volver
                </Button>
              </div>
            </div>
          )}
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  )
}

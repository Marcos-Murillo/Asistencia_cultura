"use client"

import { useState } from "react"
import { createPortal } from "react-dom"
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { FilePreviewPanel, WhatsAppFileCard } from "@/components/whatsapp-file-card"
import type { DriveFileLink, EventFormResponse, UserProfile } from "@/lib/types"
import { formatNombre } from "@/lib/utils"
import { Calendar, GraduationCap, Mail, MapPin, Phone, User } from "lucide-react"

interface EventAttendee extends UserProfile {
  fechaAsistencia: Date
  formResponse?: EventFormResponse
}

interface AttendeeFormDrawerProps {
  attendee: EventAttendee | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AttendeeFormDrawer({ attendee, open, onOpenChange }: AttendeeFormDrawerProps) {
  const [previewFile, setPreviewFile] = useState<DriveFileLink | null>(null)

  function handleOpenChange(next: boolean) {
    if (!next) setPreviewFile(null)
    onOpenChange(next)
  }

  return (
    <>
      {open && previewFile && typeof document !== "undefined"
        ? createPortal(
            <div className="pointer-events-none fixed inset-3 z-[70] hidden lg:block">
              <div className="pointer-events-auto mr-[min(100%,27rem)] h-full">
                <FilePreviewPanel file={previewFile} onClose={() => setPreviewFile(null)} />
              </div>
            </div>,
            document.body,
          )
        : null}

      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerContent
          side="right"
          className="inset-y-3 right-3 h-auto max-h-[calc(100%-1.5rem)] w-[min(100%-1.5rem,26rem)] overflow-hidden rounded-3xl border-0 bg-gradient-to-b from-violet-100 via-fuchsia-50 to-sky-50 p-0 text-slate-900 shadow-2xl sm:max-w-md [&>button]:text-white"
        >
          {attendee && (
            <div className="flex min-h-0 flex-1 flex-col">
              <DrawerHeader className="border-b border-white/60 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-sky-500 text-white">
                <DrawerTitle className="text-white">{formatNombre(attendee.nombres)}</DrawerTitle>
                <DrawerDescription className="text-violet-50">
                  Información del participante y respuestas del formulario
                </DrawerDescription>
              </DrawerHeader>

              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
                {previewFile && (
                  <div className="lg:hidden">
                    <FilePreviewPanel file={previewFile} onClose={() => setPreviewFile(null)} />
                  </div>
                )}

                <section className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="mb-3 text-sm font-semibold text-violet-700">Datos del participante</p>
                  <div className="grid gap-3 text-sm">
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-fuchsia-500" />
                      {attendee.correo || "Sin correo"}
                    </p>
                    <p className="flex items-center gap-2">
                      <User className="h-4 w-4 text-violet-500" />
                      {attendee.numeroDocumento || "Sin documento"} · {attendee.estamento}
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-emerald-500" />
                      {attendee.telefono || "N/A"}
                    </p>
                    <p className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-sky-500" />
                      {attendee.facultad || "N/A"} · {attendee.programaAcademico || "N/A"}
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-amber-500" />
                      {attendee.sede || "N/A"}
                    </p>
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-pink-500" />
                      {new Date(attendee.fechaAsistencia).toLocaleString("es-CO")}
                    </p>
                    <p>
                      <span className="text-slate-500">Género:</span> {attendee.genero} ·{" "}
                      <span className="text-slate-500">Edad:</span> {attendee.edad || "N/A"}
                    </p>
                  </div>
                </section>

                <section className="space-y-3">
                  <p className="text-sm font-semibold text-fuchsia-700">Formulario</p>
                  {attendee.formResponse?.answers?.length ? (
                    attendee.formResponse.answers.map((answer, answerIndex) => (
                      <div key={`${answer.questionId}-${answerIndex}`} className="rounded-2xl bg-white p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-violet-500">
                          {answer.label || `Pregunta ${answerIndex + 1}`}
                        </p>
                        {answer.text && <p className="mt-2 text-sm text-slate-800">{answer.text}</p>}
                        {answer.selected?.length ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {answer.selected.map((option) => (
                              <span
                                key={option}
                                className="rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-800"
                              >
                                {option}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        <div className="mt-3 space-y-2">
                          {answer.files?.map((file) => (
                            <WhatsAppFileCard
                              key={file.fileId || file.name}
                              file={file}
                              onView={() => setPreviewFile(file)}
                            />
                          ))}
                        </div>
                        {!answer.text && !answer.selected?.length && !answer.files?.length && (
                          <p className="mt-2 text-sm text-slate-500">Sin contenido en esta pregunta.</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl bg-white p-4 text-sm text-slate-500 shadow-sm">
                      {attendee.formResponse
                        ? "El formulario se envió, pero no quedaron respuestas guardadas."
                        : "Este inscrito aún no tiene respuestas de formulario."}
                    </div>
                  )}
                </section>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </>
  )
}

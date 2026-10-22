"use client"

import { useRef } from "react"
import { FileAudio, FileText, FileVideo, ImageIcon, Upload } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { QuestionnaireChoice, QuestionnaireChoices } from "@/components/ui/questionnaire"
import { getVisibleQuestions, isFileQuestionType, QUESTION_UPLOAD_LIMITS, type FileQuestionType, type InscriptionAnswerDraft } from "@/lib/inscription-form"
import type { InscriptionQuestion } from "@/lib/types"

interface InscriptionFormFieldsProps {
  questions: InscriptionQuestion[]
  value: Record<string, InscriptionAnswerDraft>
  onChange: (next: Record<string, InscriptionAnswerDraft>) => void
  disabled?: boolean
  tone?: "light" | "dark"
}

const FILE_ICONS = {
  pdf: FileText,
  photo: ImageIcon,
  video: FileVideo,
  audio: FileAudio,
}

export function InscriptionFormFields({ questions, value, onChange, disabled, tone = "light" }: InscriptionFormFieldsProps) {
  const dark = tone === "dark"

  function patch(questionId: string, update: Partial<InscriptionAnswerDraft>) {
    onChange({
      ...value,
      [questionId]: { ...value[questionId], ...update },
    })
  }

  return (
    <div className="space-y-4">
      {getVisibleQuestions(questions, value).map((question) => {
        const current = value[question.id] || {}
        return (
          <div
            key={question.id}
            className={
              dark
                ? "space-y-3 rounded-xl border border-white/15 bg-zinc-950/70 p-3"
                : "space-y-3 rounded-xl border border-violet-100 bg-violet-50/80 p-3"
            }
          >
            <Label className={dark ? "block text-base font-semibold text-lime-300" : "block text-base font-semibold text-violet-950"}>
              {question.label}
              {question.required ? " *" : ""}
            </Label>
            {question.type === "text" && (
              <Textarea
                value={current.text || ""}
                disabled={disabled}
                onChange={(event) => patch(question.id, { text: event.target.value })}
                placeholder="Escribe tu respuesta"
                className={
                  dark
                    ? "border-white/20 bg-zinc-800 text-white placeholder:text-zinc-400"
                    : "border-violet-200 bg-white text-slate-900"
                }
              />
            )}
            {question.type === "multiple_choice" && (
              <QuestionnaireChoices>
                {(question.options ?? []).map((option) => {
                  const selected = current.selected || []
                  const isSelected = question.allowMultiple ? selected.includes(option) : selected[0] === option
                  return (
                    <QuestionnaireChoice
                      key={option}
                      selected={isSelected}
                      multiple={Boolean(question.allowMultiple)}
                      disabled={disabled}
                      className={
                        dark
                          ? isSelected
                            ? "border-lime-400 bg-lime-400 text-zinc-950 hover:bg-lime-300 hover:border-lime-300"
                            : "border-white/20 bg-zinc-800 text-white hover:border-lime-400/60 hover:bg-zinc-700"
                          : undefined
                      }
                      onClick={() => {
                        if (disabled) return
                        if (question.allowMultiple) {
                          const next = isSelected ? selected.filter((item) => item !== option) : [...selected, option]
                          patch(question.id, { selected: next })
                          return
                        }
                        patch(question.id, { selected: [option] })
                      }}
                    >
                      {option}
                    </QuestionnaireChoice>
                  )
                })}
              </QuestionnaireChoices>
            )}
            {isFileQuestionType(question.type) && (
              <FilePickerField
                type={question.type}
                tone={tone}
                disabled={disabled}
                file={current.file || null}
                existingName={current.existingFiles?.[0]?.name}
                onChange={(file) => patch(question.id, { file })}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function FilePickerField({
  type,
  tone = "light",
  disabled,
  file,
  existingName,
  onChange,
}: {
  type: keyof typeof FILE_ICONS
  tone?: "light" | "dark"
  disabled?: boolean
  file: File | null
  existingName?: string
  onChange: (file: File | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const limits = QUESTION_UPLOAD_LIMITS[type]
  const Icon = FILE_ICONS[type]
  const displayName = file?.name || existingName
  const dark = tone === "dark"

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        disabled={disabled}
        accept={limits.accept}
        onChange={(event) => onChange(event.target.files?.[0] || null)}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className={
          dark
            ? "flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-lime-400/40 bg-zinc-800 px-4 py-4 text-left text-white transition hover:border-lime-400 disabled:opacity-60"
            : "flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-violet-200 bg-white px-4 py-4 text-left text-slate-800 transition hover:border-violet-400 hover:bg-violet-50 disabled:opacity-60"
        }
      >
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${dark ? "bg-lime-400 text-zinc-950" : "bg-violet-600 text-white"}`}>
          <Icon className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block font-medium ${dark ? "text-white" : "text-slate-900"}`}>
            {displayName || "Seleccionar archivo"}
          </span>
          <span className={`block text-xs ${dark ? "text-zinc-400" : "text-slate-600"}`}>{limits.label}</span>
        </span>
        <Upload className={`h-4 w-4 shrink-0 ${dark ? "text-lime-400" : "text-violet-600"}`} />
      </button>
      {existingName && !file && (
        <p className={`text-xs ${dark ? "text-lime-300" : "text-violet-700"}`}>
          Archivo actual: {existingName}. Puedes dejarlo o reemplazarlo.
        </p>
      )}
    </div>
  )
}

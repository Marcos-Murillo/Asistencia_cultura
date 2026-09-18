"use client"

import { useRef } from "react"
import { FileAudio, FileText, FileVideo, ImageIcon, Upload } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { QuestionnaireChoice, QuestionnaireChoices } from "@/components/ui/questionnaire"
import { FILE_QUESTION_TYPES, getVisibleQuestions, QUESTION_UPLOAD_LIMITS, type InscriptionAnswerDraft } from "@/lib/inscription-form"
import type { InscriptionQuestion } from "@/lib/types"

interface InscriptionFormFieldsProps {
  questions: InscriptionQuestion[]
  value: Record<string, InscriptionAnswerDraft>
  onChange: (next: Record<string, InscriptionAnswerDraft>) => void
  disabled?: boolean
}

const FILE_ICONS = {
  pdf: FileText,
  photo: ImageIcon,
  video: FileVideo,
  audio: FileAudio,
}

export function InscriptionFormFields({ questions, value, onChange, disabled }: InscriptionFormFieldsProps) {
  function patch(questionId: string, update: Partial<InscriptionAnswerDraft>) {
    onChange({
      ...value,
      [questionId]: { ...value[questionId], ...update },
    })
  }

  return (
    <div className="space-y-5">
      {getVisibleQuestions(questions, value).map((question) => {
        const current = value[question.id] || {}
        return (
          <div key={question.id} className="space-y-2">
            <Label className="text-slate-800">
              {question.label}
              {question.required ? " *" : ""}
            </Label>
            {question.type === "text" && (
              <Textarea
                value={current.text || ""}
                disabled={disabled}
                onChange={(event) => patch(question.id, { text: event.target.value })}
                placeholder="Escribe tu respuesta"
                className="bg-white text-slate-900"
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
            {FILE_QUESTION_TYPES.includes(question.type) && (
              <FilePickerField
                type={question.type as keyof typeof FILE_ICONS}
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
  disabled,
  file,
  existingName,
  onChange,
}: {
  type: keyof typeof FILE_ICONS
  disabled?: boolean
  file: File | null
  existingName?: string
  onChange: (file: File | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const limits = QUESTION_UPLOAD_LIMITS[type]
  const Icon = FILE_ICONS[type]
  const displayName = file?.name || existingName

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
        className="flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-violet-200 bg-violet-50 px-4 py-4 text-left text-slate-800 transition hover:border-violet-400 hover:bg-violet-100 disabled:opacity-60"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white">
          <Icon className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-slate-900">
            {displayName || "Seleccionar archivo"}
          </span>
          <span className="block text-xs text-slate-600">{limits.label}</span>
        </span>
        <Upload className="h-4 w-4 shrink-0 text-violet-600" />
      </button>
      {existingName && !file && (
        <p className="text-xs text-violet-700">Archivo actual: {existingName}. Puedes dejarlo o reemplazarlo.</p>
      )}
    </div>
  )
}

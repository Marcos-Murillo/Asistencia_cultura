"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { createQuestionId, emptyInscriptionForm } from "@/lib/inscription-form"
import type { EventInscriptionForm, InscriptionQuestion, InscriptionQuestionType } from "@/lib/types"
import { Plus, Trash2 } from "lucide-react"

const TYPE_LABELS: Record<InscriptionQuestionType, string> = {
  text: "Respuesta abierta",
  multiple_choice: "Opción múltiple",
  pdf: "Adjuntar PDF",
  photo: "Subir fotografía",
  video: "Subir video",
  audio: "Subir audio",
}

interface InscriptionFormBuilderProps {
  value: EventInscriptionForm
  onChange: (form: EventInscriptionForm) => void
}

export function InscriptionFormBuilder({ value, onChange }: InscriptionFormBuilderProps) {
  const form = value ?? emptyInscriptionForm()

  function updateQuestion(id: string, patch: Partial<InscriptionQuestion>) {
    onChange({
      ...form,
      enabled: true,
      questions: form.questions.map((question) => (question.id === id ? { ...question, ...patch } : question)),
    })
  }

  function addQuestion(type: InscriptionQuestionType) {
    const question: InscriptionQuestion = {
      id: createQuestionId(),
      label: "",
      type,
      required: true,
      ...(type === "multiple_choice" ? { options: ["", ""], allowMultiple: false } : {}),
    }
    onChange({
      enabled: true,
      questions: [...form.questions, question],
    })
  }

  function removeQuestion(id: string) {
    const questions = form.questions
      .filter((question) => question.id !== id)
      .map((question) => {
        if (question.visibleIf?.questionId === id) {
          const { visibleIf: _ignored, ...rest } = question
          return rest
        }
        return question
      })
    onChange({ enabled: questions.length > 0, questions })
  }

  return (
    <div className="space-y-3 rounded-lg border bg-slate-50 p-3">
      <div>
        <p className="text-sm font-medium">Formulario de inscripción (opcional)</p>
        <p className="text-xs text-muted-foreground">
          Preguntas extra para quien se inscriba. Puedes mostrar una pregunta solo si eligió una opción anterior.
        </p>
      </div>

      {form.questions.map((question, index) => {
        const parentCandidates = form.questions
          .slice(0, index)
          .filter((item) => item.type === "multiple_choice" && (item.options || []).some((option) => option.trim()))
        const parent = parentCandidates.find((item) => item.id === question.visibleIf?.questionId)

        return (
          <div key={question.id} className="space-y-2 rounded-md border bg-white p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium text-slate-500">
                Pregunta {index + 1} · {TYPE_LABELS[question.type]}
              </p>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeQuestion(question.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Input
              value={question.label}
              onChange={(event) => updateQuestion(question.id, { label: event.target.value })}
              placeholder="Escribe la pregunta"
              required={form.questions.length > 0}
            />
            {question.type === "multiple_choice" && (
              <div className="space-y-2">
                {(question.options ?? []).map((option, optionIndex) => (
                  <Input
                    key={`${question.id}-opt-${optionIndex}`}
                    value={option}
                    placeholder={`Opción ${optionIndex + 1}`}
                    onChange={(event) => {
                      const options = [...(question.options ?? [])]
                      options[optionIndex] = event.target.value
                      updateQuestion(question.id, { options })
                    }}
                  />
                ))}
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => updateQuestion(question.id, { options: [...(question.options ?? []), ""] })}
                  >
                    Añadir opción
                  </Button>
                  <label className="flex items-center gap-2 text-xs">
                    <Checkbox
                      checked={Boolean(question.allowMultiple)}
                      onCheckedChange={(checked) => updateQuestion(question.id, { allowMultiple: checked === true })}
                    />
                    Permitir varias respuestas
                  </label>
                </div>
              </div>
            )}
            {parentCandidates.length > 0 && (
              <div className="space-y-2 rounded-md border border-dashed p-2">
                <p className="text-xs font-medium text-slate-600">Lógica condicional</p>
                <select
                  className="w-full rounded-md border bg-white px-2 py-1 text-xs"
                  value={question.visibleIf?.questionId || ""}
                  onChange={(event) => {
                    const questionId = event.target.value
                    if (!questionId) {
                      updateQuestion(question.id, { visibleIf: undefined })
                      return
                    }
                    updateQuestion(question.id, { visibleIf: { questionId, values: [] } })
                  }}
                >
                  <option value="">Siempre visible</option>
                  {parentCandidates.map((item, parentIndex) => (
                    <option key={item.id} value={item.id}>
                      Mostrar solo si responde la pregunta {parentIndex + 1}
                    </option>
                  ))}
                </select>
                {parent && (
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">Si elige:</p>
                    {(parent.options || []).filter(Boolean).map((option) => {
                      const checked = Boolean(question.visibleIf?.values.includes(option))
                      return (
                        <label key={option} className="flex items-center gap-2 text-xs">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(isChecked) => {
                              const current = question.visibleIf?.values || []
                              const values = isChecked
                                ? [...current, option]
                                : current.filter((item) => item !== option)
                              updateQuestion(question.id, {
                                visibleIf: { questionId: parent.id, values },
                              })
                            }}
                          />
                          {option}
                        </label>
                      )
                    })}
                    {!question.visibleIf?.values.length && (
                      <p className="text-xs text-amber-700">Marca al menos una opción para que la pregunta se muestre.</p>
                    )}
                  </div>
                )}
              </div>
            )}
            <label className="flex items-center gap-2 text-xs">
              <Checkbox
                checked={question.required}
                onCheckedChange={(checked) => updateQuestion(question.id, { required: checked === true })}
              />
              Obligatoria
            </label>
          </div>
        )
      })}

      <div className="flex flex-wrap gap-2">
        {(Object.keys(TYPE_LABELS) as InscriptionQuestionType[]).map((type) => (
          <Button key={type} type="button" variant="outline" size="sm" onClick={() => addQuestion(type)}>
            <Plus className="h-3 w-3 mr-1" />
            {TYPE_LABELS[type]}
          </Button>
        ))}
      </div>
    </div>
  )
}

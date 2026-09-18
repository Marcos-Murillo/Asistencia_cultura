"use client"

import type { Area } from "@/lib/firebase-config"
import { uploadInscriptionFile } from "@/lib/drive-upload-client"
import { getVisibleQuestions, toStoredAnswers, type InscriptionAnswerDraft } from "@/lib/inscription-form"
import type { InscriptionAnswer, InscriptionQuestion } from "@/lib/types"

export async function buildInscriptionAnswers(params: {
  area: Area
  eventId: string
  userId: string
  userName: string
  userDocument?: string
  questions: InscriptionQuestion[]
  draft: Record<string, InscriptionAnswerDraft>
  onProgress?: (message: string) => void
}): Promise<InscriptionAnswer[]> {
  const answers: InscriptionAnswer[] = []
  const visible = getVisibleQuestions(params.questions, params.draft)

  for (const question of visible) {
    const value = params.draft[question.id] || {}
    const answer: InscriptionAnswer = {
      questionId: question.id,
      label: question.label,
      type: question.type,
    }

    if (question.type === "text") {
      const text = value.text?.trim()
      if (text) answer.text = text
    } else if (question.type === "multiple_choice") {
      if (value.selected?.length) answer.selected = value.selected
    } else if (value.file) {
      params.onProgress?.(`Subiendo ${value.file.name}...`)
      const file = await uploadInscriptionFile({
        file: value.file,
        area: params.area,
        eventId: params.eventId,
        questionId: question.id,
        questionType: question.type,
        userId: params.userId,
        userName: params.userName,
        userDocument: params.userDocument,
      })
      answer.files = [file]
    } else if (value.existingFiles?.length) {
      answer.files = value.existingFiles
    }

    answers.push(answer)
  }

  return toStoredAnswers(answers)
}

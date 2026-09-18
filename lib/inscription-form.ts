import type {
  DriveFileLink,
  Event,
  EventInscriptionForm,
  InscriptionAnswer,
  InscriptionQuestion,
  InscriptionQuestionType,
  QuestionVisibilityRule,
} from "./types"

export type FileQuestionType = "pdf" | "photo" | "video" | "audio"

export const FILE_QUESTION_TYPES: FileQuestionType[] = ["pdf", "photo", "video", "audio"]

export function isFileQuestionType(type: InscriptionQuestionType): type is FileQuestionType {
  return type === "pdf" || type === "photo" || type === "video" || type === "audio"
}

export const QUESTION_UPLOAD_LIMITS: Record<
  FileQuestionType,
  { maxBytes: number; mime: string[]; accept: string; label: string }
> = {
  pdf: {
    maxBytes: 15 * 1024 * 1024,
    mime: ["application/pdf"],
    accept: "application/pdf,.pdf",
    label: "PDF (máx. 15 MB)",
  },
  photo: {
    maxBytes: 8 * 1024 * 1024,
    mime: ["image/jpeg", "image/png", "image/webp"],
    accept: "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp",
    label: "Foto JPG, PNG o WEBP (máx. 8 MB)",
  },
  video: {
    maxBytes: 200 * 1024 * 1024,
    mime: ["video/mp4", "video/webm", "video/quicktime"],
    accept: "video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov",
    label: "Video MP4, WEBM o MOV (máx. 200 MB)",
  },
  audio: {
    maxBytes: 25 * 1024 * 1024,
    mime: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/webm", "audio/ogg", "audio/mp4", "audio/aac", "audio/x-m4a"],
    accept: "audio/*,.mp3,.wav,.ogg,.m4a,.aac,.webm",
    label: "Audio MP3, WAV, OGG o M4A (máx. 25 MB)",
  },
}

export function createQuestionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `q_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

export function emptyInscriptionForm(): EventInscriptionForm {
  return { enabled: false, questions: [] }
}

export function getEventQuestions(event?: Pick<Event, "inscriptionForm"> | null): InscriptionQuestion[] {
  const questions = event?.inscriptionForm?.questions ?? []
  if (!questions.length) return []
  if (event?.inscriptionForm?.enabled === false) return []
  return questions
}

export function sanitizeInscriptionForm(form?: EventInscriptionForm | null): EventInscriptionForm {
  if (!form) return emptyInscriptionForm()
  const questions = (form.questions ?? [])
    .map((question) => sanitizeQuestion(question))
    .filter((question): question is InscriptionQuestion => Boolean(question))
  const ids = new Set(questions.map((question) => question.id))
  const cleaned = questions.map((question) => {
    if (!question.visibleIf?.questionId || !ids.has(question.visibleIf.questionId) || question.visibleIf.questionId === question.id) {
      const { visibleIf: _ignored, ...rest } = question
      return rest
    }
    return question
  })
  return {
    enabled: Boolean(form.enabled) && cleaned.length > 0,
    questions: cleaned,
  }
}

function sanitizeQuestion(question: Partial<InscriptionQuestion>): InscriptionQuestion | null {
  const label = String(question.label ?? "").trim()
  const type = question.type
  if (!label || !type) return null
  const validTypes: InscriptionQuestionType[] = ["text", "multiple_choice", "pdf", "photo", "video", "audio"]
  if (!validTypes.includes(type)) return null

  const base: InscriptionQuestion = {
    id: question.id?.trim() || createQuestionId(),
    label: label.slice(0, 240),
    type,
    required: Boolean(question.required),
  }

  const visibleIf = sanitizeVisibleIf(question.visibleIf)
  if (visibleIf) base.visibleIf = visibleIf

  if (type === "multiple_choice") {
    const options = (question.options ?? []).map((option) => option.trim()).filter(Boolean).slice(0, 20)
    if (options.length < 2) return null
    return { ...base, options, allowMultiple: Boolean(question.allowMultiple) }
  }

  return base
}

function sanitizeVisibleIf(rule?: QuestionVisibilityRule): QuestionVisibilityRule | undefined {
  const questionId = String(rule?.questionId || "").trim()
  const values = (rule?.values || []).map((value) => String(value).trim()).filter(Boolean)
  if (!questionId || values.length === 0) return undefined
  return { questionId, values }
}

export function isQuestionVisible(
  question: InscriptionQuestion,
  questions: InscriptionQuestion[],
  draft: Record<string, InscriptionAnswerDraft>,
  visiting: Set<string> = new Set(),
): boolean {
  if (!question.visibleIf?.questionId) return true
  if (visiting.has(question.id)) return true
  visiting.add(question.id)
  const parent = questions.find((item) => item.id === question.visibleIf?.questionId)
  if (!parent) return true
  if (!isQuestionVisible(parent, questions, draft, visiting)) return false
  const expected = question.visibleIf.values
  if (parent.type === "multiple_choice") {
    const selected = draft[parent.id]?.selected || []
    return expected.some((value) => selected.includes(value))
  }
  if (parent.type === "text") {
    const text = (draft[parent.id]?.text || "").trim()
    return expected.some((value) => value === text)
  }
  return true
}

export function getVisibleQuestions(
  questions: InscriptionQuestion[],
  draft: Record<string, InscriptionAnswerDraft>,
): InscriptionQuestion[] {
  return questions.filter((question) => isQuestionVisible(question, questions, draft))
}

export function validateInscriptionAnswers(
  questions: InscriptionQuestion[],
  draft: Record<string, InscriptionAnswerDraft>,
): string | null {
  const visible = getVisibleQuestions(questions, draft)
  for (const question of visible) {
    const value = draft[question.id]
    if (!question.required) continue
    if (question.type === "text") {
      if (!value?.text?.trim()) return `Completa: ${question.label}`
    } else if (question.type === "multiple_choice") {
      if (!value?.selected?.length) return `Selecciona una opción en: ${question.label}`
    } else if (!value?.file && !value?.existingFiles?.length) {
      return `Adjunta un archivo en: ${question.label}`
    }
  }
  return null
}

export type InscriptionAnswerDraft = {
  text?: string
  selected?: string[]
  file?: File | null
  existingFiles?: DriveFileLink[]
}

export function emptyDraft(questions: InscriptionQuestion[]): Record<string, InscriptionAnswerDraft> {
  const draft: Record<string, InscriptionAnswerDraft> = {}
  for (const question of questions) {
    draft[question.id] = { text: "", selected: [], file: null, existingFiles: [] }
  }
  return draft
}

export function draftFromAnswers(
  questions: InscriptionQuestion[],
  answers?: InscriptionAnswer[],
): Record<string, InscriptionAnswerDraft> {
  const draft = emptyDraft(questions)
  const byId = new Map((answers || []).map((answer) => [answer.questionId, answer]))
  for (const question of questions) {
    const answer = byId.get(question.id)
    if (!answer) continue
    draft[question.id] = {
      text: answer.text || "",
      selected: answer.selected || [],
      file: null,
      existingFiles: answer.files || [],
    }
  }
  return draft
}

export function toStoredAnswers(answers: InscriptionAnswer[]): InscriptionAnswer[] {
  return answers.map((answer) => {
    const stored: InscriptionAnswer = {
      questionId: answer.questionId,
      label: answer.label,
      type: answer.type,
    }
    if (answer.text) stored.text = answer.text
    if (answer.selected?.length) stored.selected = answer.selected
    if (answer.files?.length) {
      stored.files = answer.files.map((file) => {
        const storedFile: DriveFileLink = {
          fileId: file.fileId,
          name: file.name,
          mimeType: file.mimeType,
          webViewLink: file.webViewLink,
        }
        if (file.webContentLink) storedFile.webContentLink = file.webContentLink
        return storedFile
      })
    }
    return stored
  })
}

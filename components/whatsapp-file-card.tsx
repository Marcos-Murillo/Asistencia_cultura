"use client"

import { FileAudio, FileText, FileVideo, ImageIcon } from "lucide-react"
import type { DriveFileLink } from "@/lib/types"

export function drivePreviewUrl(file: DriveFileLink) {
  if (file.fileId) return `https://drive.google.com/file/d/${file.fileId}/preview`
  return file.webViewLink
}

export function driveDownloadUrl(file: DriveFileLink) {
  if (file.fileId) return `https://drive.google.com/uc?export=download&id=${file.fileId}`
  return file.webContentLink || file.webViewLink
}

function fileKind(file: DriveFileLink) {
  const mime = file.mimeType || ""
  const name = (file.name || "").toLowerCase()
  if (mime.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif)$/.test(name)) return "image"
  if (mime.startsWith("audio/") || /\.(mp3|wav|ogg|m4a|aac)$/.test(name)) return "audio"
  if (mime.startsWith("video/") || /\.(mp4|webm|mov)$/.test(name)) return "video"
  if (mime.includes("pdf") || name.endsWith(".pdf")) return "pdf"
  return "file"
}

const KIND_STYLES = {
  pdf: { badge: "PDF", badgeClass: "bg-red-500", bubble: "bg-[#dcf8c6]" },
  image: { badge: "IMG", badgeClass: "bg-sky-500", bubble: "bg-[#dcf8c6]" },
  audio: { badge: "AUD", badgeClass: "bg-amber-500", bubble: "bg-[#dcf8c6]" },
  video: { badge: "MOV", badgeClass: "bg-slate-600", bubble: "bg-[#dcf8c6]" },
  file: { badge: "DOC", badgeClass: "bg-violet-500", bubble: "bg-[#dcf8c6]" },
} as const

const KIND_ICONS = {
  pdf: FileText,
  image: ImageIcon,
  audio: FileAudio,
  video: FileVideo,
  file: FileText,
}

interface WhatsAppFileCardProps {
  file: DriveFileLink
  onView: () => void
}

export function WhatsAppFileCard({ file, onView }: WhatsAppFileCardProps) {
  const kind = fileKind(file)
  const style = KIND_STYLES[kind]
  const Icon = KIND_ICONS[kind]
  const extension = (file.name.split(".").pop() || kind).toUpperCase()

  return (
    <div className={`max-w-sm overflow-hidden rounded-2xl ${style.bubble} p-2 shadow-sm`}>
      <div className="flex items-center gap-3 rounded-xl bg-white/90 p-3">
        <div className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg text-white ${style.badgeClass}`}>
          <Icon className="h-4 w-4" />
          <span className="text-[10px] font-bold leading-none">{style.badge}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{file.name}</p>
          <p className="text-xs text-slate-500">{extension} · {file.mimeType || "archivo"}</p>
        </div>
      </div>
      <div className="flex items-center justify-between px-3 py-2">
        <button
          type="button"
          onClick={onView}
          className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
        >
          Ver
        </button>
        <a
          href={driveDownloadUrl(file)}
          download={file.name}
          className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
        >
          Guardar como...
        </a>
      </div>
    </div>
  )
}

export function FilePreviewPanel({
  file,
  onClose,
}: {
  file: DriveFileLink
  onClose: () => void
}) {
  const kind = fileKind(file)
  const src = file.webContentLink || drivePreviewUrl(file)

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-violet-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-4 text-white">
        <p className="truncate font-semibold">{file.name}</p>
        <div className="flex shrink-0 items-center gap-2">
          <a
            href={driveDownloadUrl(file)}
            download={file.name}
            className="rounded-full bg-white/20 px-3 py-1 text-sm font-medium hover:bg-white/30"
          >
            Descargar
          </a>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/20 px-3 py-1 text-sm font-medium hover:bg-white/30"
          >
            Cerrar
          </button>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center bg-slate-950/90 p-4">
        {kind === "image" ? (
          <img src={src} alt={file.name} className="max-h-full max-w-full rounded-xl object-contain" />
        ) : kind === "audio" ? (
          <audio className="w-full" controls src={src} />
        ) : kind === "video" ? (
          <video className="max-h-full max-w-full rounded-xl" controls src={src} />
        ) : (
          <iframe title={file.name} src={drivePreviewUrl(file)} className="h-full min-h-[420px] w-full rounded-xl bg-white" />
        )}
      </div>
    </div>
  )
}

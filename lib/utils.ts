import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNombre(nombre: string): string {
  return nombre?.toUpperCase() ?? ""
}

/** Comparador alfabético por `nombres` (español, sin distinguir mayúsculas). */
export function compareByNombres(
  a: { nombres?: string },
  b: { nombres?: string }
): number {
  return (a.nombres ?? "").localeCompare(b.nombres ?? "", "es", { sensitivity: "base" })
}

/** Devuelve una copia ordenada A→Z por nombre. */
export function sortUsersByNombres<T extends { nombres?: string }>(users: T[]): T[] {
  return [...users].sort(compareByNombres)
}

/** YYYY-MM-DD en zona horaria local (evita desfaces por UTC). */
export function toLocalDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/** Interpreta YYYY-MM-DD como mediodía local. */
export function parseLocalDateKey(value: string): Date {
  const [y, m, d] = value.split("-").map(Number)
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0, 0)
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return toLocalDateKey(a) === toLocalDateKey(b)
}

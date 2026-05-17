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

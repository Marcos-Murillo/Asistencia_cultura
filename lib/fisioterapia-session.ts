"use client"

import { useEffect, useState } from "react"
import type { FisioterapiaActor } from "@/lib/fisioterapia-permissions"

export function getFisioActor(): FisioterapiaActor | null {
  if (typeof window === "undefined") return null
  const role = sessionStorage.getItem("userRole")
  const userId = sessionStorage.getItem("userId")
  const nombres = sessionStorage.getItem("userName") || ""
  if (!userId) return null
  if (role === "FISIOTERAPEUTA") {
    return {
      kind: "fisioterapeuta",
      userId,
      nombres,
      esEncargado: sessionStorage.getItem("esFisioterapeutaEncargado") === "true",
    }
  }
  if (role === "DIRECTOR" || role === "MONITOR" || role === "ENTRENADOR") {
    return { kind: "entrenador", userId, nombres }
  }
  return null
}

export function requireFisioSession() {
  if (typeof window === "undefined") return null
  const userType = sessionStorage.getItem("userType")
  const role = sessionStorage.getItem("userRole")
  if (userType !== "manager" || role !== "FISIOTERAPEUTA") return null
  return getFisioActor()
}

export function useFisioActor() {
  const [actor, setActor] = useState<FisioterapiaActor | null>(null)
  useEffect(() => {
    setActor(requireFisioSession())
  }, [])
  return actor
}

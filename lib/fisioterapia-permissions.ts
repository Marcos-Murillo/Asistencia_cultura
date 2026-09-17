import type { UserRole } from "./types"

export type FisioterapiaActor =
  | {
      kind: "fisioterapeuta"
      userId: string
      nombres: string
      esEncargado: boolean
    }
  | {
      kind: "entrenador"
      userId: string
      nombres: string
    }

export function getFisioterapiaPermissions(actor: FisioterapiaActor) {
  if (actor.kind === "entrenador") {
    return {
      canCreateSolicitud: true,
      canViewOwnSolicitudes: true,
      canViewAllSolicitudes: false,
      canAssignSolicitudes: false,
      canUpdateAssignedSolicitud: false,
      canViewOwnBitacora: false,
      canViewAllBitacoras: false,
      canCreateBitacora: false,
      canEditOwnBitacora: false,
      canViewAthletes: false,
      canManageSeguimientos: false,
      canViewAllSeguimientos: false,
      canExportOwnBitacora: false,
      canExportAllBitacoras: false,
      canViewTeam: false,
      canViewReports: false,
    }
  }

  return {
    canCreateSolicitud: false,
    canViewOwnSolicitudes: true,
    canViewAllSolicitudes: actor.esEncargado,
    canAssignSolicitudes: actor.esEncargado,
    canUpdateAssignedSolicitud: true,
    canViewOwnBitacora: true,
    canViewAllBitacoras: actor.esEncargado,
    canCreateBitacora: true,
    canEditOwnBitacora: true,
    canViewAthletes: true,
    canManageSeguimientos: true,
    canViewAllSeguimientos: actor.esEncargado,
    canExportOwnBitacora: true,
    canExportAllBitacoras: actor.esEncargado,
    canViewTeam: actor.esEncargado,
    canViewReports: actor.esEncargado,
  }
}

export function assertPermission(
  actor: FisioterapiaActor,
  key: keyof ReturnType<typeof getFisioterapiaPermissions>,
) {
  const permissions = getFisioterapiaPermissions(actor)
  if (!permissions[key]) {
    throw new Error("No tienes permiso para realizar esta acción")
  }
}

export function isStaffRole(role: UserRole | string | undefined) {
  return role === "DIRECTOR" || role === "MONITOR" || role === "ENTRENADOR"
}

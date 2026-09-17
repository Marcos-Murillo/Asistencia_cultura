import { describe, expect, test } from "@jest/globals"
import { getFisioterapiaPermissions } from "../fisioterapia-permissions"

describe("Fisioterapia permissions", () => {
  test("entrenador can create and view own requests but not clinical logs", () => {
    const perms = getFisioterapiaPermissions({
      kind: "entrenador",
      userId: "e1",
      nombres: "Coach",
    })
    expect(perms.canCreateSolicitud).toBe(true)
    expect(perms.canViewAllSolicitudes).toBe(false)
    expect(perms.canViewOwnBitacora).toBe(false)
    expect(perms.canAssignSolicitudes).toBe(false)
  })

  test("fisioterapeuta sees own log and assigned work", () => {
    const perms = getFisioterapiaPermissions({
      kind: "fisioterapeuta",
      userId: "f1",
      nombres: "Fisio",
      esEncargado: false,
    })
    expect(perms.canCreateBitacora).toBe(true)
    expect(perms.canViewAllBitacoras).toBe(false)
    expect(perms.canAssignSolicitudes).toBe(false)
    expect(perms.canExportAllBitacoras).toBe(false)
    expect(perms.canViewAthletes).toBe(true)
  })

  test("encargado can assign, audit all logs and export", () => {
    const perms = getFisioterapiaPermissions({
      kind: "fisioterapeuta",
      userId: "f2",
      nombres: "Jefe",
      esEncargado: true,
    })
    expect(perms.canViewAllSolicitudes).toBe(true)
    expect(perms.canAssignSolicitudes).toBe(true)
    expect(perms.canViewAllBitacoras).toBe(true)
    expect(perms.canExportAllBitacoras).toBe(true)
    expect(perms.canViewTeam).toBe(true)
  })
})

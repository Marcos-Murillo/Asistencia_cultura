/**
 * Comprueba que el proyecto de imágenes arranca aparte de Cultura y Deporte
 * y que se puede leer el índice de enlaces.
 *
 * Usage: npx tsx scripts/validate-images-connection.ts
 */

import { config } from "dotenv"
import { resolve } from "path"

config({ path: resolve(process.cwd(), ".env.local") })

async function main() {
  const { getFirestoreForArea, getImagesFirestore, validateEnvironmentVariables } = await import(
    "../lib/firebase-config"
  )
  const { pingImagesDatabase, verifyImagesWriteAccess, userImageKey, groupImageKey, avatarDocId } = await import(
    "../lib/image-links"
  )

  const validation = validateEnvironmentVariables()
  if (!validation.valid) {
    console.error("Faltan variables:", validation.missing.join(", "))
    process.exit(1)
  }

  const cultura = getFirestoreForArea("cultura")
  const deporte = getFirestoreForArea("deporte")
  const imagenes = getImagesFirestore()

  if (imagenes === cultura || imagenes === deporte) {
    throw new Error("La base de imágenes comparte instancia con Cultura o Deporte")
  }
  if (imagenes.app.name !== "imagenes") {
    throw new Error(`La app de imágenes se llamó "${imagenes.app.name}"`)
  }

  const ping = await pingImagesDatabase()
  if (ping.projectId !== process.env.NEXT_PUBLIC_FIREBASE_IMAGENES_PROJECT_ID) {
    throw new Error(`Proyecto inesperado: ${ping.projectId}`)
  }

  const sampleUser = userImageKey("deporte", "usuario-1")
  const sampleGroup = groupImageKey("deporte", "Natación")
  const sampleAvatar = avatarDocId("cultura", "usuario-1")
  if (sampleUser !== "deporte__usuario-1" || sampleGroup !== "deporte__Natación" || sampleAvatar !== "avatar__cultura__usuario-1") {
    throw new Error("Las claves de enlace no coinciden con área + usuario/grupo")
  }

  await verifyImagesWriteAccess()

  console.log(`Imágenes conectadas: ${ping.projectId} (app ${imagenes.app.name})`)
  console.log("Enlace de prueba:", { sampleUser, sampleGroup, sampleAvatar })
  console.log("Firestore guarda la imagen como texto o enlace, y se limpió la prueba")
  process.exit(0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

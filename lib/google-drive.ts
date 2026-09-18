import { existsSync, readFileSync, writeFileSync } from "fs"
import path from "path"
import { google } from "googleapis"

const DRIVE_UPLOAD_PREFIX = "https://www.googleapis.com/upload/drive/"
const OAUTH_TOKEN_FILE = path.join(process.cwd(), "secrets.drive-oauth.json")
const DRIVE_SCOPES = ["https://www.googleapis.com/auth/drive"]

function getFolderId() {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID
  if (!folderId) {
    throw new Error("Falta GOOGLE_DRIVE_FOLDER_ID")
  }
  return folderId
}

export function getDriveFolderId() {
  return getFolderId()
}

function getOAuthRedirectUri() {
  return process.env.GOOGLE_OAUTH_REDIRECT_URI || "http://localhost:3000/api/drive/oauth/callback"
}

export function getOAuth2Client() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error("Faltan GOOGLE_OAUTH_CLIENT_ID o GOOGLE_OAUTH_CLIENT_SECRET")
  }
  return new google.auth.OAuth2(clientId, clientSecret, getOAuthRedirectUri())
}

export function getStoredRefreshToken() {
  if (process.env.GOOGLE_DRIVE_REFRESH_TOKEN) {
    return process.env.GOOGLE_DRIVE_REFRESH_TOKEN
  }
  try {
    if (!existsSync(OAUTH_TOKEN_FILE)) return ""
    const parsed = JSON.parse(readFileSync(OAUTH_TOKEN_FILE, "utf8")) as { refresh_token?: string }
    return parsed.refresh_token || ""
  } catch {
    return ""
  }
}

export function saveRefreshToken(refreshToken: string) {
  writeFileSync(OAUTH_TOKEN_FILE, JSON.stringify({ refresh_token: refreshToken }, null, 2), "utf8")
}

export function isDriveOAuthReady() {
  return Boolean(getStoredRefreshToken())
}

export function createDriveAuthUrl() {
  const oauth = getOAuth2Client()
  return oauth.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: DRIVE_SCOPES,
  })
}

function getAuthClient() {
  const refreshToken = getStoredRefreshToken()
  if (refreshToken) {
    const oauth = getOAuth2Client()
    oauth.setCredentials({ refresh_token: refreshToken })
    return oauth
  }

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n")
  if (clientEmail && privateKey) {
    return new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/drive"],
    })
  }

  throw new Error("Google Drive no está conectado. Abre /conectar-drive con la cuenta dueña de la carpeta.")
}

async function getAccessToken() {
  const auth = getAuthClient()
  const token = await auth.getAccessToken()
  const value = typeof token === "string" ? token : token?.token
  if (!value) {
    throw new Error("No se pudo autenticar con Google Drive")
  }
  return value
}

function quotaErrorMessage(detail: string) {
  if (/storageQuotaExceeded|Service Accounts do not have storage quota|403/i.test(detail)) {
    return "Google Drive rechazó la subida por cuota (403). La cuenta de servicio no tiene espacio en Drive personal. Conecta tu Gmail en /conectar-drive y vuelve a intentar."
  }
  return detail
}

export async function startResumableUpload(params: {
  fileName: string
  mimeType: string
  size: number
  parentFolderId?: string
}): Promise<string> {
  const folderId = params.parentFolderId || getFolderId()
  const accessToken = await getAccessToken()
  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true&fields=id,name,mimeType,webViewLink,webContentLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": params.mimeType,
        "X-Upload-Content-Length": String(params.size),
      },
      body: JSON.stringify({
        name: params.fileName,
        parents: [folderId],
      }),
    },
  )

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(quotaErrorMessage(`No se pudo iniciar la subida a Drive (${response.status}): ${detail.slice(0, 400)}`))
  }

  const sessionUri = response.headers.get("location")
  if (!sessionUri) {
    throw new Error("Google Drive no devolvió la sesión de subida")
  }
  return sessionUri
}

export function assertDriveSessionUri(uri: string) {
  if (!uri.startsWith(DRIVE_UPLOAD_PREFIX)) {
    throw new Error("Sesión de subida inválida")
  }
}

export async function proxyDriveChunk(params: {
  sessionUri: string
  body: Buffer
  contentRange: string
  contentType: string
}) {
  assertDriveSessionUri(params.sessionUri)
  return fetch(params.sessionUri, {
    method: "PUT",
    headers: {
      "Content-Range": params.contentRange,
      "Content-Type": params.contentType,
    },
    body: params.body,
  })
}

export async function publishDriveFile(fileId: string) {
  const drive = google.drive({ version: "v3", auth: getAuthClient() })
  const file = await drive.files.get({
    fileId,
    fields: "id, name, mimeType, webViewLink, webContentLink, parents",
    supportsAllDrives: true,
  })

  if (!file.data.id) {
    throw new Error("No se encontró el archivo en Drive")
  }

  const underRoot = await isFileUnderRootFolder(file.data.id)
  if (!underRoot) {
    throw new Error("El archivo no pertenece a la carpeta de inscripciones")
  }

  try {
    await drive.permissions.create({
      fileId,
      requestBody: { role: "reader", type: "anyone" },
      supportsAllDrives: true,
    })
  } catch (error) {
    console.warn("[google-drive] No se pudo hacer el archivo público con enlace:", error)
  }

  const published = await drive.files.get({
    fileId,
    fields: "id, name, mimeType, webViewLink, webContentLink",
    supportsAllDrives: true,
  })

  return {
    fileId: published.data.id!,
    name: published.data.name || file.data.name || "archivo",
    mimeType: published.data.mimeType || file.data.mimeType || "application/octet-stream",
    webViewLink: published.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
    webContentLink: published.data.webContentLink || undefined,
  }
}

export function safeDriveFileName(original: string) {
  const cleaned = original.replace(/[^\w.\- ()áéíóúÁÉÍÓÚñÑ]/g, "_").slice(0, 80)
  return cleaned || "archivo"
}

const FOLDER_MIME = "application/vnd.google-apps.folder"

export function safeDriveFolderName(original: string) {
  return original.replace(/[\\/]/g, "-").replace(/\s+/g, " ").trim().slice(0, 120) || "sin-nombre"
}

function escapeDriveQueryValue(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")
}

async function isFileUnderRootFolder(fileId: string) {
  const rootId = getFolderId()
  const drive = google.drive({ version: "v3", auth: getAuthClient() })
  let currentId = fileId
  for (let depth = 0; depth < 6; depth++) {
    if (currentId === rootId) return true
    const current = await drive.files.get({
      fileId: currentId,
      fields: "id, parents",
      supportsAllDrives: true,
    })
    const parentId = current.data.parents?.[0]
    if (!parentId) return false
    if (parentId === rootId) return true
    currentId = parentId
  }
  return false
}

export async function driveFolderExists(folderId: string) {
  try {
    const drive = google.drive({ version: "v3", auth: getAuthClient() })
    const folder = await drive.files.get({
      fileId: folderId,
      fields: "id, trashed, mimeType",
      supportsAllDrives: true,
    })
    return Boolean(folder.data.id) && folder.data.mimeType === FOLDER_MIME && !folder.data.trashed
  } catch {
    return false
  }
}

async function findChildFolder(parentId: string, name: string) {
  const drive = google.drive({ version: "v3", auth: getAuthClient() })
  const result = await drive.files.list({
    q: `mimeType='${FOLDER_MIME}' and name='${escapeDriveQueryValue(name)}' and '${parentId}' in parents and trashed=false`,
    fields: "files(id, name)",
    pageSize: 1,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  })
  return result.data.files?.[0]?.id || ""
}

export async function createDriveFolder(parentId: string, name: string) {
  const drive = google.drive({ version: "v3", auth: getAuthClient() })
  const created = await drive.files.create({
    requestBody: {
      name,
      mimeType: FOLDER_MIME,
      parents: [parentId],
    },
    fields: "id, name",
    supportsAllDrives: true,
  })
  if (!created.data.id) {
    throw new Error("No se pudo crear la carpeta en Drive")
  }
  return created.data.id
}

export async function ensureNamedFolder(parentId: string, name: string) {
  const safeName = safeDriveFolderName(name)
  const existing = await findChildFolder(parentId, safeName)
  if (existing) return existing
  return createDriveFolder(parentId, safeName)
}

export async function renameDriveFolder(folderId: string, name: string) {
  const drive = google.drive({ version: "v3", auth: getAuthClient() })
  await drive.files.update({
    fileId: folderId,
    requestBody: { name: safeDriveFolderName(name) },
    supportsAllDrives: true,
  })
}

export async function ensureEventAndUserFolders(params: {
  eventId: string
  eventName: string
  existingEventFolderId?: string
  userId: string
  userName: string
  userDocument?: string
}) {
  const rootId = getFolderId()
  let eventFolderId = params.existingEventFolderId || ""
  if (eventFolderId && !(await driveFolderExists(eventFolderId))) {
    eventFolderId = ""
  }
  if (!eventFolderId) {
    const preferred = safeDriveFolderName(params.eventName)
    const nameTaken = await findChildFolder(rootId, preferred)
    eventFolderId = await createDriveFolder(
      rootId,
      nameTaken ? `${preferred} (${params.eventId.slice(0, 8)})` : preferred,
    )
  }

  const userFolderName = `${params.userName} - ${params.userDocument || params.userId}`
  const userFolderId = await ensureNamedFolder(eventFolderId, userFolderName)
  return { eventFolderId, userFolderId }
}

"use client"

import { useState, useEffect, useRef } from "react"
import { GlobalHeader } from "@/components/global-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Send, Loader2, Shield, Database, Sparkles, Copy, Check, Volume2, VolumeX } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
} from "@/components/ui/conversation"
import { Message, MessageContent } from "@/components/ui/message"
import { Response } from "@/components/ui/response"
import { Orb } from "@/components/ui/orb"
import { cn } from "@/lib/utils"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  resultsCount?: number
  timestamp: Date
  audioBase64?: string // 🔊 Audio de ElevenLabs
}

const EXAMPLE_QUESTIONS = [
  "¿Cuántas asistencias hay hoy?",
  "¿Estudiantes de comunicación social en Salsa?",
  "¿Quién está inscrito en Danza?",
  "¿Usuarios llamados Juan?",
  "¿Cuántos estudiantes hay por facultad?",
  "¿Eventos activos?",
]

export default function ChatPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [conversationHistory, setConversationHistory] = useState<any[]>([])
  const [textInput, setTextInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [agentState, setAgentState] = useState<"idle" | "thinking" | "responding">("idle")
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Verificar si es Super Admin
    const userType = sessionStorage.getItem("userType")
    const superAdminStatus = userType === "superadmin"
    
    setIsSuperAdmin(superAdminStatus)
    setIsVerifying(false)

    if (!superAdminStatus) {
      setTimeout(() => {
        router.push("/")
      }, 2000)
    }
    
    // Cargar historial del localStorage
    const savedHistory = localStorage.getItem('chatHistory')
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory)
        setConversationHistory(parsed)
      } catch (e) {
        console.error("Error cargando historial:", e)
      }
    }

    // Limpiar audio al desmontar
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
        currentAudioRef.current = null
      }
    }
  }, [router])

  const handleSendMessage = async () => {
    if (!textInput.trim() || isLoading || !isSuperAdmin) return

    const userMessage: ChatMessage = {
      role: "user",
      content: textInput.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setTextInput("")
    setIsLoading(true)
    setAgentState("thinking")

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          isSuperAdmin: true,
          conversationHistory,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.error || "Error en la consulta")
      }

      setAgentState("responding")

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.response,
        resultsCount: data.resultsCount,
        timestamp: new Date(),
        audioBase64: data.audioBase64, // 🔊 Audio
      }

      setMessages(prev => [...prev, assistantMessage])
      
      // 🔊 Reproducir audio automáticamente si existe
      if (data.audioBase64) {
        playAudio(data.audioBase64)
      }
      
      // Actualizar historial
      if (data.conversationHistory) {
        setConversationHistory(data.conversationHistory)
        localStorage.setItem('chatHistory', JSON.stringify(data.conversationHistory))
      }
    } catch (error: any) {
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: `❌ Error: ${error.message}\n\nIntenta reformular tu pregunta o usa uno de los ejemplos sugeridos.`,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setAgentState("idle")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const clearHistory = () => {
    setConversationHistory([])
    setMessages([])
    localStorage.removeItem('chatHistory')
  }

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const playAudio = (audioBase64: string) => {
    try {
      // Detener audio anterior si existe
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
        currentAudioRef.current = null
      }

      const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`)
      currentAudioRef.current = audio
      
      audio.onplay = () => setIsPlayingAudio(true)
      audio.onended = () => {
        setIsPlayingAudio(false)
        currentAudioRef.current = null
      }
      audio.onerror = () => {
        setIsPlayingAudio(false)
        currentAudioRef.current = null
      }
      
      audio.play().catch(err => {
        console.log("No se pudo reproducir audio:", err)
        setIsPlayingAudio(false)
        currentAudioRef.current = null
      })
    } catch (err) {
      console.log("Error reproduciendo audio:", err)
      setIsPlayingAudio(false)
    }
  }

  const stopAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
      currentAudioRef.current = null
      setIsPlayingAudio(false)
    }
  }

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    )
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
            <p className="text-gray-600 mb-4">
              Esta funcionalidad está disponible solo para Super Administradores.
            </p>
            <p className="text-sm text-gray-500">Redirigiendo...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Card className="mx-auto flex h-[calc(100vh-180px)] w-full flex-col gap-0 overflow-hidden shadow-2xl">
          <CardHeader className="flex shrink-0 flex-row items-center justify-between border-b pb-4">
            <div className="flex items-center gap-4">
              <div className="ring-border relative size-12 overflow-hidden rounded-full ring-2 ring-purple-200">
                <Orb
                  className="h-full w-full"
                  agentState={agentState === "thinking" || agentState === "responding" ? "talking" : null}
                />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-base leading-none font-semibold text-gray-900">
                  Chat IA - Consultas Firestore
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-purple-600 text-xs">
                    <Shield className="w-3 h-3 mr-1" />
                    Super Admin
                  </Badge>
                  <Badge variant="outline" className="border-blue-300 text-blue-700 text-xs">
                    <Database className="w-3 h-3 mr-1" />
                    Firestore
                  </Badge>
                  <Badge variant="outline" className="border-green-300 text-green-700 text-xs">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Groq AI (Gratis)
                  </Badge>
                  <Badge variant="outline" className="border-orange-300 text-orange-700 text-xs">
                    <Volume2 className="w-3 h-3 mr-1" />
                    Voz Española
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isPlayingAudio && (
                <Button
                  onClick={stopAudio}
                  variant="outline"
                  size="sm"
                  className="text-xs bg-red-50 hover:bg-red-100 border-red-300 text-red-700"
                >
                  <VolumeX className="w-3 h-3 mr-1" />
                  Detener Audio
                </Button>
              )}
              {conversationHistory.length > 0 && (
                <Button
                  onClick={clearHistory}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Limpiar ({conversationHistory.length})
                </Button>
              )}
              <div
                className={cn(
                  "flex h-2 w-2 rounded-full transition-all duration-300",
                  agentState !== "idle" && "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse"
                )}
              />
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-hidden p-0">
            <Conversation className="h-full">
              <ConversationContent className="flex min-w-0 flex-col gap-4">
                {messages.length === 0 ? (
                  <ConversationEmptyState
                    icon={<Orb className="size-16" />}
                    title="¡Bienvenido al Chat IA!"
                    description="Haz preguntas sobre usuarios, grupos, asistencias y eventos en lenguaje natural"
                  />
                ) : (
                  messages.map((message, index) => (
                    <div key={index} className="flex w-full flex-col gap-1">
                      <Message from={message.role}>
                        <MessageContent className="max-w-[85%]">
                          <Response
                            className={cn(
                              "whitespace-pre-wrap break-words",
                              message.role === "user"
                                ? "bg-purple-600 text-white ml-auto"
                                : "bg-gray-100 text-gray-900"
                            )}
                          >
                            {message.content}
                            {message.resultsCount !== undefined && message.resultsCount > 0 && (
                              <div className="mt-2 text-xs opacity-75 flex items-center gap-1">
                                <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                                {message.resultsCount} resultados
                              </div>
                            )}
                          </Response>
                          <div className="text-xs text-gray-400 px-1">
                            {message.timestamp.toLocaleTimeString("es-CO", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </MessageContent>
                        {message.role === "assistant" && (
                          <div className="ring-border size-8 flex-shrink-0 self-end overflow-hidden rounded-full ring-1 ring-purple-200">
                            <Orb
                              className="h-full w-full"
                              agentState={
                                isLoading && index === messages.length - 1 ? "talking" : null
                              }
                            />
                          </div>
                        )}
                      </Message>
                      {message.role === "assistant" && (
                        <div className="flex items-center gap-1 ml-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            onClick={() => copyToClipboard(message.content, index)}
                          >
                            {copiedIndex === index ? (
                              <>
                                <Check className="w-3 h-3 mr-1" />
                                Copiado
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 mr-1" />
                                Copiar
                              </>
                            )}
                          </Button>
                          {message.audioBase64 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              onClick={() => playAudio(message.audioBase64!)}
                            >
                              <Volume2 className="w-3 h-3 mr-1" />
                              Escuchar
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}

                {isLoading && (
                  <Message from="assistant">
                    <MessageContent className="max-w-[85%]">
                      <Response className="bg-gray-100 text-gray-900 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                        <span>Consultando base de datos...</span>
                      </Response>
                    </MessageContent>
                    <div className="ring-border size-8 flex-shrink-0 self-end overflow-hidden rounded-full ring-1 ring-purple-200">
                      <Orb className="h-full w-full" agentState="talking" />
                    </div>
                  </Message>
                )}
              </ConversationContent>
            </Conversation>
          </CardContent>

          <CardFooter className="shrink-0 border-t bg-white/50 backdrop-blur-sm">
            <div className="flex w-full items-center gap-2">
              <Input
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu pregunta aquí..."
                className="h-10 flex-1 focus-visible:ring-purple-500"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                size="icon"
                className="rounded-full bg-purple-600 hover:bg-purple-700 h-10 w-10"
                disabled={!textInput.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                <span className="sr-only">Enviar mensaje</span>
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Ejemplos de preguntas */}
        {messages.length === 0 && (
          <div className="mt-6">
            <p className="text-sm font-medium text-gray-700 mb-3 text-center">
              Ejemplos de preguntas:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {EXAMPLE_QUESTIONS.map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => setTextInput(question)}
                  className="text-left p-3 rounded-lg bg-white/80 hover:bg-white transition-all text-sm text-gray-700 border border-purple-200 hover:border-purple-400 hover:shadow-md"
                >
                  💬 {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 mt-4">
          <p>
            🔐 Solo Super Admin • 🔥 Firebase Firestore • 🤖 Groq AI (Gratis) • 🔊 Voz Española • 🇨🇴 Respuestas en Español
          </p>
        </div>
      </div>
    </div>
  )
}

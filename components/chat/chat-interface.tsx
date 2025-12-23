"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { createChatSession, updateChatSession, getChatSession, type ChatMessage } from "@/lib/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Send, Loader2, Bot, Sparkles, RotateCcw, Shield, Zap, Mic, MicOff } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SpeechRecognition } from "web-speech-api"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  isAnalyzing?: boolean
}

interface WebsiteData {
  url: string
  title: string
  chunks: string[]
  fullContent: string
}

const examplePrompts = [
  "What is this website about?",
  "What services are offered?",
  "How can I contact them?",
  "Summarize the key features",
]

interface ChatInterfaceProps {
  initialSessionId?: string
}

export function ChatInterface({ initialSessionId }: ChatInterfaceProps) {
  const { user } = useAuth()

  const [websiteData, setWebsiteData] = useState<WebsiteData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I'm Webot, your Web Intelligence AI. Share any website URL with me, and I'll analyze it to answer your questions. Just paste a link to get started!",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId || null)
  const [isRestoringSession, setIsRestoringSession] = useState(false)

  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        setSpeechSupported(true)
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = "en-US"

        recognitionRef.current.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map((result) => result[0])
            .map((result) => result.transcript)
            .join("")

          setInput(transcript)
        }

        recognitionRef.current.onend = () => {
          setIsListening(false)
        }

        recognitionRef.current.onerror = (event) => {
          console.error("Speech recognition error:", event.error)
          setIsListening(false)
        }
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) return

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  useEffect(() => {
    if (initialSessionId && user) {
      restoreSession(initialSessionId)
    }
  }, [initialSessionId, user])

  const restoreSession = async (id: string) => {
    setIsRestoringSession(true)
    try {
      const session = await getChatSession(id)
      if (session) {
        setWebsiteData({
          url: session.websiteUrl,
          title: session.websiteTitle,
          chunks: session.chunks || [],
          fullContent: session.fullContent || "",
        })

        const restoredMessages: Message[] = session.messages.map((msg, idx) => ({
          id: `restored-${idx}`,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp),
        }))

        setMessages([
          {
            id: "restored-welcome",
            role: "assistant",
            content: `Welcome back! Continuing your conversation about ${session.websiteTitle || session.websiteUrl}. Feel free to ask more questions.`,
            timestamp: new Date(),
          },
          ...restoredMessages,
        ])
        setSessionId(id)
      }
    } catch (error) {
      console.error("Failed to restore session:", error)
    } finally {
      setIsRestoringSession(false)
    }
  }

  const extractUrl = (text: string): string | null => {
    const urlRegex = /(https?:\/\/[^\s]+)/gi
    const matches = text.match(urlRegex)
    return matches ? matches[0] : null
  }

  const validateUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const processWebsite = async (url: string): Promise<{ success: boolean; title?: string; error?: string }> => {
    try {
      const scrapeResponse = await fetch("/api/scrape-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })

      if (!scrapeResponse.ok) {
        const errorData = await scrapeResponse.json()
        throw new Error(errorData.error || "Failed to process website")
      }

      const scrapeData = await scrapeResponse.json()

      const newWebsiteData = {
        url,
        title: scrapeData.title || url,
        chunks: scrapeData.chunks || [],
        fullContent: scrapeData.fullContent || "",
      }

      setWebsiteData(newWebsiteData)

      if (user) {
        createChatSession({
          userId: user.uid,
          websiteUrl: url,
          websiteTitle: scrapeData.title || url,
          messages: [],
          language: "en",
          // Don't store chunks and fullContent - they're too large and slow down Firebase
        })
          .then((newSessionId) => {
            setSessionId(newSessionId)
          })
          .catch((err) => {
            console.error("Failed to create session:", err)
          })
      }

      return { success: true, title: scrapeData.title || url }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to analyze website"
      return { success: false, error: errorMessage }
    }
  }

  const chatWithWebsite = async (question: string): Promise<string> => {
    if (!websiteData) {
      throw new Error("No website data available")
    }

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        url: websiteData.url,
        language: "en",
        chunks: websiteData.chunks,
        fullContent: websiteData.fullContent,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || data.error || "Failed to get response")
    }

    return data.answer
  }

  const saveMessagesToSession = (msgs: Message[]) => {
    if (!sessionId || !user) return

    const chatMessages: ChatMessage[] = msgs
      .filter((m) => m.id !== "welcome" && !m.id.startsWith("restored") && !m.isAnalyzing)
      .map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
      }))

    // Fire and forget - don't await
    updateChatSession(sessionId, chatMessages).catch((error) => {
      console.error("Failed to save messages:", error)
    })
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading || isProcessing) return

    // Stop listening if voice is active
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }

    const userInput = input.trim()
    const detectedUrl = extractUrl(userInput)

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userInput,
      timestamp: new Date(),
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput("")

    if (detectedUrl && validateUrl(detectedUrl)) {
      setIsProcessing(true)

      const analyzingMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Analyzing ${new URL(detectedUrl).hostname}...`,
        timestamp: new Date(),
        isAnalyzing: true,
      }
      setMessages((prev) => [...prev, analyzingMessage])

      const result = await processWebsite(detectedUrl)

      setMessages((prev) => prev.filter((m) => !m.isAnalyzing))

      if (result.success) {
        const successMessage: Message = {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content: `I've analyzed "${result.title}". I'm ready to answer any questions about this website. What would you like to know?`,
          timestamp: new Date(),
        }
        const updatedMessages = [...newMessages, successMessage]
        setMessages(updatedMessages)
        saveMessagesToSession(updatedMessages)
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content: `I wasn't able to analyze that website. ${result.error}. Please try another URL or check if the website is publicly accessible.`,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev.filter((m) => !m.isAnalyzing), errorMessage])
      }

      setIsProcessing(false)
      return
    }

    if (!websiteData) {
      const promptMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "Please share a website URL first so I can analyze it. Just paste any link like https://example.com and I'll extract all the information for you.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, promptMessage])
      return
    }

    setIsLoading(true)

    try {
      const answer = await chatWithWebsite(userInput)

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: answer,
        timestamp: new Date(),
      }

      const updatedMessages = [...newMessages, assistantMessage]
      setMessages(updatedMessages)
      saveMessagesToSession(updatedMessages)
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Something went wrong. Please try again."

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I encountered an issue: ${errorMsg}. Please try asking your question again.`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleExampleClick = (prompt: string) => {
    if (websiteData && !isLoading) {
      setInput(prompt)
      inputRef.current?.focus()
    }
  }

  const resetChat = () => {
    setWebsiteData(null)
    setSessionId(null)
    setMessages([
      {
        id: "reset",
        role: "assistant",
        content: "Ready for a new analysis! Share any website URL to get started.",
        timestamp: new Date(),
      },
    ])
  }

  if (isRestoringSession) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] items-center justify-center">
        <div className="relative">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
        <p className="text-muted-foreground mt-6 font-medium">Restoring your conversation...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="text-center mb-4 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-xl border border-border/50 bg-card/30">
          <div className="relative flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <span className="text-sm font-bold">
              {websiteData ? (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-foreground max-w-[200px] truncate">{new URL(websiteData.url).hostname}</span>
                </span>
              ) : (
                <span>
                  <span className="text-foreground">Web</span>
                  <span className="text-primary">ot</span>
                  <span className="text-muted-foreground ml-1.5">- Web Intelligence AI</span>
                </span>
              )}
            </span>

            {websiteData && (
              <button
                onClick={resetChat}
                className="ml-2 p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/30"
                title="Analyze New Website"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {!user && websiteData && (
          <p className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1.5">
            <Shield className="h-3 w-3" />
            <span>Sign in to save your conversation history</span>
          </p>
        )}
      </div>

      {/* Main Chat Card */}
      <Card className="flex-1 overflow-hidden border-border/50 bg-card/30 flex flex-col rounded-xl">
        {/* Window header with traffic lights */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30 bg-card/50">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="ml-3 text-sm text-muted-foreground">Webot AI - Website Analyzer</span>
          {websiteData && <span className="ml-auto text-xs text-green-500 font-medium">Ready</span>}
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3 animate-in fade-in slide-in-from-bottom-2",
                message.role === "user" ? "justify-end" : "justify-start",
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {message.role === "assistant" && (
                <div
                  className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center",
                    message.isAnalyzing && "animate-pulse",
                  )}
                >
                  {message.isAnalyzing ? (
                    <Loader2 className="h-4 w-4 text-primary animate-spin" />
                  ) : (
                    <Bot className="h-4 w-4 text-primary" />
                  )}
                </div>
              )}

              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-3 relative",
                  message.role === "user"
                    ? "bg-primary text-white rounded-br-md"
                    : "bg-card border border-border/50 text-foreground rounded-bl-md border-l-2 border-l-primary",
                )}
              >
                <p className="whitespace-pre-wrap leading-relaxed text-sm">{message.content}</p>
                <span className="text-[10px] opacity-50 mt-1.5 block">
                  {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>

              {message.role === "user" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                  U
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center animate-pulse">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-card rounded-2xl rounded-bl-md px-4 py-3 border border-border/50 border-l-2 border-l-primary">
                <div className="flex gap-1.5 items-center">
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span
                    className="w-2 h-2 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-2 h-2 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                  <span className="text-xs text-muted-foreground ml-2">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Example prompts */}
        {websiteData && messages.length < 4 && !isLoading && (
          <div className="px-5 pb-3 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs text-muted-foreground font-medium">Suggested questions:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {examplePrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleExampleClick(prompt)}
                  className="px-3 py-1.5 text-xs rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/20 hover:border-primary/40"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input area - Removed language selector, added mic button */}
        <div className="p-4 border-t border-border/30 bg-card/50">
          <div className="flex gap-3 items-center">
            {speechSupported && (
              <Button
                size="icon"
                variant="outline"
                onClick={toggleVoiceInput}
                className={cn(
                  "h-10 w-10 rounded-lg border-border transition-all",
                  isListening
                    ? "bg-primary text-white border-primary animate-pulse"
                    : "bg-background hover:bg-primary/10 hover:border-primary/50",
                )}
                title={isListening ? "Stop listening" : "Start voice input"}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            )}

            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                placeholder={
                  isListening
                    ? "Listening... speak now"
                    : websiteData
                      ? "Ask anything about the website..."
                      : "Paste a website URL to start..."
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={isLoading || isProcessing}
                className={cn(
                  "pr-12 bg-background border-border h-10 text-foreground placeholder:text-muted-foreground/50 rounded-lg",
                  isListening && "border-primary ring-2 ring-primary/20",
                )}
              />
              <Button
                size="icon"
                onClick={sendMessage}
                disabled={isLoading || isProcessing || !input.trim()}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 bg-primary hover:bg-primary/90 rounded-md"
              >
                {isLoading || isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {isListening && (
            <div className="mt-2 flex items-center justify-center gap-2 text-xs text-primary animate-pulse">
              <span className="w-2 h-2 bg-primary rounded-full animate-ping" />
              <span>Listening... speak your message</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { getChatSessions, deleteAllChatSessions, deleteChatSession, type ChatSession } from "@/lib/firestore"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Loader2,
  Trash2,
  MessageSquare,
  Globe,
  ExternalLink,
  History,
  ChevronDown,
  Search,
  PlayCircle,
  X,
  Clock,
  Sparkles,
} from "lucide-react"
import type { DocumentSnapshot } from "firebase/firestore"
import { cn } from "@/lib/utils"

const languageNames: Record<string, string> = {
  en: "English",
  hi: "हिन्दी",
  te: "తెలుగు",
}

export function ChatHistoryList() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()

  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")

  const loadSessions = async (isLoadMore = false) => {
    if (!user) return

    if (isLoadMore) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }

    try {
      const result = await getChatSessions(user.uid, 20, isLoadMore ? lastDoc || undefined : undefined)

      if (isLoadMore) {
        setSessions((prev) => [...prev, ...result.sessions])
      } else {
        setSessions(result.sessions)
      }

      setLastDoc(result.lastDoc)
      setHasMore(result.sessions.length === 20)
    } catch (error) {
      console.error("Failed to load sessions:", error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    loadSessions()
  }, [user])

  const handleDeleteAll = async () => {
    if (!user) return

    setDeleting(true)
    try {
      await deleteAllChatSessions(user.uid)
      setSessions([])
      setLastDoc(null)
      setHasMore(false)
    } catch (error) {
      console.error("Failed to delete sessions:", error)
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    setDeletingId(sessionId)
    try {
      await deleteChatSession(sessionId)
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
    } catch (error) {
      console.error("Failed to delete session:", error)
    } finally {
      setDeletingId(null)
    }
  }

  const handleContinueChat = (sessionId: string) => {
    router.push(`/chat?session=${sessionId}`)
  }

  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const formatTimestamp = (timestamp: Date | { toDate: () => Date }) => {
    const date = "toDate" in timestamp ? timestamp.toDate() : new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return `Today at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    } else if (days === 1) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    } else if (days < 7) {
      return `${days} days ago`
    } else {
      return new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
      }).format(date)
    }
  }

  const filteredSessions = sessions.filter((session) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      session.websiteUrl.toLowerCase().includes(query) ||
      session.websiteTitle?.toLowerCase().includes(query) ||
      session.messages.some((m) => m.content.toLowerCase().includes(query))
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="relative inline-block">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div className="absolute inset-0 blur-xl bg-primary/30 animate-pulse" />
          </div>
          <p className="text-muted-foreground mt-6 font-medium">Loading your conversations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/30 neon-glow-subtle">
            <History className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("history.title")}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {sessions.length} saved conversation{sessions.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-black/50 border-primary/20 focus:border-primary/40 w-full sm:w-[220px] h-10 rounded-xl input-glow"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {sessions.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon" disabled={deleting} className="shrink-0 h-10 w-10 rounded-xl">
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="glass-card border-primary/20">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-foreground">{t("history.confirmDelete")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all {sessions.length} conversation{sessions.length !== 1 ? "s" : ""}.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-primary/20">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAll} className="bg-destructive text-destructive-foreground">
                    Delete All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {filteredSessions.length === 0 ? (
        <Card className="glass-card border-primary/20 p-16 text-center">
          <div className="relative inline-block mb-6">
            <MessageSquare className="h-16 w-16 text-primary/30" />
            <div className="absolute inset-0 blur-2xl bg-primary/10" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {searchQuery ? "No Results Found" : "No Conversations Yet"}
          </h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            {searchQuery
              ? "Try adjusting your search terms to find what you're looking for."
              : "Start analyzing websites to build your conversation history."}
          </p>
          {!searchQuery && (
            <Button onClick={() => router.push("/chat")} className="neon-glow-subtle btn-glow">
              <Sparkles className="h-4 w-4 mr-2" />
              Start a New Conversation
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSessions.map((session, index) => (
              <Card
                key={session.id}
                className={cn(
                  "glass-card border-primary/10 overflow-hidden transition-all duration-300 hover:border-primary/30 card-hover group flex flex-col",
                  expandedItems.has(session.id!) && "md:col-span-2",
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="p-4 flex-1 flex flex-col">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 shrink-0 group-hover:neon-glow-subtle transition-all">
                        <Globe className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-foreground truncate text-sm">
                          {session.websiteTitle || new URL(session.websiteUrl).hostname}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">{new URL(session.websiteUrl).hostname}</p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                            disabled={deletingId === session.id}
                          >
                            {deletingId === session.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="glass-card border-primary/20">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-foreground">Delete this conversation?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete this conversation and all its messages.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-primary/20">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteSession(session.id!)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <button
                        onClick={() => toggleExpanded(session.id!)}
                        className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-primary/10"
                      >
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform duration-300",
                            expandedItems.has(session.id!) && "rotate-180",
                          )}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTimestamp(session.updatedAt as Date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {session.messages.length} msgs
                    </span>
                    <span className="text-primary/70 text-[10px] uppercase tracking-wider font-medium">
                      {languageNames[session.language] || session.language}
                    </span>
                  </div>

                  {/* Last message preview */}
                  <div className="bg-black/30 rounded-lg p-3 mb-3 flex-1">
                    <p className="text-xs text-muted-foreground mb-1 font-medium">Last message:</p>
                    <p className="text-sm text-foreground/80 line-clamp-2 leading-relaxed">
                      {session.messages[session.messages.length - 1]?.content || "No messages yet"}
                    </p>
                  </div>

                  {/* Expanded content */}
                  {expandedItems.has(session.id!) && (
                    <div className="border-t border-primary/10 pt-3 mt-auto animate-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-black/20 rounded-lg p-2 mb-3">
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        <a
                          href={session.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline truncate"
                        >
                          {session.websiteUrl}
                        </a>
                      </div>

                      {/* Recent messages */}
                      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 mb-3">
                        {session.messages.slice(-4).map((msg, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              "rounded-lg p-2.5 text-xs",
                              msg.role === "user"
                                ? "bg-primary/10 border border-primary/20 ml-6"
                                : "bg-card/50 border border-primary/10 mr-6",
                            )}
                          >
                            <p className="text-[10px] text-muted-foreground mb-1 font-semibold uppercase tracking-wider">
                              {msg.role === "user" ? "You" : "AI"}
                            </p>
                            <p className="text-foreground/90 line-clamp-2 leading-relaxed">{msg.content}</p>
                          </div>
                        ))}
                      </div>

                      {session.messages.length > 4 && (
                        <p className="text-[10px] text-muted-foreground text-center mb-2">
                          + {session.messages.length - 4} more messages
                        </p>
                      )}
                    </div>
                  )}

                  {/* Continue button */}
                  <Button
                    size="sm"
                    onClick={() => handleContinueChat(session.id!)}
                    className="w-full bg-primary hover:bg-primary/80 text-primary-foreground h-8 gap-1.5 rounded-lg neon-glow-subtle btn-glow mt-auto"
                  >
                    <PlayCircle className="h-3.5 w-3.5" />
                    Continue Chat
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {hasMore && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={() => loadSessions(true)}
                disabled={loadingMore}
                className="border-primary/30 hover:border-primary/50 hover:bg-primary/5 px-8"
              >
                {loadingMore ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ChevronDown className="h-4 w-4 mr-2" />
                )}
                {t("history.loadMore")}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

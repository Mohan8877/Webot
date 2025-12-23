"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { PageWrapper } from "@/components/layout/page-wrapper"
import { ChatInterface } from "@/components/chat/chat-interface"
import { Loader2 } from "lucide-react"

function ChatContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session")

  return <ChatInterface initialSessionId={sessionId || undefined} />
}

export default function ChatPage() {
  return (
    <PageWrapper>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
      >
        <ChatContent />
      </Suspense>
    </PageWrapper>
  )
}

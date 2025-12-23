"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { PageWrapper } from "@/components/layout/page-wrapper"
import { AuthForm } from "@/components/auth/auth-form"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && !loading) {
      router.push("/chat")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <PageWrapper>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageWrapper>
    )
  }

  if (user) {
    return null
  }

  return (
    <PageWrapper>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
        <AuthForm mode="login" />
      </div>
    </PageWrapper>
  )
}

"use client"

import Link from "next/link"
import { PageWrapper } from "@/components/layout/page-wrapper"
import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import { Home, AlertTriangle } from "lucide-react"

export default function NotFound() {
  const { t } = useLanguage()

  return (
    <PageWrapper>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-destructive/10 border border-destructive/30 mb-8">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>

          <h1 className="text-6xl sm:text-8xl font-bold text-primary neon-text mb-4">404</h1>

          <h2 className="text-2xl sm:text-3xl font-semibold mb-4">{t("404.title")}</h2>

          <p className="text-muted-foreground mb-8 max-w-md mx-auto">{t("404.description")}</p>

          <Link href="/">
            <Button size="lg" className="neon-glow-subtle hover:neon-glow">
              <Home className="mr-2 h-5 w-5" />
              {t("404.goHome")}
            </Button>
          </Link>
        </div>
      </div>
    </PageWrapper>
  )
}

"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react"

interface AuthFormProps {
  mode: "login" | "register"
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const { signIn, signUp, resetPassword } = useAuth()
  const { t } = useLanguage()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [resetSent, setResetSent] = useState(false)

  const validateForm = () => {
    if (!email) {
      setError(t("error.required"))
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t("error.invalidEmail"))
      return false
    }
    if (!password) {
      setError(t("error.required"))
      return false
    }
    if (password.length < 6) {
      setError(t("error.passwordMin"))
      return false
    }
    if (mode === "register" && password !== confirmPassword) {
      setError(t("error.passwordMatch"))
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!validateForm()) return

    setLoading(true)
    try {
      if (mode === "login") {
        await signIn(email, password)
      } else {
        await signUp(email, password)
      }
      router.push("/chat")
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t("error.generic")
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!email) {
      setError(t("error.invalidEmail"))
      return
    }

    setLoading(true)
    try {
      await resetPassword(email)
      setResetSent(true)
      setError("")
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t("error.generic")
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md bg-card/50 backdrop-blur-xl border-border/50 neon-border">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold neon-text">
          {mode === "login" ? t("auth.login") : t("auth.register")}
        </CardTitle>
        <CardDescription>
          {mode === "login" ? "Sign in to access your chatbots" : "Create an account to get started"}
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {resetSent && (
            <Alert className="border-primary/50 bg-primary/10">
              <Mail className="h-4 w-4" />
              <AlertDescription>Password reset email sent! Check your inbox.</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">{t("auth.email")}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-background/50 border-border focus:neon-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t("auth.password")}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 bg-background/50 border-border focus:neon-border"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {mode === "register" && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 bg-background/50 border-border focus:neon-border"
                />
              </div>
            </div>
          )}

          {mode === "login" && (
            <button type="button" onClick={handleResetPassword} className="text-sm text-primary hover:underline">
              {t("auth.forgotPassword")}
            </button>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            className="w-full neon-glow-subtle hover:neon-glow transition-all duration-300"
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "login" ? t("auth.login") : t("auth.register")}
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            {mode === "login" ? t("auth.noAccount") : t("auth.hasAccount")}{" "}
            <Link href={mode === "login" ? "/register" : "/login"} className="text-primary hover:underline">
              {mode === "login" ? t("auth.register") : t("auth.login")}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}

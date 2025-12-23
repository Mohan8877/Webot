"use client"

import Link from "next/link"
import { PageWrapper } from "@/components/layout/page-wrapper"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Globe, Shield, Zap, ArrowRight, Bot, Search, Brain, FileQuestion, Play, CheckCircle2 } from "lucide-react"

export default function HomePage() {
  const { t } = useLanguage()
  const { user } = useAuth()

  const features = [
    {
      icon: Search,
      title: "Deep Website Analysis",
      description: "Enter any URL and our AI reads every page, understanding the complete content structure.",
    },
    {
      icon: Brain,
      title: "Intelligent Q&A",
      description: "Ask anything about the website - pricing, features, contact info, policies, and more.",
    },
    {
      icon: Globe,
      title: "Multi-Language Support",
      description: "Get answers in English, Hindi, or Telugu. Switch languages without reloading.",
    },
    {
      icon: FileQuestion,
      title: "Accurate Responses Only",
      description: "AI answers strictly from website content. No made-up information, ever.",
    },
    {
      icon: Shield,
      title: "No Login Required",
      description: "Start analyzing websites immediately. Login only needed to save history.",
    },
    {
      icon: Zap,
      title: "Instant Processing",
      description: "Fast content extraction and smart indexing for quick, relevant answers.",
    },
  ]

  const steps = [
    { number: "01", title: "Paste URL", description: "Enter any public website URL" },
    { number: "02", title: "AI Analyzes", description: "Content is extracted and indexed" },
    { number: "03", title: "Ask Questions", description: "Get instant, accurate answers" },
  ]

  const useCases = [
    { query: "What products do they sell?", type: "E-commerce" },
    { query: "How can I contact support?", type: "Service" },
    { query: "What are the pricing plans?", type: "SaaS" },
    { query: "What technologies do they use?", type: "Tech" },
  ]

  return (
    <PageWrapper>
      <div className="relative min-h-screen">
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center justify-center px-4 overflow-hidden">
          {/* Subtle background gradient */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-primary/3 rounded-full blur-[150px]" />
          </div>

          <div className="max-w-5xl mx-auto text-center relative z-10">
            {/* Badge */}

            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-8 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700 leading-[1.1]">
              <span
                className="text-white drop-shadow-[0_0_20px_rgba(255,23,68,0.7)]"
                style={{
                  textShadow:
                    "0 0 10px rgba(255,23,68,0.5), 0 0 20px rgba(255,23,68,0.4), 0 0 40px rgba(255,23,68,0.3)",
                }}
              >
                Web
              </span>
              <span
                className="text-primary drop-shadow-[0_0_20px_rgba(255,255,255,0.6)]"
                style={{
                  textShadow:
                    "0 0 10px rgba(255,255,255,0.5), 0 0 20px rgba(255,255,255,0.4), 0 0 40px rgba(255,255,255,0.3)",
                }}
              >
                ot
              </span>
              <br />
              <span className="text-muted-foreground text-3xl sm:text-4xl md:text-5xl font-bold">
                Web Intelligence AI
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 leading-relaxed">
              Transform any website into an intelligent AI assistant. Paste a URL, ask questions, get instant accurate
              answers based only on the website content.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              <Link href="/chat">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-10 py-7 font-semibold group">
                  Start Analyzing
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/about">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-border hover:border-primary/50 text-lg px-10 py-7 bg-transparent hover:bg-primary/5"
                >
                  Learn More
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-10 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>No Sign-up Required</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>100% Free to Use</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>No Hallucinations</span>
              </div>
            </div>
          </div>
        </section>

        {/* Demo Chat Preview */}
        <section className="py-16 px-4 border-t border-border/20">
          <div className="max-w-3xl mx-auto">
            <div className="rounded-xl border border-border/50 bg-card/30 overflow-hidden">
              {/* Window header with traffic lights */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30 bg-card/50">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="ml-3 text-sm text-muted-foreground">Webot AI - Website Analyzer</span>
              </div>

              {/* Chat content */}
              <div className="p-6 space-y-4">
                {/* Status bar */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Globe className="h-4 w-4" />
                    <span>Analyzing: example-startup.com</span>
                  </div>
                  <span className="text-green-500 font-medium">Ready</span>
                </div>

                {/* User message */}
                <div className="flex justify-end">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary text-white px-4 py-2.5 rounded-2xl rounded-br-md max-w-md">
                      <p>What does this company do and what are their pricing plans?</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                      U
                    </div>
                  </div>
                </div>

                {/* AI response */}
                <div className="flex justify-start">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-card border border-border/50 px-4 py-3 rounded-2xl rounded-bl-md max-w-md border-l-2 border-l-primary">
                      <p className="text-foreground/90 mb-3">
                        Based on the website content, this company provides cloud-based project management software.
                        They offer three pricing tiers:
                      </p>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>
                          <span className="font-medium text-foreground">Starter:</span> $9/month - Up to 5 users
                        </p>
                        <p>
                          <span className="font-medium text-foreground">Professional:</span> $29/month - Up to 25 users
                        </p>
                        <p>
                          <span className="font-medium text-foreground">Enterprise:</span> Custom pricing - Unlimited
                          users
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works - Steps */}
        <section className="py-20 px-4 border-t border-border/20">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">How It Works</h2>
            <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
              Three simple steps to transform any website into an intelligent assistant
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((step, i) => (
                <div key={i} className="relative group">
                  <Card className="border-border/30 hover:border-primary/30 transition-all duration-300 h-full bg-card/30">
                    <CardContent className="p-8 text-center">
                      <div className="text-6xl font-black text-primary/20 mb-4 group-hover:text-primary/30 transition-colors">
                        {step.number}
                      </div>
                      <h3 className="text-xl font-bold mb-2 text-foreground">{step.title}</h3>
                      <p className="text-muted-foreground">{step.description}</p>
                    </CardContent>
                  </Card>
                  {i < steps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                      <ArrowRight className="h-6 w-6 text-primary/40" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Example Questions */}
        <section className="py-16 px-4 border-t border-border/20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">Example Questions You Can Ask</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {useCases.map((item, i) => (
                <Card
                  key={i}
                  className="border-border/30 hover:border-primary/30 transition-all group cursor-pointer bg-card/30"
                >
                  <CardContent className="p-5">
                    <span className="text-xs text-primary font-semibold uppercase tracking-wider">{item.type}</span>
                    <p className="text-sm mt-2 text-foreground/80 group-hover:text-foreground transition-colors">
                      "{item.query}"
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section - Matching screenshot design */}
        <section className="py-24 px-4 border-t border-border/20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Powerful Features</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Everything you need to understand any website in seconds
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <Card
                    key={index}
                    className="border-primary/20 hover:border-primary/40 transition-all duration-300 bg-black/40 group"
                  >
                    <CardContent className="p-7">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-5">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-bold mb-2 text-foreground">{feature.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-4 border-t border-border/20">
          <div className="max-w-4xl mx-auto text-center">
            <Card className="border-primary/30 p-12 sm:p-16 relative overflow-hidden bg-card/30">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
              <div className="relative z-10">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-8">
                  <Bot className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-foreground">Ready to Get Started?</h2>
                <p className="text-muted-foreground mb-10 max-w-xl mx-auto text-lg">
                  No signup needed. Just paste a URL and start asking questions immediately.
                </p>
                <Link href="/chat">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-12 py-7 font-semibold group">
                    <Play className="mr-2 h-5 w-5" />
                    Try It Now - It's Free
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </section>

        {/* Footer - Updated to Webot */}
        <footer className="border-t border-border/20 py-10 px-4">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <span className="font-bold text-lg">
                <span className="text-foreground">Web</span>
                <span className="text-primary">ot</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground">© 2025 Webot - Web Intelligence AI. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </PageWrapper>
  )
}

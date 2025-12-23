"use client"

import { PageWrapper } from "@/components/layout/page-wrapper"
import { useLanguage } from "@/contexts/language-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Globe,
  Bot,
  MessageSquare,
  History,
  Search,
  Sparkles,
  Target,
  Brain,
  ArrowRight,
  CheckCircle2,
  Zap,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AboutPage() {
  const { t } = useLanguage()

  const features = [
    {
      icon: Globe,
      title: t("about.feature1"),
      description:
        "Our system analyzes any public website, extracting meaningful content while respecting robots.txt and privacy guidelines.",
    },
    {
      icon: Bot,
      title: t("about.feature2"),
      description:
        "Using advanced RAG architecture with Google Gemini AI, we provide accurate answers based solely on website content.",
    },
    {
      icon: MessageSquare,
      title: t("about.feature3"),
      description:
        "Chat in English, Hindi, or Telugu. The AI generates responses in your selected language seamlessly.",
    },
    {
      icon: History,
      title: t("about.feature4"),
      description:
        "Login to save your conversations securely, allowing you to review and continue past interactions anytime.",
    },
  ]

  const useCases = [
    {
      icon: Search,
      title: "Research & Analysis",
      description: "Quickly understand the key information from any website without reading through pages of content.",
    },
    {
      icon: Target,
      title: "Competitive Intelligence",
      description: "Analyze competitor websites to understand their offerings, pricing, and messaging strategy.",
    },
    {
      icon: Sparkles,
      title: "Customer Support Training",
      description: "Convert product documentation into an AI assistant that can answer customer questions instantly.",
    },
    {
      icon: Brain,
      title: "Content Discovery",
      description: "Explore website content through natural conversations instead of manual browsing and searching.",
    },
  ]

  const steps = [
    {
      step: 1,
      title: "Enter Website URL",
      description: "Paste any public website URL - no login required to start analyzing immediately.",
    },
    {
      step: 2,
      title: "AI Analyzes Content",
      description: "Our system reads and understands all the content on the website automatically.",
    },
    {
      step: 3,
      title: "Ask Anything",
      description: "Ask questions about the website content in your preferred language naturally.",
    },
    {
      step: 4,
      title: "Get Accurate Answers",
      description: "Receive responses based solely on the website content - no made-up information ever.",
    },
  ]

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Header - Updated to Webot branding */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 mb-8">
            <Zap className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6 leading-tight">
            <span className="text-foreground">About</span> <span className="text-foreground">Web</span>
            <span className="text-primary">ot</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">{t("about.description")}</p>
        </div>

        {/* Features */}
        <section className="mb-24">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-center text-foreground">{t("about.features")}</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            Powerful capabilities designed to help you understand any website instantly
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card
                  key={index}
                  className="border-primary/20 hover:border-primary/40 transition-all duration-300 bg-black/40 group"
                >
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-lg text-foreground">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-24">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-center text-foreground">How It Works</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            Four simple steps to transform any website into your personal AI assistant
          </p>

          <div className="relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-primary/30 to-primary/10 hidden lg:block" />

            <div className="space-y-8 lg:space-y-0">
              {steps.map((item, index) => (
                <div
                  key={item.step}
                  className={`flex flex-col lg:flex-row items-center gap-8 ${index % 2 === 1 ? "lg:flex-row-reverse" : ""} ${index > 0 ? "lg:mt-8" : ""}`}
                >
                  <div className={`flex-1 ${index % 2 === 1 ? "lg:text-right" : "lg:text-left"}`}>
                    <Card className="border-primary/20 hover:border-primary/40 transition-all bg-black/40 inline-block w-full lg:w-auto">
                      <CardContent className="p-8">
                        <div className="flex items-center gap-3 mb-3">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                            Step {item.step}
                          </span>
                        </div>
                        <h3 className="font-bold text-xl mb-3 text-foreground">{item.title}</h3>
                        <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="relative z-10 w-14 h-14 rounded-xl bg-primary/20 border-2 border-primary flex items-center justify-center shrink-0">
                    <span className="text-primary font-black text-lg">{item.step}</span>
                  </div>

                  <div className="flex-1 hidden lg:block" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="mb-24">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-center text-foreground">Use Cases</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            Discover the many ways Webot can help you work smarter
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {useCases.map((useCase, index) => {
              const Icon = useCase.icon
              return (
                <Card
                  key={index}
                  className="border-primary/20 hover:border-primary/40 transition-all duration-300 bg-black/40 group"
                >
                  <CardContent className="p-8">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-5">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-bold text-lg mb-3 text-foreground">{useCase.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{useCase.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <Card className="border-primary/30 p-12 sm:p-16 relative overflow-hidden bg-card/30">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-foreground">Ready to Get Started?</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Experience the power of AI-driven website analysis. No signup required.
              </p>
              <Link href="/chat">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-10 py-7 font-semibold group">
                  Start Analyzing Now
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </Card>
        </section>
      </div>
    </PageWrapper>
  )
}

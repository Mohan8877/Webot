"use client"

import { createContext, useContext, type ReactNode } from "react"

export type Language = "en"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const translations: Record<string, string> = {
  // Navigation
  "nav.home": "Home",
  "nav.chat": "Chat",
  "nav.history": "History",
  "nav.about": "About",
  "nav.login": "Login",
  "nav.logout": "Logout",
  "nav.register": "Register",

  // Auth
  "auth.email": "Email",
  "auth.password": "Password",
  "auth.confirmPassword": "Confirm Password",
  "auth.login": "Login",
  "auth.register": "Register",
  "auth.forgotPassword": "Forgot Password?",
  "auth.noAccount": "Don't have an account?",
  "auth.hasAccount": "Already have an account?",
  "auth.resetPassword": "Reset Password",
  "auth.loginSuccess": "Successfully logged in!",
  "auth.registerSuccess": "Account created successfully!",
  "auth.logoutSuccess": "Successfully logged out!",

  // Chat
  "chat.title": "Website to Chatbot",
  "chat.subtitle": "Convert any website into an intelligent AI assistant",
  "chat.urlPlaceholder": "Enter website URL (e.g., https://example.com)",
  "chat.processWebsite": "Process Website",
  "chat.processing": "Processing...",
  "chat.messagePlaceholder": "Ask a question about the website...",
  "chat.send": "Send",
  "chat.thinking": "AI is thinking...",
  "chat.noInfo": "I could not find this information on the website.",
  "chat.selectLanguage": "Select Language",
  "chat.websiteProcessed": "Website processed successfully! You can now ask questions.",
  "chat.enterUrl": "Please enter a valid URL first",

  // History
  "history.title": "Chat History",
  "history.noHistory": "No chat history found",
  "history.loadMore": "Load More",
  "history.deleteAll": "Delete All",
  "history.confirmDelete": "Are you sure you want to delete all history?",

  // About
  "about.title": "About Webot - Web Intelligence AI",
  "about.description": "An intelligent AI-powered tool that converts any public website into a conversational chatbot.",
  "about.features": "Features",
  "about.feature1": "Website Scraping & Processing",
  "about.feature2": "RAG-based AI Responses",
  "about.feature3": "Voice Input Support",
  "about.feature4": "Chat History Storage",

  // Errors
  "error.required": "This field is required",
  "error.invalidEmail": "Please enter a valid email",
  "error.passwordMin": "Password must be at least 6 characters",
  "error.passwordMatch": "Passwords do not match",
  "error.invalidUrl": "Please enter a valid URL",
  "error.generic": "Something went wrong. Please try again.",

  // 404
  "404.title": "Page Not Found",
  "404.description": "The page you are looking for does not exist.",
  "404.goHome": "Go Home",
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const language: Language = "en"

  const setLanguage = () => {
    // Language is now fixed to English
  }

  const t = (key: string): string => {
    return translations[key] || key
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}

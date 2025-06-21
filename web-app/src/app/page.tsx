"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { AuthModal } from "@/components/auth/auth-modal"

export default function LandingPage() {
  const [authModal, setAuthModal] = React.useState<{
    isOpen: boolean
    mode: "signin" | "signup"
  }>({
    isOpen: false,
    mode: "signin"
  })

  const openAuth = (mode: "signin" | "signup") => {
    setAuthModal({ isOpen: true, mode })
  }

  const closeAuth = () => {
    setAuthModal({ isOpen: false, mode: "signin" })
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 md:px-12">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">AI</span>
          </div>
          <span className="text-xl font-semibold">ProductivAI</span>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => openAuth("signin")}
          >
            Log In
          </Button>
          <Button 
            variant="primary" 
            size="sm"
            onClick={() => openAuth("signup")}
          >
            Sign Up
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-black" />
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-[90vh] px-6 text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gray-800/50 border border-gray-700 text-sm text-gray-300">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
              Now in Beta
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                AI that thinks
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                ahead of you
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Transform your workflow with intelligent automation that learns from your habits 
              and anticipates your needs.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
              {[
                "Smart Scheduling",
                "Task Automation", 
                "Meeting Insights",
                "Focus Mode"
              ].map((feature) => (
                <div
                  key={feature}
                  className="px-4 py-2 rounded-full bg-gray-800/30 border border-gray-700 text-sm text-gray-300"
                >
                  {feature}
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <Button
                variant="default"
                size="xl"
                onClick={() => openAuth("signup")}
                className="w-full sm:w-auto min-w-[200px] shadow-2xl shadow-white/10"
              >
                Start Free Trial
              </Button>
              <Button
                variant="outline"
                size="xl"
                onClick={() => openAuth("signin")}
                className="w-full sm:w-auto min-w-[200px]"
              >
                Log In
              </Button>
            </div>

            {/* Social Proof */}
            <div className="pt-12">
              <p className="text-sm text-gray-500 mb-4">
                Trusted by teams at
              </p>
              <div className="flex items-center justify-center space-x-8 opacity-50">
                {["Microsoft", "Google", "Slack", "Notion"].map((company) => (
                  <div
                    key={company}
                    className="text-gray-600 font-medium text-sm"
                  >
                    {company}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModal.isOpen}
        onClose={closeAuth}
        mode={authModal.mode}
      />
    </div>
  )
}

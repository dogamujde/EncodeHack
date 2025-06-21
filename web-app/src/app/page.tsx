"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { AuthModal } from "@/components/auth/auth-modal"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

export default function LandingPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [authModal, setAuthModal] = React.useState<{
    isOpen: boolean
    mode: "signin" | "signup"
  }>({
    isOpen: false,
    mode: "signin"
  })

  // Redirect to dashboard if user is authenticated
  React.useEffect(() => {
    if (user && !isLoading) {
      router.push('/dashboard')
    }
  }, [user, isLoading, router])

  const openAuth = (mode: "signin" | "signup") => {
    setAuthModal({ isOpen: true, mode })
  }

  const closeAuth = () => {
    setAuthModal({ isOpen: false, mode: "signin" })
  }

  const handleAuthSuccess = () => {
    router.push('/dashboard')
  }

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  // Don't render if user is authenticated (will redirect)
  if (user) {
    return null
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 md:px-12">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">AI</span>
          </div>
          <span className="text-xl font-semibold">ProductivAI</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            onClick={() => openAuth("signin")}
            className="text-gray-300 hover:text-white"
          >
            Log In
          </Button>
          <Button 
            variant="primary" 
            onClick={() => openAuth("signup")}
          >
            Sign Up
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative">
        {/* Grid background pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPgogICAgICA8cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMjEyMTIxIiBzdHJva2Utd2lkdGg9IjEiLz4KICAgIDwvcGF0dGVybj4KICA8L2RlZnM+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPgo8L3N2Zz4=')] opacity-20"></div>
        
        <div className="relative px-6 py-20 md:py-32 text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            See Your Meetings Like Never Before
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 mb-12 leading-relaxed max-w-3xl mx-auto">
            Get real-time insights, feedback, and summaries — powered by AI that listens and learns as you speak.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button 
              size="lg" 
              variant="primary"
              className="text-lg px-8 py-4"
              onClick={() => openAuth("signup")}
            >
              Try AI Meeting Insights Free
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 py-4"
              onClick={() => openAuth("signin")}
            >
              Log In
            </Button>
          </div>

          {/* Enhanced Features */}
          <div className="flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
            {/* Meeting Insights - Featured */}
            <div className="px-6 py-3 rounded-full bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 text-blue-300 font-medium text-lg">
              🎯 Meeting Insights
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={authModal.isOpen} 
        onClose={closeAuth} 
        mode={authModal.mode}
        onSuccess={handleAuthSuccess}
      />
    </div>
  )
}

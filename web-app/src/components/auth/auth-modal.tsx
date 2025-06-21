"use client"

import * as React from "react"
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { auth } from "@/lib/supabase"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  mode: "signin" | "signup"
  onSuccess?: () => void
}

export function AuthModal({ isOpen, onClose, mode, onSuccess }: AuthModalProps) {
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string>("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Validate passwords match for signup
    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      let result
      if (mode === "signup") {
        result = await auth.signUp(email, password)
      } else {
        result = await auth.signIn(email, password)
      }

      if (result.error) {
        setError(result.error.message)
      } else {
        // Success!
        resetForm()
        onClose()
        if (onSuccess) {
          onSuccess()
        }
        
        // Show success message
        if (mode === "signup") {
          alert("Account created! Please check your email to verify your account.")
        } else {
          alert("Successfully signed in!")
        }
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error("Auth error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setEmail("")
    setPassword("")
    setConfirmPassword("")
    setError("")
  }

  React.useEffect(() => {
    if (isOpen) {
      resetForm()
    }
  }, [isOpen, mode])

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <h2 className="text-xl font-semibold text-white">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          {mode === "signin" 
            ? "Sign in to your account to continue" 
            : "Join thousands of users boosting their productivity"
          }
        </p>
      </ModalHeader>

      <form onSubmit={handleSubmit}>
        <ModalBody className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-900/20 border border-red-700 text-red-300 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              minLength={6}
            />
          </div>

          {mode === "signup" && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={6}
              />
            </div>
          )}
        </ModalBody>

        <ModalFooter className="space-y-3">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading 
              ? "Loading..." 
              : mode === "signin" 
                ? "Sign In" 
                : "Create Account"
            }
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="lg"
            className="w-full"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>

          {mode === "signin" && (
            <div className="text-center">
              <button
                type="button"
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                disabled={isLoading}
              >
                Forgot your password?
              </button>
            </div>
          )}
        </ModalFooter>
      </form>
    </Modal>
  )
} 
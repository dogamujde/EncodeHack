"use client"

import * as React from "react"
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  mode: "signin" | "signup"
}

export function AuthModal({ isOpen, onClose, mode }: AuthModalProps) {
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Reset form
    setEmail("")
    setPassword("")
    setConfirmPassword("")
    setIsLoading(false)
    onClose()
  }

  const resetForm = () => {
    setEmail("")
    setPassword("")
    setConfirmPassword("")
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
          >
            Cancel
          </Button>

          {mode === "signin" && (
            <div className="text-center">
              <button
                type="button"
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
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
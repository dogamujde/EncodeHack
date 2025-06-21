import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-white text-black hover:bg-gray-100 focus-visible:ring-white",
        primary:
          "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600",
        secondary:
          "bg-gray-800 text-white border border-gray-700 hover:bg-gray-700 focus-visible:ring-gray-700",
        outline:
          "border border-gray-700 bg-transparent text-white hover:bg-gray-800 focus-visible:ring-gray-700",
        ghost:
          "text-gray-300 hover:bg-gray-800 hover:text-white focus-visible:ring-gray-700",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 px-4 py-1",
        lg: "h-12 px-8 py-3",
        xl: "h-14 px-10 py-4 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants } 
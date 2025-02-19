import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface DialogProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}

export function Dialog({ isOpen, onClose, children, className }: DialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#363332]/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog content */}
      <div 
        className={cn(
          "relative bg-white/95 rounded-lg shadow-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto",
          "border border-[#363332]/10",
          className
        )}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#363332]/60 hover:text-[#363332] transition-colors"
        >
          <X size={20} />
        </button>
        {children}
      </div>
    </div>
  )
} 
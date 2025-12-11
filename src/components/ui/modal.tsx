'use client';

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  X 
} from "lucide-react"
import { useTranslation } from "@/hooks/useTranslation"
import { useDialogManager } from "./dialog-manager"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  className?: string
  children?: React.ReactNode
  showCloseButton?: boolean
  buttonText?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  preventReload?: boolean
}

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info', 
  className,
  children,
  showCloseButton = true,
  buttonText,
  size = 'md',
  preventReload = false
}: ModalProps) {
  const { t, isRTL } = useTranslation()
  const { registerDialog, unregisterDialog, openDialog } = useDialogManager()
  const modalId = React.useId()

  // Register/unregister dialog
  React.useEffect(() => {
    if (isOpen) {
      registerDialog(modalId, onClose)
      openDialog(modalId)
    } else {
      unregisterDialog(modalId)
    }
    return () => {
      unregisterDialog(modalId)
    }
  }, [isOpen, modalId, registerDialog, unregisterDialog, openDialog, onClose])

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'max-w-sm'
      case 'lg':
        return 'max-w-2xl'
      case 'xl':
        return 'max-w-4xl'
      default:
        return 'max-w-lg'
    }
  }

  const getIconForType = () => {
    const iconClass = "w-16 h-16"
    
    switch (type) {
      case 'success':
        return (
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className={cn(iconClass, "text-green-600 dark:text-green-400")} />
          </div>
        )
      case 'error':
        return (
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
            <XCircle className={cn(iconClass, "text-red-600 dark:text-red-400")} />
          </div>
        )
      case 'warning':
        return (
          <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className={cn(iconClass, "text-yellow-600 dark:text-yellow-400")} />
          </div>
        )
      default:
        return (
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6">
            <Info className={cn(iconClass, "text-blue-600 dark:text-blue-400")} />
          </div>
        )
    }
  }

  const handleButtonClick = () => {
    onClose()
    
    // Reload page on success modal only if preventReload is false
    if (type === 'success' && !preventReload) {
      window.location.reload()
    }
  }

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Backdrop with enhanced blur */}
      <div 
        className="absolute inset-0 z-70 bg-black/60 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal with jelly animation */}
      <div className={cn(
        "relative z-80 bg-background border border-border rounded-2xl shadow-2xl w-full",
        "transform transition-all duration-500 ease-out",
        "animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4",
        // Jelly animation keyframes
        "animate-[jelly_0.6s_ease-in-out]",
        getSizeClasses(),
        className
      )}>
        {/* Close button */}
        {showCloseButton && (
          <button
            onClick={onClose}
            className={cn(
              "absolute top-4 rounded-full p-2",
              "text-muted-foreground hover:text-foreground hover:bg-muted",
              "transition-all duration-200 ease-in-out",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "cursor-pointer",
              isRTL ? "left-4" : "right-4"
            )}
            aria-label={t('common.cancel')}
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Content */}
        <div className="p-8 text-center">
          {/* Icon */}
          <div className="flex justify-center">
            {getIconForType()}
          </div>

          {/* Title */}
          {title && (
            <h3 className="text-2xl font-semibold text-foreground mb-4">
              {title}
            </h3>
          )}

          {/* Message */}
          <div className="space-y-4 mb-8">
            <p className="text-muted-foreground text-lg leading-relaxed">
              {message}
            </p>
            
            {/* Custom children content */}
            {children && (
              <div className="mt-6">
                {children}
              </div>
            )}
          </div>

          {/* Action button */}
          <div className="flex justify-center">
            <Button
              onClick={handleButtonClick}
              className="min-w-[120px]  cursor-pointer"
              size="lg"
            >
              {buttonText || t('common.ok')}
            </Button>
          </div>
        </div>
      </div>

      {/* Custom CSS for jelly animation */}
      <style jsx>{`
        @keyframes jelly {
          0% {
            transform: scale(0.8) rotate(-1deg);
            opacity: 0;
          }
          25% {
            transform: scale(1.05) rotate(1deg);
            opacity: 0.8;
          }
          50% {
            transform: scale(0.98) rotate(-0.5deg);
            opacity: 1;
          }
          75% {
            transform: scale(1.02) rotate(0.5deg);
            opacity: 1;
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

// Enhanced hook for managing modal state
export function useModal() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [modalProps, setModalProps] = React.useState<Partial<ModalProps>>({})

  const openModal = (props: Partial<ModalProps>) => {
    setModalProps(props)
    setIsOpen(true)
  }

  const closeModal = () => {
    setIsOpen(false)
    // Clear props after animation completes
    setTimeout(() => setModalProps({}), 500)
  }

  const showSuccess = (message: string, title?: string, options?: Partial<ModalProps>) => {
    openModal({
      type: 'success',
      message,
      title,
      preventReload: options?.preventReload || false,
      ...options
    })
  }

  const showError = (message: string, title?: string, options?: Partial<ModalProps>) => {
    openModal({
      type: 'error',
      message,
      title,
      ...options
    })
  }

  const showWarning = (message: string, title?: string, options?: Partial<ModalProps>) => {
    openModal({
      type: 'warning',
      message,
      title,
      ...options
    })
  }

  const showInfo = (message: string, title?: string, options?: Partial<ModalProps>) => {
    openModal({
      type: 'info',
      message,
      title,
      ...options
    })
  }

  return {
    isOpen,
    modalProps: { ...modalProps, isOpen, onClose: closeModal },
    openModal,
    closeModal,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }
}
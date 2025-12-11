'use client'

import { useEffect } from 'react'

/**
 * Suppresses browser extension errors that appear in the console
 * These errors are harmless and come from extensions trying to communicate
 */
export function ErrorSuppressor() {
  useEffect(() => {
    // Suppress extension-related errors
    const originalError = console.error
    const originalWarn = console.warn

    console.error = (...args: any[]) => {
      const message = args[0]?.toString() || ''
      
      // Filter out common extension errors
      if (
        message.includes('Could not establish connection') ||
        message.includes('Receiving end does not exist') ||
        message.includes('Extension context invalidated') ||
        message.includes('message port closed')
      ) {
        // Silently ignore extension errors
        return
      }
      
      // Log other errors normally
      originalError.apply(console, args)
    }

    console.warn = (...args: any[]) => {
      const message = args[0]?.toString() || ''
      
      // Filter out common extension warnings
      if (
        message.includes('Could not establish connection') ||
        message.includes('Receiving end does not exist') ||
        message.includes('Extension context invalidated')
      ) {
        // Silently ignore extension warnings
        return
      }
      
      // Log other warnings normally
      originalWarn.apply(console, args)
    }

    // Cleanup on unmount
    return () => {
      console.error = originalError
      console.warn = originalWarn
    }
  }, [])

  // Also handle unhandled promise rejections from extensions
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.toString() || ''
      
      if (
        reason.includes('Could not establish connection') ||
        reason.includes('Receiving end does not exist') ||
        reason.includes('Extension context invalidated')
      ) {
        // Prevent the error from appearing in console
        event.preventDefault()
        return
      }
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  return null
}


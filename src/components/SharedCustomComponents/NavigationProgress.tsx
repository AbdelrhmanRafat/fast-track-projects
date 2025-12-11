'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useNavigationLoadingStore } from '@/stores/navigationLoadingStore'

export function NavigationProgress() {
  const [progress, setProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const pathname = usePathname()
  const isNavigating = useNavigationLoadingStore((state) => state.isNavigating)
  const { stopNavigation } = useNavigationLoadingStore()
  const timersRef = useRef<NodeJS.Timeout[]>([])
  const isMountedRef = useRef(true)
  const previousPathnameRef = useRef<string>(pathname)

  useEffect(() => {
    isMountedRef.current = true
    
    // On mount, check if navigation is stuck and clear it
    const checkStuckNavigation = setTimeout(() => {
      const store = useNavigationLoadingStore.getState()
      if (store.isNavigating) {
        // If navigation is still active after 1 second on mount, it might be stuck
        stopNavigation()
      }
    }, 1000)
    
    return () => {
      isMountedRef.current = false
      clearTimeout(checkStuckNavigation)
      // Clear all timers on unmount
      timersRef.current.forEach(timer => clearTimeout(timer))
      timersRef.current = []
      // Also stop navigation on unmount
      stopNavigation()
    }
  }, [stopNavigation])

  useEffect(() => {
    // Clear previous timers
    timersRef.current.forEach(timer => clearTimeout(timer))
    timersRef.current = []

    if (isNavigating) {
      if (isMountedRef.current) {
        setIsVisible(true)
        setProgress(0)
        
        // Simulate progress
        const timer1 = setTimeout(() => {
          if (isMountedRef.current) setProgress(30)
        }, 100)
        const timer2 = setTimeout(() => {
          if (isMountedRef.current) setProgress(60)
        }, 300)
        const timer3 = setTimeout(() => {
          if (isMountedRef.current) setProgress(90)
        }, 500)
        
        timersRef.current = [timer1, timer2, timer3]
      }
    } else {
      // Complete the progress bar
      if (isMountedRef.current) {
        setProgress(100)
        const timer = setTimeout(() => {
          if (isMountedRef.current) {
            setIsVisible(false)
            setProgress(0)
          }
        }, 200)
        timersRef.current = [timer]
      }
    }

    return () => {
      timersRef.current.forEach(timer => clearTimeout(timer))
      timersRef.current = []
    }
  }, [isNavigating])

  useEffect(() => {
    // Stop navigation when pathname changes
    if (previousPathnameRef.current !== pathname) {
      previousPathnameRef.current = pathname
      
      // Stop navigation after a short delay to ensure page has loaded
      const delayTimer = setTimeout(() => {
        if (isMountedRef.current) {
          stopNavigation()
        }
      }, 300) // Wait 300ms for page to load

      return () => {
        clearTimeout(delayTimer)
      }
    }
  }, [pathname, stopNavigation])

  // Fallback: Always stop navigation after maximum 2 seconds to prevent stuck state
  useEffect(() => {
    if (!isNavigating) return

    const fallbackTimer = setTimeout(() => {
      if (isMountedRef.current) {
        stopNavigation()
      }
    }, 2000) // Maximum 2 seconds

    return () => {
      clearTimeout(fallbackTimer)
    }
  }, [isNavigating, stopNavigation])

  // Also stop navigation when page becomes visible (handles back/forward navigation)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isNavigating) {
        // Small delay to ensure navigation completed
        setTimeout(() => {
          if (isMountedRef.current) {
            stopNavigation()
          }
        }, 100)
      }
    }

    const handleLoad = () => {
      if (isNavigating) {
        setTimeout(() => {
          if (isMountedRef.current) {
            stopNavigation()
          }
        }, 100)
      }
    }

    window.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('load', handleLoad)

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('load', handleLoad)
    }
  }, [isNavigating, stopNavigation])

  if (!isVisible) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-1 bg-transparent pointer-events-none">
      <div
        className="h-full bg-primary transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          transition: progress === 100 ? 'width 0.2s ease-out' : 'width 0.3s ease-out'
        }}
      />
    </div>
  )
}


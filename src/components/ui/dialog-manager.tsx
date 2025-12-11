'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

interface DialogManagerContextType {
  registerDialog: (id: string, closeFn: () => void) => void
  unregisterDialog: (id: string) => void
  openDialog: (id: string) => void
}

const DialogManagerContext = createContext<DialogManagerContextType | undefined>(undefined)

export function DialogManagerProvider({ children }: { children: React.ReactNode }) {
  const [dialogs, setDialogs] = useState<Map<string, () => void>>(new Map())
  const dialogsRef = React.useRef<Map<string, () => void>>(new Map())

  // Keep ref in sync with state
  useEffect(() => {
    dialogsRef.current = dialogs
  }, [dialogs])

  const registerDialog = useCallback((id: string, closeFn: () => void) => {
    setDialogs(prev => {
      const newMap = new Map(prev)
      newMap.set(id, closeFn)
      return newMap
    })
  }, [])

  const unregisterDialog = useCallback((id: string) => {
    setDialogs(prev => {
      const newMap = new Map(prev)
      newMap.delete(id)
      return newMap
    })
  }, [])

  const openDialog = useCallback((id: string) => {
    // Close all other dialogs using ref to get latest state
    dialogsRef.current.forEach((closeFn, dialogId) => {
      if (dialogId !== id) {
        closeFn()
      }
    })
  }, [])

  return (
    <DialogManagerContext.Provider value={{ registerDialog, unregisterDialog, openDialog }}>
      {children}
    </DialogManagerContext.Provider>
  )
}

export function useDialogManager() {
  const context = useContext(DialogManagerContext)
  if (!context) {
    // Return no-op functions if context is not available
    return {
      registerDialog: () => {},
      unregisterDialog: () => {},
      openDialog: () => {},
    }
  }
  return context
}


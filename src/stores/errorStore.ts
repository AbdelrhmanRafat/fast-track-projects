import { create } from 'zustand'

interface ErrorState {
  isModalOpen: boolean
  errorMessage: string
  errorType: 'error' | 'success' | 'warning' | 'info'
  
  // Actions
  showError: (message: string, type?: 'error' | 'success' | 'warning' | 'info') => void
  hideError: () => void
  clearError: () => void
}

export const useErrorStore = create<ErrorState>((set) => ({
  isModalOpen: false,
  errorMessage: '',
  errorType: 'error',
  
  showError: (message: string, type: 'error' | 'success' | 'warning' | 'info' = 'error') => {
    set({
      isModalOpen: true,
      errorMessage: message,
      errorType: type
    })
  },
  
  hideError: () => {
    set({ isModalOpen: false })
  },
  
  clearError: () => {
    set({
      isModalOpen: false,
      errorMessage: '',
      errorType: 'error'
    })
  }
}))
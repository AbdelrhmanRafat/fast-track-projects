import { create } from 'zustand'

interface NavigationLoadingState {
  isNavigating: boolean
  startNavigation: () => void
  stopNavigation: () => void
}

export const useNavigationLoadingStore = create<NavigationLoadingState>((set) => ({
  isNavigating: false,
  
  startNavigation: () => set({ isNavigating: true }),
  
  stopNavigation: () => set({ isNavigating: false }),
}))


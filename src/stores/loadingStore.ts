import { create } from 'zustand';

interface LoadingState {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  startLoading: () => void;
  stopLoading: () => void;
}

export const useLoadingStore = create<LoadingState>((set, get) => ({
  loading: false,
  
  setLoading: (loading: boolean) => set({ loading }),
  
  startLoading: () => set({ loading: true }),
  
  stopLoading: () => set({ loading: false }),
}));

// Export getState for direct access without React hooks
export const getLoadingState = () => useLoadingStore.getState();

// Export setState for direct state manipulation
export const setLoadingState = (loading: boolean) => useLoadingStore.getState().setLoading(loading);

// Convenience functions for common operations
export const startGlobalLoading = () => {
  useLoadingStore.getState().startLoading();
};

export const stopGlobalLoading = () => {
  useLoadingStore.getState().stopLoading();
};
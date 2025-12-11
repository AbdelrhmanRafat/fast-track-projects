import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarState {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isCollapsed: false,
      
      toggleCollapse: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
      
      setCollapsed: (collapsed: boolean) => set({ isCollapsed: collapsed }),
    }),
    {
      name: 'sidebar-storage', // localStorage key
    }
  )
);

// Export getState for direct access without React hooks
export const getSidebarState = () => useSidebarStore.getState();

// Convenience functions
export const toggleSidebarCollapse = () => {
  useSidebarStore.getState().toggleCollapse();
};

export const setSidebarCollapsed = (collapsed: boolean) => {
  useSidebarStore.getState().setCollapsed(collapsed);
};

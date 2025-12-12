'use client';

import { createContext, useContext, ReactNode, useEffect, useCallback } from 'react';
import { useAppBadge } from '@/hooks/useAppBadge';

// Global event name for triggering badge refresh
export const BADGE_REFRESH_EVENT = 'badge:refresh';

/**
 * Trigger a global badge refresh event
 * Call this after any operation that might change notification count
 * (order creation, status change, etc.)
 */
export function triggerBadgeRefresh() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(BADGE_REFRESH_EVENT));
  }
}

interface BadgeContextType {
  unreadNotifications: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

const BadgeContext = createContext<BadgeContextType>({
  unreadNotifications: 0,
  isLoading: false,
  error: null,
  refresh: () => {},
});

interface BadgeProviderProps {
  children: ReactNode;
  pollingInterval?: number;
  enabled?: boolean;
}

/**
 * Badge Provider Component
 * Provides badge count context to all child components
 * Automatically handles polling and badge updates
 * Also listens for global refresh events triggered by order operations
 */
export function BadgeProvider({ 
  children, 
  pollingInterval = 30000,
  enabled = true
}: BadgeProviderProps) {
  const badge = useAppBadge({ pollingInterval, enabled });

  // Listen for global refresh events
  useEffect(() => {
    if (!enabled) return;

    const handleRefreshEvent = () => {
      badge.refresh();
    };

    window.addEventListener(BADGE_REFRESH_EVENT, handleRefreshEvent);
    return () => window.removeEventListener(BADGE_REFRESH_EVENT, handleRefreshEvent);
  }, [enabled, badge.refresh]);

  return (
    <BadgeContext.Provider value={badge}>
      {children}
    </BadgeContext.Provider>
  );
}

/**
 * Hook to access badge context
 * Use this in components that need to display or react to badge count
 */
export function useBadgeContext() {
  const context = useContext(BadgeContext);
  if (!context) {
    throw new Error('useBadgeContext must be used within a BadgeProvider');
  }
  return context;
}

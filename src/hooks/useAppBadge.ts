'use client';

import { useEffect, useState, useCallback } from 'react';
import { setBadge, clearBadge, isBadgeSupported } from '@/lib/badge';

interface UseAppBadgeOptions {
  enabled?: boolean;
  pollingInterval?: number; // in milliseconds
}

interface BadgeResponse {
  code: number;
  data?: {
    unreadNotifications: number;
  };
  message?: string;
}

/**
 * Custom hook to manage PWA app badge for unread notifications
 * Automatically polls the server and updates the badge count
 */
export function useAppBadge({ 
  enabled = true, 
  pollingInterval = 30000 // 30 seconds default
}: UseAppBadgeOptions = {}) {
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isLoading, setIsLoading] = useState(true); // Initial loading state
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    // Only show loading spinner on initial fetch, not background polling
    if (!hasFetched) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await fetch('/api/badge-count', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies
      });

      const data: BadgeResponse = await response.json();

      if (data.code === 200 && data.data) {
        const { unreadNotifications: unread } = data.data;
        setUnreadNotifications(unread);
        // Update the app badge with unread notifications count
        await setBadge(unread);
      } else if (data.code === 401) {
        // User not authenticated - clear badge
        setUnreadNotifications(0);
        await clearBadge();
      } else {
        setError(data.message || 'فشل في جلب عدد الإشعارات');
      }
    } catch (err) {
      setError('خطأ في الشبكة');
    } finally {
      setIsLoading(false);
      setHasFetched(true);
    }
  }, [hasFetched]);

  // Initial fetch and polling
  useEffect(() => {
    if (!enabled) return;

    // Initial fetch
    fetchUnreadCount();

    // Set up polling interval
    const intervalId = setInterval(fetchUnreadCount, pollingInterval);

    // Cleanup
    return () => {
      clearInterval(intervalId);
      clearBadge();
    };
  }, [enabled, pollingInterval, fetchUnreadCount]);

  // Refresh when tab becomes visible
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchUnreadCount();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enabled, fetchUnreadCount]);

  // Refresh when user comes back online
  useEffect(() => {
    if (!enabled) return;

    const handleOnline = () => {
      fetchUnreadCount();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [enabled, fetchUnreadCount]);

  return { 
    unreadNotifications,
    isLoading, 
    error, 
    refresh: fetchUnreadCount 
  };
}

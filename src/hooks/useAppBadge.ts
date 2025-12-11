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
    count: number;
    unreadNotifications: number;
    pendingOrders: number;
  };
  message?: string;
}

/**
 * Custom hook to manage PWA app badge for pending orders
 * Automatically polls the server and updates the badge count
 */
export function useAppBadge({ 
  enabled = true, 
  pollingInterval = 30000 // 30 seconds default
}: UseAppBadgeOptions = {}) {
  const [pendingCount, setPendingCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [isLoading, setIsLoading] = useState(true); // Initial loading state
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchPendingCount = useCallback(async () => {
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
        const { count, unreadNotifications: unread, pendingOrders: pending } = data.data;
        setPendingCount(count);
        setUnreadNotifications(unread);
        setPendingOrders(pending);
        // Update the app badge
        await setBadge(count);
      } else if (data.code === 401) {
        // User not authenticated - clear badge
        setPendingCount(0);
        setUnreadNotifications(0);
        setPendingOrders(0);
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
    fetchPendingCount();

    // Set up polling interval
    const intervalId = setInterval(fetchPendingCount, pollingInterval);

    // Cleanup
    return () => {
      clearInterval(intervalId);
      clearBadge();
    };
  }, [enabled, pollingInterval, fetchPendingCount]);

  // Refresh when tab becomes visible
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchPendingCount();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enabled, fetchPendingCount]);

  // Refresh when user comes back online
  useEffect(() => {
    if (!enabled) return;

    const handleOnline = () => {
      fetchPendingCount();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [enabled, fetchPendingCount]);

  return { 
    pendingCount, 
    unreadNotifications,
    pendingOrders,
    isLoading, 
    error, 
    refresh: fetchPendingCount 
  };
}

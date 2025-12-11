'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Notification, UseNotificationsReturn } from '@/lib/services/notifications/types';
import { BADGE_REFRESH_EVENT } from '@/components/providers/BadgeProvider';

interface UseNotificationsOptions {
  pollingInterval?: number; // in milliseconds
  enabled?: boolean;
}

/**
 * Hook for managing notifications list
 * Handles fetching, polling, marking as read, and deleting notifications
 */
export function useNotifications({
  pollingInterval = 30000, // 30 seconds default
  enabled = true,
}: UseNotificationsOptions = {}): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true); // Initial loading state
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasFetchedRef = useRef(false);

  // Fetch notifications from server
  const fetchNotifications = useCallback(async () => {
    // Only show loading spinner on initial fetch, not background polling
    if (!hasFetchedRef.current) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await fetch('/api/notifications?limit=50', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (data.code === 200 && data.data) {
        setNotifications(data.data.notifications || []);
        setUnreadCount(data.data.unreadCount || 0);
      } else if (data.code === 401) {
        // Not authenticated - don't show error
        setNotifications([]);
        setUnreadCount(0);
      } else {
        setError(data.message || 'فشل في جلب الإشعارات');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال');
    } finally {
      setIsLoading(false);
      hasFetchedRef.current = true;
    }
  }, []);

  // Initial fetch and polling setup
  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Initial fetch
    fetchNotifications();

    // Set up polling
    intervalRef.current = setInterval(fetchNotifications, pollingInterval);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, pollingInterval, fetchNotifications]);

  // Refresh when tab becomes visible
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchNotifications();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enabled, fetchNotifications]);

  // Refresh when badge-refresh event is triggered (after order mutations)
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleBadgeRefresh = () => {
      fetchNotifications();
    };

    window.addEventListener(BADGE_REFRESH_EVENT, handleBadgeRefresh);
    return () => window.removeEventListener(BADGE_REFRESH_EVENT, handleBadgeRefresh);
  }, [enabled, fetchNotifications]);

  // Mark specific notifications as read
  const markAsRead = useCallback(async (ids?: string[]): Promise<boolean> => {
    if (!ids || ids.length === 0) {
      return false;
    }

    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ notificationIds: ids }),
      });

      const data = await response.json();

      if (data.code === 200) {
        // Update local state
        setNotifications((prev) =>
          prev.map((n) =>
            ids.includes(n.id) ? { ...n, is_read: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - ids.length));
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ markAll: true }),
      });

      const data = await response.json();

      if (data.code === 200) {
        // Update local state
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, is_read: true }))
        );
        setUnreadCount(0);
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  }, []);

  // Delete a specific notification
  const deleteNotification = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ notificationIds: [id] }),
      });

      const data = await response.json();

      if (data.code === 200) {
        // Update local state
        const deletedNotification = notifications.find((n) => n.id === id);
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        if (deletedNotification && !deletedNotification.is_read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  }, [notifications]);

  // Delete all notifications
  const deleteAllNotifications = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ deleteAll: true }),
      });

      const data = await response.json();

      if (data.code === 200) {
        setNotifications([]);
        setUnreadCount(0);
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    refresh: fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  };
}

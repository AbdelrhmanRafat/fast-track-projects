'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  initializeFirebase,
  requestNotificationPermissionAndGetToken,
  onForegroundMessage,
  isFCMSupported,
  getExistingToken,
} from '@/lib/firebase';

// LocalStorage key for subscription state
const STORAGE_KEY = 'fcm_subscription';

interface StoredSubscription {
  isSubscribed: boolean;
  token: string | null;
  subscribedAt: string;
}

interface UseFirebasePushOptions {
  onTokenReceived?: (token: string) => void;
  onMessage?: (payload: any) => void;
  onError?: (error: string) => void;
  autoRegister?: boolean;
}

interface UseFirebasePushReturn {
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  permission: NotificationPermission | null;
  token: string | null;
  error: string | null;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
}

// Helper functions for localStorage
function getStoredSubscription(): StoredSubscription | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function setStoredSubscription(data: StoredSubscription | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

/**
 * Hook for Firebase Cloud Messaging push notifications
 * Persists subscription state in localStorage
 */
export function useFirebasePush({
  onTokenReceived,
  onMessage,
  onError,
  autoRegister = false,
}: UseFirebasePushOptions = {}): UseFirebasePushReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check support and restore state on mount
  useEffect(() => {
    const initializeAndRestore = async () => {
      setIsLoading(true);
      
      // Check basic requirements
      if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
      }

      if (!('serviceWorker' in navigator)) {
        setIsSupported(false);
        setIsLoading(false);
        return;
      }

      if (!('Notification' in window)) {
        setIsSupported(false);
        setIsLoading(false);
        return;
      }

      // Check FCM support
      const supported = await isFCMSupported();
      setIsSupported(supported);

      if (!supported) {
        setIsLoading(false);
        return;
      }

      // Get current permission
      const currentPermission = Notification.permission;
      setPermission(currentPermission);

      // Initialize Firebase
      initializeFirebase();

      // Register service worker
      try {
        await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      } catch (err) {
        // Failed to register FCM Service Worker
      }

      // Check stored subscription and validate it
      const stored = getStoredSubscription();

      if (stored?.isSubscribed && currentPermission === 'granted') {
        // Try to get/validate existing token
        try {
          const existingToken = await getExistingToken();
          if (existingToken) {
            setToken(existingToken);
            setIsSubscribed(true);
            
            // Update stored token if different
            if (existingToken !== stored.token) {
              setStoredSubscription({
                isSubscribed: true,
                token: existingToken,
                subscribedAt: stored.subscribedAt,
              });
            }
          } else {
            setStoredSubscription(null);
            setIsSubscribed(false);
          }
        } catch (err) {
          // Clear invalid subscription
          setStoredSubscription(null);
          setIsSubscribed(false);
        }
      } else if (stored?.isSubscribed && currentPermission === 'denied') {
        // Permission was revoked
        setStoredSubscription(null);
        setIsSubscribed(false);
      }

      setIsLoading(false);
    };

    initializeAndRestore();
  }, []);

  // Set up foreground message listener
  useEffect(() => {
    if (!isSupported || !isSubscribed) return;

    const cleanup = onForegroundMessage((payload) => {
      // Show notification manually for foreground messages
      if (Notification.permission === 'granted' && payload.notification) {
        const { title, body } = payload.notification;
        new Notification(title || 'إشعار جديد', {
          body: body || '',
          icon: '/icons/icon-192x192.png',
          dir: 'rtl',
          lang: 'ar',
          data: payload.data,
        });
      }

      onMessage?.(payload);
    });

    return () => {
      cleanup?.();
    };
  }, [isSupported, isSubscribed, onMessage]);

  // Auto-register if enabled and permission already granted
  useEffect(() => {
    if (autoRegister && isSupported && !isSubscribed && !isLoading && permission === 'granted') {
      subscribe();
    }
  }, [autoRegister, isSupported, isSubscribed, isLoading, permission]);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      const errorMsg = 'إشعارات Firebase غير مدعومة في هذا المتصفح';
      setError(errorMsg);
      onError?.(errorMsg);
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Request permission and get token
      const fcmToken = await requestNotificationPermissionAndGetToken();
      
      if (!fcmToken) {
        const errorMsg = 'فشل في الحصول على رمز الإشعارات';
        setError(errorMsg);
        onError?.(errorMsg);
        setIsLoading(false);
        return false;
      }

      setToken(fcmToken);
      setIsSubscribed(true);
      setPermission(Notification.permission);
      
      // Persist subscription state
      setStoredSubscription({
        isSubscribed: true,
        token: fcmToken,
        subscribedAt: new Date().toISOString(),
      });
      
      // Send token to backend
      try {
        const response = await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            fcmToken,
            deviceInfo: {
              userAgent: navigator.userAgent,
              platform: navigator.platform,
              language: navigator.language,
            },
          }),
        });

        const data = await response.json();

        if (response.ok) {
          onTokenReceived?.(fcmToken);
        }
      } catch (backendError) {
        // Don't fail the subscription - local notifications still work
      }

      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'حدث خطأ أثناء الاشتراك';
      setError(errorMsg);
      onError?.(errorMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, onTokenReceived, onError]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Delete token from backend
      if (token) {
        try {
          await fetch('/api/push/subscribe', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ fcmToken: token }),
          });
        } catch (backendError) {
          // Failed to delete token from backend
        }
      }

      setToken(null);
      setIsSubscribed(false);
      
      // Clear persisted state
      setStoredSubscription(null);
      
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'حدث خطأ أثناء إلغاء الاشتراك';
      setError(errorMsg);
      onError?.(errorMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [token, onError]);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    token,
    error,
    subscribe,
    unsubscribe,
  };
}

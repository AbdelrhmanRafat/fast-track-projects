'use client';

import { useState, useCallback, useEffect } from 'react';

// VAPID public key from environment
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

/**
 * Convert VAPID key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}

interface UsePushNotificationsOptions {
  onSubscribed?: () => void;
  onUnsubscribed?: () => void;
  onError?: (error: string) => void;
  onPermissionDenied?: () => void;
}

/**
 * Hook for managing PWA push notifications
 * Handles service worker registration, permission requests, and subscription management
 */
export function usePushNotifications({
  onSubscribed,
  onUnsubscribed,
  onError,
  onPermissionDenied,
}: UsePushNotificationsOptions = {}) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Check support and current subscription status on mount
  useEffect(() => {
    const checkSupport = async () => {
      // Check if push notifications are supported
      const supported =
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window;

      setIsSupported(supported);

      if (!supported) {
        return;
      }

      // Get current permission status
      const currentPermission = Notification.permission;
      setPermission(currentPermission);

      // Register service worker
      try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        setRegistration(reg);

        // Check existing subscription
        const subscription = await reg.pushManager.getSubscription();
        
        if (subscription) {
          setIsSubscribed(true);
          // Verify with server
          await checkSubscriptionStatus(subscription.endpoint);
        }
      } catch (err) {
        // Service worker registration failed
      }
    };

    checkSupport();
  }, []);

  // Check subscription status with server
  const checkSubscriptionStatus = async (endpoint: string) => {
    try {
      const response = await fetch(`/api/push/subscribe?endpoint=${encodeURIComponent(endpoint)}`, {
        credentials: 'include',
      });
      const data = await response.json();
      setIsSubscribed(data.data?.isSubscribed ?? false);
    } catch (err) {
      // Error checking subscription
    }
  };

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      return 'denied';
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'denied') {
        onPermissionDenied?.();
      }

      return result;
    } catch (err) {
      return 'denied';
    }
  }, [isSupported, onPermissionDenied]);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !registration) {
      const errorMsg = 'الإشعارات غير مدعومة في هذا المتصفح';
      setError(errorMsg);
      onError?.(errorMsg);
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Request permission if not granted
      if (Notification.permission !== 'granted') {
        const perm = await requestPermission();
        if (perm !== 'granted') {
          setError('تم رفض إذن الإشعارات');
          onError?.('تم رفض إذن الإشعارات');
          setIsLoading(false);
          return false;
        }
      }

      // Check if VAPID key is configured
      if (!VAPID_PUBLIC_KEY) {
        const errorMsg = 'لم يتم تكوين مفتاح VAPID - يرجى إضافة NEXT_PUBLIC_VAPID_PUBLIC_KEY في إعدادات Vercel';
        setError(errorMsg);
        onError?.(errorMsg);
        setIsLoading(false);
        return false;
      }

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      // Get subscription keys
      const subscriptionJSON = subscription.toJSON();
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          subscription: {
            endpoint: subscriptionJSON.endpoint,
            keys: subscriptionJSON.keys,
          },
          deviceInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
          },
        }),
      });

      const data = await response.json();

      if (data.code === 200 || response.ok) {
        setIsSubscribed(true);
        onSubscribed?.();
        return true;
      } else {
        const errorMsg = data.message || 'فشل في الاشتراك';
        setError(errorMsg);
        onError?.(errorMsg);
        // Unsubscribe locally if server failed
        await subscription.unsubscribe();
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ أثناء الاشتراك';
      setError(errorMessage);
      onError?.(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, registration, requestPermission, onSubscribed, onError]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!registration) {
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get current subscription
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from server first
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            endpoint: subscription.endpoint,
          }),
        });

        // Unsubscribe locally
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      onUnsubscribed?.();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ أثناء إلغاء الاشتراك';
      setError(errorMessage);
      onError?.(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [registration, onUnsubscribed, onError]);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    error,
    subscribe,
    unsubscribe,
    requestPermission,
  };
}

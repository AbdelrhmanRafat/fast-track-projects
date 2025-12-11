'use client';

import { createContext, useContext, ReactNode, useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { 
  initializeFirebase, 
  getFirebaseMessaging, 
  requestNotificationPermissionAndGetToken,
  onForegroundMessage 
} from '@/lib/firebase';
import { triggerBadgeRefresh } from './BadgeProvider';

interface FCMContextType {
  isSupported: boolean;
  isInitialized: boolean;
  fcmToken: string | null;
  permission: NotificationPermission | null;
  isLoading: boolean;
  error: string | null;
  requestPermissionAndSubscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
}

const FCMContext = createContext<FCMContextType>({
  isSupported: false,
  isInitialized: false,
  fcmToken: null,
  permission: null,
  isLoading: false,
  error: null,
  requestPermissionAndSubscribe: async () => false,
  unsubscribe: async () => false,
});

interface FCMProviderProps {
  children: ReactNode;
  autoInitialize?: boolean;
}

/**
 * FCM Provider Component
 * Handles Firebase Cloud Messaging initialization and foreground notifications
 * 
 * Features:
 * - Auto-initializes Firebase on mount
 * - Listens for foreground messages and shows toast notifications
 * - Registers FCM token with backend
 * - Triggers badge refresh on new notifications
 */
export function FCMProvider({ 
  children, 
  autoInitialize = true 
}: FCMProviderProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const cleanupRef = useRef<(() => void) | null>(null);
  const hasInitialized = useRef(false);

  // Check browser support
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const supported = 
      'serviceWorker' in navigator &&
      'Notification' in window &&
      'PushManager' in window;

    setIsSupported(supported);
    setPermission(Notification.permission);
  }, []);

  // Handle foreground messages
  const setupForegroundListener = useCallback(() => {
    const cleanup = onForegroundMessage((payload) => {
      
      const title = payload.notification?.title || 'إشعار جديد';
      const body = payload.notification?.body || '';
      const data = payload.data || {};

      // Show toast notification
      toast(title, {
        description: body,
        duration: 6000,
        position: 'top-center',
        action: data.url ? {
          label: 'عرض',
          onClick: () => {
            window.location.href = data.url;
          },
        } : undefined,
      });

      // Trigger badge refresh to update notification count
      triggerBadgeRefresh();

      // Also show native notification if permission granted
      if (Notification.permission === 'granted') {
        try {
          new Notification(title, {
            body,
            icon: '/icons/icon-192x192.png',
            dir: 'rtl',
            tag: data.type || 'notification',
            data: data,
          });
        } catch (err) {
          // Native notification might fail in some contexts, that's ok
        }
      }
    });

    if (cleanup) {
      cleanupRef.current = cleanup;
    }
  }, []);

  // Register FCM token with backend
  const registerTokenWithBackend = useCallback(async (token: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          fcmToken: token,
          deviceInfo: {
            platform: 'web',
            userAgent: navigator.userAgent,
            language: navigator.language,
          },
        }),
      });

      const data = await response.json();

      if (data.code === 200) {
        return true;
      } else {
        return false;
      }
    } catch (err) {
      return false;
    }
  }, []);

  // Unregister FCM token from backend
  const unregisterTokenFromBackend = useCallback(async (token: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ fcmToken: token }),
      });

      const data = await response.json();

      return data.code === 200;
    } catch (err) {
      return false;
    }
  }, []);

  // Request permission and subscribe to notifications
  const requestPermissionAndSubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('الإشعارات غير مدعومة في هذا المتصفح');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Request permission and get token
      const token = await requestNotificationPermissionAndGetToken();
      
      if (!token) {
        setError('فشل في الحصول على رمز الإشعارات');
        setIsLoading(false);
        return false;
      }

      setFcmToken(token);
      setPermission(Notification.permission);

      // Register with backend
      const registered = await registerTokenWithBackend(token);
      
      if (registered) {
        // Setup foreground listener
        setupForegroundListener();
        setIsInitialized(true);
      }

      setIsLoading(false);
      return registered;
    } catch (err) {
      setError('حدث خطأ أثناء تفعيل الإشعارات');
      setIsLoading(false);
      return false;
    }
  }, [isSupported, registerTokenWithBackend, setupForegroundListener]);

  // Unsubscribe from notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!fcmToken) {
      return true;
    }

    setIsLoading(true);

    try {
      const success = await unregisterTokenFromBackend(fcmToken);
      
      if (success) {
        setFcmToken(null);
        setIsInitialized(false);
        
        // Cleanup listener
        if (cleanupRef.current) {
          cleanupRef.current();
          cleanupRef.current = null;
        }
      }

      setIsLoading(false);
      return success;
    } catch (err) {
      setIsLoading(false);
      return false;
    }
  }, [fcmToken, unregisterTokenFromBackend]);

  // Auto-initialize if permission already granted
  useEffect(() => {
    if (!autoInitialize || !isSupported || hasInitialized.current) {
      return;
    }

    // Only auto-init if permission is already granted
    if (Notification.permission === 'granted') {
      hasInitialized.current = true;
      
      // Initialize Firebase and get token
      const init = async () => {
        try {
          initializeFirebase();
          
          const token = await requestNotificationPermissionAndGetToken();
          if (token) {
            setFcmToken(token);
            await registerTokenWithBackend(token);
            setupForegroundListener();
            setIsInitialized(true);
          }
        } catch (err) {
          // Auto-init error
        }
      };

      init();
    }
  }, [autoInitialize, isSupported, registerTokenWithBackend, setupForegroundListener]);

  // Register FCM service worker on mount
  useEffect(() => {
    if (typeof window === 'undefined' || !isSupported) return;

    const registerFCMServiceWorker = async () => {
      try {
        // Check if already registered
        const existing = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
        if (existing) {
          return;
        }

        // Register the FCM service worker
        await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      } catch (err) {
        // Failed to register FCM service worker
      }
    };

    registerFCMServiceWorker();
  }, [isSupported]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  const contextValue: FCMContextType = {
    isSupported,
    isInitialized,
    fcmToken,
    permission,
    isLoading,
    error,
    requestPermissionAndSubscribe,
    unsubscribe,
  };

  return (
    <FCMContext.Provider value={contextValue}>
      {children}
    </FCMContext.Provider>
  );
}

/**
 * Hook to access FCM context
 */
export function useFCM() {
  const context = useContext(FCMContext);
  if (!context) {
    throw new Error('useFCM must be used within an FCMProvider');
  }
  return context;
}

/**
 * Hook to automatically request notification permission
 * Call this in components where you want to prompt for permission
 */
export function useRequestFCMPermission() {
  const { isSupported, permission, requestPermissionAndSubscribe, isLoading } = useFCM();

  const requestPermission = useCallback(async () => {
    if (!isSupported || permission === 'denied') {
      return false;
    }
    return requestPermissionAndSubscribe();
  }, [isSupported, permission, requestPermissionAndSubscribe]);

  return {
    requestPermission,
    isSupported,
    permission,
    isLoading,
    canRequest: isSupported && permission !== 'denied',
  };
}

'use client';

import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { AddToHomeScreenPrompt } from '@/components/pwa/AddToHomeScreenPrompt';
import { useAddToHomeScreen } from '@/hooks/useAddToHomeScreen';

interface PWAContextType {
  isInstalled: boolean;
  isInstallable: boolean;
  isOnline: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isPWASupported: boolean;
}

const PWAContext = createContext<PWAContextType>({
  isInstalled: false,
  isInstallable: false,
  isOnline: true,
  isIOS: false,
  isAndroid: false,
  isPWASupported: false,
});

interface PWAProviderProps {
  children: ReactNode;
  showInstallPrompt?: boolean;
}

/**
 * PWA Provider Component
 * Wraps the application with PWA-specific functionality:
 * - Install prompt for mobile users
 * - Online/offline detection
 * - PWA state management
 */
export function PWAProvider({ 
  children, 
  showInstallPrompt = true 
}: PWAProviderProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [isPWASupported, setIsPWASupported] = useState(false);
  const a2hs = useAddToHomeScreen();

  // Track online/offline status
  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check PWA support
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // PWA is supported if service worker is available
    const supported = 'serviceWorker' in navigator;
    setIsPWASupported(supported);
  }, []);

  const contextValue: PWAContextType = {
    isInstalled: a2hs.isInstalled,
    isInstallable: a2hs.isInstallable,
    isOnline,
    isIOS: a2hs.isIOS,
    isAndroid: a2hs.isAndroid,
    isPWASupported,
  };

  return (
    <PWAContext.Provider value={contextValue}>
      {children}
      
      {/* Show install prompt for mobile users */}
      {showInstallPrompt && <AddToHomeScreenPrompt />}
      
      {/* Offline indicator */}
      {!isOnline && (
        <div className="fixed top-0 inset-x-0 z-50 bg-amber-500 text-white text-center py-2 text-sm font-medium animate-in slide-in-from-top duration-300">
          أنت غير متصل بالإنترنت
        </div>
      )}
    </PWAContext.Provider>
  );
}

/**
 * Hook to access PWA context
 */
export function usePWA() {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
}

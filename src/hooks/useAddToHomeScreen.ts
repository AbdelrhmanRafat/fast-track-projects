'use client';

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface UseAddToHomeScreenReturn {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  showIOSInstructions: boolean;
  promptToInstall: () => Promise<void>;
  dismissPrompt: () => void;
  setShowIOSInstructions: (show: boolean) => void;
}

// Storage key for tracking if user dismissed the prompt
const DISMISSED_KEY = 'pwa-install-dismissed';
const DISMISSED_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

/**
 * Hook to manage PWA Add to Home Screen functionality
 * Handles both Android (native prompt) and iOS (manual instructions)
 */
export function useAddToHomeScreen(): UseAddToHomeScreenReturn {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [showDelay, setShowDelay] = useState(false);

  // Add a small delay before showing the prompt (better UX)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowDelay(true);
    }, 3000); // Show after 3 seconds

    return () => clearTimeout(timer);
  }, []);

  // Check if running as installed PWA
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if app is already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (navigator as any).standalone === true;
      setIsInstalled(isStandalone || isIOSStandalone);
    };

    checkInstalled();

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handler = (e: MediaQueryListEvent) => setIsInstalled(e.matches);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Detect platform
  useEffect(() => {
    if (typeof navigator === 'undefined') return;

    const userAgent = navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    const isAndroidDevice = /android/.test(userAgent);

    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);
  }, []);

  // Check if prompt was dismissed recently
  useEffect(() => {
    if (typeof localStorage === 'undefined') {
      setIsChecked(true);
      return;
    }

    const dismissedTime = localStorage.getItem(DISMISSED_KEY);
    if (dismissedTime) {
      const elapsed = Date.now() - parseInt(dismissedTime, 10);
      if (elapsed < DISMISSED_DURATION) {
        setIsDismissed(true);
      } else {
        // Clear old dismissal
        localStorage.removeItem(DISMISSED_KEY);
        setIsDismissed(false);
      }
    } else {
      setIsDismissed(false);
    }
    setIsChecked(true);
  }, []);

  // Listen for beforeinstallprompt event (Android/Desktop Chrome)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Prompt user to install
  const promptToInstall = useCallback(async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!installPrompt) {
      return;
    }

    try {
      await installPrompt.prompt();
      const choiceResult = await installPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      } else {
      }
      
      setInstallPrompt(null);
    } catch (error) {
      // Error prompting to install
    }
  }, [installPrompt, isIOS]);

  // Dismiss the prompt
  const dismissPrompt = useCallback(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(DISMISSED_KEY, Date.now().toString());
    }
    setIsDismissed(true);
    setShowIOSInstructions(false);
  }, []);

  // Determine if app is installable
  // Must wait for isChecked to be true and showDelay before showing prompt
  const isInstallable = isChecked && showDelay && !isInstalled && !isDismissed && (!!installPrompt || isIOS);

  return {
    isInstallable,
    isInstalled,
    isIOS,
    isAndroid,
    showIOSInstructions,
    promptToInstall,
    dismissPrompt,
    setShowIOSInstructions,
  };
}

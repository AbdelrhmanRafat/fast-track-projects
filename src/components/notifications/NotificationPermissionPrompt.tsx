'use client';

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFCM, useRequestFCMPermission } from '@/components/providers/FCMProvider';
import { cn } from '@/lib/utils';

interface NotificationPermissionPromptProps {
  className?: string;
  showOnMount?: boolean;
  delay?: number; // Delay in ms before showing prompt
}

/**
 * Notification Permission Prompt Component
 * Shows a banner/card prompting users to enable push notifications
 * 
 * Only shows if:
 * - Notifications are supported
 * - Permission is not yet granted or denied
 * - User hasn't dismissed it this session
 */
export function NotificationPermissionPrompt({
  className,
  showOnMount = true,
  delay = 3000,
}: NotificationPermissionPromptProps) {
  const { permission, isInitialized } = useFCM();
  const { requestPermission, isSupported, isLoading, canRequest } = useRequestFCMPermission();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Show prompt after delay if conditions are met
  useEffect(() => {
    if (!showOnMount || !isSupported || isDismissed || isInitialized) {
      return;
    }

    // Only show if permission is 'default' (not yet asked)
    if (permission !== 'default') {
      return;
    }

    // Check if dismissed in localStorage
    const dismissed = localStorage.getItem('fcm_prompt_dismissed');
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [showOnMount, isSupported, permission, isDismissed, isInitialized, delay]);

  const handleEnable = async () => {
    const success = await requestPermission();
    if (success) {
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    // Remember dismissal for 24 hours
    localStorage.setItem('fcm_prompt_dismissed', Date.now().toString());
    
    // Clear after 24 hours
    setTimeout(() => {
      localStorage.removeItem('fcm_prompt_dismissed');
    }, 24 * 60 * 60 * 1000);
  };

  // Don't render if not visible or can't request
  if (!isVisible || !canRequest) {
    return null;
  }

  return (
    <div 
      className={cn(
        "fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96",
        "bg-card border border-border rounded-lg shadow-lg p-4",
        "animate-in slide-in-from-bottom-4 duration-300",
        "z-50",
        className
      )}
      role="alert"
      dir="rtl"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
          <Bell className="w-5 h-5 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground">
            تفعيل الإشعارات
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            فعّل الإشعارات لتلقي تنبيهات فورية عن الطلبات والتحديثات
          </p>
          
          <div className="flex items-center gap-2 mt-3">
            <Button
              size="sm"
              onClick={handleEnable}
              disabled={isLoading}
              className="text-xs"
            >
              {isLoading ? 'جاري التفعيل...' : 'تفعيل الآن'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="text-xs text-muted-foreground"
            >
              لاحقاً
            </Button>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Compact notification toggle button
 * Can be placed in settings or navbar
 */
export function NotificationToggleButton({ className }: { className?: string }) {
  const { isSupported, isInitialized, permission, isLoading } = useFCM();
  const { requestPermission } = useRequestFCMPermission();

  if (!isSupported) {
    return null;
  }

  const handleClick = async () => {
    if (permission === 'denied') {
      // Show instructions to enable in browser settings
      alert('لتفعيل الإشعارات، يرجى السماح بها من إعدادات المتصفح');
      return;
    }
    await requestPermission();
  };

  return (
    <Button
      variant={isInitialized ? 'default' : 'outline'}
      size="sm"
      onClick={handleClick}
      disabled={isLoading || permission === 'denied'}
      className={cn("gap-2", className)}
    >
      <Bell className="w-4 h-4" />
      {isLoading ? 'جاري التفعيل...' : 
       isInitialized ? 'الإشعارات مفعلة' : 
       permission === 'denied' ? 'الإشعارات محظورة' :
       'تفعيل الإشعارات'}
    </Button>
  );
}

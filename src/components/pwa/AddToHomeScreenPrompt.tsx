'use client';

import { useAddToHomeScreen } from '@/hooks/useAddToHomeScreen';
import { X, Share, Plus, Download, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddToHomeScreenPromptProps {
  className?: string;
}

/**
 * Add to Home Screen Prompt Component
 * Shows a banner encouraging users to install the PWA
 * - On Android: Shows native install prompt
 * - On iOS: Shows instructions for manual installation
 */
export function AddToHomeScreenPrompt({ className }: AddToHomeScreenPromptProps) {
  const {
    isInstallable,
    isIOS,
    showIOSInstructions,
    promptToInstall,
    dismissPrompt,
    setShowIOSInstructions,
  } = useAddToHomeScreen();

  // Don't render if not installable
  if (!isInstallable) return null;

  // iOS Instructions Modal
  if (showIOSInstructions) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 animate-in fade-in duration-200">
        <div 
          className={cn(
            "w-full max-w-lg bg-background rounded-t-2xl p-6 pb-8",
            "animate-in slide-in-from-bottom duration-300",
            className
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">إضافة التطبيق للشاشة الرئيسية</h3>
            <button
              onClick={() => setShowIOSInstructions(false)}
              className="p-2 rounded-full hover:bg-accent transition-colors"
              aria-label="إغلاق"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Instructions */}
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                1
              </div>
              <div className="flex-1">
                <p className="font-medium mb-1">اضغط على زر المشاركة</p>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Share className="h-5 w-5" />
                  <span>في شريط المتصفح السفلي</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4 p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                2
              </div>
              <div className="flex-1">
                <p className="font-medium mb-1">اختر &quot;إضافة إلى الشاشة الرئيسية&quot;</p>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Plus className="h-5 w-5" />
                  <span>من القائمة المنبثقة</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4 p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                3
              </div>
              <div className="flex-1">
                <p className="font-medium mb-1">اضغط &quot;إضافة&quot;</p>
                <p className="text-muted-foreground text-sm">
                  سيظهر التطبيق على شاشتك الرئيسية
                </p>
              </div>
            </div>
          </div>

          {/* Dismiss button */}
          <button
            onClick={dismissPrompt}
            className="w-full mt-6 py-3 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            لا أريد ذلك الآن
          </button>
        </div>
      </div>
    );
  }

  // Main Install Banner
  return (
    <div 
      className={cn(
        "fixed bottom-0 inset-x-0 z-40 p-4 safe-area-inset-bottom",
        "bg-linear-to-t from-background via-background to-background/95",
        "animate-in slide-in-from-bottom duration-500",
        className
      )}
    >
      <div className="max-w-lg mx-auto">
        <div className="relative bg-card border rounded-2xl shadow-lg p-4">
          {/* Close button */}
          <button
            onClick={dismissPrompt}
            className="absolute top-2 left-2 p-1.5 rounded-full hover:bg-accent transition-colors"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>

          <div className="flex items-center gap-4">
            {/* App Icon */}
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Smartphone className="h-7 w-7 text-primary" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-0.5">Fast Track Projects</h3>
              <p className="text-xs text-muted-foreground">
                أضف التطبيق للشاشة الرئيسية للوصول السريع
              </p>
            </div>

            {/* Install Button */}
            <button
              onClick={promptToInstall}
              className={cn(
                "shrink-0 px-4 py-2 rounded-lg",
                "bg-primary text-primary-foreground",
                "hover:bg-primary/90 transition-colors",
                "text-sm font-medium",
                "flex items-center gap-2"
              )}
            >
              <Download className="h-4 w-4" />
              <span>{isIOS ? 'كيف؟' : 'تثبيت'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

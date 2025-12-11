'use client';

import { useFirebasePush } from '@/hooks/useFirebasePush';
import { Bell, BellOff, BellRing, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

interface PushSettingsProps {
  className?: string;
}

/**
 * PushSettings Component
 * Allows users to enable/disable push notifications using Firebase Cloud Messaging
 */
export function PushSettings({ className }: PushSettingsProps) {
  const { t } = useTranslation();
  const {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    error,
    subscribe,
    unsubscribe,
  } = useFirebasePush({});

  // Not supported
  if (!isSupported) {
    return (
      <Card className={cn('border-amber-200 dark:border-amber-800', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <CardTitle className="text-base">{t('notifications.pushSettings.title')}</CardTitle>
              <CardDescription>{t('notifications.pushSettings.notSupported')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t('notifications.pushSettings.notSupportedDescription')}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Permission denied
  if (permission === 'denied') {
    return (
      <Card className={cn('border-red-200 dark:border-red-800', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <BellOff className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <CardTitle className="text-base">{t('notifications.pushSettings.title')}</CardTitle>
              <CardDescription className="text-red-600 dark:text-red-400">
                {t('notifications.pushSettings.permissionDenied')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t('notifications.pushSettings.permissionDeniedDescription')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'p-2 rounded-lg',
                isSubscribed
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : 'bg-muted'
              )}
            >
              {isSubscribed ? (
                <BellRing className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <Bell className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <CardTitle className="text-base">{t('notifications.pushSettings.title')}</CardTitle>
              <CardDescription>
                {isSubscribed
                  ? t('notifications.pushSettings.enabled')
                  : t('notifications.pushSettings.disabled')}
              </CardDescription>
            </div>
          </div>

          <Button
            variant={isSubscribed ? 'outline' : 'default'}
            size="sm"
            onClick={isSubscribed ? unsubscribe : subscribe}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                {t('common.loading')}
              </>
            ) : isSubscribed ? (
              <>
                <BellOff className="w-4 h-4 ml-2" />
                {t('notifications.pushSettings.disable')}
              </>
            ) : (
              <>
                <Bell className="w-4 h-4 ml-2" />
                {t('notifications.pushSettings.enable')}
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isSubscribed && (
          <Alert className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 dark:text-green-300">
              {t('notifications.pushSettings.enabledDescription')}
            </AlertDescription>
          </Alert>
        )}

        {!isSubscribed && !error && (
          <p className="text-sm text-muted-foreground">
            {t('notifications.pushSettings.description')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

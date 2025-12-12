'use client';

import { useState } from 'react';
import { useBadgeContext } from '@/components/providers/BadgeProvider';
import { useNotifications } from '@/hooks/useNotifications';
import { useTranslation } from '@/hooks/useTranslation';
import { Bell, Loader2, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { NotificationList } from '@/components/notifications/NotificationList';
import { PushSettings } from '@/components/notifications/PushSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface NotificationBellProps {
  className?: string;
  showCount?: boolean;
  onClick?: () => void;
}

/**
 * Notification Bell Component - Modern Design with i18n
 * Displays a bell icon with the unread notifications count badge
 * Opens a popover with the full notifications list
 */
export function NotificationBell({ 
  className, 
  showCount = true,
  onClick 
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();
  const { unreadNotifications: badgeUnreadCount, isLoading: badgeLoading, refresh: refreshBadge } = useBadgeContext();
  const {
    notifications,
    unreadCount,
    isLoading: notificationsLoading,
    refresh: refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  } = useNotifications({ enabled: true });

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      refreshNotifications();
    }
  };

  const handleRefresh = () => {
    if (onClick) {
      onClick();
    }
    refreshBadge();
    refreshNotifications();
  };

  // Wrapper to convert single ID to array for markAsRead
  const handleMarkAsRead = (id: string) => markAsRead([id]);

  // Use unreadCount from notifications hook, fallback to badge context unreadNotifications
  const displayCount = unreadCount > 0 ? unreadCount : badgeUnreadCount;
  
  // Only show loading spinner on initial load when there's no data yet
  const showSpinner = badgeLoading && displayCount === 0 && notifications.length === 0;

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button 
          onClick={handleRefresh}
          className={cn(
            "relative p-2 rounded-full transition-all duration-200",
            "hover:bg-[#5C1A1B]/10 hover:text-[#5C1A1B]",
            "focus:outline-none focus:ring-2 focus:ring-[#5C1A1B]/30 focus:ring-offset-2",
            "active:scale-95",
            displayCount > 0 && "text-[#5C1A1B]",
            className
          )}
          title={t('notifications.title')}
          aria-label={`${t('notifications.title')} - ${displayCount} ${t('notifications.unread')}`}
        >
          {showSpinner ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <Bell className={cn(
              "h-5 w-5 transition-transform",
              displayCount > 0 && "animate-[wiggle_0.5s_ease-in-out]"
            )} />
          )}
          
          {showCount && displayCount > 0 && (
            <span 
              className={cn(
                "absolute -top-0.5 -right-0.5",
                "bg-gradient-to-br from-[#5C1A1B] to-[#7a2324]",
                "text-white shadow-lg",
                "text-[10px] font-bold rounded-full",
                "min-w-[18px] h-[18px]",
                "flex items-center justify-center",
                "px-1 animate-in zoom-in-50 duration-200",
                "ring-2 ring-background"
              )}
            >
              {displayCount > 99 ? '99+' : displayCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[380px] p-0 shadow-xl border-[#5C1A1B]/10" 
        align="end" 
        sideOffset={8}
      >
        <Tabs defaultValue="notifications" className="w-full">
          <TabsList className="w-full grid grid-cols-2 rounded-none border-b bg-gradient-to-r from-[#5C1A1B]/5 to-transparent">
            <TabsTrigger 
              value="notifications" 
              className="rounded-none gap-2 data-[state=active]:border-b-2 data-[state=active]:border-[#5C1A1B] data-[state=active]:text-[#5C1A1B]"
            >
              <Bell className="w-4 h-4" />
              {t('notifications.title')}
              {displayCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 bg-[#5C1A1B] text-white rounded-full">
                  {displayCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="rounded-none gap-2 data-[state=active]:border-b-2 data-[state=active]:border-[#5C1A1B] data-[state=active]:text-[#5C1A1B]"
            >
              <Settings className="w-4 h-4" />
              {t('notifications.settings')}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="notifications" className="mt-0">
            <NotificationList
              notifications={notifications}
              isLoading={notificationsLoading}
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={markAllAsRead}
              onDelete={deleteNotification}
              onDeleteAll={deleteAllNotifications}
              onClose={() => setIsOpen(false)}
            />
          </TabsContent>
          <TabsContent value="settings" className="mt-0 p-4">
            <PushSettings />
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}

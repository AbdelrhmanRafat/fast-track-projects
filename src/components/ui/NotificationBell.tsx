'use client';

import { useState } from 'react';
import { useBadgeContext } from '@/components/providers/BadgeProvider';
import { useNotifications } from '@/hooks/useNotifications';
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
 * Notification Bell Component
 * Displays a bell icon with the pending orders count badge
 * Opens a popover with the full notifications list
 */
export function NotificationBell({ 
  className, 
  showCount = true,
  onClick 
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { pendingCount, isLoading: badgeLoading, refresh: refreshBadge } = useBadgeContext();
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

  // Use unreadCount from notifications if available, otherwise fall back to pendingCount
  const displayCount = unreadCount > 0 ? unreadCount : pendingCount;
  
  // Only show loading spinner on initial load when there's no data yet
  const showSpinner = badgeLoading && displayCount === 0 && notifications.length === 0;

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button 
          onClick={handleRefresh}
          className={cn(
            "relative p-2 rounded-full transition-colors",
            "hover:bg-accent hover:text-accent-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            className
          )}
          title="الإشعارات"
          aria-label={`الإشعارات - ${displayCount} غير مقروء`}
        >
          {showSpinner ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          
          {showCount && displayCount > 0 && (
            <span 
              className={cn(
                "absolute -top-0.5 -right-0.5",
                "bg-destructive text-destructive-foreground",
                "text-xs font-bold rounded-full",
                "min-w-[18px] h-[18px]",
                "flex items-center justify-center",
                "px-1 animate-in zoom-in-50 duration-200"
              )}
            >
              {displayCount > 99 ? '99+' : displayCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[380px] p-0" 
        align="end" 
        sideOffset={8}
      >
        <Tabs defaultValue="notifications" className="w-full">
          <TabsList className="w-full grid grid-cols-2 rounded-none border-b">
            <TabsTrigger value="notifications" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
              <Bell className="w-4 h-4 ml-2" />
              الإشعارات
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
              <Settings className="w-4 h-4 ml-2" />
              الإعدادات
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

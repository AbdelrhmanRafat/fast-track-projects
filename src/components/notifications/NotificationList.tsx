'use client';

import { formatDistanceToNow, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { Trash2, ExternalLink, Check, CheckCheck, Loader2, Bell, BellOff, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslation, useLanguage } from '@/hooks/useTranslation';
import type { Notification } from '@/lib/services/notifications/types';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationListProps {
  notifications: Notification[];
  isLoading?: boolean;
  onMarkAsRead: (id: string) => Promise<boolean>;
  onMarkAllAsRead: () => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onDeleteAll: () => Promise<boolean>;
  onClose: () => void;
}

/**
 * Notification type badge colors - matches backend types
 * Modern gradient-inspired colors with brand accent
 */
const typeColors: Record<string, string> = {
  order_created: 'bg-gradient-to-r from-blue-500/20 to-blue-400/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
  engineering_review: 'bg-gradient-to-r from-purple-500/20 to-purple-400/10 text-purple-600 dark:text-purple-400 border border-purple-500/20',
  admin_review: 'bg-gradient-to-r from-orange-500/20 to-orange-400/10 text-orange-600 dark:text-orange-400 border border-orange-500/20',
  owner_approved: 'bg-gradient-to-r from-green-500/20 to-green-400/10 text-green-600 dark:text-green-400 border border-green-500/20',
  owner_rejected: 'bg-gradient-to-r from-red-500/20 to-red-400/10 text-red-600 dark:text-red-400 border border-red-500/20',
  Projects_started: 'bg-gradient-to-r from-cyan-500/20 to-cyan-400/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20',
  order_closed: 'bg-gradient-to-r from-gray-500/20 to-gray-400/10 text-gray-600 dark:text-gray-400 border border-gray-500/20',
  item_status_changed: 'bg-gradient-to-r from-yellow-500/20 to-yellow-400/10 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20',
  system: 'bg-gradient-to-r from-[#5C1A1B]/20 to-[#5C1A1B]/10 text-[#5C1A1B] dark:text-[#d4a5a6] border border-[#5C1A1B]/20',
};

/**
 * Type icon mapping for visual distinction
 */
const typeIcons: Record<string, React.ReactNode> = {
  order_created: <Sparkles className="w-3 h-3" />,
  owner_approved: <Check className="w-3 h-3" />,
  owner_rejected: <BellOff className="w-3 h-3" />,
  system: <Bell className="w-3 h-3" />,
};

/**
 * NotificationList Component - Modern Mobile-First Design
 * Displays a scrollable list of notifications with actions and i18n support
 */
export function NotificationList({
  notifications,
  isLoading,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onDeleteAll,
  onClose,
}: NotificationListProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  
  // Ensure notifications is always an array
  const notificationsList = Array.isArray(notifications) ? notifications : [];
  
  // Empty state
  if (!isLoading && notificationsList.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 px-6 text-center"
      >
        <div className="relative">
          <div className="w-20 h-20 bg-linear-to-br from-[#5C1A1B]/10 to-[#5C1A1B]/5 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <Bell className="w-10 h-10 text-[#5C1A1B]/40" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
            <Check className="w-4 h-4 text-green-600" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {t('notifications.noNotifications')}
        </h3>
        <p className="text-sm text-muted-foreground max-w-[200px]">
          {t('notifications.noNotificationsDescription')}
        </p>
      </motion.div>
    );
  }

  // Loading state
  if (isLoading && notificationsList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-[#5C1A1B]/20 border-t-[#5C1A1B] animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground">{t('notifications.loading')}</p>
      </div>
    );
  }

  const unreadCount = notificationsList.filter((n) => !n.is_read).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header with actions - Modern gradient design */}
      <div className="flex items-center justify-between px-4 py-3 bg-linear-to-r from-[#5C1A1B]/5 to-transparent border-b border-[#5C1A1B]/10">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            {t('notifications.title')}
          </span>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-[#5C1A1B] text-white rounded-full animate-pulse">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs gap-1 text-[#5C1A1B] hover:bg-[#5C1A1B]/10"
              onClick={onMarkAllAsRead}
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('notifications.markAllAsRead')}</span>
            </Button>
          )}
          {notificationsList.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={onDeleteAll}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('notifications.deleteAll')}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Notifications list with modern styling */}
      <ScrollArea className="flex-1 max-h-[400px]">
        <AnimatePresence mode="popLayout">
          <div className="divide-y divide-border/50">
            {notificationsList.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isRTL ? -20 : 20 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <NotificationItem
                  notification={notification}
                  onMarkAsRead={onMarkAsRead}
                  onDelete={onDelete}
                  onClose={onClose}
                  language={language}
                />
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      </ScrollArea>
    </div>
  );
}

/**
 * Single notification item - Modern card-like design
 */
interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onClose: () => void;
  language: string;
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onClose,
  language,
}: NotificationItemProps) {
  const { t } = useTranslation();
  const isRTL = language === 'ar';
  
  const handleClick = async () => {
    if (!notification.is_read) {
      await onMarkAsRead(notification.id);
    }
    onClose();
  };

  // Get localized time ago
  const getTimeAgo = () => {
    const date = new Date(notification.created_at);
    const locale = language === 'ar' ? ar : enUS;
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale,
    });
  };

  const actionUrl = notification.data?.actionUrl || 
    (notification.order_id ? `/orders/${notification.order_id}` : null);

  // Get translated type label
  const getTypeLabel = (type: string): string => {
    const key = `notifications.types.${type}` as const;
    const translated = t(key as any);
    // If translation key returns itself, use default
    return translated === key ? t('notifications.types.default') : translated;
  };

  return (
    <div
      className={cn(
        'relative px-4 py-4 transition-all duration-200 group',
        'hover:bg-linear-to-r hover:from-accent/50 hover:to-transparent',
        !notification.is_read && 'bg-linear-to-r from-[#5C1A1B]/5 to-transparent'
      )}
    >
      {/* Unread indicator - Modern bar design */}
      {!notification.is_read && (
        <div 
          className={cn(
            "absolute top-0 bottom-0 w-1 bg-linear-to-b from-[#5C1A1B] to-[#5C1A1B]/50 rounded-full",
            isRTL ? "right-0" : "left-0"
          )} 
        />
      )}

      <div className={cn("flex items-start gap-3", isRTL ? "pr-3" : "pl-3")}>
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title and Type Badge Row */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm text-foreground line-clamp-1 mb-1">
                {notification.title}
              </h4>
              <span
                className={cn(
                  'inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium',
                  typeColors[notification.type] || typeColors.system
                )}
              >
                {typeIcons[notification.type]}
                {getTypeLabel(notification.type)}
              </span>
            </div>
            
            {/* Time - Elegant display */}
            <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">
              {getTimeAgo()}
            </span>
          </div>

          {/* Body - Modern truncation */}
          <p className="text-sm text-muted-foreground/90 line-clamp-2 leading-relaxed">
            {notification.body}
          </p>
        </div>
      </div>

      {/* Actions - Revealed on hover for cleaner look */}
      <div 
        className={cn(
          "flex items-center gap-1 mt-3 pt-2 border-t border-border/50",
          "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200"
        )}
      >
        {actionUrl && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1 flex-1 sm:flex-none border-[#5C1A1B]/20 text-[#5C1A1B] hover:bg-[#5C1A1B]/10"
            asChild
            onClick={handleClick}
          >
            <Link href={actionUrl}>
              <ExternalLink className="w-3 h-3" />
              {t('notifications.viewOrder')}
            </Link>
          </Button>
        )}
        {!notification.is_read && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 text-green-600 hover:bg-green-500/10"
            onClick={() => onMarkAsRead(notification.id)}
          >
            <Check className="w-3 h-3" />
            <span className="hidden sm:inline">{t('notifications.markAsRead')}</span>
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(notification.id)}
        >
          <Trash2 className="w-3 h-3" />
          <span className="hidden sm:inline">{t('notifications.delete')}</span>
        </Button>
      </div>
    </div>
  );
}

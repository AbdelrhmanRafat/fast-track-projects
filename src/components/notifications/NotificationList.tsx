'use client';

import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Trash2, ExternalLink, Check, CheckCheck, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Notification } from '@/lib/services/notifications/types';

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
 */
const typeColors: Record<string, string> = {
  order_created: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  engineering_review: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  admin_review: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  owner_approved: 'bg-green-500/10 text-green-600 dark:text-green-400',
  owner_rejected: 'bg-red-500/10 text-red-600 dark:text-red-400',
  purchasing_started: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  order_closed: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
  item_status_changed: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  system: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
};

/**
 * NotificationList Component
 * Displays a scrollable list of notifications with actions
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
  // Ensure notifications is always an array
  const notificationsList = Array.isArray(notifications) ? notifications : [];
  
  // Empty state
  if (!isLoading && notificationsList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Check className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">لا توجد إشعارات</h3>
        <p className="text-sm text-muted-foreground">ستظهر هنا الإشعارات الجديدة عند وصولها</p>
      </div>
    );
  }

  // Loading state
  if (isLoading && notificationsList.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const unreadCount = notificationsList.filter((n) => !n.is_read).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header with actions */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-medium text-foreground">
          الإشعارات
          {unreadCount > 0 && (
            <span className="mr-2 text-xs text-muted-foreground">
              ({unreadCount} غير مقروء)
            </span>
          )}
        </span>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={onMarkAllAsRead}
            >
              <CheckCheck className="w-3.5 h-3.5 ml-1" />
              قراءة الكل
            </Button>
          )}
          {notificationsList.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-destructive hover:text-destructive"
              onClick={onDeleteAll}
            >
              <Trash2 className="w-3.5 h-3.5 ml-1" />
              حذف الكل
            </Button>
          )}
        </div>
      </div>

      {/* Notifications list */}
      <ScrollArea className="flex-1 max-h-[400px]">
        <div className="divide-y divide-border">
          {notificationsList.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={onMarkAsRead}
              onDelete={onDelete}
              onClose={onClose}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

/**
 * Single notification item
 */
interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onClose: () => void;
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onClose,
}: NotificationItemProps) {
  const handleClick = async () => {
    if (!notification.is_read) {
      await onMarkAsRead(notification.id);
    }
    onClose();
  };

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: ar,
  });

  const actionUrl = notification.data?.actionUrl || 
    (notification.order_id ? `/orders/${notification.order_id}` : null);

  return (
    <div
      className={cn(
        'relative px-4 py-3 hover:bg-accent/50 transition-colors',
        !notification.is_read && 'bg-primary/5'
      )}
    >
      {/* Unread indicator */}
      {!notification.is_read && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary" />
      )}

      <div className="flex items-start gap-3 pr-4">
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm text-foreground truncate">
              {notification.title}
            </h4>
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                typeColors[notification.type] || typeColors.system
              )}
            >
              {getTypeLabel(notification.type)}
            </span>
          </div>

          {/* Body */}
          <p className="text-sm text-muted-foreground line-clamp-2 mb-1">
            {notification.body}
          </p>

          {/* Time */}
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {actionUrl && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              asChild
              onClick={handleClick}
            >
              <Link href={actionUrl}>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </Button>
          )}
          {!notification.is_read && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onMarkAsRead(notification.id)}
            >
              <Check className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => onDelete(notification.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Get Arabic label for notification type - matches backend types
 */
function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    order_created: 'طلب جديد',
    engineering_review: 'مراجعة هندسية',
    admin_review: 'مراجعة إدارية',
    owner_approved: 'موافقة',
    owner_rejected: 'رفض',
    purchasing_started: 'شراء',
    order_closed: 'مغلق',
    item_status_changed: 'تحديث بند',
    system: 'نظام',
  };
  return labels[type] || 'إشعار';
}

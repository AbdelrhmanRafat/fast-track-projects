'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/components/providers/LanguageProvider';
import RouteBasedPageHeader from '@/components/SharedCustomComponents/RouteBasedPageHeader';
import { 
  Package,
  Calendar,
  FileText,
  Paperclip,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  FileIcon,
  Eye,
} from 'lucide-react';
import type { Order, OrderItem, OrderStatus, ItemPurchaseStatus, Attachment } from '@/lib/services/orders/types';

// ============================================
// Shared Utilities and Components
// ============================================

/**
 * Get status badge with appropriate styling for light/dark mode
 */
export function getStatusBadge(status: OrderStatus, t: (key: any) => string) {
  const statusConfig: Record<string, { className: string; labelKey: string }> = {
    'تم اجراء الطلب': { 
      className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700', 
      labelKey: 'orders.status.requestCreated' 
    },
    'تمت المراجعة الهندسية': { 
      className: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800', 
      labelKey: 'orders.status.engineeringReviewed' 
    },
    'مراجعة الطلب من الادارة': { 
      className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800', 
      labelKey: 'orders.status.underAdminReview' 
    },
    'تمت الموافقة من الادارة': { 
      className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', 
      labelKey: 'orders.status.ownerApproved' 
    },
    'تم الرفض من الادارة': { 
      className: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-800', 
      labelKey: 'orders.status.ownerRejected' 
    },
    'جاري الان عملية الشراء': { 
      className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200 dark:border-amber-800', 
      labelKey: 'orders.status.purchasingInProgress' 
    },
    'تم غلق طلب الشراء': { 
      className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 border-purple-200 dark:border-purple-800', 
      labelKey: 'orders.status.closed' 
    },
  };
  
  const config = statusConfig[status] || { 
    className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', 
    labelKey: 'common.unspecified' 
  };
  return (
    <Badge variant="outline" className={`${config.className} text-sm px-3 py-1`}>
      {t(config.labelKey as any)}
    </Badge>
  );
}

/**
 * Get item purchase status badge
 * Handles null (Pending), 'تم الشراء' (Purchased), and 'لم يتم الشراء' (Not Purchased)
 */
export function getItemStatusBadge(status: ItemPurchaseStatus | string | null, t: (key: any) => string) {
  // تم الشراء - Purchased
  if (status === 'تم الشراء') {
    return (
      <Badge variant="outline" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
        <CheckCircle2 className="h-3 w-3 me-1" />
        {t('orders.itemStatus.purchased')}
      </Badge>
    );
  }
  
  // لم يتم الشراء - Not Purchased
  if (status === 'لم يتم الشراء') {
    return (
      <Badge variant="outline" className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-800">
        <XCircle className="h-3 w-3 me-1" />
        {t('orders.itemStatus.notPurchased')}
      </Badge>
    );
  }
  
  // null or undefined - معلق (Pending) - Default state
  return (
    <Badge variant="outline" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700">
      <Clock className="h-3 w-3 me-1" />
      {t('orders.itemStatus.pending')}
    </Badge>
  );
}

/**
 * Get admin approval status badge for an item
 */
export function getAdminApprovalBadge(approvedByAdmin: boolean | null, t: (key: any) => string) {
  // Approved
  if (approvedByAdmin === true) {
    return (
      <Badge variant="outline" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
        <CheckCircle2 className="h-3 w-3 me-1" />
        {t('orders.itemApproval.approved')}
      </Badge>
    );
  }
  
  // Rejected
  if (approvedByAdmin === false) {
    return (
      <Badge variant="outline" className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-800">
        <XCircle className="h-3 w-3 me-1" />
        {t('orders.itemApproval.rejected')}
      </Badge>
    );
  }
  
  // Pending (null)
  return (
    <Badge variant="outline" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700">
      <Clock className="h-3 w-3 me-1" />
      {t('orders.itemApproval.pending')}
    </Badge>
  );
}

/**
 * Format date for display (Gregorian calendar)
 */
export function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ============================================
// Attachment Preview Component
// ============================================

interface AttachmentGridProps {
  attachments: Attachment[];
  t: (key: any) => string;
}

/**
 * Check if file is an image based on file type or extension
 */
function isImageFile(attachment: Attachment): boolean {
  const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp'];
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
  
  if (attachment.file_type && imageTypes.includes(attachment.file_type.toLowerCase())) {
    return true;
  }
  
  const fileName = attachment.file_name.toLowerCase();
  return imageExtensions.some(ext => fileName.endsWith(ext));
}

/**
 * Check if file is a PDF
 */
function isPdfFile(attachment: Attachment): boolean {
  if (attachment.file_type === 'application/pdf') {
    return true;
  }
  return attachment.file_name.toLowerCase().endsWith('.pdf');
}

/**
 * Attachment Grid Component - Displays attachments in a minimal grid with previews
 */
export function AttachmentGrid({ attachments, t }: AttachmentGridProps) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Paperclip className="h-3.5 w-3.5" />
        {t('orders.form.attachments')} ({attachments.length})
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {attachments.map((attachment) => (
          <AttachmentPreviewCard key={attachment.id} attachment={attachment} />
        ))}
      </div>
    </div>
  );
}

interface AttachmentPreviewCardProps {
  attachment: Attachment;
}

/**
 * Individual Attachment Preview Card
 */
function AttachmentPreviewCard({ attachment }: AttachmentPreviewCardProps) {
  const [imageError, setImageError] = useState(false);
  const isImage = isImageFile(attachment);
  const isPdf = isPdfFile(attachment);

  return (
    <div className="group relative bg-muted/30 dark:bg-muted/20 rounded-lg overflow-hidden border border-border/50 hover:border-primary/30 transition-all">
      {/* Preview Area */}
      <div className="aspect-square relative bg-muted/50 flex items-center justify-center overflow-hidden">
        {isImage && !imageError ? (
          <img
            src={attachment.public_url}
            alt={attachment.file_name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : isPdf ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 dark:bg-red-950/20">
            <FileText className="h-10 w-10 text-red-500 mb-1" />
            <span className="text-xs font-medium text-red-600 dark:text-red-400">PDF</span>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <FileIcon className="h-10 w-10 text-muted-foreground mb-1" />
            <span className="text-xs text-muted-foreground uppercase">
              {attachment.file_name.split('.').pop() || 'FILE'}
            </span>
          </div>
        )}

        {/* Hover Overlay with View Button */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <a
            href={attachment.public_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-md text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">عرض</span>
          </a>
        </div>
      </div>

      {/* File Name */}
      <div className="p-2">
        <p className="text-xs text-muted-foreground truncate" title={attachment.file_name}>
          {attachment.file_name}
        </p>
      </div>

      {/* External Link Icon - Always visible on mobile */}
      <a
        href={attachment.public_url}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-2 right-2 p-1.5 bg-white/90 dark:bg-gray-800/90 rounded-md shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
        title="فتح في نافذة جديدة"
      >
        <ExternalLink className="h-3.5 w-3.5 text-gray-600 dark:text-gray-300" />
      </a>
    </div>
  );
}

// ============================================
// Shared Layout Components
// ============================================

interface OrderHeaderProps {
  order: Order;
  t: (key: any) => string;
  isRTL: boolean;
  actions?: React.ReactNode;
}

export function OrderHeader({ order, t, isRTL, actions }: OrderHeaderProps) {
  return (
    <>
      <RouteBasedPageHeader />

      {/* Fast-Track Branding */}
      <div className="flex items-center justify-center py-4">
        <Image
          src="/app-logo.svg"
          alt="Fast-Track"
          width={180}
          height={60}
          className="h-12 w-auto"
          priority
        />
      </div>

      {/* Actions */}
      {actions && (
        <div className="flex justify-end gap-2 flex-wrap">
          {actions}
        </div>
      )}
    </>
  );
}

interface OrderInfoCardProps {
  order: Order;
  t: (key: any) => string;
}

export function OrderInfoCard({ order, t }: OrderInfoCardProps) {
  return (
    <Card className="overflow-hidden p-0 gap-0">
      <div className="bg-primary px-5 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/15">
            <Package className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary-foreground">{order.title}</h2>
            <p className="text-primary-foreground/70 text-sm">{t('orders.orderDetails')}</p>
          </div>
        </div>
        {getStatusBadge(order.status as OrderStatus, t)}
      </div>
      <CardContent className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{t('orders.orderDate')}</p>
            <p className="font-medium">{formatDate(order.created_at)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('orders.table.createdBy')}</p>
            <p className="font-medium">{order.created_by_name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('orders.table.itemsCount')}</p>
            <p className="font-medium">{order.items?.length || 0} {t('orders.items.count')}</p>
          </div>
          {order.updated_by_name && (
            <div>
              <p className="text-sm text-muted-foreground">{t('orders.sidebar.lastUpdateBy')}</p>
              <p className="font-medium">{order.updated_by_name}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface OrderItemsCardProps {
  order: Order;
  t: (key: any) => string;
  itemActions?: (item: OrderItem, index: number) => React.ReactNode;
}

export function OrderItemsCard({ order, t, itemActions }: OrderItemsCardProps) {
  return (
    <Card className="overflow-hidden p-0 gap-0">
      <div className="bg-primary px-4 py-3 sm:px-5 sm:py-4 flex items-center gap-3 flex-wrap">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/15">
          <Package className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-semibold text-primary-foreground">{t('orders.form.orderItems')}</span>
        <Badge variant="secondary" className="ms-auto bg-white/20 text-primary-foreground border-0">
          {order.items?.length || 0}
        </Badge>
      </div>
      <CardContent className="p-5 space-y-4">
        {order.items && order.items.length > 0 ? (
          order.items.map((item, index) => (
            <div 
              key={item.id} 
              className="bg-muted/40 dark:bg-muted/20 rounded-lg p-4 space-y-3"
            >
              {/* Item Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <span className="w-7 h-7 flex items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground break-word whitespace-normal">{item.title}</h4>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mt-1 break-word whitespace-normal">{item.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-0 sm:shrink-0">
                  {/* Admin Approval Badge - show only if admin has reviewed */}
                  {item.approved_by_admin !== null && item.approved_by_admin !== undefined && (
                    getAdminApprovalBadge(item.approved_by_admin, t)
                  )}
                  {/* Purchase Status Badge - hide if item is rejected by admin */}
                  {item.approved_by_admin !== false && getItemStatusBadge(item.purchase_status, t)}
                  {itemActions && itemActions(item, index)}
                </div>
              </div>

              {/* Item Notes (Purchasing Notes) - show if exists */}
              {item.item_notes && (
                <div className="ms-9 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    <span className="font-medium">{t('orders.itemNotes')}:</span> {item.item_notes}
                  </p>
                </div>
              )}

              {/* Item Attachments - Grid Preview */}
              {item.attachments && item.attachments.length > 0 && (
                <>
                  <Separator />
                  <AttachmentGrid attachments={item.attachments} t={t} />
                </>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {t('orders.noItems')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface OrderSidebarProps {
  order: Order;
  t: (key: any) => string;
}

export function OrderSidebar({ order, t }: OrderSidebarProps) {
  return (
    <div className="space-y-4">
      {/* Order Info */}
      <Card className="overflow-hidden p-0 gap-0">
        <div className="bg-primary px-4 py-3 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary-foreground" />
          <span className="font-medium text-primary-foreground text-sm">{t('orders.form.orderInfo')}</span>
        </div>
        <CardContent className="p-4 space-y-3">
          <div>
            <p className="text-xs text-muted-foreground">{t('orders.orderStatus')}</p>
            <div className="mt-1">{getStatusBadge(order.status as OrderStatus, t)}</div>
          </div>
          <Separator />
          <div>
            <p className="text-xs text-muted-foreground">{t('orders.orderDate')}</p>
            <p className="font-medium text-sm">{formatDateTime(order.created_at)}</p>
          </div>
          {order.updated_at !== order.created_at && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground">{t('orders.sidebar.lastUpdate')}</p>
                <p className="font-medium text-sm">{formatDateTime(order.updated_at)}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Order Notes */}
      {order.order_notes && (
        <Card className="overflow-hidden p-0 gap-0">
          <div className="bg-primary px-4 py-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary-foreground" />
            <span className="font-medium text-primary-foreground text-sm">{t('orders.form.notes')}</span>
          </div>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{order.order_notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Purchasing Notes (if exists) */}
      {order.purchasing_notes && (
        <Card className="overflow-hidden p-0 gap-0">
          <div className="bg-amber-600 px-4 py-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-white" />
            <span className="font-medium text-white text-sm">{t('orders.sidebar.purchasingNotes')}</span>
          </div>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{order.purchasing_notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Rejection Reason (if rejected) */}
      {order.rejection_reason && (
        <Card className="overflow-hidden p-0 gap-0">
          <div className="bg-red-600 px-4 py-3 flex items-center gap-2">
            <XCircle className="h-4 w-4 text-white" />
            <span className="font-medium text-white text-sm">{t('orders.sidebar.rejectionReason')}</span>
          </div>
          <CardContent className="p-4">
            <p className="text-sm text-red-600 dark:text-red-400 whitespace-pre-wrap">{order.rejection_reason}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

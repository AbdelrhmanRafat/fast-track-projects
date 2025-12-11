'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useTranslation } from '@/components/providers/LanguageProvider';
import RouteBasedPageHeader from '@/components/SharedCustomComponents/RouteBasedPageHeader';
import { useErrorStore } from '@/stores/errorStore';
import { getUserData } from '@/lib/cookies';
import { UserRole } from '@/lib/types/userRoles';
import { updateOrderStatus } from '@/lib/services/orders';
import { OrderStatus } from '@/lib/services/orders/types';
import { 
  ArrowRight,
  ArrowLeft,
  Edit,
  Printer,
  Package,
  Calendar,
  FileText,
  Paperclip,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  ShoppingCart,
  Eye,
  FileIcon,
  User,
} from 'lucide-react';
import Link from 'next/link';
import type { Order, OrderItem, ItemPurchaseStatus, Attachment } from '@/lib/services/orders/types';

interface OrderDetailsClientProps {
  order: Order;
}

// ============================================
// Attachment Preview Helpers
// ============================================

function isImageFile(attachment: Attachment): boolean {
  const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp'];
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
  
  if (attachment.file_type && imageTypes.includes(attachment.file_type.toLowerCase())) {
    return true;
  }
  
  const fileName = attachment.file_name.toLowerCase();
  return imageExtensions.some(ext => fileName.endsWith(ext));
}

function isPdfFile(attachment: Attachment): boolean {
  if (attachment.file_type === 'application/pdf') {
    return true;
  }
  return attachment.file_name.toLowerCase().endsWith('.pdf');
}

interface AttachmentPreviewProps {
  attachment: Attachment;
}

function AttachmentPreviewCard({ attachment }: AttachmentPreviewProps) {
  const [imageError, setImageError] = React.useState(false);
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

export default function OrderDetailsClient({ order }: OrderDetailsClientProps) {
  const { t, isRTL } = useTranslation();
  const router = useRouter();
  const { showError } = useErrorStore();
  
  // User role state
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  
  // Owner review state (approve/reject)
  const [reviewDecision, setReviewDecision] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  
  // Purchasing state
  const [isStartingPurchasing, setIsStartingPurchasing] = useState(false);

  // Fetch user role on mount
  useEffect(() => {
    const fetchUserRole = async () => {
      const userData = await getUserData();
      if (userData?.role) {
        setUserRole(userData.role as UserRole);
      }
    };
    fetchUserRole();
  }, []);

  // Role checks
  const isAdmin = userRole === UserRole.Admin;
  const isSubAdmin = userRole === UserRole.SubAdmin;
  const isOwner = isAdmin || isSubAdmin;
  const isPurchasing = userRole === UserRole.Purchasing;
  
  // Status checks
  const isOwnerReview = order.status === OrderStatus.UNDER_ADMIN_REVIEW;
  const isOwnerApproved = order.status === OrderStatus.OWNER_APPROVED;
  const isPurchasingInProgress = order.status === OrderStatus.PURCHASING_IN_PROGRESS;
  const isClosed = order.status === OrderStatus.ORDER_CLOSED;
  
  // Permission checks
  const canReviewOrder = isOwner && isOwnerReview;
  const canEditOrder = isOwner && isOwnerReview;
  const canStartPurchasing = (isPurchasing || isAdmin) && isOwnerApproved;
  const canEditItemStatus = (isPurchasing || isAdmin) && (isOwnerApproved || isPurchasingInProgress);

  // Handle owner review submission (approve/reject)
  const handleReviewSubmit = async () => {
    if (!reviewDecision) {
      showError('يرجى اختيار قرار الموافقة أو الرفض', 'error');
      return;
    }
    
    if (reviewDecision === 'reject' && !rejectionReason.trim()) {
      showError('يرجى إدخال سبب الرفض', 'error');
      return;
    }
    
    setIsSubmittingReview(true);
    
    try {
      const newStatus = reviewDecision === 'approve' 
        ? OrderStatus.OWNER_APPROVED 
        : OrderStatus.OWNER_REJECTED;
      
      const result = await updateOrderStatus(order.id, {
        status: newStatus,
        rejection_reason: reviewDecision === 'reject' ? rejectionReason : undefined,
      });
      
      if (result?.data) {
        showError(
          reviewDecision === 'approve' 
            ? 'تمت الموافقة على الطلب بنجاح' 
            : 'تم رفض الطلب بنجاح',
          'success'
        );
        router.refresh();
      } else {
        showError(result?.message || 'فشل في تحديث حالة الطلب', 'error');
      }
    } catch (error: any) {
      showError(error.message || 'حدث خطأ أثناء تحديث الطلب', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Handle starting purchasing process
  const handleStartPurchasing = async () => {
    setIsStartingPurchasing(true);
    
    try {
      const result = await updateOrderStatus(order.id, {
        status: OrderStatus.PURCHASING_IN_PROGRESS,
      });
      
      if (result?.data) {
        showError('تم بدء عملية الشراء بنجاح', 'success');
        router.refresh();
      } else {
        showError(result?.message || 'فشل في بدء عملية الشراء', 'error');
      }
    } catch (error: any) {
      showError(error.message || 'حدث خطأ أثناء بدء عملية الشراء', 'error');
    } finally {
      setIsStartingPurchasing(false);
    }
  };

  // Get status badge with appropriate styling for light/dark mode
  const getStatusBadge = (status: OrderStatus) => {
    const statusConfig: Record<string, { className: string; labelKey: string }> = {
      'تم اجراء الطلب': { 
        className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700', 
        labelKey: 'orders.status.requestCreated' 
      },
      'مراجعة الطلب من الادارة': { 
        className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800', 
        labelKey: 'orders.status.ownerReview' 
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
  };

  // Get item purchase status badge
  const getItemStatusBadge = (status: ItemPurchaseStatus, isSuccessful: boolean | null) => {
    if (status === 'تم الشراء') {
      if (isSuccessful === true) {
        return (
          <Badge variant="outline" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="h-3 w-3 me-1" />
            {t('orders.itemStatus.purchasedSuccess')}
          </Badge>
        );
      } else if (isSuccessful === false) {
        return (
          <Badge variant="outline" className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-800">
            <XCircle className="h-3 w-3 me-1" />
            {t('orders.itemStatus.purchasedFailed')}
          </Badge>
        );
      }
      return (
        <Badge variant="outline" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="h-3 w-3 me-1" />
          {t('orders.itemStatus.purchased')}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700">
        <Clock className="h-3 w-3 me-1" />
        {t('orders.itemStatus.notPurchased')}
      </Badge>
    );
  };

  // Format date for display (Gregorian calendar)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  // Print invoice handler
  const handlePrint = () => {
    window.print();
  };

  // Get print status class based on order status
  const getPrintStatusClass = (status: OrderStatus) => {
    switch(status) {
      case 'تمت الموافقة من الادارة':
        return 'print-status-approved';
      case 'تم الرفض من الادارة':
        return 'print-status-rejected';
      case 'جاري الان عملية الشراء':
        return 'print-status-in-progress';
      default:
        return 'print-status-pending';
    }
  };

  // Get print status text
  const getPrintStatusText = (status: OrderStatus) => {
    const statusMap: Record<string, string> = {
      'تم اجراء الطلب': 'تم اجراء الطلب',
      'تمت المراجعة الهندسية': 'تمت المراجعة الهندسية',
      'مراجعة الطلب من الادارة': 'قيد مراجعة الإدارة',
      'تمت الموافقة من الادارة': 'تمت الموافقة',
      'تم الرفض من الادارة': 'مرفوض',
      'جاري الان عملية الشراء': 'جاري الشراء',
      'تم غلق طلب الشراء': 'مغلق',
    };
    return statusMap[status] || status;
  };

  // Get item purchase status text for print
  const getItemPrintStatus = (status: ItemPurchaseStatus | null) => {
    if (status === 'تم الشراء') return 'تم الشراء';
    if (status === 'لم يتم الشراء') return 'لم يتم الشراء';
    return 'معلق';
  };

  return (
    <>
      {/* ========== PRINT INVOICE LAYOUT (Only visible when printing) ========== */}
      <div className="print-invoice-container print-only">
        {/* Invoice Header */}
        <div className="print-invoice-header">
          <div className="print-invoice-title">
            <h1>طلب شراء</h1>
            <p>Purchase Order</p>
          </div>
          <img 
            src="/app-logo.svg" 
            alt="Fast-Track" 
            className="print-invoice-logo"
          />
        </div>

        {/* Order Info Section */}
        <div className="print-invoice-info">
          <div className="print-invoice-info-block">
            <h3>معلومات الطلب</h3>
            <p><strong>رقم الطلب:</strong> #{order.id}</p>
            <p><strong>عنوان الطلب:</strong> {order.title}</p>
            <p><strong>تاريخ الإنشاء:</strong> {formatDate(order.created_at)}</p>
            <p><strong>آخر تحديث:</strong> {formatDateTime(order.updated_at)}</p>
          </div>
          <div className="print-invoice-info-block">
            <h3>معلومات المنشئ</h3>
            <p><strong>منشئ الطلب:</strong> {order.created_by_name}</p>
            {order.updated_by_name && order.updated_by !== order.created_by && (
              <p><strong>آخر تحديث بواسطة:</strong> {order.updated_by_name}</p>
            )}
            <p><strong>حالة الطلب:</strong></p>
            <span className={`print-status-badge ${getPrintStatusClass(order.status as OrderStatus)}`}>
              {getPrintStatusText(order.status as OrderStatus)}
            </span>
          </div>
        </div>

        {/* Items Table */}
        <table className="print-invoice-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>#</th>
              <th>اسم العنصر</th>
              <th>الوصف</th>
              <th style={{ width: '100px' }}>حالة الشراء</th>
            </tr>
          </thead>
          <tbody>
            {order.items && order.items.length > 0 ? (
              order.items.map((item, index) => (
                <tr key={item.id} className="print-no-break">
                  <td className="print-item-number">{index + 1}</td>
                  <td>
                    <div className="print-item-title">{item.title}</div>
                  </td>
                  <td>
                    {item.description ? (
                      <div className="print-item-description">{item.description}</div>
                    ) : (
                      <span style={{ color: '#999' }}>-</span>
                    )}
                  </td>
                  <td className="print-item-status">
                    <span className={`print-status-badge ${
                      item.purchase_status === 'تم الشراء' 
                        ? 'print-status-approved' 
                        : item.purchase_status === 'لم يتم الشراء'
                        ? 'print-status-rejected'
                        : 'print-status-pending'
                    }`}>
                      {getItemPrintStatus(item.purchase_status as ItemPurchaseStatus)}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '20pt' }}>
                  لا توجد عناصر في هذا الطلب
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Summary */}
        <div style={{ textAlign: 'right', marginBottom: '15pt', direction: 'rtl' }}>
          <p style={{ fontSize: '10pt', color: '#666' }}>
            <strong>إجمالي العناصر:</strong> {order.items?.length || 0} عنصر
          </p>
        </div>

        {/* Order Notes */}
        {order.order_notes && (
          <div className="print-invoice-notes print-no-break">
            <h3>ملاحظات الطلب</h3>
            <p>{order.order_notes}</p>
          </div>
        )}

        {/* Purchasing Notes */}
        {order.purchasing_notes && (
          <div className="print-invoice-notes print-no-break" style={{ background: '#fff8e6', borderColor: '#f0d78c' }}>
            <h3 style={{ color: '#b7791f' }}>ملاحظات المشتريات</h3>
            <p>{order.purchasing_notes}</p>
          </div>
        )}

        {/* Rejection Reason */}
        {order.rejection_reason && (
          <div className="print-rejection-reason print-no-break">
            <h3>سبب الرفض</h3>
            <p>{order.rejection_reason}</p>
          </div>
        )}

        {/* Signature Section */}
        <div className="print-signature-section">
          <div className="print-signature-box">
            <div className="print-signature-line"></div>
            <div className="print-signature-label">توقيع منشئ الطلب</div>
          </div>
          <div className="print-signature-box">
            <div className="print-signature-line"></div>
            <div className="print-signature-label">توقيع المدير</div>
          </div>
          <div className="print-signature-box">
            <div className="print-signature-line"></div>
            <div className="print-signature-label">توقيع المشتريات</div>
          </div>
        </div>

        {/* Footer */}
        <div className="print-invoice-footer">
          <p>تم الطباعة بتاريخ: {new Date().toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
          <p>Fast-Track Purchasing System</p>
        </div>
      </div>

      {/* ========== SCREEN LAYOUT (Hidden when printing) ========== */}
      <div className="space-y-6 screen-only">
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

      {/* Back button and actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()} className="flex items-center gap-2">
          <BackArrow className="h-4 w-4" />
          {t('common.back')}
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 me-2" />
            {t('common.print')}
          </Button>
          {/* Edit button for Owner (Admin/SubAdmin) during review stage */}
          {canEditOrder && (
            <Button asChild>
              <Link href={`/orders/${order.id}/edit`}>
                <Edit className="h-4 w-4 me-2" />
                {t('orders.edit')}
              </Link>
            </Button>
          )}
          {/* Edit button for Purchasing/Admin to update item statuses */}
          {canEditItemStatus && (
            <Button asChild variant="default">
              <Link href={`/orders/${order.id}/edit-items`}>
                <ShoppingCart className="h-4 w-4 me-2" />
                تحديث حالة العناصر
              </Link>
            </Button>
          )}
          {/* Start Purchasing button */}
          {canStartPurchasing && (
            <Button 
              onClick={handleStartPurchasing}
              disabled={isStartingPurchasing}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isStartingPurchasing ? (
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
              ) : (
                <ShoppingCart className="h-4 w-4 me-2" />
              )}
              بدء عملية الشراء
            </Button>
          )}
        </div>
      </div>

      {/* Order Header Card */}
      <Card className="overflow-hidden p-0 gap-0">
        <div className="bg-[#5C1A1B] px-5 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/15">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{order.title}</h2>
              <p className="text-white/70 text-sm">{t('orders.orderDetails')}</p>
            </div>
          </div>
          {getStatusBadge(order.status as OrderStatus)}
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
              <p className="font-medium">{order.items?.length || 0} {t('orders.items.count', 'عنصر')}</p>
            </div>
            {order.updated_by_name && (
              <div>
                <p className="text-sm text-muted-foreground">آخر تحديث بواسطة</p>
                <p className="font-medium">{order.updated_by_name}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Owner Review Section - Approve/Reject */}
      {canReviewOrder && (
        <Card className="overflow-hidden p-0 gap-0 border-2 border-primary/30 dark:border-primary/40">
          <div className="bg-primary px-5 py-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/15">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">مراجعة الطلب</h2>
              <p className="text-white/70 text-sm">قم بمراجعة الطلب والموافقة أو الرفض</p>
            </div>
          </div>
          <CardContent className="p-5 space-y-4">
            <div className="space-y-3">
              <Label className="text-base font-medium">قرار المراجعة</Label>
              <RadioGroup
                value={reviewDecision || ''}
                onValueChange={(value) => setReviewDecision(value as 'approve' | 'reject')}
                className="flex flex-col sm:flex-row gap-4"
              >
                <div className="flex items-center space-x-2 ">
                  <RadioGroupItem value="approve" id="approve" />
                  <Label 
                    htmlFor="approve" 
                    className="flex items-center gap-2 cursor-pointer text-emerald-600 dark:text-emerald-400"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    الموافقة على الطلب
                  </Label>
                </div>
                <div className="flex items-center space-x-2 ">
                  <RadioGroupItem value="reject" id="reject" />
                  <Label 
                    htmlFor="reject" 
                    className="flex items-center gap-2 cursor-pointer text-red-600 dark:text-red-400"
                  >
                    <ThumbsDown className="h-4 w-4" />
                    رفض الطلب
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            {/* Rejection reason (shown only when reject is selected) */}
            {reviewDecision === 'reject' && (
              <div className="space-y-2">
                <Label htmlFor="rejectionReason" className="text-base font-medium">
                  سبب الرفض <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="يرجى إدخال سبب رفض الطلب..."
                  className="min-h-[100px]"
                />
              </div>
            )}
            
            <Separator />
            
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setReviewDecision(null);
                  setRejectionReason('');
                }}
                disabled={isSubmittingReview}
              >
                إعادة تعيين
              </Button>
              <Button
                onClick={handleReviewSubmit}
                disabled={!reviewDecision || isSubmittingReview}
                className={
                  reviewDecision === 'approve' 
                    ? 'bg-emerald-600 hover:bg-emerald-700' 
                    : reviewDecision === 'reject'
                    ? 'bg-red-600 hover:bg-red-700'
                    : ''
                }
              >
                {isSubmittingReview ? (
                  <>
                    <Loader2 className="h-4 w-4 me-2 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    {reviewDecision === 'approve' ? (
                      <ThumbsUp className="h-4 w-4 me-2" />
                    ) : reviewDecision === 'reject' ? (
                      <ThumbsDown className="h-4 w-4 me-2" />
                    ) : null}
                    {reviewDecision === 'approve' ? 'تأكيد الموافقة' : reviewDecision === 'reject' ? 'تأكيد الرفض' : 'إرسال القرار'}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items - Main Content */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="overflow-hidden p-0 gap-0">
            <div className="bg-[#5C1A1B] px-5 py-4 flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/15">
                <Package className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-white">{t('orders.form.orderItems')}</span>
              <Badge variant="secondary" className="ms-auto bg-white/20 text-white border-0">
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
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 flex items-center justify-center rounded-md bg-[#5C1A1B] text-white text-sm font-bold">
                          {index + 1}
                        </span>
                        <div>
                          <h4 className="font-semibold text-foreground">{item.title}</h4>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                          )}
                        </div>
                      </div>
                      {getItemStatusBadge(item.purchase_status as ItemPurchaseStatus, null)}
                    </div>

                    {/* Item Attachments - Grid Preview */}
                    {item.attachments && item.attachments.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Paperclip className="h-3.5 w-3.5" />
                            {t('orders.form.attachments')} ({item.attachments.length})
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {item.attachments.map((attachment) => (
                              <AttachmentPreviewCard key={attachment.id} attachment={attachment} />
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد عناصر في هذا الطلب
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Order Details */}
        <div className="space-y-4">
          {/* Order Info */}
          <Card className="overflow-hidden p-0 gap-0">
            <div className="bg-[#5C1A1B] px-4 py-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-white" />
              <span className="font-medium text-white text-sm">{t('orders.form.orderInfo')}</span>
            </div>
            <CardContent className="p-4 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">{t('orders.orderStatus')}</p>
                <div className="mt-1">{getStatusBadge(order.status as OrderStatus)}</div>
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
                    <p className="text-xs text-muted-foreground">آخر تحديث</p>
                    <p className="font-medium text-sm">{formatDateTime(order.updated_at)}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Creator Info */}
          <Card className="overflow-hidden p-0 gap-0">
            <div className="bg-[#5C1A1B] px-4 py-3 flex items-center gap-2">
              <User className="h-4 w-4 text-white" />
              <span className="font-medium text-white text-sm">منشئ الطلب</span>
            </div>
            <CardContent className="p-4 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">الاسم</p>
                <p className="font-medium text-sm">{order.created_by_name}</p>
              </div>
              {order.updated_by_name && order.updated_by !== order.created_by && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground">آخر تحديث بواسطة</p>
                    <p className="font-medium text-sm">{order.updated_by_name}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Order Notes */}
          {order.order_notes && (
            <Card className="overflow-hidden p-0 gap-0">
              <div className="bg-[#5C1A1B] px-4 py-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-white" />
                <span className="font-medium text-white text-sm">{t('orders.form.notes')}</span>
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
                <span className="font-medium text-white text-sm">ملاحظات المشتريات</span>
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
                <span className="font-medium text-white text-sm">سبب الرفض</span>
              </div>
              <CardContent className="p-4">
                <p className="text-sm text-red-600 dark:text-red-400 whitespace-pre-wrap">{order.rejection_reason}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      </div>
    </>
  );
}

'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/components/providers/LanguageProvider';
import { useErrorStore } from '@/stores/errorStore';
import { updateOrderStatus, updateAdminChecked } from '@/lib/services/orders';
import { OrderStatus } from '@/lib/services/orders/types';
import type { ItemApprovalPayload } from '@/lib/services/orders/types';
import { 
  Edit,
  FileText,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  ShoppingCart,
  Printer,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Save,
} from 'lucide-react';
import Link from 'next/link';
import type { Order } from '@/lib/services/orders/types';
import {
  OrderHeader,
  OrderInfoCard,
  OrderItemsCard,
  OrderSidebar,
} from './OrderViewShared';

interface AdminViewProps {
  order: Order;
}

/**
 * Admin/SubAdmin View - FULL PERMISSIONS (No Restrictions)
 * - Can edit ANY order in ANY status (except closed)
 * - Can perform engineering review (transition from Order Created to Engineering Reviewed)
 * - Can approve/reject orders at any time
 * - Can update item purchase status at any time
 * - Can start purchasing process
 * - Can change order status freely between any valid statuses
 * - Can print order summary
 */
export default function AdminView({ order }: AdminViewProps) {
  const { t, isRTL } = useTranslation();
  const router = useRouter();
  const { showError } = useErrorStore();
  
  // Owner review state (approve/reject)
  const [reviewDecision, setReviewDecision] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  
  // Item approval state - tracks decision for each item
  const [itemApprovals, setItemApprovals] = useState<Record<string, boolean | null>>(() => {
    // Initialize from existing approved_by_admin values
    const initial: Record<string, boolean | null> = {};
    order.items?.forEach((item) => {
      initial[item.id] = item.approved_by_admin ?? null;
    });
    return initial;
  });
  const [isSavingItemApprovals, setIsSavingItemApprovals] = useState(false);
  
  // Purchasing state
  const [isStartingPurchasing, setIsStartingPurchasing] = useState(false);
  
  // Engineering review state (for Admin/SubAdmin to complete engineering review)
  const [isSubmittingEngineeringReview, setIsSubmittingEngineeringReview] = useState(false);

  // Check if all items have decisions (needed for approval)
  const allItemsHaveDecisions = useMemo(() => {
    if (!order.items || order.items.length === 0) return true;
    return order.items.every((item) => itemApprovals[item.id] !== null && itemApprovals[item.id] !== undefined);
  }, [order.items, itemApprovals]);

  // Check if item approvals have changed from saved state
  const hasItemApprovalChanges = useMemo(() => {
    if (!order.items) return false;
    return order.items.some((item) => {
      const savedValue = item.approved_by_admin ?? null;
      const currentValue = itemApprovals[item.id] ?? null;
      return savedValue !== currentValue;
    });
  }, [order.items, itemApprovals]);

  // Status checks
  const isOrderCreated = order.status === OrderStatus.ORDER_CREATED;
  const isEngineeringReviewed = order.status === OrderStatus.ENGINEERING_REVIEWED;
  const isUnderAdminReview = order.status === OrderStatus.UNDER_ADMIN_REVIEW;
  const isOwnerApproved = order.status === OrderStatus.OWNER_APPROVED;
  const isPurchasingInProgress = order.status === OrderStatus.PURCHASING_IN_PROGRESS;
  const isClosed = order.status === OrderStatus.ORDER_CLOSED;
  const isRejected = order.status === OrderStatus.OWNER_REJECTED;
  
  // Permission checks for Admin/SubAdmin - FULL ACCESS with no restrictions
  // Admin and SubAdmin can perform any action at any time
  const canDoEngineeringReview = isOrderCreated;  // Show engineering review button when order is just created
  const canReviewOrder = isUnderAdminReview;  // Show admin review UI when in review status
  const canEditOrder = !isClosed;  // Admin/SubAdmin can edit ANY order except closed ones
  const canStartPurchasing = isOwnerApproved;  // Show start purchasing button when approved
  const canEditItemStatus = true;  // Admin/SubAdmin can ALWAYS edit item status

  // Handle owner review submission (approve/reject)
  const handleReviewSubmit = async () => {
    if (!reviewDecision) {
      showError(t('orders.review.selectDecision'), 'error');
      return;
    }
    
    if (reviewDecision === 'reject' && !rejectionReason.trim()) {
      showError(t('orders.review.enterRejectionReason'), 'error');
      return;
    }

    // For approval, validate that all items have a decision
    if (reviewDecision === 'approve' && !allItemsHaveDecisions) {
      showError(t('orders.itemApproval.allItemsRequired'), 'error');
      return;
    }
    
    setIsSubmittingReview(true);
    
    try {
      // First, save item approvals if there are any items and approving
      if (reviewDecision === 'approve' && order.items && order.items.length > 0) {
        const itemsPayload: ItemApprovalPayload[] = order.items.map((item) => ({
          item_id: item.id,
          approved: itemApprovals[item.id] ?? false,
        }));
        
        const itemResult = await updateAdminChecked(order.id, itemsPayload);
        if (!itemResult?.data) {
          showError(itemResult?.message || t('orders.itemApproval.saveFailed'), 'error');
          setIsSubmittingReview(false);
          return;
        }
      }

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
            ? t('orders.review.approveSuccess')
            : t('orders.review.rejectSuccess'),
          'success'
        );
        router.refresh();
      } else {
        showError(result?.message || t('orders.review.updateFailed'), 'error');
      }
    } catch (error: any) {
      showError(error.message || t('orders.review.updateError'), 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Handle saving item approvals separately (without changing order status)
  const handleSaveItemApprovals = async () => {
    if (!order.items || order.items.length === 0) return;
    
    setIsSavingItemApprovals(true);
    
    try {
      const itemsPayload: ItemApprovalPayload[] = order.items
        .filter((item) => itemApprovals[item.id] !== null && itemApprovals[item.id] !== undefined)
        .map((item) => ({
          item_id: item.id,
          approved: itemApprovals[item.id]!,
        }));
      
      if (itemsPayload.length === 0) {
        showError(t('orders.itemApproval.noDecisions'), 'error');
        setIsSavingItemApprovals(false);
        return;
      }
      
      const result = await updateAdminChecked(order.id, itemsPayload);
      
      if (result?.data) {
        showError(t('orders.itemApproval.saveSuccess'), 'success');
        router.refresh();
      } else {
        showError(result?.message || t('orders.itemApproval.saveFailed'), 'error');
      }
    } catch (error: any) {
      showError(error.message || t('orders.itemApproval.saveError'), 'error');
    } finally {
      setIsSavingItemApprovals(false);
    }
  };

  // Handle setting item approval decision
  const handleItemApprovalChange = (itemId: string, decision: boolean | null) => {
    setItemApprovals((prev) => ({
      ...prev,
      [itemId]: decision,
    }));
  };

  // Handle starting purchasing process
  const handleStartPurchasing = async () => {
    setIsStartingPurchasing(true);
    
    try {
      const result = await updateOrderStatus(order.id, {
        status: OrderStatus.PURCHASING_IN_PROGRESS,
      });
      
      if (result?.data) {
        showError(t('orders.purchasing.startSuccess'), 'success');
        router.refresh();
      } else {
        showError(result?.message || t('orders.purchasing.startFailed'), 'error');
      }
    } catch (error: any) {
      showError(error.message || t('orders.purchasing.startError'), 'error');
    } finally {
      setIsStartingPurchasing(false);
    }
  };

  // Handle completing engineering review (Admin/SubAdmin can do this)
  const handleCompleteEngineeringReview = async () => {
    setIsSubmittingEngineeringReview(true);
    
    try {
      const result = await updateOrderStatus(order.id, {
        status: OrderStatus.ENGINEERING_REVIEWED,
      });
      
      if (result?.data) {
        showError(t('orders.engineering.reviewSuccess'), 'success');
        router.refresh();
      } else {
        showError(result?.message || t('orders.engineering.reviewFailed'), 'error');
      }
    } catch (error: any) {
      showError(error.message || t('orders.engineering.reviewError'), 'error');
    } finally {
      setIsSubmittingEngineeringReview(false);
    }
  };

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Action buttons for header
  const headerActions = (
    <>
      {/* Print Button - Always visible */}
      <Button variant="outline" onClick={handlePrint} className="print:hidden">
        <Printer className="h-4 w-4 me-2" />
        {t('orders.print')}
      </Button>
      
      {/* Edit button - Only during admin review stage */}
      {canEditOrder && (
        <Button asChild className="print:hidden">
          <Link href={`/orders/${order.id}/edit`}>
            <Edit className="h-4 w-4 me-2" />
            {t('orders.edit')}
          </Link>
        </Button>
      )}
      {/* Edit Item Status button - Visible when order is approved or purchasing in progress */}
      {canEditItemStatus && (
        <Button asChild variant="default" className="bg-purple-600 hover:bg-purple-700 print:hidden">
          <Link href={`/orders/${order.id}/purchasing`}>
            <ShoppingCart className="h-4 w-4 me-2" />
            {t('orders.editItems')}
          </Link>
        </Button>
      )}
      
      {/* Start Purchasing button */}
      {canStartPurchasing && (
        <Button 
          onClick={handleStartPurchasing}
          disabled={isStartingPurchasing}
          className="bg-amber-600 hover:bg-amber-700 print:hidden"
        >
          {isStartingPurchasing ? (
            <Loader2 className="h-4 w-4 me-2 animate-spin" />
          ) : (
            <ShoppingCart className="h-4 w-4 me-2" />
          )}
          {t('orders.purchasing.startPurchasing')}
        </Button>
      )}
      
      {/* Engineering Review button - Admin/SubAdmin can complete engineering review */}
      {canDoEngineeringReview && (
        <Button 
          onClick={handleCompleteEngineeringReview}
          disabled={isSubmittingEngineeringReview}
          className="bg-cyan-600 hover:bg-cyan-700 print:hidden"
        >
          {isSubmittingEngineeringReview ? (
            <Loader2 className="h-4 w-4 me-2 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4 me-2" />
          )}
          {t('orders.engineering.completeReview')}
        </Button>
      )}
    </>
  );

  return (
    <div className="space-y-6 print:space-y-4">
      <OrderHeader order={order} t={t} isRTL={isRTL} actions={headerActions} />
      
      <OrderInfoCard order={order} t={t} />

      {/* Item Approval Section - Review each item */}
      {canReviewOrder && order.items && order.items.length > 0 && (
        <Card className="overflow-hidden p-0 gap-0 border-2 border-blue-200 dark:border-blue-800 print:hidden">
          <div className="bg-primary px-5 py-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/15">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{t('orders.itemApproval.title')}</h2>
                <p className="text-white/70 text-sm">{t('orders.itemApproval.description')}</p>
              </div>
            </div>
            <Badge 
              variant="secondary" 
              className={`${allItemsHaveDecisions ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400'}`}
            >
              {order.items.filter((item) => itemApprovals[item.id] !== null && itemApprovals[item.id] !== undefined).length}/{order.items.length}
            </Badge>
          </div>
          <CardContent className="p-5 space-y-4">
            {/* Validation message */}
            {!allItemsHaveDecisions && reviewDecision === 'approve' && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  {t('orders.itemApproval.allItemsRequiredMsg')}
                </p>
              </div>
            )}

            {/* Item List with Approval Controls */}
            <div className="space-y-3">
              {order.items.map((item, index) => (
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
                    {/* Current approval status badge */}
                    {itemApprovals[item.id] !== null && itemApprovals[item.id] !== undefined && (
                      <Badge 
                        variant="secondary" 
                        className={itemApprovals[item.id] 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' 
                          : 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400'
                        }
                      >
                        {itemApprovals[item.id] 
                          ? t('orders.itemApproval.approved') 
                          : t('orders.itemApproval.rejected')
                        }
                      </Badge>
                    )}
                  </div>

                  {/* Approval Controls */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-muted-foreground/10">
                    <span className="text-sm text-muted-foreground me-2">{t('orders.itemApproval.decision')}:</span>
                    {/* Approve */}
                    <button
                      type="button"
                      onClick={() => handleItemApprovalChange(item.id, true)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        itemApprovals[item.id] === true
                          ? 'bg-emerald-600 text-white'
                          : 'bg-muted hover:bg-emerald-100 dark:hover:bg-emerald-950/30 text-muted-foreground hover:text-emerald-700 dark:hover:text-emerald-400'
                      }`}
                    >
                      <CheckCircle className="h-4 w-4" />
                      {t('orders.itemApproval.approveItem')}
                    </button>
                    {/* Reject */}
                    <button
                      type="button"
                      onClick={() => handleItemApprovalChange(item.id, false)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        itemApprovals[item.id] === false
                          ? 'bg-red-600 text-white'
                          : 'bg-muted hover:bg-red-100 dark:hover:bg-red-950/30 text-muted-foreground hover:text-red-700 dark:hover:text-red-400'
                      }`}
                    >
                      <XCircle className="h-4 w-4" />
                      {t('orders.itemApproval.rejectItem')}
                    </button>
                    {/* Clear */}
                    {itemApprovals[item.id] !== null && itemApprovals[item.id] !== undefined && (
                      <button
                        type="button"
                        onClick={() => handleItemApprovalChange(item.id, null)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                      >
                        <Clock className="h-4 w-4" />
                        {t('orders.itemApproval.clearDecision')}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Save button for item approvals */}
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {allItemsHaveDecisions 
                  ? t('orders.itemApproval.allDecided')
                  : `${t('orders.itemApproval.pendingCount')}: ${order.items.length - order.items.filter((item) => itemApprovals[item.id] !== null && itemApprovals[item.id] !== undefined).length}`
                }
              </p>
              <Button
                onClick={handleSaveItemApprovals}
                disabled={!hasItemApprovalChanges || isSavingItemApprovals}
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/30"
              >
                {isSavingItemApprovals ? (
                  <>
                    <Loader2 className="h-4 w-4 me-2 animate-spin" />
                    {t('orders.itemApproval.saving')}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 me-2" />
                    {t('orders.itemApproval.saveDecisions')}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Owner Review Section - Approve/Reject */}
      {canReviewOrder && (
        <Card className="overflow-hidden p-0 gap-0 border-2 border-primary/20 dark:border-primary/30 print:hidden">
          <div className="bg-primary px-5 py-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/15">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-primary-foreground">{t('orders.review.title')}</h2>
              <p className="text-primary-foreground/70 text-sm">{t('orders.review.description')}</p>
            </div>
          </div>
          <CardContent className="p-5 space-y-5">
            <div className="space-y-3">
              <Label className="text-base font-medium">{t('orders.review.decision')}</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Approve Option - Dashboard Radio Tile Style */}
                <label
                  className={`radio-tile ${reviewDecision === 'approve' ? 'radio-tile-checked border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' : ''}`}
                  style={{ 
                    borderColor: reviewDecision === 'approve' ? 'rgb(16 185 129)' : undefined,
                  }}
                >
                  <input
                    type="radio"
                    name="reviewDecision"
                    value="approve"
                    checked={reviewDecision === 'approve'}
                    onChange={() => setReviewDecision('approve')}
                    className="radio-input"
                  />
                  <span className="radio-icon">
                    <ThumbsUp className={`h-5 w-5 ${reviewDecision === 'approve' ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                  </span>
                  <span className={`radio-label ${reviewDecision === 'approve' ? 'text-emerald-700 dark:text-emerald-400' : ''}`}>
                    {t('orders.review.approve')}
                  </span>
                </label>

                {/* Reject Option - Dashboard Radio Tile Style */}
                <label
                  className={`radio-tile ${reviewDecision === 'reject' ? 'radio-tile-checked border-red-500 bg-red-50 dark:bg-red-950/30' : ''}`}
                  style={{ 
                    borderColor: reviewDecision === 'reject' ? 'rgb(239 68 68)' : undefined,
                  }}
                >
                  <input
                    type="radio"
                    name="reviewDecision"
                    value="reject"
                    checked={reviewDecision === 'reject'}
                    onChange={() => setReviewDecision('reject')}
                    className="radio-input"
                  />
                  <span className="radio-icon">
                    <ThumbsDown className={`h-5 w-5 ${reviewDecision === 'reject' ? 'text-red-600' : 'text-muted-foreground'}`} />
                  </span>
                  <span className={`radio-label ${reviewDecision === 'reject' ? 'text-red-700 dark:text-red-400' : ''}`}>
                    {t('orders.review.reject')}
                  </span>
                </label>
              </div>
            </div>
            
            {/* Rejection reason (shown only when reject is selected) */}
            {reviewDecision === 'reject' && (
              <div className="space-y-2">
                <Label htmlFor="rejectionReason" className="text-base font-medium">
                  {t('orders.review.rejectionReason')} <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder={t('orders.review.rejectionReasonPlaceholder')}
                  className="min-h-[100px]"
                />
              </div>
            )}
            
            <Separator />
            
            <div className="flex justify-end">
              <Button
                onClick={handleReviewSubmit}
                disabled={!reviewDecision || isSubmittingReview || (reviewDecision === 'approve' && !allItemsHaveDecisions)}
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
                    {t('orders.review.submitting')}
                  </>
                ) : (
                  <>
                    {reviewDecision === 'approve' ? (
                      <ThumbsUp className="h-4 w-4 me-2" />
                    ) : reviewDecision === 'reject' ? (
                      <ThumbsDown className="h-4 w-4 me-2" />
                    ) : null}
                    {reviewDecision === 'approve' 
                      ? t('orders.review.confirmApprove') 
                      : reviewDecision === 'reject' 
                      ? t('orders.review.confirmReject') 
                      : t('orders.review.submitDecision')}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:grid-cols-1">
        {/* Order Items - Main Content */}
        <div className="lg:col-span-2 space-y-4">
          <OrderItemsCard order={order} t={t} />
        </div>

        {/* Sidebar - Order Details */}
        <OrderSidebar order={order} t={t} />
      </div>
    </div>
  );
}

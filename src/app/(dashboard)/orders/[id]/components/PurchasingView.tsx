'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/components/providers/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PlayCircle, Package, CheckCircle2, AlertCircle, ShoppingCart, Ban, Loader2, Printer, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { Order, OrderItem } from '@/lib/services/orders/types';
import { OrderStatus, ItemPurchaseStatus } from '@/lib/services/orders/types';
import { updateOrderStatus, updateItemStatus } from '@/lib/services/orders';
import {
  OrderHeader,
  OrderInfoCard,
  OrderSidebar,
  AttachmentGrid,
  getItemStatusBadge,
} from './OrderViewShared';

interface PurchasingViewProps {
  order: Order;
}

/**
 * Purchasing View - 3-Step Workflow
 * Step 1: Change status to PURCHASING_IN_PROGRESS (button)
 * Step 2: Update item statuses via Alert Dialog with RadioGroup
 * Step 3: Finalize order via Alert Dialog (purchasing_notes + item_results)
 */
export default function PurchasingView({ order }: PurchasingViewProps) {
  const { t, isRTL } = useTranslation();
  const router = useRouter();
  
  // State for item results (track each item's status)
  const [itemResults, setItemResults] = useState<Map<string, boolean | null>>(new Map());
  const [purchasingNotes, setPurchasingNotes] = useState('');
  const [isStartingPurchase, setIsStartingPurchase] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  
  // Selected item for editing
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);
  const [selectedItemStatus, setSelectedItemStatus] = useState<'PURCHASED' | 'NOT_PURCHASED' | 'PENDING'>('PENDING');
  const [selectedItemNotes, setSelectedItemNotes] = useState<string>('');
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  
  // Finalize dialog state
  const [isFinalizeDialogOpen, setIsFinalizeDialogOpen] = useState(false);

  // Initialize item results from current order items
  useEffect(() => {
    if (order.items) {
      const initialResults = new Map<string, boolean | null>();
      order.items.forEach(item => {
        // Track item status: true = PURCHASED, false = NOT_PURCHASED, null = Pending (not set)
        if (item.purchase_status === ItemPurchaseStatus.PURCHASED) {
          initialResults.set(item.id, true);
        } else if (item.purchase_status === ItemPurchaseStatus.NOT_PURCHASED) {
          initialResults.set(item.id, false);
        } else {
          // null = Pending - not yet decided
          initialResults.set(item.id, null);
        }
      });
      setItemResults(initialResults);
    }
  }, [order.items]);

  // Determine current step based on order status
  const getCurrentStep = () => {
    switch (order.status) {
      case OrderStatus.OWNER_APPROVED:
        return 1; // Ready to start purchasing
      case OrderStatus.PURCHASING_IN_PROGRESS:
        return 2; // Can update items and finalize
      case OrderStatus.ORDER_CLOSED:
        return 3; // Completed
      default:
        return 0; // Not in purchasing flow
    }
  };

  const currentStep = getCurrentStep();

  // Step 1: Start purchasing process
  const handleStartPurchasing = async () => {
    setIsStartingPurchase(true);
    try {
      await updateOrderStatus(order.id, {
        status: OrderStatus.PURCHASING_IN_PROGRESS,
      });
      toast.success(t('orders.purchasing.startSuccess', 'تم بدء عملية الشراء بنجاح'));
      router.refresh();
    } catch (error) {
      toast.error(t('orders.purchasing.startFailed', 'فشل في بدء عملية الشراء'));
    } finally {
      setIsStartingPurchase(false);
    }
  };

  // Open item edit dialog
  const handleOpenItemDialog = (item: OrderItem) => {
    setSelectedItem(item);
    // Get current status from item's actual purchase_status
    if (item.purchase_status === ItemPurchaseStatus.PURCHASED) {
      setSelectedItemStatus('PURCHASED');
    } else if (item.purchase_status === ItemPurchaseStatus.NOT_PURCHASED) {
      setSelectedItemStatus('NOT_PURCHASED');
    } else {
      setSelectedItemStatus('PENDING');
    }
    // Set item notes from the item
    setSelectedItemNotes(item.item_notes || '');
    setIsItemDialogOpen(true);
  };

  // State for saving item status
  const [isSavingItemStatus, setIsSavingItemStatus] = useState(false);

  // Save item status
  const handleSaveItemStatus = async () => {
    if (!selectedItem) return;
    
    setIsSavingItemStatus(true);
    try {
      // Determine the purchase_status value (null for PENDING)
      let newStatus: ItemPurchaseStatus | null = null;
      if (selectedItemStatus === 'PURCHASED') {
        newStatus = ItemPurchaseStatus.PURCHASED;
      } else if (selectedItemStatus === 'NOT_PURCHASED') {
        newStatus = ItemPurchaseStatus.NOT_PURCHASED;
      }
      // PENDING = null
      
      const result = await updateItemStatus(selectedItem.id, {
        purchase_status: newStatus,
        notes: selectedItemNotes || undefined,
      });
      
      if (result) {
        // Update local state
        const newResults = new Map(itemResults);
        if (selectedItemStatus === 'PURCHASED') {
          newResults.set(selectedItem.id, true);
        } else if (selectedItemStatus === 'NOT_PURCHASED') {
          newResults.set(selectedItem.id, false);
        } else {
          newResults.set(selectedItem.id, null);
        }
        setItemResults(newResults);
        toast.success(t('orders.purchasing.itemStatus.updateSuccess', 'تم تحديث حالة العنصر بنجاح'));
        setIsItemDialogOpen(false);
        setSelectedItem(null);
        setSelectedItemNotes('');
        // Refresh to get updated data from server
        router.refresh();
      } else {
        toast.error(t('orders.purchasing.itemStatus.updateFailed', 'فشل في تحديث حالة العنصر'));
      }
    } catch (error) {
      toast.error(t('orders.purchasing.itemStatus.updateFailed', 'فشل في تحديث حالة العنصر'));
    } finally {
      setIsSavingItemStatus(false);
    }
  };

  // Step 3: Finalize order (close order)
  const handleFinalizeOrder = async () => {
    setIsFinalizing(true);
    try {
      await updateOrderStatus(order.id, {
        status: OrderStatus.ORDER_CLOSED,
        purchasing_notes: purchasingNotes,
      });
      toast.success(t('orders.purchasing.finalize.success', 'تم إنهاء الطلب بنجاح'));
      setIsFinalizeDialogOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(t('orders.purchasing.finalize.failed', 'فشل في إنهاء الطلب'));
    } finally {
      setIsFinalizing(false);
    }
  };

  // Get summary of item statuses (only for approved items)
  const getItemStatusSummary = () => {
    // Filter to only count approved items in the summary
    const approvedItemIds = order.items?.filter(item => item.approved_by_admin === true).map(item => item.id) || [];
    const total = approvedItemIds.length;
    const purchased = approvedItemIds.filter(id => itemResults.get(id) === true).length;
    const notPurchased = total - purchased;
    return { total, purchased, notPurchased };
  };

  const statusSummary = getItemStatusSummary();

  // Filter items by admin approval status
  const approvedItems = order.items?.filter(item => item.approved_by_admin === true) || [];
  const rejectedItems = order.items?.filter(item => item.approved_by_admin === false) || [];
  const pendingApprovalItems = order.items?.filter(item => item.approved_by_admin === null || item.approved_by_admin === undefined) || [];
  
  // Determine if we have any rejected items to show
  const hasRejectedItems = rejectedItems.length > 0;

  // Check if order is in a valid state for purchasing workflow
  const canStartPurchasing = order.status === OrderStatus.OWNER_APPROVED;
  const canEditItems = order.status === OrderStatus.PURCHASING_IN_PROGRESS;
  const isCompleted = order.status === OrderStatus.ORDER_CLOSED;

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Header action buttons
  const headerActions = (
    <>
      {/* Print Button - Always visible */}
      <Button variant="outline" onClick={handlePrint} className="print:hidden">
        <Printer className="h-4 w-4 me-2" />
        {t('orders.print')}
      </Button>
      
      {/* Start Purchasing button - visible when order is approved */}
      {canStartPurchasing && (
        <Button 
          onClick={handleStartPurchasing}
          disabled={isStartingPurchase}
          className="bg-amber-600 hover:bg-amber-700 print:hidden"
        >
          {isStartingPurchase ? (
            <Loader2 className="h-4 w-4 me-2 animate-spin" />
          ) : (
            <ShoppingCart className="h-4 w-4 me-2" />
          )}
          {t('orders.purchasing.startPurchasing')}
        </Button>
      )}
    </>
  );

  return (
    <div className="space-y-6 print:space-y-4">
      <OrderHeader order={order} t={t} isRTL={isRTL} actions={headerActions} />

      {/* Purchasing Workflow Progress */}
      <Card className="border-primary/20 print:hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            {t('orders.purchasing.workflow', 'سير عمل المشتريات')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Step Indicator - Responsive */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
            {/* Step 1 */}
            <div className={`flex flex-row sm:flex-col items-center gap-2 ${currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                currentStep >= 2 ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400' : 
                currentStep === 1 ? 'bg-primary/10 text-primary' : 'bg-muted'
              }`}>
                <PlayCircle className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">{t('orders.purchasing.steps.step1', 'بدء الشراء')}</span>
            </div>

            <div className={`hidden sm:block flex-1 h-1 mx-4 rounded ${currentStep >= 2 ? 'bg-emerald-500 dark:bg-emerald-600' : 'bg-muted'}`} />
            <div className={`sm:hidden w-1 h-8 rounded ${currentStep >= 2 ? 'bg-emerald-500 dark:bg-emerald-600' : 'bg-muted'}`} />

            {/* Step 2 */}
            <div className={`flex flex-row sm:flex-col items-center gap-2 ${currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                currentStep >= 3 ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400' : 
                currentStep === 2 ? 'bg-primary/10 text-primary' : 'bg-muted'
              }`}>
                <Package className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">{t('orders.purchasing.steps.step2', 'تحديث حالة العناصر')}</span>
            </div>

            <div className={`hidden sm:block flex-1 h-1 mx-4 rounded ${currentStep >= 3 ? 'bg-emerald-500 dark:bg-emerald-600' : 'bg-muted'}`} />
            <div className={`sm:hidden w-1 h-8 rounded ${currentStep >= 3 ? 'bg-emerald-500 dark:bg-emerald-600' : 'bg-muted'}`} />

            {/* Step 3 */}
            <div className={`flex flex-row sm:flex-col items-center gap-2 ${currentStep >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                currentStep >= 3 ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400' : 'bg-muted'
              }`}>
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">{t('orders.purchasing.steps.step3', 'إنهاء الطلب')}</span>
            </div>
          </div>

          {/* Step Actions */}
          <div className="mt-6">
            {/* Step 1: Start Purchasing Button */}
            {canStartPurchasing && (
              <Button
                onClick={handleStartPurchasing}
                disabled={isStartingPurchase}
                className="w-full bg-primary hover:bg-primary/90"
              >
                <PlayCircle className="h-4 w-4 mr-2" />
                {isStartingPurchase ? t('common.loading', 'جاري التحميل...') : t('orders.purchasing.startPurchasing', 'بدء عملية الشراء')}
              </Button>
            )}

            {/* Step 2 & 3: In Progress - Show Summary */}
            {canEditItems && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-muted/50 dark:bg-muted/30 rounded-lg border border-border">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                      <span className="text-sm text-foreground">{statusSummary.purchased} {t('orders.purchasing.summary.purchased', 'تم شراؤها')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Ban className="h-4 w-4 text-red-500 dark:text-red-400" />
                      <span className="text-sm text-foreground">{statusSummary.notPurchased} {t('orders.purchasing.summary.notPurchased', 'لم يتم شراؤها')}</span>
                    </div>
                  </div>
                  
                  {/* Finalize Button */}
                  <AlertDialog open={isFinalizeDialogOpen} onOpenChange={setIsFinalizeDialogOpen}>
                    <AlertDialogTrigger asChild>
                      <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        {t('orders.purchasing.finalize.confirm', 'تأكيد الإنهاء')}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-md">
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {t('orders.purchasing.finalize.title', 'إنهاء الطلب')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('orders.purchasing.finalize.description', 'تأكيد إنهاء عملية الشراء وتسجيل النتائج')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      
                      <div className="space-y-4 py-4">
                        {/* Item Status Summary */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            {t('orders.purchasing.summary.title', 'ملخص الشراء')}
                          </Label>
                          <div className="p-3 bg-muted rounded-lg space-y-1 text-sm">
                            <div className="flex justify-between text-foreground">
                              <span>{t('orders.purchasing.summary.total', 'إجمالي العناصر')}:</span>
                              <span className="font-medium">{statusSummary.total}</span>
                            </div>
                            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                              <span>{t('orders.purchasing.summary.purchased', 'تم شراؤها')}:</span>
                              <span className="font-medium">{statusSummary.purchased}</span>
                            </div>
                            <div className="flex justify-between text-red-600 dark:text-red-400">
                              <span>{t('orders.purchasing.summary.notPurchased', 'لم يتم شراؤها')}:</span>
                              <span className="font-medium">{statusSummary.notPurchased}</span>
                            </div>
                          </div>
                        </div>

                        {/* Purchasing Notes */}
                        <div className="space-y-2">
                          <Label htmlFor="purchasing-notes">
                            {t('orders.purchasing.notes.title', 'ملاحظات الشراء')}
                          </Label>
                          <Textarea
                            id="purchasing-notes"
                            value={purchasingNotes}
                            onChange={(e) => setPurchasingNotes(e.target.value)}
                            placeholder={t('orders.purchasing.notes.placeholder', 'أدخل ملاحظات حول عملية الشراء...')}
                            rows={3}
                          />
                        </div>
                      </div>

                      <AlertDialogFooter>
                        <AlertDialogCancel>
                          {t('common.cancel', 'إلغاء')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleFinalizeOrder}
                          disabled={isFinalizing}
                          className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                        >
                          {isFinalizing ? t('common.loading', 'جاري التحميل...') : t('orders.purchasing.finalize.confirm', 'تأكيد الإنهاء')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )}

            {/* Completed State */}
            {isCompleted && (
              <div className="flex items-center justify-center p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 dark:text-emerald-400 mr-2" />
                <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                  {t('orders.status.completed', 'تم إكمال الطلب')}
                </span>
              </div>
            )}

            {/* Not in purchasing flow */}
            {!canStartPurchasing && !canEditItems && !isCompleted && (
              <div className="flex items-center justify-center p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <AlertCircle className="h-5 w-5 text-amber-500 dark:text-amber-400 mr-2" />
                <span className="text-amber-700 dark:text-amber-300">
                  {t('orders.status.awaitingApproval', 'الطلب في انتظار موافقة الادارة')}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <OrderInfoCard order={order} t={t} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items - Main Content */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  {t('orders.items.title', 'عناصر الطلب')}
                </div>
                {canEditItems && (
                  <span className="text-xs font-normal text-muted-foreground sm:ml-auto">
                    {t('orders.purchasing.itemStatus.clickToEdit', 'انقر لتعديل الحالة')}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.items && order.items.length > 0 ? (
                <div className="space-y-6">
                  {/* Approved Items - Can be edited */}
                  {approvedItems.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>{t('orders.purchasing.approvedItems', 'العناصر المعتمدة للشراء')}</span>
                        <span className="text-xs bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                          {approvedItems.length}
                        </span>
                      </div>
                      <div className="space-y-4">
                        {approvedItems.map((item, index) => {
                          // Use actual item.purchase_status from API
                          const isPurchased = item.purchase_status === ItemPurchaseStatus.PURCHASED;
                          const isNotPurchased = item.purchase_status === ItemPurchaseStatus.NOT_PURCHASED;
                          
                          return (
                            <div 
                              key={item.id}
                              className={`p-4 border rounded-lg transition-colors ${
                                isPurchased 
                                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800' 
                                  : isNotPurchased
                                  ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                                  : 'bg-muted/30 dark:bg-muted/20 border-border'
                              }`}
                            >
                              {/* Item Header */}
                              <div 
                                onClick={() => canEditItems && handleOpenItemDialog(item)}
                                className={`flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${
                                  canEditItems ? 'cursor-pointer' : ''
                                }`}
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 flex items-center justify-center rounded bg-primary text-primary-foreground text-xs font-bold">
                                      {index + 1}
                                    </span>
                                    <h4 className="font-medium text-foreground">{item.title}</h4>
                                  </div>
                                  {item.description && (
                                    <p className="text-sm text-muted-foreground mt-1 ms-8">{item.description}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 justify-end">
                                  {/* Show actual purchase_status from item */}
                                  {getItemStatusBadge(item.purchase_status, t)}
                                  {canEditItems && (
                                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">
                                      {t('common.edit', 'تعديل')}
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {/* Item Notes (Purchasing Notes) - show if exists */}
                              {item.item_notes && (
                                <div className="ms-8 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg mt-3">
                                  <p className="text-sm text-amber-700 dark:text-amber-400">
                                    <span className="font-medium">{t('orders.itemNotes')}:</span> {item.item_notes}
                                  </p>
                                </div>
                              )}

                              {/* Item Attachments */}
                              {item.attachments && item.attachments.length > 0 && (
                                <>
                                  <Separator className="my-3" />
                                  <AttachmentGrid attachments={item.attachments} t={t} />
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Rejected Items - Disabled/Grayed out */}
                  {hasRejectedItems && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-red-700 dark:text-red-400">
                        <XCircle className="h-4 w-4" />
                        <span>{t('orders.purchasing.rejectedItems', 'العناصر المرفوضة')}</span>
                        <span className="text-xs bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full">
                          {rejectedItems.length}
                        </span>
                      </div>
                      <div className="space-y-4 opacity-60">
                        {rejectedItems.map((item, index) => (
                          <div 
                            key={item.id}
                            className="p-4 border rounded-lg bg-red-50/30 dark:bg-red-950/10 border-red-200/50 dark:border-red-800/50"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 flex items-center justify-center rounded bg-red-400/50 text-white text-xs font-bold">
                                    {index + 1}
                                  </span>
                                  <h4 className="font-medium text-foreground line-through">{item.title}</h4>
                                </div>
                                {item.description && (
                                  <p className="text-sm text-muted-foreground mt-1 ms-8">{item.description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 justify-end">
                                <span className="px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 rounded">
                                  {t('orders.itemApproval.rejected', 'مرفوض')}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* If no approved items at all but items exist - show all items normally (fallback for orders without admin approval) */}
                  {approvedItems.length === 0 && rejectedItems.length === 0 && pendingApprovalItems.length > 0 && (
                    <div className="space-y-4">
                      {pendingApprovalItems.map((item, index) => {
                        const isPurchased = item.purchase_status === ItemPurchaseStatus.PURCHASED;
                        const isNotPurchased = item.purchase_status === ItemPurchaseStatus.NOT_PURCHASED;
                        
                        return (
                          <div 
                            key={item.id}
                            className={`p-4 border rounded-lg transition-colors ${
                              isPurchased 
                                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800' 
                                : isNotPurchased
                                ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                                : 'bg-muted/30 dark:bg-muted/20 border-border'
                            }`}
                          >
                            <div 
                              onClick={() => canEditItems && handleOpenItemDialog(item)}
                              className={`flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${
                                canEditItems ? 'cursor-pointer' : ''
                              }`}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 flex items-center justify-center rounded bg-primary text-primary-foreground text-xs font-bold">
                                    {index + 1}
                                  </span>
                                  <h4 className="font-medium text-foreground">{item.title}</h4>
                                </div>
                                {item.description && (
                                  <p className="text-sm text-muted-foreground mt-1 ms-8">{item.description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 justify-end">
                                {/* Show actual purchase_status from item */}
                                {getItemStatusBadge(item.purchase_status, t)}
                                {canEditItems && (
                                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">
                                    {t('common.edit', 'تعديل')}
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* Item Notes (Purchasing Notes) - show if exists */}
                            {item.item_notes && (
                              <div className="ms-8 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg mt-3">
                                <p className="text-sm text-amber-700 dark:text-amber-400">
                                  <span className="font-medium">{t('orders.itemNotes')}:</span> {item.item_notes}
                                </p>
                              </div>
                            )}

                            {item.attachments && item.attachments.length > 0 && (
                              <>
                                <Separator className="my-3" />
                                <AttachmentGrid attachments={item.attachments} t={t} />
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  {t('orders.items.empty', 'لا توجد عناصر')}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Order Details */}
        <OrderSidebar order={order} t={t} />
      </div>

      {/* Item Status Edit Dialog */}
      <AlertDialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('orders.purchasing.itemStatus.title', 'تحديث حالة العنصر')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedItem && (
                <span className="font-medium text-foreground">{selectedItem.title}</span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {selectedItem && (
            <div className="py-4">
              <div className="space-y-4">
                {/* Item Details */}
                {selectedItem.description && (
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    <div className="text-muted-foreground">
                      {selectedItem.description}
                    </div>
                  </div>
                )}

                {/* Status Selection */}
                <div className="space-y-3">
                  <Label>{t('orders.purchasing.itemStatus.selectStatus', 'حالة الشراء')}</Label>
                  <RadioGroup
                    value={selectedItemStatus}
                    onValueChange={(value: 'PURCHASED' | 'NOT_PURCHASED' | 'PENDING') => setSelectedItemStatus(value)}
                    className="space-y-2"
                  >
                    <label 
                      htmlFor="purchased"
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedItemStatus === 'PURCHASED' 
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' 
                          : 'border-border hover:border-emerald-300 dark:hover:border-emerald-700'
                      }`}
                    >
                      <RadioGroupItem value="PURCHASED" id="purchased" className="sr-only" />
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
                      <div className="flex-1">
                        <div className="font-medium text-foreground">{t('orders.purchasing.itemStatus.purchased', 'تم الشراء')}</div>
                      </div>
                    </label>
                    <label 
                      htmlFor="not-purchased"
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedItemStatus === 'NOT_PURCHASED' 
                          ? 'border-red-500 bg-red-50 dark:bg-red-950/30' 
                          : 'border-border hover:border-red-300 dark:hover:border-red-700'
                      }`}
                    >
                      <RadioGroupItem value="NOT_PURCHASED" id="not-purchased" className="sr-only" />
                      <Ban className="h-5 w-5 text-red-500 dark:text-red-400" />
                      <div className="flex-1">
                        <div className="font-medium text-foreground">{t('orders.purchasing.itemStatus.notPurchased', 'لم يتم الشراء')}</div>
                      </div>
                    </label>
                    <label 
                      htmlFor="pending"
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedItemStatus === 'PENDING' 
                          ? 'border-slate-500 bg-slate-50 dark:bg-slate-950/30' 
                          : 'border-border hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <RadioGroupItem value="PENDING" id="pending" className="sr-only" />
                      <AlertCircle className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                      <div className="flex-1">
                        <div className="font-medium text-foreground">{t('orders.purchasing.itemStatus.pending', 'معلق')}</div>
                      </div>
                    </label>
                  </RadioGroup>
                </div>

                {/* Item Notes */}
                <div className="space-y-2">
                  <Label htmlFor="item-notes">
                    {t('orders.purchasing.itemNotes.title', 'ملاحظات العنصر')}
                  </Label>
                  <Textarea
                    id="item-notes"
                    value={selectedItemNotes}
                    onChange={(e) => setSelectedItemNotes(e.target.value)}
                    placeholder={t('orders.purchasing.itemNotes.placeholder', 'أدخل ملاحظات حول هذا العنصر...')}
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSavingItemStatus}>
              {t('common.cancel', 'إلغاء')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSaveItemStatus}
              disabled={isSavingItemStatus}
              className="bg-primary hover:bg-primary/90"
            >
              {isSavingItemStatus ? t('common.loading', 'جاري التحميل...') : t('common.save', 'حفظ')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

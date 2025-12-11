'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, notFound } from 'next/navigation';
import Image from 'next/image';
import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/components/providers/LanguageProvider';
import RouteBasedPageHeader from '@/components/SharedCustomComponents/RouteBasedPageHeader';
import { Plus, Trash2, Loader2, Package, FileText, Paperclip, ExternalLink, Info, CheckCircle2, Lock, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { updateOrder, uploadItemAttachmentsEdit, deleteItemAttachment } from '@/lib/services/orders/services';
import { getUserData } from '@/lib/cookies';
import { UserRole } from '@/lib/types/userRoles';
import type { Order, UpdateOrderRequest, Attachment } from '@/lib/services/orders/types';
import { OrderStatus } from '@/lib/services/orders/types';

// Constants
const MAX_ATTACHMENTS_PER_ITEM = 5;

// Validation schema for edit (removed attachments from form - handled separately)
const EditOrderItemSchema = z.object({
  id: z.string().optional(), // Existing item ID
  title: z.string().min(1, { message: 'validation.required' }),
  description: z.string().optional(),
  delete: z.boolean().optional(),
});

const EditOrderSchema = z.object({
  title: z.string().min(1, { message: 'validation.required' }),
  order_notes: z.string().optional(),
  items: z.array(EditOrderItemSchema).min(1, { message: 'orders.form.atLeastOneItem' }),
});

type FormValues = z.infer<typeof EditOrderSchema>;

interface EditOrderClientProps {
  order: Order;
}

export default function EditOrderClient({ order }: EditOrderClientProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isCheckingRole, setIsCheckingRole] = useState(true);
  
  // State for managing attachments per item (keyed by item ID)
  const [itemAttachments, setItemAttachments] = useState<Record<string, Attachment[]>>(() => {
    const initial: Record<string, Attachment[]> = {};
    order.items.forEach(item => {
      initial[item.id] = item.attachments || [];
    });
    return initial;
  });
  
  // State for tracking upload/delete operations per item
  const [uploadingItems, setUploadingItems] = useState<Record<string, boolean>>({});
  const [deletingAttachments, setDeletingAttachments] = useState<Record<string, boolean>>({});

  // Transform order data to form values
  const defaultValues: FormValues = {
    title: order.title,
    order_notes: order.order_notes || '',
    items: order.items.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description || '',
      delete: false,
    })),
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(EditOrderSchema),
    defaultValues,
    mode: 'onTouched',
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  // Handle immediate attachment upload
  const handleAttachmentUpload = useCallback(async (itemId: string, files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const currentAttachments = itemAttachments[itemId] || [];
    const remainingSlots = MAX_ATTACHMENTS_PER_ITEM - currentAttachments.length;
    
    if (remainingSlots <= 0) {
      toast.error(t('orders.form.maxAttachmentsReached'));
      return;
    }

    const filesToUpload = fileArray.slice(0, remainingSlots);
    
    setUploadingItems(prev => ({ ...prev, [itemId]: true }));
    
    try {
      const result = await uploadItemAttachmentsEdit(itemId, filesToUpload);
      
      if (result && result.data) {
        // Update local state with new attachments from response
        const newAttachments = Array.isArray(result.data) ? result.data : [result.data];
        setItemAttachments(prev => ({
          ...prev,
          [itemId]: [...(prev[itemId] || []), ...newAttachments],
        }));
        toast.success(t('orders.messages.attachmentUploadSuccess'));
      } else {
        toast.error(t('orders.messages.attachmentUploadFailed'));
      }
    } catch (error: any) {
      toast.error(error.message || t('orders.messages.attachmentUploadFailed'));
    } finally {
      setUploadingItems(prev => ({ ...prev, [itemId]: false }));
    }
  }, [itemAttachments, t]);

  // Handle immediate attachment delete
  const handleAttachmentDelete = useCallback(async (itemId: string, attachmentId: string) => {
    setDeletingAttachments(prev => ({ ...prev, [attachmentId]: true }));
    
    try {
      const result = await deleteItemAttachment(attachmentId);
      
      if (result) {
        // Remove from local state
        setItemAttachments(prev => ({
          ...prev,
          [itemId]: (prev[itemId] || []).filter(att => att.id !== attachmentId),
        }));
        toast.success(t('orders.messages.attachmentDeleteSuccess'));
      } else {
        toast.error(t('orders.messages.attachmentDeleteFailed'));
      }
    } catch (error: any) {
      toast.error(error.message || t('orders.messages.attachmentDeleteFailed'));
    } finally {
      setDeletingAttachments(prev => ({ ...prev, [attachmentId]: false }));
    }
  }, [t]);

  // Check user role on mount - only Admin and SubAdmin can access edit page
  useEffect(() => {
    const checkRole = async () => {
      const userData = await getUserData();
      if (userData?.role) {
        setUserRole(userData.role as UserRole);
      }
      setIsCheckingRole(false);
    };
    checkRole();
  }, []);

  // Redirect if user doesn't have permission to edit
  useEffect(() => {
    if (!isCheckingRole && userRole) {
      // Admin and SubAdmin have FULL ACCESS - can edit ANY order (except closed - handled in server component)
      const isAdminRole = userRole === UserRole.Admin || userRole === UserRole.SubAdmin;
      
      // Engineering and Site can only edit when order status is ORDER_CREATED
      const isEngineeringSiteRole = userRole === UserRole.Engineering || userRole === UserRole.Site;
      const isOrderCreated = order.status === OrderStatus.ORDER_CREATED;
      
      // Admin/SubAdmin can always edit (full access), Engineering/Site only when order is just created
      const canEdit = isAdminRole || (isEngineeringSiteRole && isOrderCreated);
      
      if (!canEdit) {
        // Redirect to order view page for unauthorized users
        router.replace(`/orders/${order.id}`);
      }
    }
  }, [isCheckingRole, userRole, router, order.status, order.id]);

  // Check if item is purchased (purchase_status: 'تم الشراء' means it was already bought)
  const isItemPurchased = (itemId: string | undefined): boolean => {
    if (!itemId) return false;
    const originalItem = order.items.find(item => item.id === itemId);
    return originalItem?.purchase_status === 'تم الشراء';
  };

  // Check how many items are purchased
  const purchasedItemsCount = order.items.filter(item => item.purchase_status === 'تم الشراء').length;
  const hasPurchasedItems = purchasedItemsCount > 0;

  // Show loading while checking role
  if (isCheckingRole) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Get status badge with appropriate styling
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

  const addItem = () => {
    append({ title: '', description: '', delete: false });
  };

  const removeItem = (index: number) => {
    const itemId = form.getValues(`items.${index}.id`);
    // Don't allow removing purchased items
    if (isItemPurchased(itemId)) {
      toast.error(t('orders.form.cannotDeletePurchasedItem'));
      return;
    }
    
    // If it's an existing item (has id), mark it for deletion instead of removing from array
    if (itemId) {
      form.setValue(`items.${index}.delete`, true);
    } else {
      // New item (no id), just remove from array
      if (fields.length > 1) {
        remove(index);
      }
    }
  };

  // Get visible (non-deleted) items count
  const visibleItemsCount = fields.filter((_, index) => !form.watch(`items.${index}.delete`)).length;

  const onSubmit = async (data: FormValues) => {
    try {
      setSubmitting(true);

      // Prepare the update request - filter out items marked for deletion that are new (no id)
      const updateData: UpdateOrderRequest = {
        title: data.title,
        order_notes: data.order_notes,
        items: data.items
          .filter((item) => item.id || !item.delete) // Keep existing items (even if deleted) and new items not deleted
          .map((item) => ({
            id: item.id,
            title: item.title,
            description: item.description || '',
            ...(item.id && item.delete ? { delete: true } : {}), // Only send delete flag for existing items
          })),
      };

      const result = await updateOrder(order.id, updateData);

      if (result) {
        toast.success(t('orders.messages.updateSuccess'));
        router.push(`/orders/${order.id}`);
      } else {
        toast.error(t('common.error'));
      }
    } catch (error: any) {
      toast.error(error.message || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  // Check form validity for submit button
  const watchedValues = form.watch();
  const nonDeletedItems = watchedValues.items?.filter(item => !item.delete) || [];
  const isFormValid = watchedValues.title && 
    nonDeletedItems.length > 0 && 
    nonDeletedItems.every(item => item.title);

  const handleSubmitClick = (e: React.MouseEvent) => {
    if (!isFormValid && !submitting) {
      e.preventDefault();
      e.stopPropagation();
      form.trigger();
      toast.error(t('common.formIncomplete'));
    }
  };

  // Undo delete for an item
  const undoDelete = (index: number) => {
    form.setValue(`items.${index}.delete`, false);
  };

  // Render existing attachments with delete functionality
  const renderExistingAttachments = (itemId: string, attachments: Attachment[], canDelete: boolean = true) => {
    if (!attachments || attachments.length === 0) return null;

    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">{t('orders.form.existingAttachments')}</p>
        <div className="flex flex-wrap gap-2">
          {attachments.map((attachment) => {
            const isDeleting = deletingAttachments[attachment.id];
            return (
              <div
                key={attachment.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted border border-border rounded-md text-sm group"
              >
                <a
                  href={attachment.public_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-primary transition-colors"
                >
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="truncate max-w-[120px]">{attachment.file_name}</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </a>
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => handleAttachmentDelete(itemId, attachment.id)}
                    disabled={isDeleting}
                    className="ml-1 p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <X className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render attachment upload area for an item
  const renderAttachmentUpload = (itemId: string) => {
    const attachments = itemAttachments[itemId] || [];
    const isUploading = uploadingItems[itemId];
    const remainingSlots = MAX_ATTACHMENTS_PER_ITEM - attachments.length;
    
    if (remainingSlots <= 0) return null;

    return (
      <div className="space-y-2">
        <label className="text-sm flex items-center gap-2">
          <Paperclip className="h-3.5 w-3.5" />
          {t('orders.form.addNewAttachments')}
          <span className="text-xs text-muted-foreground font-normal">
            ({t('orders.form.remaining')}: {remainingSlots})
          </span>
        </label>
        <div className="relative">
          <input
            type="file"
            multiple
            accept="image/*,.pdf"
            disabled={isUploading}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleAttachmentUpload(itemId, e.target.files);
                e.target.value = ''; // Reset input
              }
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          <div className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg transition-colors ${
            isUploading 
              ? 'border-primary/50 bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
          }`}>
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">{t('common.loading')}</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{t('orders.form.clickToUpload')}</span>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <RouteBasedPageHeader />

      {/* Fast-Track Branding Header */}
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

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Order Info Section */}
          <Card className="overflow-hidden p-0 gap-0">
            {/* Card Header with Fast-Track Identity */}
            <div className="bg-primary px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/15">
                  <FileText className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-semibold text-primary-foreground">{t('orders.form.orderInfo')}</span>
              </div>
              {getStatusBadge(order.status as OrderStatus)}
            </div>
            <CardContent className="p-5 space-y-5">
              
              {/* Status Info Banner */}
              {hasPurchasedItems && (
                <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    {t('orders.form.purchasedItemsWarning').replace('{{count}}', String(purchasedItemsCount))}
                  </p>
                </div>
              )}

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('orders.form.orderTitle')} <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('orders.form.orderTitlePlaceholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="order_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('orders.form.notes')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('orders.form.notesPlaceholder')}
                        rows={2}
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Items Section */}
          <Card className="overflow-hidden p-0 gap-0">
            {/* Card Header with Fast-Track Identity */}
            <div className="bg-primary px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/15">
                  <Package className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-semibold text-primary-foreground">
                  {t('orders.form.orderItems')} <span className="text-primary-foreground/70">*</span>
                </span>
              </div>
              <Button 
                type="button" 
                variant="secondary" 
                size="sm" 
                onClick={addItem}
                className="bg-white/15 hover:bg-white/25 text-primary-foreground border-0"
              >
                <Plus className="h-4 w-4 me-1.5" />
                {t('orders.form.addItem')}
              </Button>
            </div>
            <CardContent className="p-5 space-y-5">

              <div className="space-y-4">
                {fields.map((field, index) => {
                  const itemId = form.watch(`items.${index}.id`);
                  const isPurchased = isItemPurchased(itemId);
                  const isDeleted = form.watch(`items.${index}.delete`);
                  const itemTitle = form.watch(`items.${index}.title`);
                  const currentAttachments = itemId ? (itemAttachments[itemId] || []) : [];
                  
                  // Show deleted items with undo option
                  if (isDeleted) {
                    return (
                      <div 
                        key={field.id} 
                        className="relative rounded-lg p-4 bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 border-dashed"
                      >
                        <div className="flex items-center justify-between">
                          <div className="inline-flex items-center gap-2">
                            <span className="w-6 h-6 flex items-center justify-center rounded-md bg-red-500 text-white text-xs font-bold">
                              <Trash2 className="h-3.5 w-3.5" />
                            </span>
                            <span className="text-sm text-red-600 dark:text-red-400 line-through">
                              {itemTitle || t('orders.form.item')}
                            </span>
                            <Badge variant="outline" className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-800 text-xs">
                              {t('orders.form.markedForDeletion')}
                            </Badge>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => undoDelete(index)}
                            className="h-8 text-xs border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950"
                          >
                            {t('common.undo')}
                          </Button>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <div 
                      key={field.id} 
                      className={`relative rounded-lg p-4 space-y-4 ${
                        isPurchased 
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800' 
                          : 'bg-muted/40 dark:bg-muted/20'
                      }`}
                    >
                      {/* Item Header */}
                      <div className="flex items-center justify-between">
                        <div className="inline-flex items-center gap-2">
                          <span className={`w-6 h-6 flex items-center justify-center rounded-md text-primary-foreground text-xs font-bold ${
                            isPurchased ? 'bg-emerald-600' : 'bg-primary'
                          }`}>
                            {isPurchased ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}
                          </span>
                          <span className="text-sm font-medium text-muted-foreground">
                            {t('orders.form.item')} {index + 1}
                          </span>
                          {isPurchased && (
                            <Badge variant="outline" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-xs">
                              <Lock className="h-3 w-3 me-1" />
                              {t('orders.itemStatus.purchased')}
                            </Badge>
                          )}
                        </div>
                        {!isPurchased && itemId && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                            className="h-8 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        {!itemId && fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                            className="h-8 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      {/* Item Fields */}
                      <div className="grid gap-4">
                        <FormField
                          control={form.control}
                          name={`items.${index}.title`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">
                                {t('orders.form.itemTitle')} <span className="text-destructive">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder={t('orders.form.itemTitlePlaceholder')}
                                  className={isPurchased ? 'bg-muted cursor-not-allowed' : 'bg-background'}
                                  disabled={isPurchased}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`items.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">{t('orders.form.itemDescription')}</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder={t('orders.form.itemDescriptionPlaceholder')}
                                  rows={2}
                                  className={`resize-none ${isPurchased ? 'bg-muted cursor-not-allowed' : 'bg-background'}`}
                                  disabled={isPurchased}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Attachments Section - Only for existing items with IDs */}
                        {itemId && (
                          <>
                            {/* Existing Attachments */}
                            {currentAttachments.length > 0 && (
                              <>
                                {renderExistingAttachments(itemId, currentAttachments, !isPurchased)}
                                {!isPurchased && <Separator />}
                              </>
                            )}

                            {/* Upload New Attachments - Hidden for purchased items */}
                            {!isPurchased && renderAttachmentUpload(itemId)}
                          </>
                        )}

                        {/* Info for new items - attachments can be added after saving */}
                        {!itemId && (
                          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              {t('orders.form.saveToAddAttachments')}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {form.formState.errors.items?.root && (
                <p className="text-sm font-medium text-destructive">
                  {t('orders.form.atLeastOneItem')}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={submitting}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              onClick={handleSubmitClick}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 me-2 animate-spin" />
                  {t('common.saving')}
                </>
              ) : (
                t('common.save')
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

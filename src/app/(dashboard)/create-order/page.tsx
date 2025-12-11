'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/components/providers/LanguageProvider';
import RouteBasedPageHeader from '@/components/SharedCustomComponents/RouteBasedPageHeader';
import { Plus, Trash2, Loader2, Package, FileText, Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ItemAttachments } from '@/components/ui/item-attachments';
import { createOrder, uploadItemAttachments } from '@/lib/services/orders/services';
import type { CreateOrderForm } from '@/lib/services/orders/types';

// Constants
const MAX_ATTACHMENTS_PER_ITEM = 5;

// Validation schema
const OrderItemSchema = z.object({
  title: z.string().min(1, { message: 'validation.required' }),
  description: z.string().optional(),
  attachments: z
    .array(z.instanceof(File))
    .max(MAX_ATTACHMENTS_PER_ITEM, { message: 'orders.form.maxAttachmentsError' })
    .optional(),
});

const CreateOrderSchema = z.object({
  title: z.string().min(1, { message: 'validation.required' }),
  order_notes: z.string().optional(),
  items: z.array(OrderItemSchema).min(1, { message: 'orders.form.atLeastOneItem' }),
});

type FormValues = z.infer<typeof CreateOrderSchema>;

export default function CreateOrderPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(CreateOrderSchema),
    defaultValues: {
      title: '',
      order_notes: '',
      items: [{ title: '', description: '', attachments: [] }],
    },
    mode: 'onTouched',
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const addItem = () => {
    append({ title: '', description: '', attachments: [] });
  };

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      setSubmitting(true);

      // Step 1: Create the order (without attachments)
      const orderData: CreateOrderForm = {
        title: data.title,
        order_notes: data.order_notes,
        items: data.items.map((item) => ({
          title: item.title,
          description: item.description,
        })),
      };

      const result = await createOrder(orderData);

      if (!result || !result.data) {
        toast.error(t('common.error'));
        return;
      }

      // Step 2: Upload attachments for each item using returned item IDs
      const createdItems = result.data.items || [];
      const attachmentUploadPromises: Promise<any>[] = [];

      data.items.forEach((formItem, index) => {
        const createdItem = createdItems[index];
        if (createdItem?.id && formItem.attachments && formItem.attachments.length > 0) {
          attachmentUploadPromises.push(
            uploadItemAttachments(createdItem.id, formItem.attachments)
          );
        }
      });

      // Wait for all attachment uploads to complete
      if (attachmentUploadPromises.length > 0) {
        const uploadResults = await Promise.allSettled(attachmentUploadPromises);
        const failedUploads = uploadResults.filter(r => r.status === 'rejected');
        
        if (failedUploads.length > 0) {
          toast.warning(t('orders.messages.createSuccessWithAttachmentWarning'));
        } else {
          toast.success(t('orders.messages.createSuccess'));
        }
      } else {
        toast.success(t('orders.messages.createSuccess'));
      }

      router.push('/orders/current');
    } catch (error: any) {
      toast.error(error.message || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  // Check form validity for submit button
  const watchedValues = form.watch();
  const isFormValid = watchedValues.title && 
    watchedValues.items?.length > 0 && 
    watchedValues.items.every(item => item.title);

  const handleSubmitClick = (e: React.MouseEvent) => {
    if (!isFormValid && !submitting) {
      e.preventDefault();
      e.stopPropagation();
      form.trigger();
      toast.error(t('common.formIncomplete'));
    }
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
            <div className="bg-[#5C1A1B] px-5 py-4 flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/15">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-white">{t('orders.form.orderInfo')}</span>
            </div>
            <CardContent className="p-5 space-y-5">
              
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
            <div className="bg-[#5C1A1B] px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/15">
                  <Package className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-white">
                  {t('orders.form.orderItems')} <span className="text-white/70">*</span>
                </span>
              </div>
              <Button 
                type="button" 
                variant="secondary" 
                size="sm" 
                onClick={addItem}
                className="bg-white/15 hover:bg-white/25 text-white border-0"
              >
                <Plus className="h-4 w-4 me-1.5" />
                {t('orders.form.addItem')}
              </Button>
            </div>
            <CardContent className="p-5 space-y-5">

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div 
                    key={field.id} 
                    className="relative bg-muted/40 dark:bg-muted/20 rounded-lg p-4 space-y-4"
                  >
                    {/* Item Header */}
                    <div className="flex items-center justify-between">
                      <div className="inline-flex items-center gap-2">
                        <span className="w-6 h-6 flex items-center justify-center rounded-md bg-[#5C1A1B] text-white text-xs font-bold">
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium text-muted-foreground">
                          {t('orders.form.item')}
                        </span>
                      </div>
                      {fields.length > 1 && (
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
                                className="bg-background"
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
                                className="resize-none bg-background"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Attachments */}
                      <FormField
                        control={form.control}
                        name={`items.${index}.attachments`}
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <FormLabel className="text-sm flex items-center gap-2">
                              <Paperclip className="h-3.5 w-3.5" />
                              {t('orders.form.attachments')}
                              <span className="text-xs text-muted-foreground font-normal">
                                ({t('orders.form.remaining')}: {MAX_ATTACHMENTS_PER_ITEM - (field.value?.length || 0)})
                              </span>
                            </FormLabel>
                            <FormControl>
                              <ItemAttachments
                                id={`attachments-${index}`}
                                files={field.value || []}
                                onChange={(files) => {
                                  field.onChange(files);
                                  form.trigger(`items.${index}.attachments`);
                                }}
                                maxFiles={MAX_ATTACHMENTS_PER_ITEM}
                                accept="image/*,.pdf"
                                hasError={!!fieldState.error}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
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
                  {t('common.creating')}
                </>
              ) : (
                t('orders.createOrder')
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

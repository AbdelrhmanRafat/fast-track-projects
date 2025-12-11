'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/components/providers/LanguageProvider';
import { useErrorStore } from '@/stores/errorStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Edit, 
  CheckCircle2, 
  Loader2,
  Printer,
  ClipboardCheck,
} from 'lucide-react';
import { updateOrderStatus } from '@/lib/services/orders';
import { OrderStatus } from '@/lib/services/orders/types';
import type { Order } from '@/lib/services/orders/types';
import { UserRole } from '@/lib/types/userRoles';
import {
  OrderHeader,
  OrderInfoCard,
  OrderItemsCard,
  OrderSidebar,
} from './OrderViewShared';

interface EngineeringViewProps {
  order: Order;
  userRole?: UserRole;
}

/**
 * Engineering/Site View
 * - Can edit order when status is 'تم اجراء الطلب' (Order Created)
 * - Engineering role can complete engineering review to change status to 'تمت المراجعة الهندسية'
 * - Site role can only view and edit orders, cannot complete engineering review
 * - Can print order summary
 */
export default function EngineeringView({ order, userRole }: EngineeringViewProps) {
  const { t, isRTL } = useTranslation();
  const router = useRouter();
  const { showError } = useErrorStore();
  
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Check if user is Engineering role (not Site)
  const isEngineeringRole = userRole === UserRole.Engineering;

  // Status checks
  const isOrderCreated = order.status === OrderStatus.ORDER_CREATED;
  const isEngineeringReviewed = order.status === OrderStatus.ENGINEERING_REVIEWED;
  
  // Permission checks - Only Engineering role can complete review, not Site
  const canEditOrder = isOrderCreated; // Can edit only when order is just created
  const canCompleteReview = isOrderCreated && isEngineeringRole; // Only Engineering can complete review

  // Handle completing engineering review
  const handleCompleteReview = async () => {
    setIsSubmittingReview(true);
    
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
      setIsSubmittingReview(false);
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
      <Button variant="outline" onClick={handlePrint}>
        <Printer className="h-4 w-4 me-2" />
        {t('orders.print')}
      </Button>
      
      {/* Edit button - Only when order is just created */}
      {canEditOrder && (
        <Button asChild variant="outline">
          <Link href={`/orders/${order.id}/edit`}>
            <Edit className="h-4 w-4 me-2" />
            {t('orders.edit')}
          </Link>
        </Button>
      )}
    </>
  );

  return (
    <div className="space-y-6 print:space-y-4">
      <OrderHeader order={order} t={t} isRTL={isRTL} actions={headerActions} />
      
      <OrderInfoCard order={order} t={t} />

      {/* Engineering Review Section - Complete Review */}
      {canCompleteReview && (
        <Card className="overflow-hidden p-0 gap-0 border-2 border-primary/30 dark:border-primary/40 print:hidden">
          <div className="bg-primary px-5 py-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/15">
              <ClipboardCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{t('orders.engineering.title')}</h2>
              <p className="text-white/70 text-sm">{t('orders.engineering.description')}</p>
            </div>
          </div>
          <CardContent className="p-5 space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('orders.engineering.reviewNote')}
            </p>
            
            <Separator />
            
            <div className="flex justify-end">
              <Button
                onClick={handleCompleteReview}
                disabled={isSubmittingReview}
              >
                {isSubmittingReview ? (
                  <>
                    <Loader2 className="h-4 w-4 me-2 animate-spin" />
                    {t('orders.engineering.submitting')}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 me-2" />
                    {t('orders.engineering.completeReview')}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Show message if engineering review is completed - only for Engineering role */}
      {isEngineeringReviewed && isEngineeringRole && (
        <Card className="overflow-hidden p-0 gap-0 border-2 border-primary/30 print:hidden">
          <div className="bg-primary/10 dark:bg-primary/20 px-5 py-4 flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-lg font-bold text-primary dark:text-primary">
                {t('orders.engineering.reviewCompleted')}
              </h2>
              <p className="text-primary/70 dark:text-primary/70 text-sm">
                {t('orders.engineering.awaitingAdminReview')}
              </p>
            </div>
          </div>
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

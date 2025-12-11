'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/components/providers/LanguageProvider';
import RouteBasedPageHeader from '@/components/SharedCustomComponents/RouteBasedPageHeader';
import { Table, TableColumn, TableAction } from '@/components/ui/Table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, ChevronRight, ChevronLeft } from 'lucide-react';
import type { Order, PaginationInfo, OrderStatus } from '@/lib/services/orders';

interface CurrentOrdersClientProps {
  initialOrders: Order[];
  pagination: PaginationInfo;
  currentPage: number;
}

export default function CurrentOrdersClient({ 
  initialOrders, 
  pagination,
  currentPage 
}: CurrentOrdersClientProps) {
  const { t } = useTranslation();
  const router = useRouter();
  
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>(pagination);
  const [isLoading, setIsLoading] = useState(false);

  // Sync state when props change (after navigation)
  useEffect(() => {
    setOrders(initialOrders);
    setPaginationInfo(pagination);
    setIsLoading(false);
  }, [initialOrders, pagination]);

  // Get status badge with appropriate styling for light/dark mode
  const getStatusBadge = (status: OrderStatus) => {
    const statusConfig: Record<string, { className: string; labelKey: string }> = {
      // New request - Gray/Neutral
      'تم اجراء الطلب': { 
        className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700', 
        labelKey: 'orders.status.requestCreated' 
      },
      // Engineering reviewed - Cyan
      'تمت المراجعة الهندسية': { 
        className: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800', 
        labelKey: 'orders.status.engineeringReviewed' 
      },
      // Under admin review - Blue
      'مراجعة الطلب من الادارة': { 
        className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800', 
        labelKey: 'orders.status.underAdminReview' 
      },
      // Approved - Green
      'تمت الموافقة من الادارة': { 
        className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', 
        labelKey: 'orders.status.ownerApproved' 
      },
      // Rejected - Red
      'تم الرفض من الادارة': { 
        className: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-800', 
        labelKey: 'orders.status.ownerRejected' 
      },
      // Purchasing in progress - Amber/Orange
      'جاري الان عملية الشراء': { 
        className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200 dark:border-amber-800', 
        labelKey: 'orders.status.purchasingInProgress' 
      },
      // Closed - Purple
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
      <Badge variant="outline" className={config.className}>
        {t(config.labelKey as any)}
      </Badge>
    );
  };

  // Format date for display (Gregorian calendar)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Table columns configuration
  const columns: TableColumn<Order>[] = [
    {
      key: 'title',
      label: t('orders.table.title'),
      sortable: false,
    },
    {
      key: 'created_by_name',
      label: t('orders.table.createdBy'),
      sortable: false,
    },
    {
      key: 'created_at',
      label: t('orders.table.date'),
      sortable: false,
      render: (value) => formatDate(value),
    },
    {
      key: 'status',
      label: t('orders.table.status'),
      render: (value) => getStatusBadge(value),
    },
    {
      key: 'items',
      label: t('orders.table.itemsCount'),
      render: (value) => value?.length || 0,
    },
  ];

  // Table actions configuration (view only for current orders)
  const actions: TableAction[] = [
    {
      key: 'view',
      label: t('common.viewDetails'),
      icon: <Eye className="h-4 w-4" />,
      onClick: (row) => {
        router.push(`/orders/${row.id}`);
      },
    },
  ];

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setIsLoading(true);
    router.push(`/orders/current?page=${newPage}`);
  };

  return (
    <div className="space-y-6">
      <RouteBasedPageHeader />
      
      <Table<Order>
        columns={columns}
        data={orders}
        actions={actions}
        loading={isLoading}
        searchable={false}
        showPagination={false}
        emptyMessage={t('orders.table.noCurrentOrders')}
        skeletonRows={10}
      />

      {/* Custom Server-Side Pagination */}
      {paginationInfo.total_pages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-card rounded-lg border border-border">
          <div className="text-sm text-muted-foreground">
            {t('table.showing')} {((currentPage - 1) * paginationInfo.limit) + 1} - {Math.min(currentPage * paginationInfo.limit, paginationInfo.total)} {t('table.of')} {paginationInfo.total} {t('table.entries')}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || isLoading}
            >
              <ChevronRight className="h-4 w-4" />
              {t('table.previous')}
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: paginationInfo.total_pages }, (_, i) => i + 1)
                .filter(page => {
                  // Show first, last, current, and adjacent pages
                  return page === 1 || 
                         page === paginationInfo.total_pages || 
                         Math.abs(page - currentPage) <= 1;
                })
                .map((page, index, array) => {
                  // Add ellipsis if there's a gap
                  const showEllipsis = index > 0 && page - array[index - 1] > 1;
                  return (
                    <React.Fragment key={page}>
                      {showEllipsis && (
                        <span className="px-2 text-muted-foreground">...</span>
                      )}
                      <Button
                        variant={page === currentPage ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        disabled={isLoading}
                        className="min-w-9"
                      >
                        {page}
                      </Button>
                    </React.Fragment>
                  );
                })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= paginationInfo.total_pages || isLoading}
            >
              {t('table.next')}
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

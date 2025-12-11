import React, { Suspense } from 'react';
import Loading from './loading';
import { getAllOrders } from '@/lib/services/orders';
import type { Order, PaginationInfo } from '@/lib/services/orders';
import AllOrdersClient from './pageClient';

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function AllOrdersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const currentPage = Number(params.page) || 1;
  
  // Server-side data fetching using NetworkLayer
  const response = await getAllOrders({ page: currentPage, limit: 10 });
  
  // Extract orders and pagination
  let orders: Order[] = [];
  let pagination: PaginationInfo = {
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 1,
  };
  
  if (response?.data) {
    const data = response.data;
    if (data.orders && Array.isArray(data.orders)) {
      orders = data.orders;
    }
    if (data.pagination) {
      pagination = data.pagination;
    }
  }

  return (
    <Suspense fallback={<Loading />}>
      <AllOrdersClient 
        initialOrders={orders} 
        pagination={pagination}
        currentPage={currentPage}
      />
    </Suspense>
  );
}

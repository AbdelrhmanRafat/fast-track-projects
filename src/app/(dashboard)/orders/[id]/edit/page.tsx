import React, { Suspense } from 'react';
import Loading from './loading';
import { getOrderById } from '@/lib/services/orders';
import type { Order } from '@/lib/services/orders';
import { OrderStatus } from '@/lib/services/orders/types';
import EditOrderClient from './pageClient';
import { notFound, redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditOrderPage({ params }: PageProps) {
  const { id } = await params;
  
  // Server-side data fetching using NetworkLayer
  const response = await getOrderById(id);
  
  // If no order found, show 404
  if (!response?.data) {
    notFound();
  }

  const order: Order = response.data;

  // Admin cannot edit closed orders - redirect to view page
  if (order.status === OrderStatus.ORDER_CLOSED) {
    redirect(`/orders/${id}`);
  }

  return (
    <Suspense fallback={<Loading />}>
      <EditOrderClient order={order} />
    </Suspense>
  );
}

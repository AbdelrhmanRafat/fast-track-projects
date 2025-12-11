import React, { Suspense } from 'react';
import { cookies } from 'next/headers';
import Loading from '../loading';
import { getOrderById } from '@/lib/services/orders';
import type { Order } from '@/lib/services/orders';
import { notFound, redirect } from 'next/navigation';
import { COOKIE_USER_ROLE } from '@/lib/cookies';
import { UserRole } from '@/lib/types/userRoles';
import { OrderStatus } from '@/lib/services/orders/types';
import PurchasingView from '../components/PurchasingView';

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Purchasing/Item Status Edit Page
 * Accessible by: Admin, SubAdmin, Purchasing roles
 * Admin/SubAdmin: Can access at any order status
 * Purchasing: Only when order status is OWNER_APPROVED or PURCHASING_IN_PROGRESS
 */
export default async function PurchasingEditPage({ params }: PageProps) {
  const { id } = await params;
  
  // Get user role from cookies (server-side)
  const cookieStore = await cookies();
  const userRole = cookieStore.get(COOKIE_USER_ROLE)?.value as UserRole | undefined;
  
  // Check authorization - only Admin, SubAdmin, and Purchasing can access
  const isAuthorized = 
    userRole === UserRole.Admin || 
    userRole === UserRole.SubAdmin || 
    userRole === UserRole.Purchasing;
  
  if (!isAuthorized) {
    redirect('/unauthorized');
  }
  
  // Server-side data fetching using NetworkLayer
  const response = await getOrderById(id);
  
  // If no order found, show 404
  if (!response?.data) {
    notFound();
  }

  const order: Order = response.data;

  // Admin and SubAdmin can access at any status
  // Purchasing role can only access when status is OWNER_APPROVED or PURCHASING_IN_PROGRESS
  const isAdminOrSubAdmin = userRole === UserRole.Admin || userRole === UserRole.SubAdmin;
  const canEditItemStatus = 
    isAdminOrSubAdmin || 
    order.status === OrderStatus.OWNER_APPROVED || 
    order.status === OrderStatus.PURCHASING_IN_PROGRESS;

  if (!canEditItemStatus) {
    // Redirect back to order view if status doesn't allow editing
    redirect(`/orders/${id}`);
  }

  return (
    <Suspense fallback={<Loading />}>
      <PurchasingView order={order} />
    </Suspense>
  );
}

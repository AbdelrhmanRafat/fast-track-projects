import React, { Suspense } from 'react';
import { cookies } from 'next/headers';
import Loading from './loading';
import { getOrderById } from '@/lib/services/orders';
import type { Order } from '@/lib/services/orders';
import { notFound } from 'next/navigation';
import { COOKIE_USER_ROLE } from '@/lib/cookies';
import { UserRole } from '@/lib/types/userRoles';

// Role-based view components
import { AdminView, EngineeringView, PurchasingView } from './components';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailsPage({ params }: PageProps) {
  const { id } = await params;
  
  // Get user role from cookies (server-side)
  const cookieStore = await cookies();
  const userRole = cookieStore.get(COOKIE_USER_ROLE)?.value as UserRole | undefined;
  
  // Server-side data fetching using NetworkLayer
  const response = await getOrderById(id);
  
  // If no order found, show 404
  if (!response?.data) {
    notFound();
  }

  const order: Order = response.data;

  // Render the appropriate view based on user role
  const renderView = () => {
    switch (userRole) {
      case UserRole.Admin:
      case UserRole.SubAdmin:
        return <AdminView order={order} />;
      
      case UserRole.Engineering:
      case UserRole.Site:
        return <EngineeringView order={order} userRole={userRole} />;
      
      case UserRole.Purchasing:
        return <PurchasingView order={order} />;
      
      default:
        // Fallback to Engineering view (view-only) for unknown roles
        return <EngineeringView order={order} />;
    }
  };

  return (
    <Suspense fallback={<Loading />}>
      {renderView()}
    </Suspense>
  );
}

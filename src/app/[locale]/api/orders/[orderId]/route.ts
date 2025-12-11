import { NextRequest, NextResponse } from 'next/server';
import { NetworkLayer } from '@/network';
import type { ApiResponse } from '@/lib/types/response';

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

/**
 * PUT /api/orders/[orderId]
 * Update order
 * Allowed Roles: Admin, Sub-Admin
 * Restriction: Order can ONLY be edited when status is 'مراجعة الطلب من الادارة'
 * 
 * Request body can include:
 * - title: string (optional)
 * - order_notes: string (optional)
 * - items: array (optional) - can update, create, or delete items
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<any> | ApiResponse<null>>> {
  try {
    const { orderId } = await context.params;
    const body = await request.json();

    const networkLayer = await NetworkLayer.createWithAutoConfig();
    const response = await networkLayer.put<ApiResponse<any>>(
      `/update-order?id=${orderId}`,
      body
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    const d = error?.details;
    const backendMessage = (() => {
      if (!d) return error.message || 'Failed to update order';
      if (typeof d === 'string') return d;
      if (d.message) return d.message;
      if (d.error) {
        if (typeof d.error === 'string') return d.error;
        if (d.error.message) return d.error.message;
      }
      if (d.errors) {
        if (typeof d.errors === 'string') return d.errors;
        if (typeof d.errors === 'object') {
          const first = Object.values(d.errors)[0];
          if (Array.isArray(first) && first.length > 0) {
            return String(first[0]);
          }
        }
      }
      if (d.msg) return d.msg;
      return error.message || 'Failed to update order';
    })();

    return NextResponse.json(
      {
        code: error.status || 500,
        status: error.status || 500,
        message: backendMessage,
        errors: null,
        data: null,
      },
      { status: error.status || 500 }
    );
  }
}

/**
 * DELETE /api/orders/[orderId]
 * Delete order
 * Allowed Roles: Admin, Sub-Admin
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<any> | ApiResponse<null>>> {
  try {
    const { orderId } = await context.params;

    const networkLayer = await NetworkLayer.createWithAutoConfig();
    const response = await networkLayer.delete<ApiResponse<any>>(
      `/delete-order?id=${orderId}`
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    const d = error?.details;
    const backendMessage = (() => {
      if (!d) return error.message || 'Failed to delete order';
      if (typeof d === 'string') return d;
      if (d.message) return d.message;
      if (d.error) {
        if (typeof d.error === 'string') return d.error;
        if (d.error.message) return d.error.message;
      }
      if (d.errors) {
        if (typeof d.errors === 'string') return d.errors;
        if (typeof d.errors === 'object') {
          const first = Object.values(d.errors)[0];
          if (Array.isArray(first) && first.length > 0) {
            return String(first[0]);
          }
        }
      }
      if (d.msg) return d.msg;
      return error.message || 'Failed to delete order';
    })();

    return NextResponse.json(
      {
        code: error.status || 500,
        status: error.status || 500,
        message: backendMessage,
        errors: null,
        data: null,
      },
      { status: error.status || 500 }
    );
  }
}

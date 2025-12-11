import { NextRequest, NextResponse } from 'next/server';
import { NetworkLayer } from '@/network';
import type { ApiResponse } from '@/lib/types/response';

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

/**
 * PUT /api/orders/[orderId]/admin-checked
 * Update admin checked status for order items
 * 
 * Allowed Roles: Admin, Sub-Admin
 * Required Order Status: 'مراجعة الطلب من الادارة' (Under Admin Review)
 * 
 * Request Body:
 * {
 *   items: [
 *     { item_id: "uuid", approved: true | false | null }
 *   ]
 * }
 * 
 * Rules:
 * - For APPROVAL: All items must have a decision (approved !== null)
 * - For REJECTION: Admin can reject any items without updating all
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
      `/update-admin-checked?id=${orderId}`,
      body
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    const d = error?.details;
    const backendMessage = (() => {
      if (!d) return error.message || 'Failed to update item approval status';
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
      return error.message || 'Failed to update item approval status';
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

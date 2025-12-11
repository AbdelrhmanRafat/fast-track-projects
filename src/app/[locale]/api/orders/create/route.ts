import { NextRequest, NextResponse } from 'next/server';
import { NetworkLayer } from '@/network';
import type { ApiResponse } from '@/lib/types/response';

/**
 * POST /api/orders/create
 * Create a new order
 * Allowed Roles: Admin, Sub-Admin, Engineering, Site
 * Initial status will be: 'تم اجراء الطلب' (Order Created)
 * 
 * Request body:
 * - title: string (required)
 * - order_notes: string (optional)
 * - items: array of { title: string, description?: string } (required)
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<any> | ApiResponse<null>>> {
  try {
    const body = await request.json();

    // Create NetworkLayer instance
    const networkLayer = await NetworkLayer.createWithAutoConfig();

    // Make request to external API with JSON
    const response = await networkLayer.post<ApiResponse<any>>(
      '/create-order',
      body,
      { contentType: 'json' }
    );

    // Return backend ApiResponse directly
    return NextResponse.json(response.data);
  } catch (error: any) {
    // Extract backend message from error.details
    const d = error?.details;
    const backendMessage = (() => {
      if (!d) return error.message || 'Failed to create order';
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
      return error.message || 'Failed to create order';
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

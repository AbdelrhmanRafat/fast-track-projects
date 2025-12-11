import { NextRequest, NextResponse } from 'next/server';
import { NetworkLayer } from '@/network';
import type { ApiResponse } from '@/lib/types/response';

/**
 * POST /api/orders/items/[itemId]/attachments
 * Upload attachments for a specific order item
 * Allowed Roles: Admin, Sub-Admin, Engineering
 * 
 * Limits:
 * - Max 5 attachments per item
 * - Allowed types: JPG, JPEG, PNG, PDF
 * 
 * Request: multipart/form-data with attachment[0], attachment[1], etc.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
): Promise<NextResponse<ApiResponse<any> | ApiResponse<null>>> {
  try {
    const { itemId } = await params;
    const formData = await request.formData();

    // Create NetworkLayer instance
    const networkLayer = await NetworkLayer.createWithAutoConfig();

    // Make request to external API
    const response = await networkLayer.post<ApiResponse<any>>(
      `/upload-item-attachments?item_id=${itemId}`,
      formData,
      { contentType: 'form-data' }
    );

    // Return backend ApiResponse directly
    return NextResponse.json(response.data);
  } catch (error: any) {
    // Extract backend message from error.details
    const d = error?.details;
    const backendMessage = (() => {
      if (!d) return error.message || 'Failed to upload attachments';
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
      return error.message || 'Failed to upload attachments';
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

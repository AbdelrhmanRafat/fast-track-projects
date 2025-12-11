import { NextRequest, NextResponse } from 'next/server';
import { NetworkLayer } from '@/network';
import type { ApiResponse } from '@/lib/types/response';

/**
 * PUT /api/users/update?id=USER_UUID_HERE - Update a user
 * 
 * Automatically appends @fast-track.com to account_name before sending
 */
export async function PUT(
  request: NextRequest
): Promise<NextResponse<ApiResponse<any> | ApiResponse<null>>> {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        {
          code: 400,
          status: 400,
          errors: 'User ID is required',
          message: 'User ID is required',
          data: null
        } as ApiResponse<null>,
        { status: 400 }
      );
    }

    const body = await request.json();

    // Append @fast-track.com to account_name if not already present
    if (body.account_name && !body.account_name.includes('@')) {
      body.account_name = `${body.account_name}@fast-track.com`;
    }

    // Create NetworkLayer instance
    const networkLayer = await NetworkLayer.createWithAutoConfig();

    // Make request to external API
    const response = await networkLayer.put<ApiResponse<any>>(
      `/update-user?id=${id}`,
      body
    );

    // Return backend ApiResponse directly
    return NextResponse.json(response.data);
  } catch (error: any) {
    // Extract backend message from error.details
    const d = error?.details;
    const backendMessage = (() => {
      if (!d) return error.message || 'Failed to update user';
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
      return error.message || 'Failed to update user';
    })();

    const statusCode = error.status || 500;

    return NextResponse.json(
      {
        code: statusCode,
        status: statusCode,
        errors: backendMessage,
        message: backendMessage,
        data: null
      } as ApiResponse<null>,
      { status: statusCode }
    );
  }
}

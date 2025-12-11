import { NextRequest, NextResponse } from 'next/server';
import { NetworkLayer } from '@/network';
import type { ApiResponse } from '@/lib/types/response';
import type { ChangePasswordResponse } from '@/lib/services/auth/types';

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<ChangePasswordResponse> | ApiResponse<null>>> {
  try {
    const body = await request.json();

    // Get cookie header from request for NetworkLayer (contains the auth token)
    const cookieHeader = request.headers.get('cookie') || '';

    // Create NetworkLayer instance with cookies
    const networkLayer = new NetworkLayer({}, cookieHeader);

    // Make request to external API to change password
    const response = await networkLayer.post<ApiResponse<ChangePasswordResponse>>(
      '/change-password',
      body
    );

    // Return backend ApiResponse directly
    return NextResponse.json(response.data);
  } catch (error: any) {
    // Extract backend message from error.details
    const d = error?.details;
    const backendMessage = (() => {
      if (!d) return error.message || 'Failed to change password';
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
      return error.message || 'Failed to change password';
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

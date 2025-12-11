import { NextRequest, NextResponse } from 'next/server';
import { NetworkLayer } from '@/network';
import type { ApiResponse } from '@/lib/types/response';
import type { LogoutResponse } from '@/lib/services/auth/types';

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<LogoutResponse> | ApiResponse<null>>> {
  try {
    // Get cookie header from request for NetworkLayer
    const cookieHeader = request.headers.get('cookie') || '';

    // Create NetworkLayer instance with cookies
    const networkLayer = new NetworkLayer({}, cookieHeader);

    // Make request to external API to logout
    const response = await networkLayer.post<ApiResponse<LogoutResponse>>('/logout');

    // Return success response
    return NextResponse.json(
      {
        code: response.status,
        status: response.status,
        errors: null,
        message: (response.data as any)?.message || 'Logged out successfully',
        data: { message: 'Logged out successfully' }
      } as ApiResponse<LogoutResponse>,
      { status: response.status }
    );
  } catch (error: any) {
    // Extract backend message from error.details
    const d = error?.details;
    const backendMessage = (() => {
      if (!d) return error.message || 'Logout failed';
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
      return error.message || 'Logout failed';
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

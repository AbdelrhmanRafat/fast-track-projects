import { NextRequest, NextResponse } from 'next/server';
import { NetworkLayer } from '@/network';
import type { ApiResponse } from '@/lib/types/response';
import type { VerifyLoginResponse } from '@/lib/services/auth/types';

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<VerifyLoginResponse> | ApiResponse<null>>> {
  try {
    // Get cookie header from request for NetworkLayer (contains the auth token)
    const cookieHeader = request.headers.get('cookie') || '';

    // Create NetworkLayer instance with cookies
    const networkLayer = new NetworkLayer({}, cookieHeader);

    // Make request to external API to verify login
    // The token will be sent automatically via cookies
    const response = await networkLayer.post<ApiResponse<VerifyLoginResponse>>(
      '/verify-login'
    );

    // Return backend ApiResponse directly
    return NextResponse.json(response.data);
  } catch (error: any) {
    // Extract backend message from error.details
    const d = error?.details;
    const backendMessage = (() => {
      if (!d) return error.message || 'Token verification failed';
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
      return error.message || 'Token verification failed';
    })();

    const statusCode = error.status || 401;

    return NextResponse.json(
      {
        code: statusCode,
        status: statusCode,
        errors: backendMessage,
        message: backendMessage,
        data: null
      },
      { status: statusCode }
    );
  }
}

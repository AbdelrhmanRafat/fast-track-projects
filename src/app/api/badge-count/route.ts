import { NextRequest, NextResponse } from 'next/server';
import { NetworkLayer } from '@/network';
import type { ApiResponse } from '@/lib/types/response';
import { COOKIE_TOKEN } from '@/lib/cookies';

/**
 * Frontend badge count response structure
 * This app only uses unreadNotifications
 */
interface BadgeCountData {
  unreadNotifications: number;
}

/**
 * GET /api/badge-count
 * Proxies to backend /badge-count endpoint
 * Returns unread notifications count and pending orders count
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<BadgeCountData> | ApiResponse<null>>> {
  try {
    // Get auth token from cookies
    const token = request.cookies.get(COOKIE_TOKEN)?.value;

    if (!token) {
      return NextResponse.json(
        {
          code: 401,
          status: 401,
          message: 'غير مصرح - يرجى تسجيل الدخول',
          errors: null,
          data: null,
        },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const projectSource = searchParams.get('project_source'); // 'orders' | 'projects'

    // Create NetworkLayer instance with cookies from request
    const cookieHeader = request.headers.get('cookie') || '';
    const networkLayer = await NetworkLayer.createWithAutoConfig({}, cookieHeader);

    // Build query string
    let query = '';
    if (projectSource) {
      query = `?project_source=${projectSource}`;
    }

    // Fetch badge count from backend
    const response = await networkLayer.get<any>(`/badge-count${query}`);

    // Backend response is wrapped in response.data
    const backendResponse = response.data;

    // Check if backend returned success (code: 0)
    if (backendResponse?.code === 0 && backendResponse?.data) {
      const { unread_notifications } = backendResponse.data;
      
      return NextResponse.json({
        code: 200,
        status: 200,
        message: 'Success',
        errors: null,
        data: {
          unreadNotifications: unread_notifications || 0,
        }
      });
    }

    // If backend returned an error, return zeros
    return NextResponse.json({
      code: 200,
      status: 200,
      message: 'Success',
      errors: null,
      data: {
        unreadNotifications: 0,
      }
    });

  } catch (error: any) {
    // Return zeros on error instead of failing
    return NextResponse.json({
      code: 200,
      status: 200,
      message: 'Success',
      errors: null,
      data: {
        unreadNotifications: 0,
      }
    });
  }
}

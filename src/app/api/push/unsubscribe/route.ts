import { NextRequest, NextResponse } from 'next/server';
import { NetworkLayer } from '@/network';
import type { ApiResponse } from '@/lib/types/response';
import { COOKIE_TOKEN } from '@/lib/cookies';

/**
 * POST /api/push/unsubscribe
 * Unsubscribe from push notifications (remove FCM token)
 * 
 * Request body:
 * {
 *   fcmToken: string
 * }
 * 
 * Security: Uses cookies for auth
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<any>>> {
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

    // Parse request body
    const body = await request.json();

    if (!body.fcmToken) {
      return NextResponse.json(
        {
          code: 400,
          status: 400,
          message: 'FCM token مطلوب',
          errors: null,
          data: null,
        },
        { status: 400 }
      );
    }

    // Create NetworkLayer instance with cookies
    const cookieHeader = request.headers.get('cookie') || '';
    const networkLayer = await NetworkLayer.createWithAutoConfig({}, cookieHeader);

    try {
      // Delete FCM token from backend /fcm-tokens endpoint
      const response = await networkLayer.delete<ApiResponse<any>>(
        '/fcm-tokens',
        { body: { fcm_token: body.fcmToken } }
      );

      return NextResponse.json({
        code: 200,
        status: 200,
        message: 'تم إلغاء الاشتراك بنجاح',
        errors: null,
        data: response.data,
      });
    } catch (backendError) {
      // Return success anyway - token might not exist in backend
      return NextResponse.json({
        code: 200,
        status: 200,
        message: 'تم إلغاء الاشتراك',
        errors: null,
        data: null,
      });
    }
  } catch (error) {
    return NextResponse.json(
      {
        code: 500,
        status: 500,
        message: 'حدث خطأ في إلغاء الاشتراك',
        errors: null,
        data: null,
      },
      { status: 500 }
    );
  }
}

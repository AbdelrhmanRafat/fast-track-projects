import { NextRequest, NextResponse } from 'next/server';
import { NetworkLayer } from '@/network';
import type { ApiResponse } from '@/lib/types/response';
import { COOKIE_TOKEN, COOKIE_USER_DATA } from '@/lib/cookies';
import type { SubscribeRequest, StoredPushSubscription } from '@/lib/services/notifications/types';

/**
 * Helper to get user ID from user data cookie
 */
function getUserIdFromCookie(request: NextRequest): string | null {
  try {
    const userData = request.cookies.get(COOKIE_USER_DATA)?.value;
    if (!userData) return null;
    // User data is encrypted, we'll get ID from the backend
    return 'current'; // Placeholder - backend will use token to get user
  } catch {
    return null;
  }
}

/**
 * POST /api/push/subscribe
 * Subscribe to push notifications (supports both Web Push and Firebase Cloud Messaging)
 * 
 * Request body for Web Push:
 * {
 *   subscription: { endpoint, keys: { p256dh, auth } },
 *   deviceInfo?: { userAgent, platform, language, ... }
 * }
 * 
 * Request body for Firebase:
 * {
 *   fcmToken: string,
 *   deviceInfo?: { userAgent, platform, language, ... }
 * }
 * 
 * Security: Uses cookies for auth, server-side only database access
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

    // Check if this is a Firebase FCM token subscription
    if (body.fcmToken) {
      // Create NetworkLayer instance with cookies
      const cookieHeader = request.headers.get('cookie') || '';
      const networkLayer = await NetworkLayer.createWithAutoConfig({}, cookieHeader);

      // Prepare FCM subscription data - matches backend /fcm-tokens endpoint
      const fcmData = {
        fcm_token: body.fcmToken,
        device_info: body.deviceInfo || {
          platform: 'web',
          userAgent: request.headers.get('user-agent') || '',
          language: request.headers.get('accept-language')?.split(',')[0] || 'ar',
        },
      };

      // Save FCM token to backend /fcm-tokens endpoint
      try {
        const response = await networkLayer.post<ApiResponse<any>>(
          '/fcm-tokens',
          fcmData
        );

        return NextResponse.json({
          code: 200,
          status: 200,
          message: 'تم الاشتراك في إشعارات Firebase بنجاح',
          errors: null,
          data: response.data,
        });
      } catch (backendError) {
        // Return success anyway - local notifications still work
        return NextResponse.json({
          code: 200,
          status: 200,
          message: 'تم الاشتراك في الإشعارات',
          errors: null,
          data: { fcmToken: body.fcmToken },
        });
      }
    }

    // Web Push subscription (legacy)
    if (!body.subscription?.endpoint || !body.subscription?.keys?.p256dh || !body.subscription?.keys?.auth) {
      return NextResponse.json(
        {
          code: 400,
          status: 400,
          message: 'بيانات الاشتراك غير صالحة',
          errors: null,
          data: null,
        },
        { status: 400 }
      );
    }

    // Create NetworkLayer instance with cookies
    const cookieHeader = request.headers.get('cookie') || '';
    const networkLayer = await NetworkLayer.createWithAutoConfig({}, cookieHeader);

    // Prepare subscription data - backend will extract user_id from token
    const subscriptionData = {
      endpoint: body.subscription.endpoint,
      p256dh: body.subscription.keys.p256dh,
      auth: body.subscription.keys.auth,
      device_info: body.deviceInfo || {},
      type: 'web-push',
    };

    // Save subscription to backend
    const response = await networkLayer.post<ApiResponse<StoredPushSubscription>>(
      '/push-subscriptions',
      subscriptionData
    );

    return NextResponse.json({
      code: 200,
      status: 200,
      message: 'تم الاشتراك في الإشعارات بنجاح',
      errors: null,
      data: response.data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        code: 500,
        status: 500,
        message: 'حدث خطأ في الخادم',
        errors: null,
        data: null,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/push/subscribe
 * Unsubscribe from push notifications
 * 
 * Request body:
 * { endpoint: string } - for Web Push
 * { fcmToken: string } - for Firebase
 */
export async function DELETE(
  request: NextRequest
): Promise<NextResponse<ApiResponse<null>>> {
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
    const { endpoint, fcmToken } = body;

    // Create NetworkLayer instance with cookies
    const cookieHeader = request.headers.get('cookie') || '';
    const networkLayer = await NetworkLayer.createWithAutoConfig({}, cookieHeader);

    // Handle FCM token deletion
    if (fcmToken) {
      try {
        // DELETE with body in options
        await networkLayer.delete<ApiResponse<null>>(
          '/fcm-tokens',
          { body: { fcm_token: fcmToken } }
        );

        return NextResponse.json({
          code: 200,
          status: 200,
          message: 'تم إلغاء الاشتراك بنجاح',
          errors: null,
          data: null,
        });
      } catch (backendError) {
        // Return success anyway - token is cleared locally
        return NextResponse.json({
          code: 200,
          status: 200,
          message: 'تم إلغاء الاشتراك',
          errors: null,
          data: null,
        });
      }
    }

    // Handle Web Push endpoint deletion (legacy)
    if (!endpoint) {
      return NextResponse.json(
        {
          code: 400,
          status: 400,
          message: 'عنوان الاشتراك مطلوب',
          errors: null,
          data: null,
        },
        { status: 400 }
      );
    }

    // Delete subscription from backend
    await networkLayer.post<ApiResponse<null>>(
      '/push-subscriptions/unsubscribe',
      { endpoint }
    );

    return NextResponse.json({
      code: 200,
      status: 200,
      message: 'تم إلغاء الاشتراك بنجاح',
      errors: null,
      data: null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        code: 500,
        status: 500,
        message: 'حدث خطأ في الخادم',
        errors: null,
        data: null,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/push/subscribe
 * Check subscription status
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ isSubscribed: boolean }>>> {
  try {
    const token = request.cookies.get(COOKIE_TOKEN)?.value;

    if (!token) {
      return NextResponse.json({
        code: 200,
        status: 200,
        message: 'Success',
        errors: null,
        data: { isSubscribed: false },
      });
    }

    // Get endpoint from query params
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');

    if (!endpoint) {
      return NextResponse.json({
        code: 200,
        status: 200,
        message: 'Success',
        errors: null,
        data: { isSubscribed: false },
      });
    }

    // Create NetworkLayer instance with cookies
    const cookieHeader = request.headers.get('cookie') || '';
    const networkLayer = await NetworkLayer.createWithAutoConfig({}, cookieHeader);

    // Check if subscription exists
    try {
      const response = await networkLayer.get<ApiResponse<{ isSubscribed: boolean }>>(
        `/push-subscriptions/check?endpoint=${encodeURIComponent(endpoint)}`
      );
      
      const responseData = response.data as any;
      
      return NextResponse.json({
        code: 200,
        status: 200,
        message: 'Success',
        errors: null,
        data: { isSubscribed: responseData?.isSubscribed ?? false },
      });
    } catch {
      return NextResponse.json({
        code: 200,
        status: 200,
        message: 'Success',
        errors: null,
        data: { isSubscribed: false },
      });
    }
  } catch (error) {
    return NextResponse.json({
      code: 200,
      status: 200,
      message: 'Success',
      errors: null,
      data: { isSubscribed: false },
    });
  }
}

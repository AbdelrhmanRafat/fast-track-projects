import { NextRequest, NextResponse } from 'next/server';
import { NetworkLayer } from '@/network';
import type { ApiResponse } from '@/lib/types/response';
import { COOKIE_TOKEN, COOKIE_USER_ROLE } from '@/lib/cookies';
import type { SendNotificationRequest, PushPayload } from '@/lib/services/notifications/types';

/**
 * POST /api/push/send
 * Send push notification to a user
 * 
 * Security: 
 * - Requires admin/service role OR internal service key
 * - Server-side only - no direct client access to push service
 * 
 * Request body:
 * {
 *   userId: string,
 *   title: string,
 *   body: string,
 *   type?: string,
 *   orderId?: string,
 *   data?: object
 * }
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ sent: number; failed: number } | null>>> {
  try {
    // Check for service key (internal calls)
    const serviceKey = request.headers.get('X-Service-Key');
    const isServiceCall = serviceKey === process.env.INTERNAL_SERVICE_KEY;

    // Or check for admin role (manual sends)
    const token = request.cookies.get(COOKIE_TOKEN)?.value;
    const role = request.cookies.get(COOKIE_USER_ROLE)?.value;
    const isAdmin = role === 'admin' || role === 'sub-admin';

    if (!isServiceCall && !isAdmin) {
      return NextResponse.json(
        {
          code: 403,
          status: 403,
          message: 'غير مصرح - صلاحيات غير كافية',
          errors: null,
          data: null,
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body: SendNotificationRequest = await request.json();

    if (!body.userId || !body.title || !body.body) {
      return NextResponse.json(
        {
          code: 400,
          status: 400,
          message: 'بيانات الإشعار غير مكتملة',
          errors: null,
          data: null,
        },
        { status: 400 }
      );
    }

    // Create NetworkLayer instance
    const cookieHeader = request.headers.get('cookie') || '';
    const networkLayer = await NetworkLayer.createWithAutoConfig({}, cookieHeader);

    // 1. Save notification to database
    const notificationData = {
      user_id: body.userId,
      order_id: body.orderId || null,
      title: body.title,
      body: body.body,
      type: body.type || 'order_status_changed',
      data: body.data || {},
      is_read: false,
    };

    await networkLayer.post<ApiResponse<any>>(
      '/notifications',
      notificationData
    );

    // 2. Get user's push subscriptions and send push
    try {
      const subscriptionsResponse = await networkLayer.get<ApiResponse<any[]>>(
        `/push-subscriptions?user_id=${body.userId}`
      );

      const subscriptions = subscriptionsResponse.data || [];

      if (!Array.isArray(subscriptions) || subscriptions.length === 0) {
        return NextResponse.json({
          code: 200,
          status: 200,
          message: 'تم حفظ الإشعار - لا توجد اشتراكات للإرسال',
          errors: null,
          data: { sent: 0, failed: 0 },
        });
      }

      // 3. Prepare push payload
      const pushPayload: PushPayload = {
        title: body.title,
        body: body.body,
        icon: '/icons/icon-192.png',
        badge: '/icons/badge-72.png',
        tag: `order-${body.orderId || Date.now()}`,
        data: {
          url: body.orderId ? `/orders/${body.orderId}` : '/orders',
          orderId: body.orderId,
          type: body.type,
          ...body.data,
        },
      };

      // 4. Send push to backend which will handle the actual push delivery
      let sent = 0;
      let failed = 0;

      for (const subscription of subscriptions) {
        try {
          await networkLayer.post<ApiResponse<any>>(
            '/push-subscriptions/send',
            {
              subscription: {
                endpoint: subscription.endpoint,
                keys: {
                  p256dh: subscription.p256dh,
                  auth: subscription.auth,
                },
              },
              payload: pushPayload,
            }
          );
          sent++;
        } catch (error) {
          failed++;
        }
      }

      return NextResponse.json({
        code: 200,
        status: 200,
        message: `تم إرسال الإشعار: ${sent} نجح، ${failed} فشل`,
        errors: null,
        data: { sent, failed },
      });
    } catch (error) {
      // Still return success since notification was saved
      return NextResponse.json({
        code: 200,
        status: 200,
        message: 'تم حفظ الإشعار',
        errors: null,
        data: { sent: 0, failed: 0 },
      });
    }
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

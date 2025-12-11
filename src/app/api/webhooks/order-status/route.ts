import { NextRequest, NextResponse } from 'next/server';
import { NetworkLayer } from '@/network';
import type { ApiResponse } from '@/lib/types/response';
import { 
  OrderStatusWebhookPayload, 
  STATUS_NOTIFICATION_MAP, 
  STATUS_MESSAGES,
  STATUS_TO_NOTIFICATION_TYPE,
  PushPayload 
} from '@/lib/services/notifications/types';

/**
 * POST /api/webhooks/order-status
 * Webhook handler for order status changes
 * 
 * Called by Supabase when order status changes
 * Sends push notifications to relevant users based on the new status
 * 
 * Security:
 * - Validates webhook secret
 * - Server-side only processing
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ notified: number } | null>>> {
  try {
    // Validate webhook secret
    const webhookSecret = request.headers.get('X-Webhook-Secret');
    if (webhookSecret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json(
        {
          code: 401,
          status: 401,
          message: 'Invalid webhook secret',
          errors: null,
          data: null,
        },
        { status: 401 }
      );
    }

    // Parse webhook payload
    const payload: OrderStatusWebhookPayload = await request.json();

    // Only process UPDATE events
    if (payload.type !== 'UPDATE') {
      return NextResponse.json({
        code: 200,
        status: 200,
        message: 'Skipped - not an update event',
        errors: null,
        data: { notified: 0 },
      });
    }

    // Check if status actually changed
    const oldStatus = payload.old_record?.status;
    const newStatus = payload.record.status;

    if (oldStatus === newStatus) {
      return NextResponse.json({
        code: 200,
        status: 200,
        message: 'Skipped - status unchanged',
        errors: null,
        data: { notified: 0 },
      });
    }

    // Get notification targets for this status
    const targets = STATUS_NOTIFICATION_MAP[newStatus];
    if (!targets || (targets.roles.length === 0 && !targets.includeCreator)) {
      return NextResponse.json({
        code: 200,
        status: 200,
        message: 'Skipped - no notification targets',
        errors: null,
        data: { notified: 0 },
      });
    }

    // Create NetworkLayer instance (using service credentials via env)
    const networkLayer = await NetworkLayer.createWithAutoConfig({}, '');

    // Get users to notify
    const usersToNotify: string[] = [];

    // 1. Get users by role
    if (targets.roles.length > 0) {
      for (const role of targets.roles) {
        try {
          const usersResponse = await networkLayer.get<ApiResponse<any[]>>(
            `/users?role=${role}`
          );
          const users = (usersResponse.data as any) || [];
          if (Array.isArray(users)) {
            users.forEach((user: any) => {
              if (user.id && !usersToNotify.includes(user.id)) {
                usersToNotify.push(user.id);
              }
            });
          }
        } catch (error) {
          // Error fetching users for role
        }
      }
    }

    // 2. Include creator if needed
    if (targets.includeCreator && payload.record.created_by) {
      if (!usersToNotify.includes(payload.record.created_by)) {
        usersToNotify.push(payload.record.created_by);
      }
    }

    if (usersToNotify.length === 0) {
      return NextResponse.json({
        code: 200,
        status: 200,
        message: 'No users to notify',
        errors: null,
        data: { notified: 0 },
      });
    }

    // Prepare notification content
    const statusMessage = STATUS_MESSAGES[newStatus] || `تم تحديث حالة الطلب إلى: ${newStatus}`;
    const orderTitle = payload.record.title || `طلب رقم ${payload.record.id.slice(0, 8)}`;
    const notificationType = STATUS_TO_NOTIFICATION_TYPE[newStatus] || 'system';

    // Send notifications to each user
    let notifiedCount = 0;

    for (const userId of usersToNotify) {
      try {
        // 1. Save notification to database
        await networkLayer.post<ApiResponse<any>>('/notifications', {
          user_id: userId,
          order_id: payload.record.id,
          title: orderTitle,
          body: statusMessage,
          type: notificationType,
          data: {
            orderId: payload.record.id,
            oldStatus,
            newStatus,
            actionUrl: `/orders/${payload.record.id}`,
          },
          is_read: false,
        });

        // 2. Get user's push subscriptions
        try {
          const subscriptionsResponse = await networkLayer.get<ApiResponse<any[]>>(
            `/push-subscriptions?user_id=${userId}`
          );

          const subscriptions = (subscriptionsResponse.data as any) || [];

          if (Array.isArray(subscriptions) && subscriptions.length > 0) {
            // 3. Send push notification to each subscription
            const pushPayload: PushPayload = {
              title: orderTitle,
              body: statusMessage,
              icon: '/icons/icon-192.png',
              badge: '/icons/badge-72.png',
              tag: `order-${payload.record.id}`,
              data: {
                url: `/orders/${payload.record.id}`,
                orderId: payload.record.id,
                type: notificationType,
              },
            };

            for (const subscription of subscriptions) {
              try {
                await networkLayer.post<ApiResponse<any>>('/push-subscriptions/send', {
                  subscription: {
                    endpoint: subscription.endpoint,
                    keys: {
                      p256dh: subscription.p256dh,
                      auth: subscription.auth,
                    },
                  },
                  payload: pushPayload,
                });
              } catch (error) {
                // Error sending push notification
              }
            }
          }
        } catch (error) {
          // Error getting subscriptions
        }

        notifiedCount++;
      } catch (error) {
        // Error notifying user
      }
    }

    return NextResponse.json({
      code: 200,
      status: 200,
      message: `تم إرسال الإشعارات إلى ${notifiedCount} مستخدم`,
      errors: null,
      data: { notified: notifiedCount },
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

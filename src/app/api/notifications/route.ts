import { NextRequest, NextResponse } from 'next/server';
import { NetworkLayer } from '@/network';
import type { ApiResponse } from '@/lib/types/response';
import { COOKIE_TOKEN } from '@/lib/cookies';
import type { 
  Notification, 
  NotificationsListResponse, 
  MarkNotificationsRequest, 
  DeleteNotificationsRequest 
} from '@/lib/services/notifications/types';

/**
 * GET /api/notifications
 * Get user's notifications list
 * 
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 20)
 * - unreadOnly: boolean (default: false)
 * 
 * Security: Uses cookies for auth, returns only user's own notifications
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<NotificationsListResponse | null>>> {
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
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const projectSource = searchParams.get('project_source'); // 'orders' | 'projects'

    // Create NetworkLayer instance with cookies
    const cookieHeader = request.headers.get('cookie') || '';
    const networkLayer = await NetworkLayer.createWithAutoConfig({}, cookieHeader);

    // Build query string
    let query = `page=${page}&limit=${limit}`;
    if (unreadOnly) {
      query += '&is_read=false';
    }
    if (projectSource) {
      query += `&project_source=${projectSource}`;
    }

    // Fetch notifications from backend
    try {
      const response = await networkLayer.get<any>(`/notifications?${query}`);

      // Backend response format: { code: 0, data: { data: [], total, unread_count } }
      const backendResponse = response.data;
      
      // Check if backend returned success (code: 0)
      if (backendResponse?.code === 0 && backendResponse?.data) {
        const responseData = backendResponse.data;
        return NextResponse.json({
          code: 200,
          status: 200,
          message: 'Success',
          errors: null,
          data: {
            notifications: responseData?.data || [],
            unreadCount: responseData?.unread_count || 0,
            total: responseData?.total || 0,
            page,
            limit,
          },
        });
      }
      
      // Backend returned error
      return NextResponse.json({
        code: 200,
        status: 200,
        message: 'Success',
        errors: null,
        data: {
          notifications: [],
          unreadCount: 0,
          total: 0,
          page,
          limit,
        },
      });
    } catch (error) {
      // Return empty list if fetch fails
      return NextResponse.json({
        code: 200,
        status: 200,
        message: 'Success',
        errors: null,
        data: {
          notifications: [],
          unreadCount: 0,
          total: 0,
          page,
          limit,
        },
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

/**
 * PATCH /api/notifications
 * Mark notifications as read
 * 
 * Request body:
 * {
 *   notificationIds?: string[],  // Specific IDs to mark
 *   markAll?: boolean            // Mark all as read
 * }
 */
export async function PATCH(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ updated: number } | null>>> {
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
    const body: MarkNotificationsRequest = await request.json();

    if (!body.markAll && (!body.notificationIds || body.notificationIds.length === 0)) {
      return NextResponse.json(
        {
          code: 400,
          status: 400,
          message: 'يرجى تحديد الإشعارات أو اختيار تحديد الكل',
          errors: null,
          data: null,
        },
        { status: 400 }
      );
    }

    // Create NetworkLayer instance with cookies
    const cookieHeader = request.headers.get('cookie') || '';
    const networkLayer = await NetworkLayer.createWithAutoConfig({}, cookieHeader);

    // Update notifications
    const updateData: any = {
      is_read: true,
    };

    if (body.markAll) {
      updateData.mark_all = true;
    } else {
      updateData.notification_ids = body.notificationIds;
    }

    await networkLayer.post<ApiResponse<{ updated: number }>>(
      '/notifications-mark-read',
      updateData
    );

    return NextResponse.json({
      code: 200,
      status: 200,
      message: 'تم تحديث الإشعارات بنجاح',
      errors: null,
      data: { updated: body.notificationIds?.length || 0 },
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
 * DELETE /api/notifications
 * Delete notifications
 * 
 * Request body:
 * {
 *   notificationIds?: string[],  // Specific IDs to delete
 *   deleteAll?: boolean          // Delete all notifications
 * }
 */
export async function DELETE(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ deleted: number } | null>>> {
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
    const body: DeleteNotificationsRequest = await request.json();

    if (!body.deleteAll && (!body.notificationIds || body.notificationIds.length === 0)) {
      return NextResponse.json(
        {
          code: 400,
          status: 400,
          message: 'يرجى تحديد الإشعارات أو اختيار حذف الكل',
          errors: null,
          data: null,
        },
        { status: 400 }
      );
    }

    // Create NetworkLayer instance with cookies
    const cookieHeader = request.headers.get('cookie') || '';
    const networkLayer = await NetworkLayer.createWithAutoConfig({}, cookieHeader);

    // Delete notifications
    const deleteData: any = {};

    if (body.deleteAll) {
      deleteData.delete_all = true;
    } else {
      deleteData.notification_ids = body.notificationIds;
    }

    // Delete notifications - use DELETE method to backend
    await networkLayer.delete<ApiResponse<{ deleted: number }>>(
      '/notifications',
      { body: deleteData }
    );

    return NextResponse.json({
      code: 200,
      status: 200,
      message: 'تم حذف الإشعارات بنجاح',
      errors: null,
      data: { deleted: body.notificationIds?.length || 0 },
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

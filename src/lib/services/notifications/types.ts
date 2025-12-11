/**
 * Notification System Types
 * نظام الإشعارات - أنواع البيانات
 * 
 * Based on PWA Push Notifications Guide
 */

// ==========================================
// Push Subscription Types
// ==========================================

/**
 * Push subscription data sent from browser
 */
export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Device information for subscription
 */
export interface DeviceInfo {
  userAgent?: string;
  platform?: string;
  language?: string;
  screenWidth?: number;
  screenHeight?: number;
}

/**
 * Push subscription stored in database
 */
export interface StoredPushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  device_info: DeviceInfo;
  created_at: string;
  updated_at: string;
}

/**
 * Subscribe request body
 */
export interface SubscribeRequest {
  subscription: PushSubscriptionData;
  deviceInfo?: DeviceInfo;
}

// ==========================================
// Notification Types
// ==========================================

/**
 * Notification types - matches backend
 */
export type NotificationType = 
  | 'order_created'        // طلب جديد - New order created
  | 'engineering_review'   // تمت المراجعة الهندسية
  | 'admin_review'         // مراجعة الطلب من الإدارة
  | 'owner_approved'       // تمت الموافقة من الادارة
  | 'owner_rejected'       // تم رفض الطلب
  | 'purchasing_started'   // بدأت عملية الشراء
  | 'order_closed'         // تم إغلاق الطلب
  | 'item_status_changed'  // تم تحديث حالة البند
  | 'system';              // نظام

/**
 * Notification stored in database
 */
export interface Notification {
  id: string;
  user_id: string;
  order_id: string | null;
  title: string;
  body: string;
  type: NotificationType;
  data: NotificationData;
  is_read: boolean;
  created_at: string;
}

/**
 * Additional notification data
 */
export interface NotificationData {
  orderId?: string;
  orderNumber?: string;
  oldStatus?: string;
  newStatus?: string;
  actionUrl?: string;
  [key: string]: any;
}

/**
 * Push notification payload sent to browser
 */
export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    url?: string;
    orderId?: string;
    type?: NotificationType;
    [key: string]: any;
  };
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

// ==========================================
// API Request/Response Types
// ==========================================

/**
 * Send notification request
 */
export interface SendNotificationRequest {
  userId: string;
  title: string;
  body: string;
  type?: NotificationType;
  orderId?: string;
  data?: NotificationData;
}

/**
 * Notifications list response
 */
export interface NotificationsListResponse {
  notifications: Notification[];
  unreadCount: number;
  total: number;
  page: number;
  limit: number;
}

/**
 * Mark notifications request
 */
export interface MarkNotificationsRequest {
  notificationIds?: string[];
  markAll?: boolean;
}

/**
 * Delete notifications request
 */
export interface DeleteNotificationsRequest {
  notificationIds?: string[];
  deleteAll?: boolean;
}

// ==========================================
// Webhook Types
// ==========================================

/**
 * Order status change webhook payload
 */
export interface OrderStatusWebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record: {
    id: string;
    status: string;
    title?: string;
    created_by?: string;
    [key: string]: any;
  };
  old_record?: {
    id: string;
    status: string;
    [key: string]: any;
  };
}

/**
 * Users to notify based on status change
 */
export interface NotificationTargets {
  roles: string[];
  includeCreator: boolean;
}

// ==========================================
// Hook Return Types
// ==========================================

/**
 * usePushNotifications hook return type
 */
export interface UsePushNotificationsReturn {
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  permission: NotificationPermission | null;
  error: string | null;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  requestPermission: () => Promise<NotificationPermission>;
}

/**
 * useNotifications hook return type
 */
export interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  markAsRead: (ids?: string[]) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  deleteNotification: (id: string) => Promise<boolean>;
  deleteAllNotifications: () => Promise<boolean>;
}

// ==========================================
// Status to Role Mapping
// ==========================================

/**
 * Maps order statuses to roles that should be notified
 * Based on the order workflow:
 * 
 * 1. Site creates order → Notify Engineering only
 * 2. Engineering updates status → Notify Site + Admin
 * 3. Admin updates status → Notify Site + Engineering  
 * 4. Admin approves → Notify Purchasing + Site + Engineering
 * 5. Admin rejects → Notify Site + Engineering (NOT Purchasing)
 * 6. Purchasing updates → Notify ALL roles
 */
export const STATUS_NOTIFICATION_MAP: Record<string, NotificationTargets> = {
  // Order created by Site - notify Engineering only
  'تم اجراء الطلب': {
    roles: ['engineering'],
    includeCreator: false,
  },
  // Engineering completed review - notify Site (creator) + Admin
  'تمت المراجعة الهندسية': {
    roles: ['admin', 'sub-admin'],
    includeCreator: true, // Site (the creator)
  },
  // Under admin review - notify Site (creator) + Engineering
  'مراجعة الطلب من الادارة': {
    roles: ['engineering'],
    includeCreator: true, // Site (the creator)
  },
  // Admin approved - notify Purchasing + Site + Engineering
  'تمت الموافقة من الادارة': {
    roles: ['purchasing', 'engineering'],
    includeCreator: true, // Site (the creator)
  },
  // Admin rejected - notify Site + Engineering (NOT Purchasing)
  'تم الرفض من الادارة': {
    roles: ['engineering'],
    includeCreator: true, // Site (the creator)
  },
  // Purchasing in progress - notify ALL roles
  'جاري الان عملية الشراء': {
    roles: ['admin', 'sub-admin', 'engineering', 'site'],
    includeCreator: true,
  },
  // Order closed by Purchasing - notify ALL roles
  'تم غلق طلب الشراء': {
    roles: ['admin', 'sub-admin', 'engineering', 'site'],
    includeCreator: true,
  },
};

/**
 * Status messages in Arabic
 */
export const STATUS_MESSAGES: Record<string, string> = {
  'تم اجراء الطلب': 'تم إنشاء طلب شراء جديد',
  'تمت المراجعة الهندسية': 'تمت المراجعة الهندسية للطلب',
  'مراجعة الطلب من الادارة': 'الطلب في انتظار مراجعة الإدارة',
  'تمت الموافقة من الادارة': 'تمت الموافقة على طلب الشراء',
  'تم الرفض من الادارة': 'تم رفض طلب الشراء',
  'جاري الان عملية الشراء': 'جاري تنفيذ عملية الشراء',
  'تم غلق طلب الشراء': 'تم إغلاق طلب الشراء بنجاح',
};

/**
 * Maps order status to notification type
 */
export const STATUS_TO_NOTIFICATION_TYPE: Record<string, NotificationType> = {
  'تم اجراء الطلب': 'order_created',
  'تمت المراجعة الهندسية': 'engineering_review',
  'مراجعة الطلب من الادارة': 'admin_review',
  'تمت الموافقة من الادارة': 'owner_approved',
  'تم الرفض من الادارة': 'owner_rejected',
  'جاري الان عملية الشراء': 'purchasing_started',
  'تم غلق طلب الشراء': 'order_closed',
};

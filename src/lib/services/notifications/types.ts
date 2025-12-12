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
 * Order notification types enum - matches backend
 */
export enum OrderNotificationType {
  OrderCreated = 'order_created',           // طلب جديد - New order created
  EngineeringReview = 'engineering_review', // تمت المراجعة الهندسية
  AdminReview = 'admin_review',             // مراجعة الطلب من الإدارة
  OwnerApproved = 'owner_approved',         // تمت الموافقة من الادارة
  OwnerRejected = 'owner_rejected',         // تم رفض الطلب
  ProjectsStarted = 'Projects_started', // بدأت عملية الشراء
  OrderClosed = 'order_closed',             // تم إغلاق الطلب
  ItemStatusChanged = 'item_status_changed', // تم تحديث حالة البند
}

/**
 * Project notification types enum - matches backend
 */
export enum ProjectNotificationType {
  ProjectCreated = 'project_created',     // مشروع جديد - New project created
  ProjectCompleted = 'project_completed', // تم إكمال المشروع - Project completed
  ProjectOverdue = 'project_overdue',     // مشروع متأخر - Project overdue
}

/**
 * All notification types
 */
export type NotificationType = 
  | OrderNotificationType
  | ProjectNotificationType
  | 'system';              // نظام

/**
 * Project source for filtering notifications
 */
export type ProjectSource = 'orders' | 'projects';

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
  project_source?: ProjectSource;
  created_at: string;
}

/**
 * Additional notification data
 */
export interface NotificationData {
  // Order-related data
  orderId?: string;
  orderNumber?: string;
  oldStatus?: string;
  newStatus?: string;
  // Project-related data
  projectId?: string;
  projectName?: string;
  projectType?: 'siteProject' | 'designProject';
  // Common data
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
 * 4. Admin approves → Notify Projects + Site + Engineering
 * 5. Admin rejects → Notify Site + Engineering (NOT Projects)
 * 6. Projects updates → Notify ALL roles
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
  // Admin approved - notify Projects + Site + Engineering
  'تمت الموافقة من الادارة': {
    roles: ['Projects', 'engineering'],
    includeCreator: true, // Site (the creator)
  },
  // Admin rejected - notify Site + Engineering (NOT Projects)
  'تم الرفض من الادارة': {
    roles: ['engineering'],
    includeCreator: true, // Site (the creator)
  },
  // Projects in progress - notify ALL roles
  'جاري الان عملية الشراء': {
    roles: ['admin', 'sub-admin', 'engineering', 'site'],
    includeCreator: true,
  },
  // Order closed by Projects - notify ALL roles
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
  'تم اجراء الطلب': OrderNotificationType.OrderCreated,
  'تمت المراجعة الهندسية': OrderNotificationType.EngineeringReview,
  'مراجعة الطلب من الادارة': OrderNotificationType.AdminReview,
  'تمت الموافقة من الادارة': OrderNotificationType.OwnerApproved,
  'تم الرفض من الادارة': OrderNotificationType.OwnerRejected,
  'جاري الان عملية الشراء': OrderNotificationType.ProjectsStarted,
  'تم غلق طلب الشراء': OrderNotificationType.OrderClosed,
};

// ==========================================
// Project Notification Constants
// ==========================================

/**
 * Project notification messages - use translation keys
 * Keys: projects.notifications.projectCreatedBody, etc.
 */
export const PROJECT_NOTIFICATION_MESSAGE_KEYS: Record<ProjectNotificationType, string> = {
  [ProjectNotificationType.ProjectCreated]: 'projects.notifications.projectCreatedBody',
  [ProjectNotificationType.ProjectCompleted]: 'projects.notifications.projectCompletedBody',
  [ProjectNotificationType.ProjectOverdue]: 'projects.notifications.projectOverdueBody',
};

/**
 * Project notification titles - use translation keys
 * Keys: projects.notifications.projectCreated, etc.
 */
export const PROJECT_NOTIFICATION_TITLE_KEYS: Record<ProjectNotificationType, string> = {
  [ProjectNotificationType.ProjectCreated]: 'projects.notifications.projectCreated',
  [ProjectNotificationType.ProjectCompleted]: 'projects.notifications.projectCompleted',
  [ProjectNotificationType.ProjectOverdue]: 'projects.notifications.projectOverdue',
};

/**
 * Project notification targets
 * - project_created: When project-engineer creates a project → notify admin/sub-admin
 * - project_completed: When all steps finalized → notify admin/sub-admin  
 * - project_overdue: When project passes duration_to → notify admin/sub-admin
 */
export const PROJECT_NOTIFICATION_TARGETS: Record<ProjectNotificationType, NotificationTargets> = {
  [ProjectNotificationType.ProjectCreated]: {
    roles: ['admin', 'sub-admin'],
    includeCreator: false,
  },
  [ProjectNotificationType.ProjectCompleted]: {
    roles: ['admin', 'sub-admin'],
    includeCreator: false,
  },
  [ProjectNotificationType.ProjectOverdue]: {
    roles: ['admin', 'sub-admin'],
    includeCreator: false,
  },
};

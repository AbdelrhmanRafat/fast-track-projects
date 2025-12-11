// ============================================
// Order Creation Types
// ============================================

export interface CreateOrderItemForm {
  title: string;
  description?: string;
}

/**
 * Create order request body
 * Allowed Roles: Admin, Sub-Admin, Engineering, Site
 */
export interface CreateOrderForm {
  title: string;
  order_notes?: string;
  items: CreateOrderItemForm[];
}

// ============================================
// Order Status Enum
// ============================================

/**
 * Order Status Workflow:
 * 1. تم اجراء الطلب (Order Created) - Initial status when order is created
 * 2. تمت المراجعة الهندسية (Engineering Reviewed) - After Engineering completes review
 * 3. مراجعة الطلب من الادارة (Under Admin Review) - Auto-set when Admin/Sub-Admin views order
 * 4. تمت الموافقة من الادارة (Owner Approved) - Admin/Sub-Admin approves
 * 5. تم الرفض من الادارة (Owner Rejected) - Admin/Sub-Admin rejects (END)
 * 6. جاري الان عملية الشراء (Purchasing In Progress) - Purchasing starts work
 * 7. تم غلق طلب الشراء (Order Closed) - Purchasing completes (END)
 */
export enum OrderStatus {
  /** تم اجراء الطلب - Order Created (Initial status) */
  ORDER_CREATED = "تم اجراء الطلب",
  /** تمت المراجعة الهندسية - Engineering Reviewed */
  ENGINEERING_REVIEWED = "تمت المراجعة الهندسية",
  /** مراجعة الطلب من الادارة - Under Admin Review */
  UNDER_ADMIN_REVIEW = "مراجعة الطلب من الادارة",
  /** تمت الموافقة من الادارة - Owner Approved */
  OWNER_APPROVED = "تمت الموافقة من الادارة",
  /** تم الرفض من الادارة - Owner Rejected (Final) */
  OWNER_REJECTED = "تم الرفض من الادارة",
  /** جاري الان عملية الشراء - Purchasing In Progress */
  PURCHASING_IN_PROGRESS = "جاري الان عملية الشراء",
  /** تم غلق طلب الشراء - Order Closed (Final) */
  ORDER_CLOSED = "تم غلق طلب الشراء",
}

// ============================================
// Item Purchase Status Enum
// ============================================

/**
 * Item Purchase Status
 * Updated by: Admin, Sub-Admin (full access), Purchasing
 * 
 * Admin/Sub-Admin: Can update ANY item regardless of order status
 * Purchasing: Can update only when order is in "تمت الموافقة من الادارة" or "جاري الان عملية الشراء"
 * 
 * Values:
 * - null = معلق (Pending) - Default, not set
 * - 'تم الشراء' = Purchased
 * - 'لم يتم الشراء' = Not Purchased
 */
export enum ItemPurchaseStatus {
  /** تم الشراء - Purchased */
  PURCHASED = "تم الشراء",
  /** لم يتم الشراء - Not Purchased */
  NOT_PURCHASED = "لم يتم الشراء",
}

/**
 * Item Purchase Status Type (including null for Pending)
 * null represents "معلق" (Pending) - the default state
 */
export type ItemPurchaseStatusType = ItemPurchaseStatus | null;

// ============================================
// Data Models
// ============================================

export interface Attachment {
  id: string;
  order_item_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  public_url: string;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  title: string;
  description: string | null;
  purchase_status: ItemPurchaseStatus | null;  // null = معلق (Pending)
  approved_by_admin: boolean | null;
  item_notes: string | null;
  attachments: Attachment[];
  created_at: string;
}

export interface Order {
  id: string;
  title: string;
  order_notes: string | null;
  purchasing_notes: string | null;
  status: OrderStatus | string;
  admin_checked: boolean | null;
  rejection_reason: string | null;
  created_by: string;
  created_by_name: string | null;
  updated_by: string | null;
  updated_by_name: string | null;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

// ============================================
// Pagination Types
// ============================================

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface OrdersResponse {
  orders: Order[];
  pagination: PaginationInfo;
}

export interface GetOrdersParams {
  page?: number;
  limit?: number;
}

// ============================================
// Update Order Status Types
// ============================================

/**
 * Update order status request body
 * 
 * Status Transitions by Role:
 * - Engineering: تم اجراء الطلب → تمت المراجعة الهندسية
 * - Admin/Sub-Admin (auto): تمت المراجعة الهندسية → مراجعة الطلب من الادارة (when viewing)
 * - Admin/Sub-Admin: مراجعة الطلب من الادارة → تمت الموافقة من الادارة
 * - Admin/Sub-Admin: مراجعة الطلب من الادارة → تم الرفض من الادارة (requires rejection_reason)
 * - Purchasing: تمت الموافقة من الادارة → جاري الان عملية الشراء
 * - Purchasing: جاري الان عملية الشراء → تم غلق طلب الشراء (optional purchasing_notes)
 */
export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  /** Required when rejecting order (Admin/Sub-Admin) */
  rejection_reason?: string;
  /** Optional when closing order (Purchasing) */
  purchasing_notes?: string;
}

// ============================================
// Update Item Status Types
// ============================================

/**
 * Update individual item purchase status
 * 
 * Admin/Sub-Admin: FULL ACCESS - Can update ANY item regardless of order status
 * Purchasing: Can update only when order is in "تمت الموافقة من الادارة" or "جاري الان عملية الشراء"
 * 
 * purchase_status values:
 * - null = معلق (Pending)
 * - 'تم الشراء' = Purchased
 * - 'لم يتم الشراء' = Not Purchased
 */
export interface UpdateItemStatusRequest {
  purchase_status: ItemPurchaseStatus | null;
  /** Maps to item_notes in API */
  notes?: string;
}

// ============================================
// Update Order Types
// ============================================

/**
 * Update order request body
 * 
 * Admin/Sub-Admin: FULL ACCESS - Can edit ANY order in ANY status
 * Engineering/Site: Can edit only when order status is "تم اجراء الطلب"
 */
export interface UpdateOrderRequest {
  title?: string;
  order_notes?: string;
  items?: UpdateOrderItem[];
}

export interface UpdateOrderItem {
  /** If provided, update existing item. If not provided, create new item */
  id?: string;
  title: string;
  description?: string;
  /** If true, delete this item (requires id) */
  delete?: boolean;
}

// ============================================
// Attachment Upload Response Types
// ============================================

export interface UploadedAttachment {
  id: string;
  file_name: string;
  file_path: string;
  public_url: string;
}

export interface UploadAttachmentsResponse {
  item_id: string;
  uploaded: UploadedAttachment[];
  uploaded_count: number;
  errors: string | null;
}

// ============================================
// Admin Item Approval Types
// ============================================

/**
 * Item approval payload for a single item
 * Used by Admin/Sub-Admin to approve/reject individual items
 */
export interface ItemApprovalPayload {
  item_id: string;
  /** true=approved, false=rejected, null=pending */
  approved: boolean | null;
}

/**
 * Request body for updating admin checked status on items
 * Endpoint: PUT /update-admin-checked?id={orderId}
 * Allowed Roles: Admin, Sub-Admin
 * Required Status: مراجعة الطلب من الادارة (Under Admin Review)
 */
export interface UpdateAdminCheckedRequest {
  items: ItemApprovalPayload[];
}

/**
 * Response from update-admin-checked endpoint
 */
export interface UpdateAdminCheckedResponse {
  message: string;
  order: {
    id: string;
    title: string;
    admin_checked: boolean;
    updated_at: string;
  };
  updated_items: {
    id: string;
    title: string;
    approved_by_admin: boolean | null;
  }[];
}
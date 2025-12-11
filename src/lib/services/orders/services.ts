import networkClient from '@/lib/networkClient';
import { NetworkLayer } from '@/network';
import type { ApiResponse } from '@/lib/types/response';
import { triggerBadgeRefresh } from '@/components/providers/BadgeProvider';
import {
  OrderStatus,
  type CreateOrderForm,
  type Order,
  type OrdersResponse,
  type GetOrdersParams,
  type UpdateOrderStatusRequest,
  type UpdateItemStatusRequest,
  type UpdateOrderRequest,
  type UploadAttachmentsResponse,
  type ItemApprovalPayload,
  type UpdateAdminCheckedResponse,
} from './types';

// ============================================
// Server-Side GET Requests (NetworkLayer)
// ============================================

/**
 * Get all orders - Server Side
 * Allowed Roles: Admin, Sub-Admin only
 * Returns paginated list of ALL orders regardless of status
 * @param params - Pagination parameters (page, limit)
 * @returns Promise with ApiResponse containing orders and pagination
 */
export async function getAllOrders(
  params: GetOrdersParams = {}
): Promise<ApiResponse<OrdersResponse> | null> {
  try {
    const { page = 1, limit = 10 } = params;
    const api = await NetworkLayer.createWithAutoConfig();
    const res = await api.get<ApiResponse<OrdersResponse>>(
      `/get-orders?page=${page}&limit=${limit}`
    );
    return res.data;
  } catch (error: any) {
    return null;
  }
}

/**
 * Get current orders (non-finalized) - Server Side
 * 
 * Visibility Rules by Role:
 * - Admin/Sub-Admin: Orders in 'تمت المراجعة الهندسية' or 'مراجعة الطلب من الادارة' status
 * - Engineering: Orders in 'تم اجراء الطلب' status (pending engineering review)
 * - Purchasing: Orders in 'تمت الموافقة من الادارة' or 'جاري الان عملية الشراء' status
 * - Site: Only their own orders in 'تم اجراء الطلب' status
 * 
 * @param params - Pagination parameters (page, limit)
 * @returns Promise with ApiResponse containing orders and pagination
 */
export async function getCurrentOrders(
  params: GetOrdersParams = {}
): Promise<ApiResponse<OrdersResponse> | null> {
  try {
    const { page = 1, limit = 10 } = params;
    const api = await NetworkLayer.createWithAutoConfig();
    const res = await api.get<ApiResponse<OrdersResponse>>(
      `/get-current-orders?page=${page}&limit=${limit}`
    );
    return res.data;
  } catch (error: any) {
    return null;
  }
}

/**
 * Get a specific order by ID - Server Side
 * 
 * Access Permissions:
 * - Admin & Sub-Admin: Can access orders in ALL statuses
 * - Engineering: Can access orders in ALL statuses
 * - Purchasing: Can ONLY access orders starting from status 'تمت الموافقة من الادارة'
 * - Site: Can only access their own orders
 * 
 * Note: When Admin/Sub-Admin views an order with status 'تمت المراجعة الهندسية',
 * it automatically updates to 'مراجعة الطلب من الادارة'
 * 
 * @param orderId - The order UUID
 * @returns Promise with ApiResponse containing the order details
 */
export async function getOrderById(
  orderId: string
): Promise<ApiResponse<Order> | null> {
  try {
    const api = await NetworkLayer.createWithAutoConfig();
    const res = await api.get<ApiResponse<Order>>(
      `/get-specific-order?id=${orderId}`
    );
    return res.data;
  } catch (error: any) {
    return null;
  }
}

// ============================================
// Client-Side POST/PUT/DELETE Requests (networkClient)
// ============================================

/**
 * Create a new order - Client Side
 * Allowed Roles: Admin, Sub-Admin, Engineering, Site
 * Initial status will be: 'تم اجراء الطلب' (Order Created)
 * @param orderData - Order data with title, notes, and items
 * @returns Promise with ApiResponse or null on error
 */
export async function createOrder(
  orderData: CreateOrderForm
): Promise<ApiResponse<Order> | null> {
  try {
    const payload = {
      title: orderData.title,
      order_notes: orderData.order_notes,
      items: orderData.items.map((item) => ({
        title: item.title,
        description: item.description || '',
      })),
    };

    const response = await networkClient.post('/api/orders/create', payload, {
      showSuccess: false
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to create order');
    }

    // Trigger badge refresh after successful order creation
    triggerBadgeRefresh();

    return result as ApiResponse<any>;
  } catch (error: any) {
    return null;
  }
}

// ============================================
// Client-Side PUT Requests (networkClient)
// ============================================

/**
 * Update order status - Client Side
 * 
 * Status Transitions by Role:
 * - Engineering: 'تم اجراء الطلب' → 'تمت المراجعة الهندسية'
 * - Admin/Sub-Admin: 'مراجعة الطلب من الادارة' → 'تمت الموافقة من الادارة'
 * - Admin/Sub-Admin: 'مراجعة الطلب من الادارة' → 'تم الرفض من الادارة' (requires rejection_reason)
 * - Purchasing: 'تمت الموافقة من الادارة' → 'جاري الان عملية الشراء'
 * - Purchasing: 'جاري الان عملية الشراء' → 'تم غلق طلب الشراء' (optional purchasing_notes)
 * 
 * @param orderId - The order UUID
 * @param data - Status update data
 * @returns Promise with ApiResponse or null on error
 */
export async function updateOrderStatus(
  orderId: string,
  data: UpdateOrderStatusRequest
): Promise<ApiResponse<Order> | null> {
  try {
    const response = await networkClient.put(
      `/api/orders/${orderId}/status`,
      data
    );
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update order status');
    }

    // Trigger badge refresh after successful status update
    triggerBadgeRefresh();

    return result as ApiResponse<Order>;
  } catch (error: any) {
    return null;
  }
}

/**
 * Update item purchase status - Client Side
 * Allowed Roles: Admin, Sub-Admin, Purchasing
 * 
 * Admin/Sub-Admin: FULL ACCESS - Can update ANY item regardless of order status
 * Purchasing: Can update only when order is in 'تمت الموافقة من الادارة' or 'جاري الان عملية الشراء'
 * 
 * Valid purchase_status values:
 * - null (معلق/Pending) - Default
 * - 'تم الشراء' (Purchased)
 * - 'لم يتم الشراء' (Not Purchased)
 * 
 * @param itemId - The order item UUID
 * @param data - Purchase status update data (purchase_status, item_notes)
 * @returns Promise with ApiResponse or null on error
 */
export async function updateItemStatus(
  itemId: string,
  data: UpdateItemStatusRequest
): Promise<ApiResponse<any> | null> {
  try {
    // Map to API expected field names
    const payload = {
      purchase_status: data.purchase_status,
      item_notes: data.notes,
    };
    
    const response = await networkClient.put(
      `/api/orders/items/${itemId}/status`,
      payload
    );
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update item status');
    }

    // Trigger badge refresh after successful item status update
    triggerBadgeRefresh();

    return result as ApiResponse<any>;
  } catch (error: any) {
    return null;
  }
}

/**
 * Update order - Client Side
 * Allowed Roles: Admin, Sub-Admin
 * Restriction: Order can ONLY be edited when status is 'مراجعة الطلب من الادارة'
 * 
 * Items array behavior:
 * - With id + title/description: Update existing item
 * - With id + delete: true: Delete the item
 * - Without id (title only): Create new item
 * 
 * @param orderId - The order UUID
 * @param data - Order update data (title, notes, items)
 * @returns Promise with ApiResponse or null on error
 */
export async function updateOrder(
  orderId: string,
  data: UpdateOrderRequest
): Promise<ApiResponse<Order> | null> {
  try {
    const response = await networkClient.put(
      `/api/orders/${orderId}`,
      data,
      {
        showSuccess: false
      }
    );
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update order');
    }

    // Trigger badge refresh after successful order update
    triggerBadgeRefresh();

    return result as ApiResponse<Order>;
  } catch (error: any) {
    return null;
  }
}

// ============================================
// Client-Side DELETE Requests (networkClient)
// ============================================

/**
 * Delete order - Client Side
 * Allowed Roles: Admin, Sub-Admin
 * @param orderId - The order UUID
 * @returns Promise with ApiResponse or null on error
 */
export async function deleteOrder(
  orderId: string
): Promise<ApiResponse<any> | null> {
  try {
    const response = await networkClient.delete(`/api/orders/${orderId}`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to delete order');
    }

    // Trigger badge refresh after successful order deletion
    triggerBadgeRefresh();

    return result as ApiResponse<any>;
  } catch (error: any) {
    return null;
  }
}

// ============================================
// Attachment Services (Client-Side)
// ============================================

/**
 * Upload attachments for a specific order item - Client Side
 * Allowed Roles: Admin, Sub-Admin, Engineering
 * 
 * Limits:
 * - Max 5 attachments per item
 * - Allowed types: JPG, JPEG, PNG, PDF
 * 
 * @param itemId - The order item UUID
 * @param files - Array of files to upload
 * @returns Promise with ApiResponse containing uploaded attachments info
 */
export async function uploadItemAttachments(
  itemId: string,
  files: File[]
): Promise<ApiResponse<UploadAttachmentsResponse> | null> {
  try {
    const formData = new FormData();

    // Append each file with indexed keys: attachment[0], attachment[1], etc.
    files.forEach((file, index) => {
      formData.append(`attachment[${index}]`, file);
    });

    const response = await networkClient.post(
      `/api/orders/items/${itemId}/attachments`,
      formData,
      { showSuccess: false }
    );
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to upload attachments');
    }

    return result as ApiResponse<UploadAttachmentsResponse>;
  } catch (error: any) {
    return null;
  }
}

/**
 * Upload attachments for a specific order item (with success message) - Client Side
 * Allowed Roles: Admin, Sub-Admin, Engineering
 * 
 * Limits:
 * - Max 5 attachments per item
 * - Allowed types: JPG, JPEG, PNG, PDF
 * 
 * @param itemId - The order item UUID
 * @param files - Array of files to upload
 * @returns Promise with ApiResponse containing uploaded attachments info
 */
export async function uploadItemAttachmentsEdit(
  itemId: string,
  files: File[]
): Promise<ApiResponse<UploadAttachmentsResponse> | null> {
  try {
    const formData = new FormData();

    // Append each file with indexed keys: attachment[0], attachment[1], etc.
    files.forEach((file, index) => {
      formData.append(`attachment[${index}]`, file);
    });

    const response = await networkClient.post(
      `/api/orders/items/${itemId}/attachments`,
      formData
    );
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to upload attachments');
    }

    return result as ApiResponse<UploadAttachmentsResponse>;
  } catch (error: any) {
    return null;
  }
}

/**
 * Delete a specific attachment - Client Side
 * Allowed Roles: Admin, Sub-Admin, Engineering
 * @param attachmentId - The attachment UUID
 * @returns Promise with ApiResponse or null on error
 */
export async function deleteItemAttachment(
  attachmentId: string
): Promise<ApiResponse<any> | null> {
  try {
    const response = await networkClient.delete(
      `/api/orders/attachments/${attachmentId}`
    );
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to delete attachment');
    }

    return result as ApiResponse<any>;
  } catch (error: any) {
    return null;
  }
}

// ============================================
// Admin Item Approval Services (Client-Side)
// ============================================

/**
 * Update admin checked status for order items - Client Side
 * Allows Admin/Sub-Admin to approve/reject individual items
 * 
 * Allowed Roles: Admin, Sub-Admin
 * Required Order Status: 'مراجعة الطلب من الادارة' (Under Admin Review)
 * 
 * Rules:
 * - For APPROVAL: All items must have a decision (approved !== null)
 * - For REJECTION: Admin can reject any items without updating all
 * 
 * @param orderId - The order UUID
 * @param items - Array of item approval decisions
 * @returns Promise with ApiResponse containing updated items info
 */
export async function updateAdminChecked(
  orderId: string,
  items: ItemApprovalPayload[]
): Promise<ApiResponse<UpdateAdminCheckedResponse> | null> {
  try {
    const response = await networkClient.put(
      `/api/orders/${orderId}/admin-checked`,
      { items }
    );
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update item approval status');
    }

    // Trigger badge refresh after successful item approval update
    triggerBadgeRefresh();

    return result as ApiResponse<UpdateAdminCheckedResponse>;
  } catch (error: any) {
    return null;
  }
}

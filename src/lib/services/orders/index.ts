// Orders Service exports
export {
  // Server-side GET requests
  getAllOrders,
  getCurrentOrders,
  getOrderById,
  // Client-side POST requests
  createOrder,
  // Client-side PUT requests
  updateOrderStatus,
  updateItemStatus,
  updateOrder,
  updateAdminChecked,
  // Client-side DELETE requests
  deleteOrder,
} from './services';

export {
  // Enums
  OrderStatus,
  ItemPurchaseStatus,
  // Types
  type ItemPurchaseStatusType,
  type CreateOrderItemForm,
  type CreateOrderForm,
  type Attachment,
  type OrderItem,
  type Order,
  type PaginationInfo,
  type OrdersResponse,
  type GetOrdersParams,
  // Update types
  type UpdateOrderStatusRequest,
  type UpdateItemStatusRequest,
  type UpdateOrderRequest,
  type UpdateOrderItem,
  // Admin item approval types
  type ItemApprovalPayload,
  type UpdateAdminCheckedRequest,
  type UpdateAdminCheckedResponse,
} from './types';

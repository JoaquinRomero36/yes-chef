export interface CreateOrderRequest {
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  tableNumber: number | null;
  contactName: string | null;
  contactPhone: string | null;
  deliveryAddress: string | null;
  paymentMethod: PaymentMethod | null;
  notes: string | null;
  items: CreateOrderItemRequest[];
}

export type PaymentMethod = 'cash' | 'card' | 'transfer';

export interface CreateOrderItemRequest {
  productId: string;
  quantity: number;
  notes: string | null;
}

export interface OrderResponse {
  id: string;
  orderType: string;
  tableNumber: number | null;
  status: string;
  total: number;
  deliveryFee: number;
  contactName: string | null;
  contactPhone: string | null;
  deliveryAddress: string | null;
  paymentMethod: string | null;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
  items: OrderItemResponse[];
}

export interface OrderItemResponse {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  status: string;
  notes: string | null;
}

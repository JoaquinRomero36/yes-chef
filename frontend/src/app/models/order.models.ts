export interface CreateOrderRequest {
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  tableNumber: number | null;
  contactName: string | null;
  contactPhone: string | null;
  deliveryAddress: string | null;
  notes: string | null;
  items: CreateOrderItemRequest[];
}

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

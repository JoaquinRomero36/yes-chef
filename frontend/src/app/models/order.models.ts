export interface CreateOrderRequest {
  tableNumber: number;
  items: CreateOrderItemRequest[];
  notes: string | null;
}

export interface CreateOrderItemRequest {
  productId: string;
  quantity: number;
  notes: string | null;
}

export interface OrderResponse {
  id: string;
  tableNumber: number;
  status: string;
  total: number;
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

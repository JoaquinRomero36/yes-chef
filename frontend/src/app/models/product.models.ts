export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  categoryId: string;
  categoryName: string;
  imageUrl: string | null;
  isAvailable: boolean;
  isActive: boolean;
}

export interface CreateProductRequest {
  name: string;
  description: string | null;
  price: number;
  categoryId: string;
  imageUrl: string | null;
}

export interface UpdateProductRequest {
  name: string;
  description: string | null;
  price: number;
  categoryId: string;
  imageUrl: string | null;
  isAvailable: boolean;
  isActive: boolean;
}

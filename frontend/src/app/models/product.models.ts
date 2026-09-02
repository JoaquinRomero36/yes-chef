export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  categoryId: string;
  categoryName: string;
  imageUrl: string | null;
  isAvailable: boolean;
  isAvailableForAway: boolean;
  isActive: boolean;
}

export interface CreateProductRequest {
  name: string;
  description: string | null;
  price: number;
  categoryId: string;
  imageUrl: string | null;
  isAvailableForAway?: boolean;
}

export interface UpdateProductRequest {
  name: string;
  description: string | null;
  price: number;
  categoryId: string;
  imageUrl: string | null;
  isAvailable: boolean;
  isAvailableForAway: boolean;
  isActive: boolean;
}

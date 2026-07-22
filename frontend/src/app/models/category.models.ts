export interface Category {
  id: string;
  name: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
}

export interface CreateCategoryRequest {
  name: string;
  description: string | null;
  displayOrder: number;
}

export interface UpdateCategoryRequest {
  name: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
}

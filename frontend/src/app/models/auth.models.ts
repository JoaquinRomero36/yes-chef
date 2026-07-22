export interface AuthResponse {
  token: string;
  email: string;
  username: string;
  role: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  fullName: string | null;
  roleId: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
}

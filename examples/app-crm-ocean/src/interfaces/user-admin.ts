export interface User {
  id: string;
  name: string;
  email: string;
  mobile: string | null;
  role_name: string;
  role_id?: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  is_default: boolean;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  mobile: string;
  password: string;
  role_id: string;
}

export interface CheckEmailExistsPayload {
  email: string;
}

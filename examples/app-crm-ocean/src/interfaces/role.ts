export interface Permission {
  id: number;
  name: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  is_default: boolean;
  permissions?: Permission[];
}

export interface CreateRolePayload {
  name: string;
  description: string;
  permission_ids: number[];
}

export interface UpdateRolePayload {
  description: string;
  permission_ids: number[];
}

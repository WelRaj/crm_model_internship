import { api } from "@/lib/api-client";
import type { AuthUser } from "@/services/auth-api";

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

type PaginatedResponse<T> = ApiResponse<T> & {
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
};

export type AccountRole = {
  id: string;
  code: string;
  name: string;
  description: string;
  is_system_role: boolean;
  is_active: boolean;
  users: number;
  permissions: AccountPermission[];
};

export type AccountPermission = {
  id: string;
  code: string;
  name: string;
  module: string;
  action: string;
  description: string;
};

export type RolePayload = {
  name: string;
  description?: string;
  is_active?: boolean;
  permission_codes?: string[];
};

export type UserListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: "active" | "inactive";
};

export type CreateUserPayload = {
  first_name: string;
  last_name?: string;
  email: string;
  mobile: string;
  department: string;
  designation?: string;
  password: string;
  role_codes?: string[];
};

export type UpdateUserPayload = Partial<Omit<CreateUserPayload, "password" | "role_codes">> & {
  is_verified?: boolean;
};

function toQueryString(params: UserListParams = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export async function listRoles() {
  const response = await api.get<ApiResponse<AccountRole[]>>("/accounts/roles/");
  return response.data;
}

export async function listPermissions() {
  const response = await api.get<ApiResponse<AccountPermission[]>>("/accounts/permissions/");
  return response.data;
}

export async function createRole(payload: RolePayload) {
  const response = await api.post<ApiResponse<AccountRole>>("/accounts/roles/", payload);
  return response.data;
}

export async function updateRole(roleId: string, payload: RolePayload) {
  const response = await api.put<ApiResponse<AccountRole>>(`/accounts/roles/${roleId}/`, payload);
  return response.data;
}

export async function listUsers(params?: UserListParams) {
  return api.get<PaginatedResponse<AuthUser[]>>(`/accounts/users/${toQueryString(params)}`);
}

export async function createUser(payload: CreateUserPayload) {
  const response = await api.post<ApiResponse<AuthUser>>("/accounts/users/", payload);
  return response.data;
}

export async function updateUser(userId: number, payload: UpdateUserPayload) {
  const response = await api.put<ApiResponse<AuthUser>>(`/accounts/users/${userId}/`, payload);
  return response.data;
}

export async function activateUser(userId: number) {
  const response = await api.post<ApiResponse<AuthUser>>(`/accounts/users/${userId}/activate/`, {});
  return response.data;
}

export async function deactivateUser(userId: number) {
  const response = await api.post<ApiResponse<AuthUser>>(`/accounts/users/${userId}/deactivate/`, {});
  return response.data;
}

export async function assignUserRoles(userId: number, roleCodes: string[]) {
  const response = await api.post<ApiResponse<AuthUser>>(`/accounts/users/${userId}/roles/`, {
    role_codes: roleCodes,
  });
  return response.data;
}

export async function revokeUserSessions(userId: number) {
  const response = await api.post<ApiResponse<{ revoked_sessions: number }>>(`/accounts/users/${userId}/sessions/revoke/`, {});
  return response.data;
}

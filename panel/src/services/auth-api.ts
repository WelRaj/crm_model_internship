import { api, clearStoredAuthTokens, getStoredAuthTokens, setStoredAuthTokens } from "@/lib/api-client";

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export type AuthUser = {
  id: number;
  employee_id: string | null;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string | null;
  mobile: string | null;
  department: string;
  designation: string;
  is_active: boolean;
  is_verified: boolean;
  active_sessions: number;
  roles: Array<{
    id: string;
    code: string;
    name: string;
    description: string;
  }>;
};

type LoginData = {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
};

export type SignupPayload = {
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  department: string;
  password: string;
};

export async function login(identifier: string, password: string) {
  const response = await api.post<ApiResponse<LoginData>>(
    "/auth/login/",
    { identifier, password },
    { auth: false }
  );

  setStoredAuthTokens({
    accessToken: response.data.access_token,
    refreshToken: response.data.refresh_token,
  });

  return response.data;
}

export async function signup(payload: SignupPayload) {
  const response = await api.post<ApiResponse<AuthUser>>("/auth/signup/", payload, { auth: false });
  return response.data;
}

export async function getCurrentUser() {
  const response = await api.get<ApiResponse<AuthUser>>("/auth/me/");
  return response.data;
}

export async function logout() {
  const tokens = getStoredAuthTokens();
  if (!tokens?.refreshToken) {
    clearStoredAuthTokens();
    return;
  }

  try {
    await api.post<ApiResponse<Record<string, never>>>("/auth/logout/", {
      refresh_token: tokens.refreshToken,
    });
  } catch {
    // Local cleanup must still happen if the token is already expired or the backend is temporarily unreachable.
  } finally {
    clearStoredAuthTokens();
  }
}

export function clearAuthSession() {
  clearStoredAuthTokens();
}

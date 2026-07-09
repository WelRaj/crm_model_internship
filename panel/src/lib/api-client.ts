const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const AUTH_STORAGE_KEY = "crm_auth_tokens";
let refreshInFlight: Promise<string | null> | null = null;

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

type ApiErrorPayload = {
  message?: string;
  detail?: string;
  errors?: Record<string, string | string[]>;
  [key: string]: unknown;
};

type ApiRequestConfig = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
  retryOnUnauthorized?: boolean;
};

export function getStoredAuthTokens(): AuthTokens | null {
  if (typeof window === "undefined") return null;

  const rawTokens = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!rawTokens) return null;

  try {
    return JSON.parse(rawTokens) as AuthTokens;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function setStoredAuthTokens(tokens: AuthTokens) {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(tokens));
}

export function clearStoredAuthTokens() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

async function refreshAccessToken() {
  const tokens = getStoredAuthTokens();
  if (!tokens?.refreshToken) return null;

  const response = await fetch(`${BASE_URL}/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: tokens.refreshToken }),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    clearStoredAuthTokens();
    throw new Error(resolveApiError(data));
  }

  const accessToken = data?.data?.access_token;
  if (!accessToken) {
    clearStoredAuthTokens();
    throw new Error("Unable to refresh session.");
  }

  setStoredAuthTokens({
    accessToken,
    refreshToken: tokens.refreshToken,
  });

  return accessToken as string;
}

async function getFreshAccessToken() {
  if (!refreshInFlight) {
    refreshInFlight = refreshAccessToken().finally(() => {
      refreshInFlight = null;
    });
  }

  return refreshInFlight;
}

function formatFieldErrors(errors: Record<string, unknown>) {
  const messages = Object.entries(errors)
    .filter(([, value]) => Array.isArray(value) || typeof value === "string")
    .map(([field, value]) => {
      const message = Array.isArray(value) ? value.join(", ") : value;
      return field === "non_field_errors" ? String(message) : `${field}: ${String(message)}`;
    });

  return messages.join("\n");
}

function resolveApiError(payload: ApiErrorPayload) {
  if (payload.message) return payload.message;
  if (payload.detail) return payload.detail;
  if (payload.errors) {
    const message = formatFieldErrors(payload.errors);
    if (message) return message;
  }

  const message = formatFieldErrors(payload);
  if (message) return message;

  return "Something went wrong";
}

function hasAuthorizationHeader(headers?: HeadersInit) {
  if (!headers) return false;
  if (headers instanceof Headers) return headers.has("Authorization");
  if (Array.isArray(headers)) {
    return headers.some(([key]) => key.toLowerCase() === "authorization");
  }
  return Object.keys(headers).some((key) => key.toLowerCase() === "authorization");
}

export async function apiClient<T>(
  endpoint: string,
  { body, auth = true, retryOnUnauthorized = true, ...customConfig }: ApiRequestConfig = {}
): Promise<T> {
  const tokens = auth ? getStoredAuthTokens() : null;
  const headers: HeadersInit = { "Content-Type": "application/json" };

  if (tokens?.accessToken && !hasAuthorizationHeader(customConfig.headers)) {
    headers.Authorization = `Bearer ${tokens.accessToken}`;
  }

  const config: RequestInit = {
    method: body ? "POST" : "GET",
    ...customConfig,
    headers: {
      ...headers,
      ...customConfig.headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      return data;
    }

    if (response.status === 401 && auth && retryOnUnauthorized) {
      const accessToken = await getFreshAccessToken();
      if (accessToken) {
        return apiClient<T>(endpoint, {
          body,
          auth,
          retryOnUnauthorized: false,
          ...customConfig,
          headers: {
            ...customConfig.headers,
            Authorization: `Bearer ${accessToken}`,
          },
        });
      }
    }

    throw new Error(resolveApiError(data));
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      return Promise.reject(new Error("Backend server is not reachable. Start the backend and try again."));
    }

    return Promise.reject(error);
  }
}

export const api = {
  get: <T>(endpoint: string, config?: ApiRequestConfig) =>
    apiClient<T>(endpoint, { ...config, method: "GET" }),
  post: <T>(endpoint: string, body: unknown, config?: ApiRequestConfig) =>
    apiClient<T>(endpoint, { ...config, method: "POST", body }),
  put: <T>(endpoint: string, body: unknown, config?: ApiRequestConfig) =>
    apiClient<T>(endpoint, { ...config, method: "PUT", body }),
  delete: <T>(endpoint: string, config?: ApiRequestConfig) =>
    apiClient<T>(endpoint, { ...config, method: "DELETE" }),
};

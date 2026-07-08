/**
 * Base API client using Fetch API
 * Structured for easy integration with backend
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

type ApiRequestConfig = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export async function apiClient<T>(
  endpoint: string,
  { body, ...customConfig }: ApiRequestConfig = {}
): Promise<T> {
  const headers = { "Content-Type": "application/json" };
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
    const data = await response.json();

    if (response.ok) {
      return data;
    }

    throw new Error(data.message || "Something went wrong");
  } catch (error) {
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

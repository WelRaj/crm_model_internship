import { api } from "@/lib/api-client";
import type { AuthUser } from "@/services/auth-api";

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export type LeadRecord = {
  id: string;
  lead_number: string;
  lead_type: "project" | "trading";
  status: "new" | "contacted" | "qualified" | "proposal" | "won" | "lost";
  source: string;
  company_name: string;
  contact_name: string;
  email: string;
  mobile: string;
  city: string;
  requirement_summary: string;
  estimated_value: string;
  assigned_to: AuthUser | null;
  created_at: string;
  updated_at: string;
};

export type CreateLeadPayload = {
  lead_type?: "project" | "trading";
  source?: string;
  company_name?: string;
  contact_name: string;
  email?: string;
  mobile: string;
  city?: string;
  requirement_summary?: string;
  estimated_value?: string;
};

export type LeadListParams = {
  search?: string;
  status?: string;
  lead_type?: string;
  page?: number;
  limit?: number;
};

function toQuery(params: LeadListParams = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.set(key, String(value));
  });
  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

export async function listLeads(params?: LeadListParams) {
  return api.get<ApiResponse<LeadRecord[]>>(`/leads/${toQuery(params)}`);
}

export async function createLead(payload: CreateLeadPayload) {
  const response = await api.post<ApiResponse<LeadRecord>>("/leads/", payload);
  return response.data;
}

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

export type UpdateLeadPayload = {
  lead_type?: "project" | "trading";
  status?: "new" | "contacted" | "qualified" | "proposal" | "won" | "lost";
  source?: string;
  company_name?: string;
  contact_name?: string;
  email?: string;
  mobile?: string;
  city?: string;
  requirement_summary?: string;
  estimated_value?: string;
};

export type AssignLeadPayload = {
  assigned_to_id?: number | null;
};

export type LeadFollowUpRecord = {
  id: string;
  lead: string;
  lead_detail?: LeadRecord;
  channel: "call" | "whatsapp" | "email" | "meeting" | "other";
  outcome: "pending" | "contacted" | "interested" | "not_interested" | "callback" | "escalated" | "done";
  note: string;
  next_follow_up_at: string | null;
  created_by: AuthUser | null;
  created_at: string;
  updated_at: string;
};

export type FollowUpListParams = {
  due_status?: "today" | "overdue" | "scheduled" | "done";
  lead_type?: "project" | "trading";
  owner_id?: number | string;
  search?: string;
};

export type CreateLeadFollowUpPayload = {
  channel: LeadFollowUpRecord["channel"];
  outcome: LeadFollowUpRecord["outcome"];
  note: string;
  next_follow_up_at?: string | null;
};

function toQuery(params: Record<string, string | number | undefined> = {}) {
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

export async function getLead(leadId: string) {
  const response = await api.get<ApiResponse<LeadRecord>>(`/leads/${leadId}/`);
  return response.data;
}

export async function updateLead(leadId: string, payload: UpdateLeadPayload) {
  const response = await api.put<ApiResponse<LeadRecord>>(`/leads/${leadId}/`, payload);
  return response.data;
}

export async function assignLead(leadId: string, payload: AssignLeadPayload) {
  const response = await api.post<ApiResponse<LeadRecord>>(`/leads/${leadId}/assign/`, payload);
  return response.data;
}

export async function listLeadFollowUps(leadId: string) {
  const response = await api.get<ApiResponse<LeadFollowUpRecord[]>>(`/leads/${leadId}/follow-ups/`);
  return response.data;
}

export async function listFollowUps(params?: FollowUpListParams) {
  const response = await api.get<ApiResponse<LeadFollowUpRecord[]>>(`/follow-ups/${toQuery(params)}`);
  return response.data;
}

export async function createLeadFollowUp(leadId: string, payload: CreateLeadFollowUpPayload) {
  const response = await api.post<ApiResponse<LeadFollowUpRecord>>(`/leads/${leadId}/follow-ups/`, payload);
  return response.data;
}

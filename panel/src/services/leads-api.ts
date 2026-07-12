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

export type SaveLeadOutcomePayload = {
  status: "qualified" | "proposal" | "won" | "lost";
  note?: string;
};

export type ProjectClientContactRecord = {
  id: string;
  role: "decision_maker" | "technical" | "finance" | "daily_coordinator";
  role_label: string;
  name: string;
  designation: string;
  phone: string;
  email: string;
  responsibility: string;
  created_at: string;
  updated_at: string;
};

export type ProjectClientRecord = {
  id: string;
  client_number: string;
  source_lead: string | null;
  source_lead_detail: LeadRecord | null;
  company_name: string;
  project_name: string;
  project_type: string;
  project_status: "discovery" | "development" | "uat" | "agreement_pending";
  project_status_label: string;
  project_owner: string;
  team_leader: string;
  telecaller: string;
  agreement_status: "pending" | "drafted" | "signed";
  agreement_status_label: string;
  value: string;
  next_action: string;
  contacts: ProjectClientContactRecord[];
  created_at: string;
  updated_at: string;
};

export type CreateProjectClientPayload = {
  source_lead_id?: string | null;
  company_name: string;
  project_name: string;
  project_type?: string;
  project_owner?: string;
  team_leader?: string;
  telecaller?: string;
  agreement_status?: ProjectClientRecord["agreement_status"];
  value?: string;
  primary_contact?: CreateProjectClientContactPayload;
};

export type CreateProjectClientContactPayload = {
  role: ProjectClientContactRecord["role"];
  name: string;
  designation?: string;
  phone: string;
  email?: string;
  responsibility?: string;
};

export type ProjectHandoffRecord = {
  id: string;
  client: string;
  client_detail: ProjectClientRecord;
  project_code: string;
  project_manager: string;
  start_date: string;
  target_end_date: string;
  priority: "low" | "medium" | "high" | "critical";
  priority_label: string;
  billing_model: string;
  delivery_method: string;
  communication_channel: string;
  repository_url: string;
  kickoff_notes: string;
  status: "planning" | "active" | "on_hold" | "completed";
  status_label: string;
  created_at: string;
  updated_at: string;
};

export type CreateProjectHandoffPayload = {
  client_id: string;
  project_code: string;
  project_manager: string;
  start_date: string;
  target_end_date: string;
  priority: ProjectHandoffRecord["priority"];
  billing_model: string;
  delivery_method: string;
  communication_channel?: string;
  repository_url?: string;
  kickoff_notes: string;
};

export type ProjectAgreementRecord = {
  id: string;
  agreement_number: string;
  project_handoff: string | null;
  project_handoff_detail: ProjectHandoffRecord | null;
  client: string;
  client_detail: ProjectClientRecord;
  agreement_type: "msa" | "sow" | "nda" | "sla";
  agreement_type_label: string;
  effective_date: string;
  expiry_date: string | null;
  contract_value: string;
  payment_terms: string;
  status: "draft" | "under_review" | "sent_for_signature" | "active" | "expired" | "terminated";
  status_label: string;
  remarks: string;
  attachment_name: string;
  created_at: string;
  updated_at: string;
};

export type CreateProjectAgreementPayload = {
  project_handoff_id?: string | null;
  client_id: string;
  agreement_type: ProjectAgreementRecord["agreement_type"];
  effective_date: string;
  expiry_date?: string | null;
  contract_value?: string;
  payment_terms?: string;
  status: ProjectAgreementRecord["status"];
  remarks?: string;
  attachment_name?: string;
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

export async function saveLeadOutcome(leadId: string, payload: SaveLeadOutcomePayload) {
  const response = await api.post<ApiResponse<LeadRecord>>(`/leads/${leadId}/outcome/`, payload);
  return response.data;
}

export async function listProjectClients(params?: { search?: string }) {
  const response = await api.get<ApiResponse<ProjectClientRecord[]>>(`/project-clients/${toQuery(params)}`);
  return response.data;
}

export async function createProjectClient(payload: CreateProjectClientPayload) {
  const response = await api.post<ApiResponse<ProjectClientRecord>>("/project-clients/", payload);
  return response.data;
}

export async function createProjectClientContact(clientId: string, payload: CreateProjectClientContactPayload) {
  const response = await api.post<ApiResponse<ProjectClientContactRecord>>(`/project-clients/${clientId}/contacts/`, payload);
  return response.data;
}

export async function listProjectHandoffs(params?: { client_id?: string }) {
  const response = await api.get<ApiResponse<ProjectHandoffRecord[]>>(`/project-handoffs/${toQuery(params)}`);
  return response.data;
}

export async function createProjectHandoff(payload: CreateProjectHandoffPayload) {
  const response = await api.post<ApiResponse<ProjectHandoffRecord>>("/project-handoffs/", payload);
  return response.data;
}

export async function updateProjectHandoff(projectId: string, payload: CreateProjectHandoffPayload) {
  const response = await api.put<ApiResponse<ProjectHandoffRecord>>(`/project-handoffs/${projectId}/`, payload);
  return response.data;
}

export async function listProjectAgreements(params?: { client_id?: string; project_handoff_id?: string; search?: string }) {
  const response = await api.get<ApiResponse<ProjectAgreementRecord[]>>(`/project-agreements/${toQuery(params)}`);
  return response.data;
}

export async function createProjectAgreement(payload: CreateProjectAgreementPayload) {
  const response = await api.post<ApiResponse<ProjectAgreementRecord>>("/project-agreements/", payload);
  return response.data;
}

export async function updateProjectAgreement(agreementId: string, payload: CreateProjectAgreementPayload) {
  const response = await api.put<ApiResponse<ProjectAgreementRecord>>(`/project-agreements/${agreementId}/`, payload);
  return response.data;
}

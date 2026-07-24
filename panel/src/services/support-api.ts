import { api } from "@/lib/api-client";

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export type SupportTicketStatus = "Open" | "In Progress" | "Waiting" | "Resolved";
export type SupportTicketPriority = "Low" | "Medium" | "High" | "Critical";
export type SupportTicketChannel = "Internal" | "Phone" | "Email" | "WhatsApp";
export type SupportTicketModule =
  | "Client Operations"
  | "Lead Desk"
  | "Delivery Projects"
  | "People Operations"
  | "Finance Control"
  | "Growth Marketing"
  | "Admin Control"
  | "Support Desk";

export type SupportTicketRecord = {
  id: string;
  ticket_number: string;
  subject: string;
  module: SupportTicketModule;
  requester: string;
  priority: SupportTicketPriority;
  priority_label: SupportTicketPriority;
  status: SupportTicketStatus;
  status_label: SupportTicketStatus;
  channel: SupportTicketChannel;
  channel_label: SupportTicketChannel;
  owner_name: string;
  response_due_at: string | null;
  response_due_label: string;
  description: string;
  resolved_at: string | null;
  resolution_summary: string;
  is_active: boolean;
  created_at: string;
  created_at_label: string;
  updated_at: string;
};

export type SupportTicketPayload = {
  subject: string;
  module: SupportTicketModule;
  requester: string;
  priority: SupportTicketPriority;
  channel: SupportTicketChannel;
  description: string;
};

export type SupportTicketUpdatePayload = Partial<
  Pick<SupportTicketPayload, "subject" | "module" | "requester" | "priority" | "channel" | "description">
> & {
  status?: SupportTicketStatus;
  resolution_summary?: string;
};

export type SupportOverview = {
  open_tickets: number;
  critical_tickets: number;
  resolved_tickets: number;
  waiting_tickets: number;
};

function toQuery(params?: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== "") searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export async function listSupportOverview() {
  const response = await api.get<ApiResponse<SupportOverview>>("/support/overview/");
  return response.data;
}

export async function listSupportTickets(params?: { search?: string; status?: string; module?: string }) {
  const response = await api.get<ApiResponse<SupportTicketRecord[]>>(`/support/tickets/${toQuery(params)}`);
  return response.data;
}

export async function createSupportTicket(payload: SupportTicketPayload) {
  const response = await api.post<ApiResponse<SupportTicketRecord>>("/support/tickets/", payload);
  return response.data;
}

export async function updateSupportTicket(ticketId: string, payload: SupportTicketUpdatePayload) {
  const response = await api.patch<ApiResponse<SupportTicketRecord>>(`/support/tickets/${ticketId}/`, payload);
  return response.data;
}


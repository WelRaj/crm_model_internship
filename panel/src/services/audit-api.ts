import { api } from "@/lib/api-client";

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

export type AuditLogRecord = {
  id: string;
  actor_id: string;
  actor_name: string;
  actor_role: string;
  module: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values: Record<string, unknown>;
  new_values: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string;
  investigation_status: "clear" | "flagged" | "investigating" | "resolved";
  investigation_status_label: "Clear" | "Flagged" | "Investigating" | "Resolved";
  investigation_note: string;
  investigated_by: string | null;
  investigated_at: string | null;
  created_at: string;
};

export type AuditLogListParams = {
  page?: number;
  limit?: number;
  search?: string;
  module?: string;
  action?: string;
  entity_type?: string;
  investigation_status?: string;
};

function toQueryString(params: AuditLogListParams = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export async function listAuditLogs(params?: AuditLogListParams) {
  return api.get<PaginatedResponse<AuditLogRecord[]>>(`/audit/logs/${toQueryString(params)}`);
}

export async function updateAuditInvestigation(logId: string, payload: Pick<AuditLogRecord, "investigation_status" | "investigation_note">) {
  return api.put<ApiResponse<AuditLogRecord>>(`/audit/logs/${logId}/investigation/`, payload);
}

import { api } from "@/lib/api-client";

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

function toQuery(params?: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== "") searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export type FinanceClientRecord = {
  id: string;
  client_code: string;
  project_client: string | null;
  company_name: string;
  contact_person: string;
  email: string;
  mobile: string;
  gstin: string;
  pan: string;
  billing_address: string;
  currency: string;
  payment_terms: string;
  credit_limit: string;
  outstanding_amount: string;
  status: "active" | "inactive" | "on_hold" | "blacklisted" | "archived";
  status_label: string;
  created_at: string;
  updated_at: string;
};

export type FinanceClientPayload = {
  project_client_id?: string | null;
  company_name: string;
  contact_person: string;
  email?: string;
  mobile?: string;
  gstin?: string;
  pan?: string;
  billing_address?: string;
  currency?: string;
  payment_terms?: string;
  credit_limit?: string;
  status?: FinanceClientRecord["status"];
};

export type VendorRecord = {
  id: string;
  vendor_code: string;
  company_name: string;
  contact_person: string;
  email: string;
  mobile: string;
  gstin: string;
  pan: string;
  billing_address: string;
  payment_terms: string;
  status: "active" | "inactive" | "on_hold" | "archived";
  status_label: string;
  created_at: string;
  updated_at: string;
};

export type VendorPayload = Omit<VendorRecord, "id" | "vendor_code" | "status_label" | "created_at" | "updated_at">;

export type FinanceItemPayload = {
  description: string;
  quantity: string;
  unit_price: string;
};

export type QuotationRecord = {
  id: string;
  quotation_number: string;
  client: string;
  project: string | null;
  agreement: string | null;
  title: string;
  description: string;
  status: "draft" | "pending_approval" | "approved" | "sent" | "client_accepted" | "archived";
  status_label: string;
  currency: string;
  subtotal: string;
  discount: string;
  taxable_amount: string;
  gst_rate: string;
  gst_amount: string;
  total_amount: string;
  valid_until: string | null;
  terms: string;
  items: Array<{ id: string; description: string; quantity: string; unit_price: string; amount: string }>;
  created_at: string;
  updated_at: string;
};

export type QuotationPayload = {
  client_id: string;
  project_id?: string | null;
  agreement_id?: string | null;
  title: string;
  description?: string;
  status?: QuotationRecord["status"];
  currency?: string;
  discount?: string;
  gst_rate?: string;
  valid_until?: string | null;
  terms?: string;
  items: FinanceItemPayload[];
};

export type InvoiceRecord = {
  id: string;
  invoice_number: string;
  source_type: "quotation" | "direct" | "milestone";
  quotation: string | null;
  client: string;
  project: string | null;
  milestone: string | null;
  agreement: string | null;
  invoice_date: string;
  due_date: string;
  status: "draft" | "pending_approval" | "approved" | "sent" | "cancelled" | "archived";
  status_label: string;
  payment_status: "not_due" | "unpaid" | "partially_paid" | "paid" | "overdue";
  payment_status_label: string;
  currency: string;
  subtotal: string;
  discount: string;
  taxable_amount: string;
  gst_rate: string;
  gst_amount: string;
  total_amount: string;
  paid_amount: string;
  tds_amount: string;
  remarks: string;
  items: Array<{ id: string; description: string; quantity: string; unit_price: string; amount: string }>;
  created_at: string;
  updated_at: string;
};

export type InvoicePayload = {
  source_type?: InvoiceRecord["source_type"];
  quotation_id?: string | null;
  client_id: string;
  project_id?: string | null;
  milestone_id?: string | null;
  agreement_id?: string | null;
  invoice_date: string;
  due_date: string;
  status?: InvoiceRecord["status"];
  currency?: string;
  discount?: string;
  gst_rate?: string;
  remarks?: string;
  items: FinanceItemPayload[];
};

export type PaymentRecord = {
  id: string;
  payment_number: string;
  client: string;
  allocation_type: "invoice" | "advance";
  allocation_type_label: string;
  amount: string;
  tds_amount: string;
  currency: string;
  payment_date: string;
  mode: string;
  reference: string;
  bank_account: string | null;
  proof_name: string;
  status: "received" | "verified" | "reconciled" | "reversed";
  status_label: string;
  remarks: string;
  allocations: Array<{ id: string; invoice: string; amount: string; tds_amount: string }>;
  created_at: string;
  updated_at: string;
};

export type PaymentPayload = {
  client_id: string;
  allocation_type?: PaymentRecord["allocation_type"];
  amount: string;
  tds_amount?: string;
  currency?: string;
  payment_date: string;
  mode: string;
  reference: string;
  bank_account_id?: string | null;
  proof_name?: string;
  remarks?: string;
  allocations?: Array<{ invoice_id: string; amount: string; tds_amount?: string }>;
};

export async function getFinanceOverview() {
  const response = await api.get<ApiResponse<Record<string, string | number>>>("/finance/overview/");
  return response.data;
}

export async function listFinanceClients(params?: { search?: string; status?: string }) {
  const response = await api.get<ApiResponse<FinanceClientRecord[]>>(`/finance/clients/${toQuery(params)}`);
  return response.data;
}

export async function createFinanceClient(payload: FinanceClientPayload) {
  const response = await api.post<ApiResponse<FinanceClientRecord>>("/finance/clients/", payload);
  return response.data;
}

export async function updateFinanceClient(clientId: string, payload: Partial<FinanceClientPayload>) {
  const response = await api.put<ApiResponse<FinanceClientRecord>>(`/finance/clients/${clientId}/`, payload);
  return response.data;
}

export async function archiveFinanceClient(clientId: string) {
  const response = await api.delete<ApiResponse<FinanceClientRecord>>(`/finance/clients/${clientId}/`);
  return response.data;
}

export async function syncFinanceClientFromProjectClient(projectClientId: string) {
  const response = await api.post<ApiResponse<FinanceClientRecord>>(`/finance/clients/sync-project-client/${projectClientId}/`, {});
  return response.data;
}

export async function listVendors(params?: { search?: string; status?: string }) {
  const response = await api.get<ApiResponse<VendorRecord[]>>(`/finance/vendors/${toQuery(params)}`);
  return response.data;
}

export async function createVendor(payload: VendorPayload) {
  const response = await api.post<ApiResponse<VendorRecord>>("/finance/vendors/", payload);
  return response.data;
}

export async function updateVendor(vendorId: string, payload: Partial<VendorPayload>) {
  const response = await api.put<ApiResponse<VendorRecord>>(`/finance/vendors/${vendorId}/`, payload);
  return response.data;
}

export async function listQuotations(params?: { search?: string; status?: string }) {
  const response = await api.get<ApiResponse<QuotationRecord[]>>(`/finance/quotations/${toQuery(params)}`);
  return response.data;
}

export async function createQuotation(payload: QuotationPayload) {
  const response = await api.post<ApiResponse<QuotationRecord>>("/finance/quotations/", payload);
  return response.data;
}

export async function updateQuotation(quotationId: string, payload: Partial<QuotationPayload>) {
  const response = await api.put<ApiResponse<QuotationRecord>>(`/finance/quotations/${quotationId}/`, payload);
  return response.data;
}

export async function runQuotationAction(quotationId: string, status: QuotationRecord["status"]) {
  const response = await api.post<ApiResponse<QuotationRecord>>(`/finance/quotations/${quotationId}/action/`, { status });
  return response.data;
}

export async function listInvoices(params?: { search?: string; status?: string; payment_status?: string }) {
  const response = await api.get<ApiResponse<InvoiceRecord[]>>(`/finance/invoices/${toQuery(params)}`);
  return response.data;
}

export async function createInvoice(payload: InvoicePayload) {
  const response = await api.post<ApiResponse<InvoiceRecord>>("/finance/invoices/", payload);
  return response.data;
}

export async function updateInvoice(invoiceId: string, payload: Partial<InvoicePayload>) {
  const response = await api.put<ApiResponse<InvoiceRecord>>(`/finance/invoices/${invoiceId}/`, payload);
  return response.data;
}

export async function runInvoiceAction(invoiceId: string, status: InvoiceRecord["status"]) {
  const response = await api.post<ApiResponse<InvoiceRecord>>(`/finance/invoices/${invoiceId}/action/`, { status });
  return response.data;
}

export async function listPayments(params?: { search?: string; status?: string }) {
  const response = await api.get<ApiResponse<PaymentRecord[]>>(`/finance/payments/${toQuery(params)}`);
  return response.data;
}

export async function createPayment(payload: PaymentPayload) {
  const response = await api.post<ApiResponse<PaymentRecord>>("/finance/payments/", payload);
  return response.data;
}

export async function runPaymentAction(paymentId: string, status: PaymentRecord["status"]) {
  const response = await api.post<ApiResponse<PaymentRecord>>(`/finance/payments/${paymentId}/action/`, { status });
  return response.data;
}

export async function listFinanceResource<T>(resource: string, params?: { search?: string; status?: string }) {
  const response = await api.get<ApiResponse<T[]>>(`/finance/${resource}/${toQuery(params)}`);
  return response.data;
}

export async function createFinanceResource<T, P>(resource: string, payload: P) {
  const response = await api.post<ApiResponse<T>>(`/finance/${resource}/`, payload);
  return response.data;
}

export async function updateFinanceResource<T, P>(resource: string, id: string, payload: Partial<P>) {
  const response = await api.put<ApiResponse<T>>(`/finance/${resource}/${id}/`, payload);
  return response.data;
}

export async function deleteFinanceResource<T>(resource: string, id: string) {
  const response = await api.delete<ApiResponse<T>>(`/finance/${resource}/${id}/`);
  return response.data;
}

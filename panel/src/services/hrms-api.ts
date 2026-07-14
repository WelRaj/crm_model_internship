import { api } from "@/lib/api-client";
import type { AuthUser } from "@/services/auth-api";

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export type HrmsEmployeeStatus = "active" | "probation" | "training" | "on_notice" | "exited" | "archived";
export type HrmsKycStatus = "complete" | "pending";

export type HrmsEmployee = {
  id: string;
  user: number;
  user_detail: AuthUser;
  employee_id: string;
  name: string;
  email: string;
  mobile: string;
  joined: string | null;
  role: string;
  team: string;
  manager_name: string;
  location: string;
  employment_type: string;
  status: HrmsEmployeeStatus;
  status_label: string;
  health_score: number;
  kyc_status: HrmsKycStatus;
  kyc_status_label: string;
  asset_tag: string;
  created_at: string;
  updated_at: string;
};

export type HrmsEmployeePayload = {
  employee_id: string;
  name: string;
  role: string;
  team: string;
  manager_name?: string;
  location?: string;
  employment_type?: string;
  status?: HrmsEmployeeStatus;
  health_score?: number;
  email: string;
  mobile: string;
  joined?: string | null;
  kyc_status?: HrmsKycStatus;
  asset_tag?: string;
  password?: string;
};

export type HrmsAttendance = {
  id: string;
  employee: string;
  employee_detail: HrmsEmployee;
  date: string;
  shift: string;
  check_in: string | null;
  check_out: string | null;
  mode: "office" | "remote" | "hybrid";
  mode_label: string;
  status: "present" | "late" | "leave" | "missing_punch" | "regularized";
  status_label: string;
  billable_hours: string;
  overtime_hours: string;
  approval_status: "auto_approved" | "pending_approval" | "approved" | "rejected";
  approval_status_label: string;
  payroll_impact: "payable" | "non_payable" | "review";
  payroll_impact_label: string;
  note: string;
  created_at: string;
  updated_at: string;
};

export type HrmsAttendancePayload = {
  employee_id: string;
  date: string;
  check_in: string;
  check_out: string;
  mode: HrmsAttendance["mode"];
  note: string;
};

export type HrmsLeave = {
  id: string;
  employee: string;
  employee_detail: HrmsEmployee;
  leave_type: "earned_leave" | "sick_leave" | "casual_leave" | "work_from_home" | "comp_off";
  leave_type_label: string;
  start_date: string;
  end_date: string;
  days: string;
  duration: "full_day" | "first_half" | "second_half";
  duration_label: string;
  reason: string;
  status: "pending" | "manager_review" | "hr_review" | "approved" | "rejected" | "cancelled";
  status_label: string;
  approver: string;
  payroll_impact: "paid" | "unpaid" | "no_impact";
  payroll_impact_label: string;
  applied_at: string;
  decision_note: string;
  created_at: string;
  updated_at: string;
};

export type HrmsLeavePayload = {
  employee_id: string;
  leave_type: HrmsLeave["leave_type"];
  start_date: string;
  end_date: string;
  duration: HrmsLeave["duration"];
  reason: string;
};

export type HrmsPayroll = {
  id: string;
  employee: string;
  employee_detail: HrmsEmployee;
  month: string;
  basic: string;
  hra: string;
  allowance: string;
  conveyance: string;
  bonus: string;
  pf: string;
  pt: string;
  tds: string;
  advance: string;
  working_days: number;
  payable_days: string;
  lop_days: string;
  lop_deduction: string;
  gross: string;
  deductions: string;
  net: string;
  readiness: "ready" | "attendance_review" | "leave_review";
  readiness_label: string;
  hold_reason: string;
  processed_at: string | null;
  status: "draft" | "hr_review" | "finance_review" | "approved" | "paid" | "hold";
  status_label: string;
  created_at: string;
  updated_at: string;
};

export type HrmsPayrollPayload = {
  employee_id: string;
  month: string;
  basic: string;
  hra: string;
  allowance: string;
  conveyance: string;
  bonus: string;
  pf: string;
  pt: string;
  tds: string;
  advance: string;
  working_days: number;
};

export type HrmsExit = {
  id: string;
  employee: string;
  employee_detail: HrmsEmployee;
  exit_type: "resignation" | "termination" | "contract_end" | "retirement";
  exit_type_label: string;
  resignation_date: string;
  last_day: string;
  reason: string;
  notice: "serving" | "final_week" | "completed";
  notice_label: string;
  handover: number;
  handover_owner: string;
  risk: "low" | "medium" | "high";
  risk_label: string;
  laptop_recovered: boolean;
  id_card_recovered: boolean;
  access_revoked: boolean;
  manager_clearance: boolean;
  hr_clearance: boolean;
  finance_clearance: boolean;
  it_clearance: boolean;
  ff_status: "pending" | "in_progress" | "cleared";
  ff_status_label: string;
  lifecycle_status: "initiated" | "clearance" | "ready_for_fnf" | "completed" | "cancelled";
  lifecycle_status_label: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type HrmsExitPayload = {
  employee_id: string;
  exit_type: HrmsExit["exit_type"];
  resignation_date: string;
  last_day: string;
  handover_owner: string;
  reason: string;
  risk: HrmsExit["risk"];
};

function toQuery(params?: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== "") searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export async function listHrmsEmployees(params?: { search?: string; status?: string }) {
  const response = await api.get<ApiResponse<HrmsEmployee[]>>(`/hrms/employees/${toQuery(params)}`);
  return response.data;
}

export async function createHrmsEmployee(payload: HrmsEmployeePayload) {
  const response = await api.post<ApiResponse<HrmsEmployee>>("/hrms/employees/", payload);
  return response.data;
}

export async function updateHrmsEmployee(employeeId: string, payload: Partial<HrmsEmployeePayload>) {
  const response = await api.put<ApiResponse<HrmsEmployee>>(`/hrms/employees/${employeeId}/`, payload);
  return response.data;
}

export async function archiveHrmsEmployee(employeeId: string) {
  const response = await api.delete<ApiResponse<HrmsEmployee>>(`/hrms/employees/${employeeId}/`);
  return response.data;
}

export async function listHrmsAttendance(params?: { search?: string; status?: string }) {
  const response = await api.get<ApiResponse<HrmsAttendance[]>>(`/hrms/attendance/${toQuery(params)}`);
  return response.data;
}

export async function createHrmsAttendance(payload: HrmsAttendancePayload) {
  const response = await api.post<ApiResponse<HrmsAttendance>>("/hrms/attendance/", payload);
  return response.data;
}

export async function updateHrmsAttendance(attendanceId: string, payload: HrmsAttendancePayload) {
  const response = await api.put<ApiResponse<HrmsAttendance>>(`/hrms/attendance/${attendanceId}/`, payload);
  return response.data;
}

export async function runHrmsAttendanceAction(attendanceId: string, action: "approve" | "reject") {
  const response = await api.post<ApiResponse<HrmsAttendance>>(`/hrms/attendance/${attendanceId}/action/`, { action });
  return response.data;
}

export async function listHrmsLeaves(params?: { search?: string; status?: string }) {
  const response = await api.get<ApiResponse<HrmsLeave[]>>(`/hrms/leaves/${toQuery(params)}`);
  return response.data;
}

export async function createHrmsLeave(payload: HrmsLeavePayload) {
  const response = await api.post<ApiResponse<HrmsLeave>>("/hrms/leaves/", payload);
  return response.data;
}

export async function runHrmsLeaveAction(leaveId: string, action: "advance" | "reject" | "cancel") {
  const response = await api.post<ApiResponse<HrmsLeave>>(`/hrms/leaves/${leaveId}/action/`, { action });
  return response.data;
}

export async function listHrmsPayroll(params?: { search?: string; status?: string }) {
  const response = await api.get<ApiResponse<HrmsPayroll[]>>(`/hrms/payroll-records/${toQuery(params)}`);
  return response.data;
}

export async function createHrmsPayroll(payload: HrmsPayrollPayload) {
  const response = await api.post<ApiResponse<HrmsPayroll>>("/hrms/payroll-records/", payload);
  return response.data;
}

export async function runHrmsPayrollAction(payrollId: string, action: "advance" | "hold" | "release" | "recheck") {
  const response = await api.post<ApiResponse<HrmsPayroll>>(`/hrms/payroll-records/${payrollId}/action/`, { action });
  return response.data;
}

export async function listHrmsExits(params?: { search?: string; status?: string }) {
  const response = await api.get<ApiResponse<HrmsExit[]>>(`/hrms/exits/${toQuery(params)}`);
  return response.data;
}

export async function createHrmsExit(payload: HrmsExitPayload) {
  const response = await api.post<ApiResponse<HrmsExit>>("/hrms/exits/", payload);
  return response.data;
}

export async function updateHrmsExit(exitId: string, payload: Partial<Pick<HrmsExit, "handover" | "laptop_recovered" | "id_card_recovered" | "access_revoked" | "manager_clearance" | "hr_clearance" | "finance_clearance" | "it_clearance">>) {
  const response = await api.put<ApiResponse<HrmsExit>>(`/hrms/exits/${exitId}/`, payload);
  return response.data;
}

export async function runHrmsExitAction(exitId: string, action: "cancel" | "complete") {
  const response = await api.post<ApiResponse<HrmsExit>>(`/hrms/exits/${exitId}/action/`, { action });
  return response.data;
}

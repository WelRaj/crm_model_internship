"use client";

import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react";
import {
  AlertTriangle,
  BadgeIndianRupee,
  BriefcaseBusiness,
  Calendar,
  CheckCircle2,
  Download,
  Edit3,
  Eye,
  Filter,
  Fingerprint,
  Laptop,
  LogOut,
  Plane,
  Plus,
  Search,
  ShieldCheck,
  UserCheck,
  UserMinus,
  Users,
  Wallet,
  X,
} from "lucide-react";
import {
  archiveHrmsEmployee,
  createHrmsAttendance,
  createHrmsEmployee,
  createHrmsExit,
  createHrmsLeave,
  createHrmsPayroll,
  listHrmsAttendance,
  listHrmsEmployees,
  listHrmsExits,
  listHrmsLeaves,
  listHrmsPayroll,
  runHrmsAttendanceAction,
  runHrmsExitAction,
  runHrmsLeaveAction,
  runHrmsPayrollAction,
  updateHrmsAttendance,
  updateHrmsEmployee,
  updateHrmsExit,
  type HrmsAttendance,
  type HrmsEmployee,
  type HrmsExit,
  type HrmsLeave,
  type HrmsPayroll,
} from "@/services/hrms-api";

type HRMSView = "employees" | "attendance" | "leave" | "payroll" | "exit";
type Tone = "blue" | "green" | "amber" | "red" | "purple" | "slate" | "cyan";
type EmployeeStatus = "Active" | "Probation" | "Training" | "On Notice" | "Exited" | "Archived";
type AttendanceStatus = "Present" | "Late" | "Leave" | "Missing Punch" | "Regularized";
type AttendanceApprovalStatus = "Auto Approved" | "Pending Approval" | "Approved" | "Rejected";
type AttendancePayrollImpact = "Payable" | "Non Payable" | "Review";
type LeaveStatus = "Pending" | "Manager Review" | "HR Review" | "Approved" | "Rejected" | "Cancelled";
type LeaveDuration = "Full Day" | "First Half" | "Second Half";
type LeavePayrollImpact = "Paid" | "Unpaid" | "No Impact";
type PayrollStatus = "Draft" | "HR Review" | "Finance Review" | "Approved" | "Paid" | "Hold";
type PayrollReadiness = "Ready" | "Attendance Review" | "Leave Review";
type ExitRisk = "Low" | "Medium" | "High";
type ExitSettlementStatus = "Pending" | "In Progress" | "Cleared";
type ExitLifecycleStatus = "Initiated" | "Clearance" | "Ready for F&F" | "Completed" | "Cancelled";
type ExitType = "Resignation" | "Termination" | "Contract End" | "Retirement";

interface EmployeeRecord {
  id: string;
  code: string;
  name: string;
  role: string;
  team: string;
  manager: string;
  location: string;
  type: string;
  status: EmployeeStatus;
  score: number;
  email: string;
  mobile: string;
  joined: string;
  kycStatus: "Complete" | "Pending";
  assetTag: string;
}

interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeCode?: string;
  name: string;
  date: string;
  shift: string;
  checkIn: string;
  checkOut: string;
  mode: "Office" | "Remote" | "Hybrid";
  status: AttendanceStatus;
  billableHours: number;
  overtimeHours: number;
  approvalStatus: AttendanceApprovalStatus;
  payrollImpact: AttendancePayrollImpact;
  note: string;
}

interface LeaveRecord {
  id: string;
  employeeId: string;
  employeeCode?: string;
  name: string;
  type: "Earned Leave" | "Sick Leave" | "Casual Leave" | "Work From Home" | "Comp Off";
  startDate: string;
  endDate: string;
  days: number;
  duration: LeaveDuration;
  reason: string;
  status: LeaveStatus;
  approver: string;
  payrollImpact: LeavePayrollImpact;
  appliedAt: string;
  decisionNote: string;
}

interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeCode?: string;
  name: string;
  month: string;
  basic: number;
  hra: number;
  allowance: number;
  conveyance: number;
  bonus: number;
  pf: number;
  pt: number;
  tds: number;
  advance: number;
  workingDays: number;
  payableDays: number;
  lopDays: number;
  lopDeduction: number;
  readiness: PayrollReadiness;
  holdReason: string;
  processedAt: string;
  status: PayrollStatus;
}

interface ExitRecord {
  id: string;
  employeeId: string;
  employeeCode?: string;
  name: string;
  role: string;
  manager: string;
  exitType: ExitType;
  resignationDate: string;
  lastDay: string;
  reason: string;
  notice: "Serving" | "Final Week" | "Completed";
  handover: number;
  handoverOwner: string;
  risk: ExitRisk;
  assets: { laptop: boolean; idCard: boolean; email: boolean };
  clearances: { manager: boolean; hr: boolean; finance: boolean; it: boolean };
  ffStatus: ExitSettlementStatus;
  lifecycleStatus: ExitLifecycleStatus;
  createdAt: string;
  completedAt: string;
}

interface EmployeeFormState {
  id: string;
  name: string;
  role: string;
  team: string;
  manager: string;
  location: string;
  type: string;
  status: EmployeeStatus;
  score: number;
  email: string;
  mobile: string;
  joined: string;
  kycStatus: "Complete" | "Pending";
  assetTag: string;
}

const toneClasses: Record<Tone, string> = {
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  green: "border-green-200 bg-green-50 text-green-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  red: "border-red-200 bg-red-50 text-red-700",
  purple: "border-purple-200 bg-purple-50 text-purple-700",
  slate: "border-slate-200 bg-slate-50 text-slate-600",
  cyan: "border-cyan-200 bg-cyan-50 text-cyan-700",
};

const employeeStatuses: EmployeeStatus[] = ["Active", "Probation", "Training", "On Notice", "Exited", "Archived"];
const attendanceStatuses: AttendanceStatus[] = ["Present", "Late", "Leave", "Missing Punch", "Regularized"];
const leaveStatuses: LeaveStatus[] = ["Pending", "Manager Review", "HR Review", "Approved", "Rejected", "Cancelled"];
const payrollStatuses: PayrollStatus[] = ["Draft", "HR Review", "Finance Review", "Approved", "Paid", "Hold"];
const exitRisks: ExitRisk[] = ["Low", "Medium", "High"];
const teams = ["Product Engineering", "Delivery QA", "CloudOps", "Design Studio", "Support", "HR", "Finance"];

const employeeStatusToApi: Record<EmployeeStatus, HrmsEmployee["status"]> = {
  Active: "active",
  Probation: "probation",
  Training: "training",
  "On Notice": "on_notice",
  Exited: "exited",
  Archived: "archived",
};

const employeeStatusFromApi: Record<HrmsEmployee["status"], EmployeeStatus> = {
  active: "Active",
  probation: "Probation",
  training: "Training",
  on_notice: "On Notice",
  exited: "Exited",
  archived: "Archived",
};

const kycToApi: Record<EmployeeRecord["kycStatus"], HrmsEmployee["kyc_status"]> = {
  Complete: "complete",
  Pending: "pending",
};

const kycFromApi: Record<HrmsEmployee["kyc_status"], EmployeeRecord["kycStatus"]> = {
  complete: "Complete",
  pending: "Pending",
};

const modeToApi: Record<AttendanceRecord["mode"], HrmsAttendance["mode"]> = {
  Office: "office",
  Remote: "remote",
  Hybrid: "hybrid",
};

const leaveTypeToApi: Record<LeaveRecord["type"], HrmsLeave["leave_type"]> = {
  "Earned Leave": "earned_leave",
  "Sick Leave": "sick_leave",
  "Casual Leave": "casual_leave",
  "Work From Home": "work_from_home",
  "Comp Off": "comp_off",
};

const durationToApi: Record<LeaveDuration, HrmsLeave["duration"]> = {
  "Full Day": "full_day",
  "First Half": "first_half",
  "Second Half": "second_half",
};

const exitTypeToApi: Record<ExitType, HrmsExit["exit_type"]> = {
  Resignation: "resignation",
  Termination: "termination",
  "Contract End": "contract_end",
  Retirement: "retirement",
};

const exitRiskToApi: Record<ExitRisk, HrmsExit["risk"]> = {
  Low: "low",
  Medium: "medium",
  High: "high",
};

function mapEmployee(row: HrmsEmployee): EmployeeRecord {
  return {
    id: row.id,
    code: row.employee_id,
    name: row.name,
    role: row.role,
    team: row.team,
    manager: row.manager_name,
    location: row.location,
    type: row.employment_type,
    status: employeeStatusFromApi[row.status],
    score: row.health_score,
    email: row.email,
    mobile: row.mobile,
    joined: row.joined || "",
    kycStatus: kycFromApi[row.kyc_status],
    assetTag: row.asset_tag,
  };
}

function mapAttendance(row: HrmsAttendance): AttendanceRecord {
  return {
    id: row.id,
    employeeId: row.employee,
    employeeCode: row.employee_detail.employee_id,
    name: row.employee_detail.name,
    date: row.date,
    shift: row.shift,
    checkIn: (row.check_in || "").slice(0, 5),
    checkOut: (row.check_out || "").slice(0, 5),
    mode: row.mode_label as AttendanceRecord["mode"],
    status: row.status_label as AttendanceStatus,
    billableHours: Number(row.billable_hours),
    overtimeHours: Number(row.overtime_hours),
    approvalStatus: row.approval_status_label as AttendanceApprovalStatus,
    payrollImpact: row.payroll_impact_label as AttendancePayrollImpact,
    note: row.note,
  };
}

function mapLeave(row: HrmsLeave): LeaveRecord {
  return {
    id: row.id,
    employeeId: row.employee,
    employeeCode: row.employee_detail.employee_id,
    name: row.employee_detail.name,
    type: row.leave_type_label as LeaveRecord["type"],
    startDate: row.start_date,
    endDate: row.end_date,
    days: Number(row.days),
    duration: row.duration_label as LeaveDuration,
    reason: row.reason,
    status: row.status_label as LeaveStatus,
    approver: row.approver,
    payrollImpact: row.payroll_impact_label as LeavePayrollImpact,
    appliedAt: row.applied_at,
    decisionNote: row.decision_note,
  };
}

function mapPayroll(row: HrmsPayroll): PayrollRecord {
  return {
    id: row.id,
    employeeId: row.employee,
    employeeCode: row.employee_detail.employee_id,
    name: row.employee_detail.name,
    month: row.month,
    basic: Number(row.basic),
    hra: Number(row.hra),
    allowance: Number(row.allowance),
    conveyance: Number(row.conveyance),
    bonus: Number(row.bonus),
    pf: Number(row.pf),
    pt: Number(row.pt),
    tds: Number(row.tds),
    advance: Number(row.advance),
    workingDays: row.working_days,
    payableDays: Number(row.payable_days),
    lopDays: Number(row.lop_days),
    lopDeduction: Number(row.lop_deduction),
    readiness: row.readiness_label as PayrollReadiness,
    holdReason: row.hold_reason,
    processedAt: row.processed_at || row.updated_at,
    status: row.status_label as PayrollStatus,
  };
}

function mapExit(row: HrmsExit): ExitRecord {
  return {
    id: row.id,
    employeeId: row.employee,
    employeeCode: row.employee_detail.employee_id,
    name: row.employee_detail.name,
    role: row.employee_detail.role,
    manager: row.employee_detail.manager_name,
    exitType: row.exit_type_label as ExitType,
    resignationDate: row.resignation_date,
    lastDay: row.last_day,
    reason: row.reason,
    notice: row.notice_label as ExitRecord["notice"],
    handover: row.handover,
    handoverOwner: row.handover_owner,
    risk: row.risk_label as ExitRisk,
    assets: { laptop: row.laptop_recovered, idCard: row.id_card_recovered, email: row.access_revoked },
    clearances: { manager: row.manager_clearance, hr: row.hr_clearance, finance: row.finance_clearance, it: row.it_clearance },
    ffStatus: row.ff_status_label as ExitSettlementStatus,
    lifecycleStatus: row.lifecycle_status_label as ExitLifecycleStatus,
    createdAt: row.created_at,
    completedAt: row.completed_at || "",
  };
}

const blankEmployeeForm: EmployeeFormState = {
  id: "",
  name: "",
  role: "",
  team: "Product Engineering",
  manager: "",
  location: "",
  type: "Full-time",
  status: "Active",
  score: 75,
  email: "",
  mobile: "",
  joined: "2026-06-23",
  kycStatus: "Pending",
  assetTag: "",
};

function nextEmployeeCode(employees: EmployeeRecord[]) {
  const year = new Date().getFullYear();
  const prefix = `EMP-${year}-`;
  const maxNumber = employees.reduce((max, employee) => {
    const code = employee.code || employee.id;
    if (!code.startsWith(prefix)) return max;
    const numericPart = Number(code.slice(prefix.length));
    return Number.isFinite(numericPart) ? Math.max(max, numericPart) : max;
  }, 0);
  return `${prefix}${String(maxNumber + 1).padStart(3, "0")}`;
}

function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: Tone }) {
  return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${toneClasses[tone]}`}>{children}</span>;
}

function statusTone(status: string): Tone {
  if (["Active", "Present", "Approved", "Paid", "Completed", "Auto Approved", "Payable", "Ready", "Ready for F&F", "Low", "Cleared", "Regularized"].includes(status)) return "green";
  if (["Probation", "Manager Review", "HR Review", "Medium", "Pending", "Initiated", "Clearance", "Pending Approval", "Finance Review", "Draft", "Late", "Review", "Attendance Review", "Leave Review", "Training", "In Progress"].includes(status)) return "amber";
  if (["Leave", "Hold", "High", "Exited", "Rejected", "Cancelled", "Unpaid", "Non Payable", "Missing Punch", "Archived"].includes(status)) return "red";
  return "blue";
}

function formatCurrency(value: number) {
  return `INR ${value.toLocaleString("en-IN")}`;
}

function csvEscape(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function daysBetween(start: string, end: string) {
  if (!start || !end) return 0;
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diff = Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000) + 1;
  return diff > 0 ? diff : 0;
}

const leaveLimits: Record<Exclude<LeaveRecord["type"], "Work From Home">, number> = {
  "Earned Leave": 18,
  "Sick Leave": 10,
  "Casual Leave": 7,
  "Comp Off": 5,
};

function payrollTotals(row: PayrollRecord) {
  const gross = row.basic + row.hra + row.allowance + row.conveyance + row.bonus;
  const deductions = row.pf + row.pt + row.tds + row.advance + row.lopDeduction;
  return { gross, deductions, net: gross - deductions };
}

function payrollMonthLabel(month: string) {
  if (!month) return "-";
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function ProgressBar({ value, tone = "green" }: { value: number; tone?: "green" | "blue" | "amber" | "red" | "purple" }) {
  const colors = { green: "bg-green-500", blue: "bg-blue-500", amber: "bg-amber-500", red: "bg-red-500", purple: "bg-purple-500" };
  return <div className="h-2 w-full rounded-full bg-slate-100"><div className={`h-2 rounded-full ${colors[tone]}`} style={{ width: `${Math.max(0, Math.min(value, 100))}%` }} /></div>;
}

function MetricCard({ label, value, helper, icon: Icon, tone }: { label: string; value: string; helper: string; icon: ComponentType<{ size?: number }>; tone: Tone }) {
  const iconBg: Record<Tone, string> = {
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
    purple: "bg-purple-100 text-purple-700",
    slate: "bg-slate-100 text-slate-700",
    cyan: "bg-cyan-100 text-cyan-700",
  };
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-black text-primary">{value}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">{helper}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg[tone]}`}><Icon size={20} /></div>
      </div>
    </div>
  );
}

function ActionButton({ icon: Icon, children, label, variant = "outline", onClick, disabled = false }: { icon?: ComponentType<{ size?: number }>; children?: ReactNode; label?: string; variant?: "primary" | "outline" | "accent"; onClick?: () => void; disabled?: boolean }) {
  const styles = {
    primary: "bg-primary text-white border-primary",
    outline: "bg-white text-primary border-border hover:bg-slate-50",
    accent: "bg-accent text-primary border-accent hover:bg-accent/90",
  };
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-black uppercase tracking-widest shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]}`}>
      {Icon ? <Icon size={16} /> : null}
      {children || label}
    </button>
  );
}

function DataTable({ columns, children }: { columns: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1100px] text-left">
        <thead>
          <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
            {columns.map((column) => <th key={column} className="px-4 py-4">{column}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">{children}</tbody>
      </table>
    </div>
  );
}

function FieldGroup({ label, children }: { label: string; children: ReactNode }) {
  return <label className="space-y-2"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>{children}</label>;
}

const inputClass = "h-11 w-full rounded-xl border border-border bg-slate-50 px-3 text-sm font-bold text-primary outline-none focus:ring-4 focus:ring-primary/10";

function EmployeeProfile({ employee, onClose, onEdit }: { employee: EmployeeRecord; onClose: () => void; onEdit?: (employee: EmployeeRecord) => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/40 backdrop-blur-sm">
      <div className="h-full w-full max-w-3xl overflow-y-auto bg-white p-8 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-lg font-black text-white">{employee.name.split(" ").map((part) => part[0]).join("")}</div>
            <div>
              <h3 className="text-2xl font-black text-primary">{employee.name}</h3>
              <p className="mt-1 text-sm font-bold text-slate-500">{employee.code || employee.id} - {employee.role}</p>
              <div className="mt-3 flex flex-wrap gap-2"><Badge tone={statusTone(employee.status)}>{employee.status}</Badge><Badge tone={employee.kycStatus === "Complete" ? "green" : "amber"}>KYC {employee.kycStatus}</Badge></div>
            </div>
          </div>
          <div className="flex gap-2">
            {onEdit ? <ActionButton icon={Edit3} label="Edit" onClick={() => onEdit(employee)} /> : null}
            <ActionButton icon={X} label="Close" onClick={onClose} />
          </div>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
          {[
            ["Email", employee.email],
            ["Mobile", employee.mobile],
            ["Team", employee.team],
            ["Manager", employee.manager],
            ["Location", employee.location],
            ["Employment Type", employee.type],
            ["Joined", employee.joined],
            ["Asset Tag", employee.assetTag],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-border bg-slate-50 p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
              <p className="mt-2 text-sm font-black text-primary">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 rounded-2xl border border-border bg-white p-6">
          <div className="mb-3 flex justify-between text-xs font-black uppercase tracking-widest text-slate-500"><span>HR Health</span><span>{employee.score}%</span></div>
          <ProgressBar value={employee.score} tone={employee.score >= 85 ? "green" : employee.score >= 75 ? "blue" : "amber"} />
        </div>
      </div>
    </div>
  );
}

function EmployeeForm({
  form,
  error,
  onField,
  onSave,
  onCancel,
  editing,
}: {
  form: EmployeeFormState;
  error: string;
  onField: <K extends keyof EmployeeFormState>(field: K, value: EmployeeFormState[K]) => void;
  onSave: () => void;
  onCancel: () => void;
  editing: boolean;
}) {
  return (
    <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-primary">{editing ? "Edit Employee" : "Add Employee"}</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">Maintain one employee master record for attendance, payroll, assets, access and exit lifecycle.</p>
        </div>
        <ActionButton icon={X} label="Close" onClick={onCancel} />
      </div>
      {error ? <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-black text-red-700">{error}</div> : null}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <FieldGroup label="Employee ID"><input value={form.id} readOnly className={`${inputClass} cursor-not-allowed bg-slate-100 text-slate-500`} /></FieldGroup>
        <FieldGroup label="Name"><input value={form.name} onChange={(event) => onField("name", event.target.value)} className={inputClass} /></FieldGroup>
        <FieldGroup label="Role"><input value={form.role} onChange={(event) => onField("role", event.target.value)} className={inputClass} /></FieldGroup>
        <FieldGroup label="Team"><select value={form.team} onChange={(event) => onField("team", event.target.value)} className={inputClass}>{teams.map((team) => <option key={team}>{team}</option>)}</select></FieldGroup>
        <FieldGroup label="Manager"><input value={form.manager} onChange={(event) => onField("manager", event.target.value)} className={inputClass} /></FieldGroup>
        <FieldGroup label="Location"><input value={form.location} onChange={(event) => onField("location", event.target.value)} className={inputClass} /></FieldGroup>
        <FieldGroup label="Type"><select value={form.type} onChange={(event) => onField("type", event.target.value)} className={inputClass}><option>Full-time</option><option>Consultant</option><option>Intern</option><option>Contract</option></select></FieldGroup>
        <FieldGroup label="Status"><select value={form.status} onChange={(event) => onField("status", event.target.value as EmployeeStatus)} className={inputClass}>{employeeStatuses.map((status) => <option key={status}>{status}</option>)}</select></FieldGroup>
        <FieldGroup label="Email"><input value={form.email} onChange={(event) => onField("email", event.target.value)} className={inputClass} /></FieldGroup>
        <FieldGroup label="Mobile"><input value={form.mobile} onChange={(event) => onField("mobile", event.target.value)} className={inputClass} /></FieldGroup>
        <FieldGroup label="Joined"><input type="date" value={form.joined} onChange={(event) => onField("joined", event.target.value)} className={inputClass} /></FieldGroup>
        <FieldGroup label="HR Health %"><input type="number" min={0} max={100} value={form.score} onChange={(event) => onField("score", Math.max(0, Math.min(100, Number(event.target.value) || 0)))} className={inputClass} /></FieldGroup>
        <FieldGroup label="KYC"><select value={form.kycStatus} onChange={(event) => onField("kycStatus", event.target.value as "Complete" | "Pending")} className={inputClass}><option>Complete</option><option>Pending</option></select></FieldGroup>
        <FieldGroup label="Asset Tag"><input value={form.assetTag} onChange={(event) => onField("assetTag", event.target.value)} className={inputClass} /></FieldGroup>
      </div>
      <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
        <ActionButton label="Cancel" onClick={onCancel} />
        <ActionButton label={editing ? "Update Employee" : "Save Employee"} variant="accent" onClick={onSave} />
      </div>
    </section>
  );
}

export default function HRMSHub({ activeView, onAddEmployee, roleCodes }: { activeView: HRMSView; onAddEmployee?: () => void; roleCodes?: string[] | null }) {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [exits, setExits] = useState<ExitRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [employeeForm, setEmployeeForm] = useState<EmployeeFormState>(blankEmployeeForm);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRecord | null>(null);
  const [employeeError, setEmployeeError] = useState("");
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveError, setLeaveError] = useState("");
  const [leaveForm, setLeaveForm] = useState({ employeeId: "", type: "Earned Leave" as LeaveRecord["type"], startDate: "", endDate: "", duration: "Full Day" as LeaveDuration, reason: "" });
  const [showAttendanceForm, setShowAttendanceForm] = useState(false);
  const [attendanceError, setAttendanceError] = useState("");
  const [editingAttendanceId, setEditingAttendanceId] = useState<string | null>(null);
  const [attendanceForm, setAttendanceForm] = useState({ employeeId: "", date: "2026-06-23", checkIn: "", checkOut: "", mode: "Office" as AttendanceRecord["mode"], note: "" });
  const [showPayrollForm, setShowPayrollForm] = useState(false);
  const [payrollError, setPayrollError] = useState("");
  const [payrollForm, setPayrollForm] = useState({ employeeId: "", month: "2026-06", basic: 0, hra: 0, allowance: 0, conveyance: 0, bonus: 0, pf: 0, pt: 200, tds: 0, advance: 0, workingDays: 26 });
  const [showExitForm, setShowExitForm] = useState(false);
  const [exitError, setExitError] = useState("");
  const [exitForm, setExitForm] = useState({ employeeId: "", exitType: "Resignation" as ExitType, resignationDate: "2026-06-24", lastDay: "", handoverOwner: "", reason: "", risk: "Low" as ExitRisk });
  const canManageHrms = useMemo(() => {
    const normalized = new Set((roleCodes || []).map((role) => role.trim().toLowerCase()));
    return normalized.has("super_admin") || normalized.has("admin") || normalized.has("hr");
  }, [roleCodes]);

  const loadHrmsData = async () => {
    try {
      setLoadError("");
      const [employeeRows, attendanceRows, leaveRows, payrollRows, exitRows] = await Promise.all([
        listHrmsEmployees(),
        listHrmsAttendance(),
        listHrmsLeaves(),
        listHrmsPayroll(),
        listHrmsExits(),
      ]);
      setEmployees(employeeRows.map(mapEmployee));
      setAttendance(attendanceRows.map(mapAttendance));
      setLeaves(leaveRows.map(mapLeave));
      setPayroll(payrollRows.map(mapPayroll));
      setExits(exitRows.map(mapExit));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadHrmsData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const title = activeView === "employees" ? "Employee Directory" : activeView === "attendance" ? "Attendance" : activeView === "leave" ? "Leave Management" : activeView === "payroll" ? "Payroll" : "Exit Process";
  const description = activeView === "employees"
    ? "Employee master, org mapping, manager ownership, assets, compliance and people health for software and fintech teams."
    : activeView === "attendance"
      ? "Hybrid attendance tracking with shifts, regularization, missing punch and billable hours."
      : activeView === "leave"
        ? "Leave, WFH, comp-off and approval queue with manager plus HR review workflow."
        : activeView === "payroll"
          ? "Monthly payroll register with gross, deductions, net pay, holds and approval status."
          : "Notice period, handover, asset recovery, access revocation and final settlement control.";

  const filteredEmployees = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return employees.filter((employee) => {
      const matchesSearch = !search || [employee.code, employee.id, employee.name, employee.role, employee.team, employee.manager, employee.email, employee.mobile].join(" ").toLowerCase().includes(search);
      const matchesStatus = statusFilter === "All" || employee.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [employees, searchTerm, statusFilter]);

  const filteredAttendance = useMemo(() => attendance.filter((row) => {
    const search = searchTerm.trim().toLowerCase();
    const matchesSearch = !search || [row.employeeCode, row.employeeId, row.name, row.date, row.mode, row.status, row.approvalStatus, row.payrollImpact, row.note].join(" ").toLowerCase().includes(search);
    const matchesStatus = statusFilter === "All" || row.status === statusFilter || row.approvalStatus === statusFilter || row.payrollImpact === statusFilter;
    return matchesSearch && matchesStatus;
  }), [attendance, searchTerm, statusFilter]);

  const filteredLeaves = useMemo(() => leaves.filter((row) => {
    const search = searchTerm.trim().toLowerCase();
    const matchesSearch = !search || [row.employeeCode, row.employeeId, row.name, row.type, row.duration, row.reason, row.approver, row.status, row.payrollImpact].join(" ").toLowerCase().includes(search);
    const matchesStatus = statusFilter === "All" || row.status === statusFilter || row.payrollImpact === statusFilter;
    return matchesSearch && matchesStatus;
  }), [leaves, searchTerm, statusFilter]);

  const filteredPayroll = useMemo(() => payroll.filter((row) => {
    const search = searchTerm.trim().toLowerCase();
    const matchesSearch = !search || [row.employeeCode, row.employeeId, row.name, payrollMonthLabel(row.month), row.status, row.readiness, row.holdReason].join(" ").toLowerCase().includes(search);
    const matchesStatus = statusFilter === "All" || row.status === statusFilter || row.readiness === statusFilter;
    return matchesSearch && matchesStatus;
  }), [payroll, searchTerm, statusFilter]);

  const filteredExits = useMemo(() => exits.filter((row) => {
    const search = searchTerm.trim().toLowerCase();
    const matchesSearch = !search || [row.employeeCode, row.employeeId, row.name, row.role, row.manager, row.exitType, row.handoverOwner, row.reason, row.risk, row.ffStatus, row.lifecycleStatus].join(" ").toLowerCase().includes(search);
    const matchesStatus = statusFilter === "All" || row.ffStatus === statusFilter || row.risk === statusFilter || row.lifecycleStatus === statusFilter;
    return matchesSearch && matchesStatus;
  }), [exits, searchTerm, statusFilter]);

  const exportRows = () => {
    const rows: Array<Array<string | number>> = activeView === "employees"
      ? [["ID", "Name", "Role", "Team", "Manager", "Location", "Type", "Status", "Score", "Email", "Mobile", "Joined"], ...filteredEmployees.map((employee) => [employee.code || employee.id, employee.name, employee.role, employee.team, employee.manager, employee.location, employee.type, employee.status, employee.score, employee.email, employee.mobile, employee.joined])]
      : activeView === "attendance"
        ? [["ID", "Employee ID", "Name", "Date", "Shift", "Check In", "Check Out", "Mode", "Status", "Approval", "Payroll Impact", "Billable Hours", "Overtime Hours", "Note"], ...filteredAttendance.map((row) => [row.id, row.employeeCode || row.employeeId, row.name, row.date, row.shift, row.checkIn, row.checkOut, row.mode, row.status, row.approvalStatus, row.payrollImpact, row.billableHours, row.overtimeHours, row.note])]
        : activeView === "leave"
          ? [["ID", "Employee ID", "Name", "Type", "Duration", "Start", "End", "Days", "Reason", "Status", "Approver", "Payroll Impact", "Applied At", "Decision Note"], ...filteredLeaves.map((row) => [row.id, row.employeeCode || row.employeeId, row.name, row.type, row.duration, row.startDate, row.endDate, row.days, row.reason, row.status, row.approver, row.payrollImpact, row.appliedAt, row.decisionNote])]
          : activeView === "payroll"
            ? [["ID", "Employee ID", "Name", "Month", "Working Days", "Payable Days", "LOP Days", "LOP Deduction", "Gross", "Deductions", "Net", "Readiness", "Hold Reason", "Status", "Processed At"], ...filteredPayroll.map((row) => { const totals = payrollTotals(row); return [row.id, row.employeeCode || row.employeeId, row.name, payrollMonthLabel(row.month), row.workingDays, row.payableDays, row.lopDays, row.lopDeduction, totals.gross, totals.deductions, totals.net, row.readiness, row.holdReason, row.status, row.processedAt]; })]
            : [["ID", "Employee ID", "Name", "Role", "Manager", "Exit Type", "Resignation Date", "Last Day", "Reason", "Notice", "Handover", "Handover Owner", "Risk", "Manager Clearance", "HR Clearance", "Finance Clearance", "IT Clearance", "Laptop", "ID Card", "Access Revoked", "F&F", "Lifecycle", "Created At", "Completed At"], ...filteredExits.map((row) => [row.id, row.employeeCode || row.employeeId, row.name, row.role, row.manager, row.exitType, row.resignationDate, row.lastDay, row.reason, row.notice, row.handover, row.handoverOwner, row.risk, row.clearances.manager ? "Cleared" : "Pending", row.clearances.hr ? "Cleared" : "Pending", row.clearances.finance ? "Cleared" : "Pending", row.clearances.it ? "Cleared" : "Pending", row.assets.laptop ? "Recovered" : "Pending", row.assets.idCard ? "Recovered" : "Pending", row.assets.email ? "Revoked" : "Pending", row.ffStatus, row.lifecycleStatus, row.createdAt, row.completedAt])];
    const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `hrms-${activeView}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
  };

  const openEmployeeForm = (employee?: EmployeeRecord) => {
    if (employee) {
      setEmployeeForm({ ...employee, id: employee.code || employee.id });
      setEditingEmployeeId(employee.id);
    } else {
      setEmployeeForm({ ...blankEmployeeForm, id: nextEmployeeCode(employees) });
      setEditingEmployeeId(null);
      if (activeView === "employees" && onAddEmployee) onAddEmployee();
    }
    setEmployeeError("");
    setShowEmployeeForm(true);
  };

  const validateEmployee = () => {
    if (!employeeForm.id.trim() || !employeeForm.name.trim() || !employeeForm.role.trim() || !employeeForm.team.trim() || !employeeForm.manager.trim() || !employeeForm.email.trim() || !employeeForm.mobile.trim()) {
      setEmployeeError("Employee ID, name, role, team, manager, email and mobile are required.");
      return false;
    }
    if (employees.some((employee) => employee.code === employeeForm.id && employee.id !== editingEmployeeId)) {
      setEmployeeError("Employee ID already exists.");
      return false;
    }
    if (!employeeForm.email.includes("@")) {
      setEmployeeError("Enter a valid email address.");
      return false;
    }
    return true;
  };

  const saveEmployee = async () => {
    if (!validateEmployee()) return;
    try {
      const payload = {
        employee_id: employeeForm.id.trim(),
        name: employeeForm.name.trim(),
        role: employeeForm.role.trim(),
        team: employeeForm.team.trim(),
        manager_name: employeeForm.manager.trim(),
        location: employeeForm.location.trim(),
        employment_type: employeeForm.type,
        status: employeeStatusToApi[employeeForm.status],
        health_score: employeeForm.score,
        email: employeeForm.email.trim(),
        mobile: employeeForm.mobile.trim(),
        joined: employeeForm.joined || null,
        kyc_status: kycToApi[employeeForm.kycStatus],
        asset_tag: employeeForm.assetTag.trim(),
      };
      if (editingEmployeeId) {
        await updateHrmsEmployee(editingEmployeeId, payload);
      } else {
        await createHrmsEmployee(payload);
      }
      await loadHrmsData();
      setShowEmployeeForm(false);
      setEditingEmployeeId(null);
    } catch (error) {
      setEmployeeError(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  const offboardEmployee = async (employee: EmployeeRecord) => {
    try {
      if (!exits.some((exit) => exit.employeeId === employee.id && !["Completed", "Cancelled"].includes(exit.lifecycleStatus))) {
        await createHrmsExit({
          employee_id: employee.id,
          exit_type: "resignation",
          resignation_date: new Date().toISOString().slice(0, 10),
          last_day: new Date(Date.now() + 29 * 86400000).toISOString().slice(0, 10),
          handover_owner: employee.manager || "HR Team",
          reason: "Started from employee directory",
          risk: "medium",
        });
      }
      await loadHrmsData();
    } catch (error) {
      setEmployeeError(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  const archiveEmployee = async (employee: EmployeeRecord) => {
    try {
      await archiveHrmsEmployee(employee.id);
      await loadHrmsData();
    } catch (error) {
      setEmployeeError(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  const openAttendanceForm = (row?: AttendanceRecord) => {
    setAttendanceError("");
    setEditingAttendanceId(row?.id ?? null);
    setAttendanceForm(row ? {
      employeeId: row.employeeId,
      date: row.date,
      checkIn: row.checkIn,
      checkOut: row.checkOut,
      mode: row.mode,
      note: row.note,
    } : {
      employeeId: "",
      date: "2026-06-23",
      checkIn: "",
      checkOut: "",
      mode: "Office",
      note: "",
    });
    setShowAttendanceForm(true);
  };

  const submitAttendance = async () => {
    const employee = employees.find((item) => item.id === attendanceForm.employeeId);
    if (!employee || !attendanceForm.date || !attendanceForm.checkIn || !attendanceForm.checkOut || !attendanceForm.note.trim()) {
      setAttendanceError("Employee, date, check-in, check-out and reason are required.");
      return;
    }
    if (attendanceForm.checkOut <= attendanceForm.checkIn) {
      setAttendanceError("Check-out must be after check-in.");
      return;
    }
    if (attendance.some((row) => row.employeeId === employee.id && row.date === attendanceForm.date && row.id !== editingAttendanceId)) {
      setAttendanceError("Attendance already exists for this employee and date. Regularize the existing row instead of creating a duplicate.");
      return;
    }
    try {
      const payload = {
        employee_id: employee.id,
        date: attendanceForm.date,
        check_in: attendanceForm.checkIn,
        check_out: attendanceForm.checkOut,
        mode: modeToApi[attendanceForm.mode],
        note: attendanceForm.note.trim(),
      };
      if (editingAttendanceId) {
        await updateHrmsAttendance(editingAttendanceId, payload);
      } else {
        await createHrmsAttendance(payload);
      }
      await loadHrmsData();
      setShowAttendanceForm(false);
      setAttendanceError("");
      setEditingAttendanceId(null);
    } catch (error) {
      setAttendanceError(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  const submitLeave = async () => {
    const employee = employees.find((item) => item.id === leaveForm.employeeId);
    const days = leaveForm.duration === "Full Day" ? daysBetween(leaveForm.startDate, leaveForm.endDate) : 0.5;
    if (!employee || !leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason.trim()) {
      setLeaveError("Employee, dates and reason are required.");
      return;
    }
    if (leaveForm.duration !== "Full Day" && leaveForm.startDate !== leaveForm.endDate) {
      setLeaveError("Half-day leave must have the same start and end date.");
      return;
    }
    if (days <= 0) {
      setLeaveError("End date must be same or after start date.");
      return;
    }
    const overlaps = leaves.some((leave) => leave.employeeId === employee.id
      && !["Rejected", "Cancelled"].includes(leave.status)
      && leave.startDate <= leaveForm.endDate
      && leave.endDate >= leaveForm.startDate);
    if (overlaps) {
      setLeaveError("An active leave or WFH request already overlaps this date range.");
      return;
    }
    if (leaveForm.type !== "Work From Home") {
      const used = leaves
        .filter((leave) => leave.employeeId === employee.id && leave.type === leaveForm.type && leave.status === "Approved")
        .reduce((sum, leave) => sum + leave.days, 0);
      const remaining = leaveLimits[leaveForm.type] - used;
      if (days > remaining) {
        setLeaveError(`Only ${remaining} day(s) of ${leaveForm.type} are available.`);
        return;
      }
    }
    try {
      await createHrmsLeave({
        employee_id: employee.id,
        leave_type: leaveTypeToApi[leaveForm.type],
        start_date: leaveForm.startDate,
        end_date: leaveForm.endDate,
        duration: durationToApi[leaveForm.duration],
        reason: leaveForm.reason.trim(),
      });
      await loadHrmsData();
      setShowLeaveForm(false);
      setLeaveError("");
      setLeaveForm({ employeeId: "", type: "Earned Leave", startDate: "", endDate: "", duration: "Full Day", reason: "" });
    } catch (error) {
      setLeaveError(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  const updateLeaveStatus = async (id: string, action: "advance" | "reject" | "cancel") => {
    try {
      await runHrmsLeaveAction(id, action);
      await loadHrmsData();
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  const submitPayroll = async () => {
    const employee = employees.find((item) => item.id === payrollForm.employeeId);
    if (!employee || !payrollForm.month.trim()) {
      setPayrollError("Employee and month are required.");
      return;
    }
    if (payroll.some((row) => row.employeeId === employee.id && row.month === payrollForm.month)) {
      setPayrollError("Payroll already exists for this employee and month.");
      return;
    }
    if (payrollForm.workingDays <= 0 || payrollForm.workingDays > 31) {
      setPayrollError("Working days must be between 1 and 31.");
      return;
    }
    const gross = payrollForm.basic + payrollForm.hra + payrollForm.allowance + payrollForm.conveyance + payrollForm.bonus;
    const deductions = payrollForm.pf + payrollForm.pt + payrollForm.tds + payrollForm.advance;
    if (gross <= 0) {
      setPayrollError("Gross salary must be greater than zero.");
      return;
    }
    if (deductions > gross) {
      setPayrollError("Deductions cannot exceed gross salary.");
      return;
    }
    try {
      await createHrmsPayroll({
        employee_id: employee.id,
        month: payrollForm.month,
        basic: String(payrollForm.basic),
        hra: String(payrollForm.hra),
        allowance: String(payrollForm.allowance),
        conveyance: String(payrollForm.conveyance),
        bonus: String(payrollForm.bonus),
        pf: String(payrollForm.pf),
        pt: String(payrollForm.pt),
        tds: String(payrollForm.tds),
        advance: String(payrollForm.advance),
        working_days: payrollForm.workingDays,
      });
      await loadHrmsData();
      setShowPayrollForm(false);
      setPayrollError("");
      setPayrollForm({ employeeId: "", month: "2026-06", basic: 0, hra: 0, allowance: 0, conveyance: 0, bonus: 0, pf: 0, pt: 200, tds: 0, advance: 0, workingDays: 26 });
    } catch (error) {
      setPayrollError(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  const updatePayrollStatus = async (id: string, action: "advance" | "hold" | "release" | "recheck") => {
    try {
      await runHrmsPayrollAction(id, action);
      await loadHrmsData();
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  const submitExit = async () => {
    const employee = employees.find((item) => item.id === exitForm.employeeId);
    if (!employee || !exitForm.resignationDate || !exitForm.lastDay || !exitForm.handoverOwner.trim() || !exitForm.reason.trim()) {
      setExitError("Employee, exit type, dates, handover owner and reason are required.");
      return;
    }
    if (exitForm.lastDay < exitForm.resignationDate) {
      setExitError("Last working day cannot be before the resignation/exit initiation date.");
      return;
    }
    if (exits.some((exit) => exit.employeeId === employee.id && !["Completed", "Cancelled"].includes(exit.lifecycleStatus))) {
      setExitError("An active exit process already exists for this employee.");
      return;
    }
    try {
      await createHrmsExit({
        employee_id: employee.id,
        exit_type: exitTypeToApi[exitForm.exitType],
        resignation_date: exitForm.resignationDate,
        last_day: exitForm.lastDay,
        handover_owner: exitForm.handoverOwner.trim(),
        reason: exitForm.reason.trim(),
        risk: exitRiskToApi[exitForm.risk],
      });
      await loadHrmsData();
      setShowExitForm(false);
      setExitError("");
      setExitForm({ employeeId: "", exitType: "Resignation", resignationDate: "2026-06-24", lastDay: "", handoverOwner: "", reason: "", risk: "Low" });
    } catch (error) {
      setExitError(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  const completeExit = async (id: string) => {
    try {
      await runHrmsExitAction(id, "complete");
      await loadHrmsData();
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  const cancelExit = async (id: string) => {
    try {
      await runHrmsExitAction(id, "cancel");
      await loadHrmsData();
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  const updateExitControl = async (id: string, payload: Parameters<typeof updateHrmsExit>[1]) => {
    try {
      await updateHrmsExit(id, payload);
      await loadHrmsData();
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  const statusOptions = activeView === "employees" ? employeeStatuses : activeView === "attendance" ? [...attendanceStatuses, "Auto Approved", "Pending Approval", "Approved", "Rejected", "Payable", "Non Payable", "Review"] : activeView === "leave" ? [...leaveStatuses, "Paid", "Unpaid", "No Impact"] : activeView === "payroll" ? [...payrollStatuses, "Ready", "Attendance Review", "Leave Review"] : ["Pending", "In Progress", "Cleared", "Initiated", "Clearance", "Ready for F&F", "Completed", "Cancelled", ...exitRisks];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-lg">
            {activeView === "employees" ? <Users size={26} /> : activeView === "attendance" ? <Fingerprint size={26} /> : activeView === "leave" ? <Plane size={26} /> : activeView === "payroll" ? <BadgeIndianRupee size={26} /> : <LogOut size={26} />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-3xl font-black tracking-tight text-[#1E293B]">{title}</h2>
              <Badge tone="green">People Operations</Badge>
            </div>
            <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-slate-500">{description}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <ActionButton icon={Download} label="Export" onClick={exportRows} />
          <ActionButton icon={Filter} label="Clear Filters" onClick={clearFilters} />
          {canManageHrms ? (
            <ActionButton
              icon={Plus}
              variant="accent"
              onClick={() => {
                if (activeView === "employees") openEmployeeForm();
                if (activeView === "attendance") openAttendanceForm();
                if (activeView === "leave") { setLeaveError(""); setShowLeaveForm(true); }
                if (activeView === "payroll") { setPayrollError(""); setShowPayrollForm(true); }
                if (activeView === "exit") { setExitError(""); setShowExitForm(true); }
              }}
            >
              {activeView === "employees" ? "Add Employee" : activeView === "attendance" ? "Regularize" : activeView === "leave" ? "Apply Leave" : activeView === "payroll" ? "New Payroll" : "Start Exit"}
            </ActionButton>
          ) : null}
        </div>
      </div>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder={`Search ${title.toLowerCase()}...`} className="h-11 w-full rounded-xl border border-border bg-slate-50 pl-10 pr-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
          </div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={inputClass}>
            <option>All</option>
            {statusOptions.map((status) => <option key={status}>{status}</option>)}
          </select>
        </div>
      </section>

      {loadError ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700">{loadError}</div> : null}
      {isLoading ? <div className="rounded-2xl border border-border bg-white p-6 text-sm font-black text-slate-500 shadow-sm">Loading HRMS records...</div> : null}

      {activeView === "employees" ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Directory Records" value={String(employees.filter((employee) => employee.status !== "Archived").length)} helper="Active master records" icon={Users} tone="blue" />
            <MetricCard label="Probation" value={String(employees.filter((employee) => employee.status === "Probation").length)} helper="Review required" icon={UserCheck} tone="amber" />
            <MetricCard label="KYC Pending" value={String(employees.filter((employee) => employee.kycStatus === "Pending").length)} helper="Compliance queue" icon={ShieldCheck} tone="red" />
            <MetricCard label="On Notice" value={String(employees.filter((employee) => employee.status === "On Notice").length)} helper="Exit linked" icon={UserMinus} tone="purple" />
          </div>
          {showEmployeeForm && canManageHrms ? <EmployeeForm form={employeeForm} error={employeeError} editing={Boolean(editingEmployeeId)} onField={(field, value) => setEmployeeForm((current) => ({ ...current, [field]: value }))} onSave={saveEmployee} onCancel={() => setShowEmployeeForm(false)} /> : null}
          <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <DataTable columns={["Employee", "Role / Team", "Manager", "Location", "Type", "KYC", "HR Health", "Status", "Actions"]}>
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-slate-50">
                  <td className="px-4 py-5 font-black text-primary">{employee.name}<br/><span className="text-[10px] text-slate-400">{employee.code || employee.id}</span></td>
                  <td className="px-4 py-5">{employee.role}<br/><span className="text-[10px] font-black uppercase text-slate-400">{employee.team}</span></td>
                  <td className="px-4 py-5">{employee.manager}</td>
                  <td className="px-4 py-5">{employee.location}</td>
                  <td className="px-4 py-5">{employee.type}</td>
                  <td className="px-4 py-5"><Badge tone={employee.kycStatus === "Complete" ? "green" : "amber"}>{employee.kycStatus}</Badge></td>
                  <td className="px-4 py-5 min-w-32"><ProgressBar value={employee.score} tone={employee.score >= 85 ? "green" : employee.score >= 75 ? "blue" : "amber"} /></td>
                  <td className="px-4 py-5"><Badge tone={statusTone(employee.status)}>{employee.status}</Badge></td>
                  <td className="px-4 py-5"><div className="flex flex-wrap gap-2"><ActionButton icon={Eye} label="View" onClick={() => setSelectedEmployee(employee)} />{canManageHrms ? <><ActionButton icon={Edit3} label="Edit" onClick={() => openEmployeeForm(employee)} /><ActionButton icon={UserMinus} label="Offboard" onClick={() => offboardEmployee(employee)} disabled={employee.status === "Exited" || employee.status === "Archived"} /><ActionButton label="Archive" onClick={() => archiveEmployee(employee)} disabled={employee.status === "Archived"} /></> : null}</div></td>
                </tr>
              ))}
            </DataTable>
          </section>
        </div>
      ) : null}

      {activeView === "attendance" ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Present" value={String(attendance.filter((row) => row.status === "Present" || row.status === "Regularized").length)} helper="Today tracked" icon={Fingerprint} tone="green" />
            <MetricCard label="Pending Approval" value={String(attendance.filter((row) => row.approvalStatus === "Pending Approval").length)} helper="Manager/HR queue" icon={AlertTriangle} tone="amber" />
            <MetricCard label="Payroll Review" value={String(attendance.filter((row) => row.payrollImpact === "Review").length)} helper="Salary lock blockers" icon={Calendar} tone="red" />
            <MetricCard label="Billable Hours" value={attendance.reduce((sum, row) => sum + row.billableHours, 0).toFixed(1)} helper={`${attendance.reduce((sum, row) => sum + row.overtimeHours, 0).toFixed(1)} OT hours`} icon={BriefcaseBusiness} tone="blue" />
          </div>
          {showAttendanceForm && canManageHrms ? (
            <FormPanel title={editingAttendanceId ? "Update Attendance Regularization" : "Regularize Attendance"} error={attendanceError} onCancel={() => { setShowAttendanceForm(false); setEditingAttendanceId(null); }} onSave={submitAttendance}>
              <FieldGroup label="Employee"><select value={attendanceForm.employeeId} disabled={Boolean(editingAttendanceId)} onChange={(event) => setAttendanceForm((current) => ({ ...current, employeeId: event.target.value }))} className={inputClass}><option value="">Select Employee...</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.code || employee.id} - {employee.name}</option>)}</select></FieldGroup>
              <FieldGroup label="Date"><input type="date" value={attendanceForm.date} onChange={(event) => setAttendanceForm((current) => ({ ...current, date: event.target.value }))} className={inputClass} /></FieldGroup>
              <FieldGroup label="Check In"><input type="time" value={attendanceForm.checkIn} onChange={(event) => setAttendanceForm((current) => ({ ...current, checkIn: event.target.value }))} className={inputClass} /></FieldGroup>
              <FieldGroup label="Check Out"><input type="time" value={attendanceForm.checkOut} onChange={(event) => setAttendanceForm((current) => ({ ...current, checkOut: event.target.value }))} className={inputClass} /></FieldGroup>
              <FieldGroup label="Mode"><select value={attendanceForm.mode} onChange={(event) => setAttendanceForm((current) => ({ ...current, mode: event.target.value as AttendanceRecord["mode"] }))} className={inputClass}><option>Office</option><option>Remote</option><option>Hybrid</option></select></FieldGroup>
              <FieldGroup label="Reason"><input value={attendanceForm.note} onChange={(event) => setAttendanceForm((current) => ({ ...current, note: event.target.value }))} className={inputClass} /></FieldGroup>
            </FormPanel>
          ) : null}
          <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <DataTable columns={["Employee", "Date", "Punch", "Mode", "Status", "Approval", "Payroll", "Hours", "Note", "Actions"]}>
              {filteredAttendance.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-4 py-5 font-black text-primary">{row.name}<br/><span className="text-[10px] text-slate-400">{row.employeeCode || row.employeeId}</span></td>
                  <td className="px-4 py-5">{row.date}<br/><span className="text-[10px] font-black uppercase text-slate-400">{row.shift}</span></td>
                  <td className="px-4 py-5">{row.checkIn || "-"} to {row.checkOut || "-"}</td>
                  <td className="px-4 py-5">{row.mode}</td>
                  <td className="px-4 py-5"><Badge tone={statusTone(row.status)}>{row.status}</Badge></td>
                  <td className="px-4 py-5"><Badge tone={statusTone(row.approvalStatus)}>{row.approvalStatus}</Badge></td>
                  <td className="px-4 py-5"><Badge tone={statusTone(row.payrollImpact)}>{row.payrollImpact}</Badge></td>
                  <td className="px-4 py-5 font-black text-primary">{row.billableHours}h<br/><span className="text-[10px] text-slate-400">OT {row.overtimeHours}h</span></td>
                  <td className="px-4 py-5 max-w-xs">{row.note}</td>
                  <td className="px-4 py-5">
                    {canManageHrms ? <div className="flex flex-wrap gap-2">
                      <ActionButton
                        icon={Edit3}
                        label="Regularize"
                        onClick={() => openAttendanceForm(row)}
                        disabled={row.approvalStatus === "Approved" || row.approvalStatus === "Auto Approved"}
                      />
                      <ActionButton
                        label="Approve"
                        onClick={async () => {
                          await runHrmsAttendanceAction(row.id, "approve");
                          await loadHrmsData();
                        }}
                        disabled={row.approvalStatus === "Approved" || row.approvalStatus === "Auto Approved"}
                      />
                      <ActionButton
                        label="Reject"
                        onClick={async () => {
                          await runHrmsAttendanceAction(row.id, "reject");
                          await loadHrmsData();
                        }}
                        disabled={["Rejected", "Approved", "Auto Approved"].includes(row.approvalStatus)}
                      />
                    </div> : null}
                  </td>
                </tr>
              ))}
            </DataTable>
          </section>
        </div>
      ) : null}

      {activeView === "leave" ? (
        <LeaveSection leaves={filteredLeaves} allLeaves={leaves} employees={employees} showForm={showLeaveForm && canManageHrms} leaveForm={leaveForm} error={leaveError} setLeaveForm={setLeaveForm} setShowForm={setShowLeaveForm} submitLeave={submitLeave} updateLeaveStatus={updateLeaveStatus} canManage={canManageHrms} />
      ) : null}

      {activeView === "payroll" ? (
        <PayrollSection payroll={filteredPayroll} allPayroll={payroll} employees={employees} showForm={showPayrollForm && canManageHrms} payrollForm={payrollForm} error={payrollError} setPayrollForm={setPayrollForm} setShowForm={setShowPayrollForm} submitPayroll={submitPayroll} updatePayrollStatus={updatePayrollStatus} canManage={canManageHrms} />
      ) : null}

      {activeView === "exit" ? (
        <ExitSection exits={filteredExits} allExits={exits} employees={employees} showForm={showExitForm && canManageHrms} exitForm={exitForm} error={exitError} setExitForm={setExitForm} setShowForm={setShowExitForm} submitExit={submitExit} updateExitControl={updateExitControl} completeExit={completeExit} cancelExit={cancelExit} canManage={canManageHrms} />
      ) : null}

      {selectedEmployee ? <EmployeeProfile employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} onEdit={canManageHrms ? (employee) => { setSelectedEmployee(null); openEmployeeForm(employee); } : undefined} /> : null}

      <section className="rounded-2xl border border-border bg-primary p-6 text-white shadow-sm">
        <div className="flex items-center gap-3"><ShieldCheck className="text-accent" size={24} /><h3 className="text-lg font-black">People Operations Controls</h3></div>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          {[
            ["Single employee master", "Employee data connects attendance, payroll, assets, project allocation and access."],
            ["Payroll lock before payout", "Attendance, leave, exits and deductions are reconciled before salary release."],
            ["Access tied to lifecycle", "Joining, role change and exit trigger system access and asset controls."],
            ["Manager plus HR ownership", "Approvals include clear status, owner and audit-ready export."],
          ].map(([control, detail]) => <div key={control} className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-sm font-black">{control}</p><p className="mt-2 text-xs font-semibold leading-5 text-slate-300">{detail}</p></div>)}
        </div>
      </section>
    </div>
  );
}

function FormPanel({ title, error, children, onCancel, onSave }: { title: string; error: string; children: ReactNode; onCancel: () => void; onSave: () => void }) {
  return (
    <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start justify-between"><h3 className="text-lg font-black text-primary">{title}</h3><ActionButton icon={X} label="Close" onClick={onCancel} /></div>
      {error ? <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-black text-red-700">{error}</div> : null}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">{children}</div>
      <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5"><ActionButton label="Cancel" onClick={onCancel} /><ActionButton label="Save" variant="accent" onClick={onSave} /></div>
    </section>
  );
}

function LeaveSection({ leaves, allLeaves, employees, showForm, leaveForm, error, setLeaveForm, setShowForm, submitLeave, updateLeaveStatus, canManage }: { leaves: LeaveRecord[]; allLeaves: LeaveRecord[]; employees: EmployeeRecord[]; showForm: boolean; leaveForm: { employeeId: string; type: LeaveRecord["type"]; startDate: string; endDate: string; duration: LeaveDuration; reason: string }; error: string; setLeaveForm: React.Dispatch<React.SetStateAction<{ employeeId: string; type: LeaveRecord["type"]; startDate: string; endDate: string; duration: LeaveDuration; reason: string }>>; setShowForm: (value: boolean) => void; submitLeave: () => void; updateLeaveStatus: (id: string, action: "advance" | "reject" | "cancel") => void; canManage: boolean }) {
  const approvedDays = allLeaves.filter((leave) => leave.status === "Approved" && leave.type !== "Work From Home").reduce((sum, leave) => sum + leave.days, 0);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Pending" value={String(allLeaves.filter((leave) => ["Pending", "Manager Review", "HR Review"].includes(leave.status)).length)} helper="Approval queue" icon={Plane} tone="amber" />
        <MetricCard label="Approved" value={String(allLeaves.filter((leave) => leave.status === "Approved").length)} helper="Current cycle" icon={CheckCircle2} tone="green" />
        <MetricCard label="Paid Leave Days" value={String(approvedDays)} helper="Approved payroll impact" icon={Calendar} tone="blue" />
        <MetricCard label="Unpaid / Rejected" value={String(allLeaves.filter((leave) => leave.payrollImpact === "Unpaid" || leave.status === "Rejected").length)} helper="Payroll review" icon={AlertTriangle} tone="red" />
      </div>
      {showForm ? <FormPanel title="Apply Leave" error={error} onCancel={() => setShowForm(false)} onSave={submitLeave}>
        <FieldGroup label="Employee"><select value={leaveForm.employeeId} onChange={(event) => setLeaveForm((current) => ({ ...current, employeeId: event.target.value }))} className={inputClass}><option value="">Select Employee...</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.code || employee.id} - {employee.name}</option>)}</select></FieldGroup>
        <FieldGroup label="Type"><select value={leaveForm.type} onChange={(event) => setLeaveForm((current) => ({ ...current, type: event.target.value as LeaveRecord["type"] }))} className={inputClass}><option>Earned Leave</option><option>Sick Leave</option><option>Casual Leave</option><option>Work From Home</option><option>Comp Off</option></select></FieldGroup>
        <FieldGroup label="Duration"><select value={leaveForm.duration} onChange={(event) => setLeaveForm((current) => ({ ...current, duration: event.target.value as LeaveDuration }))} className={inputClass}><option>Full Day</option><option>First Half</option><option>Second Half</option></select></FieldGroup>
        <FieldGroup label="Start"><input type="date" value={leaveForm.startDate} onChange={(event) => setLeaveForm((current) => ({ ...current, startDate: event.target.value }))} className={inputClass} /></FieldGroup>
        <FieldGroup label="End"><input type="date" value={leaveForm.endDate} onChange={(event) => setLeaveForm((current) => ({ ...current, endDate: event.target.value }))} className={inputClass} /></FieldGroup>
        <FieldGroup label="Reason"><input value={leaveForm.reason} onChange={(event) => setLeaveForm((current) => ({ ...current, reason: event.target.value }))} className={inputClass} /></FieldGroup>
      </FormPanel> : null}
      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <DataTable columns={["Employee", "Leave", "Dates", "Days", "Reason / Decision", "Current Owner", "Payroll", "Status", "Actions"]}>
          {leaves.map((leave) => (
            <tr key={leave.id} className="hover:bg-slate-50">
              <td className="px-4 py-5 font-black text-primary">{leave.name}<br/><span className="text-[10px] text-slate-400">{leave.employeeCode || leave.employeeId}</span></td>
              <td className="px-4 py-5">{leave.type}<br/><span className="text-[10px] font-black uppercase text-slate-400">{leave.duration}</span></td>
              <td className="px-4 py-5">{leave.startDate} to {leave.endDate}<br/><span className="text-[10px] text-slate-400">Applied {new Date(leave.appliedAt).toLocaleDateString("en-IN")}</span></td>
              <td className="px-4 py-5 font-black text-primary">{leave.days}</td>
              <td className="px-4 py-5 max-w-xs">{leave.reason}{leave.decisionNote ? <><br/><span className="text-[10px] font-bold text-slate-400">{leave.decisionNote}</span></> : null}</td>
              <td className="px-4 py-5">{leave.approver}</td>
              <td className="px-4 py-5"><Badge tone={statusTone(leave.payrollImpact)}>{leave.payrollImpact}</Badge></td>
              <td className="px-4 py-5"><Badge tone={statusTone(leave.status)}>{leave.status}</Badge></td>
              <td className="px-4 py-5">
                {canManage ? <div className="flex flex-wrap gap-2">
                  <ActionButton label={leave.status === "Manager Review" || leave.status === "Pending" ? "Manager Approve" : "HR Approve"} onClick={() => updateLeaveStatus(leave.id, "advance")} disabled={!["Pending", "Manager Review", "HR Review"].includes(leave.status)} />
                  <ActionButton label="Reject" onClick={() => updateLeaveStatus(leave.id, "reject")} disabled={!["Pending", "Manager Review", "HR Review"].includes(leave.status)} />
                  <ActionButton label="Cancel" onClick={() => updateLeaveStatus(leave.id, "cancel")} disabled={["Approved", "Rejected", "Cancelled"].includes(leave.status)} />
                </div> : null}
              </td>
            </tr>
          ))}
        </DataTable>
      </section>
    </div>
  );
}

function PayrollSection({ payroll, allPayroll, employees, showForm, payrollForm, error, setPayrollForm, setShowForm, submitPayroll, updatePayrollStatus, canManage }: { payroll: PayrollRecord[]; allPayroll: PayrollRecord[]; employees: EmployeeRecord[]; showForm: boolean; payrollForm: { employeeId: string; month: string; basic: number; hra: number; allowance: number; conveyance: number; bonus: number; pf: number; pt: number; tds: number; advance: number; workingDays: number }; error: string; setPayrollForm: React.Dispatch<React.SetStateAction<{ employeeId: string; month: string; basic: number; hra: number; allowance: number; conveyance: number; bonus: number; pf: number; pt: number; tds: number; advance: number; workingDays: number }>>; setShowForm: (value: boolean) => void; submitPayroll: () => void; updatePayrollStatus: (id: string, action: "advance" | "hold" | "release" | "recheck") => void; canManage: boolean }) {
  const totals = allPayroll.reduce((sum, row) => {
    const payrollTotal = payrollTotals(row);
    return { gross: sum.gross + payrollTotal.gross, deductions: sum.deductions + payrollTotal.deductions, net: sum.net + payrollTotal.net };
  }, { gross: 0, deductions: 0, net: 0 });
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Gross Payroll" value={formatCurrency(totals.gross)} helper={`${allPayroll.length} records`} icon={BadgeIndianRupee} tone="blue" />
        <MetricCard label="Net Payable" value={formatCurrency(totals.net)} helper="After deductions" icon={Wallet} tone="green" />
        <MetricCard label="Deductions" value={formatCurrency(totals.deductions)} helper="PF/PT/TDS/advance" icon={ShieldCheck} tone="purple" />
        <MetricCard label="Payroll Ready" value={String(allPayroll.filter((row) => row.readiness === "Ready").length)} helper={`${allPayroll.filter((row) => row.status === "Paid").length} paid`} icon={CheckCircle2} tone="green" />
      </div>
      {showForm ? <FormPanel title="Create Payroll Draft" error={error} onCancel={() => setShowForm(false)} onSave={submitPayroll}>
        <FieldGroup label="Employee"><select value={payrollForm.employeeId} onChange={(event) => setPayrollForm((current) => ({ ...current, employeeId: event.target.value }))} className={inputClass}><option value="">Select Employee...</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.code || employee.id} - {employee.name}</option>)}</select></FieldGroup>
        <FieldGroup label="Month"><input type="month" value={payrollForm.month} onChange={(event) => setPayrollForm((current) => ({ ...current, month: event.target.value }))} className={inputClass} /></FieldGroup>
        <FieldGroup label="Working Days"><input type="number" min={1} max={31} value={payrollForm.workingDays} onChange={(event) => setPayrollForm((current) => ({ ...current, workingDays: Number(event.target.value) || 0 }))} className={inputClass} /></FieldGroup>
        {(["basic", "hra", "allowance", "conveyance", "bonus", "pf", "pt", "tds", "advance"] as const).map((field) => <FieldGroup key={field} label={field.toUpperCase()}><input type="number" min={0} value={payrollForm[field]} onChange={(event) => setPayrollForm((current) => ({ ...current, [field]: Math.max(0, Number(event.target.value) || 0) }))} className={inputClass} /></FieldGroup>)}
      </FormPanel> : null}
      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <DataTable columns={["Employee", "Period", "Payable Days", "Gross", "Deductions", "Net", "Readiness", "Status", "Actions"]}>
          {payroll.map((row) => {
            const total = payrollTotals(row);
            const nextLabel = row.status === "Approved" ? "Mark Paid" : row.status === "Finance Review" ? "Finance Approve" : "HR Approve";
            return (
              <tr key={row.id} className="hover:bg-slate-50">
                <td className="px-4 py-5 font-black text-primary">{row.name}<br/><span className="text-[10px] text-slate-400">{row.employeeCode || row.employeeId}</span></td>
                <td className="px-4 py-5">{payrollMonthLabel(row.month)}<br/><span className="text-[10px] text-slate-400">{new Date(row.processedAt).toLocaleDateString("en-IN")}</span></td>
                <td className="px-4 py-5 font-black text-primary">{row.payableDays}/{row.workingDays}<br/><span className="text-[10px] text-red-500">LOP {row.lopDays}d / {formatCurrency(row.lopDeduction)}</span></td>
                <td className="px-4 py-5">{formatCurrency(total.gross)}</td>
                <td className="px-4 py-5 text-red-600">{formatCurrency(total.deductions)}</td>
                <td className="px-4 py-5 font-black text-emerald-600">{formatCurrency(total.net)}</td>
                <td className="px-4 py-5"><Badge tone={statusTone(row.readiness)}>{row.readiness}</Badge>{row.holdReason ? <p className="mt-2 max-w-44 text-[10px] font-bold leading-4 text-slate-400">{row.holdReason}</p> : null}</td>
                <td className="px-4 py-5"><Badge tone={statusTone(row.status)}>{row.status}</Badge></td>
                <td className="px-4 py-5">
                  {canManage ? <div className="flex flex-wrap gap-2">
                    <ActionButton label={nextLabel} onClick={() => updatePayrollStatus(row.id, "advance")} disabled={row.status === "Hold" || row.status === "Paid" || row.readiness !== "Ready"} />
                    {row.status === "Hold"
                      ? <>
                          <ActionButton label="Recheck" onClick={() => updatePayrollStatus(row.id, "recheck")} />
                          <ActionButton label="Release" onClick={() => updatePayrollStatus(row.id, "release")} disabled={row.readiness !== "Ready"} />
                        </>
                      : <ActionButton label="Hold" onClick={() => updatePayrollStatus(row.id, "hold")} disabled={row.status === "Paid"} />}
                  </div> : null}
                </td>
              </tr>
            );
          })}
        </DataTable>
      </section>
    </div>
  );
}

function ExitSection({ exits, allExits, employees, showForm, exitForm, error, setExitForm, setShowForm, submitExit, updateExitControl, completeExit, cancelExit, canManage }: { exits: ExitRecord[]; allExits: ExitRecord[]; employees: EmployeeRecord[]; showForm: boolean; exitForm: { employeeId: string; exitType: ExitType; resignationDate: string; lastDay: string; handoverOwner: string; reason: string; risk: ExitRisk }; error: string; setExitForm: React.Dispatch<React.SetStateAction<{ employeeId: string; exitType: ExitType; resignationDate: string; lastDay: string; handoverOwner: string; reason: string; risk: ExitRisk }>>; setShowForm: (value: boolean) => void; submitExit: () => void; updateExitControl: (id: string, payload: Parameters<typeof updateHrmsExit>[1]) => void; completeExit: (id: string) => void; cancelExit: (id: string) => void; canManage: boolean }) {
  const toggleAsset = (exit: ExitRecord, asset: keyof ExitRecord["assets"]) => {
    const payload = asset === "laptop"
      ? { laptop_recovered: !exit.assets.laptop }
      : asset === "idCard"
        ? { id_card_recovered: !exit.assets.idCard }
        : { access_revoked: !exit.assets.email };
    updateExitControl(exit.id, payload);
  };
  const toggleClearance = (exit: ExitRecord, clearance: keyof ExitRecord["clearances"]) => {
    const payload = clearance === "manager"
      ? { manager_clearance: !exit.clearances.manager }
      : clearance === "hr"
        ? { hr_clearance: !exit.clearances.hr }
        : clearance === "finance"
          ? { finance_clearance: !exit.clearances.finance }
          : { it_clearance: !exit.clearances.it };
    updateExitControl(exit.id, payload);
  };
  const updateHandover = (id: string, handover: number) => updateExitControl(id, { handover });
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Open Exits" value={String(allExits.filter((exit) => !["Completed", "Cancelled"].includes(exit.lifecycleStatus)).length)} helper="Notice period active" icon={LogOut} tone="amber" />
        <MetricCard label="F&F Cleared" value={String(allExits.filter((exit) => exit.ffStatus === "Cleared").length)} helper="Settlements done" icon={CheckCircle2} tone="green" />
        <MetricCard label="Exit Ready" value={String(allExits.filter((exit) => exit.lifecycleStatus === "Ready for F&F").length)} helper="All clearances complete" icon={Laptop} tone="purple" />
        <MetricCard label="High Risk" value={String(allExits.filter((exit) => exit.risk === "High").length)} helper="Needs escalation" icon={AlertTriangle} tone="red" />
      </div>
      {showForm ? <FormPanel title="Start Exit Process" error={error} onCancel={() => setShowForm(false)} onSave={submitExit}>
        <FieldGroup label="Employee"><select value={exitForm.employeeId} onChange={(event) => setExitForm((current) => ({ ...current, employeeId: event.target.value }))} className={inputClass}><option value="">Select Employee...</option>{employees.filter((employee) => !["Exited", "Archived"].includes(employee.status) && !allExits.some((exit) => exit.employeeId === employee.id && !["Completed", "Cancelled"].includes(exit.lifecycleStatus))).map((employee) => <option key={employee.id} value={employee.id}>{employee.code || employee.id} - {employee.name}</option>)}</select></FieldGroup>
        <FieldGroup label="Exit Type"><select value={exitForm.exitType} onChange={(event) => setExitForm((current) => ({ ...current, exitType: event.target.value as ExitType }))} className={inputClass}><option>Resignation</option><option>Termination</option><option>Contract End</option><option>Retirement</option></select></FieldGroup>
        <FieldGroup label="Initiation Date"><input type="date" value={exitForm.resignationDate} onChange={(event) => setExitForm((current) => ({ ...current, resignationDate: event.target.value }))} className={inputClass} /></FieldGroup>
        <FieldGroup label="Last Day"><input type="date" value={exitForm.lastDay} onChange={(event) => setExitForm((current) => ({ ...current, lastDay: event.target.value }))} className={inputClass} /></FieldGroup>
        <FieldGroup label="Handover Owner"><input value={exitForm.handoverOwner} onChange={(event) => setExitForm((current) => ({ ...current, handoverOwner: event.target.value }))} className={inputClass} /></FieldGroup>
        <FieldGroup label="Risk"><select value={exitForm.risk} onChange={(event) => setExitForm((current) => ({ ...current, risk: event.target.value as ExitRisk }))} className={inputClass}>{exitRisks.map((risk) => <option key={risk}>{risk}</option>)}</select></FieldGroup>
        <FieldGroup label="Reason"><input value={exitForm.reason} onChange={(event) => setExitForm((current) => ({ ...current, reason: event.target.value }))} className={inputClass} /></FieldGroup>
      </FormPanel> : null}
      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-5">
          {exits.map((exit) => {
            const locked = ["Completed", "Cancelled"].includes(exit.lifecycleStatus);
            const ready = exit.lifecycleStatus === "Ready for F&F";
            return (
              <div key={exit.id} className="rounded-2xl border border-border bg-slate-50 p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h4 className="text-lg font-black text-primary">{exit.name}</h4>
                    <p className="text-xs font-bold text-slate-500">{exit.employeeCode || exit.employeeId} - {exit.role} - {exit.exitType} - LWD {exit.lastDay}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase text-slate-400">Manager {exit.manager} - Handover to {exit.handoverOwner}</p>
                    <div className="mt-3 flex flex-wrap gap-2"><Badge tone={statusTone(exit.risk)}>{exit.risk} Risk</Badge><Badge tone={statusTone(exit.lifecycleStatus)}>{exit.lifecycleStatus}</Badge><Badge tone={statusTone(exit.ffStatus)}>F&F {exit.ffStatus}</Badge></div>
                  </div>
                  {canManage ? <div className="flex flex-wrap gap-2">
                    <ActionButton label="Cancel Exit" onClick={() => cancelExit(exit.id)} disabled={locked} />
                    <ActionButton label={exit.lifecycleStatus === "Completed" ? "Exit Completed" : exit.lifecycleStatus === "Cancelled" ? "Exit Cancelled" : "Complete Exit"} onClick={() => completeExit(exit.id)} disabled={!ready || locked} />
                  </div> : null}
                </div>
                <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
                  <div className="rounded-xl bg-white p-4">
                    <p className="mb-3 text-xs font-black uppercase tracking-widest text-primary">Assets & Access</p>
                    {(["laptop", "idCard", "email"] as const).map((asset) => <button key={asset} type="button" disabled={locked || !canManage} onClick={() => toggleAsset(exit, asset)} className="mb-2 flex w-full items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-xs font-bold text-slate-600 disabled:cursor-not-allowed"><span>{asset === "email" ? "System access" : asset}</span><span>{exit.assets[asset] ? (asset === "email" ? "Revoked" : "Recovered") : "Pending"}</span></button>)}
                  </div>
                  <div className="rounded-xl bg-white p-4">
                    <p className="mb-3 text-xs font-black uppercase tracking-widest text-primary">Department Clearances</p>
                    {(["manager", "hr", "finance", "it"] as const).map((clearance) => <button key={clearance} type="button" disabled={locked || !canManage} onClick={() => toggleClearance(exit, clearance)} className="mb-2 flex w-full items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-xs font-bold text-slate-600 disabled:cursor-not-allowed"><span>{clearance.toUpperCase()}</span><span>{exit.clearances[clearance] ? "Cleared" : "Pending"}</span></button>)}
                  </div>
                  <div className="rounded-xl bg-white p-4">
                    <div className="mb-2 flex justify-between text-xs font-black uppercase tracking-widest text-slate-500"><span>Handover</span><span>{exit.handover}%</span></div>
                    <input type="range" min={0} max={100} step={5} disabled={locked || !canManage} value={exit.handover} onChange={(event) => updateHandover(exit.id, Number(event.target.value))} className="w-full accent-primary disabled:cursor-not-allowed" />
                    <ProgressBar value={exit.handover} tone={exit.handover === 100 ? "green" : "amber"} />
                    <p className="mt-4 text-xs font-bold text-slate-500">Reason: {exit.reason}</p>
                    <p className="mt-2 text-[10px] font-bold text-slate-400">Initiated {exit.resignationDate}{exit.completedAt ? ` - Completed ${new Date(exit.completedAt).toLocaleDateString("en-IN")}` : ""}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

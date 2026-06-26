"use client";

import { useMemo, useState, type ComponentType, type ReactNode } from "react";
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

const initialEmployees: EmployeeRecord[] = [
  { id: "EMP-1024", name: "Aarav Mehta", role: "Senior React Developer", team: "Product Engineering", manager: "Vikram", location: "Jaipur", type: "Full-time", status: "Active", score: 92, email: "aarav@it-crm.com", mobile: "+91 98765 43210", joined: "2022-01-12", kycStatus: "Complete", assetTag: "LAP-882" },
  { id: "EMP-1041", name: "Priya Nair", role: "QA Automation Engineer", team: "Delivery QA", manager: "Sunita", location: "Remote", type: "Full-time", status: "Active", score: 88, email: "priya@it-crm.com", mobile: "+91 98765 43211", joined: "2022-03-05", kycStatus: "Complete", assetTag: "LAP-914" },
  { id: "EMP-1088", name: "Rohan Saini", role: "DevOps Engineer", team: "CloudOps", manager: "Rajesh", location: "Bengaluru", type: "Consultant", status: "Probation", score: 76, email: "rohan@it-crm.com", mobile: "+91 98765 43212", joined: "2023-11-20", kycStatus: "Pending", assetTag: "LAP-971" },
  { id: "EMP-1112", name: "Meera Singh", role: "UI/UX Designer", team: "Design Studio", manager: "Anjali", location: "Indore", type: "Intern", status: "Training", score: 69, email: "meera@it-crm.com", mobile: "+91 98765 43213", joined: "2024-05-15", kycStatus: "Pending", assetTag: "PENDING" },
];

const initialAttendance: AttendanceRecord[] = [
  { id: "ATT-001", employeeId: "EMP-1024", name: "Aarav Mehta", date: "2026-06-23", shift: "10:00 - 19:00", checkIn: "09:54", checkOut: "18:58", mode: "Office", status: "Present", billableHours: 7.6, overtimeHours: 0, approvalStatus: "Auto Approved", payrollImpact: "Payable", note: "On time" },
  { id: "ATT-002", employeeId: "EMP-1041", name: "Priya Nair", date: "2026-06-23", shift: "10:00 - 19:00", checkIn: "10:08", checkOut: "18:41", mode: "Remote", status: "Late", billableHours: 7.2, overtimeHours: 0, approvalStatus: "Pending Approval", payrollImpact: "Review", note: "Late by 8 minutes" },
  { id: "ATT-003", employeeId: "EMP-1088", name: "Rohan Saini", date: "2026-06-23", shift: "14:00 - 23:00", checkIn: "13:58", checkOut: "22:45", mode: "Hybrid", status: "Present", billableHours: 8.1, overtimeHours: 0.1, approvalStatus: "Approved", payrollImpact: "Payable", note: "Night deployment support" },
  { id: "ATT-004", employeeId: "EMP-1112", name: "Meera Singh", date: "2026-06-23", shift: "10:00 - 17:00", checkIn: "", checkOut: "", mode: "Office", status: "Leave", billableHours: 0, overtimeHours: 0, approvalStatus: "Approved", payrollImpact: "Non Payable", note: "Approved leave" },
  { id: "ATT-005", employeeId: "EMP-1088", name: "Rohan Saini", date: "2026-06-22", shift: "14:00 - 23:00", checkIn: "14:02", checkOut: "", mode: "Hybrid", status: "Missing Punch", billableHours: 0, overtimeHours: 0, approvalStatus: "Pending Approval", payrollImpact: "Review", note: "Missing checkout regularization pending" },
];

const initialLeaves: LeaveRecord[] = [
  { id: "LV-001", employeeId: "EMP-1024", name: "Aarav Mehta", type: "Earned Leave", startDate: "2026-06-18", endDate: "2026-06-21", days: 4, duration: "Full Day", reason: "Family travel", status: "Manager Review", approver: "Vikram", payrollImpact: "Paid", appliedAt: "2026-06-10T09:30:00.000Z", decisionNote: "" },
  { id: "LV-002", employeeId: "EMP-1041", name: "Priya Nair", type: "Sick Leave", startDate: "2026-06-12", endDate: "2026-06-12", days: 1, duration: "Full Day", reason: "Medical appointment", status: "Approved", approver: "HR Team", payrollImpact: "Paid", appliedAt: "2026-06-12T07:15:00.000Z", decisionNote: "Approved after manager review" },
  { id: "LV-003", employeeId: "EMP-1088", name: "Rohan Saini", type: "Work From Home", startDate: "2026-06-13", endDate: "2026-06-14", days: 2, duration: "Full Day", reason: "Night deployment support", status: "HR Review", approver: "HR Team", payrollImpact: "No Impact", appliedAt: "2026-06-11T10:00:00.000Z", decisionNote: "Manager approved" },
];

const initialPayroll: PayrollRecord[] = [
  { id: "SAL-2026-001", employeeId: "EMP-1024", name: "Aarav Mehta", month: "2026-06", basic: 90000, hra: 36000, allowance: 10000, conveyance: 5000, bonus: 7000, pf: 10800, pt: 200, tds: 9000, advance: 0, workingDays: 26, payableDays: 26, lopDays: 0, lopDeduction: 0, readiness: "Ready", holdReason: "", processedAt: "2026-06-23T10:00:00.000Z", status: "Approved" },
  { id: "SAL-2026-002", employeeId: "EMP-1041", name: "Priya Nair", month: "2026-06", basic: 65000, hra: 26000, allowance: 5500, conveyance: 2000, bonus: 0, pf: 7800, pt: 200, tds: 5000, advance: 0, workingDays: 26, payableDays: 26, lopDays: 0, lopDeduction: 0, readiness: "Attendance Review", holdReason: "One attendance approval pending", processedAt: "2026-06-23T10:10:00.000Z", status: "Finance Review" },
  { id: "SAL-2026-003", employeeId: "EMP-1088", name: "Rohan Saini", month: "2026-06", basic: 80000, hra: 32000, allowance: 8000, conveyance: 3000, bonus: 0, pf: 9600, pt: 200, tds: 6500, advance: 2000, workingDays: 26, payableDays: 26, lopDays: 0, lopDeduction: 0, readiness: "Attendance Review", holdReason: "Missing punch and WFH approval pending", processedAt: "2026-06-23T10:20:00.000Z", status: "Hold" },
];

const initialExits: ExitRecord[] = [
  { id: "EX-001", employeeId: "EMP-1201", name: "Karan Patel", role: "Backend Developer", manager: "Vikram", exitType: "Resignation", resignationDate: "2026-05-29", lastDay: "2026-06-28", reason: "Higher studies", notice: "Serving", handover: 65, handoverOwner: "Aarav Mehta", risk: "Medium", assets: { laptop: true, idCard: false, email: false }, clearances: { manager: true, hr: false, finance: false, it: false }, ffStatus: "In Progress", lifecycleStatus: "Clearance", createdAt: "2026-05-29T09:00:00.000Z", completedAt: "" },
  { id: "EX-002", employeeId: "EMP-1198", name: "Divya Rao", role: "HR Executive", manager: "Anjali", exitType: "Resignation", resignationDate: "2026-05-15", lastDay: "2026-06-15", reason: "Relocation", notice: "Completed", handover: 100, handoverOwner: "Meera Singh", risk: "Low", assets: { laptop: true, idCard: true, email: true }, clearances: { manager: true, hr: true, finance: true, it: true }, ffStatus: "Cleared", lifecycleStatus: "Completed", createdAt: "2026-05-15T08:30:00.000Z", completedAt: "2026-06-16T11:00:00.000Z" },
];

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

function datesBetween(start: string, end: string) {
  const dates: string[] = [];
  const current = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  while (current <= endDate) {
    dates.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

const leaveLimits: Record<Exclude<LeaveRecord["type"], "Work From Home">, number> = {
  "Earned Leave": 18,
  "Sick Leave": 10,
  "Casual Leave": 7,
  "Comp Off": 5,
};

function hoursBetween(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return 0;
  const [inHour, inMinute] = checkIn.split(":").map(Number);
  const [outHour, outMinute] = checkOut.split(":").map(Number);
  const start = inHour * 60 + inMinute;
  const end = outHour * 60 + outMinute;
  const minutes = end - start;
  return minutes > 0 ? Math.round((minutes / 60) * 10) / 10 : 0;
}

function isLate(checkIn: string, shift: string) {
  if (!checkIn) return false;
  const [shiftHour, shiftMinute] = shift.split(" - ")[0].split(":").map(Number);
  const [checkInHour, checkInMinute] = checkIn.split(":").map(Number);
  return checkInHour * 60 + checkInMinute > shiftHour * 60 + shiftMinute + 15;
}

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

function EmployeeProfile({ employee, onClose, onEdit }: { employee: EmployeeRecord; onClose: () => void; onEdit: (employee: EmployeeRecord) => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/40 backdrop-blur-sm">
      <div className="h-full w-full max-w-3xl overflow-y-auto bg-white p-8 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-lg font-black text-white">{employee.name.split(" ").map((part) => part[0]).join("")}</div>
            <div>
              <h3 className="text-2xl font-black text-primary">{employee.name}</h3>
              <p className="mt-1 text-sm font-bold text-slate-500">{employee.id} - {employee.role}</p>
              <div className="mt-3 flex flex-wrap gap-2"><Badge tone={statusTone(employee.status)}>{employee.status}</Badge><Badge tone={employee.kycStatus === "Complete" ? "green" : "amber"}>KYC {employee.kycStatus}</Badge></div>
            </div>
          </div>
          <div className="flex gap-2">
            <ActionButton icon={Edit3} label="Edit" onClick={() => onEdit(employee)} />
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
          <p className="mt-1 text-xs font-semibold text-slate-500">Maintain one employee master record for HRMS, attendance, payroll and exit lifecycle.</p>
        </div>
        <ActionButton icon={X} label="Close" onClick={onCancel} />
      </div>
      {error ? <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-black text-red-700">{error}</div> : null}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <FieldGroup label="Employee ID"><input value={form.id} onChange={(event) => onField("id", event.target.value)} className={inputClass} /></FieldGroup>
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

export default function HRMSHub({ activeView, onAddEmployee }: { activeView: HRMSView; onAddEmployee?: () => void }) {
  const [employees, setEmployees] = useState<EmployeeRecord[]>(initialEmployees);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(initialAttendance);
  const [leaves, setLeaves] = useState<LeaveRecord[]>(initialLeaves);
  const [payroll, setPayroll] = useState<PayrollRecord[]>(initialPayroll);
  const [exits, setExits] = useState<ExitRecord[]>(initialExits);
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

  const title = activeView === "employees" ? "Employees" : activeView === "attendance" ? "Attendance" : activeView === "leave" ? "Leave Management" : activeView === "payroll" ? "Payroll" : "Exit Management";
  const description = activeView === "employees"
    ? "Employee master, org mapping, manager ownership, assets, compliance and HR health for IT teams."
    : activeView === "attendance"
      ? "Hybrid attendance tracking with shifts, regularization, missing punch and billable hours."
      : activeView === "leave"
        ? "Leave, WFH, comp-off and approval queue with manager plus HR review workflow."
        : activeView === "payroll"
          ? "Monthly payroll register with gross, deductions, net pay, holds and approval status."
          : "Notice period, handover, asset recovery, access revoke and final settlement control.";

  const filteredEmployees = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return employees.filter((employee) => {
      const matchesSearch = !search || [employee.id, employee.name, employee.role, employee.team, employee.manager, employee.email, employee.mobile].join(" ").toLowerCase().includes(search);
      const matchesStatus = statusFilter === "All" || employee.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [employees, searchTerm, statusFilter]);

  const filteredAttendance = useMemo(() => attendance.filter((row) => {
    const search = searchTerm.trim().toLowerCase();
    const matchesSearch = !search || [row.employeeId, row.name, row.date, row.mode, row.status, row.approvalStatus, row.payrollImpact, row.note].join(" ").toLowerCase().includes(search);
    const matchesStatus = statusFilter === "All" || row.status === statusFilter || row.approvalStatus === statusFilter || row.payrollImpact === statusFilter;
    return matchesSearch && matchesStatus;
  }), [attendance, searchTerm, statusFilter]);

  const filteredLeaves = useMemo(() => leaves.filter((row) => {
    const search = searchTerm.trim().toLowerCase();
    const matchesSearch = !search || [row.employeeId, row.name, row.type, row.duration, row.reason, row.approver, row.status, row.payrollImpact].join(" ").toLowerCase().includes(search);
    const matchesStatus = statusFilter === "All" || row.status === statusFilter || row.payrollImpact === statusFilter;
    return matchesSearch && matchesStatus;
  }), [leaves, searchTerm, statusFilter]);

  const filteredPayroll = useMemo(() => payroll.filter((row) => {
    const search = searchTerm.trim().toLowerCase();
    const matchesSearch = !search || [row.employeeId, row.name, payrollMonthLabel(row.month), row.status, row.readiness, row.holdReason].join(" ").toLowerCase().includes(search);
    const matchesStatus = statusFilter === "All" || row.status === statusFilter || row.readiness === statusFilter;
    return matchesSearch && matchesStatus;
  }), [payroll, searchTerm, statusFilter]);

  const filteredExits = useMemo(() => exits.filter((row) => {
    const search = searchTerm.trim().toLowerCase();
    const matchesSearch = !search || [row.employeeId, row.name, row.role, row.manager, row.exitType, row.handoverOwner, row.reason, row.risk, row.ffStatus, row.lifecycleStatus].join(" ").toLowerCase().includes(search);
    const matchesStatus = statusFilter === "All" || row.ffStatus === statusFilter || row.risk === statusFilter || row.lifecycleStatus === statusFilter;
    return matchesSearch && matchesStatus;
  }), [exits, searchTerm, statusFilter]);

  const exportRows = () => {
    const rows: Array<Array<string | number>> = activeView === "employees"
      ? [["ID", "Name", "Role", "Team", "Manager", "Location", "Type", "Status", "Score", "Email", "Mobile", "Joined"], ...filteredEmployees.map((employee) => [employee.id, employee.name, employee.role, employee.team, employee.manager, employee.location, employee.type, employee.status, employee.score, employee.email, employee.mobile, employee.joined])]
      : activeView === "attendance"
        ? [["ID", "Employee ID", "Name", "Date", "Shift", "Check In", "Check Out", "Mode", "Status", "Approval", "Payroll Impact", "Billable Hours", "Overtime Hours", "Note"], ...filteredAttendance.map((row) => [row.id, row.employeeId, row.name, row.date, row.shift, row.checkIn, row.checkOut, row.mode, row.status, row.approvalStatus, row.payrollImpact, row.billableHours, row.overtimeHours, row.note])]
        : activeView === "leave"
          ? [["ID", "Employee ID", "Name", "Type", "Duration", "Start", "End", "Days", "Reason", "Status", "Approver", "Payroll Impact", "Applied At", "Decision Note"], ...filteredLeaves.map((row) => [row.id, row.employeeId, row.name, row.type, row.duration, row.startDate, row.endDate, row.days, row.reason, row.status, row.approver, row.payrollImpact, row.appliedAt, row.decisionNote])]
          : activeView === "payroll"
            ? [["ID", "Employee ID", "Name", "Month", "Working Days", "Payable Days", "LOP Days", "LOP Deduction", "Gross", "Deductions", "Net", "Readiness", "Hold Reason", "Status", "Processed At"], ...filteredPayroll.map((row) => { const totals = payrollTotals(row); return [row.id, row.employeeId, row.name, payrollMonthLabel(row.month), row.workingDays, row.payableDays, row.lopDays, row.lopDeduction, totals.gross, totals.deductions, totals.net, row.readiness, row.holdReason, row.status, row.processedAt]; })]
            : [["ID", "Employee ID", "Name", "Role", "Manager", "Exit Type", "Resignation Date", "Last Day", "Reason", "Notice", "Handover", "Handover Owner", "Risk", "Manager Clearance", "HR Clearance", "Finance Clearance", "IT Clearance", "Laptop", "ID Card", "Access Revoked", "F&F", "Lifecycle", "Created At", "Completed At"], ...filteredExits.map((row) => [row.id, row.employeeId, row.name, row.role, row.manager, row.exitType, row.resignationDate, row.lastDay, row.reason, row.notice, row.handover, row.handoverOwner, row.risk, row.clearances.manager ? "Cleared" : "Pending", row.clearances.hr ? "Cleared" : "Pending", row.clearances.finance ? "Cleared" : "Pending", row.clearances.it ? "Cleared" : "Pending", row.assets.laptop ? "Recovered" : "Pending", row.assets.idCard ? "Recovered" : "Pending", row.assets.email ? "Revoked" : "Pending", row.ffStatus, row.lifecycleStatus, row.createdAt, row.completedAt])];
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
      setEmployeeForm(employee);
      setEditingEmployeeId(employee.id);
    } else {
      setEmployeeForm(blankEmployeeForm);
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
    if (employees.some((employee) => employee.id === employeeForm.id && employee.id !== editingEmployeeId)) {
      setEmployeeError("Employee ID already exists.");
      return false;
    }
    if (!employeeForm.email.includes("@")) {
      setEmployeeError("Enter a valid email address.");
      return false;
    }
    return true;
  };

  const saveEmployee = () => {
    if (!validateEmployee()) return;
    const record: EmployeeRecord = { ...employeeForm };
    setEmployees((current) => editingEmployeeId ? current.map((employee) => employee.id === editingEmployeeId ? record : employee) : [record, ...current]);
    setShowEmployeeForm(false);
    setEditingEmployeeId(null);
  };

  const offboardEmployee = (employee: EmployeeRecord) => {
    setEmployees((current) => current.map((item) => item.id === employee.id ? { ...item, status: "On Notice" } : item));
    if (!exits.some((exit) => exit.employeeId === employee.id && !["Completed", "Cancelled"].includes(exit.lifecycleStatus))) {
      setExits((current) => [{
        id: `EX-${Date.now()}`,
        employeeId: employee.id,
        name: employee.name,
        role: employee.role,
        manager: employee.manager,
        exitType: "Resignation",
        resignationDate: "2026-06-24",
        lastDay: "2026-07-23",
        reason: "Started from employee directory",
        notice: "Serving",
        handover: 0,
        handoverOwner: employee.manager,
        risk: "Medium",
        assets: { laptop: false, idCard: false, email: false },
        clearances: { manager: false, hr: false, finance: false, it: false },
        ffStatus: "Pending",
        lifecycleStatus: "Initiated",
        createdAt: new Date().toISOString(),
        completedAt: "",
      }, ...current]);
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

  const submitAttendance = () => {
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
    const billableHours = hoursBetween(attendanceForm.checkIn, attendanceForm.checkOut);
    const existingRecord = attendance.find((row) => row.id === editingAttendanceId);
    const shift = existingRecord?.shift ?? "10:00 - 19:00";
    const late = isLate(attendanceForm.checkIn, shift);
    const overtimeHours = Math.max(0, Math.round((billableHours - 8) * 10) / 10);
    const record: AttendanceRecord = {
      id: editingAttendanceId ?? `ATT-${Date.now()}`,
      employeeId: employee.id,
      name: employee.name,
      date: attendanceForm.date,
      shift,
      checkIn: attendanceForm.checkIn,
      checkOut: attendanceForm.checkOut,
      mode: attendanceForm.mode,
      status: late ? "Late" : "Regularized",
      billableHours,
      overtimeHours,
      approvalStatus: "Pending Approval",
      payrollImpact: late || overtimeHours > 0 ? "Review" : "Payable",
      note: attendanceForm.note,
    };
    setAttendance((current) => editingAttendanceId
      ? current.map((row) => row.id === editingAttendanceId ? record : row)
      : [record, ...current]);
    setShowAttendanceForm(false);
    setAttendanceError("");
    setEditingAttendanceId(null);
  };

  const submitLeave = () => {
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
    setLeaves((current) => [{
      id: `LV-${Date.now()}`,
      employeeId: employee.id,
      name: employee.name,
      type: leaveForm.type,
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      days,
      duration: leaveForm.duration,
      reason: leaveForm.reason.trim(),
      status: "Manager Review",
      approver: employee.manager,
      payrollImpact: leaveForm.type === "Work From Home" ? "No Impact" : "Paid",
      appliedAt: new Date().toISOString(),
      decisionNote: "",
    }, ...current]);
    setShowLeaveForm(false);
    setLeaveError("");
    setLeaveForm({ employeeId: "", type: "Earned Leave", startDate: "", endDate: "", duration: "Full Day", reason: "" });
  };

  const updateLeaveStatus = (id: string, action: "advance" | "reject" | "cancel") => {
    const leave = leaves.find((item) => item.id === id);
    if (!leave) return;
    if (action === "cancel") {
      setLeaves((current) => current.map((item) => item.id === id ? { ...item, status: "Cancelled", approver: "Employee/HR", decisionNote: "Request cancelled" } : item));
      return;
    }
    if (action === "reject") {
      setLeaves((current) => current.map((item) => item.id === id ? { ...item, status: "Rejected", approver: "HR Team", decisionNote: "Rejected during approval review" } : item));
      return;
    }
    if (leave.status === "Manager Review" || leave.status === "Pending") {
      setLeaves((current) => current.map((item) => item.id === id ? { ...item, status: "HR Review", approver: "HR Team", decisionNote: "Manager approved" } : item));
      return;
    }
    if (leave.status !== "HR Review") return;
    const used = leave.type === "Work From Home" ? 0 : leaves
      .filter((item) => item.employeeId === leave.employeeId && item.type === leave.type && item.status === "Approved" && item.id !== leave.id)
      .reduce((sum, item) => sum + item.days, 0);
    const payrollImpact: LeavePayrollImpact = leave.type === "Work From Home"
      ? "No Impact"
      : used + leave.days <= leaveLimits[leave.type]
        ? "Paid"
        : "Unpaid";
    setLeaves((current) => current.map((item) => item.id === id ? { ...item, status: "Approved", approver: "HR Team", payrollImpact, decisionNote: "HR approved and synced to attendance" } : item));
    setAttendance((current) => datesBetween(leave.startDate, leave.endDate).reduce((rows, date) => {
      const existing = rows.find((row) => row.employeeId === leave.employeeId && row.date === date);
      const attendanceRow: AttendanceRecord = {
        id: existing?.id ?? `ATT-${leave.id}-${date}`,
        employeeId: leave.employeeId,
        name: leave.name,
        date,
        shift: existing?.shift ?? "10:00 - 19:00",
        checkIn: "",
        checkOut: "",
        mode: leave.type === "Work From Home" ? "Remote" : existing?.mode ?? "Office",
        status: leave.type === "Work From Home" ? "Present" : "Leave",
        billableHours: leave.type === "Work From Home" ? (leave.duration === "Full Day" ? 8 : 4) : 0,
        overtimeHours: 0,
        approvalStatus: "Approved",
        payrollImpact: payrollImpact === "Unpaid" ? "Non Payable" : "Payable",
        note: `${leave.type} approved (${leave.duration})`,
      };
      return existing ? rows.map((row) => row.id === existing.id ? attendanceRow : row) : [attendanceRow, ...rows];
    }, current));
  };

  const submitPayroll = () => {
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
    const monthPrefix = `${payrollForm.month}-`;
    const attendanceBlockers = attendance.filter((row) => row.employeeId === employee.id
      && row.date.startsWith(monthPrefix)
      && (row.approvalStatus === "Pending Approval" || row.payrollImpact === "Review" || row.status === "Missing Punch"));
    const monthEnd = `${payrollForm.month}-${new Date(Number(payrollForm.month.slice(0, 4)), Number(payrollForm.month.slice(5, 7)), 0).getDate()}`;
    const leaveBlockers = leaves.filter((leave) => leave.employeeId === employee.id
      && leave.startDate <= monthEnd
      && leave.endDate >= `${payrollForm.month}-01`
      && ["Pending", "Manager Review", "HR Review"].includes(leave.status));
    const lopDays = leaves
      .filter((leave) => leave.employeeId === employee.id && leave.startDate <= monthEnd && leave.endDate >= `${payrollForm.month}-01` && leave.status === "Approved" && leave.payrollImpact === "Unpaid")
      .reduce((sum, leave) => sum + leave.days, 0);
    const payableDays = Math.max(0, payrollForm.workingDays - lopDays);
    const lopDeduction = Math.round((payrollForm.basic / payrollForm.workingDays) * lopDays);
    if (deductions + lopDeduction > gross) {
      setPayrollError("Total deductions including loss of pay cannot exceed gross salary.");
      return;
    }
    const readiness: PayrollReadiness = attendanceBlockers.length ? "Attendance Review" : leaveBlockers.length ? "Leave Review" : "Ready";
    const holdReason = attendanceBlockers.length
      ? `${attendanceBlockers.length} attendance issue(s) pending`
      : leaveBlockers.length
        ? `${leaveBlockers.length} leave request(s) pending`
        : "";
    setPayroll((current) => [{
      id: `SAL-${Date.now()}`,
      employeeId: employee.id,
      name: employee.name,
      month: payrollForm.month,
      basic: payrollForm.basic,
      hra: payrollForm.hra,
      allowance: payrollForm.allowance,
      conveyance: payrollForm.conveyance,
      bonus: payrollForm.bonus,
      pf: payrollForm.pf,
      pt: payrollForm.pt,
      tds: payrollForm.tds,
      advance: payrollForm.advance,
      workingDays: payrollForm.workingDays,
      payableDays,
      lopDays,
      lopDeduction,
      readiness,
      holdReason,
      processedAt: new Date().toISOString(),
      status: readiness === "Ready" ? "HR Review" : "Hold",
    }, ...current]);
    setShowPayrollForm(false);
    setPayrollError("");
    setPayrollForm({ employeeId: "", month: "2026-06", basic: 0, hra: 0, allowance: 0, conveyance: 0, bonus: 0, pf: 0, pt: 200, tds: 0, advance: 0, workingDays: 26 });
  };

  const updatePayrollStatus = (id: string, action: "advance" | "hold" | "release" | "recheck") => {
    setPayroll((current) => current.map((row) => {
      if (row.id !== id) return row;
      if (action === "recheck") {
        const monthPrefix = `${row.month}-`;
        const monthEnd = `${row.month}-${new Date(Number(row.month.slice(0, 4)), Number(row.month.slice(5, 7)), 0).getDate()}`;
        const attendanceBlockers = attendance.filter((item) => item.employeeId === row.employeeId
          && item.date.startsWith(monthPrefix)
          && (item.approvalStatus === "Pending Approval" || item.payrollImpact === "Review" || item.status === "Missing Punch"));
        const leaveBlockers = leaves.filter((item) => item.employeeId === row.employeeId
          && item.startDate <= monthEnd
          && item.endDate >= `${row.month}-01`
          && ["Pending", "Manager Review", "HR Review"].includes(item.status));
        const readiness: PayrollReadiness = attendanceBlockers.length ? "Attendance Review" : leaveBlockers.length ? "Leave Review" : "Ready";
        const holdReason = attendanceBlockers.length
          ? `${attendanceBlockers.length} attendance issue(s) pending`
          : leaveBlockers.length
            ? `${leaveBlockers.length} leave request(s) pending`
            : "";
        return { ...row, readiness, holdReason };
      }
      if (action === "hold") return { ...row, status: "Hold", holdReason: row.holdReason || "Manually held for finance review" };
      if (action === "release") {
        if (row.readiness !== "Ready") return row;
        return { ...row, status: "HR Review", holdReason: "" };
      }
      if (row.readiness !== "Ready") return { ...row, status: "Hold", holdReason: row.holdReason || "Attendance or leave reconciliation pending" };
      if (row.status === "Draft" || row.status === "HR Review") return { ...row, status: "Finance Review" };
      if (row.status === "Finance Review") return { ...row, status: "Approved" };
      if (row.status === "Approved") return { ...row, status: "Paid", processedAt: new Date().toISOString() };
      return row;
    }));
  };

  const submitExit = () => {
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
    setEmployees((current) => current.map((item) => item.id === employee.id ? { ...item, status: "On Notice" } : item));
    setExits((current) => [{
      id: `EX-${Date.now()}`,
      employeeId: employee.id,
      name: employee.name,
      role: employee.role,
      manager: employee.manager,
      exitType: exitForm.exitType,
      resignationDate: exitForm.resignationDate,
      lastDay: exitForm.lastDay,
      reason: exitForm.reason.trim(),
      notice: "Serving",
      handover: 0,
      handoverOwner: exitForm.handoverOwner.trim(),
      risk: exitForm.risk,
      assets: { laptop: false, idCard: false, email: false },
      clearances: { manager: false, hr: false, finance: false, it: false },
      ffStatus: "Pending",
      lifecycleStatus: "Initiated",
      createdAt: new Date().toISOString(),
      completedAt: "",
    }, ...current]);
    setShowExitForm(false);
    setExitError("");
    setExitForm({ employeeId: "", exitType: "Resignation", resignationDate: "2026-06-24", lastDay: "", handoverOwner: "", reason: "", risk: "Low" });
  };

  const completeExit = (id: string) => {
    const exit = exits.find((item) => item.id === id);
    if (!exit) return;
    const ready = exit.handover === 100
      && Object.values(exit.assets).every(Boolean)
      && Object.values(exit.clearances).every(Boolean);
    if (!ready) return;
    setExits((current) => current.map((item) => item.id === id ? { ...item, notice: "Completed", ffStatus: "Cleared", lifecycleStatus: "Completed", completedAt: new Date().toISOString() } : item));
    setEmployees((current) => current.map((employee) => employee.id === exit.employeeId ? { ...employee, status: "Exited" } : employee));
  };

  const cancelExit = (id: string) => {
    const exit = exits.find((item) => item.id === id);
    if (!exit || exit.lifecycleStatus === "Completed") return;
    setExits((current) => current.map((item) => item.id === id ? { ...item, lifecycleStatus: "Cancelled", ffStatus: "Pending" } : item));
    setEmployees((current) => current.map((employee) => employee.id === exit.employeeId ? { ...employee, status: "Active" } : employee));
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
              <Badge tone="green">HRMS</Badge>
            </div>
            <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-slate-500">{description}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <ActionButton icon={Download} label="Export" onClick={exportRows} />
          <ActionButton icon={Filter} label="Clear Filters" onClick={clearFilters} />
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

      {activeView === "employees" ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Employees" value={String(employees.filter((employee) => employee.status !== "Archived").length)} helper="Active master records" icon={Users} tone="blue" />
            <MetricCard label="Probation" value={String(employees.filter((employee) => employee.status === "Probation").length)} helper="Review required" icon={UserCheck} tone="amber" />
            <MetricCard label="KYC Pending" value={String(employees.filter((employee) => employee.kycStatus === "Pending").length)} helper="Compliance queue" icon={ShieldCheck} tone="red" />
            <MetricCard label="On Notice" value={String(employees.filter((employee) => employee.status === "On Notice").length)} helper="Exit linked" icon={UserMinus} tone="purple" />
          </div>
          {showEmployeeForm ? <EmployeeForm form={employeeForm} error={employeeError} editing={Boolean(editingEmployeeId)} onField={(field, value) => setEmployeeForm((current) => ({ ...current, [field]: value }))} onSave={saveEmployee} onCancel={() => setShowEmployeeForm(false)} /> : null}
          <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <DataTable columns={["Employee", "Role / Team", "Manager", "Location", "Type", "KYC", "HR Health", "Status", "Actions"]}>
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-slate-50">
                  <td className="px-4 py-5 font-black text-primary">{employee.name}<br/><span className="text-[10px] text-slate-400">{employee.id}</span></td>
                  <td className="px-4 py-5">{employee.role}<br/><span className="text-[10px] font-black uppercase text-slate-400">{employee.team}</span></td>
                  <td className="px-4 py-5">{employee.manager}</td>
                  <td className="px-4 py-5">{employee.location}</td>
                  <td className="px-4 py-5">{employee.type}</td>
                  <td className="px-4 py-5"><Badge tone={employee.kycStatus === "Complete" ? "green" : "amber"}>{employee.kycStatus}</Badge></td>
                  <td className="px-4 py-5 min-w-32"><ProgressBar value={employee.score} tone={employee.score >= 85 ? "green" : employee.score >= 75 ? "blue" : "amber"} /></td>
                  <td className="px-4 py-5"><Badge tone={statusTone(employee.status)}>{employee.status}</Badge></td>
                  <td className="px-4 py-5"><div className="flex flex-wrap gap-2"><ActionButton icon={Eye} label="View" onClick={() => setSelectedEmployee(employee)} /><ActionButton icon={Edit3} label="Edit" onClick={() => openEmployeeForm(employee)} /><ActionButton icon={UserMinus} label="Offboard" onClick={() => offboardEmployee(employee)} disabled={employee.status === "Exited" || employee.status === "Archived"} /></div></td>
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
          {showAttendanceForm ? (
            <FormPanel title={editingAttendanceId ? "Update Attendance Regularization" : "Regularize Attendance"} error={attendanceError} onCancel={() => { setShowAttendanceForm(false); setEditingAttendanceId(null); }} onSave={submitAttendance}>
              <FieldGroup label="Employee"><select value={attendanceForm.employeeId} disabled={Boolean(editingAttendanceId)} onChange={(event) => setAttendanceForm((current) => ({ ...current, employeeId: event.target.value }))} className={inputClass}><option value="">Select Employee...</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.id} - {employee.name}</option>)}</select></FieldGroup>
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
                  <td className="px-4 py-5 font-black text-primary">{row.name}<br/><span className="text-[10px] text-slate-400">{row.employeeId}</span></td>
                  <td className="px-4 py-5">{row.date}<br/><span className="text-[10px] font-black uppercase text-slate-400">{row.shift}</span></td>
                  <td className="px-4 py-5">{row.checkIn || "-"} to {row.checkOut || "-"}</td>
                  <td className="px-4 py-5">{row.mode}</td>
                  <td className="px-4 py-5"><Badge tone={statusTone(row.status)}>{row.status}</Badge></td>
                  <td className="px-4 py-5"><Badge tone={statusTone(row.approvalStatus)}>{row.approvalStatus}</Badge></td>
                  <td className="px-4 py-5"><Badge tone={statusTone(row.payrollImpact)}>{row.payrollImpact}</Badge></td>
                  <td className="px-4 py-5 font-black text-primary">{row.billableHours}h<br/><span className="text-[10px] text-slate-400">OT {row.overtimeHours}h</span></td>
                  <td className="px-4 py-5 max-w-xs">{row.note}</td>
                  <td className="px-4 py-5">
                    <div className="flex flex-wrap gap-2">
                      <ActionButton
                        icon={Edit3}
                        label="Regularize"
                        onClick={() => openAttendanceForm(row)}
                        disabled={row.approvalStatus === "Approved" || row.approvalStatus === "Auto Approved"}
                      />
                      <ActionButton
                        label="Approve"
                        onClick={() => setAttendance((current) => current.map((item) => item.id === row.id ? { ...item, approvalStatus: "Approved", payrollImpact: item.status === "Leave" ? "Non Payable" : "Payable", note: `${item.note} | Approved for payroll` } : item))}
                        disabled={row.approvalStatus === "Approved" || row.approvalStatus === "Auto Approved"}
                      />
                      <ActionButton
                        label="Reject"
                        onClick={() => setAttendance((current) => current.map((item) => item.id === row.id ? { ...item, approvalStatus: "Rejected", payrollImpact: "Non Payable", note: `${item.note} | Rejected by HR` } : item))}
                        disabled={row.approvalStatus === "Rejected"}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </DataTable>
          </section>
        </div>
      ) : null}

      {activeView === "leave" ? (
        <LeaveSection leaves={filteredLeaves} allLeaves={leaves} employees={employees} showForm={showLeaveForm} leaveForm={leaveForm} error={leaveError} setLeaveForm={setLeaveForm} setShowForm={setShowLeaveForm} submitLeave={submitLeave} updateLeaveStatus={updateLeaveStatus} />
      ) : null}

      {activeView === "payroll" ? (
        <PayrollSection payroll={filteredPayroll} allPayroll={payroll} employees={employees} showForm={showPayrollForm} payrollForm={payrollForm} error={payrollError} setPayrollForm={setPayrollForm} setShowForm={setShowPayrollForm} submitPayroll={submitPayroll} updatePayrollStatus={updatePayrollStatus} />
      ) : null}

      {activeView === "exit" ? (
        <ExitSection exits={filteredExits} allExits={exits} employees={employees} showForm={showExitForm} exitForm={exitForm} error={exitError} setExitForm={setExitForm} setShowForm={setShowExitForm} submitExit={submitExit} setExits={setExits} completeExit={completeExit} cancelExit={cancelExit} />
      ) : null}

      {selectedEmployee ? <EmployeeProfile employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} onEdit={(employee) => { setSelectedEmployee(null); openEmployeeForm(employee); }} /> : null}

      <section className="rounded-2xl border border-border bg-primary p-6 text-white shadow-sm">
        <div className="flex items-center gap-3"><ShieldCheck className="text-accent" size={24} /><h3 className="text-lg font-black">Practical HRMS Controls</h3></div>
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

function LeaveSection({ leaves, allLeaves, employees, showForm, leaveForm, error, setLeaveForm, setShowForm, submitLeave, updateLeaveStatus }: { leaves: LeaveRecord[]; allLeaves: LeaveRecord[]; employees: EmployeeRecord[]; showForm: boolean; leaveForm: { employeeId: string; type: LeaveRecord["type"]; startDate: string; endDate: string; duration: LeaveDuration; reason: string }; error: string; setLeaveForm: React.Dispatch<React.SetStateAction<{ employeeId: string; type: LeaveRecord["type"]; startDate: string; endDate: string; duration: LeaveDuration; reason: string }>>; setShowForm: (value: boolean) => void; submitLeave: () => void; updateLeaveStatus: (id: string, action: "advance" | "reject" | "cancel") => void }) {
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
        <FieldGroup label="Employee"><select value={leaveForm.employeeId} onChange={(event) => setLeaveForm((current) => ({ ...current, employeeId: event.target.value }))} className={inputClass}><option value="">Select Employee...</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.id} - {employee.name}</option>)}</select></FieldGroup>
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
              <td className="px-4 py-5 font-black text-primary">{leave.name}<br/><span className="text-[10px] text-slate-400">{leave.employeeId}</span></td>
              <td className="px-4 py-5">{leave.type}<br/><span className="text-[10px] font-black uppercase text-slate-400">{leave.duration}</span></td>
              <td className="px-4 py-5">{leave.startDate} to {leave.endDate}<br/><span className="text-[10px] text-slate-400">Applied {new Date(leave.appliedAt).toLocaleDateString("en-IN")}</span></td>
              <td className="px-4 py-5 font-black text-primary">{leave.days}</td>
              <td className="px-4 py-5 max-w-xs">{leave.reason}{leave.decisionNote ? <><br/><span className="text-[10px] font-bold text-slate-400">{leave.decisionNote}</span></> : null}</td>
              <td className="px-4 py-5">{leave.approver}</td>
              <td className="px-4 py-5"><Badge tone={statusTone(leave.payrollImpact)}>{leave.payrollImpact}</Badge></td>
              <td className="px-4 py-5"><Badge tone={statusTone(leave.status)}>{leave.status}</Badge></td>
              <td className="px-4 py-5">
                <div className="flex flex-wrap gap-2">
                  <ActionButton label={leave.status === "Manager Review" || leave.status === "Pending" ? "Manager Approve" : "HR Approve"} onClick={() => updateLeaveStatus(leave.id, "advance")} disabled={!["Pending", "Manager Review", "HR Review"].includes(leave.status)} />
                  <ActionButton label="Reject" onClick={() => updateLeaveStatus(leave.id, "reject")} disabled={!["Pending", "Manager Review", "HR Review"].includes(leave.status)} />
                  <ActionButton label="Cancel" onClick={() => updateLeaveStatus(leave.id, "cancel")} disabled={["Approved", "Rejected", "Cancelled"].includes(leave.status)} />
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      </section>
    </div>
  );
}

function PayrollSection({ payroll, allPayroll, employees, showForm, payrollForm, error, setPayrollForm, setShowForm, submitPayroll, updatePayrollStatus }: { payroll: PayrollRecord[]; allPayroll: PayrollRecord[]; employees: EmployeeRecord[]; showForm: boolean; payrollForm: { employeeId: string; month: string; basic: number; hra: number; allowance: number; conveyance: number; bonus: number; pf: number; pt: number; tds: number; advance: number; workingDays: number }; error: string; setPayrollForm: React.Dispatch<React.SetStateAction<{ employeeId: string; month: string; basic: number; hra: number; allowance: number; conveyance: number; bonus: number; pf: number; pt: number; tds: number; advance: number; workingDays: number }>>; setShowForm: (value: boolean) => void; submitPayroll: () => void; updatePayrollStatus: (id: string, action: "advance" | "hold" | "release" | "recheck") => void }) {
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
        <FieldGroup label="Employee"><select value={payrollForm.employeeId} onChange={(event) => setPayrollForm((current) => ({ ...current, employeeId: event.target.value }))} className={inputClass}><option value="">Select Employee...</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.id} - {employee.name}</option>)}</select></FieldGroup>
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
                <td className="px-4 py-5 font-black text-primary">{row.name}<br/><span className="text-[10px] text-slate-400">{row.employeeId}</span></td>
                <td className="px-4 py-5">{payrollMonthLabel(row.month)}<br/><span className="text-[10px] text-slate-400">{new Date(row.processedAt).toLocaleDateString("en-IN")}</span></td>
                <td className="px-4 py-5 font-black text-primary">{row.payableDays}/{row.workingDays}<br/><span className="text-[10px] text-red-500">LOP {row.lopDays}d / {formatCurrency(row.lopDeduction)}</span></td>
                <td className="px-4 py-5">{formatCurrency(total.gross)}</td>
                <td className="px-4 py-5 text-red-600">{formatCurrency(total.deductions)}</td>
                <td className="px-4 py-5 font-black text-emerald-600">{formatCurrency(total.net)}</td>
                <td className="px-4 py-5"><Badge tone={statusTone(row.readiness)}>{row.readiness}</Badge>{row.holdReason ? <p className="mt-2 max-w-44 text-[10px] font-bold leading-4 text-slate-400">{row.holdReason}</p> : null}</td>
                <td className="px-4 py-5"><Badge tone={statusTone(row.status)}>{row.status}</Badge></td>
                <td className="px-4 py-5">
                  <div className="flex flex-wrap gap-2">
                    <ActionButton label={nextLabel} onClick={() => updatePayrollStatus(row.id, "advance")} disabled={row.status === "Hold" || row.status === "Paid" || row.readiness !== "Ready"} />
                    {row.status === "Hold"
                      ? <>
                          <ActionButton label="Recheck" onClick={() => updatePayrollStatus(row.id, "recheck")} />
                          <ActionButton label="Release" onClick={() => updatePayrollStatus(row.id, "release")} disabled={row.readiness !== "Ready"} />
                        </>
                      : <ActionButton label="Hold" onClick={() => updatePayrollStatus(row.id, "hold")} disabled={row.status === "Paid"} />}
                  </div>
                </td>
              </tr>
            );
          })}
        </DataTable>
      </section>
    </div>
  );
}

function ExitSection({ exits, allExits, employees, showForm, exitForm, error, setExitForm, setShowForm, submitExit, setExits, completeExit, cancelExit }: { exits: ExitRecord[]; allExits: ExitRecord[]; employees: EmployeeRecord[]; showForm: boolean; exitForm: { employeeId: string; exitType: ExitType; resignationDate: string; lastDay: string; handoverOwner: string; reason: string; risk: ExitRisk }; error: string; setExitForm: React.Dispatch<React.SetStateAction<{ employeeId: string; exitType: ExitType; resignationDate: string; lastDay: string; handoverOwner: string; reason: string; risk: ExitRisk }>>; setShowForm: (value: boolean) => void; submitExit: () => void; setExits: React.Dispatch<React.SetStateAction<ExitRecord[]>>; completeExit: (id: string) => void; cancelExit: (id: string) => void }) {
  const withReadiness = (exit: ExitRecord): ExitRecord => {
    if (exit.lifecycleStatus === "Completed" || exit.lifecycleStatus === "Cancelled") return exit;
    const ready = exit.handover === 100 && Object.values(exit.assets).every(Boolean) && Object.values(exit.clearances).every(Boolean);
    return { ...exit, lifecycleStatus: ready ? "Ready for F&F" : "Clearance", ffStatus: ready ? "In Progress" : exit.ffStatus };
  };
  const toggleAsset = (id: string, asset: keyof ExitRecord["assets"]) => setExits((current) => current.map((exit) => exit.id === id ? withReadiness({ ...exit, assets: { ...exit.assets, [asset]: !exit.assets[asset] } }) : exit));
  const toggleClearance = (id: string, clearance: keyof ExitRecord["clearances"]) => setExits((current) => current.map((exit) => exit.id === id ? withReadiness({ ...exit, clearances: { ...exit.clearances, [clearance]: !exit.clearances[clearance] } }) : exit));
  const updateHandover = (id: string, handover: number) => setExits((current) => current.map((exit) => exit.id === id ? withReadiness({ ...exit, handover }) : exit));
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Open Exits" value={String(allExits.filter((exit) => !["Completed", "Cancelled"].includes(exit.lifecycleStatus)).length)} helper="Notice period active" icon={LogOut} tone="amber" />
        <MetricCard label="F&F Cleared" value={String(allExits.filter((exit) => exit.ffStatus === "Cleared").length)} helper="Settlements done" icon={CheckCircle2} tone="green" />
        <MetricCard label="Exit Ready" value={String(allExits.filter((exit) => exit.lifecycleStatus === "Ready for F&F").length)} helper="All clearances complete" icon={Laptop} tone="purple" />
        <MetricCard label="High Risk" value={String(allExits.filter((exit) => exit.risk === "High").length)} helper="Needs escalation" icon={AlertTriangle} tone="red" />
      </div>
      {showForm ? <FormPanel title="Start Exit Process" error={error} onCancel={() => setShowForm(false)} onSave={submitExit}>
        <FieldGroup label="Employee"><select value={exitForm.employeeId} onChange={(event) => setExitForm((current) => ({ ...current, employeeId: event.target.value }))} className={inputClass}><option value="">Select Employee...</option>{employees.filter((employee) => !["Exited", "Archived"].includes(employee.status) && !allExits.some((exit) => exit.employeeId === employee.id && !["Completed", "Cancelled"].includes(exit.lifecycleStatus))).map((employee) => <option key={employee.id} value={employee.id}>{employee.id} - {employee.name}</option>)}</select></FieldGroup>
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
                    <p className="text-xs font-bold text-slate-500">{exit.employeeId} - {exit.role} - {exit.exitType} - LWD {exit.lastDay}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase text-slate-400">Manager {exit.manager} - Handover to {exit.handoverOwner}</p>
                    <div className="mt-3 flex flex-wrap gap-2"><Badge tone={statusTone(exit.risk)}>{exit.risk} Risk</Badge><Badge tone={statusTone(exit.lifecycleStatus)}>{exit.lifecycleStatus}</Badge><Badge tone={statusTone(exit.ffStatus)}>F&F {exit.ffStatus}</Badge></div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <ActionButton label="Cancel Exit" onClick={() => cancelExit(exit.id)} disabled={locked || exit.lifecycleStatus === "Cancelled"} />
                    <ActionButton label={exit.lifecycleStatus === "Completed" ? "Exit Completed" : exit.lifecycleStatus === "Cancelled" ? "Exit Cancelled" : "Complete Exit"} onClick={() => completeExit(exit.id)} disabled={!ready || locked} />
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
                  <div className="rounded-xl bg-white p-4">
                    <p className="mb-3 text-xs font-black uppercase tracking-widest text-primary">Assets & Access</p>
                    {(["laptop", "idCard", "email"] as const).map((asset) => <button key={asset} type="button" disabled={locked} onClick={() => toggleAsset(exit.id, asset)} className="mb-2 flex w-full items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-xs font-bold text-slate-600 disabled:cursor-not-allowed"><span>{asset === "email" ? "System access" : asset}</span><span>{exit.assets[asset] ? (asset === "email" ? "Revoked" : "Recovered") : "Pending"}</span></button>)}
                  </div>
                  <div className="rounded-xl bg-white p-4">
                    <p className="mb-3 text-xs font-black uppercase tracking-widest text-primary">Department Clearances</p>
                    {(["manager", "hr", "finance", "it"] as const).map((clearance) => <button key={clearance} type="button" disabled={locked} onClick={() => toggleClearance(exit.id, clearance)} className="mb-2 flex w-full items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-xs font-bold text-slate-600 disabled:cursor-not-allowed"><span>{clearance.toUpperCase()}</span><span>{exit.clearances[clearance] ? "Cleared" : "Pending"}</span></button>)}
                  </div>
                  <div className="rounded-xl bg-white p-4">
                    <div className="mb-2 flex justify-between text-xs font-black uppercase tracking-widest text-slate-500"><span>Handover</span><span>{exit.handover}%</span></div>
                    <input type="range" min={0} max={100} step={5} disabled={locked} value={exit.handover} onChange={(event) => updateHandover(exit.id, Number(event.target.value))} className="w-full accent-primary disabled:cursor-not-allowed" />
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

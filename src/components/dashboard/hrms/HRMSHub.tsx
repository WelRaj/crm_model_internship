"use client";

import {
  AlertTriangle,
  BadgeIndianRupee,
  BriefcaseBusiness,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  FileCheck2,
  Filter,
  Fingerprint,
  Laptop,
  LogOut,
  MapPin,
  Plane,
  Plus,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";

type HRMSView = "employees" | "attendance" | "leave" | "payroll" | "exit";
type Tone = "blue" | "green" | "amber" | "red" | "purple" | "slate" | "cyan";

const toneClasses: Record<Tone, string> = {
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  green: "border-green-200 bg-green-50 text-green-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  red: "border-red-200 bg-red-50 text-red-700",
  purple: "border-purple-200 bg-purple-50 text-purple-700",
  slate: "border-slate-200 bg-slate-50 text-slate-600",
  cyan: "border-cyan-200 bg-cyan-50 text-cyan-700",
};

const employees = [
  { id: "EMP-1024", name: "Aarav Mehta", role: "Senior React Developer", team: "Product Engineering", manager: "Vikram", location: "Jaipur", type: "Full-time", status: "Active", score: 92 },
  { id: "EMP-1041", name: "Priya Nair", role: "QA Automation Engineer", team: "Delivery QA", manager: "Sunita", location: "Remote", type: "Full-time", status: "Active", score: 88 },
  { id: "EMP-1088", name: "Rohan Saini", role: "DevOps Engineer", team: "CloudOps", manager: "Rajesh", location: "Bengaluru", type: "Consultant", status: "Probation", score: 76 },
  { id: "EMP-1112", name: "Meera Singh", role: "UI/UX Designer", team: "Design Studio", manager: "Anjali", location: "Indore", type: "Intern", status: "Training", score: 69 },
];

const attendanceRows = [
  { name: "Aarav Mehta", shift: "10:00 - 19:00", checkIn: "09:54", mode: "Office", status: "Present", billable: "7.6h" },
  { name: "Priya Nair", shift: "10:00 - 19:00", checkIn: "10:08", mode: "Remote", status: "Present", billable: "7.2h" },
  { name: "Rohan Saini", shift: "14:00 - 23:00", checkIn: "13:58", mode: "Hybrid", status: "Present", billable: "8.1h" },
  { name: "Meera Singh", shift: "10:00 - 17:00", checkIn: "-", mode: "Office", status: "Leave", billable: "0h" },
];

const leaveRequests = [
  { name: "Aarav Mehta", type: "Earned Leave", dates: "18 Jun - 21 Jun", days: 4, reason: "Family travel", status: "Manager Review" },
  { name: "Priya Nair", type: "Sick Leave", dates: "12 Jun", days: 1, reason: "Medical appointment", status: "Approved" },
  { name: "Rohan Saini", type: "Work From Home", dates: "13 Jun - 14 Jun", days: 2, reason: "Night deployment support", status: "HR Review" },
  { name: "Meera Singh", type: "Comp Off", dates: "16 Jun", days: 1, reason: "Weekend release work", status: "Pending" },
];

const payrollRows = [
  { name: "Aarav Mehta", ctc: "INR 18.5L", gross: "INR 1,42,000", deductions: "INR 18,420", net: "INR 1,23,580", status: "Ready" },
  { name: "Priya Nair", ctc: "INR 12.8L", gross: "INR 98,500", deductions: "INR 11,930", net: "INR 86,570", status: "Ready" },
  { name: "Rohan Saini", ctc: "INR 16.2L", gross: "INR 1,26,000", deductions: "INR 15,400", net: "INR 1,10,600", status: "Hold" },
  { name: "Meera Singh", ctc: "INR 3.6L", gross: "INR 30,000", deductions: "INR 1,800", net: "INR 28,200", status: "Ready" },
];

const exitCases = [
  { name: "Karan Patel", role: "Backend Developer", lastDay: "28 Jun 2026", reason: "Higher studies", notice: "Serving", handover: 65, risk: "Medium" },
  { name: "Divya Rao", role: "HR Executive", lastDay: "15 Jun 2026", reason: "Relocation", notice: "Final Week", handover: 86, risk: "Low" },
  { name: "Nitin Verma", role: "Support Engineer", lastDay: "20 Jun 2026", reason: "Career move", notice: "Serving", handover: 42, risk: "High" },
];

function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}

function statusTone(status: string): Tone {
  if (["Active", "Present", "Approved", "Ready", "Low"].includes(status)) return "green";
  if (["Probation", "Manager Review", "HR Review", "Medium", "Pending"].includes(status)) return "amber";
  if (["Leave", "Hold", "High"].includes(status)) return "red";
  return "blue";
}

function ProgressBar({ value, tone = "green" }: { value: number; tone?: "green" | "blue" | "amber" | "red" | "purple" }) {
  const colors = {
    green: "bg-green-500",
    blue: "bg-blue-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
    purple: "bg-purple-500",
  };

  return (
    <div className="h-2 w-full rounded-full bg-slate-100">
      <div className={`h-2 rounded-full ${colors[tone]}`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}

function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  icon: ComponentType<{ size?: number }>;
  tone: Tone;
}) {
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
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg[tone]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  children,
  variant = "outline",
}: {
  icon: ComponentType<{ size?: number }>;
  children: ReactNode;
  variant?: "primary" | "outline" | "accent";
}) {
  const styles = {
    primary: "bg-primary text-white border-primary",
    outline: "bg-white text-primary border-border hover:bg-slate-50",
    accent: "bg-accent text-primary border-accent hover:bg-accent/90",
  };

  return (
    <button className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-black uppercase tracking-widest shadow-sm transition-all ${styles[variant]}`}>
      <Icon size={16} />
      {children}
    </button>
  );
}

function EmployeesView() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Employees" value="248" helper="187 billable resources" icon={Users} tone="blue" />
        <MetricCard label="Active Projects" value="36" helper="Resource mapped" icon={BriefcaseBusiness} tone="purple" />
        <MetricCard label="Probation" value="18" helper="6 due for review" icon={UserCheck} tone="amber" />
        <MetricCard label="Compliance" value="96%" helper="KYC, NDA, asset forms" icon={ShieldCheck} tone="green" />
      </div>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-black text-primary">Employee Directory</h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">Role, department, manager, location, employment type and HR health in one practical view.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="blue">Org Chart Ready</Badge>
            <Badge tone="green">KYC Linked</Badge>
            <Badge tone="purple">Asset Mapped</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {employees.map((employee) => (
            <div key={employee.id} className="rounded-2xl border border-border bg-slate-50 p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-sm font-black text-white">
                    {employee.name.split(" ").map((part) => part[0]).join("")}
                  </div>
                  <div>
                    <p className="text-lg font-black text-primary">{employee.name}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">{employee.id} - {employee.role}</p>
                  </div>
                </div>
                <Badge tone={statusTone(employee.status)}>{employee.status}</Badge>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-xl bg-white p-3">
                  <p className="text-sm font-black text-primary">{employee.team}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Team</p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="text-sm font-black text-primary">{employee.manager}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Manager</p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="text-sm font-black text-primary">{employee.location}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Location</p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="text-sm font-black text-primary">{employee.type}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Type</p>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-500">
                  <span>HR Health</span>
                  <span>{employee.score}%</span>
                </div>
                <ProgressBar value={employee.score} tone={employee.score > 85 ? "green" : employee.score > 75 ? "blue" : "amber"} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function AttendanceView() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Present Today" value="221" helper="89% attendance" icon={Fingerprint} tone="green" />
        <MetricCard label="Late Marks" value="11" helper="After grace window" icon={Clock} tone="amber" />
        <MetricCard label="Remote Check-ins" value="64" helper="Geo/IP verified" icon={Laptop} tone="blue" />
        <MetricCard label="Missing Punch" value="07" helper="Needs HR action" icon={AlertTriangle} tone="red" />
      </div>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h3 className="text-lg font-black text-primary">Attendance Control Room</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">Daily punch, shift, work mode, billable hours and exception tracking for hybrid IT teams.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
            <thead>
              <tr className="border-b border-slate-100">
                {["Employee", "Shift", "Check-in", "Mode", "Billable", "Status"].map((head) => (
                  <th key={head} className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attendanceRows.map((row) => (
                <tr key={row.name} className="hover:bg-slate-50/60">
                  <td className="py-5 font-black text-primary">{row.name}</td>
                  <td className="py-5 text-sm font-bold text-slate-500">{row.shift}</td>
                  <td className="py-5 text-sm font-bold text-slate-500">{row.checkIn}</td>
                  <td className="py-5">
                    <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-600">
                      <MapPin size={15} /> {row.mode}
                    </span>
                  </td>
                  <td className="py-5 text-sm font-black text-primary">{row.billable}</td>
                  <td className="py-5"><Badge tone={statusTone(row.status)}>{row.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function LeaveView() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Pending Requests" value="16" helper="HR + manager queue" icon={Plane} tone="amber" />
        <MetricCard label="Approved Month" value="42" helper="Including WFH" icon={CheckCircle2} tone="green" />
        <MetricCard label="Leave Liability" value="312d" helper="Earned leave balance" icon={Calendar} tone="blue" />
        <MetricCard label="Policy Exceptions" value="03" helper="Needs review" icon={AlertTriangle} tone="red" />
      </div>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h3 className="text-lg font-black text-primary">Leave & WFH Requests</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">Practical approval queue with leave type, date range, days, reason and approval stage.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {leaveRequests.map((request) => (
            <div key={`${request.name}-${request.dates}`} className="rounded-2xl border border-border bg-slate-50 p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-lg font-black text-primary">{request.name}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">{request.type} - {request.dates}</p>
                </div>
                <Badge tone={statusTone(request.status)}>{request.status}</Badge>
              </div>
              <div className="mt-5 rounded-xl bg-white p-4">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Reason</p>
                <p className="mt-2 text-sm font-bold text-slate-600">{request.reason}</p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-slate-500">{request.days} day(s)</span>
                <button className="flex items-center gap-1 text-xs font-black uppercase tracking-widest text-primary">
                  Review <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function PayrollView() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Monthly Payroll" value="INR 2.84Cr" helper="248 employees" icon={BadgeIndianRupee} tone="green" />
        <MetricCard label="Payroll Ready" value="231" helper="Payslip generation" icon={FileCheck2} tone="blue" />
        <MetricCard label="On Hold" value="09" helper="Attendance or exit lock" icon={AlertTriangle} tone="red" />
        <MetricCard label="Variable Payout" value="INR 18.6L" helper="Bonus + incentives" icon={TrendingUp} tone="purple" />
      </div>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h3 className="text-lg font-black text-primary">Payroll Run</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">CTC, gross salary, statutory deductions, net pay and payroll release status.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[940px] text-left">
            <thead>
              <tr className="border-b border-slate-100">
                {["Employee", "CTC", "Gross", "Deductions", "Net Pay", "Status"].map((head) => (
                  <th key={head} className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payrollRows.map((row) => (
                <tr key={row.name} className="hover:bg-slate-50/60">
                  <td className="py-5 font-black text-primary">{row.name}</td>
                  <td className="py-5 text-sm font-bold text-slate-500">{row.ctc}</td>
                  <td className="py-5 text-sm font-bold text-slate-500">{row.gross}</td>
                  <td className="py-5 text-sm font-bold text-slate-500">{row.deductions}</td>
                  <td className="py-5 text-sm font-black text-primary">{row.net}</td>
                  <td className="py-5"><Badge tone={statusTone(row.status)}>{row.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function ExitView() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Open Exits" value="12" helper="Notice period active" icon={LogOut} tone="amber" />
        <MetricCard label="Knowledge Transfer" value="74%" helper="Average completion" icon={FileCheck2} tone="blue" />
        <MetricCard label="Asset Recovery" value="09" helper="Laptop, ID, access" icon={Laptop} tone="purple" />
        <MetricCard label="High Risk" value="03" helper="Client or project impact" icon={AlertTriangle} tone="red" />
      </div>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h3 className="text-lg font-black text-primary">Exit Management</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">Notice period, handover, asset recovery, payroll lock and access revocation tracking.</p>
        </div>
        <div className="space-y-4">
          {exitCases.map((item) => (
            <div key={item.name} className="rounded-2xl border border-border bg-slate-50 p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-lg font-black text-primary">{item.name}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">{item.role} - Last day: {item.lastDay}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone={statusTone(item.risk)}>{item.risk} Risk</Badge>
                  <Badge tone="blue">{item.notice}</Badge>
                </div>
              </div>
              <div className="mt-5 rounded-xl bg-white p-4">
                <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-500">
                  <span>Handover Completion</span>
                  <span>{item.handover}%</span>
                </div>
                <div className="mt-3">
                  <ProgressBar value={item.handover} tone={item.risk === "High" ? "red" : item.risk === "Medium" ? "amber" : "green"} />
                </div>
                <p className="mt-3 text-xs font-semibold text-slate-500">Reason: {item.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function HRMSHub({ activeView }: { activeView: HRMSView }) {
  const title =
    activeView === "employees"
      ? "Employees"
      : activeView === "attendance"
        ? "Attendance"
        : activeView === "leave"
          ? "Leave Management"
          : activeView === "payroll"
            ? "Payroll"
            : "Exit Management";

  const description =
    activeView === "employees"
      ? "Employee master, org mapping, manager ownership, assets, compliance and HR health for IT teams."
      : activeView === "attendance"
        ? "Hybrid attendance tracking with shifts, geo/IP mode, late marks, missing punch and billable hours."
        : activeView === "leave"
          ? "Leave, WFH, comp-off and approval queue designed for manager plus HR review workflows."
          : activeView === "payroll"
            ? "Monthly payroll run with CTC, gross, deductions, net pay, holds and payslip readiness."
            : "Notice period, handover, asset recovery, access revoke and final settlement control.";

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
          <ActionButton icon={Download}>Export</ActionButton>
          <ActionButton icon={Filter}>Filter</ActionButton>
          <ActionButton icon={Plus} variant="accent">
            {activeView === "employees" ? "Add Employee" : activeView === "attendance" ? "Regularize" : activeView === "leave" ? "Apply Leave" : activeView === "payroll" ? "Run Payroll" : "Start Exit"}
          </ActionButton>
        </div>
      </div>

      {activeView === "employees" && <EmployeesView />}
      {activeView === "attendance" && <AttendanceView />}
      {activeView === "leave" && <LeaveView />}
      {activeView === "payroll" && <PayrollView />}
      {activeView === "exit" && <ExitView />}

      <section className="rounded-2xl border border-border bg-primary p-6 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-accent" size={24} />
          <h3 className="text-lg font-black">Practical HRMS Controls</h3>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          {[
            ["Single employee master", "Employee data should connect attendance, payroll, assets, project allocation and access."],
            ["Payroll lock before payout", "Attendance, leave, exits and reimbursements must be reconciled before salary release."],
            ["Access tied to lifecycle", "Joining, role change and exit should trigger system access and asset controls."],
            ["Manager plus HR ownership", "Approvals need clear SLA, escalation and audit history for practical operations."],
          ].map(([control, detail]) => (
            <div key={control} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-black">{control}</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-300">{detail}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

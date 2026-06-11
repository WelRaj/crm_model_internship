"use client";

import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileCheck2,
  Filter,
  Fingerprint,
  Globe2,
  History,
  KeyRound,
  LockKeyhole,
  MailCheck,
  Plus,
  ServerCog,
  Settings,
  Shield,
  ShieldCheck,
  Smartphone,
  ToggleRight,
  UserCog,
  Users,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";

type AdminView = "users" | "roles" | "logs" | "approvals" | "settings";
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

const users = [
  { name: "Rajkumar Rathore", email: "rajkumar@company.in", role: "Super Admin", team: "Leadership", status: "Active", mfa: "Enabled", lastSeen: "2 mins ago", risk: "Low" },
  { name: "Vikram Rathore", email: "vikram@company.in", role: "Project Manager", team: "Delivery", status: "Active", mfa: "Enabled", lastSeen: "14 mins ago", risk: "Low" },
  { name: "Sunita Sharma", email: "sunita@company.in", role: "HR Manager", team: "HRMS", status: "Active", mfa: "Pending", lastSeen: "1 hour ago", risk: "Medium" },
  { name: "External Auditor", email: "audit.partner@vendor.in", role: "Auditor", team: "Compliance", status: "Limited", mfa: "Enabled", lastSeen: "Yesterday", risk: "Medium" },
];

const roles = [
  { role: "Super Admin", users: 2, modules: "All modules", permissions: 96, sensitive: "Full access", risk: "High" },
  { role: "Finance Manager", users: 4, modules: "Accounting, Payroll, Approvals", permissions: 64, sensitive: "Invoices, salary", risk: "Medium" },
  { role: "Project Manager", users: 11, modules: "CRM, Projects, Clients", permissions: 48, sensitive: "Client delivery", risk: "Medium" },
  { role: "HR Manager", users: 3, modules: "HRMS, Attendance, Leave", permissions: 52, sensitive: "Employee data", risk: "Medium" },
  { role: "Viewer", users: 18, modules: "Read-only dashboards", permissions: 14, sensitive: "No exports", risk: "Low" },
];

const auditLogs = [
  { time: "12:14 PM", user: "Rajkumar Rathore", action: "Changed role permissions", module: "Administration", ip: "103.87.***.21", result: "Success", risk: "Medium" },
  { time: "11:42 AM", user: "Sunita Sharma", action: "Approved leave exception", module: "HRMS", ip: "49.36.***.88", result: "Success", risk: "Low" },
  { time: "10:57 AM", user: "External Auditor", action: "Exported GST invoice register", module: "Accounting", ip: "115.96.***.14", result: "Reviewed", risk: "High" },
  { time: "09:33 AM", user: "Unknown login", action: "Failed password attempt", module: "Security", ip: "45.129.***.10", result: "Blocked", risk: "High" },
  { time: "08:51 AM", user: "Vikram Rathore", action: "Updated project deadline", module: "Projects", ip: "122.161.***.44", result: "Success", risk: "Low" },
];

const approvals = [
  { id: "APR-2201", title: "Finance role access upgrade", requester: "Rajesh Kumar", owner: "Rajkumar", module: "Roles", amount: "-", stage: "Security Review", sla: "4h left", priority: "High" },
  { id: "APR-2202", title: "Vendor payment release", requester: "Priya Nair", owner: "Finance Lead", module: "Accounting", amount: "INR 2,48,000", stage: "Director Approval", sla: "1d left", priority: "High" },
  { id: "APR-2203", title: "Payroll hold removal", requester: "Sunita Sharma", owner: "HR Head", module: "Payroll", amount: "INR 1,10,600", stage: "HR Review", sla: "Today", priority: "Medium" },
  { id: "APR-2204", title: "Client data export request", requester: "External Auditor", owner: "Compliance", module: "CRM", amount: "-", stage: "DPO Approval", sla: "2d left", priority: "Medium" },
];

const settings = [
  { title: "Company Profile", description: "Legal name, GSTIN, CIN, branches, invoice identity and timezone.", icon: Globe2, status: "Configured" },
  { title: "Security Policy", description: "MFA, password expiry, session timeout, IP allowlist and device trust.", icon: LockKeyhole, status: "Strong" },
  { title: "Email & Notifications", description: "SMTP, OTP templates, approval alerts, billing reminders and escalation mails.", icon: MailCheck, status: "Live" },
  { title: "Integrations", description: "Google Workspace, payment gateway, accounting exports, WhatsApp and webhook endpoints.", icon: ServerCog, status: "Partial" },
  { title: "Data Governance", description: "Audit retention, export controls, backup schedule, PII masking and archive rules.", icon: ShieldCheck, status: "Review" },
  { title: "Mobile Access", description: "Admin app access, device lock, biometric login and remote logout policy.", icon: Smartphone, status: "Enabled" },
];

function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}

function toneForStatus(value: string): Tone {
  if (["Active", "Enabled", "Success", "Configured", "Strong", "Live", "Low"].includes(value)) return "green";
  if (["Pending", "Limited", "Reviewed", "Partial", "Review", "Medium", "Security Review", "HR Review"].includes(value)) return "amber";
  if (["High", "Blocked"].includes(value)) return "red";
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

function UsersView() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active Users" value="126" helper="Across 8 departments" icon={Users} tone="blue" />
        <MetricCard label="MFA Coverage" value="91%" helper="11 users pending" icon={Fingerprint} tone="green" />
        <MetricCard label="Privileged Users" value="09" helper="Admin-sensitive access" icon={KeyRound} tone="amber" />
        <MetricCard label="Blocked Attempts" value="17" helper="Last 24 hours" icon={AlertTriangle} tone="red" />
      </div>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-black text-primary">User Access Directory</h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">Admin view of users, teams, roles, MFA, last activity and access risk.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="green">MFA Enforced</Badge>
            <Badge tone="blue">Role Based</Badge>
            <Badge tone="purple">Session Tracked</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {users.map((user) => (
            <div key={user.email} className="rounded-2xl border border-border bg-slate-50 p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-sm font-black text-white">
                    {user.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-lg font-black text-primary">{user.name}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">{user.email}</p>
                  </div>
                </div>
                <Badge tone={toneForStatus(user.status)}>{user.status}</Badge>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-xl bg-white p-3">
                  <p className="text-sm font-black text-primary">{user.role}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Role</p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="text-sm font-black text-primary">{user.team}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Team</p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="text-sm font-black text-primary">{user.mfa}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">MFA</p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="text-sm font-black text-primary">{user.lastSeen}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Last Seen</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <Badge tone={toneForStatus(user.risk)}>{user.risk} Risk</Badge>
                <button className="flex items-center gap-1 text-xs font-black uppercase tracking-widest text-primary">
                  Manage Access <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function RolesView() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Custom Roles" value="18" helper="5 admin-sensitive" icon={Shield} tone="blue" />
        <MetricCard label="Permission Rules" value="142" helper="Module + action level" icon={UserCog} tone="purple" />
        <MetricCard label="Risky Grants" value="06" helper="Needs quarterly review" icon={AlertTriangle} tone="red" />
        <MetricCard label="Reviews Done" value="84%" helper="This quarter" icon={CheckCircle2} tone="green" />
      </div>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h3 className="text-lg font-black text-primary">Role & Permission Matrix</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">Practical RBAC control with module scope, sensitive data exposure and risk ownership.</p>
        </div>
        <div className="space-y-4">
          {roles.map((item) => (
            <div key={item.role} className="rounded-2xl border border-border bg-slate-50 p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-lg font-black text-primary">{item.role}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">{item.modules}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone={toneForStatus(item.risk)}>{item.risk} Risk</Badge>
                  <Badge tone="blue">{item.users} Users</Badge>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_180px] lg:items-center">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-500">
                    <span>Permission Coverage</span>
                    <span>{item.permissions}%</span>
                  </div>
                  <ProgressBar value={item.permissions} tone={item.risk === "High" ? "red" : item.risk === "Medium" ? "amber" : "green"} />
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="text-sm font-black text-primary">{item.sensitive}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Sensitive Scope</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function LogsView() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Events Today" value="4,812" helper="Across modules" icon={Activity} tone="blue" />
        <MetricCard label="High Risk Events" value="12" helper="Security + exports" icon={AlertTriangle} tone="red" />
        <MetricCard label="Blocked Actions" value="31" helper="Policy prevented" icon={ShieldCheck} tone="green" />
        <MetricCard label="Retention" value="365d" helper="Audit policy" icon={History} tone="purple" />
      </div>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h3 className="text-lg font-black text-primary">Audit Trail</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">Who did what, when, from where, and whether policy allowed it.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead>
              <tr className="border-b border-slate-100">
                {["Time", "User", "Action", "Module", "IP", "Result", "Risk"].map((head) => (
                  <th key={head} className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.map((log) => (
                <tr key={`${log.time}-${log.action}`} className="hover:bg-slate-50/60">
                  <td className="py-5 text-sm font-black text-primary">{log.time}</td>
                  <td className="py-5 text-sm font-bold text-slate-600">{log.user}</td>
                  <td className="py-5 text-sm font-bold text-slate-600">{log.action}</td>
                  <td className="py-5 text-sm font-bold text-slate-500">{log.module}</td>
                  <td className="py-5 text-sm font-bold text-slate-500">{log.ip}</td>
                  <td className="py-5"><Badge tone={toneForStatus(log.result)}>{log.result}</Badge></td>
                  <td className="py-5"><Badge tone={toneForStatus(log.risk)}>{log.risk}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function ApprovalsView() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Pending Approvals" value="28" helper="7 high priority" icon={Clock} tone="amber" />
        <MetricCard label="Approved Today" value="43" helper="Avg SLA 3.2h" icon={CheckCircle2} tone="green" />
        <MetricCard label="Escalations" value="05" helper="Crossed SLA" icon={Bell} tone="red" />
        <MetricCard label="Financial Value" value="INR 18.4L" helper="Awaiting approval" icon={FileCheck2} tone="blue" />
      </div>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h3 className="text-lg font-black text-primary">Approval Queue</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">Multi-level approvals for access, finance, payroll, exports and operational exceptions.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {approvals.map((approval) => (
            <div key={approval.id} className="rounded-2xl border border-border bg-slate-50 p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-lg font-black text-primary">{approval.title}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">{approval.id} - Requested by {approval.requester}</p>
                </div>
                <Badge tone={approval.priority === "High" ? "red" : "amber"}>{approval.priority}</Badge>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white p-3">
                  <p className="text-sm font-black text-primary">{approval.owner}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Owner</p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="text-sm font-black text-primary">{approval.module}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Module</p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="text-sm font-black text-primary">{approval.amount}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Value</p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="text-sm font-black text-primary">{approval.sla}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">SLA</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <Badge tone={toneForStatus(approval.stage)}>{approval.stage}</Badge>
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

function SettingsView() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Security Score" value="94%" helper="Strong policy" icon={ShieldCheck} tone="green" />
        <MetricCard label="Active Integrations" value="12" helper="4 business critical" icon={ServerCog} tone="blue" />
        <MetricCard label="Policy Reviews" value="03" helper="Due this month" icon={FileCheck2} tone="amber" />
        <MetricCard label="Data Controls" value="18" helper="Export and PII rules" icon={Eye} tone="purple" />
      </div>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h3 className="text-lg font-black text-primary">Company Settings</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">Production admin configuration for security, notifications, compliance, integrations and governance.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {settings.map((setting) => (
            <div key={setting.title} className="rounded-2xl border border-border bg-slate-50 p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-primary">
                  <setting.icon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <p className="text-lg font-black text-primary">{setting.title}</p>
                    <Badge tone={toneForStatus(setting.status)}>{setting.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{setting.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
                      <ToggleRight size={16} /> Admin Controlled
                    </span>
                    <button className="flex items-center gap-1 text-xs font-black uppercase tracking-widest text-primary">
                      Configure <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function AdministrationHub({ activeView }: { activeView: AdminView }) {
  const title =
    activeView === "users"
      ? "Users"
      : activeView === "roles"
        ? "Roles & Permissions"
        : activeView === "logs"
          ? "Audit Logs"
          : activeView === "approvals"
            ? "Approvals"
            : "Settings";

  const description =
    activeView === "users"
      ? "User lifecycle, MFA, sessions, department access and risk controls for company admins."
      : activeView === "roles"
        ? "Role-based access control with module-level permissions, sensitive data scope and review risk."
        : activeView === "logs"
          ? "Tamper-aware audit trail for security, exports, approvals, access and operational changes."
          : activeView === "approvals"
            ? "Central approval queue for access, finance, payroll, exports and critical operational actions."
            : "Company-wide configuration for security, notifications, integrations, governance and compliance.";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-lg">
            {activeView === "users" ? <Users size={26} /> : activeView === "roles" ? <Shield size={26} /> : activeView === "logs" ? <History size={26} /> : activeView === "approvals" ? <CheckCircle2 size={26} /> : <Settings size={26} />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-3xl font-black tracking-tight text-[#1E293B]">{title}</h2>
              <Badge tone="green">Administration</Badge>
            </div>
            <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-slate-500">{description}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <ActionButton icon={Download}>Export</ActionButton>
          <ActionButton icon={Filter}>Filter</ActionButton>
          <ActionButton icon={activeView === "roles" ? Shield : activeView === "approvals" ? CheckCircle2 : Plus} variant="accent">
            {activeView === "users" ? "Add User" : activeView === "roles" ? "New Role" : activeView === "logs" ? "Create Report" : activeView === "approvals" ? "Approve Batch" : "New Setting"}
          </ActionButton>
        </div>
      </div>

      {activeView === "users" && <UsersView />}
      {activeView === "roles" && <RolesView />}
      {activeView === "logs" && <LogsView />}
      {activeView === "approvals" && <ApprovalsView />}
      {activeView === "settings" && <SettingsView />}

      <section className="rounded-2xl border border-border bg-primary p-6 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-accent" size={24} />
          <h3 className="text-lg font-black">Practical Admin Controls</h3>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          {[
            ["Least privilege first", "Users should receive only the module and action access needed for their role."],
            ["Audit every sensitive action", "Exports, payroll, role edits, invoice changes and deletions need visible logs."],
            ["Approvals before risk", "Finance, access, data export and payroll exceptions should never be single-click actions."],
            ["Settings affect business", "Company, security, email and integration settings need review history and ownership."],
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

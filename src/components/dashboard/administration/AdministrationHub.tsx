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
  Fingerprint,
  Globe2,
  History,
  KeyRound,
  LockKeyhole,
  LogOut,
  MailCheck,
  MonitorSmartphone,
  Plus,
  RotateCcw,
  Search,
  ServerCog,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  UserCog,
  UserX,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { ChangeEvent, ComponentType, ReactNode } from "react";

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

type UserStatus = "Invited" | "Active" | "Suspended" | "Deactivated";
type UserRisk = "Low" | "Medium" | "High";
type MfaStatus = "Enabled" | "Pending" | "Disabled";
type UserType = "Employee" | "External";

type AdminUser = {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  mobile: string;
  userType: UserType;
  role: string;
  team: string;
  designation: string;
  status: UserStatus;
  mfa: MfaStatus;
  lastLoginAt: string | null;
  activeSessions: number;
  risk: UserRisk;
  accessReviewDate: string;
  createdAt: string;
  updatedAt: string;
};

type UserForm = Pick<AdminUser, "employeeId" | "name" | "email" | "mobile" | "userType" | "role" | "team" | "designation" | "risk" | "accessReviewDate">;

const initialUsers: AdminUser[] = [
  { id: "USR-001", employeeId: "EMP-001", name: "Rajkumar Rathore", email: "rajkumar@dematadealgo.local", mobile: "9876543210", userType: "Employee", role: "Super Admin", team: "Leadership", designation: "Director", status: "Active", mfa: "Enabled", lastLoginAt: "2026-06-25T09:28:00.000Z", activeSessions: 2, risk: "Low", accessReviewDate: "2026-07-01", createdAt: "2025-01-10T10:00:00.000Z", updatedAt: "2026-06-20T10:00:00.000Z" },
  { id: "USR-002", employeeId: "EMP-018", name: "Vikram Rathore", email: "vikram@dematadealgo.local", mobile: "9876543211", userType: "Employee", role: "Project Manager", team: "Delivery Projects", designation: "Senior Project Manager", status: "Active", mfa: "Enabled", lastLoginAt: "2026-06-25T09:16:00.000Z", activeSessions: 1, risk: "Low", accessReviewDate: "2026-07-15", createdAt: "2025-03-12T10:00:00.000Z", updatedAt: "2026-06-18T10:00:00.000Z" },
  { id: "USR-003", employeeId: "EMP-026", name: "Sunita Sharma", email: "sunita@dematadealgo.local", mobile: "9876543212", userType: "Employee", role: "People Operations Manager", team: "People Operations", designation: "People Operations Manager", status: "Active", mfa: "Pending", lastLoginAt: "2026-06-25T08:30:00.000Z", activeSessions: 1, risk: "Medium", accessReviewDate: "2026-06-20", createdAt: "2025-05-22T10:00:00.000Z", updatedAt: "2026-06-10T10:00:00.000Z" },
  { id: "USR-004", employeeId: "EXT-009", name: "External Auditor", email: "audit.partner@vendor.in", mobile: "9876543213", userType: "External", role: "Auditor", team: "Compliance", designation: "Statutory Auditor", status: "Active", mfa: "Enabled", lastLoginAt: "2026-06-24T11:00:00.000Z", activeSessions: 0, risk: "Medium", accessReviewDate: "2026-06-30", createdAt: "2026-04-01T10:00:00.000Z", updatedAt: "2026-06-24T11:00:00.000Z" },
];

const emptyUserForm = (): UserForm => ({
  employeeId: "",
  name: "",
  email: "",
  mobile: "",
  userType: "Employee",
  role: "Viewer",
  team: "",
  designation: "",
  risk: "Low",
  accessReviewDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
});

const GLOBAL_MODULES = ["Dashboard", "Client Operations", "Growth Marketing", "Delivery Projects", "People Operations", "Finance Control", "Admin Control", "Support Desk"] as const;
const GLOBAL_ACTIONS = ["View", "Create", "Edit", "Approve", "Export", "Administer"] as const;
const DATA_SCOPES = ["Own Records", "Team", "Department", "Business Unit", "All Company"] as const;

type GlobalModule = (typeof GLOBAL_MODULES)[number];
type GlobalAction = (typeof GLOBAL_ACTIONS)[number];
type DataScope = (typeof DATA_SCOPES)[number];
type RoleStatus = "Active" | "Inactive";

type AdminRole = {
  id: string;
  name: string;
  description: string;
  users: number;
  modules: GlobalModule[];
  actions: GlobalAction[];
  dataScope: DataScope;
  sensitiveScope: string;
  status: RoleStatus;
  protected: boolean;
  risk: UserRisk;
  lastReviewedAt: string;
  nextReviewDate: string;
  updatedAt: string;
};

type RoleForm = Pick<AdminRole, "name" | "description" | "dataScope" | "sensitiveScope" | "risk" | "nextReviewDate" | "status">;

const initialRoles: AdminRole[] = [
  { id: "ROLE-001", name: "Super Admin", description: "Protected platform owner for identity, policy, security, and organization controls.", users: 2, modules: [...GLOBAL_MODULES], actions: [...GLOBAL_ACTIONS], dataScope: "All Company", sensitiveScope: "All sensitive data", status: "Active", protected: true, risk: "High", lastReviewedAt: "2026-06-01", nextReviewDate: "2026-07-01", updatedAt: "2026-06-01T10:00:00.000Z" },
  { id: "ROLE-002", name: "Finance Manager", description: "Company finance oversight with delegated Finance Control policy and approval responsibility.", users: 4, modules: ["Dashboard", "People Operations", "Finance Control"], actions: ["View", "Create", "Edit", "Approve", "Export"], dataScope: "All Company", sensitiveScope: "Invoices, payroll and tax data", status: "Active", protected: false, risk: "High", lastReviewedAt: "2026-06-05", nextReviewDate: "2026-07-05", updatedAt: "2026-06-05T10:00:00.000Z" },
  { id: "ROLE-003", name: "Project Manager", description: "Owns project delivery, assigned client context, milestones, tasks, and team tracking.", users: 11, modules: ["Dashboard", "Client Operations", "Delivery Projects", "Support Desk"], actions: ["View", "Create", "Edit", "Export"], dataScope: "Business Unit", sensitiveScope: "Assigned client delivery data", status: "Active", protected: false, risk: "Medium", lastReviewedAt: "2026-06-10", nextReviewDate: "2026-07-10", updatedAt: "2026-06-10T10:00:00.000Z" },
  { id: "ROLE-004", name: "People Operations Manager", description: "Manages employee lifecycle, onboarding, attendance, leave, payroll readiness, and exits.", users: 3, modules: ["Dashboard", "People Operations", "Support Desk"], actions: ["View", "Create", "Edit", "Approve", "Export"], dataScope: "All Company", sensitiveScope: "Employee KYC and compensation", status: "Active", protected: false, risk: "High", lastReviewedAt: "2026-06-08", nextReviewDate: "2026-07-08", updatedAt: "2026-06-08T10:00:00.000Z" },
  { id: "ROLE-005", name: "Viewer", description: "Read-only business visibility without export, approval, or administrative authority.", users: 18, modules: ["Dashboard", "Client Operations", "Delivery Projects"], actions: ["View"], dataScope: "Department", sensitiveScope: "Masked operational data", status: "Active", protected: false, risk: "Low", lastReviewedAt: "2026-06-15", nextReviewDate: "2026-09-15", updatedAt: "2026-06-15T10:00:00.000Z" },
];

const emptyRoleForm = (): RoleForm => ({
  name: "",
  description: "",
  dataScope: "Department",
  sensitiveScope: "",
  risk: "Low",
  nextReviewDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  status: "Active",
});

type SystemEventResult = "Success" | "Blocked" | "Failed" | "Reviewed";
type InvestigationStatus = "Clear" | "Flagged" | "Investigating" | "Resolved";

type SystemAuditEvent = {
  id: string;
  sequence: number;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  module: string;
  resource: string;
  resourceId: string;
  sessionId: string;
  ipAddress: string;
  device: string;
  result: SystemEventResult;
  risk: UserRisk;
  reason: string;
  changedFields: string[];
  investigationStatus: InvestigationStatus;
  investigationNote: string;
};

const initialSystemEvents: SystemAuditEvent[] = [
  { id: "SYS-EVT-1005", sequence: 1005, timestamp: "2026-06-25T12:14:00.000Z", actorId: "USR-001", actorName: "Rajkumar Rathore", actorRole: "Super Admin", action: "Updated global role permissions", module: "Admin Control", resource: "Role", resourceId: "ROLE-002", sessionId: "SES-A91F", ipAddress: "103.87.***.21", device: "Chrome / Windows", result: "Success", risk: "High", reason: "Quarterly finance access review", changedFields: ["modules", "actions", "nextReviewDate"], investigationStatus: "Clear", investigationNote: "" },
  { id: "SYS-EVT-1004", sequence: 1004, timestamp: "2026-06-25T11:42:00.000Z", actorId: "USR-003", actorName: "Sunita Sharma", actorRole: "People Operations Manager", action: "Approved leave exception", module: "People Operations", resource: "Leave Request", resourceId: "LV-2041", sessionId: "SES-C11B", ipAddress: "49.36.***.88", device: "Edge / Windows", result: "Success", risk: "Low", reason: "Medical exception approved by People Operations", changedFields: ["status", "approvedBy"], investigationStatus: "Clear", investigationNote: "" },
  { id: "SYS-EVT-1003", sequence: 1003, timestamp: "2026-06-25T10:57:00.000Z", actorId: "USR-004", actorName: "External Auditor", actorRole: "Auditor", action: "Exported GST invoice register", module: "Finance Control", resource: "Report Export", resourceId: "EXP-GST-0625", sessionId: "SES-D02C", ipAddress: "115.96.***.14", device: "Chrome / macOS", result: "Reviewed", risk: "High", reason: "Statutory audit evidence request", changedFields: [], investigationStatus: "Flagged", investigationNote: "Confirm export approval and retention reference." },
  { id: "SYS-EVT-1002", sequence: 1002, timestamp: "2026-06-25T09:33:00.000Z", actorId: "UNKNOWN", actorName: "Unknown login", actorRole: "Unauthenticated", action: "Repeated failed password attempt", module: "Security", resource: "Authentication", resourceId: "rajkumar@dematadealgo.local", sessionId: "NO-SESSION", ipAddress: "45.129.***.10", device: "Unknown browser", result: "Blocked", risk: "High", reason: "Password policy threshold exceeded", changedFields: [], investigationStatus: "Investigating", investigationNote: "IP reputation and account targeting under review." },
  { id: "SYS-EVT-1001", sequence: 1001, timestamp: "2026-06-25T08:51:00.000Z", actorId: "USR-002", actorName: "Vikram Rathore", actorRole: "Project Manager", action: "Updated project deadline", module: "Delivery Projects", resource: "Project", resourceId: "PRJ-108", sessionId: "SES-B87E", ipAddress: "122.161.***.44", device: "Chrome / Windows", result: "Success", risk: "Medium", reason: "Client approved delivery extension", changedFields: ["dueDate", "status"], investigationStatus: "Clear", investigationNote: "" },
];

type GlobalApprovalType = "Access Change" | "Data Export" | "Security Exception" | "Integration" | "Policy Change" | "Operational Exception";
type GlobalApprovalStatus = "Pending" | "In Review" | "Clarification Required" | "Approved" | "Rejected" | "Cancelled";
type GlobalDecision = "Approve" | "Reject" | "Need Clarification";

type GlobalApprovalEvent = {
  at: string;
  actor: string;
  role: string;
  action: string;
  comment: string;
};

type GlobalApprovalRequest = {
  id: string;
  type: GlobalApprovalType;
  title: string;
  requester: string;
  requesterRole: string;
  ownerRole: string;
  secondApproverRole: string;
  approvalLevel: 1 | 2;
  module: string;
  resourceId: string;
  status: GlobalApprovalStatus;
  priority: "Low" | "Medium" | "High" | "Critical";
  risk: UserRisk;
  submittedAt: string;
  dueAt: string;
  reason: string;
  evidence: string[];
  dataScope: string;
  events: GlobalApprovalEvent[];
};

const initialGlobalApprovals: GlobalApprovalRequest[] = [
  { id: "GAP-2201", type: "Access Change", title: "Finance role access upgrade", requester: "Rajesh Kumar", requesterRole: "Accountant", ownerRole: "Super Admin", secondApproverRole: "Director", approvalLevel: 1, module: "Admin Control", resourceId: "USR-008", status: "Pending", priority: "High", risk: "High", submittedAt: "2026-06-25T07:30:00.000Z", dueAt: "2026-06-25T11:30:00.000Z", reason: "Temporary Finance Manager access required for quarter close.", evidence: ["Manager approval", "Quarter-close duty note"], dataScope: "Finance Control / All Company", events: [] },
  { id: "GAP-2202", type: "Data Export", title: "Client data export request", requester: "External Auditor", requesterRole: "Auditor", ownerRole: "Compliance Officer", secondApproverRole: "Super Admin", approvalLevel: 1, module: "Client Operations", resourceId: "EXP-CLIENT-0625", status: "In Review", priority: "High", risk: "High", submittedAt: "2026-06-25T06:45:00.000Z", dueAt: "2026-06-26T06:45:00.000Z", reason: "Sample client register required for statutory control testing.", evidence: ["Audit engagement letter", "Approved field list"], dataScope: "Masked client master fields", events: [{ at: "2026-06-25T08:00:00.000Z", actor: "Compliance Officer", role: "Compliance Officer", action: "Review Started", comment: "Data minimization scope under review." }] },
  { id: "GAP-2203", type: "Security Exception", title: "Temporary IP allowlist exception", requester: "Vikram Rathore", requesterRole: "Project Manager", ownerRole: "Super Admin", secondApproverRole: "", approvalLevel: 1, module: "Security", resourceId: "SEC-IP-041", status: "Clarification Required", priority: "Critical", risk: "High", submittedAt: "2026-06-25T05:20:00.000Z", dueAt: "2026-06-25T09:20:00.000Z", reason: "Client-site network requires temporary administrative portal access.", evidence: ["Client site email"], dataScope: "Admin Control portal login", events: [{ at: "2026-06-25T06:00:00.000Z", actor: "Rajkumar Rathore", role: "Super Admin", action: "Clarification Requested", comment: "Provide fixed IP and exception expiry time." }] },
  { id: "GAP-2204", type: "Integration", title: "Enable production WhatsApp webhook", requester: "Marketing Manager", requesterRole: "Marketing Manager", ownerRole: "Super Admin", secondApproverRole: "Director", approvalLevel: 1, module: "System Settings", resourceId: "INT-WA-009", status: "Pending", priority: "Medium", risk: "Medium", submittedAt: "2026-06-25T04:10:00.000Z", dueAt: "2026-06-27T04:10:00.000Z", reason: "Activate approved client reminder templates in production.", evidence: ["Vendor DPA", "Webhook security checklist", "Template approval"], dataScope: "Client mobile and reminder metadata", events: [] },
];

type SettingKey = "company" | "security" | "notifications" | "integrations" | "governance" | "mobile";

type AdministrationSettings = {
  company: {
    legalName: string;
    gstin: string;
    cin: string;
    registeredAddress: string;
    timezone: string;
    currency: string;
    invoicePrefix: string;
  };
  security: {
    mfaRequired: boolean;
    passwordExpiryDays: number;
    sessionTimeoutMinutes: number;
    maxFailedAttempts: number;
    ipAllowlistEnabled: boolean;
    trustedDeviceDays: number;
  };
  notifications: {
    senderName: string;
    senderEmail: string;
    smtpHost: string;
    approvalAlerts: boolean;
    securityAlerts: boolean;
    billingReminders: boolean;
    escalationHours: number;
  };
  integrations: {
    googleWorkspace: boolean;
    whatsapp: boolean;
    paymentGateway: boolean;
    webhookUrl: string;
    webhookSigningEnabled: boolean;
    environment: "Sandbox" | "Production";
  };
  governance: {
    auditRetentionDays: number;
    backupFrequency: "Daily" | "Weekly";
    piiMasking: boolean;
    exportApprovalRequired: boolean;
    legalHoldEnabled: boolean;
    archiveAfterDays: number;
  };
  mobile: {
    mobileAccessEnabled: boolean;
    biometricRequired: boolean;
    deviceLockRequired: boolean;
    remoteLogoutEnabled: boolean;
    offlineAccessAllowed: boolean;
    maxDevicesPerUser: number;
  };
};

type SettingControl = {
  key: SettingKey;
  title: string;
  description: string;
  icon: ComponentType<{ size?: number }>;
  owner: string;
  nextReviewDate: string;
  updatedAt: string;
  updatedBy: string;
};

const initialSettings: AdministrationSettings = {
  company: { legalName: "DeMatade Algo Technology Solutions Pvt Ltd", gstin: "27AABCU9603R1ZM", cin: "U72900MH2022PTC081234", registeredAddress: "Ulwe, Panvel, Navi Mumbai, Maharashtra 410206", timezone: "Asia/Kolkata", currency: "INR", invoicePrefix: "INV" },
  security: { mfaRequired: true, passwordExpiryDays: 90, sessionTimeoutMinutes: 30, maxFailedAttempts: 5, ipAllowlistEnabled: false, trustedDeviceDays: 30 },
  notifications: { senderName: "DeMatade Algo", senderEmail: "notifications@dematadealgo.local", smtpHost: "smtp.dematadealgo.local", approvalAlerts: true, securityAlerts: true, billingReminders: true, escalationHours: 24 },
  integrations: { googleWorkspace: true, whatsapp: false, paymentGateway: true, webhookUrl: "https://api.dematadealgo.local/webhooks/platform", webhookSigningEnabled: true, environment: "Production" },
  governance: { auditRetentionDays: 365, backupFrequency: "Daily", piiMasking: true, exportApprovalRequired: true, legalHoldEnabled: false, archiveAfterDays: 2555 },
  mobile: { mobileAccessEnabled: true, biometricRequired: true, deviceLockRequired: true, remoteLogoutEnabled: true, offlineAccessAllowed: false, maxDevicesPerUser: 2 },
};

const initialSettingControls: SettingControl[] = [
  { key: "company", title: "Company Profile", description: "Legal identity, GST/CIN, registered address, invoice identity, currency and timezone.", icon: Globe2, owner: "Company Secretary", nextReviewDate: "2026-09-30", updatedAt: "2026-06-01T10:00:00.000Z", updatedBy: "Rajkumar Rathore" },
  { key: "security", title: "Security Policy", description: "MFA, password expiry, session timeout, login attempts, IP allowlist and device trust.", icon: LockKeyhole, owner: "Super Admin", nextReviewDate: "2026-07-01", updatedAt: "2026-06-20T10:00:00.000Z", updatedBy: "Rajkumar Rathore" },
  { key: "notifications", title: "Email & Notifications", description: "Sender identity, SMTP routing, approval alerts, security alerts and escalation timing.", icon: MailCheck, owner: "IT Administrator", nextReviewDate: "2026-08-15", updatedAt: "2026-06-10T10:00:00.000Z", updatedBy: "IT Administrator" },
  { key: "integrations", title: "Integrations", description: "Workspace, WhatsApp, payment gateway, webhook endpoint, signing and environment.", icon: ServerCog, owner: "Integration Owner", nextReviewDate: "2026-07-15", updatedAt: "2026-06-18T10:00:00.000Z", updatedBy: "Rajkumar Rathore" },
  { key: "governance", title: "Data Governance", description: "Audit retention, backup, PII masking, export approval, legal hold and archival.", icon: ShieldCheck, owner: "Compliance Officer", nextReviewDate: "2026-07-05", updatedAt: "2026-06-12T10:00:00.000Z", updatedBy: "Compliance Officer" },
  { key: "mobile", title: "Mobile Access", description: "Mobile enablement, biometrics, device lock, remote logout, offline use and device limit.", icon: Smartphone, owner: "Security Administrator", nextReviewDate: "2026-08-01", updatedAt: "2026-06-08T10:00:00.000Z", updatedBy: "Rajkumar Rathore" },
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
  onClick,
}: {
  icon: ComponentType<{ size?: number }>;
  children: ReactNode;
  variant?: "primary" | "outline" | "accent";
  onClick?: () => void;
}) {
  const styles = {
    primary: "bg-primary text-white border-primary",
    outline: "bg-white text-primary border-border hover:bg-slate-50",
    accent: "bg-accent text-primary border-accent hover:bg-accent/90",
  };

  return (
    <button type="button" onClick={onClick} className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-black uppercase tracking-widest shadow-sm transition-all ${styles[variant]}`}>
      <Icon size={16} />
      {children}
    </button>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 items-center justify-between gap-4 rounded-xl border border-border px-3 py-2">
      <span className="text-sm font-bold text-slate-600">{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5 accent-primary" />
    </label>
  );
}

function UsersView() {
  const [userRecords, setUserRecords] = useState<AdminUser[]>(initialUsers);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | UserStatus>("All");
  const [riskFilter, setRiskFilter] = useState<"All" | UserRisk>("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<UserForm>(emptyUserForm);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  const today = new Date().toISOString().slice(0, 10);
  const activeUsers = userRecords.filter((user) => user.status === "Active");
  const mfaCoverage = activeUsers.length
    ? Math.round((activeUsers.filter((user) => user.mfa === "Enabled").length / activeUsers.length) * 100)
    : 0;
  const privilegedUsers = activeUsers.filter((user) => ["Super Admin", "Finance Manager", "HR Manager"].includes(user.role)).length;
  const reviewsDue = activeUsers.filter((user) => user.accessReviewDate <= today).length;
  const selectedUser = userRecords.find((user) => user.id === selectedId) ?? null;

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return userRecords.filter((user) => {
      const matchesStatus = statusFilter === "All" || user.status === statusFilter;
      const matchesRisk = riskFilter === "All" || user.risk === riskFilter;
      const matchesQuery = !normalized || [
        user.id, user.employeeId, user.name, user.email, user.mobile,
        user.role, user.team, user.designation, user.userType,
      ].join(" ").toLowerCase().includes(normalized);
      return matchesStatus && matchesRisk && matchesQuery;
    });
  }, [query, riskFilter, statusFilter, userRecords]);

  const updateForm = <K extends keyof UserForm>(key: K, value: UserForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyUserForm());
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (user: AdminUser) => {
    setEditingId(user.id);
    setForm({
      employeeId: user.employeeId,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      userType: user.userType,
      role: user.role,
      team: user.team,
      designation: user.designation,
      risk: user.risk,
      accessReviewDate: user.accessReviewDate,
    });
    setFormError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormError("");
  };

  const saveUser = () => {
    const email = form.email.trim().toLowerCase();
    const mobile = form.mobile.replace(/\D/g, "");
    if ([form.employeeId, form.name, email, mobile, form.role, form.team, form.designation, form.accessReviewDate].some((value) => !value.trim())) {
      setFormError("Complete all required identity and access fields.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError("Enter a valid official email address.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setFormError("Enter a valid 10 digit Indian mobile number.");
      return;
    }
    if (form.accessReviewDate < today) {
      setFormError("Access review date cannot be in the past.");
      return;
    }
    const duplicate = userRecords.find((user) =>
      user.id !== editingId && (
        user.email.toLowerCase() === email
        || user.mobile === mobile
        || user.employeeId.toLowerCase() === form.employeeId.trim().toLowerCase()
      ),
    );
    if (duplicate) {
      setFormError("Employee ID, email, or mobile is already mapped to another user.");
      return;
    }
    if (form.userType === "External" && form.role === "Super Admin") {
      setFormError("External users cannot receive the Super Admin role.");
      return;
    }

    const timestamp = new Date().toISOString();
    if (editingId) {
      setUserRecords((current) => current.map((user) => user.id === editingId ? {
        ...user,
        ...form,
        employeeId: form.employeeId.trim().toUpperCase(),
        name: form.name.trim(),
        email,
        mobile,
        team: form.team.trim(),
        designation: form.designation.trim(),
        updatedAt: timestamp,
      } : user));
      setNotice(`${form.name.trim()} user profile updated. Role changes require backend audit enforcement.`);
    } else {
      const nextId = Math.max(0, ...userRecords.map((user) => Number(user.id.match(/\d+/)?.[0] ?? 0))) + 1;
      setUserRecords((current) => [{
        id: `USR-${String(nextId).padStart(3, "0")}`,
        ...form,
        employeeId: form.employeeId.trim().toUpperCase(),
        name: form.name.trim(),
        email,
        mobile,
        team: form.team.trim(),
        designation: form.designation.trim(),
        status: "Invited",
        mfa: "Pending",
        lastLoginAt: null,
        activeSessions: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
      }, ...current]);
      setNotice(`${form.name.trim()} invited. Account remains inactive until identity setup is completed.`);
    }
    closeForm();
  };

  const setLifecycle = (user: AdminUser, status: UserStatus) => {
    if (user.role === "Super Admin" && status !== "Active") {
      const activeAdmins = userRecords.filter((item) => item.role === "Super Admin" && item.status === "Active");
      if (activeAdmins.length <= 1) {
        setNotice("The last active Super Admin cannot be suspended or deactivated.");
        return;
      }
    }
    setUserRecords((current) => current.map((item) => item.id === user.id ? {
      ...item,
      status,
      activeSessions: status === "Active" ? item.activeSessions : 0,
      updatedAt: new Date().toISOString(),
    } : item));
    setNotice(`${user.name} is now ${status.toLowerCase()}. ${status === "Active" ? "" : "All local sessions were revoked."}`);
  };

  const revokeSessions = (user: AdminUser) => {
    setUserRecords((current) => current.map((item) => item.id === user.id ? {
      ...item,
      activeSessions: 0,
      updatedAt: new Date().toISOString(),
    } : item));
    setNotice(`${user.name}'s active sessions were revoked.`);
  };

  const exportUsers = () => {
    const csvCell = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
    const rows = [
      ["User ID", "Employee ID", "Name", "Email", "Mobile", "Type", "Role", "Team", "Designation", "Status", "MFA", "Risk", "Sessions", "Review Date", "Last Login"],
      ...filteredUsers.map((user) => [
        user.id, user.employeeId, user.name, user.email, user.mobile, user.userType,
        user.role, user.team, user.designation, user.status, user.mfa, user.risk,
        user.activeSessions, user.accessReviewDate, user.lastLoginAt ?? "Never",
      ]),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `administration-users-${today}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active Users" value={String(activeUsers.length)} helper={`${userRecords.length} total identities`} icon={Users} tone="blue" />
        <MetricCard label="MFA Coverage" value={`${mfaCoverage}%`} helper={`${activeUsers.filter((user) => user.mfa !== "Enabled").length} active users pending`} icon={Fingerprint} tone="green" />
        <MetricCard label="Privileged Users" value={String(privilegedUsers)} helper="Admin-sensitive roles" icon={KeyRound} tone="amber" />
        <MetricCard label="Reviews Due" value={String(reviewsDue)} helper="Access certification required" icon={AlertTriangle} tone={reviewsDue ? "red" : "slate"} />
      </div>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-black text-primary">User Access Directory</h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">Admin view of users, teams, roles, MFA, last activity and access risk.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ActionButton icon={Download} onClick={exportUsers}>Export</ActionButton>
            <ActionButton icon={Plus} variant="accent" onClick={openCreate}>Add User</ActionButton>
          </div>
        </div>

        {notice ? (
          <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice("")} className="rounded-lg p-1 hover:bg-blue-100" title="Dismiss"><X size={16} /></button>
          </div>
        ) : null}

        <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_190px_190px]">
          <label className="relative block">
            <Search className="absolute left-3 top-3 text-slate-400" size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search user, employee ID, email, role, or team" className="h-11 w-full rounded-xl border border-border bg-white pl-10 pr-3 text-sm font-semibold text-primary outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
          </label>
          <select value={statusFilter} onChange={(event: ChangeEvent<HTMLSelectElement>) => setStatusFilter(event.target.value as "All" | UserStatus)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none">
            {["All", "Invited", "Active", "Suspended", "Deactivated"].map((status) => <option key={status} value={status}>{status} Status</option>)}
          </select>
          <select value={riskFilter} onChange={(event: ChangeEvent<HTMLSelectElement>) => setRiskFilter(event.target.value as "All" | UserRisk)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none">
            {["All", "Low", "Medium", "High"].map((risk) => <option key={risk} value={risk}>{risk} Risk</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {filteredUsers.map((user) => (
            <div key={user.email} className="rounded-2xl border border-border bg-slate-50 p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-sm font-black text-white">
                    {user.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-lg font-black text-primary">{user.name}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">{user.id} | {user.employeeId} | {user.email}</p>
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
                  <p className="text-sm font-black text-primary">{user.activeSessions}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Sessions</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <Badge tone={toneForStatus(user.risk)}>{user.risk} Risk</Badge>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => setSelectedId(user.id)} className="rounded-lg border border-border bg-white p-2 text-slate-500 hover:text-blue-600" title="View access profile"><Eye size={15} /></button>
                  <button type="button" onClick={() => openEdit(user)} className="rounded-lg border border-border bg-white p-2 text-slate-500 hover:text-primary" title="Edit user"><UserCog size={15} /></button>
                  <button type="button" onClick={() => revokeSessions(user)} className="rounded-lg border border-border bg-white p-2 text-slate-500 hover:text-amber-600" title="Revoke sessions"><LogOut size={15} /></button>
                  {user.status === "Active" ? (
                    <button type="button" onClick={() => setLifecycle(user, "Suspended")} className="rounded-lg border border-border bg-white p-2 text-slate-500 hover:text-red-600" title="Suspend user"><UserX size={15} /></button>
                  ) : (
                    <button type="button" onClick={() => setLifecycle(user, "Active")} className="rounded-lg border border-border bg-white p-2 text-slate-500 hover:text-green-600" title="Reactivate user"><RotateCcw size={15} /></button>
                  )}
                  {user.status !== "Deactivated" ? <button type="button" onClick={() => setLifecycle(user, "Deactivated")} className="rounded-lg border border-border bg-white p-2 text-slate-500 hover:text-red-700" title="Deactivate user"><ShieldAlert size={15} /></button> : null}
                </div>
              </div>
            </div>
          ))}
        </div>
        {filteredUsers.length === 0 ? <p className="py-10 text-center text-sm font-semibold text-slate-500">No user matches the current filters.</p> : null}
      </section>

      {showForm ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-primary">{editingId ? "Edit User Identity" : "Invite User"}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">Map one identity to one employee or approved external party.</p>
              </div>
              <button type="button" onClick={closeForm} className="rounded-lg border border-border p-2 text-slate-500" title="Close"><X size={18} /></button>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="space-y-1.5"><span className="text-xs font-black uppercase tracking-widest text-slate-500">User Type *</span><select value={form.userType} onChange={(event) => updateForm("userType", event.target.value as UserType)} className="h-11 w-full rounded-xl border border-border px-3 text-sm font-semibold"><option>Employee</option><option>External</option></select></label>
              <label className="space-y-1.5"><span className="text-xs font-black uppercase tracking-widest text-slate-500">Employee / External ID *</span><input value={form.employeeId} onChange={(event) => updateForm("employeeId", event.target.value)} className="h-11 w-full rounded-xl border border-border px-3 text-sm font-semibold" /></label>
              <label className="space-y-1.5"><span className="text-xs font-black uppercase tracking-widest text-slate-500">Full Name *</span><input value={form.name} onChange={(event) => updateForm("name", event.target.value)} className="h-11 w-full rounded-xl border border-border px-3 text-sm font-semibold" /></label>
              <label className="space-y-1.5"><span className="text-xs font-black uppercase tracking-widest text-slate-500">Official Email *</span><input type="email" value={form.email} onChange={(event) => updateForm("email", event.target.value)} className="h-11 w-full rounded-xl border border-border px-3 text-sm font-semibold" /></label>
              <label className="space-y-1.5"><span className="text-xs font-black uppercase tracking-widest text-slate-500">Mobile *</span><input inputMode="numeric" value={form.mobile} onChange={(event) => updateForm("mobile", event.target.value)} className="h-11 w-full rounded-xl border border-border px-3 text-sm font-semibold" /></label>
              <label className="space-y-1.5"><span className="text-xs font-black uppercase tracking-widest text-slate-500">Role *</span><select value={form.role} onChange={(event) => updateForm("role", event.target.value)} className="h-11 w-full rounded-xl border border-border px-3 text-sm font-semibold">{["Viewer", "Auditor", "Sales", "Accountant", "Finance Manager", "Project Manager", "HR Manager", "Super Admin"].map((role) => <option key={role}>{role}</option>)}</select></label>
              <label className="space-y-1.5"><span className="text-xs font-black uppercase tracking-widest text-slate-500">Department / Team *</span><input value={form.team} onChange={(event) => updateForm("team", event.target.value)} className="h-11 w-full rounded-xl border border-border px-3 text-sm font-semibold" /></label>
              <label className="space-y-1.5"><span className="text-xs font-black uppercase tracking-widest text-slate-500">Designation *</span><input value={form.designation} onChange={(event) => updateForm("designation", event.target.value)} className="h-11 w-full rounded-xl border border-border px-3 text-sm font-semibold" /></label>
              <label className="space-y-1.5"><span className="text-xs font-black uppercase tracking-widest text-slate-500">Risk Classification *</span><select value={form.risk} onChange={(event) => updateForm("risk", event.target.value as UserRisk)} className="h-11 w-full rounded-xl border border-border px-3 text-sm font-semibold"><option>Low</option><option>Medium</option><option>High</option></select></label>
              <label className="space-y-1.5"><span className="text-xs font-black uppercase tracking-widest text-slate-500">Next Access Review *</span><input type="date" min={today} value={form.accessReviewDate} onChange={(event) => updateForm("accessReviewDate", event.target.value)} className="h-11 w-full rounded-xl border border-border px-3 text-sm font-semibold" /></label>
            </div>
            {formError ? <div className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700"><ShieldAlert className="mt-0.5 shrink-0" size={17} />{formError}</div> : null}
            <div className="mt-6 flex justify-end gap-3 border-t border-border pt-5">
              <ActionButton icon={X} onClick={closeForm}>Cancel</ActionButton>
              <ActionButton icon={editingId ? UserCog : Plus} variant="accent" onClick={saveUser}>{editingId ? "Update User" : "Send Invite"}</ActionButton>
            </div>
          </div>
        </div>
      ) : null}

      {selectedUser ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div><h3 className="text-xl font-black text-primary">{selectedUser.name}</h3><p className="mt-1 text-sm font-semibold text-slate-500">{selectedUser.id} | {selectedUser.email}</p></div>
              <button type="button" onClick={() => setSelectedId(null)} className="rounded-lg border border-border p-2 text-slate-500" title="Close"><X size={18} /></button>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                ["Status", selectedUser.status],
                ["MFA", selectedUser.mfa],
                ["Sessions", String(selectedUser.activeSessions)],
                ["Risk", selectedUser.risk],
              ].map(([label, value]) => <div key={label} className="rounded-xl border border-border bg-slate-50 p-3"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p><p className="mt-2 text-sm font-black text-primary">{value}</p></div>)}
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-border p-4"><p className="text-xs font-black uppercase tracking-widest text-slate-400">Access Assignment</p><p className="mt-3 font-black text-primary">{selectedUser.role}</p><p className="mt-1 text-sm font-semibold text-slate-500">{selectedUser.team} | {selectedUser.designation}</p></div>
              <div className="rounded-xl border border-border p-4"><p className="text-xs font-black uppercase tracking-widest text-slate-400">Security Activity</p><p className="mt-3 text-sm font-black text-primary">{selectedUser.lastLoginAt ? new Date(selectedUser.lastLoginAt).toLocaleString("en-IN") : "Never logged in"}</p><p className="mt-1 text-sm font-semibold text-slate-500">Review due {selectedUser.accessReviewDate}</p></div>
            </div>
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-800"><MonitorSmartphone className="mt-0.5 shrink-0" size={16} />Production backend must issue and revoke real sessions, enforce MFA, and write immutable identity/role-change audit events.</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function RolesView() {
  const [roleRecords, setRoleRecords] = useState<AdminRole[]>(initialRoles);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | RoleStatus>("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [form, setForm] = useState<RoleForm>(emptyRoleForm);
  const [selectedModules, setSelectedModules] = useState<GlobalModule[]>([]);
  const [selectedActions, setSelectedActions] = useState<GlobalAction[]>(["View"]);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  const today = new Date().toISOString().slice(0, 10);
  const activeRoles = roleRecords.filter((role) => role.status === "Active");
  const permissionRules = roleRecords.reduce((total, role) => total + role.modules.length * role.actions.length, 0);
  const privilegedRoles = activeRoles.filter((role) => role.actions.includes("Administer") || role.actions.includes("Approve") || role.risk === "High").length;
  const reviewsDue = activeRoles.filter((role) => role.nextReviewDate <= today).length;
  const editingRole = roleRecords.find((role) => role.id === editingId) ?? null;
  const detailRole = roleRecords.find((role) => role.id === detailId) ?? null;

  const filteredRoles = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return roleRecords.filter((role) => {
      const matchesStatus = statusFilter === "All" || role.status === statusFilter;
      const matchesQuery = !normalized || [
        role.id, role.name, role.description, role.sensitiveScope, role.dataScope,
        role.modules.join(" "), role.actions.join(" "),
      ].join(" ").toLowerCase().includes(normalized);
      return matchesStatus && matchesQuery;
    });
  }, [query, roleRecords, statusFilter]);

  const updateRoleForm = <K extends keyof RoleForm>(key: K, value: RoleForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyRoleForm());
    setSelectedModules(["Dashboard"]);
    setSelectedActions(["View"]);
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (role: AdminRole) => {
    setEditingId(role.id);
    setForm({
      name: role.name,
      description: role.description,
      dataScope: role.dataScope,
      sensitiveScope: role.sensitiveScope,
      risk: role.risk,
      nextReviewDate: role.nextReviewDate,
      status: role.status,
    });
    setSelectedModules(role.modules);
    setSelectedActions(role.actions);
    setFormError("");
    setShowForm(true);
  };

  const closeRoleForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormError("");
  };

  const toggleModule = (module: GlobalModule) => {
    if (editingRole?.protected) return;
    setSelectedModules((current) => current.includes(module) ? current.filter((item) => item !== module) : [...current, module]);
  };

  const toggleAction = (action: GlobalAction) => {
    if (editingRole?.protected || action === "View") return;
    setSelectedActions((current) => current.includes(action) ? current.filter((item) => item !== action) : [...current, action]);
  };

  const saveRole = () => {
    if (form.name.trim().length < 3 || form.description.trim().length < 10 || form.sensitiveScope.trim().length < 3) {
      setFormError("Enter a valid role name, responsibility description, and sensitive-data scope.");
      return;
    }
    if (!selectedModules.length || !selectedActions.length) {
      setFormError("Select at least one module and one action.");
      return;
    }
    if (!selectedActions.includes("View")) {
      setFormError("Every active permission set must include View access.");
      return;
    }
    if (form.nextReviewDate < today) {
      setFormError("Next access review cannot be in the past.");
      return;
    }
    const duplicate = roleRecords.some((role) => role.id !== editingId && role.name.toLowerCase() === form.name.trim().toLowerCase());
    if (duplicate) {
      setFormError("A role with this name already exists.");
      return;
    }
    if (selectedActions.includes("Administer") && !selectedModules.includes("Admin Control")) {
      setFormError("Administer action requires the Admin Control module.");
      return;
    }
    if (selectedModules.includes("Admin Control") && selectedActions.includes("Administer") && form.risk !== "High") {
      setFormError("Administrative roles must be classified as High risk.");
      return;
    }
    if (form.dataScope === "All Company" && form.risk === "Low") {
      setFormError("All Company data scope cannot be classified as Low risk.");
      return;
    }

    const timestamp = new Date().toISOString();
    if (editingRole) {
      setRoleRecords((current) => current.map((role) => role.id === editingRole.id ? {
        ...role,
        name: role.protected ? role.name : form.name.trim(),
        description: form.description.trim(),
        modules: role.protected ? [...GLOBAL_MODULES] : selectedModules,
        actions: role.protected ? [...GLOBAL_ACTIONS] : selectedActions,
        dataScope: form.dataScope,
        sensitiveScope: form.sensitiveScope.trim(),
        risk: role.protected ? "High" : form.risk,
        status: role.protected ? "Active" : form.status,
        lastReviewedAt: today,
        nextReviewDate: form.nextReviewDate,
        updatedAt: timestamp,
      } : role));
      setNotice(`${editingRole.name} policy updated in the global role register.`);
    } else {
      const nextId = Math.max(0, ...roleRecords.map((role) => Number(role.id.match(/\d+/)?.[0] ?? 0))) + 1;
      setRoleRecords((current) => [...current, {
        id: `ROLE-${String(nextId).padStart(3, "0")}`,
        name: form.name.trim(),
        description: form.description.trim(),
        users: 0,
        modules: selectedModules,
        actions: selectedActions,
        dataScope: form.dataScope,
        sensitiveScope: form.sensitiveScope.trim(),
        status: form.status,
        protected: false,
        risk: form.risk,
        lastReviewedAt: today,
        nextReviewDate: form.nextReviewDate,
        updatedAt: timestamp,
      }]);
      setNotice(`${form.name.trim()} created with zero assigned users.`);
    }
    closeRoleForm();
  };

  const toggleRoleStatus = (role: AdminRole) => {
    if (role.protected) {
      setNotice("Protected Super Admin role cannot be disabled.");
      return;
    }
    if (role.status === "Active" && role.users > 0) {
      setNotice(`${role.name} has ${role.users} assigned users. Reassign or suspend those users before deactivating the role.`);
      return;
    }
    const status: RoleStatus = role.status === "Active" ? "Inactive" : "Active";
    setRoleRecords((current) => current.map((item) => item.id === role.id ? { ...item, status, updatedAt: new Date().toISOString() } : item));
    setNotice(`${role.name} is now ${status.toLowerCase()}.`);
  };

  const exportRoles = () => {
    const csvCell = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
    const rows = [
      ["Role ID", "Role", "Status", "Users", "Modules", "Actions", "Data Scope", "Sensitive Scope", "Risk", "Last Review", "Next Review"],
      ...filteredRoles.map((role) => [
        role.id, role.name, role.status, role.users, role.modules.join(" | "), role.actions.join(" | "),
        role.dataScope, role.sensitiveScope, role.risk, role.lastReviewedAt, role.nextReviewDate,
      ]),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `administration-role-matrix-${today}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active Roles" value={String(activeRoles.length)} helper={`${roleRecords.length} total policies`} icon={Shield} tone="blue" />
        <MetricCard label="Permission Rules" value={String(permissionRules)} helper="Module and action grants" icon={UserCog} tone="purple" />
        <MetricCard label="Privileged Roles" value={String(privilegedRoles)} helper="Approval, admin, or high risk" icon={AlertTriangle} tone="red" />
        <MetricCard label="Reviews Due" value={String(reviewsDue)} helper="Access certification required" icon={CheckCircle2} tone={reviewsDue ? "amber" : "green"} />
      </div>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="text-lg font-black text-primary">Global Role & Permission Matrix</h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">Company-wide module entry and data scope. Finance action limits remain delegated to Finance Control access policies.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ActionButton icon={Download} onClick={exportRoles}>Export Matrix</ActionButton>
            <ActionButton icon={Plus} variant="accent" onClick={openCreate}>New Role</ActionButton>
          </div>
        </div>

        {notice ? <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800"><span>{notice}</span><button type="button" onClick={() => setNotice("")} className="rounded-lg p-1 hover:bg-blue-100" title="Dismiss"><X size={16} /></button></div> : null}

        <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-[1fr_210px]">
          <label className="relative block">
            <Search className="absolute left-3 top-3 text-slate-400" size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search role, module, action, or data scope" className="h-11 w-full rounded-xl border border-border bg-white pl-10 pr-3 text-sm font-semibold text-primary outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
          </label>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "All" | RoleStatus)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none">
            <option value="All">All Status</option><option value="Active">Active</option><option value="Inactive">Inactive</option>
          </select>
        </div>

        <div className="space-y-4">
          {filteredRoles.map((item) => {
            const coverage = Math.round(((item.modules.length * item.actions.length) / (GLOBAL_MODULES.length * GLOBAL_ACTIONS.length)) * 100);
            return (
            <div key={item.id} className="rounded-2xl border border-border bg-slate-50 p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {item.protected ? <ShieldCheck size={17} className="text-purple-600" /> : <Shield size={17} className="text-slate-400" />}
                    <p className="text-lg font-black text-primary">{item.name}</p>
                  </div>
                  <p className="mt-1 max-w-3xl text-xs font-bold leading-5 text-slate-500">{item.description}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone={toneForStatus(item.risk)}>{item.risk} Risk</Badge>
                  <Badge tone="blue">{item.users} Users</Badge>
                  <Badge tone={item.protected ? "purple" : item.status === "Active" ? "green" : "slate"}>{item.protected ? "Protected" : item.status}</Badge>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_220px_160px] lg:items-center">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-500">
                    <span>Permission Coverage</span>
                    <span>{coverage}%</span>
                  </div>
                  <ProgressBar value={coverage} tone={item.risk === "High" ? "red" : item.risk === "Medium" ? "amber" : "green"} />
                  <p className="text-xs font-semibold text-slate-500">{item.modules.join(", ")} | {item.actions.join(", ")}</p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="text-sm font-black text-primary">{item.sensitiveScope}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Sensitive Scope</p>
                </div>
                <div className="flex justify-end gap-1">
                  <button type="button" onClick={() => setDetailId(item.id)} className="rounded-lg border border-border bg-white p-2 text-slate-500 hover:text-blue-600" title="View effective role"><Eye size={15} /></button>
                  <button type="button" onClick={() => openEdit(item)} className="rounded-lg border border-border bg-white p-2 text-slate-500 hover:text-primary" title="Edit role policy"><UserCog size={15} /></button>
                  <button type="button" onClick={() => toggleRoleStatus(item)} className="rounded-lg border border-border bg-white p-2 text-slate-500 hover:text-red-600" title={item.status === "Active" ? "Deactivate role" : "Activate role"}>{item.status === "Active" ? <UserX size={15} /> : <RotateCcw size={15} />}</button>
                </div>
              </div>
            </div>
          )})}
        </div>
        {filteredRoles.length === 0 ? <p className="py-10 text-center text-sm font-semibold text-slate-500">No role matches the current filters.</p> : null}
      </section>

      {showForm ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-border bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div><h3 className="text-xl font-black text-primary">{editingRole ? "Edit Global Role" : "Create Global Role"}</h3><p className="mt-1 text-sm font-semibold text-slate-500">Grant company module access using least privilege and a defined data boundary.</p></div>
              <button type="button" onClick={closeRoleForm} className="rounded-lg border border-border p-2 text-slate-500" title="Close"><X size={18} /></button>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="space-y-1.5"><span className="text-xs font-black uppercase tracking-widest text-slate-500">Role Name *</span><input disabled={editingRole?.protected} value={form.name} onChange={(event) => updateRoleForm("name", event.target.value)} className="h-11 w-full rounded-xl border border-border px-3 text-sm font-semibold disabled:bg-slate-100" /></label>
              <label className="space-y-1.5"><span className="text-xs font-black uppercase tracking-widest text-slate-500">Status *</span><select disabled={editingRole?.protected} value={form.status} onChange={(event) => updateRoleForm("status", event.target.value as RoleStatus)} className="h-11 w-full rounded-xl border border-border px-3 text-sm font-semibold disabled:bg-slate-100"><option>Active</option><option>Inactive</option></select></label>
              <label className="space-y-1.5 md:col-span-2"><span className="text-xs font-black uppercase tracking-widest text-slate-500">Responsibility Description *</span><textarea rows={3} value={form.description} onChange={(event) => updateRoleForm("description", event.target.value)} className="w-full rounded-xl border border-border px-3 py-3 text-sm font-semibold" /></label>
              <label className="space-y-1.5"><span className="text-xs font-black uppercase tracking-widest text-slate-500">Data Scope *</span><select value={form.dataScope} onChange={(event) => updateRoleForm("dataScope", event.target.value as DataScope)} className="h-11 w-full rounded-xl border border-border px-3 text-sm font-semibold">{DATA_SCOPES.map((scope) => <option key={scope}>{scope}</option>)}</select></label>
              <label className="space-y-1.5"><span className="text-xs font-black uppercase tracking-widest text-slate-500">Risk *</span><select disabled={editingRole?.protected} value={form.risk} onChange={(event) => updateRoleForm("risk", event.target.value as UserRisk)} className="h-11 w-full rounded-xl border border-border px-3 text-sm font-semibold disabled:bg-slate-100"><option>Low</option><option>Medium</option><option>High</option></select></label>
              <label className="space-y-1.5"><span className="text-xs font-black uppercase tracking-widest text-slate-500">Sensitive Data Scope *</span><input value={form.sensitiveScope} onChange={(event) => updateRoleForm("sensitiveScope", event.target.value)} className="h-11 w-full rounded-xl border border-border px-3 text-sm font-semibold" /></label>
              <label className="space-y-1.5"><span className="text-xs font-black uppercase tracking-widest text-slate-500">Next Review *</span><input type="date" min={today} value={form.nextReviewDate} onChange={(event) => updateRoleForm("nextReviewDate", event.target.value)} className="h-11 w-full rounded-xl border border-border px-3 text-sm font-semibold" /></label>
            </div>

            <div className="mt-6">
              <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-500">Global Modules *</p>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">{GLOBAL_MODULES.map((module) => <button key={module} type="button" disabled={editingRole?.protected} onClick={() => toggleModule(module)} className={`flex h-11 items-center justify-between rounded-xl border px-3 text-sm font-black ${selectedModules.includes(module) ? "border-primary bg-blue-50 text-primary" : "border-border text-slate-500"} disabled:cursor-not-allowed disabled:opacity-70`}><span>{module}</span>{selectedModules.includes(module) ? <CheckCircle2 size={15} /> : null}</button>)}</div>
            </div>
            <div className="mt-6">
              <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-500">Allowed Actions *</p>
              <div className="flex flex-wrap gap-2">{GLOBAL_ACTIONS.map((action) => <button key={action} type="button" disabled={editingRole?.protected || action === "View"} onClick={() => toggleAction(action)} className={`h-10 rounded-xl border px-4 text-sm font-black ${selectedActions.includes(action) ? "border-primary bg-primary text-white" : "border-border text-slate-500"} disabled:cursor-not-allowed disabled:opacity-70`}>{action}</button>)}</div>
            </div>
            {selectedModules.includes("Finance Control") ? <div className="mt-5 rounded-xl border border-cyan-200 bg-cyan-50 p-3 text-xs font-semibold leading-5 text-cyan-800">Finance Control module entry is granted here. Invoice, payment, tax, payroll, approval-limit, and finance audit permissions remain controlled by Finance Control access policies.</div> : null}
            {formError ? <div className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700"><ShieldAlert className="mt-0.5 shrink-0" size={17} />{formError}</div> : null}
            <div className="mt-6 flex justify-end gap-3 border-t border-border pt-5"><ActionButton icon={X} onClick={closeRoleForm}>Cancel</ActionButton><ActionButton icon={ShieldCheck} variant="accent" onClick={saveRole}>{editingRole ? "Update Role" : "Create Role"}</ActionButton></div>
          </div>
        </div>
      ) : null}

      {detailRole ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-2xl border border-border bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4"><div><h3 className="text-xl font-black text-primary">{detailRole.name}</h3><p className="mt-1 text-sm font-semibold text-slate-500">{detailRole.id} | {detailRole.users} assigned users</p></div><button type="button" onClick={() => setDetailId(null)} className="rounded-lg border border-border p-2 text-slate-500" title="Close"><X size={18} /></button></div>
            <p className="mt-5 text-sm font-semibold leading-6 text-slate-600">{detailRole.description}</p>
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">{[["Status", detailRole.protected ? "Protected" : detailRole.status], ["Data Scope", detailRole.dataScope], ["Risk", detailRole.risk], ["Next Review", detailRole.nextReviewDate]].map(([label, value]) => <div key={label} className="rounded-xl border border-border bg-slate-50 p-3"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p><p className="mt-2 text-sm font-black text-primary">{value}</p></div>)}</div>
            <div className="mt-5"><p className="text-xs font-black uppercase tracking-widest text-slate-500">Effective Modules</p><div className="mt-3 flex flex-wrap gap-2">{detailRole.modules.map((module) => <Badge key={module} tone="blue">{module}</Badge>)}</div></div>
            <div className="mt-5"><p className="text-xs font-black uppercase tracking-widest text-slate-500">Effective Actions</p><div className="mt-3 flex flex-wrap gap-2">{detailRole.actions.map((action) => <Badge key={action} tone="green">{action}</Badge>)}</div></div>
            <div className="mt-5 rounded-xl border border-border p-4"><p className="text-xs font-black uppercase tracking-widest text-slate-400">Sensitive Scope</p><p className="mt-2 text-sm font-black text-primary">{detailRole.sensitiveScope}</p></div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function LogsView() {
  const [events, setEvents] = useState<SystemAuditEvent[]>(initialSystemEvents);
  const [query, setQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [riskFilter, setRiskFilter] = useState<"All" | UserRisk>("All");
  const [investigationFilter, setInvestigationFilter] = useState<"All" | InvestigationStatus>("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [investigationStatus, setInvestigationStatus] = useState<InvestigationStatus>("Clear");
  const [investigationNote, setInvestigationNote] = useState("");
  const [investigationError, setInvestigationError] = useState("");
  const [notice, setNotice] = useState("");

  const modules = ["All", ...Array.from(new Set(events.map((event) => event.module)))];
  const filteredEvents = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return events.filter((event) => {
      const matchesQuery = !normalized || [
        event.id, event.actorId, event.actorName, event.actorRole, event.action,
        event.module, event.resource, event.resourceId, event.sessionId,
        event.ipAddress, event.result, event.reason,
      ].join(" ").toLowerCase().includes(normalized);
      return matchesQuery
        && (moduleFilter === "All" || event.module === moduleFilter)
        && (riskFilter === "All" || event.risk === riskFilter)
        && (investigationFilter === "All" || event.investigationStatus === investigationFilter);
    });
  }, [events, investigationFilter, moduleFilter, query, riskFilter]);

  const selectedEvent = events.find((event) => event.id === selectedId) ?? null;
  const highRiskEvents = events.filter((event) => event.risk === "High").length;
  const blockedEvents = events.filter((event) => event.result === "Blocked" || event.result === "Failed").length;
  const openInvestigations = events.filter((event) => ["Flagged", "Investigating"].includes(event.investigationStatus)).length;
  const uniqueSessions = new Set(events.filter((event) => event.sessionId !== "NO-SESSION").map((event) => event.sessionId)).size;

  const openEvent = (event: SystemAuditEvent) => {
    setSelectedId(event.id);
    setInvestigationStatus(event.investigationStatus);
    setInvestigationNote(event.investigationNote);
    setInvestigationError("");
  };

  const saveInvestigation = () => {
    if (!selectedEvent) return;
    if (investigationStatus !== "Clear" && investigationNote.trim().length < 8) {
      setInvestigationError("Flagged, investigating, or resolved events require a note of at least 8 characters.");
      return;
    }
    setEvents((current) => current.map((event) => event.id === selectedEvent.id ? {
      ...event,
      investigationStatus,
      investigationNote: investigationNote.trim(),
    } : event));
    setNotice(`${selectedEvent.id} investigation metadata updated. Original event facts were not changed.`);
    setSelectedId(null);
    setInvestigationError("");
  };

  const exportEvents = (format: "csv" | "json") => {
    const timestamp = new Date().toISOString().slice(0, 10);
    let blob: Blob;
    let filename: string;
    if (format === "json") {
      blob = new Blob([JSON.stringify(filteredEvents, null, 2)], { type: "application/json" });
      filename = `system-audit-trail-${timestamp}.json`;
    } else {
      const csvCell = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
      const rows = [
        ["Event ID", "Sequence", "Timestamp", "Actor ID", "Actor", "Role", "Action", "Module", "Resource", "Resource ID", "Session", "IP", "Device", "Result", "Risk", "Reason", "Changed Fields", "Investigation", "Investigation Note"],
        ...filteredEvents.map((event) => [
          event.id, event.sequence, event.timestamp, event.actorId, event.actorName, event.actorRole,
          event.action, event.module, event.resource, event.resourceId, event.sessionId,
          event.ipAddress, event.device, event.result, event.risk, event.reason,
          event.changedFields.join(" | "), event.investigationStatus, event.investigationNote,
        ]),
      ];
      blob = new Blob([rows.map((row) => row.map(csvCell).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
      filename = `system-audit-trail-${timestamp}.csv`;
    }
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="System Events" value={String(events.length)} helper={`${uniqueSessions} authenticated sessions`} icon={Activity} tone="blue" />
        <MetricCard label="High Risk Events" value={String(highRiskEvents)} helper="Security, access, and exports" icon={AlertTriangle} tone="red" />
        <MetricCard label="Blocked Actions" value={String(blockedEvents)} helper="Authentication or policy prevented" icon={ShieldCheck} tone="green" />
        <MetricCard label="Open Investigations" value={String(openInvestigations)} helper="Flagged or under review" icon={History} tone={openInvestigations ? "amber" : "purple"} />
      </div>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="text-lg font-black text-primary">System Event Register</h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">Company-wide identity, security, access, export, approval, and cross-module administrative events.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ActionButton icon={Download} onClick={() => exportEvents("csv")}>Export CSV</ActionButton>
            <ActionButton icon={FileCheck2} variant="accent" onClick={() => exportEvents("json")}>Forensic JSON</ActionButton>
          </div>
        </div>

        <div className="mb-5 rounded-xl border border-cyan-200 bg-cyan-50 p-3 text-xs font-semibold leading-5 text-cyan-800">
          This register covers platform-wide security and Admin Control. Finance transaction evidence remains in Finance Control audit logs and should feed this register through stable event references in the backend.
        </div>

        {notice ? <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800"><span>{notice}</span><button type="button" onClick={() => setNotice("")} className="rounded-lg p-1 hover:bg-blue-100" title="Dismiss"><X size={16} /></button></div> : null}

        <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_180px_160px_190px]">
          <label className="relative block">
            <Search className="absolute left-3 top-3 text-slate-400" size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search event, actor, session, IP, resource, or reason" className="h-11 w-full rounded-xl border border-border bg-white pl-10 pr-3 text-sm font-semibold text-primary outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
          </label>
          <select value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none">{modules.map((module) => <option key={module}>{module}</option>)}</select>
          <select value={riskFilter} onChange={(event) => setRiskFilter(event.target.value as "All" | UserRisk)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none">{["All", "Low", "Medium", "High"].map((risk) => <option key={risk}>{risk} Risk</option>)}</select>
          <select value={investigationFilter} onChange={(event) => setInvestigationFilter(event.target.value as "All" | InvestigationStatus)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none">{["All", "Clear", "Flagged", "Investigating", "Resolved"].map((status) => <option key={status}>{status} Investigation</option>)}</select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead>
              <tr className="border-b border-slate-100">
                {["Event / Time", "Actor", "Action / Resource", "Module", "Session / IP", "Result", "Investigation", "Detail"].map((head) => (
                  <th key={head} className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEvents.map((event) => (
                <tr key={event.id} className="hover:bg-slate-50/60">
                  <td className="py-5 pr-4"><p className="text-sm font-black text-primary">{event.id}</p><p className="mt-1 text-xs font-semibold text-slate-500">{new Date(event.timestamp).toLocaleString("en-IN")}</p></td>
                  <td className="py-5 pr-4"><p className="text-sm font-black text-slate-700">{event.actorName}</p><p className="mt-1 text-xs font-semibold text-slate-500">{event.actorId} | {event.actorRole}</p></td>
                  <td className="py-5 pr-4"><p className="text-sm font-bold text-slate-700">{event.action}</p><p className="mt-1 text-xs font-semibold text-slate-500">{event.resource}: {event.resourceId}</p></td>
                  <td className="py-5 pr-4 text-sm font-bold text-slate-500">{event.module}</td>
                  <td className="py-5 pr-4"><p className="text-xs font-black text-slate-700">{event.sessionId}</p><p className="mt-1 text-xs font-semibold text-slate-500">{event.ipAddress}</p></td>
                  <td className="py-5 pr-4"><div className="space-y-2"><Badge tone={toneForStatus(event.result)}>{event.result}</Badge><Badge tone={toneForStatus(event.risk)}>{event.risk} Risk</Badge></div></td>
                  <td className="py-5 pr-4"><Badge tone={event.investigationStatus === "Clear" || event.investigationStatus === "Resolved" ? "green" : event.investigationStatus === "Investigating" ? "red" : "amber"}>{event.investigationStatus}</Badge></td>
                  <td className="py-5"><button type="button" onClick={() => openEvent(event)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-blue-600" title="View system event"><Eye size={15} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredEvents.length === 0 ? <p className="py-10 text-center text-sm font-semibold text-slate-500">No system event matches the current filters.</p> : null}
      </section>

      {selectedEvent ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-border bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div><h3 className="text-xl font-black text-primary">{selectedEvent.id}</h3><p className="mt-1 text-sm font-semibold text-slate-500">Sequence {selectedEvent.sequence} | {new Date(selectedEvent.timestamp).toLocaleString("en-IN")}</p></div>
              <button type="button" onClick={() => setSelectedId(null)} className="rounded-lg border border-border p-2 text-slate-500" title="Close"><X size={18} /></button>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
              {[["Actor", `${selectedEvent.actorName} (${selectedEvent.actorId})`], ["Role", selectedEvent.actorRole], ["Result", selectedEvent.result], ["Risk", selectedEvent.risk], ["Module", selectedEvent.module], ["Resource", `${selectedEvent.resource} / ${selectedEvent.resourceId}`], ["Session", selectedEvent.sessionId], ["IP / Device", `${selectedEvent.ipAddress} / ${selectedEvent.device}`]].map(([label, value]) => <div key={label} className="rounded-xl border border-border bg-slate-50 p-3"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p><p className="mt-2 break-words text-sm font-black text-primary">{value}</p></div>)}
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-border p-4"><p className="text-xs font-black uppercase tracking-widest text-slate-400">Action</p><p className="mt-2 text-sm font-black text-primary">{selectedEvent.action}</p><p className="mt-3 text-xs font-semibold leading-5 text-slate-500">{selectedEvent.reason}</p></div>
              <div className="rounded-xl border border-border p-4"><p className="text-xs font-black uppercase tracking-widest text-slate-400">Changed Fields</p><p className="mt-2 text-sm font-black text-primary">{selectedEvent.changedFields.length ? selectedEvent.changedFields.join(", ") : "No record fields changed"}</p></div>
            </div>
            <div className="mt-5 rounded-xl border border-border p-4">
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">Investigation Metadata</p>
              <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr]">
                <select value={investigationStatus} onChange={(event) => setInvestigationStatus(event.target.value as InvestigationStatus)} className="h-11 rounded-xl border border-border px-3 text-sm font-semibold"><option>Clear</option><option>Flagged</option><option>Investigating</option><option>Resolved</option></select>
                <textarea rows={3} value={investigationNote} onChange={(event) => setInvestigationNote(event.target.value)} placeholder="Evidence review, owner, finding, or resolution note" className="rounded-xl border border-border px-3 py-3 text-sm font-semibold" />
              </div>
              {investigationError ? <p className="mt-2 text-xs font-black text-red-600">{investigationError}</p> : null}
              <div className="mt-4 flex justify-end"><ActionButton icon={ShieldCheck} variant="accent" onClick={saveInvestigation}>Save Investigation</ActionButton></div>
            </div>
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-800">Event facts are append-only. This control updates investigation metadata only; production must preserve the original server event, trusted timestamp, and cryptographic integrity proof.</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ApprovalsView() {
  const [requests, setRequests] = useState<GlobalApprovalRequest[]>(initialGlobalApprovals);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | GlobalApprovalStatus>("All");
  const [typeFilter, setTypeFilter] = useState<"All" | GlobalApprovalType>("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [decision, setDecision] = useState<GlobalDecision>("Approve");
  const [comment, setComment] = useState("");
  const [decisionError, setDecisionError] = useState("");
  const [notice, setNotice] = useState("");
  const [clock] = useState(() => Date.now());

  const currentActor = "Rajkumar Rathore";
  const currentRole = "Super Admin";
  const selectedRequest = requests.find((request) => request.id === selectedId) ?? null;
  const filteredRequests = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return requests.filter((request) => {
      const matchesQuery = !normalized || [
        request.id, request.type, request.title, request.requester, request.requesterRole,
        request.ownerRole, request.module, request.resourceId, request.reason, request.dataScope,
      ].join(" ").toLowerCase().includes(normalized);
      return matchesQuery
        && (statusFilter === "All" || request.status === statusFilter)
        && (typeFilter === "All" || request.type === typeFilter);
    });
  }, [query, requests, statusFilter, typeFilter]);

  const pending = requests.filter((request) => ["Pending", "In Review", "Clarification Required"].includes(request.status)).length;
  const overdue = requests.filter((request) => ["Pending", "In Review", "Clarification Required"].includes(request.status) && new Date(request.dueAt).getTime() < clock).length;
  const highRisk = requests.filter((request) => ["Pending", "In Review", "Clarification Required"].includes(request.status) && request.risk === "High").length;
  const accessChanges = requests.filter((request) => request.type === "Access Change" && ["Pending", "In Review"].includes(request.status)).length;

  const openRequest = (request: GlobalApprovalRequest) => {
    setSelectedId(request.id);
    setDecision("Approve");
    setComment("");
    setDecisionError("");
  };

  const canDecide = (request: GlobalApprovalRequest) =>
    !["Approved", "Rejected", "Cancelled"].includes(request.status)
    && request.requesterRole !== currentRole
    && (request.ownerRole === currentRole || request.secondApproverRole === currentRole);

  const saveDecision = () => {
    if (!selectedRequest) return;
    if (!canDecide(selectedRequest)) {
      setDecisionError("This request is not assigned to your role or violates separation of duties.");
      return;
    }
    if (comment.trim().length < 8) {
      setDecisionError("Decision comment must contain at least 8 characters.");
      return;
    }
    if (decision === "Approve" && selectedRequest.evidence.length === 0) {
      setDecisionError("Approval requires at least one evidence reference.");
      return;
    }

    const at = new Date().toISOString();
    setRequests((current) => current.map((request) => {
      if (request.id !== selectedRequest.id) return request;
      const event: GlobalApprovalEvent = { at, actor: currentActor, role: currentRole, action: decision, comment: comment.trim() };
      if (decision === "Need Clarification") {
        return { ...request, status: "Clarification Required", events: [...request.events, event] };
      }
      if (decision === "Reject") {
        return { ...request, status: "Rejected", events: [...request.events, event] };
      }
      if (request.secondApproverRole && request.approvalLevel === 1 && request.secondApproverRole !== currentRole) {
        return { ...request, status: "In Review", approvalLevel: 2, ownerRole: request.secondApproverRole, events: [...request.events, { ...event, action: "Level 1 Approved" }] };
      }
      return { ...request, status: "Approved", events: [...request.events, event] };
    }));
    setNotice(`${selectedRequest.id} decision recorded with actor, role, timestamp, and comment.`);
    setSelectedId(null);
  };

  const exportApprovals = () => {
    const csvCell = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
    const rows = [
      ["Request ID", "Type", "Title", "Requester", "Requester Role", "Owner Role", "Second Approver", "Level", "Module", "Resource", "Status", "Priority", "Risk", "Submitted", "Due", "Reason", "Evidence", "Data Scope"],
      ...filteredRequests.map((request) => [
        request.id, request.type, request.title, request.requester, request.requesterRole,
        request.ownerRole, request.secondApproverRole, request.approvalLevel, request.module,
        request.resourceId, request.status, request.priority, request.risk, request.submittedAt,
        request.dueAt, request.reason, request.evidence.join(" | "), request.dataScope,
      ]),
    ];
    const url = URL.createObjectURL(new Blob([rows.map((row) => row.map(csvCell).join(",")).join("\n")], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `global-approval-center-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Open Requests" value={String(pending)} helper={`${requests.length} total requests`} icon={Clock} tone="amber" />
        <MetricCard label="Overdue SLA" value={String(overdue)} helper="Needs escalation" icon={Bell} tone={overdue ? "red" : "green"} />
        <MetricCard label="High Risk" value={String(highRisk)} helper="Security or data exposure" icon={AlertTriangle} tone="red" />
        <MetricCard label="Access Changes" value={String(accessChanges)} helper="Identity and role requests" icon={KeyRound} tone="blue" />
      </div>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="text-lg font-black text-primary">Global Control Queue</h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">Access, exports, security exceptions, integrations, policies, and cross-module operational exceptions.</p>
          </div>
          <ActionButton icon={Download} onClick={exportApprovals}>Export Queue</ActionButton>
        </div>

        <div className="mb-5 rounded-xl border border-cyan-200 bg-cyan-50 p-3 text-xs font-semibold leading-5 text-cyan-800">
          Invoice, expense, payment, budget, payroll, GST, and TDS decisions remain in Finance Approvals. This center stores only global control decisions or references delegated finance requests without re-approving them.
        </div>

        {notice ? <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800"><span>{notice}</span><button type="button" onClick={() => setNotice("")} className="rounded-lg p-1 hover:bg-blue-100" title="Dismiss"><X size={16} /></button></div> : null}

        <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px_210px]">
          <label className="relative block">
            <Search className="absolute left-3 top-3 text-slate-400" size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search request, requester, module, resource, or reason" className="h-11 w-full rounded-xl border border-border bg-white pl-10 pr-3 text-sm font-semibold text-primary outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
          </label>
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as "All" | GlobalApprovalType)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none">
            {["All", "Access Change", "Data Export", "Security Exception", "Integration", "Policy Change", "Operational Exception"].map((type) => <option key={type}>{type}</option>)}
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "All" | GlobalApprovalStatus)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none">
            {["All", "Pending", "In Review", "Clarification Required", "Approved", "Rejected", "Cancelled"].map((status) => <option key={status}>{status}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {filteredRequests.map((approval) => {
            const isOverdue = ["Pending", "In Review", "Clarification Required"].includes(approval.status) && new Date(approval.dueAt).getTime() < clock;
            return (
            <div key={approval.id} className="rounded-2xl border border-border bg-slate-50 p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-lg font-black text-primary">{approval.title}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">{approval.id} | {approval.type} | Requested by {approval.requester}</p>
                </div>
                <div className="flex gap-2"><Badge tone={approval.priority === "Critical" || approval.priority === "High" ? "red" : "amber"}>{approval.priority}</Badge><Badge tone={toneForStatus(approval.status)}>{approval.status}</Badge></div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white p-3">
                  <p className="text-sm font-black text-primary">{approval.ownerRole}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Owner</p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="text-sm font-black text-primary">{approval.module}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Module</p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="text-sm font-black text-primary">{approval.resourceId}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Resource</p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className={`text-sm font-black ${isOverdue ? "text-red-600" : "text-primary"}`}>{new Date(approval.dueAt).toLocaleString("en-IN")}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{isOverdue ? "SLA Overdue" : "SLA Due"}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <Badge tone={toneForStatus(approval.risk)}>{approval.risk} Risk</Badge>
                <button type="button" onClick={() => openRequest(approval)} className="flex items-center gap-1 text-xs font-black uppercase tracking-widest text-primary">
                  Review <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )})}
        </div>
        {filteredRequests.length === 0 ? <p className="py-10 text-center text-sm font-semibold text-slate-500">No approval request matches the current filters.</p> : null}
      </section>

      {selectedRequest ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-border bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div><h3 className="text-xl font-black text-primary">{selectedRequest.title}</h3><p className="mt-1 text-sm font-semibold text-slate-500">{selectedRequest.id} | {selectedRequest.type} | Level {selectedRequest.approvalLevel}</p></div>
              <button type="button" onClick={() => setSelectedId(null)} className="rounded-lg border border-border p-2 text-slate-500" title="Close"><X size={18} /></button>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
              {[["Requester", `${selectedRequest.requester} (${selectedRequest.requesterRole})`], ["Owner", selectedRequest.ownerRole], ["Status", selectedRequest.status], ["Risk", selectedRequest.risk], ["Module", selectedRequest.module], ["Resource", selectedRequest.resourceId], ["Data Scope", selectedRequest.dataScope], ["Due", new Date(selectedRequest.dueAt).toLocaleString("en-IN")]].map(([label, value]) => <div key={label} className="rounded-xl border border-border bg-slate-50 p-3"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p><p className="mt-2 break-words text-sm font-black text-primary">{value}</p></div>)}
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-border p-4"><p className="text-xs font-black uppercase tracking-widest text-slate-400">Business Reason</p><p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{selectedRequest.reason}</p></div>
              <div className="rounded-xl border border-border p-4"><p className="text-xs font-black uppercase tracking-widest text-slate-400">Evidence References</p><div className="mt-2 flex flex-wrap gap-2">{selectedRequest.evidence.length ? selectedRequest.evidence.map((item) => <Badge key={item} tone="blue">{item}</Badge>) : <p className="text-sm font-semibold text-red-600">No evidence attached</p>}</div></div>
            </div>
            {selectedRequest.events.length ? <div className="mt-5 rounded-xl border border-border p-4"><p className="text-xs font-black uppercase tracking-widest text-slate-400">Decision History</p><div className="mt-3 space-y-3">{selectedRequest.events.map((event) => <div key={`${event.at}-${event.action}`} className="rounded-xl bg-slate-50 p-3"><p className="text-sm font-black text-primary">{event.action} by {event.actor} ({event.role})</p><p className="mt-1 text-xs font-semibold text-slate-500">{new Date(event.at).toLocaleString("en-IN")} | {event.comment}</p></div>)}</div></div> : null}
            <div className="mt-5 rounded-xl border border-border p-4">
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">Decision</p>
              <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr]">
                <select value={decision} onChange={(event) => setDecision(event.target.value as GlobalDecision)} className="h-11 rounded-xl border border-border px-3 text-sm font-semibold"><option>Approve</option><option>Reject</option><option>Need Clarification</option></select>
                <textarea rows={3} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Required decision rationale and control evidence" className="rounded-xl border border-border px-3 py-3 text-sm font-semibold" />
              </div>
              {decisionError ? <p className="mt-2 text-xs font-black text-red-600">{decisionError}</p> : null}
              <div className="mt-4 flex justify-end"><ActionButton icon={CheckCircle2} variant="accent" onClick={saveDecision}>Record Decision</ActionButton></div>
            </div>
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-800">Production must derive approver identity from authenticated role policy, enforce maker-checker separation server-side, apply final decisions atomically, and append every action to System Audit Trail.</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SettingsView() {
  const [configuration, setConfiguration] = useState<AdministrationSettings>(initialSettings);
  const [draft, setDraft] = useState<AdministrationSettings>(initialSettings);
  const [controls, setControls] = useState<SettingControl[]>(initialSettingControls);
  const [selectedKey, setSelectedKey] = useState<SettingKey | null>(null);
  const [query, setQuery] = useState("");
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [changeHistory, setChangeHistory] = useState<Array<{ at: string; section: string; actor: string; summary: string }>>([
    { at: "2026-06-20T10:00:00.000Z", section: "Security Policy", actor: "Rajkumar Rathore", summary: "Reduced session timeout to 30 minutes." },
    { at: "2026-06-18T10:00:00.000Z", section: "Integrations", actor: "Rajkumar Rathore", summary: "Enabled webhook signing for production." },
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const selectedControl = controls.find((control) => control.key === selectedKey) ?? null;
  const filteredControls = controls.filter((control) => {
    const normalized = query.trim().toLowerCase();
    return !normalized || [control.title, control.description, control.owner].join(" ").toLowerCase().includes(normalized);
  });
  const reviewsDue = controls.filter((control) => control.nextReviewDate <= today).length;
  const activeIntegrations = [
    configuration.integrations.googleWorkspace,
    configuration.integrations.whatsapp,
    configuration.integrations.paymentGateway,
    Boolean(configuration.integrations.webhookUrl),
  ].filter(Boolean).length;
  const securityControls = [
    configuration.security.mfaRequired,
    configuration.security.passwordExpiryDays <= 90,
    configuration.security.sessionTimeoutMinutes <= 30,
    configuration.security.maxFailedAttempts <= 5,
    configuration.mobile.biometricRequired,
    configuration.mobile.remoteLogoutEnabled,
  ];
  const securityScore = Math.round((securityControls.filter(Boolean).length / securityControls.length) * 100);
  const governanceControls = [
    configuration.governance.piiMasking,
    configuration.governance.exportApprovalRequired,
    configuration.governance.auditRetentionDays >= 365,
    configuration.governance.backupFrequency === "Daily",
  ].filter(Boolean).length;

  const updateDraft = <
    K extends SettingKey,
    F extends keyof AdministrationSettings[K],
  >(key: K, field: F, value: AdministrationSettings[K][F]) => {
    setDraft((current) => ({
      ...current,
      [key]: { ...current[key], [field]: value },
    }));
  };

  const openSetting = (key: SettingKey) => {
    setDraft(structuredClone(configuration));
    setSelectedKey(key);
    setFormError("");
  };

  const statusFor = (key: SettingKey) => {
    if (key === "company") return configuration.company.gstin && configuration.company.cin ? "Configured" : "Review";
    if (key === "security") return securityScore >= 80 ? "Strong" : "Review";
    if (key === "notifications") return configuration.notifications.smtpHost && configuration.notifications.securityAlerts ? "Live" : "Partial";
    if (key === "integrations") return configuration.integrations.environment === "Production" && configuration.integrations.webhookSigningEnabled ? "Live" : "Partial";
    if (key === "governance") return governanceControls === 4 ? "Strong" : "Review";
    return configuration.mobile.mobileAccessEnabled && configuration.mobile.remoteLogoutEnabled ? "Enabled" : "Review";
  };

  const validateSelected = () => {
    if (!selectedKey) return "Select a settings section.";
    if (selectedKey === "company") {
      const value = draft.company;
      if ([value.legalName, value.gstin, value.cin, value.registeredAddress, value.timezone, value.currency, value.invoicePrefix].some((item) => !item.trim())) return "Complete all company identity fields.";
      if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(value.gstin.toUpperCase())) return "Enter a valid GSTIN.";
      if (!/^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/.test(value.cin.toUpperCase())) return "Enter a valid CIN.";
      if (!/^[A-Z0-9-]{2,10}$/.test(value.invoicePrefix.toUpperCase())) return "Invoice prefix must contain 2-10 letters, numbers, or hyphens.";
    }
    if (selectedKey === "security") {
      const value = draft.security;
      if (value.passwordExpiryDays < 30 || value.passwordExpiryDays > 365) return "Password expiry must be between 30 and 365 days.";
      if (value.sessionTimeoutMinutes < 5 || value.sessionTimeoutMinutes > 480) return "Session timeout must be between 5 and 480 minutes.";
      if (value.maxFailedAttempts < 3 || value.maxFailedAttempts > 10) return "Failed-attempt threshold must be between 3 and 10.";
      if (value.trustedDeviceDays < 1 || value.trustedDeviceDays > 90) return "Trusted-device duration must be between 1 and 90 days.";
    }
    if (selectedKey === "notifications") {
      const value = draft.notifications;
      if (!value.senderName.trim() || !value.smtpHost.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.senderEmail)) return "Enter a valid sender identity and SMTP host.";
      if (value.escalationHours < 1 || value.escalationHours > 168) return "Escalation timing must be between 1 and 168 hours.";
    }
    if (selectedKey === "integrations") {
      const value = draft.integrations;
      if (value.webhookUrl && !/^https:\/\//i.test(value.webhookUrl)) return "Production webhook URLs must use HTTPS.";
      if (value.environment === "Production" && value.webhookUrl && !value.webhookSigningEnabled) return "Production webhooks require signature verification.";
    }
    if (selectedKey === "governance") {
      const value = draft.governance;
      if (value.auditRetentionDays < 90 || value.auditRetentionDays > 3650) return "Audit retention must be between 90 and 3650 days.";
      if (value.archiveAfterDays < value.auditRetentionDays) return "Archive period cannot be shorter than audit retention.";
    }
    if (selectedKey === "mobile") {
      const value = draft.mobile;
      if (value.maxDevicesPerUser < 1 || value.maxDevicesPerUser > 5) return "Device limit must be between 1 and 5.";
      if (value.mobileAccessEnabled && !value.remoteLogoutEnabled) return "Enabled mobile access requires remote logout.";
      if (value.offlineAccessAllowed && !value.deviceLockRequired) return "Offline access requires device lock enforcement.";
    }
    return "";
  };

  const saveSetting = () => {
    const error = validateSelected();
    if (error) {
      setFormError(error);
      return;
    }
    if (!selectedControl || !selectedKey) return;
    const timestamp = new Date().toISOString();
    setConfiguration(draft);
    setControls((current) => current.map((control) => control.key === selectedKey ? {
      ...control,
      updatedAt: timestamp,
      updatedBy: "Rajkumar Rathore",
    } : control));
    setChangeHistory((current) => [{
      at: timestamp,
      section: selectedControl.title,
      actor: "Rajkumar Rathore",
      summary: "Configuration updated through System Settings.",
    }, ...current]);
    setNotice(`${selectedControl.title} updated locally. Production changes require backend authorization and audit logging.`);
    setSelectedKey(null);
  };

  const exportSettings = () => {
    const exportPayload = {
      exportedAt: new Date().toISOString(),
      environment: configuration.integrations.environment,
      configuration,
      controls,
      changeHistory,
      note: "Secrets and credentials are intentionally excluded from this frontend configuration model.",
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `administration-settings-${today}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Security Score" value={`${securityScore}%`} helper="Derived policy controls" icon={ShieldCheck} tone={securityScore >= 80 ? "green" : "amber"} />
        <MetricCard label="Active Integrations" value={String(activeIntegrations)} helper={configuration.integrations.environment} icon={ServerCog} tone="blue" />
        <MetricCard label="Policy Reviews" value={String(reviewsDue)} helper="Review date reached" icon={FileCheck2} tone={reviewsDue ? "amber" : "green"} />
        <MetricCard label="Governance Controls" value={`${governanceControls}/4`} helper="Retention, backup, export, PII" icon={Eye} tone="purple" />
      </div>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="text-lg font-black text-primary">Company Settings</h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">Schema-controlled company, security, notification, integration, governance, and mobile configuration.</p>
          </div>
          <ActionButton icon={Download} onClick={exportSettings}>Export Configuration</ActionButton>
        </div>

        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-800">
          Passwords, API keys, SMTP credentials, webhook secrets, and private certificates must never be stored in this frontend state. Production must use a server-side secret manager and maker-checker approval for critical changes.
        </div>

        {notice ? <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800"><span>{notice}</span><button type="button" onClick={() => setNotice("")} className="rounded-lg p-1 hover:bg-blue-100" title="Dismiss"><X size={16} /></button></div> : null}

        <label className="relative mb-5 block">
          <Search className="absolute left-3 top-3 text-slate-400" size={17} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search setting, owner, or control area" className="h-11 w-full rounded-xl border border-border bg-white pl-10 pr-3 text-sm font-semibold text-primary outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
        </label>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {filteredControls.map((setting) => (
            <div key={setting.key} className="rounded-2xl border border-border bg-slate-50 p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-primary">
                  <setting.icon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <p className="text-lg font-black text-primary">{setting.title}</p>
                    <Badge tone={toneForStatus(statusFor(setting.key))}>{statusFor(setting.key)}</Badge>
                  </div>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{setting.description}</p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-black text-slate-600">{setting.owner}</p>
                      <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Review {setting.nextReviewDate}</p>
                    </div>
                    <button type="button" onClick={() => openSetting(setting.key)} className="flex items-center gap-1 text-xs font-black uppercase tracking-widest text-primary">
                      Configure <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {filteredControls.length === 0 ? <p className="py-10 text-center text-sm font-semibold text-slate-500">No settings section matches the search.</p> : null}
      </section>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-black text-primary">Recent Configuration Changes</h3>
        <div className="mt-4 space-y-3">
          {changeHistory.slice(0, 5).map((event) => <div key={`${event.at}-${event.section}`} className="rounded-xl border border-border bg-slate-50 p-4"><p className="text-sm font-black text-primary">{event.section}</p><p className="mt-1 text-xs font-semibold text-slate-500">{new Date(event.at).toLocaleString("en-IN")} | {event.actor} | {event.summary}</p></div>)}
        </div>
      </section>

      {selectedControl && selectedKey ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-border bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div><h3 className="text-xl font-black text-primary">{selectedControl.title}</h3><p className="mt-1 text-sm font-semibold text-slate-500">Owner: {selectedControl.owner} | Last changed by {selectedControl.updatedBy}</p></div>
              <button type="button" onClick={() => setSelectedKey(null)} className="rounded-lg border border-border p-2 text-slate-500" title="Close"><X size={18} /></button>
            </div>

            {selectedKey === "company" ? <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="space-y-1.5 md:col-span-2"><span className="text-xs font-black uppercase tracking-widest text-slate-500">Legal Name *</span><input value={draft.company.legalName} onChange={(event) => updateDraft("company", "legalName", event.target.value)} className="h-11 w-full rounded-xl border border-border px-3 text-sm font-semibold" /></label>
              <label className="space-y-1.5"><span className="text-xs font-black uppercase tracking-widest text-slate-500">GSTIN *</span><input value={draft.company.gstin} onChange={(event) => updateDraft("company", "gstin", event.target.value.toUpperCase())} className="h-11 w-full rounded-xl border border-border px-3 text-sm font-semibold" /></label>
              <label className="space-y-1.5"><span className="text-xs font-black uppercase tracking-widest text-slate-500">CIN *</span><input value={draft.company.cin} onChange={(event) => updateDraft("company", "cin", event.target.value.toUpperCase())} className="h-11 w-full rounded-xl border border-border px-3 text-sm font-semibold" /></label>
              <label className="space-y-1.5 md:col-span-2"><span className="text-xs font-black uppercase tracking-widest text-slate-500">Registered Address *</span><textarea rows={3} value={draft.company.registeredAddress} onChange={(event) => updateDraft("company", "registeredAddress", event.target.value)} className="w-full rounded-xl border border-border px-3 py-3 text-sm font-semibold" /></label>
              <label className="space-y-1.5"><span className="text-xs font-black uppercase tracking-widest text-slate-500">Timezone *</span><select value={draft.company.timezone} onChange={(event) => updateDraft("company", "timezone", event.target.value)} className="h-11 w-full rounded-xl border border-border px-3 text-sm font-semibold"><option>Asia/Kolkata</option><option>UTC</option></select></label>
              <label className="space-y-1.5"><span className="text-xs font-black uppercase tracking-widest text-slate-500">Currency *</span><select value={draft.company.currency} onChange={(event) => updateDraft("company", "currency", event.target.value)} className="h-11 w-full rounded-xl border border-border px-3 text-sm font-semibold"><option>INR</option><option>USD</option></select></label>
              <label className="space-y-1.5"><span className="text-xs font-black uppercase tracking-widest text-slate-500">Invoice Prefix *</span><input value={draft.company.invoicePrefix} onChange={(event) => updateDraft("company", "invoicePrefix", event.target.value.toUpperCase())} className="h-11 w-full rounded-xl border border-border px-3 text-sm font-semibold" /></label>
            </div> : null}

            {selectedKey === "security" ? <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <ToggleField label="Require MFA" checked={draft.security.mfaRequired} onChange={(value) => updateDraft("security", "mfaRequired", value)} />
              <ToggleField label="Enable IP Allowlist" checked={draft.security.ipAllowlistEnabled} onChange={(value) => updateDraft("security", "ipAllowlistEnabled", value)} />
              <label className="space-y-1.5"><span className="text-xs font-black uppercase tracking-widest text-slate-500">Password Expiry Days</span><input type="number" value={draft.security.passwordExpiryDays} onChange={(event) => updateDraft("security", "passwordExpiryDays", Number(event.target.value))} className="h-11 w-full rounded-xl border border-border px-3 text-sm font-semibold" /></label>
              <label className="space-y-1.5"><span className="text-xs font-black uppercase tracking-widest text-slate-500">Session Timeout Minutes</span><input type="number" value={draft.security.sessionTimeoutMinutes} onChange={(event) => updateDraft("security", "sessionTimeoutMinutes", Number(event.target.value))} className="h-11 w-full rounded-xl border border-border px-3 text-sm font-semibold" /></label>
              <label className="space-y-1.5"><span className="text-xs font-black uppercase tracking-widest text-slate-500">Max Failed Attempts</span><input type="number" value={draft.security.maxFailedAttempts} onChange={(event) => updateDraft("security", "maxFailedAttempts", Number(event.target.value))} className="h-11 w-full rounded-xl border border-border px-3 text-sm font-semibold" /></label>
              <label className="space-y-1.5"><span className="text-xs font-black uppercase tracking-widest text-slate-500">Trusted Device Days</span><input type="number" value={draft.security.trustedDeviceDays} onChange={(event) => updateDraft("security", "trustedDeviceDays", Number(event.target.value))} className="h-11 w-full rounded-xl border border-border px-3 text-sm font-semibold" /></label>
            </div> : null}

            {selectedKey === "notifications" ? <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="space-y-1.5"><span className="text-xs font-black uppercase tracking-widest text-slate-500">Sender Name</span><input value={draft.notifications.senderName} onChange={(event) => updateDraft("notifications", "senderName", event.target.value)} className="h-11 w-full rounded-xl border border-border px-3 text-sm font-semibold" /></label>
              <label className="space-y-1.5"><span className="text-xs font-black uppercase tracking-widest text-slate-500">Sender Email</span><input type="email" value={draft.notifications.senderEmail} onChange={(event) => updateDraft("notifications", "senderEmail", event.target.value)} className="h-11 w-full rounded-xl border border-border px-3 text-sm font-semibold" /></label>
              <label className="space-y-1.5"><span className="text-xs font-black uppercase tracking-widest text-slate-500">SMTP Host</span><input value={draft.notifications.smtpHost} onChange={(event) => updateDraft("notifications", "smtpHost", event.target.value)} className="h-11 w-full rounded-xl border border-border px-3 text-sm font-semibold" /></label>
              <label className="space-y-1.5"><span className="text-xs font-black uppercase tracking-widest text-slate-500">Escalation Hours</span><input type="number" value={draft.notifications.escalationHours} onChange={(event) => updateDraft("notifications", "escalationHours", Number(event.target.value))} className="h-11 w-full rounded-xl border border-border px-3 text-sm font-semibold" /></label>
              <ToggleField label="Approval Alerts" checked={draft.notifications.approvalAlerts} onChange={(value) => updateDraft("notifications", "approvalAlerts", value)} />
              <ToggleField label="Security Alerts" checked={draft.notifications.securityAlerts} onChange={(value) => updateDraft("notifications", "securityAlerts", value)} />
              <ToggleField label="Billing Reminders" checked={draft.notifications.billingReminders} onChange={(value) => updateDraft("notifications", "billingReminders", value)} />
            </div> : null}

            {selectedKey === "integrations" ? <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <ToggleField label="Google Workspace" checked={draft.integrations.googleWorkspace} onChange={(value) => updateDraft("integrations", "googleWorkspace", value)} />
              <ToggleField label="WhatsApp Integration" checked={draft.integrations.whatsapp} onChange={(value) => updateDraft("integrations", "whatsapp", value)} />
              <ToggleField label="Payment Gateway" checked={draft.integrations.paymentGateway} onChange={(value) => updateDraft("integrations", "paymentGateway", value)} />
              <ToggleField label="Webhook Signing" checked={draft.integrations.webhookSigningEnabled} onChange={(value) => updateDraft("integrations", "webhookSigningEnabled", value)} />
              <label className="space-y-1.5 md:col-span-2"><span className="text-xs font-black uppercase tracking-widest text-slate-500">Webhook URL</span><input value={draft.integrations.webhookUrl} onChange={(event) => updateDraft("integrations", "webhookUrl", event.target.value)} className="h-11 w-full rounded-xl border border-border px-3 text-sm font-semibold" /></label>
              <label className="space-y-1.5"><span className="text-xs font-black uppercase tracking-widest text-slate-500">Environment</span><select value={draft.integrations.environment} onChange={(event) => updateDraft("integrations", "environment", event.target.value as "Sandbox" | "Production")} className="h-11 w-full rounded-xl border border-border px-3 text-sm font-semibold"><option>Sandbox</option><option>Production</option></select></label>
            </div> : null}

            {selectedKey === "governance" ? <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="space-y-1.5"><span className="text-xs font-black uppercase tracking-widest text-slate-500">Audit Retention Days</span><input type="number" value={draft.governance.auditRetentionDays} onChange={(event) => updateDraft("governance", "auditRetentionDays", Number(event.target.value))} className="h-11 w-full rounded-xl border border-border px-3 text-sm font-semibold" /></label>
              <label className="space-y-1.5"><span className="text-xs font-black uppercase tracking-widest text-slate-500">Archive After Days</span><input type="number" value={draft.governance.archiveAfterDays} onChange={(event) => updateDraft("governance", "archiveAfterDays", Number(event.target.value))} className="h-11 w-full rounded-xl border border-border px-3 text-sm font-semibold" /></label>
              <label className="space-y-1.5"><span className="text-xs font-black uppercase tracking-widest text-slate-500">Backup Frequency</span><select value={draft.governance.backupFrequency} onChange={(event) => updateDraft("governance", "backupFrequency", event.target.value as "Daily" | "Weekly")} className="h-11 w-full rounded-xl border border-border px-3 text-sm font-semibold"><option>Daily</option><option>Weekly</option></select></label>
              <ToggleField label="PII Masking" checked={draft.governance.piiMasking} onChange={(value) => updateDraft("governance", "piiMasking", value)} />
              <ToggleField label="Export Approval Required" checked={draft.governance.exportApprovalRequired} onChange={(value) => updateDraft("governance", "exportApprovalRequired", value)} />
              <ToggleField label="Legal Hold Enabled" checked={draft.governance.legalHoldEnabled} onChange={(value) => updateDraft("governance", "legalHoldEnabled", value)} />
            </div> : null}

            {selectedKey === "mobile" ? <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <ToggleField label="Mobile Access" checked={draft.mobile.mobileAccessEnabled} onChange={(value) => updateDraft("mobile", "mobileAccessEnabled", value)} />
              <ToggleField label="Biometric Required" checked={draft.mobile.biometricRequired} onChange={(value) => updateDraft("mobile", "biometricRequired", value)} />
              <ToggleField label="Device Lock Required" checked={draft.mobile.deviceLockRequired} onChange={(value) => updateDraft("mobile", "deviceLockRequired", value)} />
              <ToggleField label="Remote Logout" checked={draft.mobile.remoteLogoutEnabled} onChange={(value) => updateDraft("mobile", "remoteLogoutEnabled", value)} />
              <ToggleField label="Offline Access" checked={draft.mobile.offlineAccessAllowed} onChange={(value) => updateDraft("mobile", "offlineAccessAllowed", value)} />
              <label className="space-y-1.5"><span className="text-xs font-black uppercase tracking-widest text-slate-500">Max Devices Per User</span><input type="number" value={draft.mobile.maxDevicesPerUser} onChange={(event) => updateDraft("mobile", "maxDevicesPerUser", Number(event.target.value))} className="h-11 w-full rounded-xl border border-border px-3 text-sm font-semibold" /></label>
            </div> : null}

            {formError ? <div className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700"><ShieldAlert className="mt-0.5 shrink-0" size={17} />{formError}</div> : null}
            <div className="mt-6 flex justify-end gap-3 border-t border-border pt-5"><ActionButton icon={X} onClick={() => setSelectedKey(null)}>Cancel</ActionButton><ActionButton icon={ShieldCheck} variant="accent" onClick={saveSetting}>Save Configuration</ActionButton></div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function AdministrationHub({ activeView }: { activeView: AdminView }) {
  const title =
    activeView === "users"
      ? "User Management"
      : activeView === "roles"
        ? "Roles & Permissions"
        : activeView === "logs"
          ? "System Audit Trail"
          : activeView === "approvals"
            ? "Approval Center"
            : "System Settings";

  const description =
    activeView === "users"
      ? "User lifecycle, MFA, sessions, department access and risk controls for company admins."
      : activeView === "roles"
        ? "Role-based access control with module-level permissions, sensitive data scope and review risk."
        : activeView === "logs"
          ? "Tamper-aware audit trail for security, exports, approvals, access and operational changes."
          : activeView === "approvals"
            ? "Global control queue for access, exports, security exceptions, integrations, policies and operational exceptions."
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
              <Badge tone="green">Admin Control</Badge>
            </div>
            <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-slate-500">{description}</p>
          </div>
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
          <h3 className="text-lg font-black">Admin Control Guardrails</h3>
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

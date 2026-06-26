"use client";

import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  AlertTriangle,
  Check,
  Download,
  Eye,
  KeyRound,
  Lock,
  Pencil,
  Plus,
  Power,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCog,
  Users,
  X,
} from "lucide-react";
import {
  AccountingPage,
  ActionButton,
  DataTable,
  Field,
  MetricCard,
  Panel,
  StatusBadge,
} from "./AccountingComponents";

const ACCOUNTING_MODULES = [
  "Client Master",
  "Vendor Master",
  "Quotations",
  "Invoices",
  "Payments",
  "Reminders",
  "Credit Notes",
  "Sale/Purchase/Expense",
  "Budgets",
  "Salary/Payroll",
  "GST Management",
  "TDS Management",
  "Reports",
  "Approvals",
  "Audit Logs",
  "Access Control",
  "Bank Details",
] as const;

const ACTIONS = ["Create", "Edit", "Archive", "Approve", "Export"] as const;
const roleStatuses = ["Active", "Inactive"] as const;
const dataScopes = ["Own Records", "Department", "Business Unit", "All Records"] as const;
const auditLevels = ["No Access", "Read Only", "Investigate"] as const;

type AccountingModule = (typeof ACCOUNTING_MODULES)[number];
type PermissionAction = (typeof ACTIONS)[number];
type RoleStatus = (typeof roleStatuses)[number];
type DataScope = (typeof dataScopes)[number];
type AuditLevel = (typeof auditLevels)[number];

type RoleRecord = {
  id: string;
  name: string;
  description: string;
  users: number;
  status: RoleStatus;
  protected: boolean;
  modules: AccountingModule[];
  actions: PermissionAction[];
  dataScope: DataScope;
  approvalLimit: number | null;
  auditAccess: AuditLevel;
  lastReviewedAt: string;
  nextReviewDate: string;
  updatedAt: string;
};

const roleSchema = z.object({
  roleName: z.string().trim().min(3, "Enter at least 3 characters").max(60, "Keep role name under 60 characters"),
  description: z.string().trim().min(10, "Describe the role responsibility").max(180, "Keep description under 180 characters"),
  roleStatus: z.enum(roleStatuses),
  dataScope: z.enum(dataScopes),
  auditAccess: z.enum(auditLevels),
  approvalLimit: z.coerce.number().min(0, "Approval limit cannot be negative").max(1000000000, "Approval limit is too high"),
  nextReviewDate: z.string().min(1, "Review date is required"),
});

type RoleFormData = z.infer<typeof roleSchema>;
type RoleFormInput = z.input<typeof roleSchema>;

const today = () => new Date().toISOString().slice(0, 10);
const inDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const initialRoles: RoleRecord[] = [
  {
    id: "ROLE-ADMIN",
    name: "Director/Admin",
    description: "Protected security owner with final approval and access administration responsibility.",
    users: 2,
    status: "Active",
    protected: true,
    modules: [...ACCOUNTING_MODULES],
    actions: [...ACTIONS],
    dataScope: "All Records",
    approvalLimit: null,
    auditAccess: "Investigate",
    lastReviewedAt: "2026-06-01",
    nextReviewDate: "2026-07-01",
    updatedAt: "2026-06-01T10:30:00.000Z",
  },
  {
    id: "ROLE-FIN-MGR",
    name: "Finance Manager",
    description: "Owns finance review, approvals, compliance monitoring, budgets, and reporting.",
    users: 2,
    status: "Active",
    protected: false,
    modules: ["Client Master", "Vendor Master", "Quotations", "Invoices", "Payments", "Sale/Purchase/Expense", "Budgets", "Salary/Payroll", "GST Management", "TDS Management", "Reports", "Approvals", "Audit Logs", "Bank Details"],
    actions: ["Create", "Edit", "Archive", "Approve", "Export"],
    dataScope: "All Records",
    approvalLimit: 1000000,
    auditAccess: "Read Only",
    lastReviewedAt: "2026-06-05",
    nextReviewDate: "2026-07-05",
    updatedAt: "2026-06-05T09:00:00.000Z",
  },
  {
    id: "ROLE-ACCOUNTANT",
    name: "Accountant",
    description: "Processes accounting masters, billing, collections, expenses, and statutory records.",
    users: 4,
    status: "Active",
    protected: false,
    modules: ["Client Master", "Vendor Master", "Quotations", "Invoices", "Payments", "Reminders", "Credit Notes", "Sale/Purchase/Expense", "GST Management", "TDS Management", "Reports"],
    actions: ["Create", "Edit", "Export"],
    dataScope: "Business Unit",
    approvalLimit: 0,
    auditAccess: "No Access",
    lastReviewedAt: "2026-05-20",
    nextReviewDate: "2026-06-20",
    updatedAt: "2026-05-20T12:00:00.000Z",
  },
  {
    id: "ROLE-HR",
    name: "HR Payroll Reviewer",
    description: "Reviews salary inputs and employee reimbursement expenses without treasury access.",
    users: 3,
    status: "Active",
    protected: false,
    modules: ["Sale/Purchase/Expense", "Salary/Payroll", "Reports"],
    actions: ["Create", "Edit", "Approve", "Export"],
    dataScope: "Department",
    approvalLimit: 250000,
    auditAccess: "No Access",
    lastReviewedAt: "2026-06-10",
    nextReviewDate: "2026-07-10",
    updatedAt: "2026-06-10T11:15:00.000Z",
  },
];

const money = (value: number | null) =>
  value === null
    ? "Unlimited"
    : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

const csvCell = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;

export default function Step16Access() {
  const [roles, setRoles] = useState<RoleRecord[]>(initialRoles);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [auditRoleId, setAuditRoleId] = useState<string | null>(null);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [selectedModules, setSelectedModules] = useState<AccountingModule[]>([]);
  const [selectedActions, setSelectedActions] = useState<PermissionAction[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | RoleStatus>("All");
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoleFormInput, unknown, RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      roleStatus: "Active",
      dataScope: "Department",
      auditAccess: "No Access",
      approvalLimit: 0,
      nextReviewDate: inDays(30),
    },
  });

  const activeRoles = roles.filter((role) => role.status === "Active");
  const mappedUsers = activeRoles.reduce((total, role) => total + role.users, 0);
  const reviewDue = roles.filter((role) => role.status === "Active" && role.nextReviewDate <= today()).length;
  const privilegedRoles = activeRoles.filter(
    (role) => role.actions.includes("Approve") || role.auditAccess === "Investigate" || role.modules.includes("Access Control"),
  ).length;

  const filteredRoles = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return roles.filter((role) => {
      const matchesStatus = statusFilter === "All" || role.status === statusFilter;
      const matchesQuery =
        !normalized ||
        role.name.toLowerCase().includes(normalized) ||
        role.description.toLowerCase().includes(normalized) ||
        role.modules.some((module) => module.toLowerCase().includes(normalized));
      return matchesStatus && matchesQuery;
    });
  }, [query, roles, statusFilter]);

  const auditedRole = roles.find((role) => role.id === auditRoleId) ?? null;
  const editingRole = roles.find((role) => role.id === editingRoleId) ?? null;

  const closeForm = () => {
    setShowRoleForm(false);
    setEditingRoleId(null);
    setSelectedModules([]);
    setSelectedActions([]);
    setFormError("");
    reset();
  };

  const openCreate = () => {
    setEditingRoleId(null);
    setSelectedModules([]);
    setSelectedActions(["Create", "Edit"]);
    setFormError("");
    reset({
      roleName: "",
      description: "",
      roleStatus: "Active",
      dataScope: "Department",
      auditAccess: "No Access",
      approvalLimit: 0,
      nextReviewDate: inDays(30),
    });
    setShowRoleForm(true);
  };

  const openEdit = (role: RoleRecord) => {
    setEditingRoleId(role.id);
    setSelectedModules(role.modules);
    setSelectedActions(role.actions);
    setFormError("");
    reset({
      roleName: role.name,
      description: role.description,
      roleStatus: role.status,
      dataScope: role.dataScope,
      auditAccess: role.auditAccess,
      approvalLimit: role.approvalLimit ?? 0,
      nextReviewDate: role.nextReviewDate,
    });
    setShowRoleForm(true);
  };

  const toggleModule = (module: AccountingModule) => {
    setSelectedModules((current) =>
      current.includes(module) ? current.filter((item) => item !== module) : [...current, module],
    );
  };

  const toggleAction = (action: PermissionAction) => {
    setSelectedActions((current) =>
      current.includes(action) ? current.filter((item) => item !== action) : [...current, action],
    );
  };

  const onSubmit = (data: RoleFormData) => {
    setFormError("");
    if (selectedModules.length === 0) {
      setFormError("Select at least one accounting module.");
      return;
    }
    if (selectedActions.length === 0) {
      setFormError("Select at least one allowed action.");
      return;
    }
    if (data.nextReviewDate < today()) {
      setFormError("Next access review cannot be in the past.");
      return;
    }
    const duplicate = roles.some(
      (role) => role.id !== editingRoleId && role.name.toLowerCase() === data.roleName.trim().toLowerCase(),
    );
    if (duplicate) {
      setFormError("A role with this name already exists.");
      return;
    }
    if (selectedActions.includes("Approve") && data.approvalLimit <= 0) {
      setFormError("Set a positive approval limit when approval access is granted.");
      return;
    }
    if (!selectedActions.includes("Approve") && data.approvalLimit > 0) {
      setFormError("Approval limit requires the Approve action.");
      return;
    }
    if (selectedModules.includes("Access Control") && !editingRole?.protected) {
      setFormError("Access Control can only be assigned through the protected administrator policy.");
      return;
    }
    if (data.auditAccess !== "No Access" && !selectedModules.includes("Audit Logs")) {
      setFormError("Audit access requires the Audit Logs module.");
      return;
    }

    const now = new Date().toISOString();
    if (editingRole) {
      setRoles((current) =>
        current.map((role) =>
          role.id === editingRole.id
            ? {
                ...role,
                name: data.roleName.trim(),
                description: data.description.trim(),
                status: role.protected ? "Active" : data.roleStatus,
                modules: selectedModules,
                actions: role.protected ? [...ACTIONS] : selectedActions,
                dataScope: data.dataScope,
                approvalLimit: role.protected ? null : data.approvalLimit,
                auditAccess: data.auditAccess,
                nextReviewDate: data.nextReviewDate,
                lastReviewedAt: today(),
                updatedAt: now,
              }
            : role,
        ),
      );
      setNotice(`${data.roleName.trim()} policy updated in this local prototype.`);
    } else {
      setRoles((current) => [
        ...current,
        {
          id: `ROLE-${Date.now()}`,
          name: data.roleName.trim(),
          description: data.description.trim(),
          users: 0,
          status: data.roleStatus,
          protected: false,
          modules: selectedModules,
          actions: selectedActions,
          dataScope: data.dataScope,
          approvalLimit: data.approvalLimit,
          auditAccess: data.auditAccess,
          lastReviewedAt: today(),
          nextReviewDate: data.nextReviewDate,
          updatedAt: now,
        },
      ]);
      setNotice(`${data.roleName.trim()} role created with zero assigned users.`);
    }
    closeForm();
  };

  const toggleRoleStatus = (role: RoleRecord) => {
    if (role.protected) {
      setNotice("Protected administrator role cannot be disabled.");
      return;
    }
    const nextStatus: RoleStatus = role.status === "Active" ? "Inactive" : "Active";
    setRoles((current) =>
      current.map((item) =>
        item.id === role.id ? { ...item, status: nextStatus, updatedAt: new Date().toISOString() } : item,
      ),
    );
    setNotice(`${role.name} is now ${nextStatus.toLowerCase()}. Existing sessions require server-side revocation.`);
  };

  const exportRoles = () => {
    const rows = [
      ["Role ID", "Role", "Status", "Users", "Modules", "Actions", "Data Scope", "Approval Limit", "Audit Access", "Last Reviewed", "Next Review"],
      ...roles.map((role) => [
        role.id,
        role.name,
        role.status,
        role.users,
        role.modules.join(" | "),
        role.actions.join(" | "),
        role.dataScope,
        role.approvalLimit ?? "Unlimited",
        role.auditAccess,
        role.lastReviewedAt,
        role.nextReviewDate,
      ]),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `accounting-access-control-${today()}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AccountingPage
      title="Access Control"
      description="Define least-privilege accounting roles, approval authority, data scope, and periodic access reviews."
      icon={Lock}
      badge="Restricted Admin"
      actions={
        <>
          <ActionButton icon={Download} label="Export Matrix" variant="outline" onClick={exportRoles} />
          <ActionButton icon={Plus} label="New Role" variant="accent" onClick={openCreate} />
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active Roles" value={String(activeRoles.length)} helper={`${roles.length} total policies`} icon={Shield} tone="blue" />
        <MetricCard label="Users Mapped" value={String(mappedUsers)} helper="Across active roles" icon={Users} tone="green" />
        <MetricCard label="Privileged Roles" value={String(privilegedRoles)} helper="Approval, audit, or admin rights" icon={ShieldCheck} tone="amber" />
        <MetricCard label="Reviews Due" value={String(reviewDue)} helper="Review date reached" icon={UserCog} tone={reviewDue ? "red" : "purple"} />
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 shrink-0 text-amber-700" size={18} />
          <div>
            <p className="text-sm font-black text-amber-900">Policy design workspace</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-amber-800">
              Changes work in this page prototype. Production authorization must be enforced by the backend on every API,
              with authenticated users, session revocation, immutable audit events, and maker-checker approval for privileged changes.
            </p>
          </div>
        </div>
      </div>

      {notice ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")} className="shrink-0 rounded-lg p-1 hover:bg-blue-100" title="Dismiss">
            <X size={16} />
          </button>
        </div>
      ) : null}

      <Panel title="Role Register" description="Search policies, inspect effective grants, and control role lifecycle.">
        <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-[1fr_220px]">
          <label className="relative block">
            <Search className="absolute left-3 top-3 text-slate-400" size={17} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search role, responsibility, or module"
              className="h-11 w-full rounded-xl border border-border bg-white pl-10 pr-3 text-sm font-semibold text-primary outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </label>
          <Field
            label="Status"
            options={["All", ...roleStatuses]}
            value={statusFilter}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => setStatusFilter(event.target.value as "All" | RoleStatus)}
          />
        </div>

        <DataTable columns={["Role", "Users", "Coverage", "Authority", "Review", "Status", "Actions"]}>
          {filteredRoles.map((role) => {
            const overdue = role.status === "Active" && role.nextReviewDate <= today();
            return (
              <tr key={role.id} className="text-sm">
                <td className="px-4 py-4">
                  <div className="flex items-start gap-2">
                    {role.protected ? <ShieldCheck className="mt-0.5 shrink-0 text-purple-600" size={16} /> : <Shield className="mt-0.5 shrink-0 text-slate-400" size={16} />}
                    <div>
                      <p className="font-black text-primary">{role.name}</p>
                      <p className="mt-1 max-w-[260px] text-xs font-semibold leading-5 text-slate-500">{role.description}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 font-black text-slate-700">{role.users}</td>
                <td className="px-4 py-4">
                  <p className="font-black text-slate-700">{role.modules.length} modules</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{role.dataScope}</p>
                </td>
                <td className="px-4 py-4">
                  <p className="font-black text-slate-700">{money(role.approvalLimit)}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{role.actions.join(", ")}</p>
                </td>
                <td className="px-4 py-4">
                  <p className={`font-black ${overdue ? "text-red-600" : "text-slate-700"}`}>{role.nextReviewDate}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">Last: {role.lastReviewedAt}</p>
                </td>
                <td className="px-4 py-4">
                  <StatusBadge tone={role.protected ? "purple" : role.status === "Active" ? "green" : "slate"}>
                    {role.protected ? "Protected" : role.status}
                  </StatusBadge>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => setAuditRoleId(role.id)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-blue-600" title="Audit effective access">
                      <Eye size={15} />
                    </button>
                    <button type="button" onClick={() => openEdit(role)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-primary" title="Edit role policy">
                      <Pencil size={15} />
                    </button>
                    <button type="button" onClick={() => toggleRoleStatus(role)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-red-600" title={role.status === "Active" ? "Deactivate role" : "Activate role"}>
                      <Power size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </DataTable>
        {filteredRoles.length === 0 ? (
          <div className="py-10 text-center text-sm font-semibold text-slate-500">No role matches the current filters.</div>
        ) : null}
      </Panel>

      {showRoleForm ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-border bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-primary">{editingRole ? "Edit Role Policy" : "Create Role Policy"}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">Grant only the minimum access required for the responsibility.</p>
              </div>
              <button type="button" onClick={closeForm} className="rounded-lg border border-border p-2 text-slate-500 hover:text-primary" title="Close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Role Name" required register={register("roleName")} error={errors.roleName?.message} disabled={editingRole?.protected} />
                <Field label="Status" options={[...roleStatuses]} register={register("roleStatus")} disabled={editingRole?.protected} />
                <div className="md:col-span-2">
                  <Field label="Responsibility Description" required multiline register={register("description")} error={errors.description?.message} />
                </div>
                <Field label="Data Scope" options={[...dataScopes]} register={register("dataScope")} />
                <Field label="Audit Access" options={[...auditLevels]} register={register("auditAccess")} />
                <Field label="Approval Limit (INR)" type="number" min="0" step="1" register={register("approvalLimit")} error={errors.approvalLimit?.message} disabled={editingRole?.protected} />
                <Field label="Next Access Review" type="date" min={today()} required register={register("nextReviewDate")} error={errors.nextReviewDate?.message} />
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">Allowed Modules *</p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">{selectedModules.length} selected</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedModules(
                        selectedModules.length > 0
                          ? []
                          : ACCOUNTING_MODULES.filter((module) => module !== "Access Control"),
                      )
                    }
                    className="text-xs font-black text-primary hover:underline"
                    disabled={editingRole?.protected}
                  >
                    {selectedModules.length ? "Clear selection" : "Select all allowed"}
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {ACCOUNTING_MODULES.map((module) => {
                    const locked = Boolean(editingRole?.protected) || module === "Access Control";
                    const selected = selectedModules.includes(module);
                    return (
                      <button
                        key={module}
                        type="button"
                        disabled={locked}
                        onClick={() => toggleModule(module)}
                        className={`flex min-h-11 items-center justify-between rounded-xl border px-3 py-2 text-left text-sm font-bold transition-colors ${
                          selected ? "border-primary bg-blue-50 text-primary" : "border-border bg-white text-slate-600"
                        } ${locked ? "cursor-not-allowed opacity-45" : "hover:border-primary/50"}`}
                      >
                        <span>{module}</span>
                        {selected ? <Check size={16} /> : locked ? <Lock size={14} /> : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-500">Allowed Actions *</p>
                <div className="flex flex-wrap gap-2">
                  {ACTIONS.map((action) => {
                    const selected = selectedActions.includes(action);
                    return (
                      <button
                        key={action}
                        type="button"
                        onClick={() => toggleAction(action)}
                        disabled={editingRole?.protected}
                        className={`inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-black ${
                          selected ? "border-primary bg-primary text-white" : "border-border bg-white text-slate-600 hover:border-primary/50"
                        } ${editingRole?.protected ? "cursor-not-allowed opacity-70" : ""}`}
                      >
                        {selected ? <Check size={15} /> : null}
                        {action}
                      </button>
                    );
                  })}
                </div>
              </div>

              {formError ? (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                  <ShieldAlert className="mt-0.5 shrink-0" size={17} />
                  <span>{formError}</span>
                </div>
              ) : null}

              <div className="flex justify-end gap-3 border-t border-border pt-5">
                <ActionButton label="Cancel" variant="outline" onClick={closeForm} />
                <ActionButton icon={KeyRound} label={editingRole ? "Update Policy" : "Create Role"} variant="accent" type="submit" />
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {auditedRole ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="text-primary" size={20} />
                  <h3 className="text-xl font-black text-primary">{auditedRole.name}</h3>
                </div>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{auditedRole.description}</p>
              </div>
              <button type="button" onClick={() => setAuditRoleId(null)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-primary" title="Close audit">
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                ["Status", auditedRole.protected ? "Protected" : auditedRole.status],
                ["Users", String(auditedRole.users)],
                ["Data Scope", auditedRole.dataScope],
                ["Approval", money(auditedRole.approvalLimit)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-border bg-slate-50 p-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                  <p className="mt-2 text-sm font-black text-primary">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">Effective Modules</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {auditedRole.modules.map((module) => <StatusBadge key={module} tone="blue">{module}</StatusBadge>)}
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">Actions</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {auditedRole.actions.map((action) => <StatusBadge key={action} tone="green">{action}</StatusBadge>)}
                </div>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">Review Control</p>
                <p className="mt-3 text-sm font-bold text-slate-700">Last reviewed: {auditedRole.lastReviewedAt}</p>
                <p className="mt-1 text-sm font-bold text-slate-700">Next review: {auditedRole.nextReviewDate}</p>
                <p className="mt-1 text-sm font-bold text-slate-700">Audit access: {auditedRole.auditAccess}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </AccountingPage>
  );
}

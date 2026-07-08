"use client";

import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  AlertCircle, Archive, BarChart3, Check, CheckCircle2, Download, Edit3,
  Plus, RotateCcw, Search, ShieldCheck, Target, TrendingUp, Wallet, WalletCards, X,
} from "lucide-react";
import {
  AccountingPage, ActionButton, DataTable, Field,
  MetricCard, Panel, ProgressBar, StatusBadge, WorkflowSteps,
} from "./AccountingComponents";

const INR = "\u20b9";
const fiscalYears = ["FY 2025-26", "FY 2026-27", "FY 2027-28"] as const;
const scopeTypes = ["Department", "Project"] as const;
const departments = ["Engineering", "Marketing", "Cloud Ops", "HR & Admin", "Sales", "Finance", "Product Design"] as const;
const categories = ["Operating Expenses", "Payroll", "Marketing Spend", "Cloud & Software", "Travel", "Procurement", "Project Delivery", "Capital Expenditure"] as const;
const budgetStatuses = ["Draft", "Pending Approval", "Active", "Rejected", "Closed", "Archived"] as const;

const projectOptions = [
  { id: "PRJ-001", name: "Loan Automation Platform", department: "Engineering" },
  { id: "PRJ-002", name: "E-commerce Mobile App", department: "Engineering" },
  { id: "PRJ-003", name: "Logistics Control Tower", department: "Cloud Ops" },
];

type SpendSnapshot = {
  id: string;
  fy: typeof fiscalYears[number];
  department: typeof departments[number];
  projectId: string;
  category: typeof categories[number];
  actualAmount: number;
  committedAmount: number;
};

const spendSnapshots: SpendSnapshot[] = [
  { id: "SP-001", fy: "FY 2026-27", department: "Engineering", projectId: "", category: "Payroll", actualAmount: 1240000, committedAmount: 320000 },
  { id: "SP-002", fy: "FY 2026-27", department: "Engineering", projectId: "", category: "Cloud & Software", actualAmount: 360000, committedAmount: 180000 },
  { id: "SP-003", fy: "FY 2026-27", department: "Marketing", projectId: "", category: "Marketing Spend", actualAmount: 1490000, committedAmount: 120000 },
  { id: "SP-004", fy: "FY 2026-27", department: "Cloud Ops", projectId: "", category: "Cloud & Software", actualAmount: 2670000, committedAmount: 210000 },
  { id: "SP-005", fy: "FY 2026-27", department: "HR & Admin", projectId: "", category: "Operating Expenses", actualAmount: 410000, committedAmount: 90000 },
  { id: "SP-006", fy: "FY 2026-27", department: "Engineering", projectId: "PRJ-001", category: "Project Delivery", actualAmount: 620000, committedAmount: 140000 },
];

const budgetSchema = z.object({
  scopeType: z.enum(scopeTypes),
  department: z.enum(departments),
  projectId: z.string().optional(),
  category: z.enum(categories),
  fy: z.enum(fiscalYears),
  periodStart: z.string().min(1, "Period start required"),
  periodEnd: z.string().min(1, "Period end required"),
  allocatedAmount: z.coerce.number().positive("Allocated budget must be greater than 0"),
  contingencyAmount: z.coerce.number().min(0, "Contingency cannot be negative"),
  alertThreshold: z.coerce.number().min(1).max(100),
  blockThreshold: z.coerce.number().min(1).max(150),
  owner: z.string().trim().min(2, "Budget owner required"),
  costCenter: z.string().trim().min(2, "Cost center required"),
  remarks: z.string().trim().min(5, "Budget purpose or constraint required"),
}).superRefine((data, ctx) => {
  if (data.periodEnd < data.periodStart) {
    ctx.addIssue({ code: "custom", path: ["periodEnd"], message: "Period end cannot be before start" });
  }
  if (data.blockThreshold < data.alertThreshold) {
    ctx.addIssue({ code: "custom", path: ["blockThreshold"], message: "Block threshold must be at or above alert threshold" });
  }
  if (data.scopeType === "Project") {
    const project = projectOptions.find((item) => item.id === data.projectId);
    if (!project) {
      ctx.addIssue({ code: "custom", path: ["projectId"], message: "Select a project" });
    } else if (project.department !== data.department) {
      ctx.addIssue({ code: "custom", path: ["projectId"], message: "Project does not belong to selected department" });
    }
  }
});

type BudgetFormInput = z.input<typeof budgetSchema>;
type BudgetFormData = z.output<typeof budgetSchema>;
type BudgetStatus = typeof budgetStatuses[number];

type BudgetRevision = {
  id: string;
  previousAmount: number;
  revisedAmount: number;
  reason: string;
  requestedBy: string;
  requestedAt: string;
  status: "Pending" | "Approved" | "Rejected";
  approvedBy: string;
  approvedAt: string;
};

type BudgetRecord = {
  id: string;
  scopeType: typeof scopeTypes[number];
  department: typeof departments[number];
  projectId: string;
  projectName: string;
  category: typeof categories[number];
  fy: typeof fiscalYears[number];
  periodStart: string;
  periodEnd: string;
  allocatedAmount: number;
  contingencyAmount: number;
  alertThreshold: number;
  blockThreshold: number;
  owner: string;
  costCenter: string;
  remarks: string;
  status: BudgetStatus;
  approvedBy: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  revisions: BudgetRevision[];
};

const initialBudgets: BudgetRecord[] = [
  {
    id: "BUD-2026-001", scopeType: "Department", department: "Engineering", projectId: "", projectName: "",
    category: "Payroll", fy: "FY 2026-27", periodStart: "2026-04-01", periodEnd: "2027-03-31",
    allocatedAmount: 4200000, contingencyAmount: 300000, alertThreshold: 80, blockThreshold: 100,
    owner: "Engineering Head", costCenter: "CC-ENG-01", remarks: "Annual engineering payroll control.",
    status: "Active", approvedBy: "Director", createdBy: "Finance Manager",
    createdAt: "2026-04-01T10:00:00.000Z", updatedAt: "2026-04-01T10:00:00.000Z", revisions: [],
  },
  {
    id: "BUD-2026-002", scopeType: "Department", department: "Marketing", projectId: "", projectName: "",
    category: "Marketing Spend", fy: "FY 2026-27", periodStart: "2026-04-01", periodEnd: "2027-03-31",
    allocatedAmount: 1800000, contingencyAmount: 100000, alertThreshold: 80, blockThreshold: 100,
    owner: "Marketing Head", costCenter: "CC-MKT-01", remarks: "Paid media, events, and campaign execution.",
    status: "Active", approvedBy: "Director", createdBy: "Finance Manager",
    createdAt: "2026-04-01T10:00:00.000Z", updatedAt: "2026-04-01T10:00:00.000Z", revisions: [],
  },
  {
    id: "BUD-2026-003", scopeType: "Department", department: "Cloud Ops", projectId: "", projectName: "",
    category: "Cloud & Software", fy: "FY 2026-27", periodStart: "2026-04-01", periodEnd: "2027-03-31",
    allocatedAmount: 3000000, contingencyAmount: 150000, alertThreshold: 80, blockThreshold: 100,
    owner: "Cloud Ops Head", costCenter: "CC-OPS-01", remarks: "Cloud infrastructure and production software subscriptions.",
    status: "Active", approvedBy: "Director", createdBy: "Finance Manager",
    createdAt: "2026-04-01T10:00:00.000Z", updatedAt: "2026-04-01T10:00:00.000Z", revisions: [],
  },
  {
    id: "BUD-2026-004", scopeType: "Department", department: "HR & Admin", projectId: "", projectName: "",
    category: "Operating Expenses", fy: "FY 2026-27", periodStart: "2026-04-01", periodEnd: "2027-03-31",
    allocatedAmount: 1200000, contingencyAmount: 100000, alertThreshold: 80, blockThreshold: 100,
    owner: "HR Manager", costCenter: "CC-HR-01", remarks: "Office administration and employee operations.",
    status: "Active", approvedBy: "Director", createdBy: "Finance Manager",
    createdAt: "2026-04-01T10:00:00.000Z", updatedAt: "2026-04-01T10:00:00.000Z", revisions: [],
  },
];

const defaultFormValues: BudgetFormInput = {
  scopeType: "Department",
  department: "Engineering",
  projectId: "",
  category: "Operating Expenses",
  fy: "FY 2026-27",
  periodStart: "2026-04-01",
  periodEnd: "2027-03-31",
  allocatedAmount: 0,
  contingencyAmount: 0,
  alertThreshold: 80,
  blockThreshold: 100,
  owner: "",
  costCenter: "",
  remarks: "",
};

function money(value: number) {
  return `${INR} ${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function spendForBudget(budget: BudgetRecord) {
  return spendSnapshots
    .filter((spend) =>
      spend.fy === budget.fy
      && spend.department === budget.department
      && spend.category === budget.category
      && (budget.scopeType === "Department" || spend.projectId === budget.projectId),
    )
    .reduce((acc, spend) => ({
      actual: acc.actual + spend.actualAmount,
      committed: acc.committed + spend.committedAmount,
    }), { actual: 0, committed: 0 });
}

function healthFor(budget: BudgetRecord) {
  const spend = spendForBudget(budget);
  const approved = budget.allocatedAmount + budget.contingencyAmount;
  const utilization = approved > 0 ? (spend.actual + spend.committed) / approved * 100 : 0;
  if (utilization >= budget.blockThreshold) return "Blocked";
  if (utilization >= budget.alertThreshold) return "Watch";
  return "Healthy";
}

export default function Step9Budgets() {
  const [budgets, setBudgets] = useState<BudgetRecord[]>(initialBudgets);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [fyFilter, setFyFilter] = useState("FY 2026-27");
  const [showRevision, setShowRevision] = useState<BudgetRecord | null>(null);
  const [revisionAmount, setRevisionAmount] = useState("");
  const [revisionReason, setRevisionReason] = useState("");
  const [revisionError, setRevisionError] = useState("");

  const {
    register, handleSubmit, control, reset, setError,
    formState: { errors },
  } = useForm<BudgetFormInput, unknown, BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: defaultFormValues,
  });

  const watchedScope = useWatch({ control, name: "scopeType" });
  const watchedDepartment = useWatch({ control, name: "department" });
  const watchedAllocated = useWatch({ control, name: "allocatedAmount" });
  const watchedContingency = useWatch({ control, name: "contingencyAmount" });
  const watchedAlert = useWatch({ control, name: "alertThreshold" });
  const watchedBlock = useWatch({ control, name: "blockThreshold" });
  const previewApproved = (Number(watchedAllocated) || 0) + (Number(watchedContingency) || 0);

  const filteredBudgets = useMemo(() => budgets.filter((budget) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch = !query || [
      budget.id, budget.department, budget.projectName, budget.category,
      budget.owner, budget.costCenter, budget.status,
    ].join(" ").toLowerCase().includes(query);
    const matchesStatus = statusFilter === "All" || budget.status === statusFilter;
    const matchesFy = fyFilter === "All" || budget.fy === fyFilter;
    return matchesSearch && matchesStatus && matchesFy;
  }), [budgets, fyFilter, searchTerm, statusFilter]);

  const openCreateForm = () => {
    setEditingId(null);
    setSuccessMsg("");
    reset(defaultFormValues);
    setShowForm(true);
  };

  const openEditForm = (budget: BudgetRecord) => {
    if (!["Draft", "Pending Approval"].includes(budget.status)) return;
    setEditingId(budget.id);
    setSuccessMsg("");
    reset({
      scopeType: budget.scopeType, department: budget.department, projectId: budget.projectId,
      category: budget.category, fy: budget.fy, periodStart: budget.periodStart,
      periodEnd: budget.periodEnd, allocatedAmount: budget.allocatedAmount,
      contingencyAmount: budget.contingencyAmount, alertThreshold: budget.alertThreshold,
      blockThreshold: budget.blockThreshold, owner: budget.owner,
      costCenter: budget.costCenter, remarks: budget.remarks,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setSuccessMsg("");
    reset(defaultFormValues);
  };

  const persistBudget = (data: BudgetFormData, status: BudgetStatus) => {
    const duplicate = budgets.some((budget) =>
      budget.id !== editingId
      && budget.scopeType === data.scopeType
      && budget.department === data.department
      && budget.projectId === (data.scopeType === "Project" ? data.projectId ?? "" : "")
      && budget.category === data.category
      && budget.fy === data.fy
      && !["Rejected", "Archived", "Closed"].includes(budget.status),
    );
    if (duplicate) {
      setError("category", { message: "An active budget already exists for this scope, category, and financial year" });
      return;
    }
    const project = projectOptions.find((item) => item.id === data.projectId);
    const now = new Date().toISOString();
    const common = {
      scopeType: data.scopeType,
      department: data.department,
      projectId: data.scopeType === "Project" ? data.projectId ?? "" : "",
      projectName: data.scopeType === "Project" ? project?.name ?? "" : "",
      category: data.category,
      fy: data.fy,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
      allocatedAmount: data.allocatedAmount,
      contingencyAmount: data.contingencyAmount,
      alertThreshold: data.alertThreshold,
      blockThreshold: data.blockThreshold,
      owner: data.owner,
      costCenter: data.costCenter,
      remarks: data.remarks,
      status,
      updatedAt: now,
    };
    if (editingId) {
      setBudgets((current) => current.map((budget) => budget.id === editingId ? { ...budget, ...common } : budget));
      setSuccessMsg(status === "Draft" ? "Budget draft updated" : "Budget submitted for approval");
    } else {
      const nextNumber = Math.max(4, ...budgets.map((budget) => Number(budget.id.split("-").pop()) || 0)) + 1;
      setBudgets((current) => [{
        id: `BUD-${new Date().getFullYear()}-${String(nextNumber).padStart(3, "0")}`,
        ...common,
        approvedBy: "",
        createdBy: "Finance Manager",
        createdAt: now,
        revisions: [],
      }, ...current]);
      setSuccessMsg(status === "Draft" ? "Budget draft saved" : "Budget submitted for approval");
    }
    setTimeout(closeForm, 900);
  };

  const saveDraft = handleSubmit((data) => persistBudget(data, "Draft"));
  const submitForApproval = handleSubmit((data) => persistBudget(data, "Pending Approval"));

  const updateStatus = (budgetId: string, status: BudgetStatus) => {
    setBudgets((current) => current.map((budget) => budget.id === budgetId ? {
      ...budget,
      status,
      approvedBy: status === "Active" ? "Director" : budget.approvedBy,
      updatedAt: new Date().toISOString(),
    } : budget));
  };

  const submitRevision = () => {
    if (!showRevision) return;
    const revisedAmount = Number(revisionAmount);
    if (!Number.isFinite(revisedAmount) || revisedAmount <= 0) {
      setRevisionError("Revised allocation must be greater than 0");
      return;
    }
    if (revisionReason.trim().length < 5) {
      setRevisionError("Revision reason is required");
      return;
    }
    const spend = spendForBudget(showRevision);
    if (revisedAmount + showRevision.contingencyAmount < spend.actual + spend.committed) {
      setRevisionError("Revised budget cannot be below actual plus committed spend");
      return;
    }
    const now = new Date().toISOString();
    const revision: BudgetRevision = {
      id: `REV-${Date.now()}`, previousAmount: showRevision.allocatedAmount,
      revisedAmount, reason: revisionReason.trim(), requestedBy: "Finance Manager",
      requestedAt: now, status: "Pending", approvedBy: "", approvedAt: "",
    };
    setBudgets((current) => current.map((budget) => budget.id === showRevision.id
      ? { ...budget, revisions: [revision, ...budget.revisions], updatedAt: now }
      : budget));
    setShowRevision(null);
    setRevisionAmount("");
    setRevisionReason("");
    setRevisionError("");
  };

  const decideRevision = (budgetId: string, revisionId: string, approved: boolean) => {
    const now = new Date().toISOString();
    setBudgets((current) => current.map((budget) => {
      if (budget.id !== budgetId) return budget;
      const revision = budget.revisions.find((item) => item.id === revisionId);
      if (!revision || revision.status !== "Pending") return budget;
      return {
        ...budget,
        allocatedAmount: approved ? revision.revisedAmount : budget.allocatedAmount,
        revisions: budget.revisions.map((item) => item.id === revisionId ? {
          ...item, status: approved ? "Approved" : "Rejected",
          approvedBy: "Director", approvedAt: now,
        } : item),
        updatedAt: now,
      };
    }));
  };

  const exportBudgets = () => {
    const rows = [
      ["Budget", "Scope", "Department", "Project", "Category", "FY", "Allocated", "Contingency", "Actual", "Committed", "Available", "Utilization", "Alert", "Block", "Owner", "Cost Center", "Status"],
      ...filteredBudgets.map((budget) => {
        const spend = spendForBudget(budget);
        const approved = budget.allocatedAmount + budget.contingencyAmount;
        const used = spend.actual + spend.committed;
        return [
          budget.id, budget.scopeType, budget.department, budget.projectName, budget.category,
          budget.fy, budget.allocatedAmount, budget.contingencyAmount, spend.actual,
          spend.committed, approved - used, approved ? used / approved * 100 : 0,
          budget.alertThreshold, budget.blockThreshold, budget.owner, budget.costCenter, budget.status,
        ];
      }),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    downloadFile("budget-register.csv", csv, "text/csv;charset=utf-8");
  };

  const activeBudgets = budgets.filter((budget) => budget.status === "Active");
  const totalBudget = activeBudgets.reduce((sum, budget) => sum + budget.allocatedAmount + budget.contingencyAmount, 0);
  const totalActual = activeBudgets.reduce((sum, budget) => sum + spendForBudget(budget).actual, 0);
  const totalCommitted = activeBudgets.reduce((sum, budget) => sum + spendForBudget(budget).committed, 0);
  const available = totalBudget - totalActual - totalCommitted;
  const riskyCount = activeBudgets.filter((budget) => healthFor(budget) !== "Healthy").length;
  const pendingRevisionCount = budgets.reduce((sum, budget) => sum + budget.revisions.filter((revision) => revision.status === "Pending").length, 0);

  return (
    <AccountingPage
      title="Budget Control"
      description="Control approved financial limits using actual and committed spend, utilization alerts, revisions, and approval history."
      icon={BarChart3}
      badge="Financial control"
      actions={
        <>
          <ActionButton icon={Download} label="Export Report" variant="outline" onClick={exportBudgets} />
          <ActionButton icon={Plus} label="New Budget" variant="accent" onClick={openCreateForm} />
        </>
      }
    >
      <WorkflowSteps steps={["Budget Draft", "Finance Review", "Approval", "Spend Monitoring", "Revision / Close"]} />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Approved Budget" value={money(totalBudget)} helper="Allocation plus contingency" icon={Target} tone="blue" />
        <MetricCard label="Actual + Committed" value={money(totalActual + totalCommitted)} helper={`${money(totalCommitted)} committed`} icon={WalletCards} tone="amber" />
        <MetricCard label="Available Balance" value={money(available)} helper="After actual and commitments" icon={Wallet} tone="green" />
        <MetricCard label="Control Alerts" value={String(riskyCount + pendingRevisionCount)} helper={`${riskyCount} risky, ${pendingRevisionCount} revisions`} icon={AlertCircle} tone="red" />
      </div>

      {showForm ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-[2rem] border border-slate-100 bg-white p-8 shadow-2xl animate-in zoom-in-95">
            <button type="button" onClick={closeForm} className="absolute right-8 top-8 rounded-full p-2 text-slate-400 hover:bg-slate-50 hover:text-primary"><X size={24} /></button>
            {successMsg ? (
              <div className="space-y-4 py-20 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle2 size={48} /></div>
                <h3 className="text-2xl font-black text-primary">{successMsg}</h3>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Approved limits change only through controlled activation or revision.</p>
              </div>
            ) : (
              <form onSubmit={submitForApproval} className="space-y-8">
                <div className="border-b border-slate-100 pb-6">
                  <h3 className="text-2xl font-black text-primary">{editingId ? "Edit Budget" : "Create Budget"}</h3>
                  <p className="mt-1 text-sm font-medium text-slate-500">Actual and committed spend are derived from ledger snapshots, not entered manually.</p>
                </div>
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
                  <div className="space-y-8 lg:col-span-3">
                    <Panel title="Budget Scope" description="Define financial ownership, category, period, and cost center.">
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <Field label="Scope Type" options={[...scopeTypes]} required register={register("scopeType")} error={errors.scopeType?.message} />
                        <Field label="Department" options={[...departments]} required register={register("department")} error={errors.department?.message} />
                        {watchedScope === "Project" ? (
                          <label className="block space-y-1.5">
                            <span className="text-xs font-black uppercase tracking-widest text-slate-500">Project <span className="text-red-500">*</span></span>
                            <select {...register("projectId")} className={`h-11 w-full rounded-xl border bg-white px-3 text-sm font-semibold text-primary outline-none ${errors.projectId ? "border-red-500" : "border-border"}`}>
                              <option value="">Select project...</option>
                              {projectOptions.filter((project) => project.department === watchedDepartment).map((project) => <option key={project.id} value={project.id}>{project.id} - {project.name}</option>)}
                            </select>
                            {errors.projectId ? <p className="text-[10px] font-black uppercase tracking-widest text-red-500">{errors.projectId.message}</p> : null}
                          </label>
                        ) : null}
                        <Field label="Budget Category" options={[...categories]} required register={register("category")} error={errors.category?.message} />
                        <Field label="Financial Year" options={[...fiscalYears]} required register={register("fy")} error={errors.fy?.message} />
                        <Field label="Period Start" type="date" required register={register("periodStart")} error={errors.periodStart?.message} />
                        <Field label="Period End" type="date" required register={register("periodEnd")} error={errors.periodEnd?.message} />
                        <Field label="Budget Owner" required register={register("owner")} error={errors.owner?.message} />
                        <Field label="Cost Center" required register={register("costCenter")} error={errors.costCenter?.message} />
                      </div>
                    </Panel>

                    <Panel title="Financial Controls" description="Approved limit, contingency reserve, and utilization thresholds.">
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <Field label="Allocated Amount" type="number" step="0.01" required register={register("allocatedAmount")} error={errors.allocatedAmount?.message} />
                        <Field label="Contingency Reserve" type="number" step="0.01" register={register("contingencyAmount")} error={errors.contingencyAmount?.message} />
                        <Field label="Alert Threshold %" type="number" step="0.01" required register={register("alertThreshold")} error={errors.alertThreshold?.message} />
                        <Field label="Block Threshold %" type="number" step="0.01" required register={register("blockThreshold")} error={errors.blockThreshold?.message} />
                        <div className="md:col-span-2"><Field label="Purpose & Constraints" multiline required register={register("remarks")} error={errors.remarks?.message} /></div>
                      </div>
                    </Panel>
                  </div>
                  <div className="space-y-6">
                    <Panel title="Control Preview" description="Limit available after approval.">
                      <div className="space-y-5">
                        <div className="rounded-2xl bg-primary p-6 text-white">
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Total Approved Limit</p>
                          <p className="mt-2 text-3xl font-black">{money(previewApproved)}</p>
                          <div className="mt-4 border-t border-white/10 pt-4 text-xs font-bold text-white/70">
                            Alert at {Number(watchedAlert) || 0}% | Block at {Number(watchedBlock) || 0}%
                          </div>
                        </div>
                        <ActionButton icon={ShieldCheck} label="Submit for Approval" variant="accent" type="submit" />
                        <ActionButton icon={BarChart3} label="Save Draft" variant="outline" onClick={saveDraft} />
                      </div>
                    </Panel>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}

      {showRevision ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-black text-primary">Request Budget Revision</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">{showRevision.id} | Current {money(showRevision.allocatedAmount)}</p>
            <div className="mt-6 space-y-5">
              <Field label="Revised Allocation" type="number" step="0.01" value={revisionAmount} onChange={(event) => { setRevisionAmount(event.target.value); setRevisionError(""); }} />
              <Field label="Revision Reason" multiline value={revisionReason} onChange={(event) => { setRevisionReason(event.target.value); setRevisionError(""); }} />
              {revisionError ? <p className="text-xs font-bold text-red-500">{revisionError}</p> : null}
              <div className="flex justify-end gap-3">
                <ActionButton label="Cancel" variant="outline" onClick={() => setShowRevision(null)} />
                <ActionButton label="Submit Revision" variant="accent" onClick={submitRevision} />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <Panel
        title="Budget Control Register"
        description="Approved limits compared with actual and committed spend."
        actions={<StatusBadge tone="blue">{filteredBudgets.length} Budgets</StatusBadge>}
      >
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_190px_190px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={15} />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search budget, department, category, owner..." className="h-11 w-full rounded-xl border border-border bg-white pl-10 pr-3 text-sm font-semibold text-primary outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
          </div>
          <select value={fyFilter} onChange={(event) => setFyFilter(event.target.value)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none">
            {["All", ...fiscalYears].map((fy) => <option key={fy} value={fy}>{fy}</option>)}
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none">
            {["All", ...budgetStatuses].map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </div>

        <DataTable columns={["Budget Scope", "Approved Limit", "Spend Control", "Utilization", "Status", "Actions"]}>
          {filteredBudgets.map((budget) => {
            const spend = spendForBudget(budget);
            const approved = budget.allocatedAmount + budget.contingencyAmount;
            const used = spend.actual + spend.committed;
            const utilization = approved ? used / approved * 100 : 0;
            const health = healthFor(budget);
            const pendingRevision = budget.revisions.find((revision) => revision.status === "Pending");
            return (
              <tr key={budget.id} className="text-sm transition-colors hover:bg-slate-50">
                <td className="px-4 py-4">
                  <p className="font-black text-primary">{budget.department}{budget.projectName ? ` / ${budget.projectName}` : ""}</p>
                  <p className="text-xs font-semibold text-slate-500">{budget.id} | {budget.category} | {budget.costCenter}</p>
                </td>
                <td className="px-4 py-4">
                  <p className="font-black text-primary">{money(approved)}</p>
                  <p className="text-[11px] font-semibold text-slate-400">Allocation {money(budget.allocatedAmount)} | Reserve {money(budget.contingencyAmount)}</p>
                </td>
                <td className="px-4 py-4">
                  <p className="font-bold text-slate-600">Actual {money(spend.actual)}</p>
                  <p className="text-[11px] font-semibold text-slate-400">Committed {money(spend.committed)} | Available {money(approved - used)}</p>
                </td>
                <td className="px-4 py-4">
                  <div className="flex min-w-[150px] items-center gap-3">
                    <ProgressBar value={utilization} tone={health === "Blocked" ? "red" : health === "Watch" ? "amber" : "green"} />
                    <span className="text-[10px] font-black text-primary">{utilization.toFixed(1)}%</span>
                  </div>
                  <p className="mt-2 text-[10px] font-semibold text-slate-400">Alert {budget.alertThreshold}% | Block {budget.blockThreshold}%</p>
                </td>
                <td className="px-4 py-4">
                  <StatusBadge tone={budget.status === "Active" ? health === "Blocked" ? "red" : health === "Watch" ? "amber" : "green" : budget.status === "Pending Approval" ? "amber" : budget.status === "Rejected" || budget.status === "Archived" ? "red" : "blue"}>
                    {budget.status === "Active" ? health : budget.status}
                  </StatusBadge>
                  {pendingRevision ? <p className="mt-2 text-[10px] font-bold text-amber-600">Revision to {money(pendingRevision.revisedAmount)} pending</p> : null}
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    {["Draft", "Pending Approval"].includes(budget.status) ? <button type="button" onClick={() => openEditForm(budget)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-primary" title="Edit budget"><Edit3 size={15} /></button> : null}
                    {budget.status === "Draft" ? <button type="button" onClick={() => updateStatus(budget.id, "Pending Approval")} className="rounded-lg border border-border p-2 text-slate-500 hover:text-amber-600" title="Submit approval"><ShieldCheck size={15} /></button> : null}
                    {budget.status === "Pending Approval" ? (
                      <>
                        <button type="button" onClick={() => updateStatus(budget.id, "Active")} className="rounded-lg border border-border p-2 text-slate-500 hover:text-green-600" title="Approve and activate"><Check size={15} /></button>
                        <button type="button" onClick={() => updateStatus(budget.id, "Rejected")} className="rounded-lg border border-border p-2 text-slate-500 hover:text-red-600" title="Reject"><X size={15} /></button>
                      </>
                    ) : null}
                    {budget.status === "Active" && !pendingRevision ? <button type="button" onClick={() => { setShowRevision(budget); setRevisionAmount(String(budget.allocatedAmount)); }} className="rounded-lg border border-border p-2 text-slate-500 hover:text-blue-600" title="Request revision"><TrendingUp size={15} /></button> : null}
                    {budget.status === "Active" && !pendingRevision ? <button type="button" onClick={() => updateStatus(budget.id, "Closed")} className="rounded-lg border border-border p-2 text-slate-500 hover:text-amber-600" title="Close budget period"><Wallet size={15} /></button> : null}
                    {pendingRevision ? (
                      <>
                        <button type="button" onClick={() => decideRevision(budget.id, pendingRevision.id, true)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-green-600" title="Approve revision"><CheckCircle2 size={15} /></button>
                        <button type="button" onClick={() => decideRevision(budget.id, pendingRevision.id, false)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-red-600" title="Reject revision"><X size={15} /></button>
                      </>
                    ) : null}
                    {budget.status === "Closed" ? <button type="button" onClick={() => updateStatus(budget.id, "Active")} className="rounded-lg border border-border p-2 text-slate-500 hover:text-green-600" title="Reopen budget"><RotateCcw size={15} /></button> : null}
                    {!["Active", "Archived"].includes(budget.status) ? <button type="button" onClick={() => updateStatus(budget.id, "Archived")} className="rounded-lg border border-border p-2 text-slate-500 hover:text-red-600" title="Archive budget"><Archive size={15} /></button> : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </DataTable>
      </Panel>
    </AccountingPage>
  );
}

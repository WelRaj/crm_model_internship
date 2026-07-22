"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  createFinanceResource,
  listFinanceResource,
  updateFinanceResource,
} from "@/services/finance-api";
import { listDeliveryProjects, type DeliveryProjectRecord } from "@/services/projects-api";

const INR = "\u20b9";
const fiscalYears = ["FY 2025-26", "FY 2026-27", "FY 2027-28"] as const;
const scopeTypes = ["Department", "Project"] as const;
const departments = ["Engineering", "Marketing", "Cloud Ops", "HR & Admin", "Sales", "Finance", "Product Design"] as const;
const categories = ["Operating Expenses", "Payroll", "Marketing Spend", "Cloud & Software", "Travel", "Procurement", "Project Delivery", "Capital Expenditure"] as const;
const budgetStatuses = ["Draft", "Pending Approval", "Active", "Rejected", "Closed", "Archived"] as const;

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
    if (!data.projectId) {
      ctx.addIssue({ code: "custom", path: ["projectId"], message: "Select a project" });
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
  backendId: string;
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
  consumedAmount: number;
  committedAmount: number;
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

type BackendBudgetRevision = {
  id: string;
  old_amount: string;
  new_amount: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  requested_by: string;
  approved_by: string;
  approved_at: string | null;
  created_at: string;
};

type BackendBudgetRecord = {
  id: string;
  budget_code: string;
  name: string;
  scope_type: typeof scopeTypes[number];
  department: typeof departments[number];
  project: string | null;
  category: typeof categories[number];
  fiscal_year: typeof fiscalYears[number];
  period_start: string;
  period_end: string;
  allocated_amount: string;
  contingency_amount: string;
  consumed_amount: string;
  committed_amount: string;
  alert_threshold: string;
  block_threshold: string;
  owner: string;
  cost_center: string;
  remarks: string;
  approved_by: string;
  status: BudgetStatus;
  created_at: string;
  updated_at: string;
  revisions: BackendBudgetRevision[];
};

type BackendBudgetPayload = {
  name: string;
  scope_type: typeof scopeTypes[number];
  department: typeof departments[number];
  project: string | null;
  category: typeof categories[number];
  fiscal_year: typeof fiscalYears[number];
  period_start: string;
  period_end: string;
  allocated_amount: string;
  contingency_amount: string;
  consumed_amount: string;
  committed_amount: string;
  alert_threshold: string;
  block_threshold: string;
  owner: string;
  cost_center: string;
  remarks: string;
  approved_by: string;
  status: BudgetStatus;
};

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
  return { actual: budget.consumedAmount, committed: budget.committedAmount };
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
  const [budgets, setBudgets] = useState<BudgetRecord[]>([]);
  const [projectOptions, setProjectOptions] = useState<DeliveryProjectRecord[]>([]);
  const [backendMessage, setBackendMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
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
  const watchedAllocated = useWatch({ control, name: "allocatedAmount" });
  const watchedContingency = useWatch({ control, name: "contingencyAmount" });
  const watchedAlert = useWatch({ control, name: "alertThreshold" });
  const watchedBlock = useWatch({ control, name: "blockThreshold" });
  const previewApproved = (Number(watchedAllocated) || 0) + (Number(watchedContingency) || 0);

  const mapBudget = (budget: BackendBudgetRecord, projects: DeliveryProjectRecord[]): BudgetRecord => {
    const project = projects.find((item) => item.id === budget.project);
    return {
      backendId: budget.id,
      id: budget.budget_code,
      scopeType: budget.scope_type || "Department",
      department: budget.department,
      projectId: budget.project || "",
      projectName: project?.name || "",
      category: budget.category || "Operating Expenses",
      fy: budget.fiscal_year || "FY 2026-27",
      periodStart: budget.period_start,
      periodEnd: budget.period_end,
      allocatedAmount: Number(budget.allocated_amount) || 0,
      contingencyAmount: Number(budget.contingency_amount) || 0,
      consumedAmount: Number(budget.consumed_amount) || 0,
      committedAmount: Number(budget.committed_amount) || 0,
      alertThreshold: Number(budget.alert_threshold) || 80,
      blockThreshold: Number(budget.block_threshold) || 100,
      owner: budget.owner,
      costCenter: budget.cost_center,
      remarks: budget.remarks,
      status: budget.status,
      approvedBy: budget.approved_by,
      createdBy: "Finance",
      createdAt: budget.created_at,
      updatedAt: budget.updated_at,
      revisions: budget.revisions.map((revision) => ({
        id: revision.id,
        previousAmount: Number(revision.old_amount) || 0,
        revisedAmount: Number(revision.new_amount) || 0,
        reason: revision.reason,
        requestedBy: revision.requested_by || "Finance Manager",
        requestedAt: revision.created_at,
        status: revision.status,
        approvedBy: revision.approved_by,
        approvedAt: revision.approved_at || "",
      })),
    };
  };

  const budgetPayload = (data: BudgetFormData, status: BudgetStatus): BackendBudgetPayload => {
    const project = data.scopeType === "Project" ? data.projectId || null : null;
    return {
      name: `${data.department} - ${data.category} - ${data.fy}`,
      scope_type: data.scopeType,
      department: data.department,
      project,
      category: data.category,
      fiscal_year: data.fy,
      period_start: data.periodStart,
      period_end: data.periodEnd,
      allocated_amount: String(data.allocatedAmount),
      contingency_amount: String(data.contingencyAmount),
      consumed_amount: "0",
      committed_amount: "0",
      alert_threshold: String(data.alertThreshold),
      block_threshold: String(data.blockThreshold),
      owner: data.owner,
      cost_center: data.costCenter,
      remarks: data.remarks,
      approved_by: status === "Active" ? "Director" : "",
      status,
    };
  };

  const loadBudgets = useCallback(async () => {
    try {
      setBackendMessage("");
      const [budgetRows, projectRows] = await Promise.all([
        listFinanceResource<BackendBudgetRecord>("budgets"),
        listDeliveryProjects(),
      ]);
      setProjectOptions(projectRows);
      setBudgets(budgetRows.map((budget) => mapBudget(budget, projectRows)));
    } catch (error) {
      setBackendMessage(error instanceof Error ? error.message : "Unable to load budgets.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadBudgets();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadBudgets]);

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

  const persistBudget = async (data: BudgetFormData, status: BudgetStatus) => {
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
    try {
      setBackendMessage("");
      if (editingId) {
        const row = budgets.find((budget) => budget.id === editingId);
        if (!row) return;
        await updateFinanceResource<BackendBudgetRecord, BackendBudgetPayload>("budgets", row.backendId, {
          ...budgetPayload(data, status),
          consumed_amount: String(row.consumedAmount),
          committed_amount: String(row.committedAmount),
        });
        setSuccessMsg(status === "Draft" ? "Budget draft updated" : "Budget submitted for approval");
      } else {
        await createFinanceResource<BackendBudgetRecord, BackendBudgetPayload>("budgets", budgetPayload(data, status));
        setSuccessMsg(status === "Draft" ? "Budget draft saved" : "Budget submitted for approval");
      }
      await loadBudgets();
      setTimeout(closeForm, 900);
    } catch (error) {
      setBackendMessage(error instanceof Error ? error.message : "Unable to save budget.");
    }
  };

  const saveDraft = handleSubmit((data) => persistBudget(data, "Draft"));
  const submitForApproval = handleSubmit((data) => persistBudget(data, "Pending Approval"));

  const updateStatus = async (budgetId: string, status: BudgetStatus) => {
    const budget = budgets.find((item) => item.id === budgetId);
    if (!budget) return;
    try {
      setBackendMessage("");
      await updateFinanceResource<BackendBudgetRecord, BackendBudgetPayload>("budgets", budget.backendId, {
        status,
        approved_by: status === "Active" ? "Director" : budget.approvedBy,
      });
      await loadBudgets();
    } catch (error) {
      setBackendMessage(error instanceof Error ? error.message : "Unable to update budget status.");
    }
  };

  const submitRevision = async () => {
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
    try {
      setBackendMessage("");
      await createFinanceResource<BackendBudgetRevision, {
        budget: string;
        old_amount: string;
        new_amount: string;
        reason: string;
        status: "Pending";
        requested_by: string;
      }>("budget-revisions", {
        budget: showRevision.backendId,
        old_amount: String(showRevision.allocatedAmount),
        new_amount: String(revisedAmount),
        reason: revisionReason.trim(),
        status: "Pending",
        requested_by: "Finance Manager",
      });
      await loadBudgets();
      setShowRevision(null);
      setRevisionAmount("");
      setRevisionReason("");
      setRevisionError("");
    } catch (error) {
      setRevisionError(error instanceof Error ? error.message : "Unable to submit revision.");
    }
  };

  const decideRevision = async (budgetId: string, revisionId: string, approved: boolean) => {
    const budget = budgets.find((item) => item.id === budgetId);
    const revision = budget?.revisions.find((item) => item.id === revisionId);
    if (!budget || !revision || revision.status !== "Pending") return;
    try {
      setBackendMessage("");
      await updateFinanceResource<BackendBudgetRevision, Partial<BackendBudgetRevision>>("budget-revisions", revisionId, {
        status: approved ? "Approved" : "Rejected",
        approved_by: "Director",
        approved_at: new Date().toISOString(),
      });
      if (approved) {
        await updateFinanceResource<BackendBudgetRecord, BackendBudgetPayload>("budgets", budget.backendId, {
          allocated_amount: String(revision.revisedAmount),
        });
      }
      await loadBudgets();
    } catch (error) {
      setBackendMessage(error instanceof Error ? error.message : "Unable to decide budget revision.");
    }
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

      {backendMessage ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {backendMessage}
        </div>
      ) : null}

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
                              {projectOptions.map((project) => <option key={project.id} value={project.id}>{project.project_number} - {project.name}</option>)}
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
        {isLoading ? (
          <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500">
            Loading backend budgets...
          </div>
        ) : null}
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
          {!isLoading && filteredBudgets.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-sm font-bold text-slate-400">
                No backend budgets found.
              </td>
            </tr>
          ) : null}
        </DataTable>
      </Panel>
    </AccountingPage>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  AlertTriangle, CheckCircle2, Clock, Download, Eye, Filter,
  Search, ShieldCheck, ThumbsDown, ThumbsUp, UserCheck, X,
} from "lucide-react";
import { useAuth } from "./AccessControlContext";
import {
  AccountingPage, ActionButton, DataTable, Field,
  MetricCard, Panel, StatusBadge, WorkflowSteps,
} from "./AccountingComponents";
import {
  createFinanceResource,
  listFinanceResource,
  updateFinanceResource,
} from "@/services/finance-api";

const INR = "\u20b9";
const modules = ["Quotation", "Invoice", "Expense", "Payment", "Credit Note", "Budget", "Budget Revision", "Payroll", "GST Return", "TDS Compliance"] as const;
const approvalStatuses = ["Pending", "In Review", "Clarification Required", "Hold", "Approved", "Rejected", "Cancelled"] as const;
const decisions = ["Approve", "Reject", "Need Clarification", "Hold"] as const;
const roles = ["Admin", "Director", "Finance Manager", "Accountant", "HR Manager"] as const;
const openStatuses = ["pending", "in_review", "clarification_required", "hold"];

type ModuleName = typeof modules[number];
type ApprovalStatus = typeof approvalStatuses[number];
type ApproverRole = typeof roles[number];
type ApiStatus = "pending" | "in_review" | "clarification_required" | "hold" | "approved" | "rejected" | "cancelled";

type DecisionEvent = {
  at: string;
  actor: string;
  role: string;
  action: string;
  comment: string;
};

type ApprovalPolicyRecord = {
  id: string;
  name: string;
  module: ModuleName;
  min_amount: string;
  max_amount: string | null;
  approver_role: ApproverRole;
  second_approver_role: ApproverRole | "";
  sla_hours: number;
  is_enabled: boolean;
};

type ApprovalPolicyPayload = {
  name: string;
  module: ModuleName;
  min_amount: string;
  max_amount?: string | null;
  approver_role: ApproverRole;
  second_approver_role?: ApproverRole | "";
  sla_hours: number;
  is_enabled?: boolean;
};

type ApprovalRequestRecord = {
  id: string;
  request_number: string;
  module: ModuleName;
  entity_type: string;
  entity_id: string;
  amount: string;
  department: string;
  requester_name: string;
  requester_role: string;
  current_approver_role: ApproverRole | "";
  second_approver_role: ApproverRole | "";
  approval_level: 1 | 2;
  risk: "low" | "medium" | "high";
  policy: string | null;
  budget_status: "Within Budget" | "Near Limit" | "Over Budget" | "Not Applicable";
  duplicate_check: "Clear" | "Review";
  compliance_check: "Clear" | "Review";
  status: ApiStatus;
  status_label: ApprovalStatus;
  decision_note: string;
  due_at: string | null;
  summary: string;
  events: DecisionEvent[];
  created_at: string;
};

type ApprovalRequestPayload = Partial<Omit<ApprovalRequestRecord, "id" | "request_number" | "status_label" | "created_at">>;

const decisionSchema = z.object({
  requestId: z.string().min(1),
  action: z.enum(decisions),
  comment: z.string().trim().min(5, "Audit comment must contain at least 5 characters"),
});

const policySchema = z.object({
  module: z.enum(modules),
  minAmount: z.coerce.number().min(0),
  maxAmount: z.coerce.number().min(0).optional(),
  approverRole: z.enum(roles),
  secondApproverRole: z.enum(["", ...roles]),
  slaHours: z.coerce.number().int().min(1).max(168),
}).superRefine((data, ctx) => {
  if (data.maxAmount !== undefined && data.maxAmount > 0 && data.maxAmount < data.minAmount) {
    ctx.addIssue({ code: "custom", path: ["maxAmount"], message: "Maximum amount cannot be below minimum" });
  }
  if (data.secondApproverRole && data.secondApproverRole === data.approverRole) {
    ctx.addIssue({ code: "custom", path: ["secondApproverRole"], message: "Second approver must be a different role" });
  }
});

type DecisionFormInput = z.input<typeof decisionSchema>;
type DecisionFormData = z.output<typeof decisionSchema>;
type PolicyFormInput = z.input<typeof policySchema>;
type PolicyFormData = z.output<typeof policySchema>;

function money(value: string | number) {
  return `${INR} ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
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

function toApiStatus(status: ApprovalStatus): ApiStatus {
  return status.toLowerCase().replaceAll(" ", "_") as ApiStatus;
}

function decisionToStatus(action: typeof decisions[number]): ApiStatus {
  if (action === "Approve") return "approved";
  if (action === "Reject") return "rejected";
  if (action === "Need Clarification") return "clarification_required";
  return "hold";
}

function riskLabel(risk: ApprovalRequestRecord["risk"]) {
  return risk.charAt(0).toUpperCase() + risk.slice(1);
}

export default function Step14Approvals() {
  const { role } = useAuth();
  const currentRole = role as ApproverRole | "Sales";
  const [queue, setQueue] = useState<ApprovalRequestRecord[]>([]);
  const [policies, setPolicies] = useState<ApprovalPolicyRecord[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequestRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [myQueueOnly, setMyQueueOnly] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showPolicyForm, setShowPolicyForm] = useState(false);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [todayTimestamp] = useState(() => Date.now());

  const {
    register, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm<DecisionFormInput, unknown, DecisionFormData>({
    resolver: zodResolver(decisionSchema),
    defaultValues: { requestId: "", action: "Approve", comment: "" },
  });

  const {
    register: registerPolicy, handleSubmit: handlePolicySubmit, reset: resetPolicy,
    formState: { errors: policyErrors, isSubmitting: savingPolicy },
  } = useForm<PolicyFormInput, unknown, PolicyFormData>({
    resolver: zodResolver(policySchema),
    defaultValues: { module: "Expense", minAmount: 0, maxAmount: undefined, approverRole: "Finance Manager", secondApproverRole: "", slaHours: 8 },
  });

  const loadApprovals = useCallback(async () => {
    setLoading(true);
    setNotice("");
    try {
      const [requestRows, policyRows] = await Promise.all([
        listFinanceResource<ApprovalRequestRecord>("approval-requests"),
        listFinanceResource<ApprovalPolicyRecord>("approval-policies"),
      ]);
      setQueue(requestRows);
      setPolicies(policyRows);
    } catch {
      setNotice("Something went wrong while loading finance approvals.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadApprovals();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadApprovals]);

  const canAct = (request: ApprovalRequestRecord) =>
    ["Admin", request.current_approver_role].includes(currentRole)
    && !["approved", "rejected", "cancelled"].includes(request.status)
    && request.requester_role !== currentRole;

  const filteredQueue = useMemo(() => queue.filter((request) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch = !query || [
      request.request_number, request.module, request.entity_id, request.requester_name,
      request.department, request.summary, request.entity_type,
    ].join(" ").toLowerCase().includes(query);
    const matchesStatus = statusFilter === "All" || request.status === toApiStatus(statusFilter as ApprovalStatus);
    const matchesModule = moduleFilter === "All" || request.module === moduleFilter;
    const matchesMine = !myQueueOnly || currentRole === "Admin" || request.current_approver_role === currentRole;
    return matchesSearch && matchesStatus && matchesModule && matchesMine;
  }), [currentRole, moduleFilter, myQueueOnly, queue, searchTerm, statusFilter]);

  const openDecision = (request: ApprovalRequestRecord) => {
    setSelectedRequest(request);
    reset({ requestId: request.id, action: "Approve", comment: "" });
  };

  const processDecision = async (data: DecisionFormData) => {
    if (!selectedRequest || !canAct(selectedRequest)) return;
    setNotice("");
    const now = new Date().toISOString();
    const baseEvent: DecisionEvent = {
      at: now,
      actor: role,
      role: currentRole,
      action: data.action,
      comment: data.comment,
    };
    const payload: ApprovalRequestPayload = { decision_note: data.comment };
    if (data.action === "Approve" && selectedRequest.second_approver_role && selectedRequest.approval_level === 1) {
      payload.current_approver_role = selectedRequest.second_approver_role;
      payload.second_approver_role = "";
      payload.approval_level = 2;
      payload.status = "pending";
      payload.events = [...selectedRequest.events, { ...baseEvent, action: "Level 1 Approved" }];
    } else {
      payload.status = decisionToStatus(data.action);
      payload.events = [...selectedRequest.events, baseEvent];
    }
    try {
      const savedRequest = await updateFinanceResource<ApprovalRequestRecord, ApprovalRequestPayload>("approval-requests", selectedRequest.id, payload);
      setQueue((current) => current.map((request) => request.id === savedRequest.id ? savedRequest : request));
      setSelectedRequest(savedRequest);
      setNotice("Approval decision saved.");
      if (["approved", "rejected", "clarification_required", "hold"].includes(savedRequest.status)) setSelectedRequest(null);
    } catch {
      setNotice("Decision could not be saved. Please check approval rules.");
    }
  };

  const savePolicy = async (data: PolicyFormData) => {
    setNotice("");
    const maxAmount = data.maxAmount && data.maxAmount > 0 ? String(data.maxAmount) : null;
    const payload: ApprovalPolicyPayload = {
      name: `${data.module} ${data.minAmount}-${maxAmount ?? "No Limit"} approval`,
      module: data.module,
      min_amount: String(data.minAmount),
      max_amount: maxAmount,
      approver_role: data.approverRole,
      second_approver_role: data.secondApproverRole,
      sla_hours: data.slaHours,
      is_enabled: true,
    };
    try {
      const savedPolicy = await createFinanceResource<ApprovalPolicyRecord, ApprovalPolicyPayload>("approval-policies", payload);
      setPolicies((current) => [...current, savedPolicy].sort((a, b) => a.module.localeCompare(b.module) || Number(a.min_amount) - Number(b.min_amount)));
      setNotice("Policy rule added.");
      resetPolicy();
    } catch {
      setNotice("Policy could not be saved. Active ranges cannot overlap.");
    }
  };

  const bulkApprove = async () => {
    const approvable = queue.filter((request) => selectedIds.includes(request.id) && canAct(request) && request.risk === "low" && request.approval_level === 1 && !request.second_approver_role);
    if (!approvable.length) return;
    setNotice("");
    const now = new Date().toISOString();
    try {
      const updated = await Promise.all(approvable.map((request) => updateFinanceResource<ApprovalRequestRecord, ApprovalRequestPayload>("approval-requests", request.id, {
        status: "approved",
        decision_note: "Low-risk single-level approval.",
        events: [...request.events, { at: now, actor: role, role: currentRole, action: "Bulk Approved", comment: "Low-risk single-level approval." }],
      })));
      const updatedById = new Map(updated.map((savedRequest) => [savedRequest.id, savedRequest]));
      setQueue((current) => current.map((request) => updatedById.get(request.id) ?? request));
      setSelectedIds([]);
      setNotice("Bulk approval saved.");
    } catch {
      setNotice("Bulk approval failed for one or more selected requests.");
    }
  };

  const exportQueue = () => {
    const rows = [
      ["Approval ID", "Module", "Record", "Amount", "Department", "Requester", "Current Approver", "Level", "Risk", "Budget", "Duplicate", "Compliance", "Status", "Submitted", "Due"],
      ...filteredQueue.map((request) => [
        request.request_number, request.module, request.entity_id, request.amount, request.department,
        request.requester_name, request.current_approver_role, request.approval_level, riskLabel(request.risk),
        request.budget_status, request.duplicate_check, request.compliance_check, request.status_label,
        request.created_at, request.due_at ?? "",
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    downloadFile("approval-queue.csv", csv, "text/csv;charset=utf-8");
  };

  const pending = queue.filter((request) => openStatuses.includes(request.status));
  const overdue = pending.filter((request) => request.due_at && new Date(request.due_at).getTime() < todayTimestamp).length;
  const highRisk = pending.filter((request) => request.risk === "high").length;
  const rejected = queue.filter((request) => request.status === "rejected").length;

  return (
    <AccountingPage
      title="Finance Approvals"
      description="Route finance transactions by module, value, role, risk, budget, and compliance controls with permanent decision history."
      icon={ShieldCheck}
      badge={`Role: ${role}`}
      actions={
        <>
          <ActionButton icon={Download} label="Export Queue" variant="outline" onClick={exportQueue} />
          <ActionButton icon={CheckCircle2} label={`Bulk Approve (${selectedIds.length})`} variant="accent" onClick={bulkApprove} />
        </>
      }
    >
      <WorkflowSteps steps={["Request Raised", "Policy Routing", "Control Checks", "Approval Levels", "Decision Audit"]} />

      {notice ? <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">{notice}</div> : null}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Pending Action" value={String(pending.length)} helper={`${overdue} SLA overdue`} icon={Clock} tone="amber" />
        <MetricCard label="High Risk" value={String(highRisk)} helper="Compliance attention" icon={AlertTriangle} tone="red" />
        <MetricCard label="Director Queue" value={String(pending.filter((request) => request.current_approver_role === "Director").length)} helper="Final authority items" icon={UserCheck} tone="purple" />
        <MetricCard label="Rejected" value={String(rejected)} helper="Current decision history" icon={ThumbsDown} tone="slate" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel
          title="Approval Policies"
          description="Active routing rules. Overlapping amount ranges are blocked."
          actions={<ActionButton label={showPolicyForm ? "Close" : "Add Policy"} variant="outline" onClick={() => setShowPolicyForm((value) => !value)} />}
        >
          {showPolicyForm ? (
            <form onSubmit={handlePolicySubmit(savePolicy)} className="space-y-4">
              <Field label="Module" options={[...modules]} register={registerPolicy("module")} error={policyErrors.module?.message} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Minimum Amount" type="number" register={registerPolicy("minAmount")} error={policyErrors.minAmount?.message} />
                <Field label="Maximum Amount" type="number" placeholder="Blank = no limit" register={registerPolicy("maxAmount")} error={policyErrors.maxAmount?.message} />
              </div>
              <Field label="Primary Approver" options={[...roles]} register={registerPolicy("approverRole")} error={policyErrors.approverRole?.message} />
              <Field label="Second Approver" options={["", ...roles]} register={registerPolicy("secondApproverRole")} error={policyErrors.secondApproverRole?.message} />
              <Field label="SLA Hours" type="number" register={registerPolicy("slaHours")} error={policyErrors.slaHours?.message} />
              <ActionButton label={savingPolicy ? "Saving..." : "Save Policy"} variant="accent" type="submit" />
            </form>
          ) : (
            <div className="max-h-[430px] space-y-3 overflow-y-auto pr-2">
              {policies.filter((policy) => policy.is_enabled).map((policy) => (
                <div key={policy.id} className="rounded-xl border border-border p-4">
                  <div className="flex justify-between gap-3"><p className="font-black text-primary">{policy.module}</p><StatusBadge tone="green">Active</StatusBadge></div>
                  <p className="mt-2 text-xs font-semibold text-slate-500">{money(policy.min_amount)} to {policy.max_amount === null ? "No Limit" : money(policy.max_amount)}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{policy.approver_role}{policy.second_approver_role ? ` -> ${policy.second_approver_role}` : ""} | SLA {policy.sla_hours}h</p>
                </div>
              ))}
              {!policies.length && <p className="text-xs font-semibold text-slate-400">{loading ? "Loading policies..." : "No policy rules available."}</p>}
            </div>
          )}
        </Panel>

        <div className="xl:col-span-2">
          <Panel title="Approval Queue" description="Only requests routed to the active role can be decided.">
            <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_190px_auto]">
              <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={15} /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search request, module, record, requester..." className="h-11 w-full rounded-xl border border-border bg-white pl-10 pr-3 text-sm font-semibold text-primary outline-none" /></div>
              <select value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary">{["All", ...modules].map((module) => <option key={module} value={module}>{module}</option>)}</select>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary">{["All", ...approvalStatuses].map((status) => <option key={status} value={status}>{status}</option>)}</select>
              <button type="button" onClick={() => setMyQueueOnly((value) => !value)} className={`h-11 rounded-xl border px-4 text-xs font-black uppercase ${myQueueOnly ? "border-primary bg-primary text-white" : "border-border bg-white text-primary"}`}><Filter size={14} className="mr-2 inline" />My Queue</button>
            </div>
            <DataTable columns={["Select", "Request / Record", "Module / Requester", "Amount / Controls", "Approver", "Status", "Actions"]}>
              {filteredQueue.map((request) => (
                <tr key={request.id} className="text-sm hover:bg-slate-50">
                  <td className="px-4 py-4"><input type="checkbox" checked={selectedIds.includes(request.id)} disabled={!canAct(request) || request.risk !== "low" || Boolean(request.second_approver_role)} onChange={(event) => setSelectedIds((current) => event.target.checked ? [...current, request.id] : current.filter((id) => id !== request.id))} /></td>
                  <td className="px-4 py-4"><p className="font-black text-primary">{request.request_number}</p><p className="text-xs font-semibold text-slate-500">{request.entity_id}</p></td>
                  <td className="px-4 py-4"><p className="font-black text-primary">{request.module}</p><p className="text-xs font-semibold text-slate-500">{request.requester_name || "System"} | {request.department || "Finance"}</p></td>
                  <td className="px-4 py-4"><p className="font-black text-primary">{money(request.amount)}</p><p className="text-[11px] font-semibold text-slate-400">{request.budget_status} | {request.compliance_check}</p></td>
                  <td className="px-4 py-4"><p className="font-bold text-slate-600">{request.current_approver_role || "-"}</p><p className="text-[11px] text-slate-400">Level {request.approval_level} | {riskLabel(request.risk)} risk</p></td>
                  <td className="px-4 py-4"><StatusBadge tone={request.status === "approved" ? "green" : request.status === "rejected" ? "red" : request.status === "clarification_required" || request.status === "hold" ? "blue" : "amber"}>{request.status_label}</StatusBadge></td>
                  <td className="px-4 py-4"><button type="button" onClick={() => openDecision(request)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-primary" title="View approval"><Eye size={15} /></button></td>
                </tr>
              ))}
              {!filteredQueue.length && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-xs font-bold text-slate-400">{loading ? "Loading approval queue..." : "No approval requests match the selected filters."}</td></tr>
              )}
            </DataTable>
          </Panel>
        </div>
      </div>

      {selectedRequest ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl">
            <button type="button" onClick={() => setSelectedRequest(null)} className="absolute right-8 top-8 rounded-full p-2 text-slate-400 hover:bg-slate-50"><X size={24} /></button>
            <div className="border-b border-slate-100 pb-6">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">{selectedRequest.module} | Level {selectedRequest.approval_level}</p>
              <h3 className="mt-2 text-2xl font-black text-primary">{selectedRequest.entity_id}</h3>
              <p className="mt-2 text-sm font-semibold text-slate-500">{selectedRequest.summary || selectedRequest.entity_type}</p>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {[
                    ["Amount", money(selectedRequest.amount)],
                    ["Requester", `${selectedRequest.requester_name || "System"} (${selectedRequest.requester_role || "Finance"})`],
                    ["Budget Check", selectedRequest.budget_status],
                    ["Duplicate Check", selectedRequest.duplicate_check],
                    ["Compliance", selectedRequest.compliance_check],
                    ["SLA Due", selectedRequest.due_at ? new Date(selectedRequest.due_at).toLocaleString("en-IN") : "Not set"],
                  ].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-4"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p><p className="mt-1 text-sm font-black text-primary">{value}</p></div>)}
                </div>
                <Panel title="Decision History" description="Permanent approval comments and routing changes.">
                  <div className="max-h-[240px] space-y-3 overflow-y-auto">
                    {selectedRequest.events.length ? selectedRequest.events.map((event, index) => <div key={`${event.at}-${index}`} className="rounded-xl border border-border p-3"><p className="text-xs font-black text-primary">{event.action} by {event.actor} ({event.role})</p><p className="mt-1 text-xs text-slate-500">{event.comment}</p><p className="mt-1 text-[10px] text-slate-400">{new Date(event.at).toLocaleString("en-IN")}</p></div>) : <p className="text-xs font-semibold text-slate-400">No prior decisions.</p>}
                  </div>
                </Panel>
              </div>
              <div>
                {canAct(selectedRequest) ? (
                  <form onSubmit={handleSubmit(processDecision)} className="space-y-5">
                    <input type="hidden" {...register("requestId")} />
                    <Field label="Decision" options={[...decisions]} register={register("action")} error={errors.action?.message} />
                    <Field label="Audit Comment" multiline required register={register("comment")} error={errors.comment?.message} />
                    <ActionButton icon={ThumbsUp} label={isSubmitting ? "Saving..." : "Submit Decision"} variant="accent" type="submit" />
                  </form>
                ) : (
                  <div className="rounded-xl border border-amber-100 bg-amber-50 p-5">
                    <p className="text-sm font-black text-amber-800">View Only</p>
                    <p className="mt-2 text-xs font-semibold text-amber-700">This request is not assigned to your current role, is already completed, or violates separation of duties.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </AccountingPage>
  );
}

"use client";

import { useMemo, useState } from "react";
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

const INR = "\u20b9";
const modules = ["Quotation", "Invoice", "Expense", "Payment", "Credit Note", "Budget", "Budget Revision", "Payroll", "GST Return", "TDS Compliance"] as const;
const approvalStatuses = ["Pending", "In Review", "Clarification Required", "Hold", "Approved", "Rejected", "Cancelled"] as const;
const decisions = ["Approve", "Reject", "Need Clarification", "Hold"] as const;
type ApproverRole = "Admin" | "Director" | "Finance Manager" | "Accountant" | "HR Manager";

type ApprovalPolicy = {
  id: string;
  module: typeof modules[number];
  minAmount: number;
  maxAmount: number | null;
  approverRole: ApproverRole;
  secondApproverRole: ApproverRole | "";
  slaHours: number;
  active: boolean;
};

const initialPolicies: ApprovalPolicy[] = [
  { id: "POL-001", module: "Quotation", minAmount: 0, maxAmount: 500000, approverRole: "Finance Manager", secondApproverRole: "", slaHours: 8, active: true },
  { id: "POL-002", module: "Quotation", minAmount: 500000.01, maxAmount: null, approverRole: "Finance Manager", secondApproverRole: "Director", slaHours: 6, active: true },
  { id: "POL-003", module: "Invoice", minAmount: 0, maxAmount: 500000, approverRole: "Finance Manager", secondApproverRole: "", slaHours: 8, active: true },
  { id: "POL-004", module: "Invoice", minAmount: 500000.01, maxAmount: null, approverRole: "Finance Manager", secondApproverRole: "Director", slaHours: 4, active: true },
  { id: "POL-005", module: "Expense", minAmount: 0, maxAmount: 50000, approverRole: "Finance Manager", secondApproverRole: "", slaHours: 12, active: true },
  { id: "POL-006", module: "Expense", minAmount: 50000.01, maxAmount: null, approverRole: "Finance Manager", secondApproverRole: "Director", slaHours: 6, active: true },
  { id: "POL-007", module: "Credit Note", minAmount: 0, maxAmount: null, approverRole: "Finance Manager", secondApproverRole: "Director", slaHours: 6, active: true },
  { id: "POL-008", module: "Budget", minAmount: 0, maxAmount: null, approverRole: "Director", secondApproverRole: "", slaHours: 12, active: true },
  { id: "POL-009", module: "Budget Revision", minAmount: 0, maxAmount: null, approverRole: "Director", secondApproverRole: "", slaHours: 8, active: true },
  { id: "POL-010", module: "Payroll", minAmount: 0, maxAmount: null, approverRole: "Finance Manager", secondApproverRole: "Director", slaHours: 4, active: true },
  { id: "POL-011", module: "GST Return", minAmount: 0, maxAmount: null, approverRole: "Finance Manager", secondApproverRole: "", slaHours: 4, active: true },
  { id: "POL-012", module: "TDS Compliance", minAmount: 0, maxAmount: null, approverRole: "Finance Manager", secondApproverRole: "", slaHours: 4, active: true },
];

type DecisionEvent = {
  at: string;
  actor: string;
  role: string;
  action: string;
  comment: string;
};

type ApprovalRequest = {
  id: string;
  module: typeof modules[number];
  recordId: string;
  amount: number;
  department: string;
  requester: string;
  requesterRole: string;
  currentApproverRole: ApproverRole;
  secondApproverRole: ApproverRole | "";
  approvalLevel: 1 | 2;
  status: typeof approvalStatuses[number];
  risk: "Low" | "Medium" | "High";
  policyId: string;
  budgetStatus: "Within Budget" | "Near Limit" | "Over Budget" | "Not Applicable";
  duplicateCheck: "Clear" | "Review";
  complianceCheck: "Clear" | "Review";
  submittedAt: string;
  dueAt: string;
  summary: string;
  events: DecisionEvent[];
};

const initialQueue: ApprovalRequest[] = [
  {
    id: "APP-2026-901", module: "Quotation", recordId: "QT-2026-043", amount: 320000,
    department: "Sales", requester: "Sales Team", requesterRole: "Sales", currentApproverRole: "Finance Manager",
    secondApproverRole: "", approvalLevel: 1, status: "Pending", risk: "Low", policyId: "POL-001",
    budgetStatus: "Not Applicable", duplicateCheck: "Clear", complianceCheck: "Clear",
    submittedAt: "2026-06-25T05:30:00.000Z", dueAt: "2026-06-25T13:30:00.000Z",
    summary: "Commercial quotation for logistics implementation scope.", events: [],
  },
  {
    id: "APP-2026-902", module: "Expense", recordId: "EXP-2026-423", amount: 65000,
    department: "Marketing", requester: "Marketing Manager", requesterRole: "Marketing", currentApproverRole: "Finance Manager",
    secondApproverRole: "Director", approvalLevel: 1, status: "Pending", risk: "Medium", policyId: "POL-006",
    budgetStatus: "Near Limit", duplicateCheck: "Clear", complianceCheck: "Review",
    submittedAt: "2026-06-25T06:00:00.000Z", dueAt: "2026-06-25T12:00:00.000Z",
    summary: "Campaign event vendor expense with GST document pending review.", events: [],
  },
  {
    id: "APP-2026-903", module: "Payroll", recordId: "SAL-2026-002", amount: 98253.85,
    department: "HR & Admin", requester: "HR Manager", requesterRole: "HR Manager", currentApproverRole: "Director",
    secondApproverRole: "", approvalLevel: 2, status: "In Review", risk: "Low", policyId: "POL-010",
    budgetStatus: "Within Budget", duplicateCheck: "Clear", complianceCheck: "Clear",
    submittedAt: "2026-06-25T04:00:00.000Z", dueAt: "2026-06-25T08:00:00.000Z",
    summary: "June payroll finance review completed; director release pending.", events: [{ at: "2026-06-25T05:00:00.000Z", actor: "Finance Manager", role: "Finance Manager", action: "Level 1 Approved", comment: "Payroll reconciled with HRMS." }],
  },
  {
    id: "APP-2026-904", module: "Credit Note", recordId: "CN-2026-015", amount: 21830,
    department: "Finance", requester: "Accountant", requesterRole: "Accountant", currentApproverRole: "Finance Manager",
    secondApproverRole: "Director", approvalLevel: 1, status: "Clarification Required", risk: "Medium", policyId: "POL-007",
    budgetStatus: "Not Applicable", duplicateCheck: "Clear", complianceCheck: "Review",
    submittedAt: "2026-06-24T10:00:00.000Z", dueAt: "2026-06-24T16:00:00.000Z",
    summary: "Billing correction credit note requires customer dispute evidence.", events: [{ at: "2026-06-24T12:00:00.000Z", actor: "Finance Manager", role: "Finance Manager", action: "Clarification Requested", comment: "Attach client confirmation." }],
  },
  {
    id: "APP-2026-905", module: "GST Return", recordId: "GST-2026-006", amount: 181011.25,
    department: "Finance", requester: "Accountant", requesterRole: "Accountant", currentApproverRole: "Finance Manager",
    secondApproverRole: "", approvalLevel: 1, status: "Pending", risk: "High", policyId: "POL-011",
    budgetStatus: "Not Applicable", duplicateCheck: "Clear", complianceCheck: "Review",
    submittedAt: "2026-06-25T06:30:00.000Z", dueAt: "2026-06-25T10:30:00.000Z",
    summary: "June GSTR-1 and GSTR-3B reconciliation approval.", events: [],
  },
];

const decisionSchema = z.object({
  requestId: z.string().min(1),
  action: z.enum(decisions),
  comment: z.string().trim().min(5, "Audit comment must contain at least 5 characters"),
});

const policySchema = z.object({
  module: z.enum(modules),
  minAmount: z.coerce.number().min(0),
  maxAmount: z.coerce.number().min(0).optional(),
  approverRole: z.enum(["Admin", "Director", "Finance Manager", "Accountant", "HR Manager"]),
  secondApproverRole: z.enum(["", "Admin", "Director", "Finance Manager", "Accountant", "HR Manager"]),
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

export default function Step14Approvals() {
  const { role } = useAuth();
  const currentRole = role as ApproverRole | "Sales";
  const [queue, setQueue] = useState<ApprovalRequest[]>(initialQueue);
  const [policies, setPolicies] = useState<ApprovalPolicy[]>(initialPolicies);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [myQueueOnly, setMyQueueOnly] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showPolicyForm, setShowPolicyForm] = useState(false);
  const [policyMessage, setPolicyMessage] = useState("");
  const [todayTimestamp] = useState(() => Date.now());

  const {
    register, handleSubmit, reset,
    formState: { errors },
  } = useForm<DecisionFormInput, unknown, DecisionFormData>({
    resolver: zodResolver(decisionSchema),
    defaultValues: { requestId: "", action: "Approve", comment: "" },
  });

  const {
    register: registerPolicy, handleSubmit: handlePolicySubmit, reset: resetPolicy,
    formState: { errors: policyErrors },
  } = useForm<PolicyFormInput, unknown, PolicyFormData>({
    resolver: zodResolver(policySchema),
    defaultValues: { module: "Expense", minAmount: 0, maxAmount: undefined, approverRole: "Finance Manager", secondApproverRole: "", slaHours: 8 },
  });

  const canAct = (request: ApprovalRequest) =>
    ["Admin", request.currentApproverRole].includes(currentRole)
    && !["Approved", "Rejected", "Cancelled"].includes(request.status)
    && request.requesterRole !== currentRole;

  const filteredQueue = useMemo(() => queue.filter((request) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch = !query || [request.id, request.module, request.recordId, request.requester, request.department, request.summary].join(" ").toLowerCase().includes(query);
    const matchesStatus = statusFilter === "All" || request.status === statusFilter;
    const matchesModule = moduleFilter === "All" || request.module === moduleFilter;
    const matchesMine = !myQueueOnly || currentRole === "Admin" || request.currentApproverRole === currentRole;
    return matchesSearch && matchesStatus && matchesModule && matchesMine;
  }), [currentRole, moduleFilter, myQueueOnly, queue, searchTerm, statusFilter]);

  const openDecision = (request: ApprovalRequest) => {
    setSelectedRequest(request);
    reset({ requestId: request.id, action: "Approve", comment: "" });
  };

  const processDecision = (data: DecisionFormData) => {
    if (!selectedRequest || !canAct(selectedRequest)) return;
    const now = new Date().toISOString();
    setQueue((current) => current.map((request) => {
      if (request.id !== data.requestId) return request;
      const event: DecisionEvent = {
        at: now,
        actor: "Rajkumar Rathore",
        role: currentRole,
        action: data.action,
        comment: data.comment,
      };
      if (data.action === "Approve" && request.secondApproverRole && request.approvalLevel === 1) {
        return {
          ...request,
          currentApproverRole: request.secondApproverRole,
          secondApproverRole: "",
          approvalLevel: 2,
          status: "Pending",
          events: [...request.events, { ...event, action: "Level 1 Approved" }],
        };
      }
      const status: ApprovalRequest["status"] = data.action === "Approve"
        ? "Approved"
        : data.action === "Reject"
          ? "Rejected"
          : data.action === "Need Clarification"
            ? "Clarification Required"
            : "Hold";
      return { ...request, status, events: [...request.events, event] };
    }));
    setSelectedRequest(null);
  };

  const savePolicy = (data: PolicyFormData) => {
    const maxAmount = data.maxAmount && data.maxAmount > 0 ? data.maxAmount : null;
    const overlaps = policies.some((policy) =>
      policy.active
      && policy.module === data.module
      && data.minAmount <= (policy.maxAmount ?? Infinity)
      && (maxAmount ?? Infinity) >= policy.minAmount,
    );
    if (overlaps) {
      setPolicyMessage("An active policy already overlaps this module and amount range.");
      return;
    }
    const policy: ApprovalPolicy = {
      id: `POL-${String(policies.length + 1).padStart(3, "0")}`,
      module: data.module,
      minAmount: data.minAmount,
      maxAmount,
      approverRole: data.approverRole,
      secondApproverRole: data.secondApproverRole,
      slaHours: data.slaHours,
      active: true,
    };
    setPolicies((current) => [...current, policy]);
    setPolicyMessage("Policy rule added.");
    resetPolicy();
  };

  const bulkApprove = () => {
    const approvable = queue.filter((request) => selectedIds.includes(request.id) && canAct(request) && request.risk === "Low" && request.approvalLevel === 1 && !request.secondApproverRole);
    if (!approvable.length) return;
    const now = new Date().toISOString();
    setQueue((current) => current.map((request) => approvable.some((item) => item.id === request.id) ? {
      ...request,
      status: "Approved",
      events: [...request.events, { at: now, actor: "Rajkumar Rathore", role: currentRole, action: "Bulk Approved", comment: "Low-risk single-level approval." }],
    } : request));
    setSelectedIds([]);
  };

  const exportQueue = () => {
    const rows = [
      ["Approval ID", "Module", "Record", "Amount", "Department", "Requester", "Current Approver", "Level", "Risk", "Budget", "Duplicate", "Compliance", "Status", "Submitted", "Due"],
      ...filteredQueue.map((request) => [
        request.id, request.module, request.recordId, request.amount, request.department,
        request.requester, request.currentApproverRole, request.approvalLevel, request.risk,
        request.budgetStatus, request.duplicateCheck, request.complianceCheck, request.status,
        request.submittedAt, request.dueAt,
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    downloadFile("approval-queue.csv", csv, "text/csv;charset=utf-8");
  };

  const pending = queue.filter((request) => ["Pending", "In Review", "Clarification Required", "Hold"].includes(request.status));
  const overdue = pending.filter((request) => new Date(request.dueAt).getTime() < todayTimestamp).length;
  const highRisk = pending.filter((request) => request.risk === "High").length;
  const rejected = queue.filter((request) => request.status === "Rejected").length;

  return (
    <AccountingPage
      title="Approval Matrix & Workflow"
      description="Route accounting transactions by module, value, role, risk, budget, and compliance controls with permanent decision history."
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

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Pending Action" value={String(pending.length)} helper={`${overdue} SLA overdue`} icon={Clock} tone="amber" />
        <MetricCard label="High Risk" value={String(highRisk)} helper="Compliance attention" icon={AlertTriangle} tone="red" />
        <MetricCard label="Director Queue" value={String(pending.filter((request) => request.currentApproverRole === "Director").length)} helper="Final authority items" icon={UserCheck} tone="purple" />
        <MetricCard label="Rejected" value={String(rejected)} helper="Current local history" icon={ThumbsDown} tone="slate" />
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
              <Field label="Primary Approver" options={["Admin", "Director", "Finance Manager", "Accountant", "HR Manager"]} register={registerPolicy("approverRole")} error={policyErrors.approverRole?.message} />
              <Field label="Second Approver" options={["", "Admin", "Director", "Finance Manager", "Accountant", "HR Manager"]} register={registerPolicy("secondApproverRole")} error={policyErrors.secondApproverRole?.message} />
              <Field label="SLA Hours" type="number" register={registerPolicy("slaHours")} error={policyErrors.slaHours?.message} />
              {policyMessage ? <p className="text-xs font-bold text-slate-500">{policyMessage}</p> : null}
              <ActionButton label="Save Policy" variant="accent" type="submit" />
            </form>
          ) : (
            <div className="max-h-[430px] space-y-3 overflow-y-auto pr-2">
              {policies.filter((policy) => policy.active).map((policy) => (
                <div key={policy.id} className="rounded-xl border border-border p-4">
                  <div className="flex justify-between gap-3"><p className="font-black text-primary">{policy.module}</p><StatusBadge tone="green">Active</StatusBadge></div>
                  <p className="mt-2 text-xs font-semibold text-slate-500">{money(policy.minAmount)} to {policy.maxAmount === null ? "No Limit" : money(policy.maxAmount)}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{policy.approverRole}{policy.secondApproverRole ? ` -> ${policy.secondApproverRole}` : ""} | SLA {policy.slaHours}h</p>
                </div>
              ))}
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
                  <td className="px-4 py-4"><input type="checkbox" checked={selectedIds.includes(request.id)} disabled={!canAct(request) || request.risk !== "Low" || Boolean(request.secondApproverRole)} onChange={(event) => setSelectedIds((current) => event.target.checked ? [...current, request.id] : current.filter((id) => id !== request.id))} /></td>
                  <td className="px-4 py-4"><p className="font-black text-primary">{request.id}</p><p className="text-xs font-semibold text-slate-500">{request.recordId}</p></td>
                  <td className="px-4 py-4"><p className="font-black text-primary">{request.module}</p><p className="text-xs font-semibold text-slate-500">{request.requester} | {request.department}</p></td>
                  <td className="px-4 py-4"><p className="font-black text-primary">{money(request.amount)}</p><p className="text-[11px] font-semibold text-slate-400">{request.budgetStatus} | {request.complianceCheck}</p></td>
                  <td className="px-4 py-4"><p className="font-bold text-slate-600">{request.currentApproverRole}</p><p className="text-[11px] text-slate-400">Level {request.approvalLevel} | {request.risk} risk</p></td>
                  <td className="px-4 py-4"><StatusBadge tone={request.status === "Approved" ? "green" : request.status === "Rejected" ? "red" : request.status === "Clarification Required" || request.status === "Hold" ? "blue" : "amber"}>{request.status}</StatusBadge></td>
                  <td className="px-4 py-4"><button type="button" onClick={() => openDecision(request)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-primary" title="View approval"><Eye size={15} /></button></td>
                </tr>
              ))}
            </DataTable>
          </Panel>
        </div>
      </div>

      {selectedRequest ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl">
            <button type="button" onClick={() => setSelectedRequest(null)} className="absolute right-8 top-8 rounded-full p-2 text-slate-400 hover:bg-slate-50"><X size={24} /></button>
            <div className="border-b border-slate-100 pb-6">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">{selectedRequest.module} | Level {selectedRequest.approvalLevel}</p>
              <h3 className="mt-2 text-2xl font-black text-primary">{selectedRequest.recordId}</h3>
              <p className="mt-2 text-sm font-semibold text-slate-500">{selectedRequest.summary}</p>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {[
                    ["Amount", money(selectedRequest.amount)],
                    ["Requester", `${selectedRequest.requester} (${selectedRequest.requesterRole})`],
                    ["Budget Check", selectedRequest.budgetStatus],
                    ["Duplicate Check", selectedRequest.duplicateCheck],
                    ["Compliance", selectedRequest.complianceCheck],
                    ["SLA Due", new Date(selectedRequest.dueAt).toLocaleString("en-IN")],
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
                    <ActionButton icon={ThumbsUp} label="Submit Decision" variant="accent" type="submit" />
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

"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ArrowRight, CheckCircle2, Download, Eye, FileClock,
  Fingerprint, Flag, History, LockKeyhole, Search, ShieldAlert, ShieldCheck,
  Terminal, User, X,
} from "lucide-react";
import {
  AccountingPage, ActionButton, DataTable, Field,
  MetricCard, Panel, StatusBadge, WorkflowSteps,
} from "./AccountingComponents";

const modules = ["Client", "Vendor", "Quotation", "Invoice", "Payment", "Reminder", "Credit Note", "Expense", "Budget", "Payroll", "GST", "TDS", "Report", "Approval", "Access", "Bank"] as const;
const actions = ["Created", "Updated", "Submitted", "Approved", "Rejected", "Paid", "Filed", "Deposited", "Archived", "Restored", "Login", "Permission Changed"] as const;
const severities = ["Info", "Review", "Critical"] as const;
const investigationStatuses = ["Clear", "Flagged", "Investigating", "Resolved"] as const;

type Snapshot = Record<string, string | number | boolean | null>;

type AuditEvent = {
  id: string;
  sequence: number;
  actorId: string;
  actorName: string;
  actorRole: string;
  module: typeof modules[number];
  action: typeof actions[number];
  recordId: string;
  requestId: string;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  before: Snapshot;
  after: Snapshot;
  changedFields: string[];
  reason: string;
  severity: typeof severities[number];
  investigationStatus: typeof investigationStatuses[number];
  investigationNote: string;
  previousHash: string;
  hash: string;
};

function stableSnapshot(value: Snapshot) {
  return Object.keys(value).sort().map((key) => `${key}:${String(value[key])}`).join("|");
}

function hashText(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function eventHash(event: Omit<AuditEvent, "hash">) {
  return hashText([
    event.id, event.sequence, event.actorId, event.actorName, event.actorRole,
    event.module, event.action, event.recordId, event.requestId, event.sessionId,
    event.ipAddress, event.userAgent, event.timestamp,
    stableSnapshot(event.before), stableSnapshot(event.after),
    event.changedFields.join("|"), event.reason, event.severity, event.previousHash,
  ].join("::"));
}

const rawEvents: Array<Omit<AuditEvent, "previousHash" | "hash">> = [
  {
    id: "LOG-2026-9001", sequence: 1, actorId: "USR-010", actorName: "Rajkumar Rathore", actorRole: "Finance Manager",
    module: "Invoice", action: "Approved", recordId: "INV-2026-088", requestId: "REQ-INV-088",
    sessionId: "SES-A1B2", ipAddress: "103.87.44.12", userAgent: "Chrome 126 / Windows 11",
    timestamp: "2026-06-11T10:14:00.000Z", before: { status: "Pending Approval" }, after: { status: "Approved" },
    changedFields: ["status"], reason: "Commercial and tax validation completed.", severity: "Info", investigationStatus: "Clear", investigationNote: "",
  },
  {
    id: "LOG-2026-9002", sequence: 2, actorId: "USR-022", actorName: "Sunita Sharma", actorRole: "HR Manager",
    module: "Payroll", action: "Updated", recordId: "SAL-2026-002", requestId: "REQ-SAL-002",
    sessionId: "SES-C3D4", ipAddress: "103.87.44.18", userAgent: "Edge 126 / Windows 11",
    timestamp: "2026-06-11T10:28:00.000Z", before: { tds: 12000, netPayable: 101200 }, after: { tds: 13400, netPayable: 99800 },
    changedFields: ["tds", "netPayable"], reason: "Employee tax declaration reconciliation.", severity: "Review", investigationStatus: "Clear", investigationNote: "",
  },
  {
    id: "LOG-2026-9003", sequence: 3, actorId: "USR-010", actorName: "Rajkumar Rathore", actorRole: "Finance Manager",
    module: "Expense", action: "Rejected", recordId: "EXP-2026-424", requestId: "APP-2026-902",
    sessionId: "SES-A1B2", ipAddress: "103.87.44.12", userAgent: "Chrome 126 / Windows 11",
    timestamp: "2026-06-11T11:02:00.000Z", before: { status: "Pending", amount: 65000 }, after: { status: "Review Required", amount: 65000 },
    changedFields: ["status"], reason: "Vendor GST document missing.", severity: "Review", investigationStatus: "Flagged", investigationNote: "Awaiting supporting invoice.",
  },
  {
    id: "LOG-2026-9004", sequence: 4, actorId: "USR-031", actorName: "Amit Accountant", actorRole: "Accountant",
    module: "Client", action: "Created", recordId: "CL-24005", requestId: "REQ-CL-24005",
    sessionId: "SES-E5F6", ipAddress: "103.87.44.16", userAgent: "Chrome 126 / macOS 15",
    timestamp: "2026-06-11T11:45:00.000Z", before: {}, after: { name: "New Client Pvt Ltd", status: "Active", gstin: "27ABCDE1234F1Z5" },
    changedFields: ["name", "status", "gstin"], reason: "New client onboarding.", severity: "Info", investigationStatus: "Clear", investigationNote: "",
  },
  {
    id: "LOG-2026-9005", sequence: 5, actorId: "USR-001", actorName: "System Admin", actorRole: "Admin",
    module: "Access", action: "Permission Changed", recordId: "ROLE-ACCOUNTANT", requestId: "REQ-ACL-005",
    sessionId: "SES-ADMIN", ipAddress: "10.0.0.5", userAgent: "Chrome 126 / Windows Server",
    timestamp: "2026-06-12T09:00:00.000Z", before: { canDeleteExpense: false }, after: { canDeleteExpense: true },
    changedFields: ["canDeleteExpense"], reason: "Temporary month-end access.", severity: "Critical", investigationStatus: "Investigating", investigationNote: "Validate approval evidence and expiry.",
  },
];

function buildChain(events: typeof rawEvents): AuditEvent[] {
  let previousHash = "GENESIS";
  return events.map((event) => {
    const withoutHash = { ...event, previousHash };
    const hash = eventHash(withoutHash);
    previousHash = hash;
    return { ...withoutHash, hash };
  });
}

const initialLogs = buildChain(rawEvents);

const filterSchema = z.object({
  query: z.string().optional(),
  module: z.enum(["All", ...modules]),
  action: z.enum(["All", ...actions]),
  severity: z.enum(["All", ...severities]),
  investigationStatus: z.enum(["All", ...investigationStatuses]),
  actorRole: z.string(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.fromDate && data.toDate && data.toDate < data.fromDate) {
    ctx.addIssue({ code: "custom", path: ["toDate"], message: "End date cannot be before start date" });
  }
});

const investigationSchema = z.object({
  status: z.enum(investigationStatuses),
  note: z.string().trim(),
}).superRefine((data, ctx) => {
  if (data.status !== "Clear" && data.note.length < 5) {
    ctx.addIssue({ code: "custom", path: ["note"], message: "Investigation note required" });
  }
});

type FilterFormInput = z.input<typeof filterSchema>;
type FilterFormData = z.output<typeof filterSchema>;
type InvestigationFormInput = z.input<typeof investigationSchema>;
type InvestigationFormData = z.output<typeof investigationSchema>;

function verifyChain(events: AuditEvent[]) {
  let previousHash = "GENESIS";
  for (const event of [...events].sort((a, b) => a.sequence - b.sequence)) {
    if (event.previousHash !== previousHash) return false;
    const { hash, ...withoutHash } = event;
    if (eventHash(withoutHash) !== hash) return false;
    previousHash = hash;
  }
  return true;
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

export default function Step15AuditLogs() {
  const [logs, setLogs] = useState<AuditEvent[]>(initialLogs);
  const [selectedLog, setSelectedLog] = useState<AuditEvent | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<FilterFormData>({
    query: "", module: "All", action: "All", severity: "All",
    investigationStatus: "All", actorRole: "All", fromDate: "", toDate: "",
  });

  const {
    register, handleSubmit, reset,
    formState: { errors },
  } = useForm<FilterFormInput, unknown, FilterFormData>({
    resolver: zodResolver(filterSchema),
    defaultValues: appliedFilters,
  });

  const {
    register: registerInvestigation, handleSubmit: handleInvestigationSubmit, reset: resetInvestigation,
    formState: { errors: investigationErrors },
  } = useForm<InvestigationFormInput, unknown, InvestigationFormData>({
    resolver: zodResolver(investigationSchema),
    defaultValues: { status: "Investigating", note: "" },
  });

  const chainValid = useMemo(() => verifyChain(logs), [logs]);
  const filteredLogs = useMemo(() => logs.filter((log) => {
    const query = appliedFilters.query?.trim().toLowerCase() ?? "";
    const matchesQuery = !query || [
      log.id, log.actorId, log.actorName, log.actorRole, log.module, log.action,
      log.recordId, log.requestId, log.sessionId, log.ipAddress, log.reason, log.hash,
    ].join(" ").toLowerCase().includes(query);
    const matchesModule = appliedFilters.module === "All" || log.module === appliedFilters.module;
    const matchesAction = appliedFilters.action === "All" || log.action === appliedFilters.action;
    const matchesSeverity = appliedFilters.severity === "All" || log.severity === appliedFilters.severity;
    const matchesInvestigation = appliedFilters.investigationStatus === "All" || log.investigationStatus === appliedFilters.investigationStatus;
    const matchesRole = appliedFilters.actorRole === "All" || log.actorRole === appliedFilters.actorRole;
    const date = log.timestamp.slice(0, 10);
    const matchesFrom = !appliedFilters.fromDate || date >= appliedFilters.fromDate;
    const matchesTo = !appliedFilters.toDate || date <= appliedFilters.toDate;
    return matchesQuery && matchesModule && matchesAction && matchesSeverity && matchesInvestigation && matchesRole && matchesFrom && matchesTo;
  }), [appliedFilters, logs]);

  const applyFilters = (data: FilterFormData) => {
    setAppliedFilters(data);
    setShowFilters(false);
  };

  const clearFilters = () => {
    const clear: FilterFormData = { query: "", module: "All", action: "All", severity: "All", investigationStatus: "All", actorRole: "All", fromDate: "", toDate: "" };
    reset(clear);
    setAppliedFilters(clear);
  };

  const openLog = (log: AuditEvent) => {
    setSelectedLog(log);
    resetInvestigation({ status: log.investigationStatus, note: log.investigationNote || "" });
  };

  const updateInvestigation = (data: InvestigationFormData) => {
    if (!selectedLog) return;
    setLogs((current) => current.map((log) => log.id === selectedLog.id ? {
      ...log,
      investigationStatus: data.status,
      investigationNote: data.note,
    } : log));
    setSelectedLog((current) => current ? { ...current, investigationStatus: data.status, investigationNote: data.note } : current);
  };

  const exportCsv = () => {
    const rows = [
      ["Sequence", "Log ID", "Timestamp", "Actor ID", "Actor", "Role", "Module", "Action", "Record", "Request", "Session", "IP", "Changed Fields", "Reason", "Severity", "Investigation", "Previous Hash", "Hash"],
      ...filteredLogs.map((log) => [
        log.sequence, log.id, log.timestamp, log.actorId, log.actorName, log.actorRole,
        log.module, log.action, log.recordId, log.requestId, log.sessionId, log.ipAddress,
        log.changedFields.join("|"), log.reason, log.severity, log.investigationStatus,
        log.previousHash, log.hash,
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    downloadFile("accounting-audit-log.csv", csv, "text/csv;charset=utf-8");
  };

  const exportJson = () => {
    downloadFile("accounting-audit-forensic.json", JSON.stringify(filteredLogs, null, 2), "application/json;charset=utf-8");
  };

  const flagged = logs.filter((log) => ["Flagged", "Investigating"].includes(log.investigationStatus)).length;
  const critical = logs.filter((log) => log.severity === "Critical").length;
  const uniqueSessions = new Set(logs.map((log) => log.sessionId)).size;

  return (
    <AccountingPage
      title="Security & Activity Audit Logs"
      description="Append-only financial event history with actor identity, structured changes, session metadata, hash-chain integrity, and investigation tracking."
      icon={History}
      badge="Forensic audit"
      actions={
        <>
          <ActionButton icon={Download} label="Export CSV" variant="outline" onClick={exportCsv} />
          <ActionButton icon={Download} label="Forensic JSON" variant="accent" onClick={exportJson} />
        </>
      }
    >
      <WorkflowSteps steps={["Event Capture", "Identity Metadata", "Hash Chain", "Investigation", "Forensic Export"]} />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Logs Captured" value={String(logs.length)} helper={`${uniqueSessions} authenticated sessions`} icon={FileClock} tone="blue" />
        <MetricCard label="Chain Integrity" value={chainValid ? "Verified" : "Broken"} helper="Deterministic append-order check" icon={Fingerprint} tone={chainValid ? "green" : "red"} />
        <MetricCard label="Flagged Events" value={String(flagged)} helper="Open investigation queue" icon={Flag} tone="amber" />
        <MetricCard label="Critical Events" value={String(critical)} helper="Privileged or sensitive changes" icon={ShieldAlert} tone="red" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title="Forensic Filters" description="Search identity, record, request, session, IP, reason, or hash.">
          <div className="mb-4 flex justify-end"><ActionButton label={showFilters ? "Hide Filters" : "Show Filters"} variant="outline" onClick={() => setShowFilters((value) => !value)} /></div>
          {showFilters ? (
            <form onSubmit={handleSubmit(applyFilters)} className="space-y-4">
              <Field label="Search" placeholder="Record, IP, actor, session, hash..." register={register("query")} />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Field label="Module" options={["All", ...modules]} register={register("module")} />
                <Field label="Action" options={["All", ...actions]} register={register("action")} />
                <Field label="Severity" options={["All", ...severities]} register={register("severity")} />
                <Field label="Investigation" options={["All", ...investigationStatuses]} register={register("investigationStatus")} />
                <Field label="Actor Role" options={["All", "Admin", "Director", "Finance Manager", "Accountant", "HR Manager", "Sales"]} register={register("actorRole")} />
                <Field label="From Date" type="date" register={register("fromDate")} />
                <Field label="To Date" type="date" register={register("toDate")} error={errors.toDate?.message} />
              </div>
              <div className="flex gap-3"><ActionButton label="Apply Filters" variant="accent" type="submit" /><ActionButton label="Clear" variant="outline" onClick={clearFilters} /></div>
            </form>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={15} />
              <input value={appliedFilters.query ?? ""} onChange={(event) => setAppliedFilters((current) => ({ ...current, query: event.target.value }))} placeholder="Quick search audit stream..." className="h-11 w-full rounded-xl border border-border bg-white pl-10 pr-3 text-sm font-semibold text-primary outline-none" />
            </div>
          )}
        </Panel>

        <Panel title="Audit Controls" description="Current frontend integrity and retention model.">
          <div className="space-y-4">
            <div className="flex gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4"><Terminal size={18} className="mt-1 shrink-0 text-primary" /><div><p className="text-xs font-black uppercase tracking-widest text-primary">Structured Events</p><p className="mt-1 text-[11px] font-semibold leading-5 text-slate-500">Before/after snapshots, changed fields, actor, role, request, session, IP, and device metadata.</p></div></div>
            <div className="flex gap-4 rounded-xl border border-blue-100 bg-blue-50 p-4"><LockKeyhole size={18} className="mt-1 shrink-0 text-blue-600" /><div><p className="text-xs font-black uppercase tracking-widest text-blue-900">Append-Only Intent</p><p className="mt-1 text-[11px] font-semibold leading-5 text-blue-700">No delete/edit controls exist for event facts. Investigation metadata is maintained separately.</p></div></div>
            <div className={`flex gap-4 rounded-xl border p-4 ${chainValid ? "border-emerald-100 bg-emerald-50" : "border-red-100 bg-red-50"}`}><ShieldCheck size={18} className={`mt-1 shrink-0 ${chainValid ? "text-emerald-600" : "text-red-600"}`} /><div><p className="text-xs font-black uppercase tracking-widest text-primary">Hash Chain</p><p className="mt-1 text-[11px] font-semibold text-slate-600">{chainValid ? "Sequence and previous-hash links verify." : "Integrity mismatch detected."}</p></div></div>
          </div>
        </Panel>
      </div>

      <Panel title="Live Activity Stream" description={`${filteredLogs.length} events match the current forensic scope.`}>
        <DataTable columns={["Sequence / Actor", "Module / Action", "Record / Request", "Change", "Session / IP", "Severity / Investigation", "Timestamp", "Detail"]}>
          {filteredLogs.map((log) => (
            <tr key={log.id} className="text-sm hover:bg-slate-50">
              <td className="px-4 py-4"><div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400"><User size={14} /></div><div><p className="font-black text-primary">#{log.sequence} {log.actorName}</p><p className="text-[11px] font-semibold text-slate-400">{log.actorId} | {log.actorRole}</p></div></div></td>
              <td className="px-4 py-4"><p className="font-black text-primary">{log.module}</p><StatusBadge tone={log.action === "Rejected" ? "red" : log.action === "Approved" || log.action === "Filed" || log.action === "Paid" ? "green" : "blue"}>{log.action}</StatusBadge></td>
              <td className="px-4 py-4"><p className="font-black text-primary">{log.recordId}</p><p className="text-[11px] font-semibold text-slate-400">{log.requestId}</p></td>
              <td className="px-4 py-4"><p className="max-w-[220px] truncate text-xs font-semibold text-slate-600">{log.changedFields.join(", ") || "No field diff"}</p><p className="mt-1 max-w-[220px] truncate text-[11px] text-slate-400">{log.reason}</p></td>
              <td className="px-4 py-4"><p className="font-mono text-[11px] text-slate-600">{log.sessionId}</p><p className="font-mono text-[10px] text-slate-400">{log.ipAddress}</p></td>
              <td className="px-4 py-4"><StatusBadge tone={log.severity === "Critical" ? "red" : log.severity === "Review" ? "amber" : "blue"}>{log.severity}</StatusBadge><p className="mt-2 text-[10px] font-bold text-slate-500">{log.investigationStatus}</p></td>
              <td className="px-4 py-4 text-xs font-semibold text-slate-600">{new Date(log.timestamp).toLocaleString("en-IN")}</td>
              <td className="px-4 py-4"><button type="button" onClick={() => openLog(log)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-primary" title="View audit event"><Eye size={15} /></button></td>
            </tr>
          ))}
        </DataTable>
      </Panel>

      {selectedLog ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl">
            <button type="button" onClick={() => setSelectedLog(null)} className="absolute right-8 top-8 rounded-full p-2 text-slate-400 hover:bg-slate-50"><X size={24} /></button>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Audit Event #{selectedLog.sequence}</p>
            <h3 className="mt-2 text-2xl font-black text-primary">{selectedLog.id}</h3>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                ["Actor", `${selectedLog.actorName} (${selectedLog.actorRole})`],
                ["Session / IP", `${selectedLog.sessionId} / ${selectedLog.ipAddress}`],
                ["Record", `${selectedLog.module} / ${selectedLog.recordId}`],
              ].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-4"><p className="text-[10px] font-black uppercase text-slate-400">{label}</p><p className="mt-1 text-sm font-black text-primary">{value}</p></div>)}
            </div>
            <div className="mt-6 grid grid-cols-1 items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
              <div className="rounded-xl border border-slate-100 p-4"><p className="text-xs font-black uppercase text-slate-400">Before</p><pre className="mt-3 overflow-x-auto text-xs text-slate-600">{JSON.stringify(selectedLog.before, null, 2)}</pre></div>
              <ArrowRight className="mx-auto text-slate-300" />
              <div className="rounded-xl border border-emerald-100 p-4"><p className="text-xs font-black uppercase text-emerald-500">After</p><pre className="mt-3 overflow-x-auto text-xs text-emerald-700">{JSON.stringify(selectedLog.after, null, 2)}</pre></div>
            </div>
            <div className="mt-6 rounded-xl bg-slate-900 p-4 text-white"><p className="text-[10px] font-black uppercase tracking-widest text-white/50">Integrity</p><p className="mt-2 break-all font-mono text-xs">Previous: {selectedLog.previousHash}</p><p className="mt-1 break-all font-mono text-xs">Hash: {selectedLog.hash}</p></div>
            <form onSubmit={handleInvestigationSubmit(updateInvestigation)} className="mt-6 space-y-4">
              <h4 className="text-sm font-black uppercase tracking-widest text-primary">Investigation Metadata</h4>
              <Field label="Status" options={[...investigationStatuses]} register={registerInvestigation("status")} error={investigationErrors.status?.message} />
              <Field label="Investigation Note" multiline register={registerInvestigation("note")} error={investigationErrors.note?.message} />
              <ActionButton icon={CheckCircle2} label="Update Investigation" variant="accent" type="submit" />
            </form>
          </div>
        </div>
      ) : null}
    </AccountingPage>
  );
}

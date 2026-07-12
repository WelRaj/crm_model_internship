"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, Filter, Save, Search, XCircle } from "lucide-react";
import {
  listFollowUps,
  saveLeadOutcome,
  type LeadFollowUpRecord,
  type LeadRecord,
} from "@/services/leads-api";

type OutcomeFilter = "All" | "Final" | "Not Final" | "Ready";
type ClosureStatus = "qualified" | "proposal" | "won" | "lost";

type OutcomeDraft = {
  status: ClosureStatus;
  note: string;
};

type OutcomeRow = {
  id: string;
  backendId: string;
  name: string;
  type: "Project" | "Trading";
  source: string;
  telecaller: string;
  status: LeadRecord["status"];
  outcome: OutcomeFilter;
  reason: string;
  nextStep: string;
  value: number;
  lastConversation: string;
};

const filters: OutcomeFilter[] = ["All", "Final", "Not Final", "Ready"];
const closureOptions: Array<{ value: ClosureStatus; label: string }> = [
  { value: "qualified", label: "Qualified" },
  { value: "proposal", label: "Proposal" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

function money(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function statusLabel(status: LeadRecord["status"]) {
  if (status === "new") return "New";
  if (status === "contacted") return "Contacted";
  if (status === "qualified") return "Qualified";
  if (status === "proposal") return "Proposal";
  if (status === "won") return "Won";
  return "Lost";
}

function outcomeForStatus(status: LeadRecord["status"]): OutcomeFilter {
  if (status === "won") return "Final";
  if (status === "lost") return "Not Final";
  return "Ready";
}

function leadToRow(lead: LeadRecord, followUp?: LeadFollowUpRecord): OutcomeRow {
  const outcome = outcomeForStatus(lead.status);
  return {
    id: lead.lead_number,
    backendId: lead.id,
    name: lead.contact_name || "Unnamed Lead",
    type: lead.lead_type === "project" ? "Project" : "Trading",
    source: lead.source || "Direct",
    telecaller: lead.assigned_to?.full_name || lead.assigned_to?.email || "Unassigned",
    status: lead.status,
    outcome,
    reason:
      outcome === "Final"
        ? "Customer confirmed closure."
        : outcome === "Not Final"
          ? "Lead closed as lost or not final."
          : "Follow-up completed. Awaiting final outcome decision.",
    nextStep:
      lead.status === "won" && lead.lead_type === "project"
        ? "Open Project Clients to continue handoff"
        : lead.status === "won"
          ? "Close calling task"
          : lead.status === "lost"
            ? "Archive with loss reason"
            : "Update outcome after next conversation",
    value: Number(lead.estimated_value || 0),
    lastConversation: followUp?.note || lead.requirement_summary || "Follow-up completed from queue.",
  };
}

function outcomeTone(outcome: OutcomeFilter) {
  if (outcome === "Final") return "border-emerald-100 bg-emerald-50 text-emerald-700";
  if (outcome === "Not Final") return "border-rose-100 bg-rose-50 text-rose-700";
  return "border-amber-100 bg-amber-50 text-amber-700";
}

function latestDoneRows(followUps: LeadFollowUpRecord[]) {
  const byLead = new Map<string, LeadFollowUpRecord>();
  followUps.forEach((item) => {
    const lead = item.lead_detail;
    if (!lead || item.outcome !== "done") return;
    const current = byLead.get(lead.id);
    if (!current || new Date(item.created_at).getTime() > new Date(current.created_at).getTime()) {
      byLead.set(lead.id, item);
    }
  });
  return Array.from(byLead.values()).map((item) => leadToRow(item.lead_detail as LeadRecord, item));
}

export default function LeadOutcomes() {
  const [activeFilter, setActiveFilter] = useState<OutcomeFilter>("All");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<OutcomeRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, OutcomeDraft>>({});
  const [savingId, setSavingId] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadOutcomes = async () => {
      try {
        const response = await listFollowUps({ due_status: "done" });
        if (!isMounted) return;
        const nextRows = latestDoneRows(response);
        setRows(nextRows);
        setDrafts(
          Object.fromEntries(
            nextRows.map((row) => [
              row.backendId,
              {
                status: row.status === "won" || row.status === "lost" || row.status === "proposal" || row.status === "qualified" ? row.status : "qualified",
                note: "",
              },
            ]),
          ),
        );
      } catch (error) {
        if (isMounted) setMessage(error instanceof Error ? error.message : "Unable to load confirmed follow-up outcomes.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    const timer = window.setTimeout(loadOutcomes, 0);
    return () => {
      isMounted = false;
      window.clearTimeout(timer);
    };
  }, []);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesFilter = activeFilter === "All" || row.outcome === activeFilter;
      const matchesSearch =
        !query ||
        row.id.toLowerCase().includes(query) ||
        row.name.toLowerCase().includes(query) ||
        row.telecaller.toLowerCase().includes(query) ||
        row.source.toLowerCase().includes(query) ||
        statusLabel(row.status).toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, rows, search]);

  const summary = useMemo(
    () => ({
      final: rows.filter((row) => row.outcome === "Final").length,
      notFinal: rows.filter((row) => row.outcome === "Not Final").length,
      open: rows.filter((row) => row.outcome === "Ready").length,
      value: rows.filter((row) => row.outcome === "Final").reduce((total, row) => total + row.value, 0),
    }),
    [rows],
  );

  const updateDraft = (leadId: string, patch: Partial<OutcomeDraft>) => {
    setDrafts((current) => ({
      ...current,
      [leadId]: { ...(current[leadId] || { status: "qualified", note: "" }), ...patch },
    }));
  };

  const saveOutcome = async (row: OutcomeRow) => {
    const draft = drafts[row.backendId];
    if (!draft) return;
    const note = draft.note.trim();
    if ((draft.status === "won" || draft.status === "lost") && note.length < 10) {
      setMessage("Won/Lost outcome ke liye kam se kam 10 character ka reason/note required hai.");
      return;
    }

    setSavingId(row.backendId);
    setMessage("");
    try {
      const updatedLead = await saveLeadOutcome(row.backendId, { status: draft.status, note });
      setRows((current) => current.map((item) => (item.backendId === row.backendId ? leadToRow(updatedLead) : item)));
      updateDraft(row.backendId, { status: draft.status, note: "" });
      setMessage(draft.status === "won" && row.type === "Project" ? "Outcome saved. Project lead ab Project Clients me sync ho jayegi." : "Lead outcome saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save lead outcome.");
    } finally {
      setSavingId("");
    }
  };

  const exportRows = () => {
    const header = ["Lead ID", "Name", "Type", "Source", "Calling Owner", "Status", "Outcome", "Reason", "Next Step", "Value"];
    const csvRows = filteredRows.map((row) =>
      [row.id, row.name, row.type, row.source, row.telecaller, statusLabel(row.status), row.outcome, row.reason, row.nextStep, row.value]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[header.join(","), ...csvRows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "lead-outcomes.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">After Conversation Result</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-primary">Lead Outcomes</h2>
          <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-secondary">
            Final decisions are saved to backend lead status and follow-up history. Won project leads continue into Project Clients.
          </p>
        </div>
        <button onClick={exportRows} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-widest text-primary shadow-sm hover:border-primary">
          <Download size={16} /> Export
        </button>
      </div>

      {isLoading ? <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-black text-blue-700">Loading backend lead outcomes...</div> : null}
      {message ? <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-black text-slate-600">{message}</div> : null}

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Final Leads", value: summary.final, detail: money(summary.value), icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-700" },
          { label: "Not Final", value: summary.notFinal, detail: "Lost / not interested", icon: XCircle, tone: "bg-rose-50 text-rose-700" },
          { label: "Ready Decisions", value: summary.open, detail: "From done follow-ups", icon: Filter, tone: "bg-amber-50 text-amber-700" },
          { label: "Total Reviewed", value: rows.length, detail: "Confirmed follow-ups", icon: CheckCircle2, tone: "bg-blue-50 text-blue-700" },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
                <p className="mt-2 text-3xl font-black text-primary">{item.value}</p>
                <p className="mt-1 text-xs font-bold text-secondary">{item.detail}</p>
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.tone}`}>
                <item.icon size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-border bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest transition-all ${
                  activeFilter === filter ? "bg-primary text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}
              >
                <Filter size={14} /> {filter}
              </button>
            ))}
          </div>
          <div className="relative w-full xl:max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search lead, calling owner, source..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold outline-none focus:border-primary focus:bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1320px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {["Lead", "Type", "Calling Owner", "Current", "Outcome", "Conversation", "Next Step", "Value", "Update Outcome"].map((head) => (
                  <th key={head} className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRows.map((row) => {
                const draft = drafts[row.backendId] || { status: "qualified", note: "" };
                return (
                  <tr key={row.backendId} className="hover:bg-slate-50/60">
                    <td className="px-5 py-4">
                      <p className="text-sm font-black text-primary">{row.name}</p>
                      <p className="mt-1 text-xs font-bold text-slate-400">{row.id} . {row.source}</p>
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-secondary">{row.type}</td>
                    <td className="px-5 py-4 text-sm font-bold text-secondary">{row.telecaller}</td>
                    <td className="px-5 py-4 text-sm font-bold text-secondary">{statusLabel(row.status)}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${outcomeTone(row.outcome)}`}>
                        {row.outcome}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-secondary">{row.lastConversation}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-400">{row.reason}</p>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-secondary">{row.nextStep}</td>
                    <td className="px-5 py-4 text-sm font-black text-primary">{money(row.value)}</td>
                    <td className="px-5 py-4">
                      <div className="grid w-[23rem] gap-2">
                        <select
                          value={draft.status}
                          onChange={(event) => updateDraft(row.backendId, { status: event.target.value as ClosureStatus })}
                          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black uppercase tracking-widest text-primary outline-none focus:border-primary"
                        >
                          {closureOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                        <div className="flex gap-2">
                          <input
                            value={draft.note}
                            onChange={(event) => updateDraft(row.backendId, { note: event.target.value })}
                            placeholder="Outcome note / loss reason..."
                            className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-xs font-semibold outline-none focus:border-primary"
                          />
                          <button
                            type="button"
                            onClick={() => saveOutcome(row)}
                            disabled={savingId === row.backendId}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-3 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-60"
                          >
                            <Save size={13} /> {savingId === row.backendId ? "Saving" : "Save"}
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!isLoading && filteredRows.length === 0 ? (
            <div className="p-8 text-center text-sm font-black uppercase tracking-widest text-slate-400">No confirmed follow-ups found</div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

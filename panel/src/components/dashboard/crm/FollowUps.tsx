"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, Clock, Download, MessageCircle, PhoneCall, Search } from "lucide-react";
import { createLeadFollowUp, listFollowUps, type LeadFollowUpRecord } from "@/services/leads-api";

type FollowUpStatus = "Due Today" | "Overdue" | "Scheduled" | "Done" | "No Date";
type LeadType = "Project" | "Trading";

type FollowUpRow = {
  id: string;
  backendLeadId: string;
  leadId: string;
  leadType: LeadType;
  client: string;
  phone: string;
  source: string;
  telecaller: string;
  status: FollowUpStatus;
  date: string;
  time: string;
  lastOutcome: string;
  callNote: string;
  nextAction: string;
  priority: "High" | "Medium" | "Low";
};

const statusFilters: Array<"All" | FollowUpStatus> = ["All", "Due Today", "Overdue", "Scheduled", "No Date", "Done"];

function formatDate(value?: string | null) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value));
}

function formatTime(value?: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-IN", { timeStyle: "short" }).format(new Date(value));
}

function statusFor(item: LeadFollowUpRecord): FollowUpStatus {
  if (item.outcome === "done") return "Done";
  if (!item.next_follow_up_at) return "No Date";

  const today = new Date();
  const due = new Date(item.next_follow_up_at);
  const todayKey = today.toISOString().slice(0, 10);
  const dueKey = due.toISOString().slice(0, 10);

  if (dueKey < todayKey) return "Overdue";
  if (dueKey === todayKey) return "Due Today";
  return "Scheduled";
}

function rowFromFollowUp(item: LeadFollowUpRecord): FollowUpRow | null {
  const lead = item.lead_detail;
  if (!lead) return null;
  const status = statusFor(item);
  return {
    id: item.id,
    backendLeadId: lead.id,
    leadId: lead.lead_number,
    leadType: lead.lead_type === "project" ? "Project" : "Trading",
    client: lead.contact_name || "Unnamed Lead",
    phone: lead.mobile,
    source: lead.source || "Direct",
    telecaller: lead.assigned_to?.full_name || lead.assigned_to?.email || "Unassigned",
    status,
    date: formatDate(item.next_follow_up_at),
    time: formatTime(item.next_follow_up_at),
    lastOutcome: item.outcome.replace("_", " "),
    callNote: item.note,
    nextAction: status === "Done" ? "Review in Lead Outcomes" : "Call customer and update next follow-up",
    priority: status === "Overdue" ? "High" : status === "Due Today" ? "Medium" : "Low",
  };
}

function statusTone(status: FollowUpStatus) {
  if (status === "Done") return "border-emerald-100 bg-emerald-50 text-emerald-700";
  if (status === "Overdue") return "border-rose-100 bg-rose-50 text-rose-700";
  if (status === "Due Today") return "border-amber-100 bg-amber-50 text-amber-700";
  if (status === "No Date") return "border-slate-200 bg-slate-100 text-slate-600";
  return "border-blue-100 bg-blue-50 text-blue-700";
}

function priorityDot(priority: FollowUpRow["priority"]) {
  if (priority === "High") return "bg-rose-500";
  if (priority === "Medium") return "bg-amber-500";
  return "bg-emerald-500";
}

export default function FollowUps() {
  const [rows, setRows] = useState<FollowUpRow[]>([]);
  const [filter, setFilter] = useState<"All" | FollowUpStatus>("Due Today");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [note, setNote] = useState("");
  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadRows = async () => {
    try {
      const response = await listFollowUps();
      const nextRows = response.map(rowFromFollowUp).filter((row): row is FollowUpRow => Boolean(row));
      setRows(nextRows);
      setSelectedId((current) => current || nextRows[0]?.id || "");
      setApiError("");
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Unable to load follow-ups.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadRows();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const selected = rows.find((row) => row.id === selectedId) || rows[0];

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesFilter = filter === "All" || row.status === filter;
      const matchesSearch =
        !query ||
        row.leadId.toLowerCase().includes(query) ||
        row.client.toLowerCase().includes(query) ||
        row.phone.includes(query) ||
        row.telecaller.toLowerCase().includes(query) ||
        row.source.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [filter, rows, search]);

  const metrics = useMemo(
    () => ({
      due: rows.filter((row) => row.status === "Due Today").length,
      overdue: rows.filter((row) => row.status === "Overdue").length,
      scheduled: rows.filter((row) => row.status === "Scheduled").length,
      done: rows.filter((row) => row.status === "Done").length,
    }),
    [rows],
  );

  const saveQuickLog = async () => {
    if (!selected) return;
    setIsSaving(true);
    try {
      await createLeadFollowUp(selected.backendLeadId, {
        channel: "call",
        outcome: "done",
        note: note.trim() || "Follow-up completed from Follow-ups queue.",
        next_follow_up_at: null,
      });
      setNote("");
      await loadRows();
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Unable to save follow-up log.");
    } finally {
      setIsSaving(false);
    }
  };

  const exportRows = () => {
    const header = ["Follow-up ID", "Lead ID", "Client", "Type", "Calling Owner", "Follow-up Status", "Date", "Time", "Outcome", "Note", "Next Action"];
    const csvRows = filteredRows.map((row) =>
      [row.id, row.leadId, row.client, row.leadType, row.telecaller, row.status, row.date, row.time, row.lastOutcome, row.callNote, row.nextAction]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[header.join(","), ...csvRows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "backend-followups.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Follow-up Queue</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-primary">Follow-ups</h2>
          <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-secondary">
            Backend callbacks, issue checks, proposal confirmations, and pending conversations from Calling Desk updates.
          </p>
        </div>
        <button onClick={exportRows} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-widest text-primary shadow-sm hover:border-primary">
          <Download size={16} /> Export
        </button>
      </div>

      {apiError ? <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{apiError}</div> : null}
      {isLoading ? <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">Loading backend follow-ups...</div> : null}

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Due Today", value: metrics.due, icon: PhoneCall, tone: "bg-amber-50 text-amber-700" },
          { label: "Overdue", value: metrics.overdue, icon: Clock, tone: "bg-rose-50 text-rose-700" },
          { label: "Scheduled", value: metrics.scheduled, icon: CalendarClock, tone: "bg-blue-50 text-blue-700" },
          { label: "Done", value: metrics.done, icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-700" },
        ].map((item) => (
          <button key={item.label} onClick={() => setFilter(item.label as "All" | FollowUpStatus)} className="rounded-2xl border border-border bg-white p-5 text-left shadow-sm transition-all hover:border-primary">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
                <p className="mt-2 text-3xl font-black text-primary">{item.value}</p>
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.tone}`}>
                <item.icon size={20} />
              </div>
            </div>
          </button>
        ))}
      </div>

      <section className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <div className="rounded-2xl border border-border bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2">
              {statusFilters.map((status) => (
                <button key={status} onClick={() => setFilter(status)} className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest transition-all ${filter === status ? "bg-primary text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}>
                  {status}
                </button>
              ))}
            </div>
            <div className="relative w-full xl:max-w-sm">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search lead, phone, calling owner..." className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold outline-none focus:border-primary focus:bg-white" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {["Lead", "Calling Owner", "Follow-up", "Schedule", "Last Outcome", "Next Action"].map((head) => (
                    <th key={head} className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredRows.map((row) => (
                  <tr key={row.id} onClick={() => setSelectedId(row.id)} className={`cursor-pointer hover:bg-slate-50/70 ${selected?.id === row.id ? "bg-blue-50/50" : ""}`}>
                    <td className="px-5 py-4">
                      <p className="text-sm font-black text-primary">{row.client}</p>
                      <p className="mt-1 text-xs font-bold text-slate-400">{row.leadId} . {row.leadType} . {row.source}</p>
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-secondary">{row.telecaller}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusTone(row.status)}`}>{row.status}</span>
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-secondary">{row.date} {row.time}</td>
                    <td className="px-5 py-4 text-sm font-semibold capitalize text-secondary">{row.lastOutcome}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-secondary">
                        <span className={`h-2.5 w-2.5 rounded-full ${priorityDot(row.priority)}`} />
                        {row.nextAction}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm font-bold text-slate-400">No backend follow-ups match this filter.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Quick Log</p>
          <h3 className="mt-2 text-xl font-black text-primary">{selected?.client || "Select Lead"}</h3>
          <p className="mt-1 text-xs font-bold text-slate-400">{selected?.leadId} . {selected?.telecaller}</p>

          <div className="mt-5 space-y-4">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Last Call Note</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-secondary">{selected?.callNote || "No note selected."}</p>
            </div>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">New Note</span>
              <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={6} placeholder="Summarize the completed follow-up..." className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold outline-none focus:border-primary focus:bg-white" />
            </label>
            <button onClick={saveQuickLog} disabled={!selected || isSaving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-black uppercase tracking-widest text-white disabled:cursor-not-allowed disabled:bg-slate-300">
              <MessageCircle size={16} /> {isSaving ? "Saving" : "Save Follow-up Log"}
            </button>
          </div>
        </aside>
      </section>
    </div>
  );
}

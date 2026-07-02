"use client";

import { useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, Clock, Download, MessageCircle, PhoneCall, Search } from "lucide-react";
import { projectLeadSeedData, tradingLeadSeedData } from "@/components/dashboard/leads/leadTypes";

type FollowUpStatus = "Due Today" | "Overdue" | "Scheduled" | "Done" | "No Response";
type LeadType = "Project" | "Trading";

type FollowUpRow = {
  id: string;
  leadId: string;
  leadType: LeadType;
  client: string;
  phone: string;
  source: string;
  telecaller: string;
  teamLeader: string;
  status: FollowUpStatus;
  date: string;
  time: string;
  lastOutcome: string;
  telecallerDeskStatus: "Pending" | "In Progress" | "Resolved" | "Escalated" | "Done";
  callNote: string;
  nextAction: string;
  priority: "High" | "Medium" | "Low";
};

const TODAY = "2026-06-30";
const teamLeader = "Rajkumar Rathore (TL-1)";
const statusFilters: Array<"All" | FollowUpStatus> = ["All", "Due Today", "Overdue", "Scheduled", "No Response", "Done"];

function buildRows(): FollowUpRow[] {
  const dates = ["2026-06-28", "2026-06-29", TODAY, "2026-07-01", "2026-07-02", "2026-07-03"];
  const times = ["10:00 AM", "11:30 AM", "01:00 PM", "03:30 PM", "05:00 PM"];

  const projectRows = projectLeadSeedData.map((lead, index): FollowUpRow => {
    const date = dates[index % dates.length];
    const done = lead.status === "Won" || lead.status === "Project Created";
    const status: FollowUpStatus = done ? "Done" : index % 7 === 0 ? "No Response" : date < TODAY ? "Overdue" : date === TODAY ? "Due Today" : "Scheduled";

    return {
      id: `FUP-PRJ-${index + 1}`,
      leadId: lead.id,
      leadType: "Project",
      client: `${lead.firstName} ${lead.lastName}`,
      phone: lead.mobile,
      source: lead.source,
      telecaller: lead.assignedTo,
      teamLeader,
      status,
      date,
      time: times[index % times.length],
      lastOutcome: done ? "Deal final" : index % 3 === 0 ? "Callback requested" : "Requirement discussed",
      telecallerDeskStatus: done ? "Done" : index % 7 === 0 ? "Escalated" : index % 3 === 0 ? "In Progress" : "Pending",
      callNote: done ? "Client confirmed scope. Move to agreement/development handoff." : lead.requirementSummary,
      nextAction: done ? "Close follow-up and open agreement" : "Call client, confirm scope, update proposal status",
      priority: status === "Overdue" ? "High" : status === "Due Today" ? "Medium" : "Low",
    };
  });

  const tradingRows = tradingLeadSeedData.map((lead, index): FollowUpRow => {
    const date = dates[(index + 2) % dates.length];
    const done = lead.status === "Converted" || lead.accountStatus === "Issue Resolved";
    const status: FollowUpStatus = done ? "Done" : index % 6 === 0 ? "No Response" : date < TODAY ? "Overdue" : date === TODAY ? "Due Today" : "Scheduled";

    return {
      id: `FUP-TRD-${index + 1}`,
      leadId: lead.id,
      leadType: "Trading",
      client: `${lead.firstName} ${lead.lastName}`,
      phone: lead.mobile,
      source: lead.source,
      telecaller: lead.assignedTo,
      teamLeader,
      status,
      date,
      time: times[(index + 1) % times.length],
      lastOutcome: done ? "Issue resolved" : lead.availability || "Callback needed",
      telecallerDeskStatus: done ? "Done" : lead.accountStatus === "Issue Resolved" ? "Resolved" : index % 6 === 0 ? "Escalated" : "Pending",
      callNote: lead.lastCallNote || lead.remarks,
      nextAction: done ? "Mark telecaller task done" : "Call customer, check issue/account opening status",
      priority: status === "Overdue" ? "High" : lead.interestLevel === "High" ? "Medium" : "Low",
    };
  });

  return [...projectRows, ...tradingRows];
}

function statusTone(status: FollowUpStatus) {
  if (status === "Done") return "border-emerald-100 bg-emerald-50 text-emerald-700";
  if (status === "Overdue") return "border-rose-100 bg-rose-50 text-rose-700";
  if (status === "Due Today") return "border-amber-100 bg-amber-50 text-amber-700";
  if (status === "No Response") return "border-slate-200 bg-slate-100 text-slate-600";
  return "border-blue-100 bg-blue-50 text-blue-700";
}

function priorityDot(priority: FollowUpRow["priority"]) {
  if (priority === "High") return "bg-rose-500";
  if (priority === "Medium") return "bg-amber-500";
  return "bg-emerald-500";
}

export default function FollowUps() {
  const [rows, setRows] = useState<FollowUpRow[]>(buildRows);
  const [filter, setFilter] = useState<"All" | FollowUpStatus>("Due Today");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(rows[0]?.id || "");
  const [note, setNote] = useState("");

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

  const saveQuickLog = () => {
    if (!selected) return;
    setRows((current) =>
      current.map((row) =>
        row.id === selected.id
          ? {
              ...row,
              status: "Done",
              lastOutcome: "Follow-up completed",
              telecallerDeskStatus: "Done",
              callNote: note.trim() || row.callNote,
              nextAction: "Review in Lead Outcomes",
            }
          : row,
      ),
    );
    setNote("");
  };

  const exportRows = () => {
    const header = ["Follow-up ID", "Lead ID", "Client", "Type", "Telecaller", "Follow-up Status", "Telecaller Desk Status", "Date", "Time", "Outcome", "Note", "Next Action"];
    const csvRows = filteredRows.map((row) =>
      [row.id, row.leadId, row.client, row.leadType, row.telecaller, row.status, row.telecallerDeskStatus, row.date, row.time, row.lastOutcome, row.callNote, row.nextAction]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[header.join(","), ...csvRows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "telecaller-followups.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Telecaller Next Step</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-primary">Follow-ups</h2>
          <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-secondary">
            Telecaller Desk me call update hone ke baad jo callback, issue check, proposal confirmation ya pending conversation hai woh yaha manage hoga.
          </p>
        </div>
        <button onClick={exportRows} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-widest text-primary shadow-sm hover:border-primary">
          <Download size={16} /> Export
        </button>
      </div>

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
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest transition-all ${filter === status ? "bg-primary text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
                >
                  {status}
                </button>
              ))}
            </div>
            <div className="relative w-full xl:max-w-sm">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search lead, phone, telecaller..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold outline-none focus:border-primary focus:bg-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {["Lead", "Telecaller", "Follow-up", "Desk Status", "Schedule", "Last Outcome", "Next Action"].map((head) => (
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
                    <td className="px-5 py-4 text-sm font-bold text-secondary">{row.telecallerDeskStatus}</td>
                    <td className="px-5 py-4 text-sm font-bold text-secondary">{row.date} {row.time}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-secondary">{row.lastOutcome}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-secondary">
                        <span className={`h-2.5 w-2.5 rounded-full ${priorityDot(row.priority)}`} />
                        {row.nextAction}
                      </div>
                    </td>
                  </tr>
                ))}
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
              <p className="mt-2 text-sm font-semibold leading-6 text-secondary">{selected?.callNote}</p>
            </div>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">New Note</span>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={6}
                placeholder="Telecaller ne call me kya baat ki, customer interested hai ya nahi, issue resolve hua ya callback chahiye..."
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold outline-none focus:border-primary focus:bg-white"
              />
            </label>
            <button onClick={saveQuickLog} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-black uppercase tracking-widest text-white">
              <MessageCircle size={16} /> Save Follow-up Log
            </button>
          </div>
        </aside>
      </section>
    </div>
  );
}

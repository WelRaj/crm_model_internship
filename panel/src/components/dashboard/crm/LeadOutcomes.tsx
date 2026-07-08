"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Download, Filter, Search, XCircle } from "lucide-react";
import { projectLeadSeedData, tradingLeadSeedData } from "@/components/dashboard/leads/leadTypes";

type OutcomeFilter = "All" | "Final" | "Not Final";

type OutcomeRow = {
  id: string;
  name: string;
  type: "Project" | "Trading";
  source: string;
  telecaller: string;
  status: string;
  outcome: OutcomeFilter;
  reason: string;
  nextStep: string;
  value: number;
  lastConversation: string;
};

const filters: OutcomeFilter[] = ["All", "Final", "Not Final"];

function money(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function makeOutcomeRows(): OutcomeRow[] {
  const projectRows: OutcomeRow[] = projectLeadSeedData.flatMap((lead, index) => {
    const isFinal = lead.status === "Won" || lead.status === "Project Created";
    const isLost = lead.status === "Lost";
    if (!isFinal && !isLost) return [];

    return {
      id: lead.id,
      name: `${lead.firstName} ${lead.lastName}`,
      type: "Project",
      source: lead.source,
      telecaller: lead.assignedTo,
      status: lead.status,
      outcome: isFinal ? "Final" : "Not Final",
      reason: isFinal ? "Client confirmed project scope and budget." : "Budget/timeline not matched after discussion.",
      nextStep: isFinal ? "Move to project agreement and development handoff" : "Keep in not-final archive for manager review",
      value: lead.budget,
      lastConversation: index % 2 === 0 ? "Connected. Requirement note updated." : "Callback requested after internal discussion.",
    };
  });

  const tradingRows: OutcomeRow[] = tradingLeadSeedData.flatMap((lead, index) => {
    const isFinal = lead.status === "Converted" || lead.accountStatus === "Issue Resolved";
    const isLost = lead.status === "Lost" || lead.status === "Not Interested";
    if (!isFinal && !isLost) return [];

    return {
      id: lead.id,
      name: `${lead.firstName} ${lead.lastName}`,
      type: "Trading",
      source: lead.source,
      telecaller: lead.assignedTo,
      status: lead.status,
      outcome: isFinal ? "Final" : "Not Final",
      reason: isFinal ? "Account/issue closed successfully." : "Customer not interested or not reachable after calls.",
      nextStep: isFinal ? "Mark customer done and close calling task" : "Archive with call reason and manager remark",
      value: lead.budget,
      lastConversation: index % 2 === 0 ? "Call connected. Customer update captured." : "No answer/callback needed.",
    };
  });

  return [...projectRows, ...tradingRows];
}

function outcomeTone(outcome: OutcomeFilter) {
  if (outcome === "Final") return "border-emerald-100 bg-emerald-50 text-emerald-700";
  return "border-rose-100 bg-rose-50 text-rose-700";
}

export default function LeadOutcomes() {
  const [activeFilter, setActiveFilter] = useState<OutcomeFilter>("All");
  const [search, setSearch] = useState("");
  const rows = useMemo(() => makeOutcomeRows(), []);

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
        row.status.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, rows, search]);

  const summary = useMemo(
    () => ({
      final: rows.filter((row) => row.outcome === "Final").length,
      notFinal: rows.filter((row) => row.outcome === "Not Final").length,
      value: rows.filter((row) => row.outcome === "Final").reduce((total, row) => total + row.value, 0),
    }),
    [rows],
  );

  const exportRows = () => {
    const header = ["Lead ID", "Name", "Type", "Source", "Calling Owner", "Status", "Outcome", "Reason", "Next Step", "Value"];
    const csvRows = filteredRows.map((row) =>
      [row.id, row.name, row.type, row.source, row.telecaller, row.status, row.outcome, row.reason, row.nextStep, row.value]
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
            Final and not-final lead decisions appear here after calling owner or team leader review. Pending callbacks remain in Follow-ups.
          </p>
        </div>
        <button onClick={exportRows} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-widest text-primary shadow-sm hover:border-primary">
          <Download size={16} /> Export
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Final Leads", value: summary.final, detail: money(summary.value), icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-700" },
          { label: "Not Final", value: summary.notFinal, detail: "Lost / not interested", icon: XCircle, tone: "bg-rose-50 text-rose-700" },
          { label: "Closed Decisions", value: rows.length, detail: "Final + not final only", icon: CheckCircle2, tone: "bg-blue-50 text-blue-700" },
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
          <table className="w-full min-w-[1120px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {["Lead", "Type", "Calling Owner", "Status", "Outcome", "Conversation", "Next Step", "Value"].map((head) => (
                  <th key={head} className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-4">
                    <p className="text-sm font-black text-primary">{row.name}</p>
                    <p className="mt-1 text-xs font-bold text-slate-400">{row.id} . {row.source}</p>
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-secondary">{row.type}</td>
                  <td className="px-5 py-4 text-sm font-bold text-secondary">{row.telecaller}</td>
                  <td className="px-5 py-4 text-sm font-bold text-secondary">{row.status}</td>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

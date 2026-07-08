"use client";

import { useMemo, useState, type ComponentType, type ReactNode } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  Download,
  Mail,
  MessageCircle,
  Phone,
  Search,
  ShieldAlert,
  UserCheck,
} from "lucide-react";
import { projectLeadSeedData, telecallers, tradingLeadSeedData, type TelecallerId } from "@/components/dashboard/leads/leadTypes";

type LeadKind = "Project Lead" | "Trading Lead";
type CallOutcome = "Connected" | "No Answer" | "Busy" | "Callback Requested" | "Interested" | "Not Interested" | "Issue Resolved";
type Availability = "Available" | "Not Available" | "Call Back Later";
type IssueStatus = "Pending" | "In Progress" | "Resolved" | "Escalated" | "Done";
type Priority = "High" | "Medium" | "Low";
type QueueFilter = "All" | "Due Today" | "Pending" | "Resolved" | "Escalated" | "Project Lead" | "Trading Lead";
type CallHistoryFilter = "All" | "Connected" | "Callback" | "No Answer" | "Busy" | "Resolved" | "Escalated";

type TelecallerLead = {
  id: string;
  leadType: LeadKind;
  customer: string;
  phone: string;
  email: string;
  source: string;
  assignedTo: string;
  ownerId: TelecallerId;
  teamLeader: string;
  leadStatus: string;
  detail: string;
  priority: Priority;
  nextFollowUp: string;
  nextFollowUpTime: string;
  availability: Availability;
  issueStatus: IssueStatus;
  attempts: number;
  lastOutcome: CallOutcome;
  lastNote: string;
  lastUpdated: string;
};

type CallLogForm = {
  outcome: CallOutcome;
  availability: Availability;
  issueStatus: IssueStatus;
  nextFollowUp: string;
  nextFollowUpTime: string;
  note: string;
};

type ActivityItem = {
  id: string;
  leadId: string;
  customer: string;
  telecaller: string;
  outcome: CallOutcome;
  issueStatus: IssueStatus;
  nextFollowUp: string;
  note: string;
  time: string;
};

const TODAY = "2026-06-30";
const teamLeader = "Rajkumar Rathore (TL-1)";
const queueFilters: Array<{ id: QueueFilter; label: string }> = [
  { id: "All", label: "All" },
  { id: "Due Today", label: "Due Today" },
  { id: "Pending", label: "Pending" },
  { id: "Resolved", label: "Resolved" },
  { id: "Escalated", label: "Escalated" },
  { id: "Project Lead", label: "Project" },
  { id: "Trading Lead", label: "Trading" },
];

const outcomeOptions: CallOutcome[] = ["Connected", "No Answer", "Busy", "Callback Requested", "Interested", "Not Interested", "Issue Resolved"];
const availabilityOptions: Availability[] = ["Available", "Call Back Later", "Not Available"];
const issueStatusOptions: IssueStatus[] = ["Pending", "In Progress", "Resolved", "Escalated", "Done"];
const callHistoryFilters: CallHistoryFilter[] = ["All", "Connected", "Callback", "No Answer", "Busy", "Resolved", "Escalated"];

function makeTelecallerRows(): TelecallerLead[] {
  const projectRows: TelecallerLead[] = projectLeadSeedData.map((lead, index) => ({
    id: lead.id,
    leadType: "Project Lead",
    customer: `${lead.firstName} ${lead.lastName}`,
    phone: lead.mobile,
    email: lead.email,
    source: lead.source,
    assignedTo: lead.assignedTo,
    ownerId: lead.currentOwnerId as TelecallerId,
    teamLeader,
    leadStatus: lead.status,
    detail: lead.requirementSummary,
    priority: index % 3 === 0 ? "High" : index % 3 === 1 ? "Medium" : "Low",
    nextFollowUp: index % 5 === 0 ? TODAY : lead.followUpDate,
    nextFollowUpTime: `${String(10 + (index % 7)).padStart(2, "0")}:30`,
    availability: index % 3 === 0 ? "Available" : index % 3 === 1 ? "Call Back Later" : "Not Available",
    issueStatus: lead.status === "Project Created" || lead.status === "Won" ? "Resolved" : index % 7 === 0 ? "Escalated" : "Pending",
    attempts: (index % 4) + 1,
    lastOutcome: index % 4 === 0 ? "Connected" : index % 4 === 1 ? "No Answer" : index % 4 === 2 ? "Callback Requested" : "Interested",
    lastNote: "Requirement discussion pending. The calling owner must update the next call note.",
    lastUpdated: index % 2 === 0 ? "Today" : "Yesterday",
  }));

  const tradingRows: TelecallerLead[] = tradingLeadSeedData.map((lead, index) => ({
    id: lead.id,
    leadType: "Trading Lead",
    customer: `${lead.firstName} ${lead.lastName}`,
    phone: lead.mobile,
    email: lead.email,
    source: lead.source,
    assignedTo: lead.assignedTo,
    ownerId: lead.currentOwnerId as TelecallerId,
    teamLeader,
    leadStatus: lead.status,
    detail: `${lead.issueType || lead.tradingInterest} . ${lead.accountStatus || "General Query"}`,
    priority: lead.interestLevel === "High" ? "High" : lead.interestLevel === "Medium" ? "Medium" : "Low",
    nextFollowUp: index % 4 === 0 ? TODAY : lead.followUpDate,
    nextFollowUpTime: `${String(11 + (index % 6)).padStart(2, "0")}:00`,
    availability: lead.availability || "Call Back Later",
    issueStatus: lead.accountStatus === "Issue Resolved" || lead.status === "Converted" ? "Resolved" : index % 6 === 0 ? "Escalated" : "Pending",
    attempts: (index % 5) + 1,
    lastOutcome: index % 5 === 0 ? "No Answer" : index % 5 === 1 ? "Busy" : index % 5 === 2 ? "Connected" : index % 5 === 3 ? "Callback Requested" : "Interested",
    lastNote: lead.lastCallNote || "Customer issue/update pending after the owner call.",
    lastUpdated: index % 2 === 0 ? "Today" : "Yesterday",
  }));

  return [...projectRows, ...tradingRows];
}

function nowLabel() {
  return new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function priorityTone(priority: Priority) {
  if (priority === "High") return "bg-rose-50 text-rose-700";
  if (priority === "Medium") return "bg-orange-50 text-orange-700";
  return "bg-slate-100 text-slate-600";
}

function issueTone(status: IssueStatus) {
  if (status === "Resolved" || status === "Done") return "border-emerald-100 bg-emerald-50 text-emerald-700";
  if (status === "Escalated") return "border-rose-100 bg-rose-50 text-rose-700";
  if (status === "In Progress") return "border-blue-100 bg-blue-50 text-blue-700";
  return "border-amber-100 bg-amber-50 text-amber-700";
}

function defaultForm(lead?: TelecallerLead): CallLogForm {
  return {
    outcome: lead?.lastOutcome || "Connected",
    availability: lead?.availability || "Available",
    issueStatus: lead?.issueStatus || "In Progress",
    nextFollowUp: lead?.nextFollowUp || TODAY,
    nextFollowUpTime: lead?.nextFollowUpTime || "11:00",
    note: lead?.lastNote || "",
  };
}

export default function TelecallerDesk() {
  const [selectedTelecaller, setSelectedTelecaller] = useState<TelecallerId>(telecallers[0]?.id || "Tele-1");
  const [rows, setRows] = useState<TelecallerLead[]>(makeTelecallerRows);
  const firstLeadForTelecaller = rows.find((lead) => lead.ownerId === selectedTelecaller) || rows[0];
  const [selectedLeadId, setSelectedLeadId] = useState(firstLeadForTelecaller?.id || "");
  const [activeFilter, setActiveFilter] = useState<QueueFilter>("Due Today");
  const [search, setSearch] = useState("");
  const [callSearch, setCallSearch] = useState("");
  const [callHistoryFilter, setCallHistoryFilter] = useState<CallHistoryFilter>("All");
  const [form, setForm] = useState<CallLogForm>(() => defaultForm(firstLeadForTelecaller));
  const [activity, setActivity] = useState<ActivityItem[]>(() =>
    makeTelecallerRows()
      .slice(0, 8)
      .map((lead, index) => ({
        id: `CALL-${lead.id}-${index}`,
        leadId: lead.id,
        customer: lead.customer,
        telecaller: lead.assignedTo,
        outcome: lead.lastOutcome,
        issueStatus: lead.issueStatus,
        nextFollowUp: `${lead.nextFollowUp} ${lead.nextFollowUpTime}`,
        note: lead.lastNote,
        time: lead.lastUpdated,
      })),
  );

  const selectedLead = rows.find((lead) => lead.id === selectedLeadId) || rows.find((lead) => lead.ownerId === selectedTelecaller) || rows[0];
  const selectedMember = telecallers.find((member) => member.id === selectedTelecaller) || telecallers[0];

  const telecallerRows = useMemo(() => rows.filter((lead) => lead.ownerId === selectedTelecaller), [rows, selectedTelecaller]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return telecallerRows.filter((lead) => {
      const matchesFilter =
        activeFilter === "All" ||
        lead.leadType === activeFilter ||
        (activeFilter === "Due Today" && lead.nextFollowUp <= TODAY && lead.issueStatus !== "Resolved" && lead.issueStatus !== "Done") ||
        (activeFilter === "Pending" && (lead.issueStatus === "Pending" || lead.issueStatus === "In Progress")) ||
        lead.issueStatus === activeFilter;
      const matchesSearch =
        !query ||
        lead.id.toLowerCase().includes(query) ||
        lead.customer.toLowerCase().includes(query) ||
        lead.phone.includes(query) ||
        lead.source.toLowerCase().includes(query) ||
        lead.detail.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, search, telecallerRows]);

  const metrics = useMemo(() => {
    const dueToday = telecallerRows.filter((lead) => lead.nextFollowUp <= TODAY && lead.issueStatus !== "Resolved" && lead.issueStatus !== "Done").length;
    const pending = telecallerRows.filter((lead) => lead.issueStatus === "Pending" || lead.issueStatus === "In Progress").length;
    const resolved = telecallerRows.filter((lead) => lead.issueStatus === "Resolved" || lead.issueStatus === "Done").length;
    const escalated = telecallerRows.filter((lead) => lead.issueStatus === "Escalated").length;

    return { dueToday, pending, resolved, escalated };
  }, [telecallerRows]);

  const filteredActivity = useMemo(() => {
    const query = callSearch.trim().toLowerCase();
    return activity.filter((item) => {
      const matchesSearch =
        !query ||
        item.leadId.toLowerCase().includes(query) ||
        item.customer.toLowerCase().includes(query) ||
        item.telecaller.toLowerCase().includes(query) ||
        item.outcome.toLowerCase().includes(query) ||
        item.issueStatus.toLowerCase().includes(query) ||
        item.note.toLowerCase().includes(query);
      const matchesFilter =
        callHistoryFilter === "All" ||
        item.outcome === callHistoryFilter ||
        (callHistoryFilter === "Callback" && item.outcome === "Callback Requested") ||
        (callHistoryFilter === "Resolved" && (item.issueStatus === "Resolved" || item.issueStatus === "Done" || item.outcome === "Issue Resolved")) ||
        (callHistoryFilter === "Escalated" && item.issueStatus === "Escalated");

      return matchesSearch && matchesFilter;
    });
  }, [activity, callHistoryFilter, callSearch]);

  const chooseTelecaller = (telecallerId: TelecallerId) => {
    const nextLead = rows.find((lead) => lead.ownerId === telecallerId) || rows[0];
    setSelectedTelecaller(telecallerId);
    setSelectedLeadId(nextLead?.id || "");
    setForm(defaultForm(nextLead));
  };

  const selectLead = (lead: TelecallerLead) => {
    setSelectedLeadId(lead.id);
    setForm(defaultForm(lead));
  };

  const saveCallLog = () => {
    if (!selectedLead || !selectedMember) return;

    setRows((current) =>
      current.map((lead) =>
        lead.id === selectedLead.id
          ? {
              ...lead,
              lastOutcome: form.outcome,
              availability: form.availability,
              issueStatus: form.issueStatus,
              nextFollowUp: form.nextFollowUp,
              nextFollowUpTime: form.nextFollowUpTime,
              lastNote: form.note || "Manual call log updated by the calling owner.",
              attempts: lead.attempts + 1,
              lastUpdated: "Today",
            }
          : lead,
      ),
    );

    setActivity((current) => [
      {
        id: `CALL-${selectedLead.id}-${Date.now()}`,
        leadId: selectedLead.id,
        customer: selectedLead.customer,
        telecaller: selectedMember.name,
        outcome: form.outcome,
        issueStatus: form.issueStatus,
        nextFollowUp: `${form.nextFollowUp} ${form.nextFollowUpTime}`,
        note: form.note || "Manual call log updated by the calling owner.",
        time: nowLabel(),
      },
      ...current,
    ]);
  };

  const markResolved = () => {
    setForm((current) => ({ ...current, outcome: "Issue Resolved", issueStatus: "Resolved", availability: "Available" }));
  };

  const escalateToLeader = () => {
    setForm((current) => ({
      ...current,
      issueStatus: "Escalated",
      note: current.note || `Escalated to ${teamLeader} for support.`,
    }));
  };

  const exportCalls = () => {
    const header = ["Lead ID", "Customer", "Calling Owner", "Outcome", "Issue Status", "Next Follow-up", "Note", "Time"];
    const csvRows = filteredActivity.map((item) =>
      [item.leadId, item.customer, item.telecaller, item.outcome, item.issueStatus, item.nextFollowUp, item.note, item.time]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[header.join(","), ...csvRows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "calling-owner-call-log.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Calling Operations</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-primary">Calling Desk</h2>
          <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-secondary">
            Calling owners manage their assigned queue, update call outcomes, record customer availability, resolve or escalate issues, and schedule the next follow-up.
          </p>
        </div>

        <button onClick={exportCalls} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-widest text-primary shadow-sm transition-all hover:border-primary">
          <Download size={16} /> Export Calls
        </button>
      </div>

      <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Manual Login Switch</p>
            <h3 className="mt-1 text-xl font-black text-primary">Select Calling Owner</h3>
          </div>
          <span className="rounded-full bg-slate-100 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Assigned by {teamLeader}</span>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {telecallers.map((member) => {
            const isActive = selectedTelecaller === member.id;
            const activeCount = rows.filter((lead) => lead.ownerId === member.id && lead.issueStatus !== "Done").length;
            return (
              <button
                key={member.id}
                onClick={() => chooseTelecaller(member.id)}
                className={`rounded-2xl border p-4 text-left transition-all ${
                  isActive ? "border-primary bg-primary/5 shadow-sm" : "border-slate-100 bg-slate-50 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-primary">{member.name}</p>
                    <p className="mt-1 text-xs font-semibold text-secondary">{member.group}</p>
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isActive ? "bg-primary text-white" : "bg-white text-primary"}`}>
                    <UserCheck size={18} />
                  </div>
                </div>
                <p className="mt-3 text-xs font-black uppercase tracking-widest text-slate-500">{activeCount} manual leads</p>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Due Today" value={String(metrics.dueToday)} helper="Call first" icon={Clock} tone="bg-amber-50 text-amber-700" />
        <MetricCard label="Pending" value={String(metrics.pending)} helper="Needs update" icon={Phone} tone="bg-blue-50 text-blue-700" />
        <MetricCard label="Resolved" value={String(metrics.resolved)} helper="Issue/customer done" icon={CheckCircle2} tone="bg-emerald-50 text-emerald-700" />
        <MetricCard label="Escalated" value={String(metrics.escalated)} helper="Leader support" icon={AlertTriangle} tone="bg-rose-50 text-rose-700" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Assigned Queue</p>
              <h3 className="mt-1 text-xl font-black text-primary">{selectedMember?.name} Calling Queue</h3>
              <p className="mt-1 text-xs font-semibold text-secondary">Assigned leads from the manager or team leader appear here for manual calling.</p>
            </div>
            <div className="relative w-full lg:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search lead, phone, source..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm font-semibold outline-none transition-all focus:border-primary focus:bg-white"
              />
            </div>
          </div>

          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            {queueFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeFilter === filter.id ? "bg-primary text-white" : "bg-slate-100 text-slate-500 hover:text-primary"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="max-h-[640px] space-y-3 overflow-y-auto pr-1">
            {filteredRows.map((lead) => {
              const isActive = selectedLead?.id === lead.id;
              return (
                <button
                  key={lead.id}
                  onClick={() => selectLead(lead)}
                  className={`w-full rounded-2xl border p-4 text-left transition-all ${
                    isActive ? "border-primary bg-primary/5 shadow-sm" : "border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-black text-primary">{lead.customer}</span>
                        <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${issueTone(lead.issueStatus)}`}>{lead.issueStatus}</span>
                        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${priorityTone(lead.priority)}`}>{lead.priority}</span>
                      </div>
                      <p className="mt-2 text-xs font-bold text-secondary">
                        {lead.id} . {lead.leadType} . {lead.source} . {lead.leadStatus}
                      </p>
                      <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">{lead.detail}</p>
                      <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-slate-500">
                        <span className="inline-flex items-center gap-1"><Phone size={13} /> {lead.phone}</span>
                        <span className="inline-flex items-center gap-1"><Mail size={13} /> {lead.email}</span>
                        <span className="inline-flex items-center gap-1"><CalendarClock size={13} /> {lead.nextFollowUp} {lead.nextFollowUpTime}</span>
                      </div>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-4 py-3 text-left lg:text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Attempts</p>
                      <p className="mt-1 text-2xl font-black text-primary">{lead.attempts}</p>
                      <p className="mt-1 text-[11px] font-semibold text-secondary">{lead.lastOutcome}</p>
                    </div>
                  </div>
                </button>
              );
            })}

            {filteredRows.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                <p className="text-sm font-black text-primary">No lead in this queue</p>
                <p className="mt-1 text-xs font-semibold text-secondary">Change the filter or calling owner.</p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="space-y-5">
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <div className="mb-5">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Manual Call Update</p>
              <h3 className="mt-1 text-xl font-black text-primary">{selectedLead?.customer}</h3>
              <p className="mt-1 text-xs font-semibold text-secondary">{selectedLead?.id} . {selectedLead?.leadType} . Team Leader: {selectedLead?.teamLeader}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Call Outcome">
                <select
                  value={form.outcome}
                  onChange={(event) => setForm((current) => ({ ...current, outcome: event.target.value as CallOutcome }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold outline-none focus:border-primary"
                >
                  {outcomeOptions.map((outcome) => (
                    <option key={outcome} value={outcome}>{outcome}</option>
                  ))}
                </select>
              </Field>

              <Field label="Customer Availability">
                <select
                  value={form.availability}
                  onChange={(event) => setForm((current) => ({ ...current, availability: event.target.value as Availability }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold outline-none focus:border-primary"
                >
                  {availabilityOptions.map((availability) => (
                    <option key={availability} value={availability}>{availability}</option>
                  ))}
                </select>
              </Field>

              <Field label="Issue Status">
                <select
                  value={form.issueStatus}
                  onChange={(event) => setForm((current) => ({ ...current, issueStatus: event.target.value as IssueStatus }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold outline-none focus:border-primary"
                >
                  {issueStatusOptions.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </Field>

              <Field label="Next Follow-up Date">
                <input
                  type="date"
                  value={form.nextFollowUp}
                  onChange={(event) => setForm((current) => ({ ...current, nextFollowUp: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold outline-none focus:border-primary"
                />
              </Field>

              <Field label="Next Follow-up Time">
                <input
                  type="time"
                  value={form.nextFollowUpTime}
                  onChange={(event) => setForm((current) => ({ ...current, nextFollowUpTime: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold outline-none focus:border-primary"
                />
              </Field>

              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assigned By</p>
                <p className="mt-1 text-sm font-black text-primary">{teamLeader}</p>
                <p className="mt-1 text-xs font-semibold text-secondary">Manual sidebar workflow</p>
              </div>
            </div>

            <Field label="Call Note">
              <textarea
                value={form.note}
                onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
                rows={5}
                placeholder="Record customer response, issue status, resolution details, and next step..."
                className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold leading-6 outline-none focus:border-primary"
              />
            </Field>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <button onClick={saveCallLog} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-black uppercase tracking-widest text-white">
                <MessageCircle size={16} /> Save Log
              </button>
              <button onClick={markResolved} className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-black uppercase tracking-widest text-emerald-700">
                <CheckCircle2 size={16} /> Resolve
              </button>
              <button onClick={escalateToLeader} className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs font-black uppercase tracking-widest text-rose-700">
                <ShieldAlert size={16} /> Escalate
              </button>
            </div>
          </div>

        </section>
      </div>

      <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Call History</p>
            <h3 className="mt-1 text-xl font-black text-primary">Manual Call Logs</h3>
          </div>
          <span className="rounded-full bg-slate-100 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">{filteredActivity.length} Logs</span>
        </div>

        <div className="mb-5 space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              value={callSearch}
              onChange={(event) => setCallSearch(event.target.value)}
              placeholder="Search lead, customer, calling owner, outcome, note..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold outline-none focus:border-primary focus:bg-white"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {callHistoryFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => setCallHistoryFilter(filter)}
                className={`shrink-0 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                  callHistoryFilter === filter ? "bg-primary text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <tr>
                <th className="px-4 py-3">Lead</th>
                <th className="px-4 py-3">Calling Owner</th>
                <th className="px-4 py-3">Outcome</th>
                <th className="px-4 py-3">Issue Status</th>
                <th className="px-4 py-3">Next Follow-up</th>
                <th className="px-4 py-3">Note</th>
                <th className="px-4 py-3">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredActivity.slice(0, 12).map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-4">
                    <p className="font-black text-primary">{item.leadId}</p>
                    <p className="text-xs font-semibold text-secondary">{item.customer}</p>
                  </td>
                  <td className="px-4 py-4 font-semibold text-secondary">{item.telecaller}</td>
                  <td className="px-4 py-4 font-bold text-primary">{item.outcome}</td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${issueTone(item.issueStatus)}`}>{item.issueStatus}</span>
                  </td>
                  <td className="px-4 py-4 font-semibold text-secondary">{item.nextFollowUp}</td>
                  <td className="px-4 py-4 font-semibold text-secondary">{item.note}</td>
                  <td className="px-4 py-4 font-semibold text-secondary">{item.time}</td>
                </tr>
              ))}
              {filteredActivity.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm font-bold text-slate-400">
                    No call logs match this search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-black text-primary">{value}</p>
          <p className="mt-1 text-xs font-semibold text-secondary">{helper}</p>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
      {children}
    </label>
  );
}

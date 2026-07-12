"use client";

import { useEffect, useMemo, useState } from "react";
import { Briefcase, Check, ChevronDown, Eye, Headphones, Target, X } from "lucide-react";
import { listUsers } from "@/services/accounts-api";
import { type AuthUser } from "@/services/auth-api";
import {
  assignLead,
  createLead,
  createLeadFollowUp,
  getLead,
  listLeadFollowUps,
  listLeads,
  updateLead,
  type CreateLeadFollowUpPayload,
  type LeadFollowUpRecord,
  type LeadRecord as BackendLeadRecord,
  type UpdateLeadPayload,
} from "@/services/leads-api";
import ProjectLeadStepWizard from "./ProjectLeadStepWizard";
import TradingLeadCreate from "./TradingLeadCreate";
import { type ProjectLead, type TradingLead } from "./leadTypes";

type CreateMode = "home" | "project" | "trading";

type LeadDrawerState = {
  lead_type: "project" | "trading";
  status: string;
  source: string;
  company_name: string;
  contact_name: string;
  email: string;
  mobile: string;
  city: string;
  requirement_summary: string;
  estimated_value: string;
  assigned_to_id: number | null;
};

type LeadRow = {
  id: string;
  leadNumber: string;
  type: "Project" | "Trading";
  name: string;
  mobile: string;
  source: string;
  assignedTo: string;
  status: string;
  detail: string;
  isRecent: boolean;
};

type FollowUpFormState = {
  channel: CreateLeadFollowUpPayload["channel"];
  outcome: CreateLeadFollowUpPayload["outcome"];
  next_follow_up_at: string;
  note: string;
};

const emptyFollowUpForm: FollowUpFormState = {
  channel: "call",
  outcome: "contacted",
  next_follow_up_at: "",
  note: "",
};

export default function LeadHub() {
  const [mode, setMode] = useState<CreateMode>("home");
  const [backendLeads, setBackendLeads] = useState<BackendLeadRecord[]>([]);
  const [activeUsers, setActiveUsers] = useState<AuthUser[]>([]);
  const [recentLeadIds, setRecentLeadIds] = useState<string[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [drawerState, setDrawerState] = useState<LeadDrawerState | null>(null);
  const [followUps, setFollowUps] = useState<LeadFollowUpRecord[]>([]);
  const [followUpForm, setFollowUpForm] = useState<FollowUpFormState>(emptyFollowUpForm);
  const [apiError, setApiError] = useState("");
  const [drawerError, setDrawerError] = useState("");
  const [isLoadingLeads, setIsLoadingLeads] = useState(true);
  const [isSavingLead, setIsSavingLead] = useState(false);
  const [isSavingFollowUp, setIsSavingFollowUp] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadLeads() {
      try {
        const [leadResponse, userResponse] = await Promise.all([
          listLeads({ limit: 100 }),
          listUsers({ limit: 100, status: "active" }),
        ]);
        if (!isMounted) return;

        setBackendLeads(leadResponse.data);
        setActiveUsers(userResponse.data);
        setApiError("");
      } catch (error) {
        if (isMounted) setApiError(error instanceof Error ? error.message : "Unable to load leads.");
      } finally {
        if (isMounted) setIsLoadingLeads(false);
      }
    }

    void loadLeads();
    return () => {
      isMounted = false;
    };
  }, []);

  const selectedLead = useMemo(
    () => backendLeads.find((lead) => lead.id === selectedLeadId) || null,
    [backendLeads, selectedLeadId]
  );

  const addProjectLead = async (lead: ProjectLead) => {
    try {
      const saved = await createLead({
        lead_type: "project",
        source: lead.source,
        company_name: lead.projectType,
        contact_name: `${lead.firstName} ${lead.lastName}`.trim(),
        email: lead.email === "N/A" ? "" : lead.email,
        mobile: lead.mobile,
        city: "",
        requirement_summary: lead.requirementSummary,
        estimated_value: String(lead.budget || 0),
      });
      setBackendLeads((current) => [saved, ...current]);
      setRecentLeadIds((current) => [saved.id, ...current]);
      setApiError("");
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Unable to save project lead.");
    }
  };

  const addTradingLead = async (lead: TradingLead) => {
    try {
      const saved = await createLead({
        lead_type: "trading",
        source: lead.source,
        company_name: "",
        contact_name: `${lead.firstName} ${lead.lastName}`.trim(),
        email: lead.email === "N/A" ? "" : lead.email,
        mobile: lead.mobile,
        city: "",
        requirement_summary: lead.lastCallNote || lead.tradingInterest,
        estimated_value: String(lead.budget || 0),
      });
      setBackendLeads((current) => [saved, ...current]);
      setRecentLeadIds((current) => [saved.id, ...current]);
      setApiError("");
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Unable to save trading lead.");
    }
  };

  const openLeadDrawer = async (leadId: string) => {
    try {
      const [response, followUpResponse] = await Promise.all([getLead(leadId), listLeadFollowUps(leadId)]);
      setDrawerState({
        lead_type: response.lead_type,
        status: response.status,
        source: response.source,
        company_name: response.company_name,
        contact_name: response.contact_name,
        email: response.email,
        mobile: response.mobile,
        city: response.city,
        requirement_summary: response.requirement_summary,
        estimated_value: response.estimated_value,
        assigned_to_id: response.assigned_to?.id ?? null,
      });
      setFollowUps(followUpResponse);
      setFollowUpForm(emptyFollowUpForm);
      setSelectedLeadId(leadId);
      setApiError("");
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Unable to load lead details.");
    }
  };

  const addLeadFollowUp = async () => {
    if (!selectedLead) return;
    if (!followUpForm.note.trim()) {
      setDrawerError("Follow-up note is required.");
      return;
    }

    setIsSavingFollowUp(true);
    setDrawerError("");

    try {
      const savedFollowUp = await createLeadFollowUp(selectedLead.id, {
        channel: followUpForm.channel,
        outcome: followUpForm.outcome,
        note: followUpForm.note,
        next_follow_up_at: followUpForm.next_follow_up_at ? new Date(followUpForm.next_follow_up_at).toISOString() : null,
      });
      setFollowUps((current) => [savedFollowUp, ...current]);
      setFollowUpForm(emptyFollowUpForm);

      if (selectedLead.status === "new" && savedFollowUp.outcome !== "pending") {
        const nextLead = { ...selectedLead, status: "contacted" as const };
        setBackendLeads((current) => current.map((item) => (item.id === selectedLead.id ? nextLead : item)));
      }
    } catch (error) {
      setDrawerError(error instanceof Error ? error.message : "Unable to add follow-up.");
    } finally {
      setIsSavingFollowUp(false);
    }
  };

  const saveLeadDrawer = async () => {
    if (!selectedLead || !drawerState) return;

    setIsSavingLead(true);
    setDrawerError("");

    const payload: UpdateLeadPayload = {
      lead_type: drawerState.lead_type,
      status: normalizeBackendStatus(drawerState.status),
      source: drawerState.source,
      company_name: drawerState.company_name,
      contact_name: drawerState.contact_name,
      email: drawerState.email,
      mobile: drawerState.mobile,
      city: drawerState.city,
      requirement_summary: drawerState.requirement_summary,
      estimated_value: drawerState.estimated_value,
    };

    try {
      const updated = await updateLead(selectedLead.id, payload);
      let nextLead = updated;

      if (drawerState.assigned_to_id !== (selectedLead.assigned_to?.id ?? null)) {
        const assigned = await assignLead(selectedLead.id, { assigned_to_id: drawerState.assigned_to_id });
        nextLead = assigned;
      }

      const nextBackendLeads = backendLeads.map((item) => (item.id === selectedLead.id ? nextLead : item));
      setBackendLeads(nextBackendLeads);
      setRecentLeadIds((current) => [selectedLead.id, ...current.filter((id) => id !== selectedLead.id)]);
      setDrawerState({
        lead_type: nextLead.lead_type,
        status: nextLead.status,
        source: nextLead.source,
        company_name: nextLead.company_name,
        contact_name: nextLead.contact_name,
        email: nextLead.email,
        mobile: nextLead.mobile,
        city: nextLead.city,
        requirement_summary: nextLead.requirement_summary,
        estimated_value: nextLead.estimated_value,
        assigned_to_id: nextLead.assigned_to?.id ?? null,
      });
      setSelectedLeadId(null);
      setDrawerError("");
    } catch (error) {
      setDrawerError(error instanceof Error ? error.message : "Unable to save lead changes.");
    } finally {
      setIsSavingLead(false);
    }
  };

  const { project, trading } = useMemo(() => backendToProjectList(backendLeads), [backendLeads]);
  const leadRows = useMemo(() => backendToLeadRows(backendLeads, recentLeadIds), [backendLeads, recentLeadIds]);

  if (mode === "project") {
    return <ProjectLeadStepWizard onBack={() => setMode("home")} onSave={addProjectLead} />;
  }

  if (mode === "trading") {
    return <TradingLeadCreate onBack={() => setMode("home")} onSave={addTradingLead} />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Client Operations</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-primary">Lead Desk</h2>
        <p className="mt-1 text-sm font-semibold text-secondary">Capture software enquiries, trading account interest, platform support requests, and client follow-up ownership.</p>
      </div>

      {apiError ? <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{apiError}</div> : null}
      {isLoadingLeads ? <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">Loading backend leads...</div> : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <button onClick={() => setMode("project")} className="rounded-[2rem] border border-border bg-white p-8 text-left shadow-sm transition-all hover:border-primary hover:shadow-xl">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white">
            <Briefcase size={26} />
          </div>
          <h3 className="text-2xl font-black text-primary">Software Project Enquiry</h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-secondary">Create a structured lead for custom software, automation, CRM, ERP, or delivery projects.</p>
          <div className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500">Project Leads: {project.length}</div>
        </button>

        <button onClick={() => setMode("trading")} className="rounded-[2rem] border border-border bg-white p-8 text-left shadow-sm transition-all hover:border-primary hover:shadow-xl">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-slate-950">
            <Headphones size={26} />
          </div>
          <h3 className="text-2xl font-black text-primary">Trading Client Enquiry</h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-secondary">Capture account opening interest, trading platform support, strategy enquiries, call notes, and follow-up ownership.</p>
          <div className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500">Trading Leads: {trading.length}</div>
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 text-primary">
            <Target size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-primary">Lead Desk Scope</h3>
            <p className="mt-1 text-sm font-semibold text-secondary">Create and qualify leads here. Follow-ups, Project Clients, and Legal Agreements continue in Client Operations.</p>
          </div>
        </div>
      </div>

      <LeadViewTable rows={leadRows} onOpenLead={openLeadDrawer} />

      {selectedLead && drawerState ? (
        <LeadDrawer
          lead={selectedLead}
          state={drawerState}
          users={activeUsers}
          followUps={followUps}
          followUpForm={followUpForm}
          error={drawerError}
          saving={isSavingLead}
          savingFollowUp={isSavingFollowUp}
          onClose={() => setSelectedLeadId(null)}
          onChange={setDrawerState}
          onFollowUpChange={setFollowUpForm}
          onAddFollowUp={addLeadFollowUp}
          onSave={saveLeadDrawer}
        />
      ) : null}
    </div>
  );
}

function backendToLeadRows(backendLeads: BackendLeadRecord[], recentLeadIds: string[]): LeadRow[] {
  return backendLeads.map((lead) => ({
    id: lead.id,
    leadNumber: lead.lead_number,
    type: lead.lead_type === "project" ? ("Project" as const) : ("Trading" as const),
    name: lead.contact_name || "Unnamed Lead",
    mobile: lead.mobile,
    source: lead.source || "Direct",
    assignedTo: lead.assigned_to?.full_name || "Unassigned",
    status: lead.lead_type === "project" ? mapProjectStatus(lead.status) : mapTradingStatus(lead.status),
    detail: lead.lead_type === "project" ? lead.company_name || "Project Enquiry" : lead.requirement_summary || "General Query",
    isRecent: recentLeadIds.includes(lead.id),
  })).sort((first, second) => {
    const firstRecent = recentLeadIds.indexOf(first.id);
    const secondRecent = recentLeadIds.indexOf(second.id);
    if (firstRecent === -1 && secondRecent === -1) return 0;
    if (firstRecent === -1) return 1;
    if (secondRecent === -1) return -1;
    return firstRecent - secondRecent;
  });
}

function backendToProjectList(backendLeads: BackendLeadRecord[]) {
  return {
    project: backendLeads.filter((lead) => lead.lead_type === "project").map(backendToProjectLead),
    trading: backendLeads.filter((lead) => lead.lead_type === "trading").map(backendToTradingLead),
  };
}

function backendToProjectLead(lead: BackendLeadRecord): ProjectLead {
  const [firstName, ...lastNameParts] = lead.contact_name.split(" ");
  return {
    id: lead.lead_number,
    firstName: firstName || "Unnamed",
    lastName: lastNameParts.join(" "),
    mobile: lead.mobile,
    email: lead.email || "N/A",
    source: lead.source || "Direct",
    status: mapProjectStatus(lead.status),
    assignedTo: lead.assigned_to?.full_name || "Unassigned",
    currentOwnerId: "Tele-1",
    teamLeaderId: "TL-1",
    transferHistory: [],
    remarks: lead.requirement_summary,
    followUpDate: lead.created_at.split("T")[0],
    department: "Projects",
    projectType: lead.company_name || "Project Enquiry",
    requirementSummary: lead.requirement_summary || "Requirement discussion pending.",
    budget: Number(lead.estimated_value || 0),
    timeline: "To be discussed",
    proposalStatus: "Pending",
    quotationStatus: "Draft",
    meetingDate: lead.created_at.split("T")[0],
    developmentStatus: "Not Started",
    developmentProgress: 0,
    developmentOwner: "Unassigned",
  };
}

function backendToTradingLead(lead: BackendLeadRecord): TradingLead {
  const [firstName, ...lastNameParts] = lead.contact_name.split(" ");
  return {
    id: lead.lead_number,
    firstName: firstName || "Unnamed",
    lastName: lastNameParts.join(" "),
    mobile: lead.mobile,
    email: lead.email || "N/A",
    source: lead.source || "Direct",
    status: mapTradingStatus(lead.status),
    assignedTo: lead.assigned_to?.full_name || "Unassigned",
    currentOwnerId: "Tele-1",
    teamLeaderId: "TL-1",
    transferHistory: [],
    remarks: lead.requirement_summary,
    followUpDate: lead.created_at.split("T")[0],
    department: "Trading",
    interestLevel: "Medium",
    tradingInterest: lead.requirement_summary || "Trading enquiry",
    budget: Number(lead.estimated_value || 0),
    experienceLevel: "Beginner",
    riskAppetite: "Low",
    kycStatus: "Pending",
    dematStatus: "Not Opened",
    accountStatus: "Needs Account Opening",
    issueType: "General Query",
    availability: "Available",
    lastCallNote: lead.requirement_summary,
  };
}

function LeadViewTable({
  rows,
  onOpenLead,
}: {
  rows: LeadRow[];
  onOpenLead: (leadId: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Lead Register</p>
          <h3 className="mt-1 text-xl font-black text-primary">Lead Pipeline</h3>
          <p className="mt-1 text-xs font-semibold text-secondary">New software project and trading client enquiries appear at the top after creation.</p>
        </div>
        <div className="rounded-xl bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500">
          Total Leads: {rows.length}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <tr>
              <th className="px-4 py-3">Lead ID</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Mobile</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Assigned</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Detail</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((lead) => (
                <tr key={lead.id} className={lead.isRecent ? "bg-emerald-50/70" : "hover:bg-slate-50/70"}>
                  <td className="px-4 py-4 font-black text-primary">{lead.leadNumber}</td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${lead.type === "Project" ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-700"}`}>
                      {lead.type}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-bold text-primary">
                    {lead.name}
                    {lead.isRecent ? <span className="ml-2 rounded-full bg-emerald-100 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-700">New</span> : null}
                  </td>
                  <td className="px-4 py-4 font-semibold text-secondary">{lead.mobile}</td>
                  <td className="px-4 py-4 font-semibold text-secondary">{lead.source}</td>
                  <td className="px-4 py-4 font-semibold text-secondary">{lead.assignedTo}</td>
                  <td className="px-4 py-4 font-semibold text-secondary">{lead.status}</td>
                  <td className="px-4 py-4 font-semibold text-secondary">{lead.detail}</td>
                  <td className="px-4 py-4">
                    <button type="button" onClick={() => onOpenLead(lead.id)} className="inline-flex h-9 items-center gap-2 rounded-xl border border-primary/10 bg-primary/5 px-3 text-xs font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-white">
                      <Eye size={14} />
                      View
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LeadDrawer({
  lead,
  state,
  users,
  followUps,
  followUpForm,
  error,
  saving,
  savingFollowUp,
  onClose,
  onChange,
  onFollowUpChange,
  onAddFollowUp,
  onSave,
}: {
  lead: BackendLeadRecord;
  state: LeadDrawerState;
  users: AuthUser[];
  followUps: LeadFollowUpRecord[];
  followUpForm: FollowUpFormState;
  error: string;
  saving: boolean;
  savingFollowUp: boolean;
  onClose: () => void;
  onChange: (state: LeadDrawerState) => void;
  onFollowUpChange: (state: FollowUpFormState) => void;
  onAddFollowUp: () => void;
  onSave: () => void;
}) {
  const statusOptions = ["new", "contacted", "qualified", "proposal", "won", "lost"];
  const channelOptions: CreateLeadFollowUpPayload["channel"][] = ["call", "whatsapp", "email", "meeting", "other"];
  const outcomeOptions: CreateLeadFollowUpPayload["outcome"][] = ["pending", "contacted", "interested", "not_interested", "callback", "escalated", "done"];
  const ownerOptions = useMemo(
    () => users.map((user) => ({ value: user.id.toString(), label: user.full_name || user.email || user.mobile || `User ${user.id}` })),
    [users]
  );

  return (
    <div className="fixed inset-0 z-[90] flex justify-end bg-slate-950/40 backdrop-blur-sm">
      <button type="button" aria-label="Close lead drawer" className="absolute inset-0 cursor-default" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-2xl flex-col overflow-hidden bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Lead Details</p>
            <h3 className="mt-1 text-2xl font-black tracking-tight text-primary">{lead.lead_number}</h3>
          </div>
          <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-primary">
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-4 overflow-y-auto px-6 py-6 md:grid-cols-2">
          <Field label="Contact Name" value={state.contact_name} onChange={(value) => onChange({ ...state, contact_name: value })} />
          <Field label="Company Name" value={state.company_name} onChange={(value) => onChange({ ...state, company_name: value })} />
          <Field label="Mobile" value={state.mobile} onChange={(value) => onChange({ ...state, mobile: value })} />
          <Field label="Email" value={state.email} onChange={(value) => onChange({ ...state, email: value })} />
          <Field label="Source" value={state.source} onChange={(value) => onChange({ ...state, source: value })} />
          <Field label="City" value={state.city} onChange={(value) => onChange({ ...state, city: value })} />
          <Field label="Status" options={statusOptions} value={state.status} onChange={(value) => onChange({ ...state, status: value })} />
          <Field
            label="Assigned To"
            options={["Unassigned", ...ownerOptions.map((option) => option.value)]}
            optionLabels={Object.fromEntries(ownerOptions.map((option) => [option.value, option.label]))}
            value={state.assigned_to_id?.toString() || "Unassigned"}
            onChange={(value) => onChange({ ...state, assigned_to_id: value === "Unassigned" ? null : Number(value) })}
          />
          <Field label="Estimated Value" value={state.estimated_value} onChange={(value) => onChange({ ...state, estimated_value: value })} />
          <Field label="Requirement Summary" multiline value={state.requirement_summary} onChange={(value) => onChange({ ...state, requirement_summary: value })} />

          <div className="space-y-4 border-t border-slate-100 pt-5 md:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Follow-ups</p>
                <h4 className="mt-1 text-lg font-black text-primary">Call Notes & Next Action</h4>
              </div>
              <span className="rounded-xl bg-slate-50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                {followUps.length} saved
              </span>
            </div>

            <div className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 md:grid-cols-2">
              <Field
                label="Channel"
                options={channelOptions}
                value={followUpForm.channel}
                onChange={(value) => onFollowUpChange({ ...followUpForm, channel: value as CreateLeadFollowUpPayload["channel"] })}
              />
              <Field
                label="Outcome"
                options={outcomeOptions}
                value={followUpForm.outcome}
                onChange={(value) => onFollowUpChange({ ...followUpForm, outcome: value as CreateLeadFollowUpPayload["outcome"] })}
              />
              <Field
                label="Next Follow-up"
                type="datetime-local"
                value={followUpForm.next_follow_up_at}
                onChange={(value) => onFollowUpChange({ ...followUpForm, next_follow_up_at: value })}
              />
              <div className="md:col-span-2">
                <Field
                  label="Note"
                  multiline
                  value={followUpForm.note}
                  onChange={(value) => onFollowUpChange({ ...followUpForm, note: value })}
                />
              </div>
              <div className="md:col-span-2">
                <button type="button" onClick={onAddFollowUp} disabled={savingFollowUp} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-primary/10 bg-white px-4 text-xs font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-white disabled:opacity-60">
                  {savingFollowUp ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" /> : <Check size={14} />}
                  Add Follow-up
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {followUps.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-sm font-semibold text-secondary">No follow-up history yet.</div>
              ) : (
                followUps.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-100 bg-white p-4">
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                      <span>{item.channel}</span>
                      <span className="rounded-full bg-primary/5 px-2 py-1 text-primary">{item.outcome.replace("_", " ")}</span>
                      {item.next_follow_up_at ? <span>Next: {formatDateTime(item.next_follow_up_at)}</span> : null}
                    </div>
                    <p className="mt-2 text-sm font-semibold leading-6 text-primary">{item.note}</p>
                    <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {item.created_by?.full_name || item.created_by?.email || "CRM User"} . {formatDateTime(item.created_at)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {error ? <div className="mx-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}

        <div className="mt-auto border-t border-slate-100 px-6 py-5">
          <button type="button" onClick={onSave} disabled={saving} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-xs font-black uppercase tracking-widest text-white hover:bg-primary/90 disabled:opacity-60">
            {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Check size={15} />}
            Save Changes
          </button>
        </div>
      </aside>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  options,
  optionLabels,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  options?: string[];
  optionLabels?: Record<string, string>;
  multiline?: boolean;
}) {
  return (
    <label className={multiline ? "space-y-2 md:col-span-2" : "space-y-2"}>
      <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">{label}</span>
      {options ? (
        <div className="relative">
          <select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-primary outline-none">
            {options.map((option) => (
              <option key={option} value={option}>
                {optionLabels?.[option] || option}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      ) : multiline ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} className="w-full rounded-xl border border-slate-200 p-3 text-sm font-semibold text-primary outline-none" />
      ) : (
        <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-primary outline-none" />
      )}
    </label>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function normalizeBackendStatus(status: string): UpdateLeadPayload["status"] {
  if (status === "contacted" || status === "qualified" || status === "proposal" || status === "won" || status === "lost") {
    return status;
  }
  return "new";
}

function mapProjectStatus(status: BackendLeadRecord["status"]): ProjectLead["status"] {
  if (status === "contacted") return "Requirement Discussed";
  if (status === "qualified") return "Proposal Pending";
  if (status === "proposal") return "Proposal Sent";
  if (status === "won") return "Won";
  if (status === "lost") return "Lost";
  return "New Enquiry";
}

function mapTradingStatus(status: BackendLeadRecord["status"]): TradingLead["status"] {
  if (status === "contacted") return "Contacted";
  if (status === "qualified") return "Qualified";
  if (status === "proposal") return "Follow-up";
  if (status === "won") return "Converted";
  if (status === "lost") return "Lost";
  return "New";
}

"use client";

import { useEffect, useState } from "react";
import { Briefcase, Headphones, Target } from "lucide-react";
import ProjectLeadStepWizard from "./ProjectLeadStepWizard";
import TradingLeadCreate from "./TradingLeadCreate";
import { projectLeadSeedData, tradingLeadSeedData, wonProjectLeadStorageKey, type ProjectLead, type TradingLead } from "./leadTypes";
import { createLead, listLeads, type LeadRecord as BackendLeadRecord } from "@/services/leads-api";

type CreateMode = "home" | "project" | "trading";

export default function LeadHub() {
  const [mode, setMode] = useState<CreateMode>("home");
  const [projectCreated, setProjectCreated] = useState<ProjectLead[]>(projectLeadSeedData);
  const [tradingCreated, setTradingCreated] = useState<TradingLead[]>(tradingLeadSeedData);
  const [recentLeadIds, setRecentLeadIds] = useState<string[]>([]);
  const [apiError, setApiError] = useState("");
  const [isLoadingLeads, setIsLoadingLeads] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadLeads() {
      try {
        const response = await listLeads({ limit: 100 });
        if (!isMounted) return;
        const projectLeads = response.data.filter((lead) => lead.lead_type === "project").map(backendToProjectLead);
        const tradingLeads = response.data.filter((lead) => lead.lead_type === "trading").map(backendToTradingLead);
        setProjectCreated(projectLeads);
        setTradingCreated(tradingLeads);
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
      const savedLead = backendToProjectLead(saved);
      setProjectCreated((current) => [savedLead, ...current]);
      setRecentLeadIds((current) => [savedLead.id, ...current]);
      setApiError("");
      if (savedLead.status === "Won" || savedLead.status === "Project Created") syncWonProjectLead(savedLead);
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
      const savedLead = backendToTradingLead(saved);
      setTradingCreated((current) => [savedLead, ...current]);
      setRecentLeadIds((current) => [savedLead.id, ...current]);
      setApiError("");
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Unable to save trading lead.");
    }
  };

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
          <div className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500">Project Leads: {projectCreated.length}</div>
        </button>

        <button onClick={() => setMode("trading")} className="rounded-[2rem] border border-border bg-white p-8 text-left shadow-sm transition-all hover:border-primary hover:shadow-xl">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-slate-950">
            <Headphones size={26} />
          </div>
          <h3 className="text-2xl font-black text-primary">Trading Client Enquiry</h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-secondary">Capture account opening interest, trading platform support, strategy enquiries, call notes, and follow-up ownership.</p>
          <div className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500">Trading Leads: {tradingCreated.length}</div>
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 text-primary">
            <Target size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-primary">Lead Desk Scope</h3>
            <p className="mt-1 text-sm font-semibold text-secondary">Create and qualify leads here. Follow-ups, Clients & Contacts, and Project Agreements continue in Client Operations.</p>
          </div>
        </div>
      </div>

      <LeadViewTable projectLeads={projectCreated} tradingLeads={tradingCreated} recentLeadIds={recentLeadIds} />
    </div>
  );
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
    status: "New Enquiry",
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
    status: "New",
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

function syncWonProjectLead(lead: ProjectLead) {
  if (typeof window === "undefined") return;

  try {
    const existing = JSON.parse(window.localStorage.getItem(wonProjectLeadStorageKey) || "[]") as ProjectLead[];
    const withoutCurrent = existing.filter((item) => item.id !== lead.id);
    window.localStorage.setItem(wonProjectLeadStorageKey, JSON.stringify([lead, ...withoutCurrent]));
    window.dispatchEvent(new Event("crm-won-project-leads-updated"));
  } catch {
    window.localStorage.setItem(wonProjectLeadStorageKey, JSON.stringify([lead]));
    window.dispatchEvent(new Event("crm-won-project-leads-updated"));
  }
}

function LeadViewTable({ projectLeads, tradingLeads, recentLeadIds }: { projectLeads: ProjectLead[]; tradingLeads: TradingLead[]; recentLeadIds: string[] }) {
  const rows = [
    ...projectLeads.map((lead) => ({
      id: lead.id,
      type: "Project",
      name: `${lead.firstName} ${lead.lastName}`,
      mobile: lead.mobile,
      source: lead.source,
      assignedTo: lead.assignedTo,
      status: lead.status,
      detail: lead.projectType,
    })),
    ...tradingLeads.map((lead) => ({
      id: lead.id,
      type: "Trading",
      name: `${lead.firstName} ${lead.lastName}`,
      mobile: lead.mobile,
      source: lead.source,
      assignedTo: lead.assignedTo,
      status: lead.status,
      detail: lead.issueType || lead.tradingInterest,
    })),
  ].sort((first, second) => {
    const firstRecent = recentLeadIds.indexOf(first.id);
    const secondRecent = recentLeadIds.indexOf(second.id);
    if (firstRecent === -1 && secondRecent === -1) return 0;
    if (firstRecent === -1) return 1;
    if (secondRecent === -1) return -1;
    return firstRecent - secondRecent;
  });

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
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((lead) => {
              const isRecent = recentLeadIds.includes(lead.id);
              return (
              <tr key={lead.id} className={isRecent ? "bg-emerald-50/70" : "hover:bg-slate-50/70"}>
                <td className="px-4 py-4 font-black text-primary">{lead.id}</td>
                <td className="px-4 py-4">
                  <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${lead.type === "Project" ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-700"}`}>
                    {lead.type}
                  </span>
                </td>
                <td className="px-4 py-4 font-bold text-primary">
                  {lead.name}
                  {isRecent ? <span className="ml-2 rounded-full bg-emerald-100 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-700">New</span> : null}
                </td>
                <td className="px-4 py-4 font-semibold text-secondary">{lead.mobile}</td>
                <td className="px-4 py-4 font-semibold text-secondary">{lead.source}</td>
                <td className="px-4 py-4 font-semibold text-secondary">{lead.assignedTo}</td>
                <td className="px-4 py-4 font-semibold text-secondary">{lead.status}</td>
                <td className="px-4 py-4 font-semibold text-secondary">{lead.detail}</td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

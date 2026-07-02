"use client";

import { useState } from "react";
import { Briefcase, Headphones, Target } from "lucide-react";
import ProjectLeadStepWizard from "./ProjectLeadStepWizard";
import TradingLeadCreate from "./TradingLeadCreate";
import { projectLeadSeedData, tradingLeadSeedData, type ProjectLead, type TradingLead } from "./leadTypes";

type CreateMode = "home" | "project" | "trading";

export default function LeadHub() {
  const [mode, setMode] = useState<CreateMode>("home");
  const [projectCreated, setProjectCreated] = useState<ProjectLead[]>(projectLeadSeedData);
  const [tradingCreated, setTradingCreated] = useState<TradingLead[]>(tradingLeadSeedData);
  const [recentLeadIds, setRecentLeadIds] = useState<string[]>([]);

  const addProjectLead = (lead: ProjectLead) => {
    setProjectCreated((current) => [lead, ...current]);
    setRecentLeadIds((current) => [lead.id, ...current]);
  };

  const addTradingLead = (lead: TradingLead) => {
    setTradingCreated((current) => [lead, ...current]);
    setRecentLeadIds((current) => [lead.id, ...current]);
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
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">CRM Leads</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-primary">Create Lead</h2>
        <p className="mt-1 text-sm font-semibold text-secondary">Sirf lead create karne ka screen. Extra lead pages/sidebar removed.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <button onClick={() => setMode("project")} className="rounded-[2rem] border border-border bg-white p-8 text-left shadow-sm transition-all hover:border-primary hover:shadow-xl">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white">
            <Briefcase size={26} />
          </div>
          <h3 className="text-2xl font-black text-primary">Add New Project Lead</h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-secondary">Bada software/project enquiry. Purane step flow me lead create hogi.</p>
          <div className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500">Total project lead data: {projectCreated.length}</div>
        </button>

        <button onClick={() => setMode("trading")} className="rounded-[2rem] border border-border bg-white p-8 text-left shadow-sm transition-all hover:border-primary hover:shadow-xl">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-slate-950">
            <Headphones size={26} />
          </div>
          <h3 className="text-2xl font-black text-primary">Add New Trading / Calling Lead</h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-secondary">Account opening, app/site issue, telecaller assignment, call note aur follow-up add hoga.</p>
          <div className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500">Total trading lead data: {tradingCreated.length}</div>
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 text-primary">
            <Target size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-primary">Lead Module Simplified</h3>
            <p className="mt-1 text-sm font-semibold text-secondary">Lead ke andar ab bas create flow hai. Follow-ups, Clients & Contacts, Project Agreements CRM sidebar me alag same rahenge.</p>
          </div>
        </div>
      </div>

      <LeadViewTable projectLeads={projectCreated} tradingLeads={tradingCreated} recentLeadIds={recentLeadIds} />
    </div>
  );
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
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Lead View</p>
          <h3 className="mt-1 text-xl font-black text-primary">All Leads</h3>
          <p className="mt-1 text-xs font-semibold text-secondary">Add New Project Lead ya Add New Trading Lead se jo lead banegi, woh yahin top par dikhegi.</p>
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

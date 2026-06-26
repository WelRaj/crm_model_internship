"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { 
  Target, Users, Clock, TrendingUp, CheckCircle2, 
  ChevronLeft, Phone, Mail, MessageSquare, Eye, 
  Search, Filter, Download, Briefcase
} from "lucide-react";
import Step1LeadInfo from "./Step1LeadInfo";
import Step2Requirements from "./Step2Requirements";
import Step3FollowUp from "./Step3FollowUp";
import Step4Proposal from "./Step4Proposal";
import Step5Approval from "./Step5Approval";
import Step6LeadStatus from "./Step6LeadStatus";
import { ActionButton, DataTable, StatusBadge, Panel, MetricCard } from "../accounting/AccountingComponents";
import { createLeadDraft, type LeadDraft, type LeadRecord } from "./leadTypes";

const STEPS = [
  { id: 1, title: "Lead Info", description: "Basic client details", icon: Target },
  { id: 2, title: "Requirements", description: "Project & Budget info", icon: Briefcase },
  { id: 3, title: "Follow Up", description: "Communication logs", icon: Clock },
  { id: 4, title: "Proposal", description: "Quotations & Files", icon: TrendingUp },
  { id: 5, title: "Approval", description: "Management Review", icon: Users },
  { id: 6, title: "Lead Status", description: "Final Deal Outcome", icon: Target },
];

const mockLeads: LeadRecord[] = [
  { 
    id: "LEAD-2024-812", 
    date: "16 Jun 2024",
    name: "Aarav Mehta", 
    company: "Nexa Retail", 
    mobile: "+91 98765 43210", 
    email: "aarav@nexa.com",
    service: "E-commerce App",
    platform: "Android/iOS",
    source: "Google Ads",
    status: "Negotiation",
    assigned: "Vikram Rathore",
    value: "INR 12.5L"
  },
  { 
    id: "LEAD-2024-745", 
    date: "15 Jun 2024",
    name: "Priya Nair", 
    company: "Apex Finserve", 
    mobile: "+91 98765 43211", 
    email: "priya@apex.in",
    service: "Loan CRM",
    platform: "Web Dashboard",
    source: "Referral",
    status: "Proposal Sent",
    assigned: "Sunita Sharma",
    value: "INR 8.4L"
  },
  { 
    id: "LEAD-2024-912", 
    date: "14 Jun 2024",
    name: "Rohan Saini", 
    company: "CloudOps Tech", 
    mobile: "+91 98765 43212", 
    email: "rohan@cloudops.io",
    service: "DevOps Audit",
    platform: "Infrastructure",
    source: "LinkedIn",
    status: "Interested",
    assigned: "Rajesh Kumar",
    value: "TBD"
  },
];

export default function LeadWizard() {
  const [showWizard, setShowWizard] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);
  const [leads, setLeads] = useState<LeadRecord[]>(mockLeads);
  
  const [formData, setFormData]: [LeadDraft, Dispatch<SetStateAction<LeadDraft>>] = useState<LeadDraft>(() => createLeadDraft());

  const updateFormData = (newData: Partial<LeadDraft>) => {
    setFormData(prev => ({ ...prev, ...newData }));
  };

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));
  const goToStep = (stepId: number) => setCurrentStep(stepId);

  const handleComplete = () => {
    setIsCompleted(true);
    const fullName = [formData.firstName, formData.lastName].filter(Boolean).join(" ").trim();
    const expectedValue = Number(formData.expectedValue || 0);
    const newLeadRecord: LeadRecord = {
      id: formData.leadId,
      date: new Date(formData.leadDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      name: fullName || "Unnamed Lead",
      company: formData.companyName || "Personal",
      mobile: formData.mobile || "N/A",
      email: formData.personalEmail || formData.officialEmail || "N/A",
      service: formData.serviceRequired || "TBD",
      platform: formData.platformRequired || "TBD",
      source: formData.leadSource || "Direct",
      status: formData.status || "New",
      assigned: formData.assignedTo || "Unassigned",
      value: expectedValue > 0 ? `INR ${(expectedValue / 100000).toFixed(1)}L` : "TBD"
    };

    setLeads(prev => [newLeadRecord, ...prev]);

    setTimeout(() => {
      setShowWizard(false);
      setIsCompleted(false);
      setCurrentStep(1);
      setFormData(createLeadDraft());
    }, 3000);
  };

  const renderStep = () => {
    if (isCompleted) {
       return (
         <div className="py-20 text-center space-y-6 animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-100">
               <CheckCircle2 size={56} />
            </div>
            <h3 className="text-3xl font-black text-primary tracking-tight">Lead Processed Successfully!</h3>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs">Pipeline has been updated. Returning to Hub...</p>
         </div>
       );
    }

    switch (currentStep) {
      case 1: return <Step1LeadInfo data={formData} updateData={updateFormData} onNext={nextStep} />;
      case 2: return <Step2Requirements data={formData} updateData={updateFormData} onNext={nextStep} onPrev={prevStep} />;
      case 3: return <Step3FollowUp data={formData} updateData={updateFormData} onNext={nextStep} onPrev={prevStep} />;
      case 4: return <Step4Proposal data={formData} updateData={updateFormData} onNext={nextStep} onPrev={prevStep} />;
      case 5: return <Step5Approval data={formData} updateData={updateFormData} onNext={nextStep} onPrev={prevStep} />;
      case 6: return <Step6LeadStatus data={formData} updateData={updateFormData} onPrev={prevStep} onComplete={handleComplete} />;
      default: return null;
    }
  };

  if (showWizard) {
    return (
      <div className="space-y-8 animate-in zoom-in-95 duration-500">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-6">
          <div className="flex items-center gap-5">
             <button onClick={() => setShowWizard(false)} className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 hover:text-primary transition-all shadow-sm">
                <ChevronLeft size={24} />
             </button>
             <div>
                <h2 className="text-2xl font-black text-primary tracking-tight">
                   {isCompleted ? "Process Complete" : `Lead Generation Pipeline`}
                </h2>
                {!isCompleted && <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Currently at Step {currentStep} of {STEPS.length}</p>}
             </div>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active ID</p>
             <p className="text-lg font-black text-primary">{formData.leadId}</p>
          </div>
        </div>

        {/* Step Sidebar + Content */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar - Progress */}
          {!isCompleted && (
            <div className="w-full lg:w-72 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 space-y-3 h-fit sticky top-28">
              {STEPS.map((step) => {
                const isActive = currentStep === step.id;
                const isDone = currentStep > step.id;
                return (
                  <button
                    key={step.id}
                    onClick={() => goToStep(step.id)}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 text-left cursor-pointer group ${
                      isActive
                        ? "bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]"
                        : isDone
                        ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        : "text-slate-300 hover:bg-slate-50 hover:text-slate-400"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black border-2 transition-all ${
                      isActive ? "border-white/40 bg-white/10" :
                      isDone ? "border-emerald-500 bg-emerald-500 text-white" :
                      "border-slate-100 group-hover:border-slate-200"
                    }`}>
                      {isDone ? "✓" : step.id}
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest leading-none">{step.title}</p>
                      <p className={`text-[10px] mt-1.5 font-bold ${isActive ? 'text-white/60' : 'text-slate-400'}`}>{step.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Main Content Area */}
          <div className={`flex-1 bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm min-h-[500px] ${isCompleted ? 'flex items-center justify-center' : ''}`}>
            {renderStep()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-primary tracking-tight">Leads Central Hub</h2>
          <p className="text-slate-500 font-medium mt-1 text-lg">Sales & Development unified pipeline management.</p>
        </div>
        <div className="flex gap-4">
          <ActionButton icon={Download} label="Export Leads" variant="outline" />
          <ActionButton 
            onClick={() => setShowWizard(true)}
            icon={Target}
            label="+ Create New Lead"
            variant="accent"
          />
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { l: "Total Leads", v: String(leads.length + 479), c: "blue" as const },
          { l: "Active Pipeline", v: "12", c: "amber" as const },
          { l: "Converted", v: "64", c: "green" as const },
          { l: "Drop Rate", v: "8%", c: "red" as const }
        ].map((s, i) => (
          <MetricCard key={i} label={s.l} value={s.v} icon={Target} tone={s.c} />
        ))}
      </div>

      {/* Unified Pipeline Table */}
      <Panel 
        title="Active Sales Pipeline" 
        description="Tele-calling team can connect via icons; Development team can view technical scope."
        actions={
          <div className="flex gap-3">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                <input type="text" placeholder="Search by name/company..." className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-primary/5 w-64" />
             </div>
             <button className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-primary"><Filter size={18} /></button>
          </div>
        }
      >
        <DataTable columns={["Lead ID & Date", "Client Details", "Project Scope", "Source", "Status", "Connect / View"]}>
          {leads.map((lead) => (
            <tr key={lead.id} className="group hover:bg-slate-50 transition-colors">
              <td className="px-4 py-5">
                 <p className="font-black text-primary">{lead.id}</p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{lead.date}</p>
              </td>
              <td className="px-4 py-5">
                 <p className="font-black text-primary">{lead.name}</p>
                 <p className="text-xs font-bold text-slate-500">{lead.company}</p>
                 <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Phone size={10} /> {lead.mobile}</span>
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Mail size={10} /> {lead.email}</span>
                 </div>
              </td>
              <td className="px-4 py-5">
                 <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary/5 rounded-lg flex items-center justify-center text-primary"><Briefcase size={14} /></div>
                    <div>
                       <p className="text-xs font-black text-primary">{lead.service}</p>
                       <p className="text-[10px] font-bold text-slate-400 uppercase">{lead.platform}</p>
                    </div>
                 </div>
              </td>
              <td className="px-4 py-5">
                 <StatusBadge tone="blue">{lead.source}</StatusBadge>
                 <p className="text-[10px] font-bold text-slate-400 mt-1">Assigned: {lead.assigned}</p>
              </td>
              <td className="px-4 py-5">
                 <StatusBadge tone={lead.status === "Won" ? "green" : lead.status === "Interested" ? "blue" : "amber"}>
                   {lead.status}
                 </StatusBadge>
                 <p className="text-xs font-black text-primary mt-1">{lead.value}</p>
              </td>
              <td className="px-4 py-5">
                 <div className="flex items-center gap-2">
                    <button title="Call Client" className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all"><Phone size={16} /></button>
                    <button title="WhatsApp" className="w-9 h-9 bg-green-50 text-green-600 rounded-xl flex items-center justify-center hover:bg-green-600 hover:text-white transition-all"><MessageSquare size={16} /></button>
                    <button title="View Requirements" className="w-9 h-9 bg-primary/5 text-primary rounded-xl flex items-center justify-center hover:bg-primary hover:text-white transition-all ml-2"><Eye size={16} /></button>
                 </div>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </div>
  );
}

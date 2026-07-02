"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { Briefcase, CheckCircle2, ChevronLeft, Clock, Target, TrendingUp, Users } from "lucide-react";
import Step1LeadInfo from "./Step1LeadInfo";
import Step2Requirements from "./Step2Requirements";
import Step3FollowUp from "./Step3FollowUp";
import Step4Proposal from "./Step4Proposal";
import Step5Approval from "./Step5Approval";
import Step6LeadStatus from "./Step6LeadStatus";
import { createLeadDraft, telecallers, type LeadDraft, type LeadDraftUpdater, type ProjectLead } from "./leadTypes";

const PROJECT_STEPS = [
  { id: 1, title: "Lead Info", description: "Client and contact details", icon: Target },
  { id: 2, title: "Requirements", description: "Project, scope and budget", icon: Briefcase },
  { id: 3, title: "Follow Up", description: "Discussion and next action", icon: Clock },
  { id: 4, title: "Proposal", description: "Quotation and commercials", icon: TrendingUp },
  { id: 5, title: "Approval", description: "Review and authorization", icon: Users },
  { id: 6, title: "Lead Status", description: "Closure and handoff", icon: Target },
];

export default function ProjectLeadStepWizard({ onBack, onSave }: { onBack: () => void; onSave: (lead: ProjectLead) => void }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);
  const [formData, setFormData]: [LeadDraft, Dispatch<SetStateAction<LeadDraft>>] = useState<LeadDraft>(() => ({
    ...createLeadDraft(),
    department: "Projects",
    status: "New Enquiry",
    projectType: "New Project",
    serviceRequired: "Web App",
    platformRequired: "Web",
  }));

  const updateFormData: LeadDraftUpdater = (updater) => {
    setFormData((prev) => {
      const nextData = typeof updater === "function" ? updater(prev) : updater;
      return { ...nextData, department: "Projects" };
    });
  };

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, PROJECT_STEPS.length));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleComplete = () => {
    const selectedTelecaller = telecallers.find((caller) => caller.name === formData.assignedTo) || telecallers[0];
    const projectLead: ProjectLead = {
      id: formData.leadId.replace("LEAD", "PRJ"),
      firstName: formData.firstName || "Unnamed",
      lastName: formData.lastName || "",
      mobile: formData.mobile || "N/A",
      email: formData.personalEmail || formData.officialEmail || "N/A",
      source: formatLeadSource(formData.leadSource, formData.sourceDetail),
      status: normalizeProjectStatus(formData.status),
      assignedTo: formData.assignedTo || selectedTelecaller.name,
      currentOwnerId: selectedTelecaller.id,
      teamLeaderId: "TL-1",
      transferHistory: [],
      remarks: formData.overallRemarks || formData.remarks || formData.projectDescription || "Project lead created from step wizard.",
      followUpDate: formData.closeDate || formData.leadDate,
      department: "Projects",
      projectType: formData.projectType || formData.serviceRequired || "Project Enquiry",
      requirementSummary: formData.projectDescription || formData.serviceRequired || "Requirement discussion pending.",
      budget: Number(formData.expectedValue || formData.maxBudget || formData.minBudget || formData.amount || 0),
      timeline: formData.timeline || "To be discussed",
      proposalStatus: normalizeProposalStatus(formData.status),
      quotationStatus: formData.amount ? "Sent" : "Draft",
      meetingDate: formData.proposalDate || formData.leadDate,
      developmentStatus: "Not Started",
      developmentProgress: 0,
      developmentOwner: "Development Team",
    };

    onSave(projectLead);
    setIsCompleted(true);
    setTimeout(onBack, 1200);
  };

  const renderStep = () => {
    if (isCompleted) {
      return (
        <div className="py-20 text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 size={54} />
          </div>
          <h3 className="text-3xl font-black tracking-tight text-primary">Project Lead Added Successfully</h3>
          <p className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400">Returning to Project Leads...</p>
        </div>
      );
    }

    switch (currentStep) {
      case 1:
        return <Step1LeadInfo data={formData} updateData={updateFormData} onNext={nextStep} onPrev={prevStep} />;
      case 2:
        return <Step2Requirements data={formData} updateData={updateFormData} onNext={nextStep} onPrev={prevStep} />;
      case 3:
        return <Step3FollowUp data={formData} updateData={updateFormData} onNext={nextStep} onPrev={prevStep} />;
      case 4:
        return <Step4Proposal data={formData} updateData={updateFormData} onNext={nextStep} onPrev={prevStep} />;
      case 5:
        return <Step5Approval data={formData} updateData={updateFormData} onNext={nextStep} onPrev={prevStep} />;
      case 6:
        return <Step6LeadStatus data={formData} updateData={updateFormData} onPrev={prevStep} onComplete={handleComplete} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-slate-100 pb-6">
        <div className="flex items-center gap-5">
          <button onClick={onBack} className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 shadow-sm transition-all hover:text-primary">
            <ChevronLeft size={24} />
          </button>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Project Lead Wizard</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-primary">Add New Project Lead</h2>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active ID</p>
          <p className="text-lg font-black text-primary">{formData.leadId.replace("LEAD", "PRJ")}</p>
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {!isCompleted ? (
          <div className="h-fit w-full space-y-3 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm lg:w-72">
            {PROJECT_STEPS.map((step) => {
              const isActive = currentStep === step.id;
              const isDone = currentStep > step.id;
              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-left transition-all ${
                    isActive ? "bg-primary text-white shadow-xl shadow-primary/20" : isDone ? "bg-emerald-50 text-emerald-600" : "text-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-black ${isDone ? "bg-emerald-500 text-white" : "bg-white/10"}`}>
                    {isDone ? "OK" : step.id}
                  </span>
                  <span>
                    <span className="block text-xs font-black uppercase tracking-widest">{step.title}</span>
                    <span className={`mt-1 block text-[10px] font-bold ${isActive ? "text-white/60" : "text-slate-400"}`}>{step.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
        <div className={`min-h-[520px] flex-1 rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm ${isCompleted ? "flex items-center justify-center" : ""}`}>
          {renderStep()}
        </div>
      </div>
    </div>
  );
}

function normalizeProjectStatus(status: string): ProjectLead["status"] {
  if (status === "Proposal Sent") return "Proposal Sent";
  if (status === "Negotiation") return "Negotiation";
  if (status === "Won") return "Won";
  if (status === "Lost") return "Lost";
  if (status === "On Hold") return "Requirement Discussed";
  return "New Enquiry";
}

function normalizeProposalStatus(status: string): ProjectLead["proposalStatus"] {
  if (status === "Proposal Sent") return "Sent";
  if (status === "Negotiation") return "Negotiation";
  if (status === "Won") return "Won";
  if (status === "Lost") return "Lost";
  return "Pending";
}

function formatLeadSource(source: string, detail: string) {
  if (!source) return "Direct";
  if (source === "Other Social Media" && detail) return `${source}: ${detail}`;
  return source;
}

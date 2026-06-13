"use client";

import { useState } from "react";
import { Target, Users, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Step1LeadInfo from "./Step1LeadInfo";
import Step2Requirements from "./Step2Requirements";
import Step3FollowUp from "./Step3FollowUp";
import Step4Proposal from "./Step4Proposal";
import Step5Approval from "./Step5Approval";
import Step6LeadStatus from "./Step6LeadStatus";

const STEPS = [
  { id: 1, title: "Lead Info", description: "Basic client details", icon: Target },
  { id: 2, title: "Requirements", description: "Project & Budget info", icon: Target },
  { id: 3, title: "Follow Up", description: "Communication logs", icon: Clock },
  { id: 4, title: "Proposal", description: "Quotations & Files", icon: TrendingUp },
  { id: 5, title: "Approval", description: "Management Review", icon: Users },
  { id: 6, title: "Lead Status", description: "Final Deal Outcome", icon: Target },
];

export default function LeadWizard() {
  const [showWizard, setShowWizard] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({ leadId: "LEAD-2024-001", tags: "Warm" });

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1LeadInfo data={formData} updateData={setFormData} onNext={nextStep} />;
      case 2: return <Step2Requirements data={formData} updateData={setFormData} onNext={nextStep} onPrev={prevStep} />;
      case 3: return <Step3FollowUp onNext={nextStep} onPrev={prevStep} />;
      case 4: return <Step4Proposal onNext={nextStep} onPrev={prevStep} />;
      case 5: return <Step5Approval onNext={nextStep} onPrev={prevStep} />;
      case 6: return <Step6LeadStatus onPrev={prevStep} />;
      default: return null;
    }
  };

  if (showWizard) {
    return (
      <div className="space-y-6 animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setShowWizard(false)} className="rounded-xl">
            Back to Hub
          </Button>
          <h2 className="text-xl font-black text-primary">
            Lead Generation Wizard (Step {currentStep})
          </h2>
        </div>

        {/* Step Sidebar + Content */}
        <div className="flex gap-6">
          {/* Left Sidebar */}
          <div className="w-64 bg-white rounded-2xl border border-border shadow-sm p-4 space-y-2 h-fit">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isDone = currentStep > step.id;
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? "bg-accent text-primary font-black"
                      : isDone
                      ? "bg-green-50 text-green-600"
                      : "text-slate-400"
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border-2 ${
                    isActive ? "border-primary bg-primary text-white" :
                    isDone ? "border-green-500 bg-green-500 text-white" :
                    "border-slate-200"
                  }`}>
                    {isDone ? "✓" : step.id}
                  </div>
                  <div>
                    <p className="text-sm font-bold leading-none">{step.title}</p>
                    <p className="text-[10px] mt-0.5 opacity-70">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-white rounded-2xl border border-border p-8 shadow-sm">
            {renderStep()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-primary tracking-tight">Leads Management</h2>
          <p className="text-secondary font-medium mt-1">Monitor and convert your sales pipeline.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-6 py-3 bg-white border border-border rounded-2xl text-xs font-black text-secondary">
            Filter
          </button>
          <button
            onClick={() => setShowWizard(true)}
            className="px-6 py-3 bg-accent text-primary rounded-2xl text-xs font-black shadow-lg shadow-accent/10"
          >
            + Create New Lead
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { l: "Total Leads", v: "482" },
          { l: "Warm Leads", v: "124" },
          { l: "Converted", v: "64" },
          { l: "Lost", v: "12" }
        ].map((s, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-border shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.l}</p>
            <p className="text-2xl font-black text-primary mt-1">{s.v}</p>
          </div>
        ))}
      </div>

      {/* Lead Table */}
      <div className="bg-white rounded-[2.5rem] border border-border shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
          <h3 className="font-black text-primary">Lead Pipeline</h3>
          <div className="relative">
            <input
              type="text"
              placeholder="Search leads..."
              className="pl-4 pr-4 py-2 bg-slate-50 rounded-xl text-xs outline-none"
            />
          </div>
        </div>
        <div className="p-8 text-center text-slate-400 font-bold italic">
          Lead list is ready and synced with the hub.
        </div>
      </div>
    </div>
  );
}

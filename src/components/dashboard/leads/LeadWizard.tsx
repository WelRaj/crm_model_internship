"use client";

import { useState } from "react";
import { 
  CheckCircle, 
  UserPlus, 
  FileText, 
  Clock, 
  Send, 
  ThumbsUp, 
  Target 
} from "lucide-react";
import Step1LeadInfo from "./Step1LeadInfo";
import Step2Requirements from "./Step2Requirements";
import Step3FollowUp from "./Step3FollowUp";
import Step4Proposal from "./Step4Proposal";
import Step5Approval from "./Step5Approval";
import Step6LeadStatus from "./Step6LeadStatus";

const STEPS = [
  { id: 1, title: "Lead Info", description: "Basic client details", icon: UserPlus },
  { id: 2, title: "Requirements", description: "Project & Budget info", icon: FileText },
  { id: 3, title: "Follow Up", description: "Communication logs", icon: Clock },
  { id: 4, title: "Proposal", description: "Quotations & Files", icon: Send },
  { id: 5, title: "Approval", description: "Management Review", icon: ThumbsUp },
  { id: 6, title: "Lead Status", description: "Final Deal Outcome", icon: Target },
];

export default function LeadWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Lead Basic Info
    leadId: "LEAD-2024-001",
    firstName: "",
    lastName: "",
    companyName: "",
    designation: "",
    personalEmail: "",
    officialEmail: "",
    mobile: "",
    alternateMobile: "",
    city: "",
    state: "",
    country: "India",
    leadSource: "",
    assignedTo: "",
    leadDate: new Date().toISOString().split('T')[0],
    
    // Step 2: Requirement Details
    serviceRequired: "",
    projectType: "New Project",
    platformRequired: "Web",
    projectDescription: "",
    technologyPreference: "",
    referenceLink: "",
    timeline: "3 Months",
    startDate: "",
    minBudget: "",
    maxBudget: "",
    currency: "INR",
    paymentMode: "Milestone Based",
    specialNotes: "",

    // Common
    tags: "Warm",
  });

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

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500">
      {/* Vertical Sidebar for Steps */}
      <aside className="w-full lg:w-80 shrink-0">
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden sticky top-24">
          <div className="p-6 bg-primary text-white">
            <h3 className="font-bold text-lg">Lead Generation</h3>
            <p className="text-xs text-white/70 mt-1">Convert enquiries into deals</p>
          </div>
          <nav className="p-4 space-y-2">
            {STEPS.map((step) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              const Icon = step.icon;

              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(step.id)}
                  className={`w-full text-left p-4 rounded-xl transition-all flex items-start gap-4 group ${
                    isActive 
                      ? "bg-accent text-primary shadow-lg ring-1 ring-accent" 
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className={`mt-1 shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    isCompleted ? "bg-green-100 text-green-600" : isActive ? "bg-primary text-white" : "bg-slate-100 text-slate-400"
                  }`}>
                    {isCompleted ? <CheckCircle size={18} /> : <Icon size={18} />}
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${isActive ? "text-primary" : "text-primary"}`}>
                      {step.title}
                    </p>
                    <p className={`text-[10px] mt-0.5 ${isActive ? "text-primary/70" : "text-secondary"}`}>
                      {step.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </nav>
          
          <div className="p-6 bg-slate-50 border-t border-border mt-2">
             <div className="flex justify-between items-center text-[10px] font-black mb-2">
                <span className="text-secondary uppercase tracking-widest">Pipeline Stage</span>
                <span className="text-primary">{Math.round(((currentStep - 1) / STEPS.length) * 100)}%</span>
             </div>
             <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent transition-all duration-700 ease-in-out" 
                  style={{ width: `${((currentStep - 1) / STEPS.length) * 100}%` }}
                />
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden min-h-[600px] flex flex-col">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
            <div>
              <h2 className="text-2xl font-black text-primary flex items-center gap-3">
                <span className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center text-sm">{currentStep}</span>
                {STEPS[currentStep - 1].title}
              </h2>
              <p className="text-secondary text-sm mt-1 ml-11">
                {STEPS[currentStep - 1].description}
              </p>
            </div>
            <div className="flex items-center gap-2">
               <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold uppercase tracking-wider border border-amber-200">
                  {formData.tags} Lead
               </span>
               <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                  {formData.leadId}
               </span>
            </div>
          </div>
          <div className="p-8 flex-1">
            {renderStep()}
          </div>
        </div>
      </div>
    </div>
  );
}


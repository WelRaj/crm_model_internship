"use client";

import { useState } from "react";
import { 
  CheckCircle, 
  UserPlus,
  Briefcase,
  FileText,
  Shield,
  GraduationCap,
  ClipboardCheck
} from "lucide-react";
import Step1Registration from "./Step1Registration";
import Step2Employment from "./Step2Employment";
import Step3Documents from "./Step3Documents";
import Step4Verification from "./Step4Verification";
import Step5Training from "./Step5Training";
import Step6Approval from "./Step6Approval";

const STEPS = [
  { id: 1, title: "Registration", description: "Personal & Address details", icon: UserPlus },
  { id: 2, title: "Employment", description: "Department & Role details", icon: Briefcase },
  { id: 3, title: "Documents", description: "Upload KYC & Certificates", icon: FileText },
  { id: 4, title: "Verification", description: "HR Document Review", icon: ClipboardCheck },
  { id: 5, title: "Training", description: "Company Orientation", icon: GraduationCap },
  { id: 6, title: "Approval", description: "Final Management Sign-off", icon: Shield },
];

export default function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1
    employeeId: "EMP-2024-001",
    firstName: "",
    middleName: "",
    lastName: "",
    personalEmail: "",
    mobile: "",
    alternateMobile: "",
    dob: "",
    gender: "",
    maritalStatus: "",
    currentAddress: { street: "", city: "", state: "", pincode: "" },
    permanentAddress: { street: "", city: "", state: "", pincode: "" },
    emergencyContact: { name: "", relation: "", mobile: "" },
    category: "Fresher",
    // Step 2
    department: "",
    designation: "",
    employeeType: "Permanent",
    reportingManager: "",
    doj: "",
    workLocation: "Office",
    shiftTiming: "Morning",
    probationPeriod: "3 Months",
    officialEmail: "",
    status: "Active",
  });

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1Registration data={formData} updateData={setFormData} onNext={nextStep} />;
      case 2: return <Step2Employment data={formData} updateData={setFormData} onNext={nextStep} onPrev={prevStep} />;
      case 3: return <Step3Documents category={formData.category} onNext={nextStep} onPrev={prevStep} />;
      case 4: return <Step4Verification data={formData} onNext={nextStep} onPrev={prevStep} />;
      case 5: return <Step5Training data={formData} onNext={nextStep} onPrev={prevStep} />;
      case 6: return <Step6Approval data={formData} onPrev={prevStep} />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500">
      {/* Vertical Sidebar for Steps */}
      <aside className="w-full lg:w-80 shrink-0">
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden sticky top-24">
          <div className="p-6 bg-primary text-white">
            <h3 className="font-bold text-lg">Employee Onboarding</h3>
            <p className="text-xs text-white/70 mt-1">Complete all steps to activate employee</p>
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
                  <div className={`mt-1 shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-colors ${
                    isCompleted ? "bg-green-100 text-green-600" : isActive ? "bg-primary text-white" : "bg-slate-100 text-slate-400"
                  }`}>
                    {isCompleted ? <CheckCircle size={18} /> : <Icon size={18} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-primary">
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
                <span className="text-secondary uppercase tracking-widest">Overall Progress</span>
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

      {/* Main Form Area */}
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
               <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                  {formData.employeeId}
               </span>
               <span className="px-3 py-1 bg-accent/20 text-primary rounded-full text-[10px] font-bold uppercase tracking-wider border border-accent/30">
                  {formData.category}
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

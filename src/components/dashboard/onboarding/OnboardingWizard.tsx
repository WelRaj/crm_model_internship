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

interface OnboardingDocument {
  id: string;
  name: string;
  required: boolean;
  multiple?: boolean;
  fileNames: string[];
  status: "Pending" | "Under Review" | "Verified" | "Rejected";
  date: string;
  verifiedBy: string;
  remarks: string;
}

interface TrainingTask {
  id: number;
  label: string;
  completed: boolean;
}

interface ApprovalRecord {
  role: string;
  status: "Pending" | "Approved" | "Rejected";
  name: string;
  date: string;
}

interface DocumentRequirement {
  name: string;
  required: boolean;
  multiple?: boolean;
}

interface OnboardingData {
  employeeId: string;
  firstName: string;
  middleName: string;
  lastName: string;
  personalEmail: string;
  mobile: string;
  alternateMobile: string;
  dob: string;
  gender: string;
  maritalStatus: string;
  currentAddress: { street: string; city: string; state: string; pincode: string };
  permanentAddress: { street: string; city: string; state: string; pincode: string };
  emergencyContact: { name: string; relation: string; mobile: string };
  category: string;
  department: string;
  designation: string;
  employeeType: string;
  reportingManager: string;
  doj: string;
  workLocation: string;
  shiftTiming: string;
  probationPeriod: string;
  officialEmail: string;
  status: string;
  documents: OnboardingDocument[];
  trainingTasks: TrainingTask[];
  approvals: ApprovalRecord[];
  onboardingStatus: string;
}

const fresherDocs: DocumentRequirement[] = [
  { name: "10th Marksheet", required: true },
  { name: "12th Marksheet", required: true },
  { name: "Graduation Degree / Certificate", required: true },
  { name: "Internship Certificate (if applicable)", required: false },
  { name: "Aadhaar Card (Front + Back)", required: true },
  { name: "PAN Card", required: true },
  { name: "Passport Size Photo", required: true },
  { name: "Resume / CV", required: true },
  { name: "Bank Details (Cancelled Cheque / Passbook)", required: true },
];

const experiencedDocs: DocumentRequirement[] = [
  { name: "10th Marksheet", required: true },
  { name: "12th Marksheet", required: true },
  { name: "Graduation Degree / Certificate", required: true },
  { name: "Present Company Offer Letter", required: true },
  { name: "All Prev. Company Relieving Letters", required: true, multiple: true },
  { name: "All Semester Marksheets (Separate)", required: true, multiple: true },
  { name: "Aadhaar Card (Front + Back)", required: true },
  { name: "PAN Card", required: true },
  { name: "Passport Size Photo", required: true },
  { name: "Resume / CV", required: true },
  { name: "Other Documents", required: false, multiple: true },
  { name: "Bank Details (Cancelled Cheque / Passbook)", required: true },
];

function makeDocuments(category: string): OnboardingDocument[] {
  const docs = category === "Experienced" ? experiencedDocs : fresherDocs;
  return docs.map((doc, index) => ({
    id: `DOC-${String(index + 1).padStart(2, "0")}`,
    name: doc.name,
    required: doc.required,
    multiple: doc.multiple,
    fileNames: [],
    status: "Pending",
    date: "-",
    verifiedBy: "-",
    remarks: "",
  }));
}

const defaultTrainingTasks: TrainingTask[] = [
  { id: 1, label: "Company Overview Completed", completed: true },
  { id: 2, label: "Reporting Team Introduced", completed: true },
  { id: 3, label: "Software Delivery Process Reviewed", completed: false },
  { id: 4, label: "Engineering Standards Shared", completed: false },
  { id: 5, label: "Information Security Policy Explained", completed: false },
  { id: 6, label: "Client Communication Guidelines Shared", completed: false },
  { id: 7, label: "Trading Software Product Training Completed", completed: false },
  { id: 8, label: "Compliance / NDA Signed", completed: false },
];

const defaultApprovals: ApprovalRecord[] = [
  { role: "HR Manager", status: "Pending", name: "Sunita Sharma", date: "-" },
  { role: "Technical Manager", status: "Pending", name: "Vikram Rathore", date: "-" },
  { role: "Finance Team", status: "Pending", name: "Neha Gupta", date: "-" },
  { role: "Director", status: "Pending", name: "Anjali Singh", date: "-" },
];

const STEPS = [
  { id: 1, title: "Registration", description: "Personal and address details", icon: UserPlus },
  { id: 2, title: "Employment", description: "Department and role details", icon: Briefcase },
  { id: 3, title: "Documents", description: "Upload KYC & Certificates", icon: FileText },
  { id: 4, title: "Verification", description: "HR Document Review", icon: ClipboardCheck },
  { id: 5, title: "Training", description: "Company and product orientation", icon: GraduationCap },
  { id: 6, title: "Approval", description: "Final Management Sign-off", icon: Shield },
];

export default function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<OnboardingData>({
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
    documents: makeDocuments("Fresher"),
    trainingTasks: defaultTrainingTasks,
    approvals: defaultApprovals,
    onboardingStatus: "Draft",
  });

  const updateFormData = (nextData: OnboardingData | ((current: OnboardingData) => OnboardingData)) => {
    const resolved = typeof nextData === "function" ? nextData(formData) : nextData;
    const categoryChanged = resolved.category !== formData.category;
    setFormData({
      ...resolved,
      documents: categoryChanged ? makeDocuments(resolved.category) : resolved.documents,
    });
  };

  const required = (values: string[]) => values.every((value) => String(value || "").trim().length > 0);

  const validateStep = (step: number) => {
    if (step === 1) {
      const valid = required([
        formData.firstName,
        formData.lastName,
        formData.personalEmail,
        formData.mobile,
        formData.dob,
        formData.gender,
        formData.maritalStatus,
        formData.currentAddress.street,
        formData.currentAddress.city,
        formData.currentAddress.state,
        formData.currentAddress.pincode,
        formData.permanentAddress.street,
        formData.permanentAddress.city,
        formData.permanentAddress.state,
        formData.permanentAddress.pincode,
        formData.emergencyContact.name,
        formData.emergencyContact.relation,
        formData.emergencyContact.mobile,
      ]);
      if (!valid) return "Complete all required registration, address and emergency contact fields.";
      if (!formData.personalEmail.includes("@")) return "Enter a valid personal email.";
      if (formData.mobile.length < 10 || formData.emergencyContact.mobile.length < 10) return "Enter valid mobile numbers.";
    }
    if (step === 2) {
      const valid = required([formData.department, formData.designation, formData.reportingManager, formData.doj, formData.officialEmail]);
      if (!valid) return "Complete department, designation, reporting manager, joining date and official email.";
      if (!formData.officialEmail.includes("@")) return "Enter a valid official email.";
    }
    if (step === 3) {
      const missingDocs = formData.documents.filter((doc: OnboardingDocument) => doc.required && doc.fileNames.length === 0);
      if (missingDocs.length > 0) return `Upload required documents: ${missingDocs.map((doc: OnboardingDocument) => doc.name).join(", ")}.`;
    }
    if (step === 4) {
      const badDocs = formData.documents.filter((doc: OnboardingDocument) => doc.required && doc.status !== "Verified");
      if (badDocs.length > 0) return "All required documents must be verified before training.";
    }
    if (step === 5) {
      const pendingTraining = formData.trainingTasks.filter((task: TrainingTask) => !task.completed);
      if (pendingTraining.length > 0) return "Complete all training and compliance tasks before final approval.";
    }
    return "";
  };

  const nextStep = () => {
    const message = validateStep(currentStep);
    if (message) {
      setError(message);
      return;
    }
    setError("");
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
  };
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const goToStep = (step: number) => {
    if (step <= currentStep) {
      setError("");
      setCurrentStep(step);
      return;
    }
    for (let index = 1; index < step; index += 1) {
      const message = validateStep(index);
      if (message) {
        setError(message);
        setCurrentStep(index);
        return;
      }
    }
    setError("");
    setCurrentStep(step);
  };

  const updateDocument = (id: string, patch: Partial<OnboardingDocument>) => {
    setFormData((current) => ({
      ...current,
      documents: current.documents.map((doc: OnboardingDocument) => doc.id === id ? { ...doc, ...patch } : doc),
    }));
  };

  const updateTrainingTask = (id: number) => {
    setFormData((current) => ({
      ...current,
      trainingTasks: current.trainingTasks.map((task: TrainingTask) => task.id === id ? { ...task, completed: !task.completed } : task),
    }));
  };

  const updateApproval = (role: string, status: ApprovalRecord["status"]) => {
    setFormData((current) => ({
      ...current,
      approvals: current.approvals.map((approval: ApprovalRecord) =>
        approval.role === role ? { ...approval, status, date: new Date().toLocaleString("en-IN") } : approval
      ),
    }));
  };

  const finishOnboarding = () => {
    const trainingError = validateStep(5);
    if (trainingError) {
      setError(trainingError);
      return false;
    }
    const pendingApprovals = formData.approvals.filter((approval: ApprovalRecord) => approval.status !== "Approved");
    if (pendingApprovals.length > 0) {
      setError(`Pending approvals: ${pendingApprovals.map((approval: ApprovalRecord) => approval.role).join(", ")}.`);
      return false;
    }
    setError("");
    setFormData((current) => ({ ...current, onboardingStatus: "Completed" }));
    return true;
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1Registration data={formData} updateData={updateFormData} onNext={nextStep} />;
      case 2: return <Step2Employment data={formData} updateData={updateFormData} onNext={nextStep} onPrev={prevStep} />;
      case 3: return <Step3Documents category={formData.category} documents={formData.documents} updateDocument={updateDocument} onNext={nextStep} onPrev={prevStep} />;
      case 4: return <Step4Verification data={formData} documents={formData.documents} updateDocument={updateDocument} onNext={nextStep} onPrev={prevStep} />;
      case 5: return <Step5Training data={formData} tasks={formData.trainingTasks} toggleTask={updateTrainingTask} onNext={nextStep} onPrev={prevStep} />;
      case 6: return <Step6Approval data={formData} approvals={formData.approvals} updateApproval={updateApproval} onFinish={finishOnboarding} onPrev={prevStep} />;
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
                  onClick={() => goToStep(step.id)}
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
            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {error}
              </div>
            )}
            {renderStep()}
          </div>
        </div>
      </div>
    </div>
  );
}

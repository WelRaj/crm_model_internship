import type { Dispatch, SetStateAction } from "react";

export type LeadDepartment = "Trading" | "Projects";
export type LeadRole = "Super Admin" | "Team Lead" | "Telecaller";
export type LeadSource = "Website" | "Google Ads" | "Referral" | "LinkedIn" | "Walk In" | "WhatsApp" | "Email" | "Facebook" | "Instagram" | "Other Social Media";
export type TradingLeadStatus = "New" | "Assigned" | "Contacted" | "Interested" | "Follow-up" | "Qualified" | "Converted" | "Lost" | "Not Interested";
export type ProjectLeadStatus = "New Enquiry" | "Requirement Discussed" | "Proposal Pending" | "Proposal Sent" | "Negotiation" | "Won" | "Project Created" | "Lost";

// Shared Base Fields
export type BaseLead = {
  id: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  source: string;
  status: TradingLeadStatus | ProjectLeadStatus;
  assignedTo: string;
  currentOwnerId: string;
  teamLeaderId: string;
  transferHistory: TransferLog[];
  remarks: string;
  followUpDate: string;
};

export type TransferLog = {
  from: string;
  to: string;
  timestamp: string;
  reason: string;
};

export type LeadAssignment = {
  id: string;
  leadType: LeadDepartment;
  assignedTo: string;
  count: number;
  mode: "Auto" | "Manual";
  date: string;
};

// Trading Specific Fields
export type TradingLead = BaseLead & {
  department: "Trading";
  interestLevel: "High" | "Medium" | "Low";
  tradingInterest: string;
  budget: number;
  experienceLevel: "Beginner" | "Intermediate" | "Expert";
  riskAppetite: "Low" | "Medium" | "High";
  kycStatus: "Pending" | "Completed";
  dematStatus: "Active" | "Not Opened";
  accountStatus?: "Needs Account Opening" | "Account Opened" | "App Help Needed" | "Issue Resolved";
  issueType?: "Account Opening" | "Trading App" | "Website" | "Payment" | "General Query";
  availability?: "Available" | "Not Available" | "Call Back Later";
  lastCallNote?: string;
};

// Project Specific Fields
export type ProjectLead = BaseLead & {
  department: "Projects";
  projectType: string;
  requirementSummary: string;
  budget: number;
  timeline: string;
  proposalStatus: "Pending" | "Sent" | "Negotiation" | "Won" | "Lost";
  quotationStatus: "Draft" | "Sent" | "Approved";
  meetingDate?: string;
  developmentStatus?: "Not Started" | "Discovery" | "UI/UX" | "Development" | "Testing" | "Delivered";
  developmentProgress?: number;
  developmentOwner?: string;
};

export type Lead = TradingLead | ProjectLead;

export const leadSourceOptions: LeadSource[] = ["Website", "Google Ads", "Referral", "LinkedIn", "Walk In", "WhatsApp", "Email", "Facebook", "Instagram", "Other Social Media"];

export type LeadDraft = {
  leadId: string;
  leadDate: string;
  department: LeadDepartment;
  leadSource: string;
  sourceDetail: string;
  firstName: string;
  lastName: string;
  companyName: string;
  designation: string;
  personalEmail: string;
  officialEmail: string;
  mobile: string;
  alternateMobile: string;
  assignedTo: string;
  city: string;
  state: string;
  country: string;
  serviceRequired: string;
  projectType: string;
  platformRequired: string;
  timeline: string;
  projectDescription: string;
  technologyPreference: string;
  referenceLink: string;
  currency: string;
  minBudget: number | "";
  maxBudget: number | "";
  paymentMode: string;
  followUpDate: string;
  proposalNo: string;
  proposalDate: string;
  amount: number | "";
  remarks: string;
  decision: string;
  reviewerRole: string;
  comments: string;
  status: string;
  priority: string;
  expectedValue: number | "";
  finalValue: number | "";
  closeDate: string;
  lossReason: string;
  competitorName: string;
  overallRemarks: string;
};

export type LeadRecord = {
  id: string;
  date: string;
  name: string;
  company: string;
  mobile: string;
  email: string;
  service: string;
  platform: string;
  source: string;
  status: string;
  assigned: string;
  value: string;
};

export type LeadDraftUpdater = Dispatch<SetStateAction<LeadDraft>>;

export function mergeLeadDraft(newData: Partial<LeadDraft>) {
  return (previous: LeadDraft): LeadDraft => ({ ...previous, ...newData });
}

export type LeadStepProps = {
  data: LeadDraft;
  updateData: LeadDraftUpdater;
  onNext: () => void;
  onPrev: () => void;
  onComplete?: (finalData?: Partial<LeadDraft>) => void;
};

export function createLeadDraft(): LeadDraft {
  const today = new Date().toISOString().split("T")[0];
  const idSuffix = Math.floor(100000 + Math.random() * 900000);

  return {
    leadId: `LEAD-${idSuffix}`,
    leadDate: today,
    department: "Trading",
    leadSource: "",
    sourceDetail: "",
    firstName: "",
    lastName: "",
    companyName: "",
    designation: "",
    personalEmail: "",
    officialEmail: "",
    mobile: "",
    alternateMobile: "",
    assignedTo: "",
    city: "",
    state: "",
    country: "India",
    serviceRequired: "",
    projectType: "",
    platformRequired: "",
    timeline: "",
    projectDescription: "",
    technologyPreference: "",
    referenceLink: "",
    currency: "INR",
    minBudget: "",
    maxBudget: "",
    paymentMode: "",
    followUpDate: "",
    proposalNo: "",
    proposalDate: today,
    amount: "",
    remarks: "",
    decision: "",
    reviewerRole: "",
    comments: "",
    status: "Interested",
    priority: "Medium",
    expectedValue: "",
    finalValue: "",
    closeDate: "",
    lossReason: "",
    competitorName: "",
    overallRemarks: "",
  };
}

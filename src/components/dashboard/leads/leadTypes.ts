import type { Dispatch, SetStateAction } from "react";

export type LeadDepartment = "Trading" | "Projects";
export type LeadRole = "Super Admin" | "Team Lead" | "Telecaller";
export type TelecallerId = "Tele-1" | "Tele-2" | "Tele-3";
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
  assignedTo: TelecallerId;
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

export const telecallers: Array<{ id: TelecallerId; employeeId: string; name: string; group: string; activeLeads: number }> = [
  { id: "Tele-1", employeeId: "EMP-2024-021", name: "Asha Verma", group: "North Desk", activeLeads: 18 },
  { id: "Tele-2", employeeId: "EMP-2024-022", name: "Neeraj Singh", group: "North Desk", activeLeads: 14 },
  { id: "Tele-3", employeeId: "EMP-2024-023", name: "Pooja Khan", group: "North Desk", activeLeads: 11 },
];

export const leadSourceOptions: LeadSource[] = ["Website", "Google Ads", "Referral", "LinkedIn", "Walk In", "WhatsApp", "Email", "Facebook", "Instagram", "Other Social Media"];

const owners = ["Asha Verma", "Neeraj Singh", "Pooja Khan"];
const ownerIds: TelecallerId[] = ["Tele-1", "Tele-2", "Tele-3"];
const sources: LeadSource[] = ["Website", "Google Ads", "Referral", "LinkedIn", "WhatsApp", "Email", "Facebook", "Instagram", "Other Social Media", "Walk In"];

export const projectLeadSeedData: ProjectLead[] = Array.from({ length: 20 }, (_, index) => {
  const ownerIndex = index % ownerIds.length;
  const statusList: ProjectLeadStatus[] = ["New Enquiry", "Requirement Discussed", "Proposal Pending", "Proposal Sent", "Negotiation", "Won", "Project Created", "Lost"];
  const projectTypes = ["CRM Web App", "ERP Portal", "Mobile App", "Website", "SaaS Dashboard", "DevOps Audit", "E-commerce Store", "Loan CRM", "HRMS Portal", "Accounting System"];
  const budgets = [250000, 420000, 650000, 850000, 1200000, 1500000, 300000, 540000, 980000, 1750000];
  const status = statusList[index % statusList.length];

  return {
    id: `PRJ-${String(2001 + index).padStart(4, "0")}`,
    firstName: ["Aarav", "Priya", "Rohan", "Meera", "Kabir", "Anaya", "Dev", "Nisha", "Arjun", "Sara"][index % 10],
    lastName: ["Mehta", "Nair", "Saini", "Singh", "Khan", "Sharma", "Patel", "Verma", "Gupta", "Rao"][index % 10],
    mobile: `9${String(600000000 + index * 17321).slice(0, 9)}`,
    email: `projectlead${index + 1}@example.com`,
    source: sources[index % sources.length],
    status,
    assignedTo: owners[ownerIndex],
    currentOwnerId: ownerIds[ownerIndex],
    teamLeaderId: "TL-1",
    transferHistory: [],
    remarks: "Project enquiry captured for requirement discussion and proposal follow-up.",
    followUpDate: `2026-07-${String((index % 20) + 1).padStart(2, "0")}`,
    department: "Projects",
    projectType: projectTypes[index % projectTypes.length],
    requirementSummary: `${projectTypes[index % projectTypes.length]} requirement with role-based access, reporting, notifications, and admin workflow.`,
    budget: budgets[index % budgets.length],
    timeline: ["4 weeks", "8 weeks", "12 weeks", "16 weeks", "6 months"][index % 5],
    proposalStatus: status === "Proposal Sent" || status === "Negotiation" || status === "Won" ? "Sent" : status === "Lost" ? "Lost" : "Pending",
    quotationStatus: status === "Proposal Sent" || status === "Negotiation" || status === "Won" ? "Sent" : "Draft",
    meetingDate: `2026-07-${String((index % 20) + 2).padStart(2, "0")}`,
    developmentStatus: status === "Project Created" ? "Development" : status === "Won" ? "Discovery" : "Not Started",
    developmentProgress: status === "Project Created" ? 45 : status === "Won" ? 12 : 0,
    developmentOwner: status === "Project Created" || status === "Won" ? "Development Team" : "Unassigned",
  };
});

export const tradingLeadSeedData: TradingLead[] = Array.from({ length: 20 }, (_, index) => {
  const ownerIndex = index % ownerIds.length;
  const statusList: TradingLeadStatus[] = ["New", "Assigned", "Contacted", "Interested", "Follow-up", "Qualified", "Converted", "Lost", "Not Interested"];
  const issueTypes: NonNullable<TradingLead["issueType"]>[] = ["Account Opening", "Trading App", "Website", "Payment", "General Query"];
  const accountStatuses: NonNullable<TradingLead["accountStatus"]>[] = ["Needs Account Opening", "Account Opened", "App Help Needed", "Issue Resolved"];
  const interests = ["Account Opening", "Equity Intraday", "Options Advisory", "Mutual Funds", "Portfolio Review", "App Login Help", "Payment Help"];
  const status = statusList[index % statusList.length];

  return {
    id: `TRD-${String(1001 + index).padStart(4, "0")}`,
    firstName: ["Raj", "Meena", "Faiz", "Kavya", "Harsh", "Isha", "Manav", "Tara", "Yash", "Zoya"][index % 10],
    lastName: ["Kumar", "Shah", "Ali", "Joshi", "Bora", "Kapoor", "Jain", "Mishra", "Yadav", "Qureshi"][index % 10],
    mobile: `8${String(700000000 + index * 21987).slice(0, 9)}`,
    email: `tradinglead${index + 1}@example.com`,
    source: sources[index % sources.length],
    status,
    assignedTo: owners[ownerIndex],
    currentOwnerId: ownerIds[ownerIndex],
    teamLeaderId: "TL-1",
    transferHistory: [],
    remarks: "Telecaller lead for account opening, trading app support, or investment interest follow-up.",
    followUpDate: `2026-07-${String((index % 20) + 1).padStart(2, "0")}`,
    department: "Trading",
    interestLevel: index % 3 === 0 ? "High" : index % 3 === 1 ? "Medium" : "Low",
    tradingInterest: interests[index % interests.length],
    budget: [15000, 30000, 50000, 75000, 100000, 125000, 200000][index % 7],
    experienceLevel: index % 3 === 0 ? "Beginner" : index % 3 === 1 ? "Intermediate" : "Expert",
    riskAppetite: index % 3 === 0 ? "Low" : index % 3 === 1 ? "Medium" : "High",
    kycStatus: index % 2 === 0 ? "Pending" : "Completed",
    dematStatus: index % 4 === 0 ? "Not Opened" : "Active",
    accountStatus: accountStatuses[index % accountStatuses.length],
    issueType: issueTypes[index % issueTypes.length],
    availability: index % 3 === 0 ? "Available" : index % 3 === 1 ? "Call Back Later" : "Not Available",
    lastCallNote: "Customer call note pending update after next telecaller interaction.",
  };
});

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
    overallRemarks: "",
  };
}

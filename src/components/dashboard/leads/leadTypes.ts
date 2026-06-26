export type LeadDraft = {
  leadId: string;
  leadDate?: string;
  country?: string;
  currency?: string;
  status?: string;
  tags?: string;
  leadSource?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  designation?: string;
  personalEmail?: string;
  officialEmail?: string;
  mobile?: string;
  alternateMobile?: string;
  assignedTo?: string;
  city?: string;
  state?: string;
  serviceRequired?: string;
  projectType?: string;
  platformRequired?: string;
  timeline?: string;
  projectDescription?: string;
  technologyPreference?: string;
  referenceLink?: string;
  minBudget?: number;
  maxBudget?: number;
  paymentMode?: string;
  proposalNo?: string;
  proposalDate?: string;
  amount?: number;
  remarks?: string;
  reviewerRole?: string;
  decision?: string;
  comments?: string;
  priority?: string;
  expectedValue?: number;
  finalValue?: number;
  closeDate?: string;
  lossReason?: string;
  overallRemarks?: string;
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

export type LeadStepProps = {
  data?: LeadDraft;
  updateData?: (newData: unknown) => void;
  onNext: () => void;
  onPrev?: () => void;
  onComplete?: () => void;
};

export const createLeadDraft = (): LeadDraft => ({
  leadId: `LEAD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`,
  leadDate: new Date().toISOString().split("T")[0],
  country: "India",
  currency: "INR",
  status: "Negotiation",
});

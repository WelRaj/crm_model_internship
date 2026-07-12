"use client";

import { useState } from "react";
import { CheckCircle2, ChevronLeft, Save } from "lucide-react";
import { leadSourceOptions, type LeadSource, type TradingLead, type TradingLeadStatus } from "./leadTypes";

type TradingForm = {
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  source: LeadSource;
  sourceDetail: string;
  issueType: NonNullable<TradingLead["issueType"]>;
  accountStatus: NonNullable<TradingLead["accountStatus"]>;
  availability: NonNullable<TradingLead["availability"]>;
  status: TradingLeadStatus;
  tradingInterest: string;
  budget: string;
  experienceLevel: TradingLead["experienceLevel"];
  riskAppetite: TradingLead["riskAppetite"];
  kycStatus: TradingLead["kycStatus"];
  dematStatus: TradingLead["dematStatus"];
  followUpDate: string;
  note: string;
};

const today = new Date().toISOString().split("T")[0];

const initialForm: TradingForm = {
  firstName: "",
  lastName: "",
  mobile: "",
  email: "",
  source: "Website",
  sourceDetail: "",
  issueType: "Account Opening",
  accountStatus: "Needs Account Opening",
  availability: "Available",
  status: "Assigned",
  tradingInterest: "Account Opening",
  budget: "",
  experienceLevel: "Beginner",
  riskAppetite: "Low",
  kycStatus: "Pending",
  dematStatus: "Not Opened",
  followUpDate: today,
  note: "",
};

export default function TradingLeadCreate({ onBack, onSave }: { onBack: () => void; onSave: (lead: TradingLead) => void }) {
  const [form, setForm] = useState<TradingForm>(initialForm);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const update = (field: keyof TradingForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
  };

  const submit = () => {
    const mobile = form.mobile.replace(/\D/g, "");
    const budget = Number(form.budget || 0);

    if (!form.firstName.trim() || !form.mobile.trim() || !form.note.trim() || !form.tradingInterest.trim()) {
      setError("First name, mobile, trading interest and call note are required.");
      return;
    }
    if (!/^[0-9]{10}$/.test(mobile)) {
      setError("Mobile number must be 10 digits.");
      return;
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (form.source === "Other Social Media" && !form.sourceDetail.trim()) {
      setError("Source detail is required for Other Social Media.");
      return;
    }
    if (form.budget && (!Number.isFinite(budget) || budget < 0)) {
      setError("Investment budget cannot be negative.");
      return;
    }
    if (!form.followUpDate) {
      setError("Follow-up date is required.");
      return;
    }

    onSave({
      id: `TRD-${Math.floor(3000 + Math.random() * 6000)}`,
      firstName: form.firstName,
      lastName: form.lastName,
      mobile,
      email: form.email || "N/A",
      source: form.source === "Other Social Media" && form.sourceDetail ? `${form.source}: ${form.sourceDetail}` : form.source,
      status: form.status,
      assignedTo: "Unassigned",
      currentOwnerId: "",
      teamLeaderId: "TL-1",
      transferHistory: [],
      remarks: form.note,
      followUpDate: form.followUpDate,
      department: "Trading",
      interestLevel: form.status === "Interested" ? "High" : "Medium",
      tradingInterest: form.tradingInterest,
      budget,
      experienceLevel: form.experienceLevel,
      riskAppetite: form.riskAppetite,
      kycStatus: form.kycStatus,
      dematStatus: form.dematStatus,
      accountStatus: form.accountStatus,
      issueType: form.issueType,
      availability: form.availability,
      lastCallNote: form.note,
    });
    setSaved(true);
    setTimeout(onBack, 1000);
  };

  if (saved) {
    return (
      <div className="rounded-[2.5rem] border border-slate-100 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 size={54} />
        </div>
        <h3 className="text-3xl font-black tracking-tight text-primary">Trading Enquiry Added</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 shadow-sm hover:text-primary">
          <ChevronLeft size={24} />
        </button>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Trading Client Enquiry</p>
          <h2 className="text-2xl font-black text-primary">Create Trading Lead</h2>
        </div>
      </div>

      <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm">
        {error ? <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-black text-red-600">{error}</div> : null}
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="First Name *" value={form.firstName} onChange={(value) => update("firstName", value)} />
          <Field label="Last Name" value={form.lastName} onChange={(value) => update("lastName", value)} />
          <Field label="Mobile *" value={form.mobile} onChange={(value) => update("mobile", value)} />
          <Field label="Email" value={form.email} onChange={(value) => update("email", value)} />
          <Field label="Source" options={leadSourceOptions} value={form.source} onChange={(value) => update("source", value)} />
          {form.source === "Other Social Media" ? <Field label="Source Detail *" value={form.sourceDetail} onChange={(value) => update("sourceDetail", value)} /> : null}
          <Field label="Issue Type" options={["Account Opening", "Trading App", "Website", "Payment", "General Query"]} value={form.issueType} onChange={(value) => update("issueType", value)} />
          <Field label="Account / App Status" options={["Needs Account Opening", "Account Opened", "App Help Needed", "Issue Resolved"]} value={form.accountStatus} onChange={(value) => update("accountStatus", value)} />
          <Field label="Customer Availability" options={["Available", "Not Available", "Call Back Later"]} value={form.availability} onChange={(value) => update("availability", value)} />
          <Field label="Call Status" options={["Assigned", "Contacted", "Interested", "Not Interested", "Follow-up", "Converted", "Lost"]} value={form.status} onChange={(value) => update("status", value)} />
          <Field label="Trading Requirement *" value={form.tradingInterest} onChange={(value) => update("tradingInterest", value)} />
          <Field label="Investment Budget" type="number" value={form.budget} onChange={(value) => update("budget", value)} />
          <Field label="Experience" options={["Beginner", "Intermediate", "Expert"]} value={form.experienceLevel} onChange={(value) => update("experienceLevel", value)} />
          <Field label="Risk Appetite" options={["Low", "Medium", "High"]} value={form.riskAppetite} onChange={(value) => update("riskAppetite", value)} />
          <Field label="KYC Status" options={["Pending", "Completed"]} value={form.kycStatus} onChange={(value) => update("kycStatus", value)} />
          <Field label="Demat Status" options={["Active", "Not Opened"]} value={form.dematStatus} onChange={(value) => update("dematStatus", value)} />
          <Field label="Follow-up Date *" type="date" value={form.followUpDate} onChange={(value) => update("followUpDate", value)} />
          <Field label="Call Note *" multiline value={form.note} onChange={(value) => update("note", value)} />
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={submit} className="flex h-11 items-center gap-2 rounded-xl bg-accent px-5 text-xs font-black uppercase tracking-widest text-slate-950">
            <Save size={15} /> Save Trading Enquiry
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", options, optionLabels, multiline }: { label: string; value: string; onChange: (value: string) => void; type?: string; options?: string[]; optionLabels?: Record<string, string>; multiline?: boolean }) {
  return (
    <label className={multiline ? "space-y-2 md:col-span-3" : "space-y-2"}>
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
      {options ? (
        <select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-bold text-primary outline-none">
          {options.map((option) => <option key={option} value={option}>{optionLabels?.[option] || option}</option>)}
        </select>
      ) : multiline ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} className="w-full rounded-xl border border-border p-3 text-sm font-semibold text-primary outline-none" />
      ) : (
        <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-border px-3 text-sm font-bold text-primary outline-none" />
      )}
    </label>
  );
}

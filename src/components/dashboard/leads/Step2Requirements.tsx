"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ArrowRight, ArrowLeft } from "lucide-react";

export default function Step2Requirements({ data, updateData, onNext, onPrev }: any) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    updateData({ ...data, [name]: value });
  };

  const services = [
    "Website Development", "Web App", "Mobile App", "UI-UX", 
    "Digital Marketing", "SEO", "CRM", "ERP", "E-Commerce", "Custom Software"
  ];

  const projectTypes = ["New Project", "Existing Project Upgrade", "Maintenance"];
  const platforms = ["Web", "Android", "iOS", "Both", "All"];
  const timelines = ["1 Month", "3 Months", "6 Months", "1 Year", "Custom"];
  const currencies = ["INR", "USD", "AED", "GBP"];
  const paymentModes = ["One Time", "Monthly", "Milestone Based"];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-secondary">Service Required <span className="text-red-500">*</span></label>
          <select name="serviceRequired" value={data.serviceRequired} onChange={handleChange} required className="flex h-11 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="">Select Service</option>
            {services.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-secondary">Project Type <span className="text-red-500">*</span></label>
          <select name="projectType" value={data.projectType} onChange={handleChange} required className="flex h-11 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            {projectTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-secondary">Platform Required <span className="text-red-500">*</span></label>
          <select name="platformRequired" value={data.platformRequired} onChange={handleChange} required className="flex h-11 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            {platforms.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-secondary">Timeline <span className="text-red-500">*</span></label>
          <select name="timeline" value={data.timeline} onChange={handleChange} required className="flex h-11 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            {timelines.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-secondary">Project Description <span className="text-red-500">*</span></label>
        <textarea 
          name="projectDescription" 
          value={data.projectDescription} 
          onChange={handleChange} 
          required 
          rows={4}
          className="flex w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Detailed requirements..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input label="Technology Preference" name="technologyPreference" value={data.technologyPreference} onChange={handleChange} placeholder="e.g. Next.js, Flutter, etc." />
        <Input label="Reference Website / App Link" name="referenceLink" value={data.referenceLink} onChange={handleChange} placeholder="https://..." />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-6 border-t border-slate-100">
        <div className="md:col-span-1">
          <label className="text-sm font-medium text-secondary">Currency</label>
          <select name="currency" value={data.currency} onChange={handleChange} className="flex h-11 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            {currencies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <Input label="Min Budget" name="minBudget" value={data.minBudget} onChange={handleChange} type="number" required />
        <Input label="Max Budget" name="maxBudget" value={data.maxBudget} onChange={handleChange} type="number" required />
        <div className="md:col-span-1">
          <label className="text-sm font-medium text-secondary">Payment Mode</label>
          <select name="paymentMode" value={data.paymentMode} onChange={handleChange} className="flex h-11 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            {paymentModes.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      <div className="flex justify-between pt-8">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={onNext} className="bg-primary">
          Save & Next <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}


"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ArrowRight } from "lucide-react";

export default function Step1LeadInfo({ data, updateData, onNext }: any) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    updateData({ ...data, [name]: value });
  };

  const sources = [
    "Website", "Google Ads", "Referral", "Cold Call", "LinkedIn", 
    "WhatsApp", "Upwork", "Fiverr", "Walk In", "Event"
  ];

  const salesTeam = ["Vikram Rathore", "Sunita Sharma", "Rajesh Kumar", "Anjali Singh"];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Input label="Lead ID" value={data.leadId} disabled className="bg-slate-50 font-bold text-primary" />
        <Input label="Lead Date" type="date" name="leadDate" value={data.leadDate} onChange={handleChange} required />
        
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-secondary">Lead Source <span className="text-red-500">*</span></label>
          <select name="leadSource" value={data.leadSource} onChange={handleChange} required className="flex h-11 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="">Select Source</option>
            {sources.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <Input label="Client First Name" name="firstName" value={data.firstName} onChange={handleChange} required />
        <Input label="Client Last Name" name="lastName" value={data.lastName} onChange={handleChange} required />
        <Input label="Company Name" name="companyName" value={data.companyName} onChange={handleChange} required />
        
        <Input label="Designation / Role" name="designation" value={data.designation} onChange={handleChange} />
        <Input label="Personal Email" type="email" name="personalEmail" value={data.personalEmail} onChange={handleChange} required />
        <Input label="Official Email" type="email" name="officialEmail" value={data.officialEmail} onChange={handleChange} />
        
        <Input label="Mobile Number" type="tel" name="mobile" value={data.mobile} onChange={handleChange} required />
        <Input label="Alternate Mobile" type="tel" name="alternateMobile" value={data.alternateMobile} onChange={handleChange} />
        
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-secondary">Assigned To <span className="text-red-500">*</span></label>
          <select name="assignedTo" value={data.assignedTo} onChange={handleChange} required className="flex h-11 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="">Select Executive</option>
            {salesTeam.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="pt-6 border-t border-slate-100">
        <h4 className="font-bold text-primary mb-4">Location Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Input label="City" name="city" value={data.city} onChange={handleChange} required />
          <Input label="State" name="state" value={data.state} onChange={handleChange} required />
          <Input label="Country" name="country" value={data.country} onChange={handleChange} required />
        </div>
      </div>

      <div className="flex justify-end pt-8">
        <Button onClick={onNext} className="w-full md:w-auto bg-primary">
          Save & Next <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}


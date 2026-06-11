"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ArrowRight, ArrowLeft } from "lucide-react";

export default function Step2Employment({ data, updateData, onNext, onPrev }: any) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    updateData({ ...data, [name]: value });
  };

  const departments = ["Development", "UI-UX", "QA", "HR", "Sales", "Finance", "Marketing"];
  
  const designationMapping: Record<string, string[]> = {
    "Development": ["Frontend Developer", "Backend Developer", "Full Stack Developer", "Mobile App Developer", "DevOps Engineer"],
    "UI-UX": ["UI Designer", "UX Designer", "Product Designer", "Graphic Designer"],
    "QA": ["Manual Tester", "Automation Engineer", "QA Lead", "Security Tester"],
    "HR": ["HR Manager", "Recruiter", "HR Executive", "Operations Manager"],
    "Sales": ["Sales Executive", "Business Development Manager", "Account Manager"],
    "Finance": ["Accountant", "Finance Controller", "Billing Executive"],
    "Marketing": ["Digital Marketer", "SEO Specialist", "Content Writer", "Social Media Manager"]
  };

  const employeeTypes = ["Permanent", "Contract", "Intern"];
  const locations = ["Office", "Remote", "Hybrid"];
  const shifts = ["Morning", "Evening", "Night", "Flexible"];
  const probations = ["3 Months", "6 Months"];

  const currentDesignations = data.department ? designationMapping[data.department] || [] : [];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-secondary">
            Department <span className="text-red-500">*</span>
          </label>
          <select 
            name="department" 
            value={data.department} 
            onChange={(e) => {
              handleChange(e);
              // Reset designation when department changes
              updateData({ ...data, department: e.target.value, designation: "" });
            }} 
            required 
            className="flex h-11 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select Department</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-secondary">
            Designation <span className="text-red-500">*</span>
          </label>
          <select 
            name="designation" 
            value={data.designation} 
            onChange={handleChange} 
            required 
            disabled={!data.department}
            className="flex h-11 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-slate-50 disabled:text-slate-400"
          >
            <option value="">{data.department ? "Select Designation" : "First select a department"}</option>
            {currentDesignations.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-secondary">
            Employee Type <span className="text-red-500">*</span>
          </label>
          <select name="employeeType" value={data.employeeType} onChange={handleChange} required className="flex h-11 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            {employeeTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <Input label="Reporting Manager" name="reportingManager" value={data.reportingManager} onChange={handleChange} required />
        
        <Input label="Date of Joining" type="date" name="doj" value={data.doj} onChange={handleChange} required />

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-secondary">
            Work Location <span className="text-red-500">*</span>
          </label>
          <select name="workLocation" value={data.workLocation} onChange={handleChange} required className="flex h-11 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            {locations.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-secondary">
            Shift Timing <span className="text-red-500">*</span>
          </label>
          <select name="shiftTiming" value={data.shiftTiming} onChange={handleChange} required className="flex h-11 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            {shifts.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-secondary">
            Probation Period <span className="text-red-500">*</span>
          </label>
          <select name="probationPeriod" value={data.probationPeriod} onChange={handleChange} required className="flex h-11 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            {probations.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <Input label="Official Company Email" type="email" name="officialEmail" value={data.officialEmail} onChange={handleChange} required />

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-secondary">
            Employee Status <span className="text-red-500">*</span>
          </label>
          <select name="status" value={data.status} onChange={handleChange} required className="flex h-11 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="On Hold">On Hold</option>
          </select>
        </div>
      </div>

      <div className="flex justify-between pt-8">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={onNext}>
          Save & Next <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}


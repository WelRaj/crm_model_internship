"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ArrowRight, Camera } from "lucide-react";

export default function Step1Registration({ data, updateData, onNext }: any) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      updateData({
        ...data,
        [parent]: { ...data[parent], [child]: value }
      });
    } else {
      updateData({ ...data, [name]: value });
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Photo Upload Placeholder */}
        <div className="md:col-span-3 flex items-center space-x-6 pb-4 border-b border-slate-100">
          <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-50 transition-colors">
            <Camera size={24} />
            <span className="text-[10px] mt-1 font-medium">Upload Photo</span>
          </div>
          <div className="space-y-1">
            <h4 className="font-semibold text-primary">Profile Photo</h4>
            <p className="text-xs text-secondary">Upload a professional passport size photo (Max 2MB)</p>
            <Input label="Employee ID" value={data.employeeId} disabled className="bg-slate-50 mt-2 h-9" />
          </div>
        </div>

        <Input label="First Name" name="firstName" value={data.firstName} onChange={handleChange} required />
        <Input label="Middle Name" name="middleName" value={data.middleName} onChange={handleChange} />
        <Input label="Last Name" name="lastName" value={data.lastName} onChange={handleChange} required />
        
        <Input label="Personal Email" type="email" name="personalEmail" value={data.personalEmail} onChange={handleChange} required />
        <Input label="Mobile Number" type="tel" name="mobile" value={data.mobile} onChange={handleChange} required />
        <Input label="Alternate Mobile" type="tel" name="alternateMobile" value={data.alternateMobile} onChange={handleChange} />
        
        <Input label="Date of Birth" type="date" name="dob" value={data.dob} onChange={handleChange} required />
        
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-secondary">
            Gender <span className="text-red-500">*</span>
          </label>
          <select name="gender" value={data.gender} onChange={handleChange} required className="flex h-11 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-secondary">
            Marital Status <span className="text-red-500">*</span>
          </label>
          <select name="maritalStatus" value={data.maritalStatus} onChange={handleChange} required className="flex h-11 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="">Select Status</option>
            <option value="Single">Single</option>
            <option value="Married">Married</option>
            <option value="Divorced">Divorced</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-secondary">
            Category <span className="text-red-500">*</span>
          </label>
          <select name="category" value={data.category} onChange={handleChange} required className="flex h-11 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="Fresher">Fresher</option>
            <option value="Experienced">Experienced</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100">
        <div className="space-y-4">
          <h4 className="font-bold text-primary">Current Address</h4>
          <Input label="Street Address" name="currentAddress.street" value={data.currentAddress.street} onChange={handleChange} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="City" name="currentAddress.city" value={data.currentAddress.city} onChange={handleChange} required />
            <Input label="State" name="currentAddress.state" value={data.currentAddress.state} onChange={handleChange} required />
          </div>
          <Input label="Pincode" name="currentAddress.pincode" value={data.currentAddress.pincode} onChange={handleChange} required />
        </div>

        <div className="space-y-4">
          <h4 className="font-bold text-primary">Permanent Address</h4>
          <Input label="Street Address" name="permanentAddress.street" value={data.permanentAddress.street} onChange={handleChange} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="City" name="permanentAddress.city" value={data.permanentAddress.city} onChange={handleChange} required />
            <Input label="State" name="permanentAddress.state" value={data.permanentAddress.state} onChange={handleChange} required />
          </div>
          <Input label="Pincode" name="permanentAddress.pincode" value={data.permanentAddress.pincode} onChange={handleChange} required />
        </div>
      </div>

      <div className="pt-6 border-t border-slate-100">
        <h4 className="font-bold text-primary mb-4">Emergency Contact</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Input label="Contact Name" name="emergencyContact.name" value={data.emergencyContact.name} onChange={handleChange} required />
          <Input label="Relation" name="emergencyContact.relation" value={data.emergencyContact.relation} onChange={handleChange} required />
          <Input label="Mobile Number" name="emergencyContact.mobile" value={data.emergencyContact.mobile} onChange={handleChange} required />
        </div>
      </div>

      <div className="flex justify-end pt-8">
        <Button onClick={onNext} className="w-full md:w-auto">
          Save & Next <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}


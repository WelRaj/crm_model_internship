"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Download, Landmark, Plus, ReceiptText, ShieldCheck, 
  Truck, WalletCards, X, CheckCircle2 
} from "lucide-react";
import { 
  AccountingPage, ActionButton, DataTable, Field, 
  MetricCard, Panel, StatusBadge 
} from "./AccountingComponents";

// --- Validation Schema ---
const vendorSchema = z.object({
  vendorName: z.string().min(3, "Vendor name is too short"),
  contactPerson: z.string().optional(),
  email: z.string().email("Invalid email").or(z.literal("")),
  mobile: z.string().regex(/^[0-9]{10}$/, "Enter 10-digit number").or(z.literal("")),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GSTIN").or(z.literal("")),
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN").or(z.literal("")),
  status: z.string().min(1, "Status is required"),
  category: z.string().min(1, "Category is required"),
  tds: z.string().default("No"),
  bankName: z.string().optional(),
  accountNo: z.string().optional(),
  ifsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC").or(z.literal("")),
  address: z.string().optional(),
});

type VendorFormData = z.infer<typeof vendorSchema>;

const initialVendors = [
  { id: "VEN-001", name: "Amazon Web Services India", category: "Cloud Hosting", gstin: "29AAICA3918J1ZK", tds: "2%", monthly: "INR 2,45,000", status: "Active" },
  { id: "VEN-002", name: "Razorpay Software Pvt Ltd", category: "Payment Gateway", gstin: "29AAICR2714C1Z7", tds: "2%", monthly: "INR 38,000", status: "Active" },
  { id: "VEN-003", name: "Airtel Business", category: "Internet", gstin: "07AAACB2894G1ZR", tds: "0%", monthly: "INR 18,500", status: "Active" },
  { id: "VEN-004", name: "TechDepot Hardware", category: "Hardware", gstin: "06AAFFT3344G1Z1", tds: "1%", monthly: "INR 0", status: "Review" },
];

export default function Step2Vendors() {
  const [vendors, setVendors] = useState(initialVendors);
  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VendorFormData>({
    resolver: zodResolver(vendorSchema as any),
    defaultValues: {
      status: "Active",
      category: "Software Licenses",
      tds: "No",
    }
  });

  const onSubmit = (data: VendorFormData) => {
    const newVendor = {
      id: `VEN-00${vendors.length + 1}`,
      name: data.vendorName,
      category: data.category,
      gstin: data.gstin || "N/A",
      tds: data.tds === "No" ? "0%" : data.tds.split("-")[1]?.trim() || "0%",
      monthly: "INR 0",
      status: data.status,
    };

    setVendors([newVendor, ...vendors]);
    setSuccessMsg(true);
    setTimeout(() => {
      setSuccessMsg(false);
      setShowForm(false);
      reset();
    }, 2000);
  };

  return (
    <AccountingPage
      title="Vendor Master"
      description="Maintain vendor, bank, GST, PAN, recurring subscription, and TDS setup for all company expenses."
      icon={Truck}
      badge="Expense foundation"
      actions={
        <>
          <ActionButton icon={Download} label="Export Vendors" variant="outline" />
          <ActionButton 
            icon={Plus} 
            label="New Vendor" 
            variant="accent" 
            onClick={() => setShowForm(true)}
          />
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active Vendors" value={String(vendors.filter(v => v.status === "Active").length)} helper="Total registered" icon={Truck} tone="blue" />
        <MetricCard label="Monthly Commitments" value="INR 6.8L" helper="Subscriptions and utilities" icon={WalletCards} tone="amber" />
        <MetricCard label="GST Input Vendors" value={String(vendors.filter(v => v.gstin !== "N/A").length)} helper="Eligible input credit" icon={ReceiptText} tone="green" />
        <MetricCard label="Bank Verified" value="88%" helper="IFSC and account mapped" icon={Landmark} tone="purple" />
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-8 relative animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setShowForm(false)}
              className="absolute right-8 top-8 p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-primary transition-all"
            >
              <X size={24} />
            </button>

            {successMsg ? (
              <div className="py-20 text-center space-y-4 animate-in zoom-in-95">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={48} />
                </div>
                <h3 className="text-2xl font-black text-primary">Vendor Added Successfully!</h3>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Expense master has been updated.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
                <div className="flex justify-between items-end">
                  <div>
                    <h3 className="text-2xl font-black text-primary tracking-tight">Vendor Registration</h3>
                    <p className="text-slate-500 font-medium mt-1">Setup vendor profile, tax settings, and banking details.</p>
                  </div>
                  <StatusBadge tone="blue">Step 2 of 16</StatusBadge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    <Panel title="Basic Details" description="Primary identification and contact info.">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Field label="Vendor Name" placeholder="Amazon Web Services" required register={register("vendorName")} error={errors.vendorName?.message} />
                        <Field label="Contact Person" placeholder="Account Manager Name" register={register("contactPerson")} />
                        <Field label="Email" type="email" placeholder="billing@vendor.com" register={register("email")} error={errors.email?.message} />
                        <Field label="Mobile" placeholder="9876543210" register={register("mobile")} error={errors.mobile?.message} />
                        <Field label="Category" options={["Software Licenses", "Cloud Hosting", "Hardware", "Internet", "Rent", "Consultant", "Marketing", "Travel"]} required register={register("category")} error={errors.category?.message} />
                        <Field label="Status" options={["Active", "Inactive", "Review", "Blocked"]} required register={register("status")} error={errors.status?.message} />
                      </div>
                    </Panel>

                    <Panel title="Tax & Compliance" description="GST, PAN and TDS settings for payout accuracy.">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Field label="GSTIN" placeholder="29AAICA3918J1ZK" register={register("gstin")} error={errors.gstin?.message} />
                        <Field label="PAN Number" placeholder="AAICA3918J" register={register("pan")} error={errors.pan?.message} />
                        <Field label="TDS Applicable" options={["No", "Yes - 1%", "Yes - 2%", "Yes - 10%"]} register={register("tds")} />
                      </div>
                    </Panel>
                  </div>

                  <div className="space-y-8">
                    <Panel title="Bank Details" description="Required for automated payouts.">
                      <div className="space-y-6">
                        <Field label="Bank Name" placeholder="HDFC Bank" register={register("bankName")} />
                        <Field label="Account Number" placeholder="50200012345678" register={register("accountNo")} />
                        <Field label="IFSC Code" placeholder="HDFC0001234" register={register("ifsc")} error={errors.ifsc?.message} />
                        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                           <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Security Check</p>
                           <p className="text-xs font-bold text-blue-700 leading-5">Bank details will be used for NEFT/IMPS transfers. Ensure accuracy before saving.</p>
                        </div>
                      </div>
                    </Panel>
                  </div>
                </div>

                <div className="grid grid-cols-1">
                   <Field label="Full Address" placeholder="Company registered address" multiline register={register("address")} />
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                  <ActionButton label="Cancel" variant="outline" onClick={() => setShowForm(false)} />
                  <ActionButton label="Save Vendor Record" variant="accent" type="submit" />
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Panel 
        title="Vendor Directory" 
        description="Mapped vendors are used in expenses, GST input calculation, vendor TDS, and budget consumption."
        actions={<StatusBadge tone="blue">{vendors.length} Vendors Registered</StatusBadge>}
      >
        <DataTable columns={["Vendor", "Category", "GSTIN", "TDS", "Monthly Spend", "Status"]}>
          {vendors.map((vendor) => (
            <tr key={vendor.id} className="text-sm group hover:bg-slate-50 transition-colors">
              <td className="px-4 py-4">
                <p className="font-black text-primary">{vendor.name}</p>
                <p className="text-xs font-semibold text-slate-500">{vendor.id}</p>
              </td>
              <td className="px-4 py-4 font-semibold text-slate-600">{vendor.category}</td>
              <td className="px-4 py-4 font-semibold text-slate-600 font-mono text-[11px]">{vendor.gstin}</td>
              <td className="px-4 py-4 font-black text-primary">{vendor.tds}</td>
              <td className="px-4 py-4 font-black text-primary">{vendor.monthly}</td>
              <td className="px-4 py-4">
                <StatusBadge tone={vendor.status === "Active" ? "green" : "amber"}>{vendor.status}</StatusBadge>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </AccountingPage>
  );
}



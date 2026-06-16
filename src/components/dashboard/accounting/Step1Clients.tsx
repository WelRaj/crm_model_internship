"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Download, Plus, Search, ShieldCheck, Users, 
  Wallet, AlertTriangle, X, CheckCircle2 
} from "lucide-react";
import {
  AccountingPage, ActionButton, DataTable, Field,
  MetricCard, Panel, StatusBadge
} from "./AccountingComponents";

// --- Validation Schema ---
const clientSchema = z.object({
  companyName: z.string().min(3, "Company name is too short"),
  contactPerson: z.string().min(3, "Contact person name is required"),
  email: z.string().email("Invalid email address"),
  mobile: z.string().regex(/^[0-9]{10}$/, "Enter a valid 10-digit mobile number"),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GSTIN format"),
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format"),
  status: z.string().min(1, "Status is required"),
  terms: z.string().min(1, "Payment terms are required"),
  address: z.string().min(10, "Full billing address is required"),
  currency: z.string().default("INR"),
});

type ClientFormData = z.infer<typeof clientSchema>;

const initialClients = [
  { id: "CL-24001", name: "Apex Finserve Pvt Ltd", contact: "Rohit Mehta", gstin: "27AAHCA8123D1Z6", terms: "Net 15", status: "Active", outstanding: "INR 4,80,000" },
  { id: "CL-24002", name: "Nexa Retail Cloud", contact: "Priya Nair", gstin: "29AAECN4471B1ZW", terms: "50% Advance", status: "Active", outstanding: "INR 0" },
  { id: "CL-24003", name: "Bluebird Logistics", contact: "Amit Soni", gstin: "06AAGCB9122K1ZP", terms: "Milestone", status: "On Hold", outstanding: "INR 1,25,000" },
  { id: "CL-24004", name: "KraftEdge Export LLP", contact: "Neha Jain", gstin: "07AAIFK2210M1Z4", terms: "Net 30", status: "Blacklisted", outstanding: "INR 78,500" },
];

export default function Step1Clients() {
  const [clients, setClients] = useState(initialClients);
  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema as any),
    defaultValues: {
      status: "Active",
      terms: "Net 15",
      currency: "INR",
    }
  });

  const onSubmit = (data: ClientFormData) => {
    const newClient = {
      id: `CL-2400${clients.length + 1}`,
      name: data.companyName,
      contact: data.contactPerson,
      gstin: data.gstin,
      terms: data.terms,
      status: data.status,
      outstanding: "INR 0",
    };

    setClients([newClient, ...clients]);
    setSuccessMsg(true);
    setTimeout(() => {
      setSuccessMsg(false);
      setShowForm(false);
      reset();
    }, 2000);
  };

  return (
    <AccountingPage
      title="Client Master"
      description="Central client record used by quotations, invoices, payments, TDS certificates, reminders, and project billing."
      icon={Users}
      badge="Single source of truth"
      actions={
        <>
          <ActionButton icon={Search} label="Search GSTIN" variant="outline" />
          <ActionButton icon={Download} label="Export Clients" variant="outline" />
          <ActionButton
            icon={Plus}
            label="New Client"
            variant="accent"
            onClick={() => setShowForm(true)}
          />
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active Clients" value={String(clients.filter(c => c.status === "Active").length)} helper="Total in database" icon={Users} tone="blue" />
        <MetricCard label="Receivables" value="INR 18.7L" helper="Open approved invoices" icon={Wallet} tone="amber" />
        <MetricCard label="GST Verified" value="94%" helper="GSTIN and PAN mapped" icon={ShieldCheck} tone="green" />
        <MetricCard label="Credit Risk" value={String(clients.filter(c => c.status === "Blacklisted" || c.status === "On Hold").length)} helper="Risk flagged" icon={AlertTriangle} tone="red" />        
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-8 relative animate-in zoom-in-95 duration-300">
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
                <h3 className="text-2xl font-black text-primary">Client Registered Successfully!</h3>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Master record has been updated.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <div>
                  <h3 className="text-2xl font-black text-primary tracking-tight">Register New Client</h3>
                  <p className="text-slate-500 font-medium mt-1">Fill in the registered company details for tax compliance.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Field label="Company Name" placeholder="Apex Finserve Pvt Ltd" required register={register("companyName")} error={errors.companyName?.message} />
                  <Field label="Contact Person" placeholder="John Doe" required register={register("contactPerson")} error={errors.contactPerson?.message} />
                  <Field label="Email Address" type="email" placeholder="accounts@apex.com" required register={register("email")} error={errors.email?.message} />
                  <Field label="Mobile Number" placeholder="9876543210" required register={register("mobile")} error={errors.mobile?.message} />
                  <Field label="GSTIN" placeholder="27AAHCA8123D1Z6" required register={register("gstin")} error={errors.gstin?.message} />
                  <Field label="PAN Number" placeholder="AAHCA8123D" required register={register("pan")} error={errors.pan?.message} />
                  <Field label="Client Status" options={["Active", "Inactive", "On Hold", "Blacklisted"]} required register={register("status")} error={errors.status?.message} />
                  <Field label="Payment Terms" options={["100% Advance", "50% Advance", "Net 7", "Net 15", "Net 30", "Milestone"]} required register={register("terms")} error={errors.terms?.message} />
                  <Field label="Currency" options={["INR", "USD", "AED", "GBP", "EUR"]} register={register("currency")} />
                </div>

                <div className="grid grid-cols-1 gap-6">
                   <Field label="Billing Address" placeholder="123, Business Center, Mumbai, Maharashtra - 400001" multiline required register={register("address")} error={errors.address?.message} />  
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <ActionButton label="Cancel" variant="outline" onClick={() => setShowForm(false)} />
                  <ActionButton label="Create Client Record" variant="accent" type="submit" />
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Panel
        title="Client Ledger"
        description="Finance team can scan GST status, default terms, and outstanding amount before creating documents."
        actions={<StatusBadge tone="green">{clients.length} Records Found</StatusBadge>}
      >
        <DataTable columns={["Client", "GSTIN", "Payment Terms", "Outstanding", "Status"]}>
          {clients.map((client) => (
            <tr key={client.id} className="text-sm group hover:bg-slate-50 transition-colors">
              <td className="px-4 py-4">
                <p className="font-black text-primary">{client.name}</p>
                <p className="text-xs font-semibold text-slate-500">{client.id} - {client.contact}</p>
              </td>
              <td className="px-4 py-4 font-semibold text-slate-600 font-mono text-[11px]">{client.gstin}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{client.terms}</td>
              <td className="px-4 py-4 font-black text-primary">{client.outstanding}</td>
              <td className="px-4 py-4">
                <StatusBadge tone={client.status === "Active" ? "green" : client.status === "Blacklisted" ? "red" : "amber"}>
                  {client.status}
                </StatusBadge>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </AccountingPage>
  );
}

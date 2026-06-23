"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  FileText, Upload, CheckCircle2, X, Plus, 
  ShieldCheck, Download, Search,
  Clock, AlertTriangle
} from "lucide-react";
import { 
  AccountingPage, ActionButton, DataTable, Field, 
  MetricCard, Panel, StatusBadge 
} from "../accounting/AccountingComponents";

// --- Validation Schema ---
const agreementSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  projectName: z.string().min(1, "Project name is required"),
  agreementType: z.string().default("Master Service Agreement (MSA)"),
  effectiveDate: z.string().min(1, "Effective date required"),
  expiryDate: z.string().optional(),
  contractValue: z.coerce.number().min(0).optional(),
  paymentTerms: z.string().optional(),
  status: z.string().default("Draft"),
  remarks: z.string().optional(),
});

type AgreementFormInput = z.input<typeof agreementSchema>;
type AgreementFormData = z.output<typeof agreementSchema>;

type AgreementRecord = {
  id: string;
  client: string;
  project: string;
  type: string;
  date: string;
  value: string;
  status: string;
};

const clientOptions = ["Apex Finserve Pvt Ltd", "Nexa Retail Cloud", "Bluebird Logistics"];

const initialAgreements: AgreementRecord[] = [
  { id: "AGR-2024-001", client: "Nexa Retail Cloud", project: "E-commerce Mobile App", type: "MSA", date: "12 Jun 2024", value: "INR 12.5L", status: "Active" },
  { id: "AGR-2024-002", client: "Apex Finserve Pvt Ltd", project: "Loan CRM Web App", type: "SOW", date: "15 Jun 2024", value: "INR 8.4L", status: "Under Review" },
];

export default function ProjectAgreement() {
  const [agreements, setAgreements] = useState<AgreementRecord[]>(initialAgreements);
  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [clientEntryMode, setClientEntryMode] = useState<"existing" | "manual">("existing");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AgreementFormInput, unknown, AgreementFormData>({
    resolver: zodResolver(agreementSchema),
    defaultValues: {
      effectiveDate: new Date().toISOString().split('T')[0],
      agreementType: "Master Service Agreement (MSA)",
      status: "Draft"
    }
  });

  const onSubmit = (data: AgreementFormData) => {
    const newAgreement: AgreementRecord = {
      id: `AGR-${new Date().getFullYear()}-${String(agreements.length + 1).padStart(3, "0")}`,
      client: data.clientName,
      project: data.projectName,
      type: data.agreementType.includes("MSA") ? "MSA" : "SOW",
      date: new Date(data.effectiveDate).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }),
      value: data.contractValue ? `INR ${(data.contractValue/100000).toFixed(1)}L` : "TBD",
      status: data.status,
    };

    setAgreements((current) => [newAgreement, ...current]);
    setSuccessMsg(true);
    setTimeout(() => {
      setSuccessMsg(false);
      setShowForm(false);
      reset();
      setClientEntryMode("existing");
    }, 2000);
  };

  const filteredAgreements = agreements.filter((agreement) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;
    return [agreement.id, agreement.client, agreement.project, agreement.type, agreement.status, agreement.value]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  const totalValueLabel = `INR ${agreements.reduce((sum, agreement) => {
    const match = agreement.value.match(/([\d.]+)L/);
    return sum + (match ? Number(match[1]) : 0);
  }, 0).toFixed(1)}L`;

  const handleExport = () => {
    const csvRows = [
      ["Agreement ID", "Client", "Project", "Type", "Effective Date", "Value", "Status"],
      ...filteredAgreements.map((agreement) => [
        agreement.id,
        agreement.client,
        agreement.project,
        agreement.type,
        agreement.date,
        agreement.value,
        agreement.status,
      ]),
    ];
    const csv = csvRows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "project-agreements.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAgreement = (agreement: AgreementRecord) => {
    const content = [
      "Project Agreement Record",
      `Agreement ID: ${agreement.id}`,
      `Client: ${agreement.client}`,
      `Project: ${agreement.project}`,
      `Type: ${agreement.type}`,
      `Effective Date: ${agreement.date}`,
      `Value: ${agreement.value}`,
      `Status: ${agreement.status}`,
    ].join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${agreement.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AccountingPage
      title="Project Agreements"
      description="Manage legal contracts, Master Service Agreements (MSA), and Statements of Work (SOW) with integrated PDF tracking."
      icon={ShieldCheck}
      badge="Legal Compliance"
      actions={
        <>
          <ActionButton icon={Download} label="Export" variant="outline" onClick={handleExport} />
          <ActionButton 
            icon={Plus} 
            label="New Agreement" 
            variant="accent" 
            onClick={() => setShowForm(true)}
          />
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active Contracts" value={String(agreements.filter(a => a.status === "Active").length)} helper="Legally binding" icon={FileText} tone="blue" />
        <MetricCard label="Under Review" value={String(agreements.filter(a => a.status === "Under Review").length)} helper="Awaiting signature" icon={Clock} tone="amber" />
        <MetricCard label="Contract Value" value={totalValueLabel} helper="Total book value" icon={ShieldCheck} tone="green" />
        <MetricCard label="Expiring Soon" value="02" helper="Within 30 days" icon={AlertTriangle} tone="red" />
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-10 relative animate-in zoom-in-95 duration-300">
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
                <h3 className="text-2xl font-black text-primary">Agreement Logged!</h3>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Contract record has been secured.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
                <div className="flex justify-between items-end border-b border-slate-100 pb-8">
                  <div>
                    <h3 className="text-3xl font-black text-primary tracking-tight">Register Project Agreement</h3>
                    <p className="text-slate-500 font-medium mt-1">Upload signed documents and link them to clients and financial value.</p>
                  </div>
                  <StatusBadge tone="blue">Legal Hub</StatusBadge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  <div className="lg:col-span-3 space-y-10">
                    <Panel title="Contract Details" description="Basic identification and scope.">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                              Client Name <span className="text-red-500">*</span>
                            </label>
                            <div className="inline-flex rounded-xl border border-border bg-slate-50 p-1">
                              {(["existing", "manual"] as const).map((mode) => (
                                <button
                                  key={mode}
                                  type="button"
                                  onClick={() => setClientEntryMode(mode)}
                                  className={`h-8 rounded-lg px-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                                    clientEntryMode === mode ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-primary"
                                  }`}
                                >
                                  {mode === "existing" ? "Existing" : "New"}
                                </button>
                              ))}
                            </div>
                          </div>
                          {clientEntryMode === "existing" ? (
                            <Field label="Select Existing Client" options={clientOptions} register={register("clientName")} error={errors.clientName?.message} />
                          ) : (
                            <Field label="New Client Name" placeholder="Type client/company name" register={register("clientName")} error={errors.clientName?.message} />
                          )}
                        </div>
                        <Field label="Project Name" placeholder="e.g. Enterprise Dashboard v2" required register={register("projectName")} error={errors.projectName?.message} />
                        <Field label="Agreement Type" options={["Master Service Agreement (MSA)", "Statement of Work (SOW)", "Non-Disclosure Agreement (NDA)", "Service Level Agreement (SLA)"]} register={register("agreementType")} />
                        <Field label="Effective Date" type="date" required register={register("effectiveDate")} error={errors.effectiveDate?.message} />
                        <Field label="Expiry / Review Date" type="date" register={register("expiryDate")} />
                        <Field label="Contract Value (INR)" type="number" register={register("contractValue")} />
                      </div>
                    </Panel>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <Panel title="Financial Terms" description="Payment schedules and milestones.">
                          <Field label="Payment Milestones" multiline placeholder="e.g. 30% Advance, 40% UAT, 30% Deployment" register={register("paymentTerms")} />
                       </Panel>

                       <Panel title="Legal Attachment" description="Upload the signed agreement PDF.">
                          <div className="p-6 border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50 flex flex-col items-center justify-center text-center group hover:border-primary transition-all cursor-pointer h-full">
                             <Upload className="text-primary mb-3" size={32} />
                             <p className="text-[10px] font-black text-primary uppercase tracking-widest">Signed PDF Upload</p>
                             <p className="text-[10px] text-slate-400 mt-1 font-bold">PDF, MAX 15MB</p>
                             <button type="button" className="mt-4 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase text-primary hover:shadow-md transition-all">Browse File</button>
                          </div>
                       </Panel>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <Panel title="Lifecycle Status" description="Set current legal state.">
                      <div className="space-y-6">
                        <Field label="Agreement Status" options={["Draft", "Under Review", "Sent for Signature", "Active", "Expired", "Terminated"]} register={register("status")} />
                        
                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex gap-3">
                           <ShieldCheck className="text-emerald-600 shrink-0" size={18} />
                           <p className="text-[10px] font-bold text-emerald-800 leading-4">Active agreements are automatically used to validate new Invoices and Quotations.</p>
                        </div>

                        <div className="flex flex-col gap-3">
                          <ActionButton label="Secure Record" variant="accent" type="submit" />
                          <ActionButton label="Save as Draft" variant="outline" onClick={() => setShowForm(false)} />
                        </div>
                      </div>
                    </Panel>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Panel 
        title="Agreement Repository" 
        description="Unified registry of all legal project documents and active MSAs."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search contracts..."
                className="h-9 w-56 rounded-xl border border-border bg-white pl-9 pr-3 text-xs font-bold text-primary outline-none focus:ring-4 focus:ring-primary/10"
              />
            </div>
            <StatusBadge tone="green">{filteredAgreements.length} Contracts</StatusBadge>
          </div>
        }
      >
        <DataTable columns={["Agreement ID", "Client & Project", "Type", "Effective Date", "Value", "Status", "Actions"]}>
          {filteredAgreements.map((note) => (
            <tr key={note.id} className="text-sm group hover:bg-slate-50 transition-colors">
              <td className="px-4 py-4">
                 <p className="font-black text-primary">{note.id}</p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest tracking-tighter">Legal Master</p>
              </td>
              <td className="px-4 py-4">
                <p className="font-black text-primary">{note.client}</p>
                <p className="text-xs font-semibold text-slate-500">{note.project}</p>
              </td>
              <td className="px-4 py-4">
                <StatusBadge tone="blue">{note.type}</StatusBadge>
              </td>
              <td className="px-4 py-4 font-semibold text-slate-600">{note.date}</td>
              <td className="px-4 py-4 font-black text-primary">{note.value}</td>
              <td className="px-4 py-4">
                <StatusBadge tone={note.status === "Active" ? "green" : "amber"}>{note.status}</StatusBadge>
              </td>
              <td className="px-4 py-4 text-right">
                <button type="button" onClick={() => handleDownloadAgreement(note)} className="text-primary hover:underline font-black text-[10px] uppercase tracking-widest flex items-center justify-end gap-2 ml-auto">
                   <Download size={14} /> Agreement
                </button>
              </td>
            </tr>
          ))}
        </DataTable>
        {filteredAgreements.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-border bg-slate-50 p-6 text-center text-xs font-black uppercase tracking-widest text-slate-400">
            No agreements found
          </div>
        ) : null}
      </Panel>
    </AccountingPage>
  );
}

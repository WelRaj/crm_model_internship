"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Calculator, Download, FileCheck2, Landmark, 
  Percent, ReceiptText, Upload, Wallet, X, 
  CheckCircle2, Info, Plus 
} from "lucide-react";
import { 
  AccountingPage, ActionButton, DataTable, Field, 
  MetricCard, Panel, StatusBadge 
} from "./AccountingComponents";

// --- Validation Schema ---
const tdsSchema = z.object({
  type: z.enum(["Client TDS (Receivable)", "Vendor TDS (Payable)"]),
  referenceId: z.string().min(1, "Reference ID is required"),
  partyName: z.string().min(1, "Party name is required"),
  taxableAmount: z.coerce.number().min(1, "Taxable amount required"),
  tdsRate: z.string().min(1, "Select TDS rate"),
  certificateNo: z.string().optional(),
  certificateStatus: z.string().default("Pending"),
  status: z.string().default("Ready"),
  remarks: z.string().optional(),
});

type TdsFormData = z.infer<typeof tdsSchema>;

const initialTdsRows = [
  { ref: "INV-2026-088", party: "Nexa Retail Cloud", type: "Client TDS", rate: "10%", amount: "INR 1,27,500", certificate: "Pending", status: "Adjusted" },
  { ref: "INV-2026-083", party: "Bluebird Logistics", type: "Client TDS", rate: "10%", amount: "INR 32,000", certificate: "Received", status: "Closed" },
  { ref: "VEN-001", party: "Amazon Web Services India", type: "Vendor TDS", rate: "2%", amount: "INR 4,900", certificate: "Generated", status: "Payable" },
  { ref: "VEN-004", party: "TechDepot Hardware", type: "Vendor TDS", rate: "1%", amount: "INR 1,120", certificate: "Pending", status: "Review" },
];

export default function Step12TDS() {
  const [tdsHistory, setTdsRows] = useState(initialTdsRows);
  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<TdsFormData>({
    resolver: zodResolver(tdsSchema as any),
    defaultValues: {
      type: "Client TDS (Receivable)",
      tdsRate: "10",
      certificateStatus: "Pending",
      status: "Ready",
      taxableAmount: 0,
    }
  });

  const watchedAmount = useWatch({ control, name: "taxableAmount" });
  const watchedRate = useWatch({ control, name: "tdsRate" });
  const watchedType = useWatch({ control, name: "type" });

  const tdsValue = (Number(watchedAmount || 0) * Number(watchedRate || 0)) / 100;

  const onSubmit = (data: TdsFormData) => {
    const newRow = {
      ref: data.referenceId,
      party: data.partyName,
      type: data.type === "Client TDS (Receivable)" ? "Client TDS" : "Vendor TDS",
      rate: `${data.tdsRate}%`,
      amount: `INR ${tdsValue.toLocaleString()}`,
      certificate: data.certificateNo || "Pending",
      status: data.type === "Client TDS (Receivable)" ? "Adjusted" : "Payable",
    };

    setTdsRows([newRow, ...tdsHistory]);
    setSuccessMsg(true);
    setTimeout(() => {
      setSuccessMsg(false);
      setShowForm(false);
      reset();
    }, 2000);
  };

  return (
    <AccountingPage
      title="TDS Management"
      description="Track client TDS deductions (Receivables) and vendor TDS liability (Payables) with automated rate computation."
      icon={Calculator}
      badge="Tax deduction"
      actions={
        <>
          <ActionButton icon={Upload} label="Upload Form 16A" variant="outline" />
          <ActionButton 
            icon={Plus} 
            label="Log TDS Entry" 
            variant="accent" 
            onClick={() => setShowForm(true)}
          />
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Client TDS" value={`INR ${(tdsHistory.filter(r => r.type === 'Client TDS').reduce((acc, r) => acc + Number(r.amount.replace(/[^0-9.-]+/g,"")), 0) / 1000).toFixed(1)}K`} helper="Receivable" icon={ReceiptText} tone="amber" />
        <MetricCard label="Vendor TDS" value={`INR ${(tdsHistory.filter(r => r.type === 'Vendor TDS').reduce((acc, r) => acc + Number(r.amount.replace(/[^0-9.-]+/g,"")), 0) / 1000).toFixed(1)}K`} helper="To deposit" icon={Landmark} tone="blue" />
        <MetricCard label="Pending Certs" value={String(tdsHistory.filter(r => r.certificate === 'Pending').length)} helper="Follow-up needed" icon={FileCheck2} tone="red" />
        <MetricCard label="Total Impact" value="INR 7.4L" helper="Adjusted in ledger" icon={Wallet} tone="green" />
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
                <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Calculator size={48} />
                </div>
                <h3 className="text-2xl font-black text-primary">TDS Entry Logged!</h3>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Tax records and ledger balances updated.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
                <div className="flex justify-between items-end border-b border-slate-100 pb-8">
                  <div>
                    <h3 className="text-3xl font-black text-primary tracking-tight">Log TDS Transaction</h3>
                    <p className="text-slate-500 font-medium mt-1">Record tax deductions on invoices or vendor bills to ensure accurate accounting.</p>
                  </div>
                  <StatusBadge tone="blue">Step 12 of 16</StatusBadge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  <div className="lg:col-span-3 space-y-8">
                    <Panel title="Classification" description="Is this TDS from a client or for a vendor?">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Field label="TDS Type" options={["Client TDS (Receivable)", "Vendor TDS (Payable)"]} required register={register("type")} />
                        <Field label="Reference (Inv/Bill ID)" placeholder="e.g. INV-2026-088" required register={register("referenceId")} error={errors.referenceId?.message} />
                        <Field label="Party Name" placeholder="Client or Vendor name" required register={register("partyName")} error={errors.partyName?.message} />
                        <Field label="Certificate Status" options={["Pending", "Received", "Generated", "Mismatch"]} register={register("certificateStatus")} />
                      </div>
                    </Panel>

                    <Panel title="Tax Computation" description="Define taxable base and applicable rate.">
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <Field label="Taxable Amount" type="number" placeholder="0.00" required register={register("taxableAmount")} error={errors.taxableAmount?.message} />
                          <Field label="TDS Rate (%)" options={["1", "2", "5", "10", "20"]} required register={register("tdsRate")} />
                          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 flex flex-col justify-center">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calculated TDS</p>
                             <p className="text-lg font-black text-primary">₹{tdsValue.toLocaleString()}</p>
                          </div>
                       </div>
                    </Panel>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <Field label="Certificate Number" placeholder="e.g. 16A-XXXXXXX" register={register("certificateNo")} />
                       <Field label="Audit Remarks" placeholder="Internal notes for reconciliation..." multiline register={register("remarks")} />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <Panel title="Ledger Logic" description="Financial impact.">
                       <div className="space-y-5">
                          <div className={`p-6 rounded-[2.5rem] text-white space-y-4 shadow-xl relative overflow-hidden ${watchedType?.includes('Client') ? 'bg-amber-500 shadow-amber-500/20' : 'bg-blue-600 shadow-blue-600/20'}`}>
                             <Percent className="absolute -right-4 -bottom-4 text-white/10" size={120} />
                             <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">TDS Adjustment</p>
                                <p className="text-4xl font-black mt-1">₹{tdsValue.toLocaleString()}</p>
                                <p className="text-[10px] font-bold mt-4 opacity-80 leading-4">
                                   {watchedType?.includes('Client') 
                                      ? "This will reduce the client's pending balance." 
                                      : "This amount must be deposited with IT Dept."}
                                </p>
                             </div>
                          </div>

                          <div className="flex flex-col gap-3">
                             <ActionButton label="Log TDS Entry" variant="accent" type="submit" />
                             <ActionButton label="Cancel" variant="outline" onClick={() => setShowForm(false)} />
                          </div>
                       </div>
                    </Panel>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-3">
                       <Info className="text-slate-400 shrink-0" size={18} />
                       <p className="text-[10px] font-bold text-slate-500 leading-4">TDS records ensure that your 'Total Outstanding' doesn't show inflated numbers when clients deduct tax.</p>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Panel title="TDS Register" description="Unified view of tax deductions across sales and purchases.">
        <DataTable columns={["Reference", "Party", "Type", "Rate", "Amount", "Certificate", "Status"]}>
          {tdsHistory.map((row) => (
            <tr key={`${row.ref}-${row.type}`} className="text-sm group hover:bg-slate-50 transition-colors">
              <td className="px-4 py-4 font-black text-primary">{row.ref}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{row.party}</td>
              <td className="px-4 py-4">
                 <StatusBadge tone={row.type === 'Client TDS' ? 'amber' : 'blue'}>{row.type}</StatusBadge>
              </td>
              <td className="px-4 py-4 font-black text-primary">{row.rate}</td>
              <td className="px-4 py-4 font-black text-primary">{row.amount}</td>
              <td className="px-4 py-4 font-semibold text-slate-500 text-xs">{row.certificate}</td>
              <td className="px-4 py-4">
                <StatusBadge tone={row.status === "Closed" || row.status === "Adjusted" ? "green" : row.status === "Review" ? "red" : "amber"}>
                  {row.status}
                </StatusBadge>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </AccountingPage>
  );
}



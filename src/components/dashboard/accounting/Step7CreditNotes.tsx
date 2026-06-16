"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Ban, CheckCircle2, FileMinus2, RotateCcw, ShieldCheck, 
  Wallet, XCircle, X, Plus, Calculator 
} from "lucide-react";
import { 
  AccountingPage, ActionButton, DataTable, Field, 
  MetricCard, Panel, StatusBadge 
} from "./AccountingComponents";

// --- Validation Schema ---
const creditNoteSchema = z.object({
  invoiceId: z.string().min(1, "Select original invoice"),
  clientId: z.string().min(1, "Client is required"),
  reason: z.string().min(1, "Reason is required"),
  creditAmount: z.coerce.number().min(1, "Amount must be greater than 0"),
  gstPercent: z.string().default("18"),
  status: z.string().default("Draft"),
  remarks: z.string().min(5, "Internal remarks required"),
  date: z.string().min(1, "Date required"),
});

type CreditNoteFormData = z.infer<typeof creditNoteSchema>;

const initialCreditNotes = [
  { id: "CN-2026-014", invoice: "INV-2026-080", client: "Orbit HR Tech", reason: "Scope reduction", amount: "INR 36,000", gst: "INR 6,480", status: "Approved" },
  { id: "CN-2026-015", invoice: "INV-2026-071", client: "KraftEdge Export LLP", reason: "Billing correction", amount: "INR 18,500", gst: "INR 3,330", status: "Pending Approval" },
  { id: "CN-2026-016", invoice: "INV-2026-066", client: "Nexa Retail Cloud", reason: "Refund adjustment", amount: "INR 42,000", gst: "INR 7,560", status: "Draft" },
];

export default function Step7CreditNotes() {
  const [creditNotes, setCreditNotes] = useState(initialCreditNotes);
  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreditNoteFormData>({
    resolver: zodResolver(creditNoteSchema as any),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      reason: "Scope Reduction",
      status: "Draft",
      gstPercent: "18",
      creditAmount: 0,
    }
  });

  const watchedAmount = useWatch({ control, name: "creditAmount" });
  const watchedGstPercent = useWatch({ control, name: "gstPercent" });

  const gstAdj = (Number(watchedAmount || 0) * Number(watchedGstPercent)) / 100;
  const totalCredit = Number(watchedAmount || 0) + gstAdj;

  const onSubmit = (data: CreditNoteFormData) => {
    const newNote = {
      id: `CN-2026-0${creditNotes.length + 17}`,
      invoice: data.invoiceId,
      client: data.clientId,
      reason: data.reason,
      amount: `INR ${data.creditAmount.toLocaleString()}`,
      gst: `INR ${gstAdj.toLocaleString()}`,
      status: data.status,
    };

    setCreditNotes([newNote, ...creditNotes]);
    setSuccessMsg(true);
    setTimeout(() => {
      setSuccessMsg(false);
      setShowForm(false);
      reset();
    }, 2000);
  };

  return (
    <AccountingPage
      title="Credit Note Management"
      description="Adjust approved invoices without breaking audit trail. Use credit notes for refunds, cancellations, GST corrections, and scope reductions."
      icon={RotateCcw}
      badge="Invoice correction"
      actions={
        <>
          <ActionButton 
            icon={FileMinus2} 
            label="Issue Credit Note" 
            variant="accent" 
            onClick={() => setShowForm(true)}
          />
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Issued This Month" value={`INR ${(creditNotes.length * 0.4).toFixed(1)}L`} helper="Before GST adjustment" icon={FileMinus2} tone="blue" />
        <MetricCard label="GST Adjustment" value="INR 20.1K" helper="Sales register impact" icon={Wallet} tone="amber" />
        <MetricCard label="Pending Approval" value={String(creditNotes.filter(n => n.status === "Pending Approval").length)} helper="Finance manager queue" icon={ShieldCheck} tone="purple" />
        <MetricCard label="Refund Risk" value="01" helper="Client escalation" icon={Ban} tone="red" />
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
                  <RotateCcw size={48} />
                </div>
                <h3 className="text-2xl font-black text-primary">Credit Note Issued!</h3>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Awaiting finance approval for ledger adjustment.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
                <div className="flex justify-between items-end border-b border-slate-100 pb-8">
                  <div>
                    <h3 className="text-3xl font-black text-primary tracking-tight">Issue Credit Note</h3>
                    <p className="text-slate-500 font-medium mt-1">Adjust ledger balances for returns, billing errors, or scope reductions.</p>
                  </div>
                  <StatusBadge tone="blue">Step 7 of 16</StatusBadge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  <div className="lg:col-span-3 space-y-8">
                    <Panel title="Adjustment Target" description="Link to the original transaction.">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Field label="Invoice Reference" options={["INV-2026-090", "INV-2026-088", "INV-2026-083", "INV-2026-080"]} required register={register("invoiceId")} error={errors.invoiceId?.message} />
                        <Field label="Client" options={["Apex Finserve Pvt Ltd", "Nexa Retail Cloud", "Bluebird Logistics", "Orbit HR Tech"]} required register={register("clientId")} error={errors.clientId?.message} />
                        <Field label="Issue Date" type="date" required register={register("date")} error={errors.date?.message} />
                      </div>
                    </Panel>

                    <Panel title="Reason & Amount" description="Why is this credit being issued?">
                       <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <Field label="Adjustment Reason" options={["Scope Reduction", "Billing Correction", "Refund Adjustment", "Project Cancelled", "GST Correction"]} required register={register("reason")} error={errors.reason?.message} />
                             <Field label="Tax Adjustment (%)" options={["0", "5", "12", "18", "28"]} register={register("gstPercent")} />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <Field label="Credit Base Amount" type="number" placeholder="Enter amount to credit" required register={register("creditAmount")} error={errors.creditAmount?.message} />
                             <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 flex flex-col justify-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calculated GST Impact</p>
                                <p className="text-lg font-black text-primary">₹{gstAdj.toLocaleString()}</p>
                             </div>
                          </div>
                          <Field label="Audit Remarks" placeholder="Detailed explanation for financial audit..." multiline required register={register("remarks")} error={errors.remarks?.message} />
                       </div>
                    </Panel>
                  </div>

                  <div className="space-y-6">
                    <Panel title="Ledger Impact" description="Financial correction preview.">
                       <div className="space-y-5">
                          <div className="p-6 bg-red-500 rounded-[2.5rem] text-white space-y-4 shadow-xl shadow-red-500/20 relative overflow-hidden">
                             <RotateCcw className="absolute -right-4 -bottom-4 text-white/5" size={120} />
                             <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Total Credit</p>
                                <p className="text-4xl font-black mt-1">₹{totalCredit.toLocaleString()}</p>
                                <p className="text-[10px] font-bold mt-4 opacity-70">This amount will be reduced from the client's outstanding balance.</p>
                             </div>
                          </div>

                          <Field label="Approval Status" options={["Draft", "Pending Approval"]} register={register("status")} />

                          <div className="flex flex-col gap-3">
                             <ActionButton label="Issue Credit Note" variant="accent" type="submit" />
                             <ActionButton label="Cancel" variant="outline" onClick={() => setShowForm(false)} />
                          </div>
                       </div>
                    </Panel>

                    <Panel title="Compliance" description="Legal notes.">
                       <div className="flex gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                          <ShieldCheck className="text-amber-600 shrink-0" size={18} />
                          <p className="text-[10px] font-bold text-amber-800 leading-4">Credit notes must be reported in GSTR-1 as sales return to adjust tax liability.</p>
                       </div>
                    </Panel>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Panel title="Credit Note Register" description="Shows commercial correction and tax adjustment in one place.">
        <DataTable columns={["Credit Note", "Invoice", "Client", "Reason", "Credit Amount", "GST Adj.", "Status"]}>
          {creditNotes.map((note) => (
            <tr key={note.id} className="text-sm group hover:bg-slate-50 transition-colors">
              <td className="px-4 py-4">
                 <p className="font-black text-primary">{note.id}</p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sales Return</p>
              </td>
              <td className="px-4 py-4 font-semibold text-slate-600">{note.invoice}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{note.client}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{note.reason}</td>
              <td className="px-4 py-4 font-black text-primary">{note.amount}</td>
              <td className="px-4 py-4 font-black text-primary">{note.gst}</td>
              <td className="px-4 py-4">
                <StatusBadge tone={note.status === "Approved" ? "green" : note.status === "Draft" ? "slate" : "amber"}>{note.status}</StatusBadge>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </AccountingPage>
  );
}




"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Banknote, CalendarCheck2, FileUp, Landmark, Plus, 
  ReceiptText, Wallet, WalletCards, X, CheckCircle2, 
  ArrowRight, Search, Info, ShieldCheck
} from "lucide-react";
import { 
  AccountingPage, ActionButton, DataTable, Field, 
  MetricCard, Panel, ProgressBar, StatusBadge 
} from "./AccountingComponents";

// --- Validation Schema ---
const paymentSchema = z.object({
  invoiceId: z.string().min(1, "Select an invoice"),
  amount: z.coerce.number().min(1, "Amount required"),
  date: z.string().min(1, "Payment date required"),
  mode: z.string().min(1, "Payment mode required"),
  reference: z.string().min(3, "Transaction ref/UTR required"),
  tdsDeducted: z.coerce.number().default(0),
  status: z.string().default("Received"),
  remarks: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

const initialMilestones = [
  { id: "PAY-101", invoice: "INV-2026-088", name: "Project Kickoff Advance", amount: "INR 4,72,000", received: "11 Jun 2026", mode: "NEFT", status: "Received" },
  { id: "PAY-102", invoice: "INV-2026-083", name: "Maintenance Fee Q1", amount: "INR 1,20,000", received: "05 Jun 2026", mode: "IMPS", status: "Received" },
];

export default function Step5Payments() {
  const [payments, setPayments] = useState(initialMilestones);
  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  // Mock Invoice data for calculations
  const [selectedInvoice, setSelectedInvoice] = useState({
    id: "INV-2026-090",
    total: 944000,
    received: 472000,
    tds: 94400,
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema as any),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      mode: "NEFT",
      status: "Received",
      amount: 0,
      tdsDeducted: 0,
    }
  });

  const watchedAmount = useWatch({ control, name: "amount" });
  const watchedTds = useWatch({ control, name: "tdsDeducted" });

  const progress = (selectedInvoice.received / selectedInvoice.total) * 100;
  const netPending = selectedInvoice.total - selectedInvoice.received - selectedInvoice.tds;

  const onSubmit = (data: PaymentFormData) => {
    const newPayment = {
      id: `PAY-${100 + payments.length + 1}`,
      invoice: data.invoiceId,
      name: `Payment against ${data.invoiceId}`,
      amount: `INR ${data.amount.toLocaleString()}`,
      received: new Date(data.date).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }),
      mode: data.mode,
      status: data.status,
    };

    setPayments([newPayment, ...payments]);
    
    // Update our mock dashboard state
    setSelectedInvoice(prev => ({
      ...prev,
      received: prev.received + data.amount,
      tds: prev.tds + data.tdsDeducted
    }));

    setSuccessMsg(true);
    setTimeout(() => {
      setSuccessMsg(false);
      setShowForm(false);
      reset();
    }, 2000);
  };

  return (
    <AccountingPage
      title="Payment Tracking"
      description="Track advance, milestone, final payment, proof uploads, TDS deduction, and outstanding amount against approved invoices."
      icon={Wallet}
      badge="Collections"
      actions={
        <>
          <ActionButton icon={FileUp} label="Upload Bulk Proofs" variant="outline" />
          <ActionButton 
            icon={Plus} 
            label="Record New Payment" 
            variant="accent" 
            onClick={() => setShowForm(true)}
          />
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Expected Total" value={`INR ${(selectedInvoice.total/100000).toFixed(2)}L`} helper={selectedInvoice.id} icon={ReceiptText} tone="blue" />
        <MetricCard label="Total Received" value={`INR ${(selectedInvoice.received/100000).toFixed(2)}L`} helper="Verified collections" icon={Banknote} tone="green" />
        <MetricCard label="TDS Deducted" value={`INR ${(selectedInvoice.tds/1000).toFixed(1)}K`} helper="As per client claim" icon={ShieldCheck} tone="purple" />
        <MetricCard label="Net Pending" value={`INR ${(netPending/100000).toFixed(2)}L`} helper="Balance receivable" icon={WalletCards} tone="amber" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Collection Summary Panel */}
        <Panel title="Collection Progress" description="Real-time breakdown of invoice settlement status.">
          <div className="space-y-6">
            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
              <div className="mb-4 flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recovery Rate</p>
                  <p className="text-3xl font-black text-primary">{progress.toFixed(1)}%</p>
                </div>
                <StatusBadge tone={progress > 90 ? "green" : "amber"}>
                  {progress > 90 ? "Safe" : "Follow-up"}
                </StatusBadge>
              </div>
              <ProgressBar value={progress} tone={progress > 80 ? "green" : progress > 40 ? "blue" : "amber"} />
            </div>

            <div className="space-y-3">
              {[
                { label: "Invoice Value", value: selectedInvoice.total, tone: "slate" },
                { label: "Total Collected", value: selectedInvoice.received, tone: "green" },
                { label: "TDS Adjusted", value: selectedInvoice.tds, tone: "purple" },
                { label: "Outstanding", value: netPending, tone: "red" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-2xl border border-border bg-white px-5 py-4 shadow-sm">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">{item.label}</span>
                  <span className={`text-sm font-black ${item.tone === 'red' ? 'text-red-500' : 'text-primary'}`}>
                    ?{item.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        {/* Quick Help / Policies */}
        <Panel title="Collection Policies" description="Standard operating procedures for finance team.">
           <div className="space-y-4">
              <div className="flex gap-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shrink-0 shadow-sm"><CheckCircle2 size={20} /></div>
                 <div>
                    <p className="text-sm font-black text-emerald-900">UTR Requirement</p>
                    <p className="text-xs font-bold text-emerald-700/70 mt-1 leading-5">Never record NEFT/RTGS without a valid Bank UTR number for reconciliation.</p>
                 </div>
              </div>
              <div className="flex gap-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shrink-0 shadow-sm"><Info size={20} /></div>
                 <div>
                    <p className="text-sm font-black text-blue-900">TDS Adjustment</p>
                    <p className="text-xs font-bold text-blue-700/70 mt-1 leading-5">If client pays less, confirm if it is TDS. Mark amount separately for tax audit.</p>
                 </div>
              </div>
              <div className="p-6 bg-primary rounded-[2.5rem] text-white relative overflow-hidden">
                 <Wallet className="absolute -right-6 -bottom-6 text-white/5" size={120} />
                 <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Next Reminder</p>
                 <p className="text-lg font-black mt-1">15 Jun 2026</p>
                 <button className="mt-4 w-full py-3 bg-accent text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg transition-all">Send WhatsApp Reminder</button>
              </div>
           </div>
        </Panel>
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
                <h3 className="text-2xl font-black text-primary">Payment Recorded Successfully!</h3>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Ledger and outstanding balance updated.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
                <div className="flex justify-between items-end border-b border-slate-100 pb-8">
                  <div>
                    <h3 className="text-3xl font-black text-primary tracking-tight">Record Collection</h3>
                    <p className="text-slate-500 font-medium mt-1">Map bank transfers, gateway receipts or manual payments to invoices.</p>
                  </div>
                  <StatusBadge tone="blue">Step 5 of 16</StatusBadge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    <Panel title="Transaction Details" description="Primary payment data.">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Field label="Invoice Selection" options={["INV-2026-090", "INV-2026-088", "INV-2026-083"]} required register={register("invoiceId")} error={errors.invoiceId?.message} />
                        <Field label="Payment Date" type="date" required register={register("date")} error={errors.date?.message} />
                        <Field label="Net Amount Received" type="number" placeholder="Enter bank amount" required register={register("amount")} error={errors.amount?.message} />
                        <Field label="TDS Deducted (if any)" type="number" placeholder="Client claim amount" register={register("tdsDeducted")} />
                        <Field label="Payment Mode" options={["NEFT", "RTGS", "IMPS", "UPI", "Cheque", "Cash", "Stripe", "Razorpay"]} required register={register("mode")} />
                        <Field label="Reference ID / UTR" placeholder="UTR-99210023..." required register={register("reference")} error={errors.reference?.message} />
                      </div>
                    </Panel>
                    <div className="grid grid-cols-1 gap-6">
                       <Field label="Collection Remarks" placeholder="Payment source or breakdown notes..." multiline register={register("remarks")} />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <Panel title="Collection Math" description="Auto-reconciliation preview.">
                       <div className="space-y-5">
                          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                             <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                                <span>Current Outstanding</span>
                                <span className="text-red-500">?{netPending.toLocaleString()}</span>
                             </div>
                             <div className="flex justify-between items-center">
                                <span className="text-xs font-black text-primary">Being Paid</span>
                                <div className="flex items-center gap-2 text-emerald-600 font-black">
                                   <Plus size={14}/>
                                   <span>?{(Number(watchedAmount || 0) + Number(watchedTds || 0)).toLocaleString()}</span>
                                </div>
                             </div>
                             <div className="h-px bg-slate-200"></div>
                             <div className="flex justify-between items-center">
                                <span className="text-xs font-black text-primary">New Balance</span>
                                <span className="text-lg font-black text-primary">?{(netPending - (Number(watchedAmount || 0) + Number(watchedTds || 0))).toLocaleString()}</span>
                             </div>
                          </div>

                          <div className="flex flex-col gap-3">
                             <ActionButton label="Record Payment" variant="accent" type="submit" />
                             <ActionButton label="Cancel" variant="outline" onClick={() => setShowForm(false)} />
                          </div>
                       </div>
                    </Panel>

                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 text-center">
                       <FileUp className="mx-auto text-slate-300 mb-3" size={32} />
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Support Document</p>
                       <p className="text-xs font-bold text-slate-500 mt-1">Upload Bank Receipt / UTR Screenshot</p>
                       <button type="button" className="mt-4 px-4 py-2 border border-border rounded-xl text-[10px] font-black uppercase text-primary hover:bg-white transition-all">Choose File</button>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Panel title="Collection Ledger" description="History of all payments received against invoices.">
        <DataTable columns={["ID", "Invoice", "Reference", "Amount", "Received Date", "Mode", "Status"]}>
          {payments.map((payment) => (
            <tr key={payment.id} className="text-sm group hover:bg-slate-50 transition-colors">
              <td className="px-4 py-4 font-black text-primary">{payment.id}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">
                <div className="flex items-center gap-2">
                   {payment.invoice} <ArrowRight size={12} className="text-slate-300" />
                </div>
              </td>
              <td className="px-4 py-4 font-semibold text-slate-500 text-xs">UTR-9921...</td>
              <td className="px-4 py-4 font-black text-primary">{payment.amount}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{payment.received}</td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-2 font-semibold text-slate-600">
                  <Landmark size={15} className="text-slate-400" />
                  {payment.mode}
                </div>
              </td>
              <td className="px-4 py-4">
                <StatusBadge tone={payment.status === "Received" ? "green" : "amber"}>
                  {payment.status}
                </StatusBadge>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </AccountingPage>
  );
}




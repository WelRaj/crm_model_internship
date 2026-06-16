"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  CalendarCheck2, Download, Percent, ReceiptText, 
  Send, ShieldCheck, Wallet, X, CheckCircle2, 
  Calculator, Info 
} from "lucide-react";
import { 
  AccountingPage, ActionButton, DataTable, Field, 
  MetricCard, Panel, StatusBadge 
} from "./AccountingComponents";

// --- Validation Schema ---
const gstSchema = z.object({
  period: z.string().min(1, "Period is required"),
  totalSales: z.coerce.number().min(0),
  outputGst: z.coerce.number().min(0),
  totalPurchases: z.coerce.number().min(0),
  inputGst: z.coerce.number().min(0),
  filingDate: z.string().min(1, "Filing date required"),
  filedBy: z.string().min(1, "Filed by required"),
  status: z.string().default("Working"),
});

type GstFormData = z.infer<typeof gstSchema>;

const initialGstRows = [
  { period: "Apr 2026", sales: "INR 18.4L", output: "INR 3.31L", input: "INR 1.08L", payable: "INR 2.23L", status: "Filed" },
  { period: "May 2026", sales: "INR 22.7L", output: "INR 4.09L", input: "INR 1.42L", payable: "INR 2.67L", status: "Filed" },
  { period: "Jun 2026", sales: "INR 14.6L", output: "INR 2.63L", input: "INR 1.36L", payable: "INR 1.27L", status: "Working" },
];

export default function Step11GST() {
  const [gstHistory, setGstRows] = useState(initialGstRows);
  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<GstFormData>({
    resolver: zodResolver(gstSchema as any),
    defaultValues: {
      period: "July 2026",
      totalSales: 0,
      outputGst: 0,
      totalPurchases: 0,
      inputGst: 0,
      filingDate: new Date().toISOString().split("T")[0],
      filedBy: "Rajkumar Rathore",
      status: "Working",
    }
  });

  const watchedOutput = useWatch({ control, name: "outputGst" });
  const watchedInput = useWatch({ control, name: "inputGst" });

  const netPayable = Math.max(0, (Number(watchedOutput || 0) - Number(watchedInput || 0)));

  const onSubmit = (data: GstFormData) => {
    const newRow = {
      period: data.period,
      sales: `INR ${(data.totalSales/100000).toFixed(1)}L`,
      output: `INR ${(data.outputGst/100000).toFixed(2)}L`,
      input: `INR ${(data.inputGst/100000).toFixed(2)}L`,
      payable: `INR ${(netPayable/100000).toFixed(2)}L`,
      status: data.status === "Filed" ? "Filed" : "Working",
    };

    setGstRows([newRow, ...gstHistory]);
    setSuccessMsg(true);
    setTimeout(() => {
      setSuccessMsg(false);
      setShowForm(false);
      reset();
    }, 2000);
  };

  return (
    <AccountingPage
      title="GST Management"
      description="Prepare monthly GST summary using approved invoices, credit notes, and vendor GST input for compliance."
      icon={Percent}
      badge="Indian compliance"
      actions={
        <>
          <ActionButton icon={Download} label="Sales Register" variant="outline" />
          <ActionButton 
            icon={Send} 
            label="Prepare Return" 
            variant="accent" 
            onClick={() => setShowForm(true)}
          />
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Current Liability" value={`INR ${(netPayable/1000).toFixed(1)}K`} helper="GSTR-3B Estimate" icon={Percent} tone="amber" />
        <MetricCard label="Input Available" value={`INR ${(Number(watchedInput || 0)/1000).toFixed(1)}K`} helper="Verified bills" icon={Wallet} tone="green" />
        <MetricCard label="Total Sales" value={`INR ${(Number(watchedTotalSales || 0)/100000).toFixed(1)}L`} helper="Taxable supply" icon={ReceiptText} tone="blue" />
        <MetricCard label="Compliance Score" value="100%" helper="No missed filings" icon={ShieldCheck} tone="purple" />
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-10 relative animate-in zoom-in-95 duration-300">
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
                <h3 className="text-2xl font-black text-primary">GST Return Prepared!</h3>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Filing details have been logged in the register.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
                <div className="flex justify-between items-end border-b border-slate-100 pb-8">
                  <div>
                    <h3 className="text-3xl font-black text-primary tracking-tight">GST Period Closing</h3>
                    <p className="text-slate-500 font-medium mt-1">Aggregate sales and purchase registers to compute final tax liability.</p>
                  </div>
                  <StatusBadge tone="blue">Step 11 of 16</StatusBadge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  <div className="lg:col-span-3 space-y-10">
                    <Panel title="Period Identification" description="Define the tax window and company info.">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Field label="GST Period" options={["June 2026", "July 2026", "August 2026"]} required register={register("period")} error={errors.period?.message} />
                        <Field label="Filing Status" options={["Working", "Ready for Review", "Filed"]} required register={register("status")} />
                        <Field label="Target Filing Date" type="date" required register={register("filingDate")} error={errors.filingDate?.message} />
                      </div>
                    </Panel>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <Panel title="Output GST (GSTR-1)" description="Sales and outward supplies summary.">
                          <div className="space-y-4">
                             <Field label="Total Taxable Sales" type="number" register={register("totalSales")} />
                             <Field label="Output Tax (IGST+CGST+SGST)" type="number" register={register("outputGst")} />
                             <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
                                <Info className="text-blue-600 shrink-0" size={18} />
                                <p className="text-[10px] font-bold text-blue-800 leading-4">This data is fetched from all 'Approved' invoices for the period.</p>
                             </div>
                          </div>
                       </Panel>

                       <Panel title="Input Tax Credit (GSTR-2B)" description="Purchase and inward supplies summary.">
                          <div className="space-y-4">
                             <Field label="Total Taxable Purchases" type="number" register={register("totalPurchases")} />
                             <Field label="Available Input (ITC)" type="number" register={register("inputGst")} />
                             <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex gap-3">
                                <Info className="text-emerald-600 shrink-0" size={18} />
                                <p className="text-[10px] font-bold text-emerald-800 leading-4">Only expenses with verified vendor GSTINs are included here.</p>
                             </div>
                          </div>
                       </Panel>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <Panel title="Final Liability" description="GSTR-3B computation.">
                       <div className="space-y-6">
                          <div className="p-6 bg-primary rounded-[2.5rem] text-white relative overflow-hidden shadow-xl shadow-primary/20">
                             <Calculator className="absolute -right-4 -bottom-4 text-white/5" size={120} />
                             <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Net Tax Payable</p>
                                <p className="text-4xl font-black mt-1">₹{netPayable.toLocaleString()}</p>
                                <div className="mt-6 space-y-2 text-[10px] font-black uppercase tracking-widest text-white/70">
                                   <div className="flex justify-between"><span>Output</span><span>₹{Number(watchedOutput || 0).toLocaleString()}</span></div>
                                   <div className="flex justify-between"><span>Less: ITC</span><span>- ₹{Number(watchedInput || 0).toLocaleString()}</span></div>
                                </div>
                             </div>
                          </div>

                          <Field label="Filed By" placeholder="Name of the accountant" required register={register("filedBy")} error={errors.filedBy?.message} />

                          <div className="flex flex-col gap-3">
                             <ActionButton label="Finalize & Log" variant="accent" type="submit" />
                             <ActionButton label="Cancel" variant="outline" onClick={() => setShowForm(false)} />
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

      <Panel title="GST Filing Register" description="Month-wise view for management and compliance team.">
        <DataTable columns={["Period", "Sales", "Output GST", "Input GST", "Net Payable", "Status"]}>
          {gstHistory.map((row) => (
            <tr key={row.period} className="text-sm group hover:bg-slate-50 transition-colors">
              <td className="px-4 py-4">
                <div className="flex items-center gap-2 font-black text-primary">
                  <CalendarCheck2 size={15} className="text-slate-400" />
                  {row.period}
                </div>
              </td>
              <td className="px-4 py-4 font-semibold text-slate-600">{row.sales}</td>
              <td className="px-4 py-4 font-black text-primary">{row.output}</td>
              <td className="px-4 py-4 font-black text-emerald-600">{row.input}</td>
              <td className="px-4 py-4 font-black text-rose-600">{row.payable}</td>
              <td className="px-4 py-4">
                <StatusBadge tone={row.status === "Filed" ? "green" : "amber"}>{row.status}</StatusBadge>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </AccountingPage>
  );
}

// Add this to prevent 'watchedTotalSales' is not defined error
const watchedTotalSales = 1460000; 



"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  CheckCircle2, Clock, FileText, Plus, Send, 
  ShieldCheck, TrendingUp, Wallet, X, Trash2, Calculator, Landmark
} from "lucide-react";
import { 
  AccountingPage, ActionButton, DataTable, Field, 
  MetricCard, Panel, StatusBadge, WorkflowSteps 
} from "./AccountingComponents";

// --- Validation Schema ---
const lineItemSchema = z.object({
  description: z.string().min(1, "Description required"),
  qty: z.coerce.number().min(1, "Min 1"),
  rate: z.coerce.number().min(0, "Min 0"),
  amount: z.coerce.number(),
});

const quotationSchema = z.object({
  clientId: z.string().min(1, "Select a client"),
  quoteDate: z.string().min(1, "Date required"),
  validTill: z.string().min(1, "Validity required"),
  currency: z.string().default("INR"),
  items: z.array(lineItemSchema).min(1, "Add at least one item"),
  discount: z.coerce.number().default(0),
  gstPercent: z.string().default("18"),
  status: z.string().default("Draft"),
  serviceSummary: z.string().min(5, "Brief summary required"),
});

type QuotationFormData = z.infer<typeof quotationSchema>;

const initialQuotations = [
  { id: "QT-2026-041", client: "Apex Finserve Pvt Ltd", service: "Loan CRM Web App", amount: "INR 9,44,000", valid: "25 Jun 2026", status: "Approved", owner: "Finance Manager" },
  { id: "QT-2026-042", client: "Nexa Retail Cloud", service: "E-commerce Mobile App", amount: "INR 12,75,000", valid: "28 Jun 2026", status: "Client Accepted", owner: "Director" },
];

export default function Step3Quotations() {
  const [quotations, setQuotations] = useState(initialQuotations);
  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<QuotationFormData>({
    resolver: zodResolver(quotationSchema as any),
    defaultValues: {
      quoteDate: new Date().toISOString().split("T")[0],
      validTill: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      items: [{ description: "", qty: 1, rate: 0, amount: 0 }],
      gstPercent: "18",
      status: "Draft",
      currency: "INR",
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchedItems = useWatch({ control, name: "items" });
  const watchedDiscount = useWatch({ control, name: "discount" });
  const watchedGstPercent = useWatch({ control, name: "gstPercent" });

  const [totals, setTotals] = useState({ subtotal: 0, gst: 0, final: 0 });

  // --- Bank Details for Buyer ---
  const [bankDetails, setBankDetails] = useState<any>(null);
  useEffect(() => {
    const savedBanks = localStorage.getItem("crm_company_banks");
    if (savedBanks) {
      const banks = JSON.parse(savedBanks);
      const activeBank = banks.find((b: any) => b.status === "Active") || banks[0];
      setBankDetails(activeBank);
    }
  }, [showForm]);

  useEffect(() => {
    let sub = 0;
    watchedItems?.forEach((item, index) => {
      const amt = (item.qty || 0) * (item.rate || 0);
      if (amt !== item.amount) setValue(`items.${index}.amount`, amt);
      sub += amt;
    });

    const disc = Number(watchedDiscount) || 0;
    const taxable = Math.max(0, sub - disc);
    const gstAmt = (taxable * Number(watchedGstPercent)) / 100;
    setTotals({ subtotal: sub, gst: gstAmt, final: taxable + gstAmt });
  }, [watchedItems, watchedDiscount, watchedGstPercent, setValue]);

  const onSubmit = (data: QuotationFormData) => {
    const newQuote = {
      id: `QT-2026-04${quotations.length + 1}`,
      client: data.clientId,
      service: data.serviceSummary,
      amount: `${data.currency} ${totals.final.toLocaleString()}`,
      valid: new Date(data.validTill).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }),
      status: data.status,
      owner: "Accountant",
    };
    setQuotations([newQuote, ...quotations]);
    setSuccessMsg(true);
    setTimeout(() => { setSuccessMsg(false); setShowForm(false); reset(); }, 2000);
  };

  return (
    <AccountingPage
      title="Quotation Management"
      description="Convert leads into proposals with automated GST & pricing."
      icon={FileText}
      badge="Lead to billing"
      actions={<><ActionButton icon={Send} label="Send Proposal" variant="outline" /><ActionButton icon={Plus} label="New Quotation" variant="accent" onClick={() => setShowForm(true)} /></>}
    >
      <WorkflowSteps steps={["Lead Won", "Quotation Draft", "Approval", "Client Acceptance", "Invoice"]} />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4 mb-8">
        <MetricCard label="Open Quotations" value={String(quotations.length)} helper="In pipeline" icon={FileText} tone="blue" />
        <MetricCard label="Accepted Value" value="INR 28.4L" helper="Ready to bill" icon={TrendingUp} tone="green" />
        <MetricCard label="Avg Discount" value="8.5%" icon={Wallet} tone="purple" />
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-10 relative animate-in zoom-in-95">
            <button onClick={() => setShowForm(false)} className="absolute right-8 top-8 p-2 text-slate-400 hover:bg-slate-50 rounded-full"><X size={24} /></button>

            {successMsg ? (
              <div className="py-20 text-center space-y-4 animate-in zoom-in-95">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 size={48} /></div>
                <h3 className="text-2xl font-black text-primary">Quotation Generated!</h3>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Ready for client review.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
                <div className="flex justify-between items-end border-b border-slate-100 pb-8">
                  <div>
                    <h3 className="text-3xl font-black text-primary tracking-tight">Generate Quotation</h3>
                    <p className="text-slate-500 font-medium mt-1">Professional service proposal with automated tax logic.</p>
                  </div>
                  <StatusBadge tone="blue">Step 3 of 16</StatusBadge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  <div className="lg:col-span-3 space-y-10">
                    <Panel title="Quotation Details" description="Select client and set validity.">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Field label="Client" options={["Apex Finserve", "Nexa Retail", "Bluebird"]} required register={register("clientId")} error={errors.clientId?.message} />
                        <Field label="Quote Date" type="date" required register={register("quoteDate")} error={errors.quoteDate?.message} />
                        <Field label="Valid Till" type="date" required register={register("validTill")} error={errors.validTill?.message} />
                        <div className="md:col-span-3"><Field label="Service Summary" placeholder="Scope overview..." required register={register("serviceSummary")} error={errors.serviceSummary?.message} /></div>
                      </div>
                    </Panel>

                    <Panel title="Scope & Pricing" description="Billable line items." actions={<ActionButton icon={Plus} label="Add Item" variant="outline" onClick={() => append({ description: "", qty: 1, rate: 0, amount: 0 })} />}>
                      <div className="space-y-4">
                        {fields.map((field, index) => (
                          <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-50/50 p-4 rounded-2xl border border-slate-100 group">
                            <div className="md:col-span-6"><Field label="Description" register={register(`items.${index}.description` as const)} error={errors.items?.[index]?.description?.message} /></div>
                            <div className="md:col-span-1"><Field label="Qty" type="number" register={register(`items.${index}.qty` as const)} /></div>
                            <div className="md:col-span-2"><Field label="Rate" type="number" register={register(`items.${index}.rate` as const)} /></div>
                            <div className="md:col-span-2"><Field label="Amount" type="number" register={register(`items.${index}.amount` as const)} /></div>
                            <div className="md:col-span-1 flex justify-center pb-2"><button type="button" onClick={() => remove(index)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button></div>
                          </div>
                        ))}
                      </div>
                    </Panel>

                    <Panel title="Payment Information (Buyer View)" icon={Landmark} description="This info is displayed on the proposal sent to the client.">
                       {bankDetails ? (
                         <div className="p-8 bg-emerald-50 border-2 border-emerald-100 rounded-[2rem] space-y-6">
                            <div className="flex items-center gap-3 text-emerald-700">
                               <CheckCircle2 size={20} strokeWidth={3} />
                               <span className="text-xs font-black uppercase tracking-[0.2em]">Verified Remittance Account</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                               <div className="space-y-1">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Beneficiary Name</p>
                                  <p className="text-sm font-black text-primary uppercase">{bankDetails.accountName}</p>
                               </div>
                               <div className="space-y-1">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bank Name</p>
                                  <p className="text-sm font-black text-primary">{bankDetails.bankName}</p>
                               </div>
                               <div className="space-y-1">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Number</p>
                                  <p className="text-lg font-black text-primary font-mono tracking-tighter">{bankDetails.accountNumber}</p>
                               </div>
                               <div className="space-y-1">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">IFSC Code</p>
                                  <p className="text-lg font-black text-indigo-600 font-mono">{bankDetails.ifscCode}</p>
                               </div>
                            </div>
                         </div>
                       ) : (
                         <div className="p-10 border-2 border-dashed border-slate-200 rounded-[2rem] text-center">
                            <p className="text-xs font-bold text-slate-400 italic">"No active treasury account linked. Please configure Bank Details."</p>
                         </div>
                       )}
                    </Panel>
                  </div>

                  <div className="space-y-8">
                    <Panel title="Grand Total" description="Calculations.">
                      <div className="space-y-6">
                        <div className="p-6 bg-primary rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
                           <Calculator className="absolute -right-4 -bottom-4 text-white/5" size={100} />
                           <div className="relative z-10">
                              <p className="text-[10px] font-black uppercase text-white/60">Final Value</p>
                              <p className="text-4xl font-black mt-2">₹{totals.final.toLocaleString()}</p>
                              <div className="mt-4 pt-4 border-t border-white/10 text-[10px] font-black uppercase tracking-widest flex justify-between"><span>GST ({watchedGstPercent}%)</span><span>₹{totals.gst.toLocaleString()}</span></div>
                           </div>
                        </div>
                        <ActionButton label="Secure Proposal" variant="accent" type="submit" />
                        <ActionButton label="Save Draft" variant="outline" onClick={() => setShowForm(false)} />
                      </div>
                    </Panel>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Panel title="Quotation Register" description="Track commercial stage.">
        <DataTable columns={["Quotation", "Client", "Amount", "Valid Till", "Status"]}>
          {quotations.map((q) => (
            <tr key={q.id} className="text-sm group hover:bg-slate-50 transition-colors">
              <td className="px-4 py-6 font-black text-primary">{q.id}</td>
              <td className="px-4 py-6 font-bold text-slate-600">{q.client}</td>
              <td className="px-4 py-6 font-black text-primary">{q.amount}</td>
              <td className="px-4 py-6 text-slate-500 font-bold">{q.valid}</td>
              <td className="px-4 py-6"><StatusBadge tone={q.status === "Approved" ? "green" : "blue"}>{q.status}</StatusBadge></td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </AccountingPage>
  );
}

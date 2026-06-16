"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  CheckCircle2, Clock, FileText, Plus, Send, 
  ShieldCheck, TrendingUp, Wallet, X, Trash2, Calculator
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
  { id: "QT-2026-043", client: "Bluebird Logistics", service: "Fleet Dashboard", amount: "INR 3,20,000", valid: "18 Jun 2026", status: "Pending Approval", owner: "Finance Manager" },
  { id: "QT-2026-044", client: "Orbit HR Tech", service: "HRMS Integration", amount: "INR 1,85,000", valid: "20 Jun 2026", status: "Draft", owner: "Accountant" },
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

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  // Watch values for auto-calculation
  const watchedItems = useWatch({ control, name: "items" });
  const watchedDiscount = useWatch({ control, name: "discount" });
  const watchedGstPercent = useWatch({ control, name: "gstPercent" });

  const [totals, setTotals] = useState({ subtotal: 0, gst: 0, final: 0 });

  useEffect(() => {
    let sub = 0;
    watchedItems?.forEach((item, index) => {
      const amt = (item.qty || 0) * (item.rate || 0);
      if (amt !== item.amount) {
        setValue(`items.${index}.amount`, amt);
      }
      sub += amt;
    });

    const disc = Number(watchedDiscount) || 0;
    const taxable = Math.max(0, sub - disc);
    const gstAmt = (taxable * Number(watchedGstPercent)) / 100;
    
    setTotals({
      subtotal: sub,
      gst: gstAmt,
      final: taxable + gstAmt
    });
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
    setTimeout(() => {
      setSuccessMsg(false);
      setShowForm(false);
      reset();
    }, 2000);
  };

  return (
    <AccountingPage
      title="Quotation Management"
      description="Convert won leads into approved commercial proposals with pricing, GST, validity, and auto-calculations."
      icon={FileText}
      badge="Lead to billing"
      actions={
        <>
          <ActionButton icon={Send} label="Send Proposal" variant="outline" />
          <ActionButton 
            icon={Plus} 
            label="New Quotation" 
            variant="accent" 
            onClick={() => setShowForm(true)}
          />
        </>
      }
    >
      <WorkflowSteps steps={["Lead Won", "Quotation Draft", "Approval", "Client Acceptance", "Invoice"]} />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Open Quotations" value={String(quotations.length)} helper="Total in pipeline" icon={FileText} tone="blue" />
        <MetricCard label="Accepted Value" value="INR 28.4L" helper="Ready for invoicing" icon={TrendingUp} tone="green" />
        <MetricCard label="Pending Approval" value="07" helper="Above threshold" icon={Clock} tone="amber" />
        <MetricCard label="Avg Discount" value="8.5%" helper="Current month" icon={Wallet} tone="purple" />
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
                <h3 className="text-2xl font-black text-primary">Quotation Created Successfully!</h3>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Awaiting manager approval flow.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
                <div className="flex justify-between items-end border-b border-slate-100 pb-8">
                  <div>
                    <h3 className="text-3xl font-black text-primary tracking-tight">Generate Quotation</h3>
                    <p className="text-slate-500 font-medium mt-1">Professional service proposal with automated GST & Discount logic.</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quote No</p>
                       <p className="text-lg font-black text-primary">QT-2026-04{quotations.length + 1}</p>
                    </div>
                    <div className="h-10 w-px bg-slate-100 mx-2"></div>
                    <StatusBadge tone="blue">Step 3 of 16</StatusBadge>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  <div className="lg:col-span-3 space-y-10">
                    {/* Basic Info Panel */}
                    <Panel title="Quotation Details" description="Select client and set validity periods.">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Field label="Client Name" options={["Apex Finserve Pvt Ltd", "Nexa Retail Cloud", "Bluebird Logistics", "Orbit HR Tech", "KraftEdge Export"]} required register={register("clientId")} error={errors.clientId?.message} />
                        <Field label="Quote Date" type="date" required register={register("quoteDate")} error={errors.quoteDate?.message} />
                        <Field label="Valid Till" type="date" required register={register("validTill")} error={errors.validTill?.message} />
                        <div className="md:col-span-3">
                           <Field label="Service Summary" placeholder="E.g. Full-stack CRM Development with 6 months support" required register={register("serviceSummary")} error={errors.serviceSummary?.message} />
                        </div>
                      </div>
                    </Panel>

                    {/* Line Items Panel */}
                    <Panel 
                      title="Scope & Pricing Items" 
                      description="Breakdown your services into billable line items."
                      actions={
                        <ActionButton 
                           icon={Plus} 
                           label="Add Item" 
                           variant="outline" 
                           onClick={() => append({ description: "", qty: 1, rate: 0, amount: 0 })}
                        />
                      }
                    >
                      <div className="space-y-4">
                        {fields.map((field, index) => (
                          <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-50/50 p-4 rounded-2xl border border-slate-100 group">
                            <div className="md:col-span-6">
                              <Field label="Description" placeholder="Service item description..." register={register(`items.${index}.description` as const)} error={errors.items?.[index]?.description?.message} />
                            </div>
                            <div className="md:col-span-1">
                              <Field label="Qty" type="number" register={register(`items.${index}.qty` as const)} error={errors.items?.[index]?.qty?.message} />
                            </div>
                            <div className="md:col-span-2">
                              <Field label="Rate" type="number" register={register(`items.${index}.rate` as const)} error={errors.items?.[index]?.rate?.message} />
                            </div>
                            <div className="md:col-span-2">
                              <Field label="Amount" type="number" register={register(`items.${index}.amount` as const)} />
                            </div>
                            <div className="md:col-span-1 flex justify-center pb-2">
                              <button 
                                type="button" 
                                onClick={() => remove(index)}
                                className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        ))}
                        {errors.items?.message && <p className="text-xs font-black text-red-500 uppercase tracking-widest">{errors.items.message}</p>}
                      </div>
                    </Panel>
                  </div>

                  {/* Summary & Calculations Sidebar */}
                  <div className="space-y-8">
                    <Panel title="Total Summary" description="Calculated values.">
                      <div className="space-y-6">
                        <div className="space-y-2">
                           <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                              <span>Subtotal</span>
                              <span className="text-primary font-black">?{totals.subtotal.toLocaleString()}</span>
                           </div>
                           <div className="h-px bg-slate-100 w-full"></div>
                        </div>

                        <Field label="Discount (Fixed)" type="number" register={register("discount")} />
                        
                        <Field label="GST Percentage" options={["0", "5", "12", "18", "28"]} register={register("gstPercent")} />

                        <div className="p-5 bg-primary rounded-[2rem] text-white space-y-4 shadow-xl shadow-primary/20 relative overflow-hidden">
                           <Calculator className="absolute -right-4 -bottom-4 text-white/5" size={100} />
                           <div className="relative z-10">
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Grand Total</p>
                              <p className="text-3xl font-black mt-1">?{totals.final.toLocaleString()}</p>
                              <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                 <span>GST ({watchedGstPercent}%)</span>
                                 <span>?{totals.gst.toLocaleString()}</span>
                              </div>
                           </div>
                        </div>

                        <Field label="Quote Status" options={["Draft", "Pending Approval"]} register={register("status")} />
                        
                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                           <Clock className="text-amber-600 shrink-0" size={18} />
                           <p className="text-[10px] font-bold text-amber-800 leading-4">Quotes above ?5 Lakhs will require Director approval before sharing with clients.</p>
                        </div>
                      </div>
                    </Panel>

                    <div className="flex flex-col gap-3">
                      <ActionButton label="Generate Quotation" variant="accent" type="submit" />
                      <ActionButton label="Save as Draft" variant="outline" onClick={() => setShowForm(false)} />
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Panel 
        title="Quotation Pipeline" 
        description="Track commercial stage before legal invoice creation."
        actions={<StatusBadge tone="blue">{quotations.length} Active Quotes</StatusBadge>}
      >
        <DataTable columns={["Quotation", "Client", "Service", "Amount", "Valid Till", "Status", "Approver"]}>
          {quotations.map((quote) => (
            <tr key={quote.id} className="text-sm group hover:bg-slate-50 transition-colors">
              <td className="px-4 py-4">
                <p className="font-black text-primary">{quote.id}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ref: PRJ-2401</p>
              </td>
              <td className="px-4 py-4 font-semibold text-slate-600">{quote.client}</td>
              <td className="px-4 py-4 font-semibold text-slate-600 max-w-[200px] truncate">{quote.service}</td>
              <td className="px-4 py-4 font-black text-primary">{quote.amount}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{quote.valid}</td>
              <td className="px-4 py-4">
                <StatusBadge tone={quote.status === "Client Accepted" || quote.status === "Approved" ? "green" : quote.status === "Draft" ? "slate" : "amber"}>
                  {quote.status}
                </StatusBadge>
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-2 font-semibold text-slate-600">
                  <ShieldCheck size={15} className="text-emerald-500" />
                  {quote.owner}
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </AccountingPage>
  );
}



"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  AlertTriangle, FileCheck2, FilePlus2, Lock, Receipt, 
  Send, TimerReset, X, CheckCircle2, Calculator, Info
} from "lucide-react";
import { 
  AccountingPage, ActionButton, DataTable, Field, 
  MetricCard, Panel, StatusBadge 
} from "./AccountingComponents";

// --- Validation Schema ---
const invoiceSchema = z.object({
  invoiceDate: z.string().min(1, "Date required"),
  dueDate: z.string().min(1, "Due date required"),
  clientId: z.string().min(1, "Select a client"),
  quoteId: z.string().optional(),
  projectId: z.string().optional(),
  terms: z.string().min(1, "Terms required"),
  currency: z.string().default("INR"),
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
  discount: z.coerce.number().default(0),
  gstType: z.string().default("CGST 9% + SGST 9%"),
  status: z.string().default("Draft"),
  description: z.string().min(5, "Description required"),
  remarks: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

const initialInvoices = [
  { id: "INV-2026-088", quotation: "QT-2026-042", client: "Nexa Retail Cloud", amount: "INR 12,75,000", due: "21 Jun 2026", status: "Approved", payment: "Partially Paid" },
  { id: "INV-2026-089", quotation: "QT-2026-041", client: "Apex Finserve Pvt Ltd", amount: "INR 9,44,000", due: "26 Jun 2026", status: "Draft", payment: "Not Raised" },
  { id: "INV-2026-083", quotation: "QT-2026-037", client: "Bluebird Logistics", amount: "INR 3,20,000", due: "05 Jun 2026", status: "Approved", payment: "Overdue" },
  { id: "INV-2026-080", quotation: "QT-2026-030", client: "Orbit HR Tech", amount: "INR 1,85,000", due: "15 Jun 2026", status: "Cancel Requested", payment: "Credit Note Required" },
];

export default function Step4Invoices() {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema as any),
    defaultValues: {
      invoiceDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      terms: "Net 15",
      gstType: "CGST 9% + SGST 9%",
      status: "Draft",
      currency: "INR",
      amount: 0,
      discount: 0,
    }
  });

  const watchedAmount = useWatch({ control, name: "amount" });
  const watchedDiscount = useWatch({ control, name: "discount" });
  const watchedTerms = useWatch({ control, name: "terms" });
  const watchedDate = useWatch({ control, name: "invoiceDate" });

  const [finalTotal, setFinalTotal] = useState(0);

  // Auto-calculate Total and Due Date
  useEffect(() => {
    const amt = Number(watchedAmount) || 0;
    const disc = Number(watchedDiscount) || 0;
    const gstRate = 0.18; // Fixed for now based on UI selection
    const taxable = Math.max(0, amt - disc);
    setFinalTotal(taxable + (taxable * gstRate));

    // Update Due Date based on terms
    if (watchedDate) {
      const days = watchedTerms === "Net 7" ? 7 : watchedTerms === "Net 15" ? 15 : watchedTerms === "Net 30" ? 30 : 0;
      const d = new Date(watchedDate);
      d.setDate(d.getDate() + days);
      setValue("dueDate", d.toISOString().split("T")[0]);
    }
  }, [watchedAmount, watchedDiscount, watchedTerms, watchedDate, setValue]);

  const onSubmit = (data: InvoiceFormData) => {
    const newInvoice = {
      id: `INV-2026-0${invoices.length + 90}`,
      quotation: data.quoteId || "Direct",
      client: data.clientId,
      amount: `${data.currency} ${finalTotal.toLocaleString()}`,
      due: new Date(data.dueDate).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }),
      status: data.status,
      payment: "Not Raised",
    };

    setInvoices([newInvoice, ...invoices]);
    setSuccessMsg(true);
    setTimeout(() => {
      setSuccessMsg(false);
      setShowForm(false);
      reset();
    }, 2000);
  };

  return (
    <AccountingPage
      title="Invoice Management"
      description="Create legal tax invoices from accepted quotations, lock approved records, and track billing history."
      icon={Receipt}
      badge="Legal billing"
      actions={
        <>
          <ActionButton icon={Send} label="Send Invoice" variant="outline" />
          <ActionButton 
            icon={FilePlus2} 
            label="New Invoice" 
            variant="accent" 
            onClick={() => setShowForm(true)}
          />
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Approved Invoices" value="INR 46.8L" helper="Current financial year" icon={FileCheck2} tone="green" />
        <MetricCard label="Due This Week" value="INR 7.4L" helper="4 invoices" icon={TimerReset} tone="amber" />
        <MetricCard label="Overdue" value="INR 3.2L" helper="Escalated to reminders" icon={AlertTriangle} tone="red" />
        <MetricCard label="Pending Approval" value={String(invoices.filter(i => i.status === "Draft").length)} helper="Draft invoices" icon={Lock} tone="blue" />
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
                <h3 className="text-2xl font-black text-primary">Invoice Generated Successfully!</h3>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Legal document is ready for approval.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
                <div className="flex justify-between items-end border-b border-slate-100 pb-8">
                  <div>
                    <h3 className="text-3xl font-black text-primary tracking-tight">Create Tax Invoice</h3>
                    <p className="text-slate-500 font-medium mt-1">Generate legal billing records with automated tax and due date tracking.</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inv No</p>
                       <p className="text-lg font-black text-primary">INV-2026-{invoices.length + 90}</p>
                    </div>
                    <div className="h-10 w-px bg-slate-100 mx-2"></div>
                    <StatusBadge tone="green">Step 4 of 16</StatusBadge>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  <div className="lg:col-span-3 space-y-10">
                    <Panel title="Billing Information" description="Connect quotation and client details.">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Field label="Quotation Ref" options={["Direct", "QT-2026-041", "QT-2026-042", "QT-2026-043"]} register={register("quoteId")} />
                        <Field label="Client" options={["Apex Finserve Pvt Ltd", "Nexa Retail Cloud", "Bluebird Logistics", "Orbit HR Tech"]} required register={register("clientId")} error={errors.clientId?.message} />
                        <Field label="Invoice Date" type="date" required register={register("invoiceDate")} error={errors.invoiceDate?.message} />
                        <Field label="Project ID" placeholder="PRJ-CRM-101" register={register("projectId")} />
                        <Field label="Payment Terms" options={["100% Advance", "50% Advance", "Net 7", "Net 15", "Net 30"]} required register={register("terms")} error={errors.terms?.message} />
                        <Field label="Due Date" type="date" required register={register("dueDate")} error={errors.dueDate?.message} />
                      </div>
                    </Panel>

                    <Panel title="Service & Amount" description="Define service scope and commercial value.">
                       <div className="space-y-6">
                          <Field label="Service Description" placeholder="Briefly describe the deliverables for this invoice..." multiline required register={register("description")} error={errors.description?.message} />
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             <Field label="Base Amount" type="number" required register={register("amount")} error={errors.amount?.message} />
                             <Field label="Discount" type="number" register={register("discount")} />
                             <Field label="GST Selection" options={["IGST 18%", "CGST 9% + SGST 9%", "Exempted", "Export LUT"]} register={register("gstType")} />
                          </div>
                          <Field label="Internal Remarks" placeholder="Notes for the audit team..." multiline register={register("remarks")} />
                       </div>
                    </Panel>
                  </div>

                  <div className="space-y-8">
                    <Panel title="Invoice Summary" description="Final tax-inclusive total.">
                      <div className="space-y-6">
                        <div className="p-6 bg-primary rounded-[2.5rem] text-white space-y-4 shadow-xl shadow-primary/20 relative overflow-hidden">
                           <Calculator className="absolute -right-4 -bottom-4 text-white/5" size={120} />
                           <div className="relative z-10">
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Payable Total</p>
                              <p className="text-4xl font-black mt-1">?{finalTotal.toLocaleString()}</p>
                              <div className="mt-6 space-y-2 text-[10px] font-black uppercase tracking-widest text-white/70">
                                 <div className="flex justify-between"><span>Base</span><span>?{Number(watchedAmount || 0).toLocaleString()}</span></div>
                                 <div className="flex justify-between"><span>Tax (18%)</span><span>?{(finalTotal - (Number(watchedAmount || 0) - Number(watchedDiscount || 0))).toLocaleString()}</span></div>
                              </div>
                           </div>
                        </div>

                        <Field label="Approval Route" options={["Draft", "Submit for Approval"]} register={register("status")} />

                        <div className="flex flex-col gap-3">
                           <ActionButton label="Generate Invoice" variant="accent" type="submit" />
                           <ActionButton label="Save Draft" variant="outline" onClick={() => setShowForm(false)} />
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-3">
                           <Info className="text-slate-400 shrink-0" size={18} />
                           <p className="text-[10px] font-bold text-slate-500 leading-4">Once approved, an invoice becomes a legal document and cannot be edited. Corrections require a Credit Note.</p>
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

      <Panel title="Invoice Register" description="Operational view for finance, sales, and project owners.">
        <DataTable columns={["Invoice", "Quotation", "Client", "Amount", "Due Date", "Invoice Status", "Payment"]}>
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="text-sm group hover:bg-slate-50 transition-colors">
              <td className="px-4 py-4">
                 <p className="font-black text-primary">{invoice.id}</p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tax Invoice</p>
              </td>
              <td className="px-4 py-4 font-semibold text-slate-600">{invoice.quotation}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{invoice.client}</td>
              <td className="px-4 py-4 font-black text-primary">{invoice.amount}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{invoice.due}</td>
              <td className="px-4 py-4">
                <StatusBadge tone={invoice.status === "Approved" ? "green" : invoice.status === "Draft" ? "blue" : "red"}>{invoice.status}</StatusBadge>
              </td>
              <td className="px-4 py-4">
                <StatusBadge tone={invoice.payment === "Overdue" || invoice.payment === "Credit Note Required" ? "red" : invoice.payment === "Partially Paid" ? "amber" : "slate"}>
                  {invoice.payment}
                </StatusBadge>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </AccountingPage>
  );
}



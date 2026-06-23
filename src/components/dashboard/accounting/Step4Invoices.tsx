"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  AlertTriangle, FileCheck2, FilePlus2, Lock, Receipt, 
  Send, TimerReset, X, CheckCircle2, Calculator, Info, Landmark
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

  // Auto-calculate Total and Due Date
  useEffect(() => {
    const amt = Number(watchedAmount) || 0;
    const disc = Number(watchedDiscount) || 0;
    const gstRate = 0.18; 
    const taxable = Math.max(0, amt - disc);
    setFinalTotal(taxable + (taxable * gstRate));

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
      description="Generate legal tax invoices and track billing history."
      icon={Receipt}
      badge="Legal billing"
      actions={
        <>
          <ActionButton icon={Send} label="Send Invoice" variant="outline" />
          <ActionButton icon={FilePlus2} label="New Invoice" variant="accent" onClick={() => setShowForm(true)} />
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Approved Invoices" value="INR 46.8L" helper="Current year" icon={FileCheck2} tone="green" />
        <MetricCard label="Due This Week" value="INR 7.4L" helper="4 invoices" icon={TimerReset} tone="amber" />
        <MetricCard label="Overdue" value="INR 3.2L" helper="Follow up" icon={AlertTriangle} tone="red" />
        <MetricCard label="Pending Approval" value={String(invoices.length)} helper="Drafts" icon={Lock} tone="blue" />
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-10 relative animate-in zoom-in-95">
            <button onClick={() => setShowForm(false)} className="absolute right-8 top-8 p-2 text-slate-400 hover:bg-slate-50 rounded-full"><X size={24} /></button>

            {successMsg ? (
              <div className="py-20 text-center space-y-4 animate-in zoom-in-95">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 size={48} /></div>
                <h3 className="text-2xl font-black text-primary">Invoice Generated!</h3>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Record secured in treasury logs.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
                <div className="flex justify-between items-end border-b border-slate-100 pb-8">
                  <div>
                    <h3 className="text-3xl font-black text-primary tracking-tight">Create Tax Invoice</h3>
                    <p className="text-slate-500 font-medium mt-1">Fill billing info and payment details.</p>
                  </div>
                  <StatusBadge tone="green">Step 4 of 16</StatusBadge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  <div className="lg:col-span-3 space-y-10">
                    <Panel title="Billing Information" description="Connect client and timelines.">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Field label="Client" options={["Apex Finserve Pvt Ltd", "Nexa Retail Cloud", "Bluebird Logistics"]} required register={register("clientId")} error={errors.clientId?.message} />
                        <Field label="Invoice Date" type="date" required register={register("invoiceDate")} error={errors.invoiceDate?.message} />
                        <Field label="Payment Terms" options={["Net 7", "Net 15", "Net 30"]} required register={register("terms")} error={errors.terms?.message} />
                        <Field label="Due Date" type="date" required register={register("dueDate")} error={errors.dueDate?.message} />
                      </div>
                    </Panel>

                    <Panel title="Commercials" description="Service value and taxes.">
                       <div className="space-y-6">
                          <Field label="Service Detail" placeholder="Work description..." multiline required register={register("description")} error={errors.description?.message} />
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             <Field label="Base Amount" type="number" required register={register("amount")} error={errors.amount?.message} />
                             <Field label="Discount" type="number" register={register("discount")} />
                             <Field label="GST Type" options={["IGST 18%", "CGST 9% + SGST 9%", "Exempt"]} register={register("gstType")} />
                          </div>
                       </div>
                    </Panel>

                    {/* Buyer-Facing Bank Info */}
                    <Panel title="Payment Information (Buyer View)" icon={Landmark} description="This info is displayed on the invoice sent to the client.">
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
                    <Panel title="Grand Total" description="Auto-calculations.">
                      <div className="space-y-6">
                        <div className="p-6 bg-primary rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
                           <Calculator className="absolute -right-4 -bottom-4 text-white/5" size={100} />
                           <div className="relative z-10">
                              <p className="text-[10px] font-black uppercase text-white/60">Payable Amount</p>
                              <p className="text-4xl font-black mt-2">₹{finalTotal.toLocaleString()}</p>
                              <div className="mt-4 pt-4 border-t border-white/10 text-[10px] font-black uppercase tracking-widest flex justify-between">
                                 <span>Incl. GST (18%)</span>
                                 <span>₹{(finalTotal * 0.18 / 1.18).toLocaleString()}</span>
                              </div>
                           </div>
                        </div>
                        <ActionButton label="Secure Generate" variant="accent" type="submit" />
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

      <Panel title="Invoice History" description="Operational registry.">
        <DataTable columns={["Invoice", "Client", "Amount", "Due Date", "Status"]}>
          {invoices.map((i) => (
            <tr key={i.id} className="text-sm group hover:bg-slate-50 transition-colors">
              <td className="px-4 py-6 font-black text-primary">{i.id}</td>
              <td className="px-4 py-6 font-bold text-slate-600">{i.client}</td>
              <td className="px-4 py-6 font-black text-primary">{i.amount}</td>
              <td className="px-4 py-6 text-slate-500 font-bold">{i.due}</td>
              <td className="px-4 py-6"><StatusBadge tone={i.status === "Approved" ? "green" : "blue"}>{i.status}</StatusBadge></td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </AccountingPage>
  );
}

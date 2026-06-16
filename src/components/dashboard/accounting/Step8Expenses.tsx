"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  FileUp, IndianRupee, Plus, ReceiptText, ShieldCheck, 
  Tags, TrendingDown, WalletCards, X, CheckCircle2, 
  Calculator, AlertCircle 
} from "lucide-react";
import { 
  AccountingPage, ActionButton, DataTable, Field, 
  MetricCard, Panel, StatusBadge 
} from "./AccountingComponents";

// --- Validation Schema ---
const expenseSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  vendorId: z.string().min(1, "Select a vendor"),
  category: z.string().min(1, "Select a category"),
  expenseDate: z.string().min(1, "Date required"),
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
  gstApplicable: z.string().default("Yes"),
  gstPercent: z.string().default("18"),
  paymentMode: z.string().default("Company Card"),
  type: z.string().default("Business"),
  remarks: z.string().optional(),
  status: z.string().default("Pending Approval"),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

const initialExpenses = [
  { id: "EXP-2026-421", date: "11 Jun 2026", vendor: "Amazon Web Services India", category: "Cloud Hosting", amount: "INR 2,45,000", gst: "INR 44,100", status: "Approved" },
  { id: "EXP-2026-422", date: "10 Jun 2026", vendor: "Airtel Business", category: "Internet", amount: "INR 18,500", gst: "INR 3,330", status: "Paid" },
  { id: "EXP-2026-423", date: "09 Jun 2026", vendor: "Meta Ads", category: "Marketing", amount: "INR 65,000", gst: "INR 11,700", status: "Pending Approval" },
  { id: "EXP-2026-424", date: "08 Jun 2026", vendor: "TechDepot Hardware", category: "Hardware", amount: "INR 1,12,000", gst: "INR 20,160", status: "Review" },
];

export default function Step8Expenses() {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema as any),
    defaultValues: {
      expenseDate: new Date().toISOString().split("T")[0],
      gstApplicable: "Yes",
      gstPercent: "18",
      paymentMode: "Company Card",
      type: "Business",
      status: "Pending Approval",
      amount: 0,
    }
  });

  const watchedAmount = useWatch({ control, name: "amount" });
  const watchedGstApplicable = useWatch({ control, name: "gstApplicable" });
  const watchedGstPercent = useWatch({ control, name: "gstPercent" });

  const gstAmt = watchedGstApplicable === "Yes" ? (Number(watchedAmount || 0) * Number(watchedGstPercent)) / 100 : 0;
  const totalWithTax = Number(watchedAmount || 0) + gstAmt;

  const onSubmit = (data: ExpenseFormData) => {
    const newExpense = {
      id: `EXP-2026-${expenses.length + 425}`,
      date: new Date(data.expenseDate).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }),
      vendor: data.vendorId,
      category: data.category,
      amount: `INR ${data.amount.toLocaleString()}`,
      gst: `INR ${gstAmt.toLocaleString()}`,
      status: data.status,
    };

    setExpenses([newExpense, ...expenses]);
    setSuccessMsg(true);
    setTimeout(() => {
      setSuccessMsg(false);
      setShowForm(false);
      reset();
    }, 2000);
  };

  return (
    <AccountingPage
      title="Expense Management"
      description="Record business expenses, vendor bills, GST input, and approval status for daily operations."
      icon={IndianRupee}
      badge="Daily finance"
      actions={
        <>
          <ActionButton icon={FileUp} label="Upload Receipts" variant="outline" />
          <ActionButton 
            icon={Plus} 
            label="New Expense" 
            variant="accent" 
            onClick={() => setShowForm(true)}
          />
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Monthly Burn" value="INR 11.2L" helper="Approved + Paid" icon={TrendingDown} tone="red" />
        <MetricCard label="Pending Approval" value={String(expenses.filter(e => e.status === "Pending Approval").length)} helper="Finance queue" icon={ShieldCheck} tone="amber" />
        <MetricCard label="GST Input" value="INR 1.36L" helper="Eligible credit" icon={ReceiptText} tone="green" />
        <MetricCard label="Operating Budget" value="INR 24.5L" helper="Q2 Allocation" icon={WalletCards} tone="blue" />
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
                <h3 className="text-2xl font-black text-primary">Expense Recorded!</h3>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Awaiting finance approval for budget release.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
                <div className="flex justify-between items-end border-b border-slate-100 pb-8">
                  <div>
                    <h3 className="text-3xl font-black text-primary tracking-tight">Record Expense</h3>
                    <p className="text-slate-500 font-medium mt-1">Capture vendor bills, reimbursements, and operational costs.</p>
                  </div>
                  <StatusBadge tone="blue">Step 8 of 16</StatusBadge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  <div className="lg:col-span-3 space-y-8">
                    <Panel title="Vendor & Classification" description="Identify who and what this expense is for.">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Field label="Vendor" options={["Amazon Web Services", "Airtel Business", "Meta Ads", "Google Workspace", "Office Rent", "Zomato Business"]} required register={register("vendorId")} error={errors.vendorId?.message} />
                        <Field label="Category" options={["Rent", "Internet", "Electricity", "Marketing", "Travel", "Software Licenses", "Hardware", "Consultant"]} required register={register("category")} error={errors.category?.message} />
                        <Field label="Expense Date" type="date" required register={register("expenseDate")} error={errors.expenseDate?.message} />
                        <Field label="Expense Type" options={["Business", "Employee Reimbursement", "Recurring Subscription", "Capital Purchase"]} register={register("type")} />
                        <div className="md:col-span-2">
                           <Field label="Expense Title" placeholder="E.g. Monthly server hosting and backup" required register={register("title")} error={errors.title?.message} />
                        </div>
                      </div>
                    </Panel>

                    <Panel title="Financials & Tax" description="Define amount and GST treatment.">
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <Field label="Base Amount" type="number" placeholder="0.00" required register={register("amount")} error={errors.amount?.message} />
                          <Field label="GST Selection" options={["Yes", "No", "Reverse Charge", "Import Service"]} register={register("gstApplicable")} />
                          <Field label="GST Rate (%)" options={["0", "5", "12", "18", "28"]} register={register("gstPercent")} />
                          <Field label="Payment Mode" options={["Company Card", "UPI", "NEFT", "Cash", "Cheque", "Auto Debit"]} register={register("paymentMode")} />
                          <Field label="Approval Route" options={["Draft", "Pending Approval", "Approved", "Paid"]} register={register("status")} />
                       </div>
                    </Panel>

                    <Field label="Audit Description" placeholder="Detailed notes for the finance manager..." multiline register={register("remarks")} />
                  </div>

                  <div className="space-y-6">
                    <Panel title="Cost Impact" description="Final payable amount.">
                       <div className="space-y-5">
                          <div className="p-6 bg-rose-500 rounded-[2.5rem] text-white space-y-4 shadow-xl shadow-rose-500/20 relative overflow-hidden">
                             <Calculator className="absolute -right-4 -bottom-4 text-white/5" size={120} />
                             <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Total Burn</p>
                                <p className="text-4xl font-black mt-1">₹{totalWithTax.toLocaleString()}</p>
                                <div className="mt-6 space-y-2 text-[10px] font-black uppercase tracking-widest text-white/70">
                                   <div className="flex justify-between"><span>Base</span><span>₹{Number(watchedAmount || 0).toLocaleString()}</span></div>
                                   <div className="flex justify-between"><span>GST Input</span><span>₹{gstAmt.toLocaleString()}</span></div>
                                </div>
                             </div>
                          </div>

                          <div className="flex flex-col gap-3">
                             <ActionButton label="Save Expense" variant="accent" type="submit" />
                             <ActionButton label="Cancel" variant="outline" onClick={() => setShowForm(false)} />
                          </div>
                       </div>
                    </Panel>

                    <Panel title="Bill Proof" description="Required for audit.">
                       <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl text-center bg-slate-50/50">
                          <FileUp className="mx-auto text-slate-300 mb-2" size={24} />
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Drop Bill / Receipt</p>
                          <button type="button" className="mt-2 text-[10px] font-black text-primary underline">Choose PDF/Image</button>
                       </div>
                    </Panel>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Panel title="Expense Register" description="Finance can reconcile vendor bills, approvals, GST input, and department budgets.">
        <DataTable columns={["Expense", "Date", "Vendor", "Category", "Amount", "GST", "Status"]}>
          {expenses.map((expense) => (
            <tr key={expense.id} className="text-sm group hover:bg-slate-50 transition-colors">
              <td className="px-4 py-4">
                 <p className="font-black text-primary">{expense.id}</p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Business</p>
              </td>
              <td className="px-4 py-4 font-semibold text-slate-600">{expense.date}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{expense.vendor}</td>
              <td className="px-4 py-4 font-semibold text-slate-500 text-xs">{expense.category}</td>
              <td className="px-4 py-4 font-black text-primary">{expense.amount}</td>
              <td className="px-4 py-4 font-black text-emerald-600">{expense.gst}</td>
              <td className="px-4 py-4">
                <StatusBadge tone={expense.status === "Approved" || expense.status === "Paid" ? "green" : expense.status === "Review" ? "red" : "amber"}>
                  {expense.status}
                </StatusBadge>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </AccountingPage>
  );
}



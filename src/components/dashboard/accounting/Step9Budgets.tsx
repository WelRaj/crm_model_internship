"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  AlertCircle, BarChart3, Download, Plus, Target, 
  Wallet, WalletCards, X, CheckCircle2, Info, 
  TrendingUp, TrendingDown 
} from "lucide-react";
import { 
  AccountingPage, ActionButton, DataTable, Field, 
  MetricCard, Panel, ProgressBar, StatusBadge 
} from "./AccountingComponents";

// --- Validation Schema ---
const budgetSchema = z.object({
  department: z.string().min(1, "Department is required"),
  fy: z.string().min(1, "Financial Year is required"),
  totalBudget: z.coerce.number().min(1, "Budget must be greater than 0"),
  consumed: z.coerce.number().min(0, "Consumed amount cannot be negative"),
  alertThreshold: z.string().default("80%"),
  remarks: z.string().optional(),
});

type BudgetFormData = z.infer<typeof budgetSchema>;

const initialBudgets = [
  { id: "BUD-001", department: "Engineering", fy: "FY 2026-27", budget: "INR 42,00,000", consumed: "INR 18,40,000", remaining: "INR 23,60,000", usage: 44, status: "Healthy" },
  { id: "BUD-002", department: "Marketing", fy: "FY 2026-27", budget: "INR 18,00,000", consumed: "INR 14,90,000", remaining: "INR 3,10,000", usage: 83, status: "Watch" },
  { id: "BUD-003", department: "Cloud Ops", fy: "FY 2026-27", budget: "INR 30,00,000", consumed: "INR 26,70,000", remaining: "INR 3,30,000", usage: 89, status: "Alert" },
  { id: "BUD-004", department: "HR & Admin", fy: "FY 2026-27", budget: "INR 12,00,000", consumed: "INR 4,10,000", remaining: "INR 7,90,000", usage: 34, status: "Healthy" },
];

export default function Step9Budgets() {
  const [budgets, setBudgets] = useState(initialBudgets);
  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema as any),
    defaultValues: {
      fy: "FY 2026-27",
      alertThreshold: "80%",
      totalBudget: 0,
      consumed: 0,
    }
  });

  const watchedTotal = useWatch({ control, name: "totalBudget" });
  const watchedConsumed = useWatch({ control, name: "consumed" });
  const watchedThreshold = useWatch({ control, name: "alertThreshold" });

  const remaining = Math.max(0, (watchedTotal || 0) - (watchedConsumed || 0));
  const usagePercent = watchedTotal > 0 ? (watchedConsumed / watchedTotal) * 100 : 0;

  const getStatus = (usage: number) => {
    if (usage > 90) return "Alert";
    if (usage > 75) return "Watch";
    return "Healthy";
  };

  const onSubmit = (data: BudgetFormData) => {
    const usage = data.totalBudget > 0 ? (data.consumed / data.totalBudget) * 100 : 0;
    const newBudget = {
      id: `BUD-00${budgets.length + 1}`,
      department: data.department,
      fy: data.fy,
      budget: `INR ${data.totalBudget.toLocaleString()}`,
      consumed: `INR ${data.consumed.toLocaleString()}`,
      remaining: `INR ${(data.totalBudget - data.consumed).toLocaleString()}`,
      usage: Math.round(usage),
      status: getStatus(usage),
    };

    setBudgets([newBudget, ...budgets]);
    setSuccessMsg(true);
    setTimeout(() => {
      setSuccessMsg(false);
      setShowForm(false);
      reset();
    }, 2000);
  };

  const totalCompanyBudget = budgets.reduce((acc, b) => acc + Number(b.budget.replace(/[^0-9.-]+/g,"")), 0);
  const totalCompanyConsumed = budgets.reduce((acc, b) => acc + Number(b.consumed.replace(/[^0-9.-]+/g,"")), 0);

  return (
    <AccountingPage
      title="Budget Management"
      description="Control department spending with financial-year budgets, consumed amount, remaining balance, and alert thresholds."
      icon={BarChart3}
      badge="Financial control"
      actions={
        <>
          <ActionButton icon={Download} label="Budget Report" variant="outline" />
          <ActionButton 
            icon={Plus} 
            label="New Budget" 
            variant="accent" 
            onClick={() => setShowForm(true)}
          />
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Company Budget" value={`INR ${(totalCompanyBudget/10000000).toFixed(2)}Cr`} helper="FY 2026-27 Total" icon={Target} tone="blue" />
        <MetricCard label="Total Consumed" value={`INR ${(totalCompanyConsumed/100000).toFixed(1)}L`} helper={`${((totalCompanyConsumed/totalCompanyBudget)*100).toFixed(1)}% company-wide`} icon={WalletCards} tone="amber" />
        <MetricCard label="Available" value={`INR ${((totalCompanyBudget - totalCompanyConsumed)/100000).toFixed(1)}L`} helper="Buffer balance" icon={Wallet} tone="green" />
        <MetricCard label="Risky Depts" value={String(budgets.filter(b => b.status === "Alert").length)} helper="Crossing 90% mark" icon={AlertCircle} tone="red" />
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
                <h3 className="text-2xl font-black text-primary">Budget Allocated!</h3>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Department limits have been updated.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
                <div className="flex justify-between items-end border-b border-slate-100 pb-8">
                  <div>
                    <h3 className="text-3xl font-black text-primary tracking-tight">Allocate Department Budget</h3>
                    <p className="text-slate-500 font-medium mt-1">Set spending limits and alert thresholds for financial monitoring.</p>
                  </div>
                  <StatusBadge tone="blue">Step 9 of 16</StatusBadge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  <div className="lg:col-span-3 space-y-8">
                    <Panel title="Budget Classification" description="Identify the scope and duration.">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Field label="Department" options={["Engineering", "Marketing", "Cloud Ops", "HR & Admin", "Sales", "Finance", "Product Design"]} required register={register("department")} error={errors.department?.message} />
                        <Field label="Financial Year" options={["FY 2025-26", "FY 2026-27", "FY 2027-28"]} required register={register("fy")} error={errors.fy?.message} />
                        <Field label="Alert Threshold" options={["60%", "70%", "80%", "90%", "95%"]} register={register("alertThreshold")} />
                      </div>
                    </Panel>

                    <Panel title="Financial Allocation" description="Define limits and existing consumption.">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Field label="Total Budget Amount" type="number" placeholder="Enter full amount" required register={register("totalBudget")} error={errors.totalBudget?.message} />
                          <Field label="Initial Consumed Amount" type="number" placeholder="Existing spend (if any)" register={register("consumed")} />
                       </div>
                       <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                          <div>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Effective Remaining</p>
                             <p className="text-xl font-black text-primary">₹{remaining.toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Usage</p>
                             <p className={`text-xl font-black ${usagePercent > 90 ? 'text-red-500' : usagePercent > 75 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                {usagePercent.toFixed(1)}%
                             </p>
                          </div>
                       </div>
                    </Panel>

                    <Field label="Strategic Remarks" placeholder="Purpose of this allocation or specific constraints..." multiline register={register("remarks")} />
                  </div>

                  <div className="space-y-6">
                    <Panel title="Control Logic" description="Automation triggers.">
                       <div className="space-y-4">
                          <div className="p-5 bg-primary rounded-[2rem] text-white relative overflow-hidden shadow-xl shadow-primary/20">
                             <Target className="absolute -right-4 -bottom-4 text-white/5" size={100} />
                             <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Current Policy</p>
                             <p className="text-sm font-bold mt-2 leading-6">Once usage crosses {watchedThreshold}, finance manager will be auto-notified via WhatsApp.</p>
                          </div>

                          <div className="flex flex-col gap-3">
                             <ActionButton label="Save Allocation" variant="accent" type="submit" />
                             <ActionButton label="Cancel" variant="outline" onClick={() => setShowForm(false)} />
                          </div>
                       </div>
                    </Panel>

                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                       <Info className="text-amber-600 shrink-0" size={18} />
                       <p className="text-[10px] font-bold text-amber-800 leading-4">Allocating a budget does not release funds. It only sets the 'Safety Limit' for expense approvals.</p>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Panel 
        title="Department Budget Tracker" 
        description="Budget consumption updates automatically when expenses or payroll entries are approved."
        actions={<StatusBadge tone="blue">{budgets.length} Depts Monitored</StatusBadge>}
      >
        <DataTable columns={["Department", "FY", "Budget", "Consumed", "Remaining", "Usage", "Status"]}>
          {budgets.map((budget) => (
            <tr key={budget.department} className="text-sm group hover:bg-slate-50 transition-colors">
              <td className="px-4 py-4">
                 <p className="font-black text-primary">{budget.department}</p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{budget.id}</p>
              </td>
              <td className="px-4 py-4 font-semibold text-slate-600">{budget.fy}</td>
              <td className="px-4 py-4 font-black text-primary">{budget.budget}</td>
              <td className="px-4 py-4 font-semibold text-slate-500">{budget.consumed}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{budget.remaining}</td>
              <td className="px-4 py-4">
                <div className="flex min-w-[140px] items-center gap-3">
                  <ProgressBar value={budget.usage} tone={budget.usage > 90 ? "red" : budget.usage > 75 ? "amber" : "green"} />
                  <span className="text-[10px] font-black text-primary">{budget.usage}%</span>
                </div>
              </td>
              <td className="px-4 py-4">
                <StatusBadge tone={budget.status === "Healthy" ? "green" : budget.status === "Watch" ? "amber" : "red"}>{budget.status}</StatusBadge>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </AccountingPage>
  );
}



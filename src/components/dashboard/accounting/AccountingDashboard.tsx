"use client";

import { 
  Users, Truck, FileText, Receipt, BellRing,
  RotateCcw, Wallet, BarChart3, UserSquare2, Percent, 
  Calculator, LineChart, ShieldCheck, History, Lock, Landmark,
  TrendingUp, TrendingDown, ArrowUpRight, Plus
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AccountingModuleId } from "./AccountingWizard";

export default function AccountingDashboard({ onSelectModule }: { onSelectModule: (id: AccountingModuleId) => void }) {
  const stats = [
    { label: "Total Receivables", value: "₹12,50,000", icon: ArrowUpRight, trend: "+12.5%", color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Total Payables", value: "₹4,20,000", icon: TrendingDown, trend: "-2.4%", color: "text-rose-600", bg: "bg-rose-50" },
    { label: "Net Profit", value: "₹8,30,000", icon: TrendingUp, trend: "+8.1%", color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Tax Liability", value: "₹1,80,000", icon: ShieldCheck, trend: "GST/TDS", color: "text-amber-600", bg: "bg-amber-50" },
  ];

  const modules: Array<{ id: AccountingModuleId; label: string; icon: LucideIcon }> = [
    { id: "accounting-clients",      label: "Client Master",              icon: Users },
    { id: "accounting-vendors",      label: "Vendor Master",              icon: Truck },
    { id: "accounting-quotations",   label: "Quotations",                 icon: FileText },
    { id: "accounting-invoices",     label: "Invoices",                   icon: Receipt },
    { id: "accounting-payments",     label: "Payments",                   icon: Wallet },
    { id: "accounting-reminders",    label: "Reminders",                  icon: BellRing },
    { id: "accounting-credit-notes", label: "Credit Notes",               icon: RotateCcw },
    { id: "accounting-expenses",     label: "Sales, Purchase & Expenses", icon: TrendingDown },
    { id: "accounting-budgets",      label: "Budgets",                    icon: BarChart3 },
    { id: "accounting-salary",       label: "Salary/Payroll",             icon: UserSquare2 },
    { id: "accounting-gst",          label: "GST Mgmt",                   icon: Percent },
    { id: "accounting-tds",          label: "TDS Mgmt",                   icon: Calculator },
    { id: "accounting-reports",      label: "Reports",                    icon: LineChart },
    { id: "accounting-approvals",    label: "Approvals",                  icon: ShieldCheck },
    { id: "accounting-audit-logs",   label: "Audit Logs",                 icon: History },
    { id: "accounting-access",       label: "Access Control",             icon: Lock },
    { id: "accounting-bank-details", label: "Bank Details",               icon: Landmark },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-[#0F172A] tracking-tight">Accounting Control Center</h2>
          <p className="text-slate-500 font-medium mt-1">Monitor enterprise cashflow and compliance status.</p>
        </div>
        <div className="flex gap-3">
           <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black text-slate-600 hover:bg-slate-50 transition-all">
              <FileText size={16} /> Export Reports
           </button>
           <button className="flex items-center gap-2 px-6 py-3 bg-accent text-primary rounded-2xl text-xs font-black shadow-lg hover:shadow-primary/10 transition-all">
              <Plus size={18} /> New Transaction
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all">
            <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6`}>
              <stat.icon size={28} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <div className="flex items-end justify-between mt-2">
              <p className="text-2xl font-black text-[#0F172A]">{stat.value}</p>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${stat.bg} ${stat.color}`}>{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] mb-8 ml-2">Masters & Modules</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
          {modules.map((mod) => (
            <button
              key={mod.id}
              onClick={() => onSelectModule(mod.id)}
              className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:border-accent hover:shadow-xl transition-all group flex flex-col items-center text-center gap-4"
            >
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-accent group-hover:text-primary transition-all">
                 <mod.icon size={24} />
              </div>
              <span className="text-xs font-black text-[#0F172A] group-hover:text-accent transition-colors">{mod.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  BarChart3, Download, FileSpreadsheet, LineChart, 
  PieChart, TrendingDown, TrendingUp, Wallet, 
  X, CheckCircle2, Clock, Play, FileText, Filter,
  Settings2, Calendar
} from "lucide-react";
import { 
  AccountingPage, ActionButton, DataTable, Field,
  MetricCard, Panel, ProgressBar, StatusBadge 
} from "./AccountingComponents";

// --- Validation Schema for Filters ---
const filterSchema = z.object({
  reportType: z.string().min(1, "Select report type"),
  dateRange: z.string().min(1, "Select period"),
  department: z.string().default("All Departments"),
  format: z.string().default("PDF Executive Summary"),
});

type FilterFormData = z.infer<typeof filterSchema>;

const initialReports = [
  { id: "REP-001", name: "Monthly Income Report", owner: "Finance", frequency: "Monthly", lastRun: "10 Jun 2026", status: "Ready" },
  { id: "REP-002", name: "Profit & Loss Report", owner: "Director", frequency: "Monthly", lastRun: "09 Jun 2026", status: "Ready" },
  { id: "REP-003", name: "Client-wise Outstanding", owner: "Collections", frequency: "Weekly", lastRun: "11 Jun 2026", status: "Ready" },
  { id: "REP-004", name: "GST Summary Report", owner: "Compliance", frequency: "Monthly", lastRun: "08 Jun 2026", status: "Review" },
  { id: "REP-005", name: "Salary Report", owner: "HR + Finance", frequency: "Monthly", lastRun: "31 May 2026", status: "Scheduled" },
];

export default function Step13Reports() {
  const [reports, setReports] = useState(initialReports);
  const [generating, setGenerating] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FilterFormData>({
    resolver: zodResolver(filterSchema as any),
    defaultValues: {
      reportType: "Monthly Income",
      dateRange: "Current Month",
      department: "All Departments",
      format: "PDF Executive Summary"
    }
  });

  const runReport = (name: string) => {
    setGenerating(name);
    setTimeout(() => {
      const newId = `REP-00${reports.length + 1}`;
      const newReport = {
         id: newId,
         name: name,
         owner: "Rajkumar Rathore",
         frequency: "Ad-hoc",
         lastRun: "Just Now",
         status: "Ready"
      };
      setReports([newReport, ...reports]);
      setGenerating(null);
      setShowFilters(false);
    }, 2500);
  };

  const onFilterSubmit = (data: FilterFormData) => {
    runReport(data.reportType);
  };

  return (
    <AccountingPage
      title="Reports & Analytics"
      description="Management-ready finance analytics for income, expenses, cash flow, outstanding, GST, TDS, salaries, and department burn rates."
      icon={LineChart}
      badge="Decision support"
      actions={
        <>
          <ActionButton 
            icon={Filter} 
            label={showFilters ? "Close Filters" : "Custom Analytics"} 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)} 
          />
          <ActionButton icon={Download} label="Export Executive Pack" variant="accent" />
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Monthly Income" value="INR 42.6L" helper="+18% vs prev month" icon={TrendingUp} tone="green" />
        <MetricCard label="Monthly Expense" value="INR 18.9L" helper="Cloud cost rising" icon={TrendingDown} tone="red" />
        <MetricCard label="Net Cash Flow" value="INR 14.3L" helper="After payroll & tax" icon={Wallet} tone="blue" />
        <MetricCard label="Total Outstanding" value="INR 21.4L" helper="Aging monitored" icon={BarChart3} tone="amber" />
      </div>

      {showFilters && (
        <div className="animate-in slide-in-from-top-4 duration-500">
           <Panel title="Custom Report Builder" description="Select preset report or type manual parameters for deep-dive analytics.">
              <form onSubmit={handleSubmit(onFilterSubmit)} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                 <Field 
                    label="Report Type" 
                    options={["Monthly Income", "Monthly Expense", "P&L Statement", "GST Summary", "TDS Register", "Payroll Cost"]} 
                    register={register("reportType")} 
                    error={errors.reportType?.message}
                 />
                 <Field 
                    label="Analysis Period" 
                    options={["Current Month", "Last Quarter", "FY 2026-27", "Last 12 Months", "Custom Range"]} 
                    register={register("dateRange")} 
                    error={errors.dateRange?.message}
                 />
                 <Field 
                    label="Dept. Scope" 
                    options={["All Departments", "Engineering", "Marketing", "Cloud Ops", "Sales"]} 
                    register={register("department")} 
                 />
                 <Field 
                    label="Export Format" 
                    options={["PDF Executive Summary", "Excel Data Dump", "Interactive Chart"]} 
                    register={register("format")} 
                 />
                 <div className="md:col-span-4 flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
                    <ActionButton label="Reset" variant="outline" onClick={() => setShowFilters(false)} />
                    <ActionButton icon={Play} label="Generate Custom Analytics" variant="accent" type="submit" />
                 </div>
              </form>
           </Panel>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel title="Executive Report Library" description="One-click financial intelligence.">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {[
              "Monthly Income", "Monthly Expense", "Profit & Loss",
              "Cash Flow", "Client Outstanding", "Aging Analysis",
              "Dept. Burn Rate", "Vendor Analysis", "GST Summary"
            ].map((name) => (
              <button
                key={name}
                onClick={() => runReport(name)}
                className="flex items-center justify-between group rounded-xl border border-border bg-slate-50 p-4 hover:border-primary hover:bg-white transition-all text-left"
              >
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                      <FileText size={16} />
                   </div>
                   <p className="text-xs font-black text-primary">{name}</p>
                </div>
                <Play size={12} className="text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>
        </Panel>

        <div className="xl:col-span-2 space-y-6">
           <Panel title="Outstanding Aging (Bucket Analysis)" description="Critical for collection team follow-up priority.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-2">
                 <div className="space-y-6">
                    {[
                      ["0-30 Days", 42, "INR 8.9L", "green"],
                      ["31-60 Days", 27, "INR 5.8L", "blue"],
                      ["61-90 Days", 18, "INR 3.9L", "amber"],
                      ["90+ Days", 13, "INR 2.8L", "red"],
                    ].map(([label, value, amount, tone]) => (
                      <div key={label as string} className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                          <span>{label as string}</span>
                          <span className="text-primary">{amount as string}</span>
                        </div>
                        <ProgressBar value={value as number} tone={tone as "green" | "blue" | "amber" | "red"} />
                      </div>
                    ))}
                 </div>
                 <div className="bg-slate-900 rounded-[2rem] p-6 text-white relative overflow-hidden flex flex-col justify-center">
                    <PieChart className="absolute -right-6 -bottom-6 text-white/5" size={140} />
                    <div className="relative z-10">
                       <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Collection Health</p>
                       <p className="text-4xl font-black mt-2">84.2%</p>
                       <p className="text-xs font-bold text-emerald-400 mt-4 leading-5">Company is within healthy liquidity range for FY 2026-27 operations.</p>
                       <button className="mt-6 px-5 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">View Breakdown</button>
                    </div>
                 </div>
              </div>
           </Panel>
        </div>
      </div>

      {generating && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
           <div className="w-full max-w-md bg-white rounded-[2.5rem] p-12 text-center space-y-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-slate-100">
                 <div className="h-full bg-primary animate-pulse w-full"></div>
              </div>
              <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto relative">
                 <Clock className="text-primary animate-spin" size={32} />
              </div>
              <div>
                 <h3 className="text-2xl font-black text-primary tracking-tight">Generating {generating}</h3>
                 <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">Computing and compiling data registers...</p>
              </div>
           </div>
        </div>
      )}

      <Panel 
        title="Recent Report Runs & Schedule" 
        description="Historical log of analytical snapshots."
        actions={<StatusBadge tone="green">{reports.length} Logs Available</StatusBadge>}
      >
        <DataTable columns={["Report Name", "Owner", "Frequency", "Last Run", "Status", "Actions"]}>
          {reports.map((report) => (
            <tr key={report.id} className="text-sm group hover:bg-slate-50 transition-colors">
              <td className="px-4 py-4">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                       <FileSpreadsheet size={16} />
                    </div>
                    <p className="font-black text-primary">{report.name}</p>
                 </div>
              </td>
              <td className="px-4 py-4 font-semibold text-slate-600">{report.owner}</td>
              <td className="px-4 py-4 font-semibold text-slate-500 text-xs uppercase tracking-widest">{report.frequency}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">
                 {report.lastRun === "Just Now" ? (
                   <span className="flex items-center gap-1.5 text-emerald-600 font-black">
                      <CheckCircle2 size={14} /> {report.lastRun}
                   </span>
                 ) : report.lastRun}
              </td>
              <td className="px-4 py-4">
                <StatusBadge tone={report.status === "Ready" ? "green" : report.status === "Review" ? "amber" : "blue"}>{report.status}</StatusBadge>
              </td>
              <td className="px-4 py-4">
                 <div className="flex items-center gap-3">
                    <button 
                       onClick={() => runReport(report.name)}
                       className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                    >
                       Re-run
                    </button>
                    <div className="h-3 w-px bg-slate-200"></div>
                    <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary">Download</button>
                 </div>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </AccountingPage>
  );
}



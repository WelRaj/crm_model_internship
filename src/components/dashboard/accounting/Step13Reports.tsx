"use client";

import { BarChart3, Download, FileSpreadsheet, LineChart, PieChart, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { AccountingPage, ActionButton, DataTable, MetricCard, Panel, ProgressBar, StatusBadge } from "./AccountingComponents";

const reports = [
  { name: "Monthly Income Report", owner: "Finance", frequency: "Monthly", lastRun: "10 Jun 2026", status: "Ready" },
  { name: "Profit & Loss Report", owner: "Director", frequency: "Monthly", lastRun: "09 Jun 2026", status: "Ready" },
  { name: "Client-wise Outstanding", owner: "Collections", frequency: "Weekly", lastRun: "11 Jun 2026", status: "Ready" },
  { name: "GST Summary Report", owner: "Compliance", frequency: "Monthly", lastRun: "08 Jun 2026", status: "Review" },
  { name: "Salary Report", owner: "HR + Finance", frequency: "Monthly", lastRun: "31 May 2026", status: "Scheduled" },
];

export default function Step13Reports() {
  return (
    <AccountingPage
      title="Reports & Analytics"
      description="Management-ready finance analytics for income, expenses, cash flow, outstanding, GST, TDS, salaries, vendors, and departments."
      icon={LineChart}
      badge="Decision support"
      actions={
        <>
          <ActionButton icon={FileSpreadsheet} label="Schedule Report" variant="outline" />
          <ActionButton icon={Download} label="Export Pack" variant="accent" />
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Monthly Income" value="INR 42.6L" helper="+18% vs previous month" icon={TrendingUp} tone="green" />
        <MetricCard label="Monthly Expense" value="INR 18.9L" helper="Cloud cost rising" icon={TrendingDown} tone="red" />
        <MetricCard label="Net Cash Flow" value="INR 14.3L" helper="After payroll and tax" icon={Wallet} tone="blue" />
        <MetricCard label="Outstanding" value="INR 21.4L" helper="Aging monitored" icon={BarChart3} tone="amber" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel title="Report Library" description="Reports expected by real IT company management and finance teams.">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {[
              "Monthly Income Report",
              "Monthly Expense Report",
              "Profit & Loss Report",
              "Cash Flow Report",
              "Outstanding Report",
              "Client-wise Outstanding",
              "Aging Report",
              "Department Expense Report",
              "Vendor Expense Report",
              "GST Summary Report",
              "TDS Report",
              "Salary Report",
            ].map((report) => (
              <div key={report} className="flex items-center gap-3 rounded-xl border border-border bg-slate-50 p-4">
                <PieChart className="text-primary" size={18} />
                <p className="text-sm font-black text-primary">{report}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Aging Buckets" description="Collections team needs aging, not just total outstanding.">
          <div className="space-y-5">
            {[
              ["0-30 Days", 42, "INR 8.9L", "green"],
              ["31-60 Days", 27, "INR 5.8L", "blue"],
              ["61-90 Days", 18, "INR 3.9L", "amber"],
              ["90+ Days", 13, "INR 2.8L", "red"],
            ].map(([label, value, amount, tone]) => (
              <div key={label as string} className="space-y-2">
                <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-500">
                  <span>{label as string}</span>
                  <span>{amount as string}</span>
                </div>
                <ProgressBar value={value as number} tone={tone as "green" | "blue" | "amber" | "red"} />
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Scheduled Reports" description="Scheduled packs reduce manual Excel work and keep directors aligned.">
        <DataTable columns={["Report", "Owner", "Frequency", "Last Run", "Status"]}>
          {reports.map((report) => (
            <tr key={report.name} className="text-sm">
              <td className="px-4 py-4 font-black text-primary">{report.name}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{report.owner}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{report.frequency}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{report.lastRun}</td>
              <td className="px-4 py-4">
                <StatusBadge tone={report.status === "Ready" ? "green" : report.status === "Review" ? "amber" : "blue"}>{report.status}</StatusBadge>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </AccountingPage>
  );
}

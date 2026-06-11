"use client";

import { AlertCircle, BarChart3, Download, Plus, Target, Wallet, WalletCards } from "lucide-react";
import { AccountingPage, ActionButton, DataTable, Field, MetricCard, Panel, ProgressBar, StatusBadge } from "./AccountingComponents";

const budgets = [
  { department: "Engineering", fy: "FY 2026-27", budget: "INR 42,00,000", consumed: "INR 18,40,000", remaining: "INR 23,60,000", usage: 44, status: "Healthy" },
  { department: "Marketing", fy: "FY 2026-27", budget: "INR 18,00,000", consumed: "INR 14,90,000", remaining: "INR 3,10,000", usage: 83, status: "Watch" },
  { department: "Cloud Ops", fy: "FY 2026-27", budget: "INR 30,00,000", consumed: "INR 26,70,000", remaining: "INR 3,30,000", usage: 89, status: "Alert" },
  { department: "HR & Admin", fy: "FY 2026-27", budget: "INR 12,00,000", consumed: "INR 4,10,000", remaining: "INR 7,90,000", usage: 34, status: "Healthy" },
];

export default function Step9Budgets() {
  return (
    <AccountingPage
      title="Budget Management"
      description="Control department spending with financial-year budgets, consumed amount, remaining balance, and alert thresholds."
      icon={BarChart3}
      badge="Financial control"
      actions={
        <>
          <ActionButton icon={Download} label="Budget Report" variant="outline" />
          <ActionButton icon={Plus} label="New Budget" variant="accent" />
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Budget" value="INR 1.02Cr" helper="FY 2026-27" icon={Target} tone="blue" />
        <MetricCard label="Consumed" value="INR 64.1L" helper="62.8% company-wide" icon={WalletCards} tone="amber" />
        <MetricCard label="Remaining" value="INR 37.9L" helper="Available balance" icon={Wallet} tone="green" />
        <MetricCard label="Threshold Alerts" value="02" helper="Cloud Ops and Marketing" icon={AlertCircle} tone="red" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel title="Budget Setup" description="Budgets are consumed by approved expenses, recurring subscriptions, and payroll allocations.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Budget ID" value="BUD-AUTO-022" required />
            <Field label="Financial Year" value="FY 2026-27" options={["FY 2025-26", "FY 2026-27", "FY 2027-28"]} required />
            <Field label="Department" value="Cloud Ops" options={["Engineering", "Marketing", "Cloud Ops", "HR & Admin", "Sales", "Finance"]} required />
            <Field label="Budget Amount" type="number" value="3000000" required />
            <Field label="Consumed Amount" type="number" value="2670000" />
            <Field label="Remaining Amount" type="number" value="330000" />
            <Field label="Alert Threshold" value="80%" options={["60%", "70%", "80%", "90%", "95%"]} />
            <Field label="Budget Status" value="Alert" options={["Healthy", "Watch", "Alert", "Frozen"]} />
            <div className="md:col-span-2">
              <Field label="Remarks" value="Cloud cost spike due to staging environment and backup retention. Review AWS reserved instances." multiline />
            </div>
          </div>
        </Panel>

        <Panel title="Overspend Rules" description="Real finance control without blocking daily work unnecessarily.">
          <div className="space-y-4">
            {[
              ["Below 70%", "Normal approvals continue.", "green"],
              ["70% to 85%", "Finance manager receives budget watch alert.", "blue"],
              ["85% to 100%", "New expense requires finance manager approval.", "amber"],
              ["Above 100%", "Director approval required or budget revision needed.", "red"],
            ].map(([title, text, tone]) => (
              <div key={title} className="rounded-xl border border-border bg-slate-50 p-4">
                <StatusBadge tone={tone as "green" | "blue" | "amber" | "red"}>{title}</StatusBadge>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Department Budget Tracker" description="Budget consumption updates automatically when expenses or payroll entries are approved.">
        <DataTable columns={["Department", "FY", "Budget", "Consumed", "Remaining", "Usage", "Status"]}>
          {budgets.map((budget) => (
            <tr key={budget.department} className="text-sm">
              <td className="px-4 py-4 font-black text-primary">{budget.department}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{budget.fy}</td>
              <td className="px-4 py-4 font-black text-primary">{budget.budget}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{budget.consumed}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{budget.remaining}</td>
              <td className="px-4 py-4">
                <div className="flex min-w-36 items-center gap-3">
                  <ProgressBar value={budget.usage} tone={budget.usage > 85 ? "red" : budget.usage > 75 ? "amber" : "green"} />
                  <span className="text-xs font-black text-primary">{budget.usage}%</span>
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

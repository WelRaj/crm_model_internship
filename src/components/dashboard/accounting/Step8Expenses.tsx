"use client";

import { FileUp, IndianRupee, Plus, ReceiptText, ShieldCheck, Tags, TrendingDown, WalletCards } from "lucide-react";
import { AccountingPage, ActionButton, DataTable, Field, MetricCard, Panel, StatusBadge } from "./AccountingComponents";

const expenses = [
  { id: "EXP-2026-421", date: "11 Jun 2026", vendor: "Amazon Web Services India", category: "Cloud Hosting", amount: "INR 2,45,000", gst: "INR 44,100", status: "Approved" },
  { id: "EXP-2026-422", date: "10 Jun 2026", vendor: "Airtel Business", category: "Internet", amount: "INR 18,500", gst: "INR 3,330", status: "Paid" },
  { id: "EXP-2026-423", date: "09 Jun 2026", vendor: "Meta Ads", category: "Marketing", amount: "INR 65,000", gst: "INR 11,700", status: "Pending Approval" },
  { id: "EXP-2026-424", date: "08 Jun 2026", vendor: "TechDepot Hardware", category: "Hardware", amount: "INR 1,12,000", gst: "INR 20,160", status: "Review" },
];

export default function Step8Expenses() {
  return (
    <AccountingPage
      title="Expense Management"
      description="Record business expenses, vendor bills, GST input, bill proofs, department budgets, and approval status."
      icon={IndianRupee}
      badge="Daily finance"
      actions={
        <>
          <ActionButton icon={FileUp} label="Upload Bill" variant="outline" />
          <ActionButton icon={Plus} label="New Expense" variant="accent" />
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="This Month" value="INR 8.9L" helper="Approved expenses" icon={TrendingDown} tone="red" />
        <MetricCard label="Pending Approval" value="INR 2.1L" helper="6 expense claims" icon={ShieldCheck} tone="amber" />
        <MetricCard label="GST Input" value="INR 1.36L" helper="Eligible credit" icon={ReceiptText} tone="green" />
        <MetricCard label="Recurring Spend" value="INR 4.7L" helper="Cloud, tools, internet" icon={WalletCards} tone="blue" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel title="Expense Entry" description="Every expense should map vendor, category, GST treatment, proof, and approval flow.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Expense ID" value="EXP-AUTO-425" required />
            <Field label="Expense Date" type="date" value="2026-06-11" required />
            <Field label="Vendor" value="Amazon Web Services India" options={["Amazon Web Services India", "Airtel Business", "Meta Ads", "TechDepot Hardware", "Office Landlord"]} required />
            <Field label="Category" value="Software Licenses" options={["Rent", "Internet", "Electricity", "Marketing", "Travel", "Software Licenses", "Hardware", "Miscellaneous"]} required />
            <Field label="Type" value="Business" options={["Business", "Employee Reimbursement", "Recurring Subscription", "Capital Purchase", "Petty Cash"]} />
            <Field label="Payment Mode" value="Company Card" options={["Company Card", "UPI", "NEFT", "Cash", "Cheque", "Auto Debit"]} />
            <Field label="Amount" type="number" value="245000" required />
            <Field label="Currency" value="INR" options={["INR", "USD", "AED", "GBP", "EUR"]} />
            <Field label="GST Applicable" value="Yes" options={["Yes", "No", "Reverse Charge", "Import Service"]} />
            <Field label="GST Amount" type="number" value="44100" />
            <Field label="Total Amount" type="number" value="289100" />
            <Field label="Approval Status" value="Pending Approval" options={["Draft", "Pending Approval", "Approved", "Rejected", "Paid"]} />
            <div className="md:col-span-2">
              <Field label="Title" value="AWS monthly production hosting and RDS backup" required />
            </div>
            <div className="md:col-span-2">
              <Field label="Description / Remarks" value="Production infrastructure for client CRM deployments. Allocate to Engineering and Cloud Ops budgets." multiline />
            </div>
          </div>
        </Panel>

        <Panel title="Expense Policy Controls" description="Practical checks reduce leakage and duplicate bills.">
          <div className="space-y-4">
            {[
              ["Duplicate Bill", "Warn if same vendor, bill number, and amount already exists.", "red"],
              ["Budget Impact", "Block approval if department budget crosses threshold.", "amber"],
              ["GST Input", "Only approved vendor GSTIN and valid bill can claim input credit.", "green"],
              ["Recurring Expense", "Subscriptions can auto-create draft expenses every month.", "blue"],
            ].map(([title, text, tone]) => (
              <div key={title} className="rounded-xl border border-border bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <Tags size={16} className="text-primary" />
                  <StatusBadge tone={tone as "red" | "amber" | "green" | "blue"}>{title}</StatusBadge>
                </div>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Expense Register" description="Finance can reconcile vendor bills, approvals, GST input, and department budgets.">
        <DataTable columns={["Expense", "Date", "Vendor", "Category", "Amount", "GST", "Status"]}>
          {expenses.map((expense) => (
            <tr key={expense.id} className="text-sm">
              <td className="px-4 py-4 font-black text-primary">{expense.id}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{expense.date}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{expense.vendor}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{expense.category}</td>
              <td className="px-4 py-4 font-black text-primary">{expense.amount}</td>
              <td className="px-4 py-4 font-black text-primary">{expense.gst}</td>
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

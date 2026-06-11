"use client";

import { CalendarCheck2, Download, Percent, ReceiptText, Send, ShieldCheck, Wallet } from "lucide-react";
import { AccountingPage, ActionButton, DataTable, Field, MetricCard, Panel, StatusBadge } from "./AccountingComponents";

const gstRows = [
  { period: "Apr 2026", sales: "INR 18.4L", output: "INR 3.31L", input: "INR 1.08L", payable: "INR 2.23L", status: "Filed" },
  { period: "May 2026", sales: "INR 22.7L", output: "INR 4.09L", input: "INR 1.42L", payable: "INR 2.67L", status: "Filed" },
  { period: "Jun 2026", sales: "INR 14.6L", output: "INR 2.63L", input: "INR 1.36L", payable: "INR 1.27L", status: "Working" },
];

export default function Step11GST() {
  return (
    <AccountingPage
      title="GST Management"
      description="Prepare monthly GST summary using approved invoices, credit notes, vendor GST input, filing status, and filed-by audit details."
      icon={Percent}
      badge="Indian compliance"
      actions={
        <>
          <ActionButton icon={Download} label="GST Summary" variant="outline" />
          <ActionButton icon={Send} label="Mark Filed" variant="accent" />
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Sales" value="INR 14.6L" helper="June 2026" icon={ReceiptText} tone="blue" />
        <MetricCard label="Output GST" value="INR 2.63L" helper="Sales liability" icon={Percent} tone="amber" />
        <MetricCard label="Input GST" value="INR 1.36L" helper="Vendor bills" icon={Wallet} tone="green" />
        <MetricCard label="Net Payable" value="INR 1.27L" helper="Before final filing" icon={ShieldCheck} tone="purple" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel title="GST Period Summary" description="Use locked invoices and approved expenses only for GST working.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Company GSTIN" value="27ABCDE1234F1Z5" required />
            <Field label="GST Period" value="June 2026" required />
            <Field label="Total Sales" type="number" value="1460000" />
            <Field label="Output GST" type="number" value="262800" />
            <Field label="Total Purchases" type="number" value="755000" />
            <Field label="Input GST" type="number" value="136000" />
            <Field label="Net GST Payable" type="number" value="126800" />
            <Field label="Filing Status" value="Working" options={["Working", "Ready for Review", "Filed", "Revised", "Blocked"]} />
            <Field label="Filing Date" type="date" value="2026-07-18" />
            <Field label="Filed By" value="Finance Manager" />
          </div>
        </Panel>

        <Panel title="GST Checks" description="Practical checks before filing support.">
          <div className="space-y-4">
            {[
              ["Invoice Lock", "Only approved invoices should hit sales register.", "green"],
              ["Credit Notes", "Approved credit notes reduce output GST.", "blue"],
              ["Vendor GSTIN", "Input credit only if vendor GSTIN and bill proof exist.", "amber"],
              ["Export / LUT", "Export service invoices need separate GST treatment.", "purple"],
            ].map(([title, text, tone]) => (
              <div key={title} className="rounded-xl border border-border bg-slate-50 p-4">
                <StatusBadge tone={tone as "green" | "blue" | "amber" | "purple"}>{title}</StatusBadge>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="GST Filing Register" description="Month-wise view for management and compliance team.">
        <DataTable columns={["Period", "Sales", "Output GST", "Input GST", "Net Payable", "Status"]}>
          {gstRows.map((row) => (
            <tr key={row.period} className="text-sm">
              <td className="px-4 py-4">
                <div className="flex items-center gap-2 font-black text-primary">
                  <CalendarCheck2 size={15} />
                  {row.period}
                </div>
              </td>
              <td className="px-4 py-4 font-semibold text-slate-600">{row.sales}</td>
              <td className="px-4 py-4 font-black text-primary">{row.output}</td>
              <td className="px-4 py-4 font-black text-primary">{row.input}</td>
              <td className="px-4 py-4 font-black text-primary">{row.payable}</td>
              <td className="px-4 py-4">
                <StatusBadge tone={row.status === "Filed" ? "green" : "amber"}>{row.status}</StatusBadge>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </AccountingPage>
  );
}

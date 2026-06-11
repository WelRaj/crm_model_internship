"use client";

import { AlertTriangle, FileCheck2, FilePlus2, Lock, Receipt, Send, TimerReset } from "lucide-react";
import { AccountingPage, ActionButton, DataTable, Field, MetricCard, Panel, StatusBadge } from "./AccountingComponents";

const invoices = [
  { id: "INV-2026-088", quotation: "QT-2026-042", client: "Nexa Retail Cloud", amount: "INR 12,75,000", due: "21 Jun 2026", status: "Approved", payment: "Partially Paid" },
  { id: "INV-2026-089", quotation: "QT-2026-041", client: "Apex Finserve Pvt Ltd", amount: "INR 9,44,000", due: "26 Jun 2026", status: "Draft", payment: "Not Raised" },
  { id: "INV-2026-083", quotation: "QT-2026-037", client: "Bluebird Logistics", amount: "INR 3,20,000", due: "05 Jun 2026", status: "Approved", payment: "Overdue" },
  { id: "INV-2026-080", quotation: "QT-2026-030", client: "Orbit HR Tech", amount: "INR 1,85,000", due: "15 Jun 2026", status: "Cancel Requested", payment: "Credit Note Required" },
];

export default function Step4Invoices() {
  return (
    <AccountingPage
      title="Invoice Management"
      description="Create legal tax invoices from accepted quotations, lock approved records, and route cancellations through credit notes."
      icon={Receipt}
      badge="Legal billing"
      actions={
        <>
          <ActionButton icon={Send} label="Send Invoice" variant="outline" />
          <ActionButton icon={FilePlus2} label="New Invoice" variant="accent" />
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Approved Invoices" value="INR 46.8L" helper="Current financial year" icon={FileCheck2} tone="green" />
        <MetricCard label="Due This Week" value="INR 7.4L" helper="4 invoices" icon={TimerReset} tone="amber" />
        <MetricCard label="Overdue" value="INR 3.2L" helper="Escalated to reminders" icon={AlertTriangle} tone="red" />
        <MetricCard label="Pending Approval" value="09" helper="Draft invoices" icon={Lock} tone="blue" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel title="Invoice Details" description="Approved invoice becomes read-only. Cancel flow must create credit note instead of editing history.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Invoice ID" value="INV-AUTO-090" required />
            <Field label="Invoice Date" type="date" value="2026-06-11" required />
            <Field label="Quotation ID" value="QT-2026-041" options={["QT-2026-041", "QT-2026-042", "QT-2026-043"]} />
            <Field label="Client" value="Apex Finserve Pvt Ltd" options={["Apex Finserve Pvt Ltd", "Nexa Retail Cloud", "Bluebird Logistics", "Orbit HR Tech"]} required />
            <Field label="Project ID" value="PRJ-CRM-102" />
            <Field label="Payment Terms" value="Net 15" options={["100% Advance", "50% Advance", "Milestone", "Net 7", "Net 15", "Net 30"]} />
            <Field label="Fixed Price" type="number" value="840000" />
            <Field label="Discount" type="number" value="40000" />
            <Field label="GST Details" value="CGST 9% + SGST 9%" options={["IGST 18%", "CGST 9% + SGST 9%", "GST Exempt", "Export LUT"]} />
            <Field label="Total Amount" type="number" value="944000" required />
            <Field label="Due Date" type="date" value="2026-06-26" required />
            <Field label="Approval Status" value="Draft" options={["Draft", "Pending Approval", "Approved", "Rejected", "Cancel Requested"]} />
            <div className="md:col-span-2">
              <Field label="Service Description" value="CRM web application phase 1 delivery with admin panel, lead module, and billing integration." multiline />
            </div>
            <div className="md:col-span-2">
              <Field label="Remarks" placeholder="Internal finance notes" multiline />
            </div>
          </div>
        </Panel>

        <Panel title="Invoice Rules" description="These rules keep billing records audit-safe.">
          <div className="space-y-4">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <StatusBadge tone="blue">Draft</StatusBadge>
              <p className="mt-3 text-sm font-semibold leading-6 text-blue-800">Editable by accountant until approval request is submitted.</p>
            </div>
            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
              <StatusBadge tone="green">Approved</StatusBadge>
              <p className="mt-3 text-sm font-semibold leading-6 text-green-800">Read-only and available for payment tracking, TDS, and GST sales register.</p>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <StatusBadge tone="red">Cancel</StatusBadge>
              <p className="mt-3 text-sm font-semibold leading-6 text-red-800">Requires credit note approval. Do not delete invoice rows from ledger.</p>
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Invoice Register" description="Operational view for finance, sales, and project owners.">
        <DataTable columns={["Invoice", "Quotation", "Client", "Amount", "Due Date", "Invoice Status", "Payment"]}>
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="text-sm">
              <td className="px-4 py-4 font-black text-primary">{invoice.id}</td>
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

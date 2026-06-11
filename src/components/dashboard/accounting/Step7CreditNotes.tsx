"use client";

import { Ban, CheckCircle2, FileMinus2, RotateCcw, ShieldCheck, Wallet, XCircle } from "lucide-react";
import { AccountingPage, ActionButton, DataTable, Field, MetricCard, Panel, StatusBadge } from "./AccountingComponents";

const creditNotes = [
  { id: "CN-2026-014", invoice: "INV-2026-080", client: "Orbit HR Tech", reason: "Scope reduction", amount: "INR 36,000", gst: "INR 6,480", status: "Approved" },
  { id: "CN-2026-015", invoice: "INV-2026-071", client: "KraftEdge Export LLP", reason: "Billing correction", amount: "INR 18,500", gst: "INR 3,330", status: "Pending Approval" },
  { id: "CN-2026-016", invoice: "INV-2026-066", client: "Nexa Retail Cloud", reason: "Refund adjustment", amount: "INR 42,000", gst: "INR 7,560", status: "Draft" },
];

export default function Step7CreditNotes() {
  return (
    <AccountingPage
      title="Credit Note Management"
      description="Adjust approved invoices without breaking audit trail. Use credit notes for refunds, cancellations, GST corrections, and scope reductions."
      icon={RotateCcw}
      badge="Invoice correction"
      actions={
        <>
          <ActionButton icon={FileMinus2} label="Issue Credit Note" variant="accent" />
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Issued This Month" value="INR 1.12L" helper="Before GST adjustment" icon={FileMinus2} tone="blue" />
        <MetricCard label="GST Adjustment" value="INR 20.1K" helper="Sales register impact" icon={Wallet} tone="amber" />
        <MetricCard label="Pending Approval" value="03" helper="Finance manager queue" icon={ShieldCheck} tone="purple" />
        <MetricCard label="Refund Risk" value="01" helper="Client escalation" icon={Ban} tone="red" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel title="Credit Note Details" description="Credit note should reference original invoice and carry GST adjustment separately.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Credit Note ID" value="CN-AUTO-017" required />
            <Field label="Date" type="date" value="2026-06-11" required />
            <Field label="Invoice ID" value="INV-2026-080" options={["INV-2026-080", "INV-2026-071", "INV-2026-066"]} required />
            <Field label="Client" value="Orbit HR Tech" options={["Orbit HR Tech", "KraftEdge Export LLP", "Nexa Retail Cloud"]} />
            <Field label="Reason" value="Scope Reduction" options={["Scope Reduction", "Billing Correction", "Refund Adjustment", "Project Cancelled", "GST Correction"]} required />
            <Field label="Credit Amount" type="number" value="36000" required />
            <Field label="GST Adjustment" type="number" value="6480" />
            <Field label="Total Credit" type="number" value="42480" />
            <Field label="Status" value="Pending Approval" options={["Draft", "Pending Approval", "Approved", "Rejected", "Posted"]} />
            <Field label="Approved By" value="Finance Manager" />
            <div className="md:col-span-2">
              <Field label="Remarks" value="Client removed analytics dashboard from scope after invoice approval." multiline />
            </div>
          </div>
        </Panel>

        <Panel title="Posting Rules" description="Protect GST, revenue, and audit records.">
          <div className="space-y-4">
            <div className="flex gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
              <CheckCircle2 className="mt-1 text-green-700" size={20} />
              <p className="text-sm font-semibold leading-6 text-green-800">Approved credit note reduces outstanding and updates GST sales adjustment.</p>
            </div>
            <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <ShieldCheck className="mt-1 text-amber-700" size={20} />
              <p className="text-sm font-semibold leading-6 text-amber-800">High value credit note needs finance manager or director approval.</p>
            </div>
            <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <XCircle className="mt-1 text-red-700" size={20} />
              <p className="text-sm font-semibold leading-6 text-red-800">Never delete approved invoice. Use credit note for correction and keep audit log.</p>
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Credit Note Register" description="Shows commercial correction and tax adjustment in one place.">
        <DataTable columns={["Credit Note", "Invoice", "Client", "Reason", "Credit Amount", "GST Adj.", "Status"]}>
          {creditNotes.map((note) => (
            <tr key={note.id} className="text-sm">
              <td className="px-4 py-4 font-black text-primary">{note.id}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{note.invoice}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{note.client}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{note.reason}</td>
              <td className="px-4 py-4 font-black text-primary">{note.amount}</td>
              <td className="px-4 py-4 font-black text-primary">{note.gst}</td>
              <td className="px-4 py-4">
                <StatusBadge tone={note.status === "Approved" ? "green" : note.status === "Draft" ? "slate" : "amber"}>{note.status}</StatusBadge>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </AccountingPage>
  );
}

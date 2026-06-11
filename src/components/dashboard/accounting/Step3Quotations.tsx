"use client";

import { CheckCircle2, Clock, FileText, Plus, Send, ShieldCheck, TrendingUp, Wallet } from "lucide-react";
import { AccountingPage, ActionButton, DataTable, Field, MetricCard, Panel, StatusBadge, WorkflowSteps } from "./AccountingComponents";

const quotations = [
  { id: "QT-2026-041", client: "Apex Finserve Pvt Ltd", service: "Loan CRM Web App", amount: "INR 8,40,000", valid: "25 Jun 2026", status: "Approved", owner: "Finance Manager" },
  { id: "QT-2026-042", client: "Nexa Retail Cloud", service: "E-commerce Mobile App", amount: "INR 12,75,000", valid: "28 Jun 2026", status: "Client Accepted", owner: "Director" },
  { id: "QT-2026-043", client: "Bluebird Logistics", service: "Fleet Dashboard", amount: "INR 3,20,000", valid: "18 Jun 2026", status: "Pending Approval", owner: "Finance Manager" },
  { id: "QT-2026-044", client: "Orbit HR Tech", service: "HRMS Integration", amount: "INR 1,85,000", valid: "20 Jun 2026", status: "Draft", owner: "Accountant" },
];

export default function Step3Quotations() {
  return (
    <AccountingPage
      title="Quotation Management"
      description="Convert won leads into approved commercial proposals with pricing, GST, validity, acceptance, and invoice handoff."
      icon={FileText}
      badge="Lead to billing"
      actions={
        <>
          <ActionButton icon={Send} label="Send Proposal" variant="outline" />
          <ActionButton icon={Plus} label="New Quotation" variant="accent" />
        </>
      }
    >
      <WorkflowSteps steps={["Lead Won", "Quotation Draft", "Approval", "Client Acceptance", "Invoice"]} />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Open Quotations" value="32" helper="12 awaiting client response" icon={FileText} tone="blue" />
        <MetricCard label="Accepted Value" value="INR 28.4L" helper="Ready for invoicing" icon={TrendingUp} tone="green" />
        <MetricCard label="Pending Approval" value="07" helper="Above accountant threshold" icon={Clock} tone="amber" />
        <MetricCard label="Avg Discount" value="8.5%" helper="Across current month" icon={Wallet} tone="purple" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel title="Quotation Builder" description="Price service scope once and carry approved numbers into invoice without manual re-entry.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Quotation ID" value="QT-AUTO-045" required />
            <Field label="Quotation Date" type="date" value="2026-06-11" required />
            <Field label="Client" value="Apex Finserve Pvt Ltd" options={["Apex Finserve Pvt Ltd", "Nexa Retail Cloud", "Bluebird Logistics", "Orbit HR Tech"]} required />
            <Field label="Project ID" value="PRJ-CRM-102" required />
            <Field label="Currency" value="INR" options={["INR", "USD", "AED", "GBP", "EUR"]} />
            <Field label="Valid Till" type="date" value="2026-06-25" required />
            <Field label="Fixed Price" value="840000" type="number" required />
            <Field label="Discount" value="40000" type="number" />
            <Field label="GST %" value="18" options={["0", "5", "12", "18"]} required />
            <Field label="GST Amount" value="144000" type="number" />
            <Field label="Total Amount" value="944000" type="number" required />
            <Field label="Status" value="Draft" options={["Draft", "Pending Approval", "Approved", "Client Accepted", "Rejected", "Expired"]} />
            <div className="md:col-span-2">
              <Field label="Service Description" value="Discovery, UI design, CRM web app, admin panel, APIs, deployment, and 60 days support." multiline required />
            </div>
          </div>
        </Panel>

        <Panel title="Approval & Acceptance" description="Approval is based on quote amount, discount, and commercial risk.">
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-slate-50 p-4">
              <StatusBadge tone="green">0 to INR 50,000</StatusBadge>
              <p className="mt-3 text-sm font-black text-primary">Accountant can approve.</p>
            </div>
            <div className="rounded-xl border border-border bg-slate-50 p-4">
              <StatusBadge tone="amber">INR 50,001 to INR 5,00,000</StatusBadge>
              <p className="mt-3 text-sm font-black text-primary">Finance Manager approval required.</p>
            </div>
            <div className="rounded-xl border border-border bg-slate-50 p-4">
              <StatusBadge tone="red">Above INR 5,00,000</StatusBadge>
              <p className="mt-3 text-sm font-black text-primary">Director approval required before client send.</p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
              <CheckCircle2 className="text-green-700" size={20} />
              <p className="text-sm font-semibold text-green-800">Client accepted quotation can generate draft invoice automatically.</p>
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Quotation Pipeline" description="Track commercial stage before legal invoice creation.">
        <DataTable columns={["Quotation", "Client", "Service", "Amount", "Valid Till", "Status", "Approver"]}>
          {quotations.map((quote) => (
            <tr key={quote.id} className="text-sm">
              <td className="px-4 py-4 font-black text-primary">{quote.id}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{quote.client}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{quote.service}</td>
              <td className="px-4 py-4 font-black text-primary">{quote.amount}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{quote.valid}</td>
              <td className="px-4 py-4">
                <StatusBadge tone={quote.status === "Client Accepted" || quote.status === "Approved" ? "green" : quote.status === "Draft" ? "slate" : "amber"}>
                  {quote.status}
                </StatusBadge>
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-2 font-semibold text-slate-600">
                  <ShieldCheck size={15} />
                  {quote.owner}
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </AccountingPage>
  );
}

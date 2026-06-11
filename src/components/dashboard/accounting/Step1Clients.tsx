"use client";

import { Download, Plus, Search, ShieldCheck, Users, Wallet, AlertTriangle } from "lucide-react";
import { AccountingPage, ActionButton, DataTable, Field, MetricCard, Panel, StatusBadge } from "./AccountingComponents";

const clients = [
  { id: "CL-24001", name: "Apex Finserve Pvt Ltd", contact: "Rohit Mehta", gstin: "27AAHCA8123D1Z6", terms: "Net 15", status: "Active", outstanding: "INR 4,80,000" },
  { id: "CL-24002", name: "Nexa Retail Cloud", contact: "Priya Nair", gstin: "29AAECN4471B1ZW", terms: "50% Advance", status: "Active", outstanding: "INR 0" },
  { id: "CL-24003", name: "Bluebird Logistics", contact: "Amit Soni", gstin: "06AAGCB9122K1ZP", terms: "Milestone", status: "On Hold", outstanding: "INR 1,25,000" },
  { id: "CL-24004", name: "KraftEdge Export LLP", contact: "Neha Jain", gstin: "07AAIFK2210M1Z4", terms: "Net 30", status: "Blacklisted", outstanding: "INR 78,500" },
];

export default function Step1Clients() {
  return (
    <AccountingPage
      title="Client Master"
      description="Central client record used by quotations, invoices, payments, TDS certificates, reminders, and project billing."
      icon={Users}
      badge="Single source of truth"
      actions={
        <>
          <ActionButton icon={Search} label="Search GSTIN" variant="outline" />
          <ActionButton icon={Download} label="Export Clients" variant="outline" />
          <ActionButton icon={Plus} label="New Client" variant="accent" />
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active Clients" value="128" helper="14 added this quarter" icon={Users} tone="blue" />
        <MetricCard label="Receivables" value="INR 18.7L" helper="Open approved invoices" icon={Wallet} tone="amber" />
        <MetricCard label="GST Verified" value="94%" helper="GSTIN and PAN mapped" icon={ShieldCheck} tone="green" />
        <MetricCard label="Credit Risk" value="03" helper="On hold or blacklisted" icon={AlertTriangle} tone="red" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel title="Create / Update Client" description="Do not re-enter these details on every invoice. Select client and auto-fill billing data.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Client ID" value="CL-AUTO-0005" required />
            <Field label="Client Status" value="Active" options={["Active", "Inactive", "On Hold", "Blacklisted"]} required />
            <Field label="Company Name" placeholder="Registered company name" required />
            <Field label="Contact Person" placeholder="Primary finance contact" required />
            <Field label="Email" type="email" placeholder="accounts@client.com" required />
            <Field label="Mobile Number" placeholder="+91 98765 43210" required />
            <Field label="Alternate Number" placeholder="Optional escalation contact" />
            <Field label="Currency Preference" value="INR" options={["INR", "USD", "AED", "GBP", "EUR"]} />
            <Field label="GSTIN" placeholder="27ABCDE1234F1Z5" required />
            <Field label="PAN Number" placeholder="ABCDE1234F" required />
            <Field label="Default Payment Terms" value="Net 15" options={["100% Advance", "50% Advance", "Milestone", "Net 7", "Net 15", "Net 30"]} />
            <Field label="Created Date" type="date" value="2026-06-11" />
            <div className="md:col-span-2">
              <Field label="Billing Address" placeholder="Registered address for tax invoice" multiline required />
            </div>
            <div className="md:col-span-2">
              <Field label="Shipping / Project Address" placeholder="Project delivery or branch address" multiline />
            </div>
          </div>
        </Panel>

        <Panel title="Operational Controls" description="Practical rules to protect billing and collection quality.">
          <div className="space-y-4">
            {[
              ["Duplicate GSTIN", "Block duplicate active clients with same GSTIN and PAN.", "green"],
              ["Credit Limit", "Warn finance if receivable crosses approved limit.", "amber"],
              ["Blacklisted Client", "Disable quotation, invoice, and new project creation.", "red"],
              ["TDS Mapping", "Track client TDS certificates against invoice settlement.", "blue"],
            ].map(([title, text, tone]) => (
              <div key={title} className="rounded-xl border border-border bg-slate-50 p-4">
                <StatusBadge tone={tone as "green" | "amber" | "red" | "blue"}>{title}</StatusBadge>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Client Ledger" description="Finance team can scan GST status, default terms, and outstanding amount before creating documents.">
        <DataTable columns={["Client", "GSTIN", "Payment Terms", "Outstanding", "Status"]}>
          {clients.map((client) => (
            <tr key={client.id} className="text-sm">
              <td className="px-4 py-4">
                <p className="font-black text-primary">{client.name}</p>
                <p className="text-xs font-semibold text-slate-500">{client.id} - {client.contact}</p>
              </td>
              <td className="px-4 py-4 font-semibold text-slate-600">{client.gstin}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{client.terms}</td>
              <td className="px-4 py-4 font-black text-primary">{client.outstanding}</td>
              <td className="px-4 py-4">
                <StatusBadge tone={client.status === "Active" ? "green" : client.status === "Blacklisted" ? "red" : "amber"}>
                  {client.status}
                </StatusBadge>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </AccountingPage>
  );
}

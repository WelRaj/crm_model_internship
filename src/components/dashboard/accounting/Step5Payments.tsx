"use client";

import { Banknote, CalendarCheck2, FileUp, Landmark, Plus, ReceiptText, Wallet, WalletCards } from "lucide-react";
import { AccountingPage, ActionButton, DataTable, Field, MetricCard, Panel, ProgressBar, StatusBadge } from "./AccountingComponents";

const milestones = [
  { name: "Project Kickoff Advance", amount: "INR 4,72,000", due: "12 Jun 2026", received: "11 Jun 2026", mode: "NEFT", status: "Received" },
  { name: "UI Approval Milestone", amount: "INR 2,36,000", due: "30 Jun 2026", received: "-", mode: "-", status: "Upcoming" },
  { name: "UAT Delivery Milestone", amount: "INR 1,88,800", due: "18 Jul 2026", received: "-", mode: "-", status: "Upcoming" },
  { name: "Final Go-Live", amount: "INR 47,200", due: "30 Jul 2026", received: "-", mode: "-", status: "Pending" },
];

export default function Step5Payments() {
  return (
    <AccountingPage
      title="Payment Tracking"
      description="Track advance, milestone, final payment, proof uploads, TDS deduction, and outstanding amount against approved invoices."
      icon={Wallet}
      badge="Collections"
      actions={
        <>
          <ActionButton icon={FileUp} label="Upload Proof" variant="outline" />
          <ActionButton icon={Plus} label="Record Payment" variant="accent" />
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Invoice Amount" value="INR 9.44L" helper="INV-2026-090" icon={ReceiptText} tone="blue" />
        <MetricCard label="Received" value="INR 4.72L" helper="50% advance cleared" icon={Banknote} tone="green" />
        <MetricCard label="Pending" value="INR 4.72L" helper="Milestone linked" icon={WalletCards} tone="amber" />
        <MetricCard label="Collection Score" value="50%" helper="Auto calculated" icon={CalendarCheck2} tone="purple" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel title="Advance Payment" description="Advance can be mandatory based on client default terms or quotation agreement.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Payment ID" value="PAY-AUTO-118" required />
            <Field label="Invoice ID" value="INV-2026-090" required />
            <Field label="Advance Amount" type="number" value="472000" required />
            <Field label="Payment Date" type="date" value="2026-06-11" />
            <Field label="Mode" value="NEFT" options={["NEFT", "RTGS", "IMPS", "UPI", "Cheque", "Cash", "Stripe", "Razorpay"]} />
            <Field label="Status" value="Received" options={["Pending", "Received", "Partially Matched", "Failed", "Refunded"]} />
          </div>
          <div className="mt-4 rounded-xl border border-dashed border-border bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <FileUp className="text-primary" size={20} />
              <p className="text-sm font-black text-primary">Attach bank screenshot, UTR, payment gateway report, or cheque scan.</p>
            </div>
          </div>
        </Panel>

        <Panel title="Payment Summary" description="Outstanding must account for received amount and client TDS deduction.">
          <div className="space-y-5">
            <div>
              <div className="mb-2 flex justify-between text-xs font-black uppercase tracking-widest text-slate-500">
                <span>Collection Progress</span>
                <span>50%</span>
              </div>
              <ProgressBar value={50} tone="blue" />
            </div>
            {[
              ["Invoice Amount", "INR 9,44,000"],
              ["Received Amount", "INR 4,72,000"],
              ["Expected Client TDS", "INR 94,400"],
              ["Net Pending", "INR 3,77,600"],
              ["Payment Status", "Partially Paid"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-xl border border-border bg-slate-50 px-4 py-3">
                <span className="text-xs font-black uppercase tracking-widest text-slate-500">{label}</span>
                <span className="text-sm font-black text-primary">{value}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Milestone Payment Schedule" description="Real IT projects usually collect against delivery checkpoints instead of a single payment.">
        <DataTable columns={["Milestone", "Amount", "Due Date", "Received Date", "Mode", "Status"]}>
          {milestones.map((milestone) => (
            <tr key={milestone.name} className="text-sm">
              <td className="px-4 py-4 font-black text-primary">{milestone.name}</td>
              <td className="px-4 py-4 font-black text-primary">{milestone.amount}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{milestone.due}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{milestone.received}</td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-2 font-semibold text-slate-600">
                  <Landmark size={15} />
                  {milestone.mode}
                </div>
              </td>
              <td className="px-4 py-4">
                <StatusBadge tone={milestone.status === "Received" ? "green" : milestone.status === "Upcoming" ? "blue" : "amber"}>
                  {milestone.status}
                </StatusBadge>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </AccountingPage>
  );
}

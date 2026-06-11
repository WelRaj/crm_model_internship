"use client";

import { CheckCircle2, Clock, IndianRupee, Send, ShieldCheck, UserCheck, XCircle } from "lucide-react";
import { AccountingPage, ActionButton, DataTable, Field, MetricCard, Panel, StatusBadge, WorkflowSteps } from "./AccountingComponents";

const approvalQueue = [
  { id: "APP-901", module: "Quotation", record: "QT-2026-043", amount: "INR 3,20,000", requester: "Sales Team", approver: "Finance Manager", status: "Pending" },
  { id: "APP-902", module: "Expense", record: "EXP-2026-423", amount: "INR 65,000", requester: "Marketing", approver: "Finance Manager", status: "Pending" },
  { id: "APP-903", module: "Salary", record: "SAL-2026-062", amount: "INR 1,02,600", requester: "HR", approver: "Director", status: "In Review" },
  { id: "APP-904", module: "Credit Note", record: "CN-2026-015", amount: "INR 21,830", requester: "Accountant", approver: "Finance Manager", status: "Approved" },
];

export default function Step14Approvals() {
  return (
    <AccountingPage
      title="Approval Matrix"
      description="Route approvals to the right owner based on module, amount, and risk so directors are not a bottleneck."
      icon={ShieldCheck}
      badge="Control layer"
      actions={
        <>
          <ActionButton icon={Send} label="Send Reminder" variant="outline" />
          <ActionButton icon={CheckCircle2} label="Bulk Approve" variant="accent" />
        </>
      }
    >
      <WorkflowSteps steps={["Request Raised", "Policy Check", "Approver Review", "Approve / Reject", "Audit Log"]} />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Pending Requests" value="18" helper="Across finance modules" icon={Clock} tone="amber" />
        <MetricCard label="Approved Today" value="09" helper="Average 2.4h closure" icon={CheckCircle2} tone="green" />
        <MetricCard label="Rejected" value="02" helper="Policy mismatch" icon={XCircle} tone="red" />
        <MetricCard label="Director Queue" value="04" helper="High value approvals" icon={UserCheck} tone="purple" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel title="Approval Policy" description="Configure who approves each type of accounting action.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Module" value="Quotation" options={["Quotation", "Invoice", "Expense", "Salary", "Credit Note", "Budget"]} />
            <Field label="Amount Slab" value="INR 50,001 to INR 5,00,000" options={["INR 0 to INR 50,000", "INR 50,001 to INR 5,00,000", "Above INR 5,00,000"]} />
            <Field label="Primary Approver" value="Finance Manager" options={["Accountant", "Finance Manager", "HR Manager", "Director"]} />
            <Field label="Escalation After" value="24 Hours" options={["4 Hours", "12 Hours", "24 Hours", "48 Hours"]} />
            <Field label="Backup Approver" value="Director" options={["Finance Manager", "HR Manager", "Director", "Admin"]} />
            <Field label="Status" value="Active" options={["Active", "Inactive", "Draft"]} />
          </div>
        </Panel>

        <Panel title="Practical Matrix" description="Default rules for Indian IT company finance workflow.">
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-slate-50 p-4">
              <StatusBadge tone="blue">Quotation</StatusBadge>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">INR 0-50k Accountant, INR 50k-5L Finance Manager, above 5L Director.</p>
            </div>
            <div className="rounded-xl border border-border bg-slate-50 p-4">
              <StatusBadge tone="amber">Expense</StatusBadge>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">Low value Finance Manager, high value Director, budget breach requires escalation.</p>
            </div>
            <div className="rounded-xl border border-border bg-slate-50 p-4">
              <StatusBadge tone="green">Salary</StatusBadge>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">HR review, Finance Manager validation, Director final approval before payment release.</p>
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Approval Queue" description="Every approval request should be visible with amount, approver, and current stage.">
        <DataTable columns={["ID", "Module", "Record", "Amount", "Requester", "Approver", "Status"]}>
          {approvalQueue.map((item) => (
            <tr key={item.id} className="text-sm">
              <td className="px-4 py-4 font-black text-primary">{item.id}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{item.module}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{item.record}</td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-2 font-black text-primary">
                  <IndianRupee size={15} />
                  {item.amount.replace("INR ", "")}
                </div>
              </td>
              <td className="px-4 py-4 font-semibold text-slate-600">{item.requester}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{item.approver}</td>
              <td className="px-4 py-4">
                <StatusBadge tone={item.status === "Approved" ? "green" : item.status === "In Review" ? "blue" : "amber"}>{item.status}</StatusBadge>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </AccountingPage>
  );
}

"use client";

import { Download, Eye, FileClock, Filter, History, LockKeyhole, ShieldAlert } from "lucide-react";
import { AccountingPage, ActionButton, DataTable, Field, MetricCard, Panel, StatusBadge } from "./AccountingComponents";

const logs = [
  { id: "LOG-9001", user: "Rajkumar Rathore", module: "Invoice", action: "Approved", record: "INV-2026-088", oldValue: "Pending Approval", newValue: "Approved", ip: "103.87.44.12", time: "11 Jun 2026, 10:14 AM" },
  { id: "LOG-9002", user: "Sunita Sharma", module: "Salary", action: "Updated", record: "SAL-2026-062", oldValue: "TDS 12000", newValue: "TDS 13400", ip: "103.87.44.18", time: "11 Jun 2026, 10:28 AM" },
  { id: "LOG-9003", user: "Finance Manager", module: "Expense", action: "Rejected", record: "EXP-2026-424", oldValue: "Pending", newValue: "Review Required", ip: "103.87.44.21", time: "11 Jun 2026, 11:02 AM" },
  { id: "LOG-9004", user: "Accountant", module: "Client", action: "Created", record: "CL-24005", oldValue: "-", newValue: "New client record", ip: "103.87.44.16", time: "11 Jun 2026, 11:45 AM" },
];

export default function Step15AuditLogs() {
  return (
    <AccountingPage
      title="Audit Logs"
      description="Production finance software must show user, module, action, record, before/after value, IP address, and timestamp."
      icon={History}
      badge="Compliance backbone"
      actions={
        <>
          <ActionButton icon={Filter} label="Filter Logs" variant="outline" />
          <ActionButton icon={Download} label="Export Audit" variant="accent" />
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Logs Today" value="284" helper="Across modules" icon={FileClock} tone="blue" />
        <MetricCard label="Critical Actions" value="17" helper="Approval, reject, delete" icon={ShieldAlert} tone="red" />
        <MetricCard label="Immutable Records" value="100%" helper="No direct delete allowed" icon={LockKeyhole} tone="green" />
        <MetricCard label="Review Queue" value="05" helper="Unusual changes" icon={Eye} tone="amber" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel title="Audit Search" description="Filter by module, user, date range, action, or record ID.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Search Record ID" value="INV-2026-088" />
            <Field label="Module" value="All Modules" options={["All Modules", "Client", "Vendor", "Quotation", "Invoice", "Payment", "Expense", "Salary", "GST", "TDS"]} />
            <Field label="Action" value="All Actions" options={["All Actions", "Created", "Updated", "Approved", "Rejected", "Cancelled", "Exported"]} />
            <Field label="User" value="All Users" options={["All Users", "Accountant", "Finance Manager", "HR Manager", "Director", "Admin"]} />
            <Field label="From Date" type="date" value="2026-06-01" />
            <Field label="To Date" type="date" value="2026-06-11" />
          </div>
        </Panel>

        <Panel title="Audit Policy" description="Real audit logs should be append-only and tamper-resistant.">
          <div className="space-y-4">
            {[
              ["Old vs New", "Capture changed fields for approvals, amounts, GST, TDS, and bank details.", "blue"],
              ["IP Address", "Store IP for security review and unusual login detection.", "amber"],
              ["No Delete", "Use reverse entry, credit note, or status change instead of hard deletion.", "red"],
              ["Export Trail", "Log report exports containing finance or salary data.", "green"],
            ].map(([title, text, tone]) => (
              <div key={title} className="rounded-xl border border-border bg-slate-50 p-4">
                <StatusBadge tone={tone as "blue" | "amber" | "red" | "green"}>{title}</StatusBadge>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Activity Trail" description="High-signal log stream for finance operations and security review.">
        <DataTable columns={["Log ID", "User", "Module", "Action", "Record", "Old Value", "New Value", "IP", "Timestamp"]}>
          {logs.map((log) => (
            <tr key={log.id} className="text-sm">
              <td className="px-4 py-4 font-black text-primary">{log.id}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{log.user}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{log.module}</td>
              <td className="px-4 py-4">
                <StatusBadge tone={log.action === "Rejected" ? "red" : log.action === "Approved" ? "green" : "blue"}>{log.action}</StatusBadge>
              </td>
              <td className="px-4 py-4 font-black text-primary">{log.record}</td>
              <td className="px-4 py-4 font-semibold text-slate-500">{log.oldValue}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{log.newValue}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{log.ip}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{log.time}</td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </AccountingPage>
  );
}

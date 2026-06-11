"use client";

import { CheckCircle2, KeyRound, Lock, Plus, Shield, ShieldCheck, UserCog, Users, XCircle } from "lucide-react";
import { AccountingPage, ActionButton, DataTable, Field, MetricCard, Panel, StatusBadge } from "./AccountingComponents";

const roles = [
  { role: "Accountant", users: 4, access: "Clients, Vendors, Quotations, Invoices, Payments, GST", approval: "Low quotation approval", status: "Active" },
  { role: "HR", users: 3, access: "Employees, Salary Structure, Payroll Draft, Payroll Reports", approval: "HR salary review", status: "Active" },
  { role: "Finance Manager", users: 2, access: "Expense Approval, Salary Approval, Reports, Budget Monitoring", approval: "Mid-value approvals", status: "Active" },
  { role: "Director/Admin", users: 2, access: "Full Access, Final Approvals, Audit Logs, All Reports", approval: "Final approval authority", status: "Protected" },
];

export default function Step16Access() {
  return (
    <AccountingPage
      title="Role & Access Control"
      description="Define who can view, create, approve, export, and audit accounting records across finance, HR, and management."
      icon={Lock}
      badge="Security"
      actions={
        <>
          <ActionButton icon={KeyRound} label="Permission Audit" variant="outline" />
          <ActionButton icon={Plus} label="New Role" variant="accent" />
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active Roles" value="08" helper="Finance and HR modules" icon={Shield} tone="blue" />
        <MetricCard label="Users Mapped" value="42" helper="Role-based permissions" icon={Users} tone="green" />
        <MetricCard label="Sensitive Exports" value="12" helper="Logged this month" icon={ShieldCheck} tone="amber" />
        <MetricCard label="Access Reviews" value="03" helper="Pending manager review" icon={UserCog} tone="purple" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel title="Role Setup" description="Assign module access carefully. Salary, audit logs, and final approvals need stricter permissions.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Role Name" value="Finance Manager" required />
            <Field label="Role Status" value="Active" options={["Active", "Inactive", "Protected"]} />
            <Field label="Can View Reports" value="Yes" options={["Yes", "No"]} />
            <Field label="Can Export" value="Limited" options={["No", "Limited", "All"]} />
            <Field label="Can Approve" value="Mid Value" options={["No", "Low Value", "Mid Value", "Final Approval"]} />
            <Field label="Audit Access" value="Read Only" options={["No Access", "Read Only", "Full Access"]} />
            <div className="md:col-span-2">
              <Field label="Allowed Modules" value="Expenses, Salary Approval, Reports, Budget Monitoring" multiline />
            </div>
          </div>
        </Panel>

        <Panel title="Security Rules" description="Simple rules that prevent accidental finance data exposure.">
          <div className="space-y-4">
            {[
              [CheckCircle2, "Accountant can create invoices, but cannot approve high value credit notes.", "green"],
              [CheckCircle2, "HR can prepare payroll, but finance validates deductions before payout.", "green"],
              [XCircle, "No one except Director/Admin can delete or unlock approved finance records.", "red"],
              [ShieldCheck, "Every export of salary, GST, TDS, and audit logs must create audit entry.", "blue"],
            ].map(([Icon, text, tone]) => {
              const RuleIcon = Icon as typeof CheckCircle2;
              return (
                <div key={text as string} className="flex gap-3 rounded-xl border border-border bg-slate-50 p-4">
                  <RuleIcon className="mt-1 text-primary" size={20} />
                  <div>
                    <StatusBadge tone={tone as "green" | "red" | "blue"}>{tone === "red" ? "Restricted" : "Allowed"}</StatusBadge>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{text as string}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <Panel title="Role Matrix" description="Production-ready starting point for accounting access in an Indian IT company.">
        <DataTable columns={["Role", "Users", "Access", "Approval Rights", "Status"]}>
          {roles.map((role) => (
            <tr key={role.role} className="text-sm">
              <td className="px-4 py-4 font-black text-primary">{role.role}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{role.users}</td>
              <td className="px-4 py-4 font-semibold leading-6 text-slate-600">{role.access}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{role.approval}</td>
              <td className="px-4 py-4">
                <StatusBadge tone={role.status === "Protected" ? "purple" : "green"}>{role.status}</StatusBadge>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </AccountingPage>
  );
}

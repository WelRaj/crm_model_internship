"use client";

import { CalendarDays, Download, ShieldCheck, UserSquare2, Users, Wallet, WalletCards } from "lucide-react";
import { AccountingPage, ActionButton, DataTable, Field, MetricCard, Panel, StatusBadge, WorkflowSteps } from "./AccountingComponents";

const payrollRows = [
  { id: "SAL-2026-061", employee: "EMP-102 - Rahul Verma", month: "June 2026", gross: "INR 92,000", deductions: "INR 9,800", net: "INR 82,200", status: "Approved" },
  { id: "SAL-2026-062", employee: "EMP-118 - Swati Joshi", month: "June 2026", gross: "INR 1,18,000", deductions: "INR 15,400", net: "INR 1,02,600", status: "Pending Finance" },
  { id: "SAL-2026-063", employee: "EMP-124 - Amir Khan", month: "June 2026", gross: "INR 76,000", deductions: "INR 6,700", net: "INR 69,300", status: "HR Review" },
];

export default function Step10Salary() {
  return (
    <AccountingPage
      title="Salary & Payroll"
      description="Manage employee salary structure, monthly payroll processing, statutory deductions, approvals, and bank payment status."
      icon={UserSquare2}
      badge="HR + Finance"
      actions={
        <>
          <ActionButton icon={Download} label="Salary Sheet" variant="outline" />
          <ActionButton icon={Wallet} label="Run Payroll" variant="accent" />
        </>
      }
    >
      <WorkflowSteps steps={["Attendance Lock", "HR Review", "Finance Check", "Director Approval", "Payment Release"]} />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Payroll Month" value="June 2026" helper="Attendance locked" icon={CalendarDays} tone="blue" />
        <MetricCard label="Gross Payroll" value="INR 24.8L" helper="56 employees" icon={WalletCards} tone="amber" />
        <MetricCard label="Net Payable" value="INR 21.9L" helper="After deductions" icon={Wallet} tone="green" />
        <MetricCard label="Pending Approval" value="11" helper="Finance and director" icon={ShieldCheck} tone="purple" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title="Employee Salary Structure" description="Stored once and used every month. HR owns structure; finance validates statutory deductions.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Employee ID" value="EMP-118" required />
            <Field label="Basic" type="number" value="52000" />
            <Field label="HRA" type="number" value="26000" />
            <Field label="Special Allowance" type="number" value="40000" />
            <Field label="PF Applicable" value="Yes" options={["Yes", "No"]} />
            <Field label="ESI Applicable" value="No" options={["Yes", "No"]} />
            <Field label="Professional Tax" type="number" value="200" />
            <Field label="TDS Applicable" value="Yes" options={["Yes", "No"]} />
          </div>
        </Panel>

        <Panel title="Monthly Processing" description="Payroll should show leave impact, deductions, approval owner, and payment status before release.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Salary ID" value="SAL-AUTO-064" required />
            <Field label="Month" value="June 2026" required />
            <Field label="Working Days" type="number" value="22" />
            <Field label="Present Days" type="number" value="21" />
            <Field label="Paid Leave" type="number" value="1" />
            <Field label="Unpaid Leave" type="number" value="0" />
            <Field label="Gross Salary" type="number" value="118000" />
            <Field label="Net Salary" type="number" value="102600" />
            <Field label="Payment Date" type="date" value="2026-06-30" />
            <Field label="Payment Status" value="Pending" options={["Pending", "Approved", "Paid", "Hold"]} />
          </div>
        </Panel>
      </div>

      <Panel title="Payroll Register" description="Production payroll must show deductions and approval state before bank file generation.">
        <DataTable columns={["Salary ID", "Employee", "Month", "Gross", "Deductions", "Net Salary", "Status"]}>
          {payrollRows.map((row) => (
            <tr key={row.id} className="text-sm">
              <td className="px-4 py-4 font-black text-primary">{row.id}</td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-2 font-semibold text-slate-600">
                  <Users size={15} />
                  {row.employee}
                </div>
              </td>
              <td className="px-4 py-4 font-semibold text-slate-600">{row.month}</td>
              <td className="px-4 py-4 font-black text-primary">{row.gross}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{row.deductions}</td>
              <td className="px-4 py-4 font-black text-primary">{row.net}</td>
              <td className="px-4 py-4">
                <StatusBadge tone={row.status === "Approved" ? "green" : row.status === "Pending Finance" ? "amber" : "blue"}>{row.status}</StatusBadge>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </AccountingPage>
  );
}

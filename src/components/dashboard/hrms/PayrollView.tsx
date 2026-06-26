"use client";

import { useState } from "react";
import { BadgeIndianRupee, CheckCircle2, Download, ShieldCheck, Wallet } from "lucide-react";
import { ActionButton, DataTable, MetricCard, Panel, StatusBadge } from "../accounting/AccountingComponents";

type PayrollStatus = "HR Review" | "Finance Review" | "Approved" | "Hold";

interface PayrollRecord {
  id: string;
  empId: string;
  name: string;
  month: string;
  basic: number;
  hra: number;
  allowance: number;
  conveyance: number;
  bonus: number;
  pf: number;
  pt: number;
  tds: number;
  advance: number;
  status: PayrollStatus;
}

const initialPayroll: PayrollRecord[] = [
  { id: "SAL-2026-061", empId: "EMP-102", name: "Rahul Verma", month: "June 2026", basic: 50000, hra: 20000, allowance: 10000, conveyance: 5000, bonus: 7000, pf: 6000, pt: 200, tds: 3000, advance: 600, status: "Approved" },
  { id: "SAL-2026-062", empId: "EMP-104", name: "Priya Nair", month: "June 2026", basic: 62000, hra: 24000, allowance: 8000, conveyance: 3000, bonus: 0, pf: 7440, pt: 200, tds: 4200, advance: 0, status: "Finance Review" },
];

function formatCurrency(value: number) {
  return `INR ${value.toLocaleString("en-IN")}`;
}

function csvEscape(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function totals(row: PayrollRecord) {
  const gross = row.basic + row.hra + row.allowance + row.conveyance + row.bonus;
  const deductions = row.pf + row.pt + row.tds + row.advance;
  return { gross, deductions, net: gross - deductions };
}

export default function PayrollView() {
  const [payroll, setPayroll] = useState(initialPayroll);
  const aggregate = payroll.reduce((sum, row) => {
    const total = totals(row);
    return { gross: sum.gross + total.gross, deductions: sum.deductions + total.deductions, net: sum.net + total.net };
  }, { gross: 0, deductions: 0, net: 0 });

  const exportCsv = () => {
    const rows = [
      ["ID", "Employee ID", "Name", "Month", "Gross", "Deductions", "Net", "Status"],
      ...payroll.map((row) => {
        const total = totals(row);
        return [row.id, row.empId, row.name, row.month, total.gross, total.deductions, total.net, row.status];
      }),
    ];
    const blob = new Blob([rows.map((row) => row.map(csvEscape).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "hrms-payroll.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Gross Payroll" value={formatCurrency(aggregate.gross)} helper="Current register" icon={BadgeIndianRupee} tone="blue" />
        <MetricCard label="Net Payable" value={formatCurrency(aggregate.net)} helper="After deductions" icon={Wallet} tone="green" />
        <MetricCard label="Deductions" value={formatCurrency(aggregate.deductions)} helper="PF/PT/TDS/advance" icon={ShieldCheck} tone="purple" />
        <MetricCard label="Approved" value={String(payroll.filter((row) => row.status === "Approved").length)} helper="Bank-ready rows" icon={CheckCircle2} tone="amber" />
      </div>

      <Panel title="Payroll Register" description="Standalone HRMS payroll register kept for compatibility; dashboard payroll uses HRMSHub.">
        <div className="mb-5 flex justify-end">
          <ActionButton icon={Download} label="Export" variant="outline" onClick={exportCsv} />
        </div>
        <DataTable columns={["Emp ID", "Name", "Month", "Gross", "Deductions", "Net Salary", "Status", "Actions"]}>
          {payroll.map((row) => {
            const total = totals(row);
            return (
              <tr key={row.id} className="hover:bg-slate-50">
                <td className="px-4 py-4">{row.empId}</td>
                <td className="px-4 py-4 font-black text-primary">{row.name}</td>
                <td className="px-4 py-4">{row.month}</td>
                <td className="px-4 py-4">{formatCurrency(total.gross)}</td>
                <td className="px-4 py-4 font-black text-red-600">{formatCurrency(total.deductions)}</td>
                <td className="px-4 py-4 font-black text-emerald-600">{formatCurrency(total.net)}</td>
                <td className="px-4 py-4"><StatusBadge tone={row.status === "Approved" ? "green" : row.status === "Hold" ? "red" : "amber"}>{row.status}</StatusBadge></td>
                <td className="px-4 py-4">
                  <ActionButton label="Approve" variant="outline" onClick={() => setPayroll((current) => current.map((item) => item.id === row.id ? { ...item, status: "Approved" } : item))} />
                </td>
              </tr>
            );
          })}
        </DataTable>
      </Panel>
    </div>
  );
}

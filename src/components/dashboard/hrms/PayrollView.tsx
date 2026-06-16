"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  CheckCircle2, X, Plus, Calculator, Users, Wallet, 
  ShieldCheck, ArrowRight, Info
} from "lucide-react";
import { 
  AccountingPage, ActionButton, DataTable, Field, 
  MetricCard, Panel, StatusBadge 
} from "../accounting/AccountingComponents";

// --- Validation Schema ---
const payrollSchema = z.object({
  empId: z.string().min(1, "Employee is required"),
  month: z.string().min(1, "Month is required"),
  basic: z.coerce.number().min(0),
  hra: z.coerce.number().min(0),
  specialAllowance: z.coerce.number().min(0),
  conveyance: z.coerce.number().min(0),
  bonus: z.coerce.number().min(0),
  pf: z.coerce.number().min(0),
  pt: z.coerce.number().min(0),
  tds: z.coerce.number().min(0),
  advance: z.coerce.number().min(0),
  status: z.string().default("HR Review"),
});

type PayrollFormData = z.infer<typeof payrollSchema>;

const initialPayroll = [
  { id: "SAL-2026-061", empId: "EMP-102", name: "Rahul Verma", mobile: "+91 98765 43210", basic: 50000, hra: 20000, allowance: 10000, conveyance: 5000, bonus: 7000, pf: 6000, pt: 200, tds: 3000, advance: 600, gross: 92000, deductions: 9800, net: 82200, status: "Approved" },
];

export default function PayrollView() {
  const [payroll, setPayroll] = useState(initialPayroll);
  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PayrollFormData>({
    resolver: zodResolver(payrollSchema as any),
    defaultValues: {
      month: "June 2026",
      status: "HR Review",
      basic: 0, hra: 0, specialAllowance: 0, conveyance: 0, bonus: 0,
      pf: 0, pt: 200, tds: 0, advance: 0,
    }
  });

  const onSubmit = (data: PayrollFormData) => {
    const gross = data.basic + data.hra + data.specialAllowance + data.conveyance + data.bonus;
    const deductions = data.pf + data.pt + data.tds + data.advance;
    const net = gross - deductions;

    const newEntry = {
      id: `SAL-2026-0${payroll.length + 64}`,
      empId: data.empId.split("-")[0]?.trim() || "EMP-XXX",
      name: data.empId.split("-")[1]?.trim() || "Unknown",
      mobile: "Not Provided",
      basic: data.basic, hra: data.hra, allowance: data.specialAllowance, conveyance: data.conveyance, bonus: data.bonus,
      pf: data.pf, pt: data.pt, tds: data.tds, advance: data.advance,
      gross: gross,
      deductions: deductions,
      net: net,
      status: data.status,
    };

    setPayroll([...payroll, newEntry]);
    setSuccessMsg(true);
    setTimeout(() => {
      setSuccessMsg(false);
      setShowForm(false);
      reset();
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <MetricCard label="Gross Payroll" value={`₹${payroll.reduce((a, b) => a + b.gross, 0).toLocaleString()}`} helper="Total Monthly Gross" icon={Calculator} tone="blue" />
        <MetricCard label="Net Payable" value={`₹${payroll.reduce((a, b) => a + b.net, 0).toLocaleString()}`} helper="Total Net Salary" icon={Wallet} tone="green" />
        <MetricCard label="Total Deductions" value={`₹${payroll.reduce((a, b) => a + b.deductions, 0).toLocaleString()}`} helper="PF/PT/TDS/Advance" icon={ShieldCheck} tone="purple" />
        <MetricCard label="Pending Approval" value={String(payroll.filter(p => p.status !== "Approved").length)} helper="In Queue" icon={CheckCircle2} tone="amber" />
      </div>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-5 flex justify-between">
           <h3 className="text-lg font-black text-primary">Payroll Register</h3>
           <ActionButton icon={Plus} label="Process New Salary" variant="accent" onClick={() => setShowForm(true)} />
        </div>
        <div className="overflow-x-auto">
        <DataTable columns={["Emp ID", "Name", "Mobile", "Basic", "HRA", "Allow.", "Conv.", "Bonus", "Gross", "EPF", "PT", "TDS", "Adv.", "Deductions", "Net Salary", "Status"]}>
          {payroll.map((row) => (
            <tr key={row.id}>
              <td className="px-4 py-3">{row.empId}</td>
              <td className="px-4 py-3 font-black text-primary">{row.name}</td>
              <td className="px-4 py-3">{row.mobile}</td>
              <td className="px-4 py-3">₹{row.basic.toLocaleString()}</td>
              <td className="px-4 py-3">₹{row.hra.toLocaleString()}</td>
              <td className="px-4 py-3">₹{row.allowance.toLocaleString()}</td>
              <td className="px-4 py-3">₹{row.conveyance.toLocaleString()}</td>
              <td className="px-4 py-3">₹{row.bonus.toLocaleString()}</td>
              <td className="px-4 py-3 font-black text-primary">₹{row.gross.toLocaleString()}</td>
              <td className="px-4 py-3">₹{row.pf.toLocaleString()}</td>
              <td className="px-4 py-3">₹{row.pt.toLocaleString()}</td>
              <td className="px-4 py-3">₹{row.tds.toLocaleString()}</td>
              <td className="px-4 py-3">₹{row.advance.toLocaleString()}</td>
              <td className="px-4 py-3 font-black text-red-600">₹{row.deductions.toLocaleString()}</td>
              <td className="px-4 py-3 font-black text-emerald-600">₹{row.net.toLocaleString()}</td>
              <td className="px-4 py-4"><StatusBadge tone={row.status === "Approved" ? "green" : "amber"}>{row.status}</StatusBadge></td>
            </tr>
          ))}
        </DataTable>
        </div>
      </section>
    </div>
  );
}

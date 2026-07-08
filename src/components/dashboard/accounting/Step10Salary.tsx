"use client";

import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Calculator, Check, CheckCircle2, Download, Edit3, FileText,
  Landmark, Lock, PauseCircle, PlayCircle, Search, ShieldCheck, UserSquare2,
  Wallet, WalletCards, X,
} from "lucide-react";
import {
  AccountingPage, ActionButton, DataTable, Field,
  MetricCard, Panel, StatusBadge, WorkflowSteps,
} from "./AccountingComponents";

const INR = "\u20b9";
const payrollStatuses = ["Draft", "HR Review", "Finance Review", "Approved", "Paid", "Hold"] as const;
const paymentMethods = ["NEFT", "IMPS", "Bank Transfer", "Cheque", "Cash"] as const;

const employeeOptions = [
  { id: "EMP-102", name: "Rahul Verma", mobile: "9876543210", bankStatus: "Verified", readiness: "Ready", workingDays: 26, payableDays: 26 },
  { id: "EMP-118", name: "Swati Joshi", mobile: "9876543211", bankStatus: "Verified", readiness: "Ready", workingDays: 26, payableDays: 25 },
  { id: "EMP-124", name: "Amir Khan", mobile: "9876543212", bankStatus: "Verified", readiness: "Attendance Review", workingDays: 26, payableDays: 24 },
  { id: "EMP-130", name: "Sunita Sharma", mobile: "9876543213", bankStatus: "Missing", readiness: "Ready", workingDays: 26, payableDays: 26 },
] as const;

const salarySchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Payroll month is required"),
  workingDays: z.coerce.number().int().min(1).max(31),
  payableDays: z.coerce.number().min(0).max(31),
  basic: z.coerce.number().min(0),
  hra: z.coerce.number().min(0),
  specialAllowance: z.coerce.number().min(0),
  conveyance: z.coerce.number().min(0),
  bonus: z.coerce.number().min(0),
  pfDeduction: z.coerce.number().min(0),
  professionalTax: z.coerce.number().min(0),
  tds: z.coerce.number().min(0),
  advance: z.coerce.number().min(0),
  reimbursement: z.coerce.number().min(0),
  paymentMethod: z.enum(paymentMethods),
  remarks: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.payableDays > data.workingDays) {
    ctx.addIssue({ code: "custom", path: ["payableDays"], message: "Payable days cannot exceed working days" });
  }
  const fixedGross = data.basic + data.hra + data.specialAllowance + data.conveyance;
  if (fixedGross <= 0) {
    ctx.addIssue({ code: "custom", path: ["basic"], message: "Fixed gross salary must be greater than zero" });
  }
  const payableFixed = fixedGross * data.payableDays / data.workingDays;
  const gross = payableFixed + data.bonus + data.reimbursement;
  const deductions = data.pfDeduction + data.professionalTax + data.tds + data.advance;
  if (deductions > gross) {
    ctx.addIssue({ code: "custom", path: ["advance"], message: "Total deductions cannot exceed gross payable" });
  }
});

type SalaryFormInput = z.input<typeof salarySchema>;
type SalaryFormData = z.output<typeof salarySchema>;
type PayrollStatus = typeof payrollStatuses[number];

type PayrollRecord = {
  id: string;
  employeeId: string;
  employeeName: string;
  mobile: string;
  month: string;
  workingDays: number;
  payableDays: number;
  lopDays: number;
  basic: number;
  hra: number;
  specialAllowance: number;
  conveyance: number;
  bonus: number;
  reimbursement: number;
  pfDeduction: number;
  professionalTax: number;
  tds: number;
  advance: number;
  gross: number;
  deductions: number;
  netPayable: number;
  readiness: string;
  holdReason: string;
  status: PayrollStatus;
  paymentMethod: typeof paymentMethods[number];
  paymentRef: string;
  paidAt: string;
  remarks: string;
  createdAt: string;
  updatedAt: string;
};

type BankRecord = {
  accountName?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  status?: string;
  verificationStatus?: string;
  isPrimary?: boolean;
};

const initialPayroll: PayrollRecord[] = [
  {
    id: "SAL-2026-001", employeeId: "EMP-102", employeeName: "Rahul Verma", mobile: "9876543210",
    month: "2026-06", workingDays: 26, payableDays: 26, lopDays: 0,
    basic: 50000, hra: 20000, specialAllowance: 15000, conveyance: 5000, bonus: 2000, reimbursement: 0,
    pfDeduction: 6000, professionalTax: 200, tds: 3600, advance: 0,
    gross: 92000, deductions: 9800, netPayable: 82200, readiness: "Ready", holdReason: "",
    status: "Approved", paymentMethod: "NEFT", paymentRef: "", paidAt: "", remarks: "",
    createdAt: "2026-06-20T10:00:00.000Z", updatedAt: "2026-06-23T10:00:00.000Z",
  },
  {
    id: "SAL-2026-002", employeeId: "EMP-118", employeeName: "Swati Joshi", mobile: "9876543211",
    month: "2026-06", workingDays: 26, payableDays: 25, lopDays: 1,
    basic: 65000, hra: 25000, specialAllowance: 18000, conveyance: 5000, bonus: 5000, reimbursement: 0,
    pfDeduction: 9000, professionalTax: 200, tds: 6200, advance: 0,
    gross: 113653.85, deductions: 15400, netPayable: 98253.85, readiness: "Ready", holdReason: "",
    status: "Finance Review", paymentMethod: "NEFT", paymentRef: "", paidAt: "", remarks: "",
    createdAt: "2026-06-20T10:00:00.000Z", updatedAt: "2026-06-22T10:00:00.000Z",
  },
  {
    id: "SAL-2026-003", employeeId: "EMP-124", employeeName: "Amir Khan", mobile: "9876543212",
    month: "2026-06", workingDays: 26, payableDays: 24, lopDays: 2,
    basic: 45000, hra: 15000, specialAllowance: 10000, conveyance: 3000, bonus: 3000, reimbursement: 0,
    pfDeduction: 4500, professionalTax: 200, tds: 2000, advance: 0,
    gross: 70384.62, deductions: 6700, netPayable: 63684.62, readiness: "Attendance Review", holdReason: "Attendance regularization pending",
    status: "Hold", paymentMethod: "IMPS", paymentRef: "", paidAt: "", remarks: "",
    createdAt: "2026-06-20T10:00:00.000Z", updatedAt: "2026-06-21T10:00:00.000Z",
  },
];

const defaultFormValues: SalaryFormInput = {
  employeeId: "",
  month: "2026-06",
  workingDays: 26,
  payableDays: 26,
  basic: 0,
  hra: 0,
  specialAllowance: 0,
  conveyance: 0,
  bonus: 0,
  reimbursement: 0,
  pfDeduction: 0,
  professionalTax: 200,
  tds: 0,
  advance: 0,
  paymentMethod: "NEFT",
  remarks: "",
};

function calculatePayroll(data: {
  workingDays?: unknown; payableDays?: unknown; basic?: unknown; hra?: unknown;
  specialAllowance?: unknown; conveyance?: unknown; bonus?: unknown; reimbursement?: unknown;
  pfDeduction?: unknown; professionalTax?: unknown; tds?: unknown; advance?: unknown;
}) {
  const workingDays = Number(data.workingDays) || 0;
  const payableDays = Number(data.payableDays) || 0;
  const fixedGross = ["basic", "hra", "specialAllowance", "conveyance"].reduce((sum, key) => sum + (Number(data[key as keyof typeof data]) || 0), 0);
  const payableFixed = workingDays > 0 ? fixedGross * payableDays / workingDays : 0;
  const gross = payableFixed + (Number(data.bonus) || 0) + (Number(data.reimbursement) || 0);
  const deductions = (Number(data.pfDeduction) || 0) + (Number(data.professionalTax) || 0) + (Number(data.tds) || 0) + (Number(data.advance) || 0);
  return { fixedGross, lopDeduction: fixedGross - payableFixed, gross, deductions, netPayable: Math.max(0, gross - deductions) };
}

function money(value: number) {
  return `${INR} ${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function monthLabel(value: string) {
  return new Date(`${value}-01T00:00:00`).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Step10Salary() {
  const [payroll, setPayroll] = useState<PayrollRecord[]>(initialPayroll);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("2026-06");
  const [bankDetails, setBankDetails] = useState<BankRecord | null>(null);
  const [paymentDialog, setPaymentDialog] = useState<PayrollRecord | null>(null);
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentError, setPaymentError] = useState("");

  const {
    register, handleSubmit, control, reset, setValue, setError,
    formState: { errors },
  } = useForm<SalaryFormInput, unknown, SalaryFormData>({
    resolver: zodResolver(salarySchema),
    defaultValues: defaultFormValues,
  });

  const watched = useWatch({ control });
  const totals = useMemo(() => calculatePayroll(watched), [watched]);
  const watchedEmployeeId = useWatch({ control, name: "employeeId" });
  const selectedEmployee = employeeOptions.find((employee) => employee.id === watchedEmployeeId);

  const loadBankDetails = () => {
    try {
      const raw = localStorage.getItem("crm_company_banks");
      const banks = raw ? JSON.parse(raw) as BankRecord[] : [];
      setBankDetails(
        banks.find((bank) => bank.status === "Active" && bank.verificationStatus === "Verified" && bank.isPrimary)
        ?? banks.find((bank) => bank.status === "Active" && bank.verificationStatus === "Verified")
        ?? banks.find((bank) => bank.status === "Active")
        ?? null,
      );
    } catch {
      setBankDetails(null);
    }
  };

  const filteredPayroll = useMemo(() => payroll.filter((row) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch = !query || [row.id, row.employeeId, row.employeeName, row.mobile, row.paymentRef, row.status].join(" ").toLowerCase().includes(query);
    const matchesStatus = statusFilter === "All" || row.status === statusFilter;
    const matchesMonth = monthFilter === "All" || row.month === monthFilter;
    return matchesSearch && matchesStatus && matchesMonth;
  }), [monthFilter, payroll, searchTerm, statusFilter]);

  const openCreateForm = () => {
    setEditingId(null);
    setSuccessMsg("");
    reset(defaultFormValues);
    loadBankDetails();
    setShowForm(true);
  };

  const openEditForm = (row: PayrollRecord) => {
    if (!["Draft", "HR Review"].includes(row.status)) return;
    setEditingId(row.id);
    setSuccessMsg("");
    reset({
      employeeId: row.employeeId, month: row.month, workingDays: row.workingDays, payableDays: row.payableDays,
      basic: row.basic, hra: row.hra, specialAllowance: row.specialAllowance, conveyance: row.conveyance,
      bonus: row.bonus, reimbursement: row.reimbursement, pfDeduction: row.pfDeduction,
      professionalTax: row.professionalTax, tds: row.tds, advance: row.advance,
      paymentMethod: row.paymentMethod, remarks: row.remarks,
    });
    loadBankDetails();
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setSuccessMsg("");
    reset(defaultFormValues);
  };

  const selectEmployee = (employeeId: string) => {
    setValue("employeeId", employeeId, { shouldValidate: true });
    const employee = employeeOptions.find((item) => item.id === employeeId);
    if (!employee) return;
    setValue("workingDays", employee.workingDays);
    setValue("payableDays", employee.payableDays);
  };

  const persistPayroll = (data: SalaryFormData, status: PayrollStatus) => {
    const employee = employeeOptions.find((item) => item.id === data.employeeId);
    if (!employee) return;
    if (payroll.some((row) => row.id !== editingId && row.employeeId === data.employeeId && row.month === data.month)) {
      setError("month", { message: "Payroll already exists for this employee and month" });
      return;
    }
    const calculated = calculatePayroll(data);
    const now = new Date().toISOString();
    const holdReason = employee.readiness === "Ready" ? "" : `${employee.readiness} pending`;
    const effectiveStatus: PayrollStatus = employee.readiness === "Ready" ? status : "Hold";
    const common = {
      employeeId: employee.id, employeeName: employee.name, mobile: employee.mobile,
      month: data.month, workingDays: data.workingDays, payableDays: data.payableDays,
      lopDays: Math.max(0, data.workingDays - data.payableDays),
      basic: data.basic, hra: data.hra, specialAllowance: data.specialAllowance,
      conveyance: data.conveyance, bonus: data.bonus, reimbursement: data.reimbursement,
      pfDeduction: data.pfDeduction, professionalTax: data.professionalTax,
      tds: data.tds, advance: data.advance, gross: calculated.gross,
      deductions: calculated.deductions, netPayable: calculated.netPayable,
      readiness: employee.readiness, holdReason, status: effectiveStatus,
      paymentMethod: data.paymentMethod, remarks: data.remarks?.trim() ?? "", updatedAt: now,
    };
    if (editingId) {
      setPayroll((current) => current.map((row) => row.id === editingId ? { ...row, ...common } : row));
      setSuccessMsg(effectiveStatus === "Hold" ? "Payroll updated and held for People Operations reconciliation" : "Payroll updated");
    } else {
      const nextNumber = Math.max(3, ...payroll.map((row) => Number(row.id.split("-").pop()) || 0)) + 1;
      setPayroll((current) => [{
        id: `SAL-${new Date().getFullYear()}-${String(nextNumber).padStart(3, "0")}`,
        ...common, paymentRef: "", paidAt: "", createdAt: now,
      }, ...current]);
      setSuccessMsg(effectiveStatus === "Hold" ? "Payroll created on hold" : status === "Draft" ? "Payroll draft saved" : "Payroll submitted for HR review");
    }
    setTimeout(closeForm, 900);
  };

  const saveDraft = handleSubmit((data) => persistPayroll(data, "Draft"));
  const submitHrReview = handleSubmit((data) => persistPayroll(data, "HR Review"));

  const advanceStatus = (row: PayrollRecord) => {
    const next: Partial<Record<PayrollStatus, PayrollStatus>> = { "HR Review": "Finance Review", "Finance Review": "Approved" };
    const target = next[row.status];
    if (!target || row.readiness !== "Ready") return;
    setPayroll((current) => current.map((item) => item.id === row.id ? { ...item, status: target, updatedAt: new Date().toISOString() } : item));
  };

  const holdPayroll = (row: PayrollRecord) => {
    if (row.status === "Paid") return;
    setPayroll((current) => current.map((item) => item.id === row.id ? { ...item, status: "Hold", holdReason: item.holdReason || "Manual finance hold", updatedAt: new Date().toISOString() } : item));
  };

  const releaseHold = (row: PayrollRecord) => {
    const employee = employeeOptions.find((item) => item.id === row.employeeId);
    if (!employee || employee.readiness !== "Ready") return;
    setPayroll((current) => current.map((item) => item.id === row.id ? { ...item, status: "HR Review", readiness: "Ready", holdReason: "", updatedAt: new Date().toISOString() } : item));
  };

  const markPaid = () => {
    if (!paymentDialog) return;
    if (paymentDialog.paymentMethod !== "Cash" && paymentRef.trim().length < 3) {
      setPaymentError("Bank/cheque transaction reference is required");
      return;
    }
    const now = new Date().toISOString();
    setPayroll((current) => current.map((row) => row.id === paymentDialog.id ? {
      ...row, status: "Paid", paymentRef: paymentRef.trim() || "CASH",
      paidAt: now, updatedAt: now,
    } : row));
    setPaymentDialog(null);
    setPaymentRef("");
    setPaymentError("");
  };

  const exportPayroll = () => {
    const rows = [
      ["Payroll ID", "Employee ID", "Employee", "Month", "Working Days", "Payable Days", "LOP Days", "Basic", "HRA", "Allowance", "Conveyance", "Bonus", "Reimbursement", "Gross", "PF", "PT", "TDS", "Advance", "Deductions", "Net Payable", "Readiness", "Status", "Payment Method", "Payment Ref", "Paid At"],
      ...filteredPayroll.map((row) => [
        row.id, row.employeeId, row.employeeName, row.month, row.workingDays, row.payableDays,
        row.lopDays, row.basic, row.hra, row.specialAllowance, row.conveyance, row.bonus,
        row.reimbursement, row.gross, row.pfDeduction, row.professionalTax, row.tds,
        row.advance, row.deductions, row.netPayable, row.readiness, row.status,
        row.paymentMethod, row.paymentRef, row.paidAt,
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    downloadFile("salary-payroll-register.csv", csv, "text/csv;charset=utf-8");
  };

  const downloadPayslip = (row: PayrollRecord) => {
    const content = [
      `Payslip: ${row.id}`, `Employee: ${row.employeeName} (${row.employeeId})`,
      `Payroll Month: ${monthLabel(row.month)}`, `Working / Payable Days: ${row.workingDays} / ${row.payableDays}`,
      "", `Gross Pay: ${money(row.gross)}`, `Total Deductions: ${money(row.deductions)}`,
      `Net Payable: ${money(row.netPayable)}`, `Status: ${row.status}`,
      `Payment: ${row.paymentMethod} ${row.paymentRef || ""}`,
    ].join("\n");
    downloadFile(`${row.id}-payslip.txt`, content, "text/plain;charset=utf-8");
  };

  const periodRows = payroll.filter((row) => monthFilter === "All" || row.month === monthFilter);
  const grossPayroll = periodRows.reduce((sum, row) => sum + row.gross, 0);
  const netPayroll = periodRows.reduce((sum, row) => sum + row.netPayable, 0);
  const deductions = periodRows.reduce((sum, row) => sum + row.deductions, 0);
  const pending = periodRows.filter((row) => !["Paid", "Approved"].includes(row.status)).length;

  return (
    <AccountingPage
      title="Payroll Register"
      description="Validate People Operations payroll readiness, process statutory deductions, approve net salary, and reconcile bank payouts."
      icon={UserSquare2}
      badge="People + Finance"
      actions={
        <>
          <ActionButton icon={Download} label="Export Salary Sheet" variant="outline" onClick={exportPayroll} />
          <ActionButton icon={Wallet} label="New Payroll" variant="accent" onClick={openCreateForm} />
        </>
      }
    >
      <WorkflowSteps steps={["Attendance & Leave Lock", "HR Review", "Finance Review", "Approval", "Bank Payment"]} />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Gross Payroll" value={money(grossPayroll)} helper="Selected payroll period" icon={WalletCards} tone="blue" />
        <MetricCard label="Net Payable" value={money(netPayroll)} helper="After statutory deductions" icon={Wallet} tone="green" />
        <MetricCard label="Deductions" value={money(deductions)} helper="PF, PT, TDS and advance" icon={Calculator} tone="purple" />
        <MetricCard label="Pending / Hold" value={String(pending)} helper="Requires HR or finance action" icon={ShieldCheck} tone="amber" />
      </div>

      {showForm ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl">
            <button type="button" onClick={closeForm} className="absolute right-8 top-8 rounded-full p-2 text-slate-400 hover:bg-slate-50"><X size={24} /></button>
            {successMsg ? (
              <div className="space-y-4 py-20 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle2 size={48} /></div>
                <h3 className="text-2xl font-black text-primary">{successMsg}</h3>
              </div>
            ) : (
              <form onSubmit={submitHrReview} className="space-y-8">
                <div className="border-b border-slate-100 pb-6">
                  <h3 className="text-2xl font-black text-primary">{editingId ? "Edit Payroll Draft" : "Generate Payroll"}</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">Employee readiness comes from the People Operations attendance and leave snapshot.</p>
                </div>
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
                  <div className="space-y-8 lg:col-span-3">
                    <Panel title="Employee & Period" description="One payroll record is allowed per employee and month.">
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <label className="block space-y-1.5">
                          <span className="text-xs font-black uppercase tracking-widest text-slate-500">Employee <span className="text-red-500">*</span></span>
                          <select {...register("employeeId")} onChange={(event) => selectEmployee(event.target.value)} className={`h-11 w-full rounded-xl border bg-white px-3 text-sm font-semibold text-primary ${errors.employeeId ? "border-red-500" : "border-border"}`}>
                            <option value="">Select employee...</option>
                            {employeeOptions.map((employee) => <option key={employee.id} value={employee.id}>{employee.id} - {employee.name}</option>)}
                          </select>
                          {errors.employeeId ? <p className="text-[10px] font-black uppercase text-red-500">{errors.employeeId.message}</p> : null}
                        </label>
                        <Field label="Payroll Month" type="month" required register={register("month")} error={errors.month?.message} />
                        <Field label="Payment Method" options={[...paymentMethods]} required register={register("paymentMethod")} error={errors.paymentMethod?.message} />
                        <Field label="Working Days" type="number" required register={register("workingDays")} error={errors.workingDays?.message} />
                        <Field label="Payable Days" type="number" step="0.5" required register={register("payableDays")} error={errors.payableDays?.message} />
                        {selectedEmployee ? (
                          <div className={`rounded-xl border p-4 ${selectedEmployee.readiness === "Ready" ? "border-emerald-100 bg-emerald-50" : "border-amber-100 bg-amber-50"}`}>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">People Operations Readiness</p>
                            <p className="mt-1 text-sm font-black text-primary">{selectedEmployee.readiness}</p>
                            <p className="text-xs font-semibold text-slate-500">Bank: {selectedEmployee.bankStatus}</p>
                          </div>
                        ) : null}
                      </div>
                    </Panel>

                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                      <Panel title="Earnings" description="Fixed earnings are prorated by payable days.">
                        <div className="space-y-4">
                          <Field label="Basic Salary" type="number" step="0.01" register={register("basic")} error={errors.basic?.message} />
                          <Field label="HRA" type="number" step="0.01" register={register("hra")} error={errors.hra?.message} />
                          <Field label="Special Allowance" type="number" step="0.01" register={register("specialAllowance")} error={errors.specialAllowance?.message} />
                          <Field label="Conveyance" type="number" step="0.01" register={register("conveyance")} error={errors.conveyance?.message} />
                          <Field label="Bonus" type="number" step="0.01" register={register("bonus")} error={errors.bonus?.message} />
                          <Field label="Reimbursement" type="number" step="0.01" register={register("reimbursement")} error={errors.reimbursement?.message} />
                        </div>
                      </Panel>
                      <Panel title="Deductions" description="Statutory and employee-specific recoveries.">
                        <div className="space-y-4">
                          <Field label="Provident Fund (PF)" type="number" step="0.01" register={register("pfDeduction")} error={errors.pfDeduction?.message} />
                          <Field label="Professional Tax (PT)" type="number" step="0.01" register={register("professionalTax")} error={errors.professionalTax?.message} />
                          <Field label="Income Tax (TDS)" type="number" step="0.01" register={register("tds")} error={errors.tds?.message} />
                          <Field label="Salary Advance Recovery" type="number" step="0.01" register={register("advance")} error={errors.advance?.message} />
                          <Field label="Payroll Remarks" multiline register={register("remarks")} error={errors.remarks?.message} />
                        </div>
                      </Panel>
                    </div>

                    <Panel title="Treasury Routing" icon={Landmark} description="Company payout account used for the bank release file.">
                      {bankDetails ? (
                        <div className="grid grid-cols-1 gap-4 rounded-xl border border-emerald-100 bg-emerald-50 p-5 md:grid-cols-2">
                          <p className="text-sm font-black text-primary">{bankDetails.accountName}</p>
                          <p className="text-sm font-black text-primary">{bankDetails.bankName}</p>
                          <p className="font-mono text-sm font-black text-primary">{bankDetails.accountNumber}</p>
                          <p className="font-mono text-sm font-black text-primary">{bankDetails.ifscCode}</p>
                        </div>
                      ) : <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs font-bold text-slate-400">No active treasury account configured.</p>}
                    </Panel>
                  </div>

                  <div className="space-y-6">
                    <Panel title="Payroll Calculation" description="Proration, deductions, and final payout.">
                      <div className="space-y-4">
                        <div className="rounded-2xl bg-primary p-6 text-white">
                          <div className="flex justify-between text-xs font-bold text-white/70"><span>LOP Deduction</span><span>{money(totals.lopDeduction)}</span></div>
                          <div className="mt-3 flex justify-between text-xs font-bold text-white/70"><span>Gross Payable</span><span>{money(totals.gross)}</span></div>
                          <div className="mt-3 flex justify-between text-xs font-bold text-white/70"><span>Deductions</span><span>{money(totals.deductions)}</span></div>
                          <div className="mt-4 border-t border-white/10 pt-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Net Salary</p>
                            <p className="mt-1 text-3xl font-black">{money(totals.netPayable)}</p>
                          </div>
                        </div>
                        <ActionButton icon={ShieldCheck} label="Submit HR Review" variant="accent" type="submit" />
                        <ActionButton icon={FileText} label="Save Draft" variant="outline" onClick={saveDraft} />
                      </div>
                    </Panel>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}

      {paymentDialog ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-black text-primary">Release Salary Payment</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">{paymentDialog.employeeName} | {money(paymentDialog.netPayable)}</p>
            <div className="mt-6 space-y-5">
              <Field label="Payment Transaction Reference" value={paymentRef} onChange={(event) => { setPaymentRef(event.target.value); setPaymentError(""); }} error={paymentError} />
              <div className="flex justify-end gap-3">
                <ActionButton label="Cancel" variant="outline" onClick={() => setPaymentDialog(null)} />
                <ActionButton label="Mark Paid" variant="accent" onClick={markPaid} />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <Panel title="Monthly Payroll Register" description="People Operations readiness, salary calculation, approval, payment, and reconciliation status.">
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_190px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={15} />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search employee, payroll ID, mobile, transaction..." className="h-11 w-full rounded-xl border border-border bg-white pl-10 pr-3 text-sm font-semibold text-primary outline-none" />
          </div>
          <input type="month" value={monthFilter === "All" ? "" : monthFilter} onChange={(event) => setMonthFilter(event.target.value || "All")} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary" />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary">
            {["All", ...payrollStatuses].map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </div>

        <DataTable columns={["Payroll / Employee", "Period / Readiness", "Earnings", "Deductions", "Net Salary", "Status / Payment", "Actions"]}>
          {filteredPayroll.map((row) => (
            <tr key={row.id} className="text-sm transition-colors hover:bg-slate-50">
              <td className="px-4 py-4"><p className="font-black text-primary">{row.employeeName}</p><p className="text-xs font-semibold text-slate-500">{row.id} | {row.employeeId}</p></td>
              <td className="px-4 py-4"><p className="font-bold text-slate-600">{monthLabel(row.month)}</p><p className="text-xs font-semibold text-slate-400">{row.payableDays}/{row.workingDays} days | {row.readiness}</p></td>
              <td className="px-4 py-4"><p className="font-black text-primary">{money(row.gross)}</p><p className="text-[11px] font-semibold text-slate-400">LOP {row.lopDays} days</p></td>
              <td className="px-4 py-4"><p className="font-bold text-red-500">{money(row.deductions)}</p><p className="text-[11px] font-semibold text-slate-400">PF {money(row.pfDeduction)} | TDS {money(row.tds)}</p></td>
              <td className="px-4 py-4 font-black text-emerald-600">{money(row.netPayable)}</td>
              <td className="px-4 py-4">
                <StatusBadge tone={row.status === "Paid" || row.status === "Approved" ? "green" : row.status === "Hold" ? "red" : row.status === "Finance Review" ? "amber" : "blue"}>{row.status}</StatusBadge>
                <p className="mt-2 text-[11px] font-semibold text-slate-400">{row.paymentMethod}{row.paymentRef ? ` | ${row.paymentRef}` : ""}</p>
                {row.holdReason ? <p className="mt-1 text-[11px] font-semibold text-red-500">{row.holdReason}</p> : null}
              </td>
              <td className="px-4 py-4">
                <div className="flex flex-wrap gap-2">
                  {["Draft", "HR Review"].includes(row.status) ? <button type="button" onClick={() => openEditForm(row)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-primary" title="Edit payroll"><Edit3 size={15} /></button> : null}
                  {row.status === "Draft" ? <button type="button" onClick={() => setPayroll((current) => current.map((item) => item.id === row.id ? { ...item, status: item.readiness === "Ready" ? "HR Review" : "Hold" } : item))} className="rounded-lg border border-border p-2 text-slate-500 hover:text-blue-600" title="Submit HR review"><ShieldCheck size={15} /></button> : null}
                  {["HR Review", "Finance Review"].includes(row.status) ? <button type="button" onClick={() => advanceStatus(row)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-green-600" title="Advance approval"><Check size={15} /></button> : null}
                  {row.status === "Approved" ? <button type="button" onClick={() => { setPaymentDialog(row); setPaymentRef(""); }} className="rounded-lg border border-border p-2 text-slate-500 hover:text-green-600" title="Release payment"><PlayCircle size={15} /></button> : null}
                  {row.status === "Hold" ? <button type="button" onClick={() => releaseHold(row)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-green-600" title="Release hold"><Lock size={15} /></button> : row.status !== "Paid" ? <button type="button" onClick={() => holdPayroll(row)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-red-600" title="Put on hold"><PauseCircle size={15} /></button> : null}
                  <button type="button" onClick={() => downloadPayslip(row)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-primary" title="Download payslip"><Download size={15} /></button>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </AccountingPage>
  );
}

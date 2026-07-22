"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  createFinanceResource,
  listFinanceResource,
  updateFinanceResource,
} from "@/services/finance-api";
import {
  createHrmsPayroll,
  listHrmsEmployees,
  listHrmsPayroll,
  runHrmsPayrollAction,
  type HrmsEmployee,
  type HrmsPayroll,
  type HrmsPayrollPayload,
} from "@/services/hrms-api";

const INR = "\u20b9";
const payrollStatuses = ["Draft", "HR Review", "Finance Review", "Approved", "Paid", "Hold"] as const;
const paymentMethods = ["NEFT", "IMPS", "Bank Transfer", "Cheque", "Cash"] as const;

const statusFromBackend: Record<HrmsPayroll["status"], typeof payrollStatuses[number]> = {
  draft: "Draft",
  hr_review: "HR Review",
  finance_review: "Finance Review",
  approved: "Approved",
  paid: "Paid",
  hold: "Hold",
};

const paymentStatusToBackend: Record<typeof payrollStatuses[number], string> = {
  Draft: "draft",
  "HR Review": "hr_review",
  "Finance Review": "finance_review",
  Approved: "approved",
  Paid: "paid",
  Hold: "hold",
};

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
  financeId?: string;
  hrmsId: string;
  employeeBackendId: string;
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

type FinancePayrollRecord = {
  id: string;
  payroll_number: string;
  hrms_payroll: string | null;
  month: string;
  total_gross: string;
  total_deductions: string;
  net_payable: string;
  payment_method: typeof paymentMethods[number];
  payment_reference: string;
  paid_at: string | null;
  remarks: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type FinancePayrollPayload = {
  hrms_payroll: string;
  month: string;
  total_gross: string;
  total_deductions: string;
  net_payable: string;
  payment_method: typeof paymentMethods[number];
  payment_reference: string;
  paid_at: string | null;
  remarks: string;
  status: string;
};

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

function payrollFromBackend(hrms: HrmsPayroll, finance?: FinancePayrollRecord): PayrollRecord {
  return {
    id: finance?.payroll_number || `HRMS-${hrms.id.slice(0, 8)}`,
    financeId: finance?.id,
    hrmsId: hrms.id,
    employeeBackendId: hrms.employee,
    employeeId: hrms.employee_detail.employee_id,
    employeeName: hrms.employee_detail.name,
    mobile: hrms.employee_detail.mobile,
    month: hrms.month,
    workingDays: hrms.working_days,
    payableDays: Number(hrms.payable_days) || 0,
    lopDays: Number(hrms.lop_days) || 0,
    basic: Number(hrms.basic) || 0,
    hra: Number(hrms.hra) || 0,
    specialAllowance: Number(hrms.allowance) || 0,
    conveyance: Number(hrms.conveyance) || 0,
    bonus: Number(hrms.bonus) || 0,
    reimbursement: 0,
    pfDeduction: Number(hrms.pf) || 0,
    professionalTax: Number(hrms.pt) || 0,
    tds: Number(hrms.tds) || 0,
    advance: Number(hrms.advance) || 0,
    gross: Number(hrms.gross) || 0,
    deductions: Number(hrms.deductions) || 0,
    netPayable: Number(hrms.net) || 0,
    readiness: hrms.readiness_label,
    holdReason: hrms.hold_reason,
    status: statusFromBackend[hrms.status],
    paymentMethod: finance?.payment_method || "NEFT",
    paymentRef: finance?.payment_reference || "",
    paidAt: finance?.paid_at || hrms.processed_at || "",
    remarks: finance?.remarks || "",
    createdAt: finance?.created_at || hrms.created_at,
    updatedAt: finance?.updated_at || hrms.updated_at,
  };
}

function financePayload(row: PayrollRecord, patch?: Partial<FinancePayrollPayload>): FinancePayrollPayload {
  return {
    hrms_payroll: row.hrmsId,
    month: row.month,
    total_gross: String(row.gross),
    total_deductions: String(row.deductions),
    net_payable: String(row.netPayable),
    payment_method: row.paymentMethod,
    payment_reference: row.paymentRef,
    paid_at: row.paidAt || null,
    remarks: row.remarks,
    status: paymentStatusToBackend[row.status],
    ...patch,
  };
}

export default function Step10Salary() {
  const [employees, setEmployees] = useState<HrmsEmployee[]>([]);
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [backendMessage, setBackendMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("2026-06");
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
  const selectedEmployee = employees.find((employee) => employee.id === watchedEmployeeId);

  const loadPayroll = useCallback(async () => {
    try {
      setBackendMessage("");
      const [employeeRows, hrmsRows, financeRows] = await Promise.all([
        listHrmsEmployees({ status: "active" }),
        listHrmsPayroll(),
        listFinanceResource<FinancePayrollRecord>("payroll-register"),
      ]);
      setEmployees(employeeRows);
      setPayroll(hrmsRows.map((hrms) => payrollFromBackend(hrms, financeRows.find((finance) => finance.hrms_payroll === hrms.id))));
    } catch (error) {
      setBackendMessage(error instanceof Error ? error.message : "Unable to load payroll records.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPayroll();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadPayroll]);

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
    setShowForm(true);
  };

  const openEditForm = (row: PayrollRecord) => {
    if (!["Draft", "HR Review"].includes(row.status)) return;
    setEditingId(row.id);
    setSuccessMsg("");
    reset({
      employeeId: row.employeeBackendId, month: row.month, workingDays: row.workingDays, payableDays: row.payableDays,
      basic: row.basic, hra: row.hra, specialAllowance: row.specialAllowance, conveyance: row.conveyance,
      bonus: row.bonus, reimbursement: row.reimbursement, pfDeduction: row.pfDeduction,
      professionalTax: row.professionalTax, tds: row.tds, advance: row.advance,
      paymentMethod: row.paymentMethod, remarks: row.remarks,
    });
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
    setValue("workingDays", 26);
    setValue("payableDays", 26);
  };

  const persistPayroll = async (data: SalaryFormData, status: PayrollStatus) => {
    if (editingId) {
      setBackendMessage("Existing HRMS payroll salary components are controlled from People Operations. Use status/payment actions here.");
      return;
    }
    if (payroll.some((row) => row.employeeBackendId === data.employeeId && row.month === data.month)) {
      setError("month", { message: "Payroll already exists for this employee and month" });
      return;
    }
    try {
      setBackendMessage("");
      const hrmsPayload: HrmsPayrollPayload = {
        employee_id: data.employeeId,
        month: data.month,
        basic: String(data.basic),
        hra: String(data.hra),
        allowance: String(data.specialAllowance),
        conveyance: String(data.conveyance),
        bonus: String(data.bonus + data.reimbursement),
        pf: String(data.pfDeduction),
        pt: String(data.professionalTax),
        tds: String(data.tds),
        advance: String(data.advance),
        working_days: data.workingDays,
      };
      let hrms = await createHrmsPayroll(hrmsPayload);
      if (status === "Draft") {
        await runHrmsPayrollAction(hrms.id, "hold");
        hrms = { ...hrms, status: "hold", status_label: "Hold" };
      }
      const row = payrollFromBackend(hrms);
      await createFinanceResource<FinancePayrollRecord, FinancePayrollPayload>("payroll-register", financePayload(row, {
        payment_method: data.paymentMethod,
        remarks: data.remarks?.trim() || "",
      }));
      await loadPayroll();
      setSuccessMsg(row.status === "Hold" ? "Payroll created and held for People Operations reconciliation" : "Payroll submitted for HR review");
      setTimeout(closeForm, 900);
    } catch (error) {
      setBackendMessage(error instanceof Error ? error.message : "Unable to create payroll.");
    }
  };

  const saveDraft = handleSubmit((data) => persistPayroll(data, "Draft"));
  const submitHrReview = handleSubmit((data) => persistPayroll(data, "HR Review"));

  const ensureFinanceRecord = async (row: PayrollRecord) => {
    if (row.financeId) return row.financeId;
    const created = await createFinanceResource<FinancePayrollRecord, FinancePayrollPayload>("payroll-register", financePayload(row));
    return created.id;
  };

  const syncFinanceStatus = async (row: PayrollRecord, status: PayrollStatus, patch?: Partial<FinancePayrollPayload>) => {
    const financeId = await ensureFinanceRecord(row);
    await updateFinanceResource<FinancePayrollRecord, FinancePayrollPayload>("payroll-register", financeId, {
      status: paymentStatusToBackend[status],
      ...patch,
    });
  };

  const advanceStatus = async (row: PayrollRecord) => {
    if (row.readiness !== "Ready") return;
    try {
      setBackendMessage("");
      const updated = await runHrmsPayrollAction(row.hrmsId, "advance");
      await syncFinanceStatus(row, statusFromBackend[updated.status]);
      await loadPayroll();
    } catch (error) {
      setBackendMessage(error instanceof Error ? error.message : "Unable to advance payroll.");
    }
  };

  const holdPayroll = async (row: PayrollRecord) => {
    if (row.status === "Paid") return;
    try {
      setBackendMessage("");
      const updated = await runHrmsPayrollAction(row.hrmsId, "hold");
      await syncFinanceStatus(row, statusFromBackend[updated.status], { remarks: row.remarks || "Manual finance hold" });
      await loadPayroll();
    } catch (error) {
      setBackendMessage(error instanceof Error ? error.message : "Unable to hold payroll.");
    }
  };

  const releaseHold = async (row: PayrollRecord) => {
    try {
      setBackendMessage("");
      const updated = await runHrmsPayrollAction(row.hrmsId, "release");
      await syncFinanceStatus(row, statusFromBackend[updated.status]);
      await loadPayroll();
    } catch (error) {
      setBackendMessage(error instanceof Error ? error.message : "Unable to release payroll hold.");
    }
  };

  const markPaid = async () => {
    if (!paymentDialog) return;
    if (paymentDialog.paymentMethod !== "Cash" && paymentRef.trim().length < 3) {
      setPaymentError("Bank/cheque transaction reference is required");
      return;
    }
    try {
      setBackendMessage("");
      const paid = paymentDialog.status === "Approved" ? await runHrmsPayrollAction(paymentDialog.hrmsId, "advance") : null;
      const paidAt = paid?.processed_at || new Date().toISOString();
      await syncFinanceStatus(paymentDialog, "Paid", {
        payment_reference: paymentRef.trim() || "CASH",
        paid_at: paidAt,
      });
      await loadPayroll();
      setPaymentDialog(null);
      setPaymentRef("");
      setPaymentError("");
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : "Unable to mark payroll paid.");
    }
  };

  const exportPayroll = () => {
    const rows = [
      ["Payroll ID", "Employee ID", "Employee", "Month", "Working Days", "Payable Days", "LOP Days", "Basic", "HRA", "Allowance", "Conveyance", "Bonus", "Gross", "PF", "PT", "TDS", "Advance", "Deductions", "Net Payable", "Readiness", "Status", "Payment Method", "Payment Ref", "Paid At"],
      ...filteredPayroll.map((row) => [
        row.id, row.employeeId, row.employeeName, row.month, row.workingDays, row.payableDays,
        row.lopDays, row.basic, row.hra, row.specialAllowance, row.conveyance, row.bonus,
        row.gross, row.pfDeduction, row.professionalTax, row.tds,
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

      {backendMessage ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{backendMessage}</div> : null}

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
                            {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.employee_id} - {employee.name}</option>)}
                          </select>
                          {errors.employeeId ? <p className="text-[10px] font-black uppercase text-red-500">{errors.employeeId.message}</p> : null}
                        </label>
                        <Field label="Payroll Month" type="month" required register={register("month")} error={errors.month?.message} />
                        <Field label="Payment Method" options={[...paymentMethods]} required register={register("paymentMethod")} error={errors.paymentMethod?.message} />
                        <Field label="Working Days" type="number" required register={register("workingDays")} error={errors.workingDays?.message} />
                        <Field label="Payable Days" type="number" step="0.5" required register={register("payableDays")} error={errors.payableDays?.message} />
                        {selectedEmployee ? (
                          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">People Operations Source</p>
                            <p className="mt-1 text-sm font-black text-primary">{selectedEmployee.status_label}</p>
                            <p className="text-xs font-semibold text-slate-500">{selectedEmployee.role} | {selectedEmployee.team}</p>
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
                          <Field label="Bonus / Reimbursement" type="number" step="0.01" register={register("bonus")} error={errors.bonus?.message} />
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

                    <Panel title="Treasury Routing" icon={Landmark} description="Payment reference is captured when approved payroll is released.">
                      <p className="rounded-xl border border-slate-100 bg-slate-50 p-5 text-sm font-bold text-slate-500">Finance payout audit is stored in the backend payroll register.</p>
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
        {isLoading ? <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500">Loading backend payroll...</div> : null}
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
            <tr key={row.hrmsId} className="text-sm transition-colors hover:bg-slate-50">
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
                  {["HR Review", "Finance Review"].includes(row.status) ? <button type="button" onClick={() => advanceStatus(row)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-green-600" title="Advance approval"><Check size={15} /></button> : null}
                  {row.status === "Approved" ? <button type="button" onClick={() => { setPaymentDialog(row); setPaymentRef(""); }} className="rounded-lg border border-border p-2 text-slate-500 hover:text-green-600" title="Release payment"><PlayCircle size={15} /></button> : null}
                  {row.status === "Hold" ? <button type="button" onClick={() => releaseHold(row)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-green-600" title="Release hold"><Lock size={15} /></button> : row.status !== "Paid" ? <button type="button" onClick={() => holdPayroll(row)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-red-600" title="Put on hold"><PauseCircle size={15} /></button> : null}
                  <button type="button" onClick={() => downloadPayslip(row)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-primary" title="Download payslip"><Download size={15} /></button>
                </div>
              </td>
            </tr>
          ))}
          {!isLoading && filteredPayroll.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-sm font-bold text-slate-400">No backend payroll records found.</td>
            </tr>
          ) : null}
        </DataTable>
      </Panel>
    </AccountingPage>
  );
}

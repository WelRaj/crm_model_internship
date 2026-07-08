"use client";

import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Calculator, Check, CheckCircle2, Download, Edit3, FileCheck2, Landmark,
  Plus, ReceiptText, Search, ShieldCheck, Upload, Wallet, X,
} from "lucide-react";
import {
  AccountingPage, ActionButton, DataTable, Field,
  MetricCard, Panel, StatusBadge, WorkflowSteps,
} from "./AccountingComponents";

const INR = "\u20b9";
const tdsTypes = ["Client TDS Receivable", "Vendor TDS Payable", "Employee Salary TDS"] as const;
const tdsSections = ["194C", "194H", "194I", "194J", "194Q", "192", "Other"] as const;
const tdsStatuses = ["Draft", "Verified", "Adjusted", "Payable", "Deposited", "Filed", "Closed", "Mismatch", "Reversed"] as const;

type SourceRecord = {
  id: string;
  type: typeof tdsTypes[number];
  partyId: string;
  partyName: string;
  taxableAmount: number;
  suggestedSection: typeof tdsSections[number];
  suggestedRate: number;
  transactionDate: string;
  period: string;
};

const sourceRecords: SourceRecord[] = [
  {
    id: "PAY-2026-101 / INV-2026-088",
    type: "Client TDS Receivable",
    partyId: "CL-24002",
    partyName: "Nexa Retail Cloud",
    taxableAmount: 280000,
    suggestedSection: "194J",
    suggestedRate: 10,
    transactionDate: "2026-06-11",
    period: "Q1 FY 2026-27",
  },
  {
    id: "EXP-AWS-2026-06",
    type: "Vendor TDS Payable",
    partyId: "VEN-001",
    partyName: "Amazon Web Services India",
    taxableAmount: 245000,
    suggestedSection: "194J",
    suggestedRate: 2,
    transactionDate: "2026-06-18",
    period: "Q1 FY 2026-27",
  },
  {
    id: "EXP-HARDWARE-2026-06",
    type: "Vendor TDS Payable",
    partyId: "VEN-004",
    partyName: "TechDepot Hardware",
    taxableAmount: 112000,
    suggestedSection: "194Q",
    suggestedRate: 0.1,
    transactionDate: "2026-06-20",
    period: "Q1 FY 2026-27",
  },
  {
    id: "SAL-2026-001",
    type: "Employee Salary TDS",
    partyId: "EMP-102",
    partyName: "Rahul Verma",
    taxableAmount: 92000,
    suggestedSection: "192",
    suggestedRate: 3.913,
    transactionDate: "2026-06-30",
    period: "Jun 2026",
  },
  {
    id: "SAL-2026-002",
    type: "Employee Salary TDS",
    partyId: "EMP-118",
    partyName: "Swati Joshi",
    taxableAmount: 113653.85,
    suggestedSection: "192",
    suggestedRate: 5.455,
    transactionDate: "2026-06-30",
    period: "Jun 2026",
  },
];

const tdsSchema = z.object({
  type: z.enum(tdsTypes),
  sourceId: z.string().min(1, "Select a source transaction"),
  section: z.enum(tdsSections),
  customSection: z.string().optional(),
  taxableAmount: z.coerce.number().positive("Taxable amount must be greater than 0"),
  tdsRate: z.coerce.number().min(0).max(100),
  deductionDate: z.string().min(1, "Deduction date required"),
  depositDueDate: z.string().min(1, "Deposit due date required"),
  returnPeriod: z.string().trim().min(2, "Return period required"),
  lowerDeductionCertificate: z.string().optional(),
  remarks: z.string().optional(),
}).superRefine((data, ctx) => {
  const source = sourceRecords.find((item) => item.id === data.sourceId);
  if (source && source.type !== data.type) {
    ctx.addIssue({ code: "custom", path: ["sourceId"], message: "Source transaction does not match selected TDS type" });
  }
  if (data.section === "Other" && (data.customSection?.trim().length ?? 0) < 2) {
    ctx.addIssue({ code: "custom", path: ["customSection"], message: "Enter the applicable TDS section" });
  }
  if (data.depositDueDate < data.deductionDate) {
    ctx.addIssue({ code: "custom", path: ["depositDueDate"], message: "Deposit due date cannot be before deduction date" });
  }
  if (data.tdsRate <= 0 && !data.lowerDeductionCertificate?.trim()) {
    ctx.addIssue({ code: "custom", path: ["tdsRate"], message: "Rate must be greater than zero unless a valid lower/nil deduction certificate exists" });
  }
});

type TdsFormInput = z.input<typeof tdsSchema>;
type TdsFormData = z.output<typeof tdsSchema>;
type TdsStatus = typeof tdsStatuses[number];
type CertificateStatus = "Not Applicable" | "Pending" | "Received" | "Generated" | "Issued" | "Mismatch";

type TdsRecord = {
  id: string;
  type: typeof tdsTypes[number];
  sourceId: string;
  partyId: string;
  partyName: string;
  section: string;
  taxableAmount: number;
  rate: number;
  tdsAmount: number;
  deductionDate: string;
  depositDueDate: string;
  returnPeriod: string;
  challanNo: string;
  challanDate: string;
  returnAckNo: string;
  certificateNo: string;
  certificateStatus: CertificateStatus;
  lowerDeductionCertificate: string;
  status: TdsStatus;
  remarks: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

const initialTdsRows: TdsRecord[] = [
  {
    id: "TDS-2026-001",
    type: "Client TDS Receivable",
    sourceId: "PAY-2026-101 / INV-2026-088",
    partyId: "CL-24002",
    partyName: "Nexa Retail Cloud",
    section: "194J",
    taxableAmount: 280000,
    rate: 10,
    tdsAmount: 28000,
    deductionDate: "2026-06-11",
    depositDueDate: "2026-07-07",
    returnPeriod: "Q1 FY 2026-27",
    challanNo: "",
    challanDate: "",
    returnAckNo: "",
    certificateNo: "",
    certificateStatus: "Pending",
    lowerDeductionCertificate: "",
    status: "Adjusted",
    remarks: "Client TDS claim reconciled with payment receipt.",
    createdBy: "Finance Manager",
    createdAt: "2026-06-12T10:00:00.000Z",
    updatedAt: "2026-06-12T10:00:00.000Z",
  },
  {
    id: "TDS-2026-002",
    type: "Vendor TDS Payable",
    sourceId: "EXP-AWS-2026-06",
    partyId: "VEN-001",
    partyName: "Amazon Web Services India",
    section: "194J",
    taxableAmount: 245000,
    rate: 2,
    tdsAmount: 4900,
    deductionDate: "2026-06-18",
    depositDueDate: "2026-07-07",
    returnPeriod: "Q1 FY 2026-27",
    challanNo: "",
    challanDate: "",
    returnAckNo: "",
    certificateNo: "",
    certificateStatus: "Pending",
    lowerDeductionCertificate: "LDC-AWS-2026",
    status: "Payable",
    remarks: "Lower deduction rate supported by vendor certificate.",
    createdBy: "Accountant",
    createdAt: "2026-06-18T10:00:00.000Z",
    updatedAt: "2026-06-18T10:00:00.000Z",
  },
  {
    id: "TDS-2026-003",
    type: "Employee Salary TDS",
    sourceId: "SAL-2026-001",
    partyId: "EMP-102",
    partyName: "Rahul Verma",
    section: "192",
    taxableAmount: 92000,
    rate: 3.913,
    tdsAmount: 3600,
    deductionDate: "2026-06-30",
    depositDueDate: "2026-07-07",
    returnPeriod: "Q1 FY 2026-27",
    challanNo: "",
    challanDate: "",
    returnAckNo: "",
    certificateNo: "",
    certificateStatus: "Not Applicable",
    lowerDeductionCertificate: "",
    status: "Payable",
    remarks: "TDS posted from approved payroll.",
    createdBy: "Finance Manager",
    createdAt: "2026-06-25T10:00:00.000Z",
    updatedAt: "2026-06-25T10:00:00.000Z",
  },
];

const defaultFormValues: TdsFormInput = {
  type: "Client TDS Receivable",
  sourceId: "",
  section: "194J",
  customSection: "",
  taxableAmount: 0,
  tdsRate: 10,
  deductionDate: new Date().toISOString().split("T")[0],
  depositDueDate: "2026-07-07",
  returnPeriod: "Q1 FY 2026-27",
  lowerDeductionCertificate: "",
  remarks: "",
};

function calculateTds(amountValue: unknown, rateValue: unknown) {
  const taxableAmount = Number(amountValue) || 0;
  const rate = Number(rateValue) || 0;
  return { taxableAmount, rate, tdsAmount: taxableAmount * rate / 100 };
}

function money(value: number) {
  return `${INR} ${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function formatDate(value: string) {
  if (!value) return "-";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
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

export default function Step12TDS() {
  const [tdsRows, setTdsRows] = useState<TdsRecord[]>(initialTdsRows);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [complianceDialog, setComplianceDialog] = useState<TdsRecord | null>(null);
  const [challanNo, setChallanNo] = useState("");
  const [challanDate, setChallanDate] = useState("");
  const [returnAckNo, setReturnAckNo] = useState("");
  const [certificateNo, setCertificateNo] = useState("");
  const [complianceError, setComplianceError] = useState("");
  const [todayTimestamp] = useState(() => Date.now());

  const {
    register, handleSubmit, control, reset, setValue, setError,
    formState: { errors },
  } = useForm<TdsFormInput, unknown, TdsFormData>({
    resolver: zodResolver(tdsSchema),
    defaultValues: defaultFormValues,
  });

  const watchedType = useWatch({ control, name: "type" });
  const watchedSection = useWatch({ control, name: "section" });
  const watchedAmount = useWatch({ control, name: "taxableAmount" });
  const watchedRate = useWatch({ control, name: "tdsRate" });
  const totals = useMemo(() => calculateTds(watchedAmount, watchedRate), [watchedAmount, watchedRate]);
  const availableSources = sourceRecords.filter((source) => source.type === watchedType);

  const filteredRows = useMemo(() => tdsRows.filter((row) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch = !query || [
      row.id, row.sourceId, row.partyId, row.partyName, row.section,
      row.challanNo, row.returnAckNo, row.certificateNo, row.status,
    ].join(" ").toLowerCase().includes(query);
    const matchesType = typeFilter === "All" || row.type === typeFilter;
    const matchesStatus = statusFilter === "All" || row.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  }), [searchTerm, statusFilter, tdsRows, typeFilter]);

  const openCreateForm = () => {
    setEditingId(null);
    setSuccessMsg("");
    reset(defaultFormValues);
    setShowForm(true);
  };

  const openEditForm = (row: TdsRecord) => {
    if (!["Draft", "Verified", "Mismatch"].includes(row.status)) return;
    setEditingId(row.id);
    setSuccessMsg("");
    reset({
      type: row.type,
      sourceId: row.sourceId,
      section: tdsSections.includes(row.section as typeof tdsSections[number]) ? row.section as typeof tdsSections[number] : "Other",
      customSection: tdsSections.includes(row.section as typeof tdsSections[number]) ? "" : row.section,
      taxableAmount: row.taxableAmount,
      tdsRate: row.rate,
      deductionDate: row.deductionDate,
      depositDueDate: row.depositDueDate,
      returnPeriod: row.returnPeriod,
      lowerDeductionCertificate: row.lowerDeductionCertificate,
      remarks: row.remarks,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setSuccessMsg("");
    reset(defaultFormValues);
  };

  const selectType = (type: TdsFormData["type"]) => {
    setValue("type", type, { shouldValidate: true });
    setValue("sourceId", "");
    setValue("taxableAmount", 0);
    setValue("tdsRate", type === "Client TDS Receivable" ? 10 : type === "Employee Salary TDS" ? 0 : 2);
    setValue("section", type === "Employee Salary TDS" ? "192" : "194J");
  };

  const selectSource = (sourceId: string) => {
    setValue("sourceId", sourceId, { shouldValidate: true });
    const source = sourceRecords.find((item) => item.id === sourceId);
    if (!source) return;
    setValue("taxableAmount", source.taxableAmount, { shouldValidate: true });
    setValue("tdsRate", source.suggestedRate, { shouldValidate: true });
    setValue("section", source.suggestedSection, { shouldValidate: true });
    setValue("deductionDate", source.transactionDate, { shouldValidate: true });
    setValue("returnPeriod", source.period, { shouldValidate: true });
  };

  const persistTds = (data: TdsFormData, status: TdsStatus) => {
    const source = sourceRecords.find((item) => item.id === data.sourceId);
    if (!source) return;
    if (tdsRows.some((row) => row.id !== editingId && row.sourceId === data.sourceId && row.status !== "Reversed")) {
      setError("sourceId", { message: "An active TDS record already exists for this source transaction" });
      return;
    }
    const calculated = calculateTds(data.taxableAmount, data.tdsRate);
    const now = new Date().toISOString();
    const effectiveStatus: TdsStatus = status === "Verified"
      ? data.type === "Client TDS Receivable" ? "Adjusted" : "Payable"
      : status;
    const common = {
      type: data.type,
      sourceId: source.id,
      partyId: source.partyId,
      partyName: source.partyName,
      section: data.section === "Other" ? data.customSection?.trim() ?? "Other" : data.section,
      taxableAmount: calculated.taxableAmount,
      rate: calculated.rate,
      tdsAmount: calculated.tdsAmount,
      deductionDate: data.deductionDate,
      depositDueDate: data.depositDueDate,
      returnPeriod: data.returnPeriod.trim(),
      lowerDeductionCertificate: data.lowerDeductionCertificate?.trim() ?? "",
      status: effectiveStatus,
      remarks: data.remarks?.trim() ?? "",
      updatedAt: now,
    };
    if (editingId) {
      setTdsRows((current) => current.map((row) => row.id === editingId ? { ...row, ...common } : row));
      setSuccessMsg(effectiveStatus === "Draft" ? "TDS draft updated" : "TDS record verified");
    } else {
      const nextNumber = Math.max(3, ...tdsRows.map((row) => Number(row.id.split("-").pop()) || 0)) + 1;
      setTdsRows((current) => [{
        id: `TDS-${new Date().getFullYear()}-${String(nextNumber).padStart(3, "0")}`,
        ...common,
        challanNo: "", challanDate: "", returnAckNo: "", certificateNo: "",
        certificateStatus: data.type === "Employee Salary TDS" ? "Not Applicable" : "Pending",
        createdBy: "Accountant", createdAt: now,
      }, ...current]);
      setSuccessMsg(effectiveStatus === "Draft" ? "TDS draft saved" : "TDS record verified");
    }
    setTimeout(closeForm, 900);
  };

  const saveDraft = handleSubmit((data) => persistTds(data, "Draft"));
  const verifyTds = handleSubmit((data) => persistTds(data, "Verified"));

  const updateStatus = (rowId: string, status: TdsStatus) => {
    setTdsRows((current) => current.map((row) => row.id === rowId ? { ...row, status, updatedAt: new Date().toISOString() } : row));
  };

  const openCompliance = (row: TdsRecord) => {
    setComplianceDialog(row);
    setChallanNo(row.challanNo);
    setChallanDate(row.challanDate);
    setReturnAckNo(row.returnAckNo);
    setCertificateNo(row.certificateNo);
    setComplianceError("");
  };

  const saveCompliance = () => {
    if (!complianceDialog) return;
    if (complianceDialog.type !== "Client TDS Receivable" && (challanNo.trim().length < 3 || !challanDate)) {
      setComplianceError("Challan number and deposit date are required for payable TDS");
      return;
    }
    const now = new Date().toISOString();
    setTdsRows((current) => current.map((row) => {
      if (row.id !== complianceDialog.id) return row;
      const hasDeposit = row.type === "Client TDS Receivable" || (challanNo.trim() && challanDate);
      const hasReturn = returnAckNo.trim().length >= 3;
      const certificateStatus: CertificateStatus = certificateNo.trim()
        ? row.type === "Client TDS Receivable" ? "Received" : "Generated"
        : row.certificateStatus;
      const status: TdsStatus = hasReturn ? "Filed" : hasDeposit && row.type !== "Client TDS Receivable" ? "Deposited" : row.status;
      return {
        ...row,
        challanNo: challanNo.trim(),
        challanDate,
        returnAckNo: returnAckNo.trim(),
        certificateNo: certificateNo.trim(),
        certificateStatus,
        status,
        updatedAt: now,
      };
    }));
    setComplianceDialog(null);
  };

  const closeRecord = (row: TdsRecord) => {
    const certificateComplete = row.certificateStatus === "Not Applicable" || ["Received", "Generated", "Issued"].includes(row.certificateStatus);
    const returnComplete = row.type === "Client TDS Receivable" || Boolean(row.returnAckNo);
    if (!certificateComplete || !returnComplete) return;
    updateStatus(row.id, "Closed");
  };

  const exportTds = () => {
    const rows = [
      ["TDS ID", "Type", "Source", "Party ID", "Party", "Section", "Taxable Amount", "Rate", "TDS Amount", "Deduction Date", "Deposit Due Date", "Return Period", "Challan", "Challan Date", "Return Ack", "Certificate", "Certificate Status", "Status"],
      ...filteredRows.map((row) => [
        row.id, row.type, row.sourceId, row.partyId, row.partyName, row.section,
        row.taxableAmount, row.rate, row.tdsAmount, row.deductionDate,
        row.depositDueDate, row.returnPeriod, row.challanNo, row.challanDate,
        row.returnAckNo, row.certificateNo, row.certificateStatus, row.status,
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    downloadFile("tds-register.csv", csv, "text/csv;charset=utf-8");
  };

  const downloadCertificate = (row: TdsRecord) => {
    const content = [
      `TDS Record: ${row.id}`, `Type: ${row.type}`, `Source: ${row.sourceId}`,
      `Party: ${row.partyName} (${row.partyId})`, `Section: ${row.section}`,
      `Taxable Amount: ${money(row.taxableAmount)}`, `Rate: ${row.rate}%`,
      `TDS Amount: ${money(row.tdsAmount)}`, `Deduction Date: ${formatDate(row.deductionDate)}`,
      `Challan: ${row.challanNo || "Not recorded"}`, `Return Acknowledgement: ${row.returnAckNo || "Not recorded"}`,
      `Certificate: ${row.certificateNo || row.certificateStatus}`, `Status: ${row.status}`,
    ].join("\n");
    downloadFile(`${row.id}.txt`, content, "text/plain;charset=utf-8");
  };

  const activeRows = tdsRows.filter((row) => row.status !== "Reversed");
  const clientTds = activeRows.filter((row) => row.type === "Client TDS Receivable").reduce((sum, row) => sum + row.tdsAmount, 0);
  const payableTds = activeRows.filter((row) => row.type !== "Client TDS Receivable" && !["Deposited", "Filed", "Closed"].includes(row.status)).reduce((sum, row) => sum + row.tdsAmount, 0);
  const salaryTds = activeRows.filter((row) => row.type === "Employee Salary TDS").reduce((sum, row) => sum + row.tdsAmount, 0);
  const pendingCertificates = activeRows.filter((row) => ["Pending", "Mismatch"].includes(row.certificateStatus)).length;
  const today = new Date(todayTimestamp).toISOString().split("T")[0];
  const overdueDeposits = activeRows.filter((row) => row.type !== "Client TDS Receivable" && row.depositDueDate < today && !["Deposited", "Filed", "Closed"].includes(row.status)).length;

  return (
    <AccountingPage
      title="TDS Compliance"
      description="Reconcile client TDS credits and control vendor or salary TDS deduction, deposit, return, and certificate compliance."
      icon={Calculator}
      badge="Tax deduction"
      actions={
        <>
          <ActionButton icon={Download} label="Export Register" variant="outline" onClick={exportTds} />
          <ActionButton icon={Plus} label="Log TDS Entry" variant="accent" onClick={openCreateForm} />
        </>
      }
    >
      <WorkflowSteps steps={["Source Transaction", "TDS Verification", "Deposit / Adjustment", "Return Filing", "Certificate & Closure"]} />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Client TDS Credit" value={money(clientTds)} helper="Receivable tax credit claims" icon={ReceiptText} tone="amber" />
        <MetricCard label="TDS Payable" value={money(payableTds)} helper={`${overdueDeposits} overdue deposits`} icon={Landmark} tone="blue" />
        <MetricCard label="Salary TDS" value={money(salaryTds)} helper="From payroll register" icon={Wallet} tone="purple" />
        <MetricCard label="Pending Certificates" value={String(pendingCertificates)} helper="Follow-up or generation required" icon={FileCheck2} tone="red" />
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
              <form onSubmit={verifyTds} className="space-y-8">
                <div className="border-b border-slate-100 pb-6">
                  <h3 className="text-2xl font-black text-primary">{editingId ? "Edit TDS Record" : "Log TDS Transaction"}</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">Party and reference are derived from payment, expense/vendor, or payroll source data.</p>
                </div>
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
                  <div className="space-y-8 lg:col-span-3">
                    <Panel title="Source Classification" description="Select the originating transaction and statutory section.">
                      <input type="hidden" {...register("type")} />
                      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
                        {tdsTypes.map((type) => (
                          <button key={type} type="button" onClick={() => selectType(type)} className={`min-h-20 rounded-xl border p-4 text-left ${watchedType === type ? "border-primary bg-primary text-white" : "border-border bg-white text-primary"}`}>
                            <span className="text-sm font-black">{type}</span>
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <label className="block space-y-1.5">
                          <span className="text-xs font-black uppercase tracking-widest text-slate-500">Source Transaction <span className="text-red-500">*</span></span>
                          <select {...register("sourceId")} onChange={(event) => selectSource(event.target.value)} className={`h-11 w-full rounded-xl border bg-white px-3 text-sm font-semibold text-primary ${errors.sourceId ? "border-red-500" : "border-border"}`}>
                            <option value="">Select source...</option>
                            {availableSources.map((source) => <option key={source.id} value={source.id}>{source.id} - {source.partyName}</option>)}
                          </select>
                          {errors.sourceId ? <p className="text-[10px] font-black uppercase text-red-500">{errors.sourceId.message}</p> : null}
                        </label>
                        <Field label="TDS Section" options={[...tdsSections]} required register={register("section")} error={errors.section?.message} />
                        {watchedSection === "Other" ? <Field label="Custom Section" required register={register("customSection")} error={errors.customSection?.message} /> : null}
                        <Field label="Return Period" required register={register("returnPeriod")} error={errors.returnPeriod?.message} />
                      </div>
                    </Panel>

                    <Panel title="Tax Computation" description="Taxable base, applicable rate, deduction date, and deposit deadline.">
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <Field label="Taxable Amount" type="number" step="0.01" required register={register("taxableAmount")} error={errors.taxableAmount?.message} />
                        <Field label="TDS Rate %" type="number" step="0.001" required register={register("tdsRate")} error={errors.tdsRate?.message} />
                        <Field label="Deduction Date" type="date" required register={register("deductionDate")} error={errors.deductionDate?.message} />
                        <Field label="Deposit Due Date" type="date" required register={register("depositDueDate")} error={errors.depositDueDate?.message} />
                        <Field label="Lower / Nil Deduction Certificate" register={register("lowerDeductionCertificate")} error={errors.lowerDeductionCertificate?.message} />
                        <Field label="Reconciliation Remarks" multiline register={register("remarks")} error={errors.remarks?.message} />
                      </div>
                    </Panel>
                  </div>
                  <div className="space-y-6">
                    <Panel title="TDS Impact" description="Computed tax and finance posting direction.">
                      <div className="space-y-5">
                        <div className={`rounded-2xl p-6 text-white ${watchedType === "Client TDS Receivable" ? "bg-amber-500" : "bg-blue-600"}`}>
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/70">Calculated TDS</p>
                          <p className="mt-2 text-3xl font-black">{money(totals.tdsAmount)}</p>
                          <p className="mt-4 text-xs font-semibold text-white/80">
                            {watchedType === "Client TDS Receivable" ? "Reduces invoice receivable and creates tax credit claim." : "Creates statutory payable until challan deposit."}
                          </p>
                        </div>
                        <ActionButton icon={ShieldCheck} label="Verify TDS" variant="accent" type="submit" />
                        <ActionButton icon={Calculator} label="Save Draft" variant="outline" onClick={saveDraft} />
                      </div>
                    </Panel>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}

      {complianceDialog ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-black text-primary">TDS Compliance Update</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">{complianceDialog.id} | {complianceDialog.partyName}</p>
            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
              {complianceDialog.type !== "Client TDS Receivable" ? (
                <>
                  <Field label="Challan Number" value={challanNo} onChange={(event) => { setChallanNo(event.target.value); setComplianceError(""); }} />
                  <Field label="Challan Deposit Date" type="date" value={challanDate} onChange={(event) => { setChallanDate(event.target.value); setComplianceError(""); }} />
                </>
              ) : null}
              <Field label="Return Acknowledgement No." value={returnAckNo} onChange={(event) => setReturnAckNo(event.target.value)} />
              <Field label="Certificate Number" value={certificateNo} onChange={(event) => setCertificateNo(event.target.value)} />
            </div>
            {complianceError ? <p className="mt-4 text-xs font-bold text-red-500">{complianceError}</p> : null}
            <div className="mt-6 flex justify-end gap-3">
              <ActionButton label="Cancel" variant="outline" onClick={() => setComplianceDialog(null)} />
              <ActionButton label="Save Compliance" variant="accent" onClick={saveCompliance} />
            </div>
          </div>
        </div>
      ) : null}

      <Panel title="TDS Compliance Register" description="Source reconciliation, statutory liability, deposit, return, certificate, and closure status.">
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_230px_180px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={15} />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search TDS ID, source, party, challan, certificate..." className="h-11 w-full rounded-xl border border-border bg-white pl-10 pr-3 text-sm font-semibold text-primary outline-none" />
          </div>
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary">
            {["All", ...tdsTypes].map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary">
            {["All", ...tdsStatuses].map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </div>

        <DataTable columns={["TDS / Source", "Party / Section", "Tax Computation", "Compliance", "Status", "Actions"]}>
          {filteredRows.map((row) => (
            <tr key={row.id} className="text-sm transition-colors hover:bg-slate-50">
              <td className="px-4 py-4"><p className="font-black text-primary">{row.id}</p><p className="text-xs font-semibold text-slate-500">{row.sourceId}</p></td>
              <td className="px-4 py-4"><p className="font-black text-primary">{row.partyName}</p><p className="text-xs font-semibold text-slate-500">{row.partyId} | Section {row.section}</p></td>
              <td className="px-4 py-4"><p className="font-black text-primary">{money(row.tdsAmount)}</p><p className="text-[11px] font-semibold text-slate-400">{row.rate}% on {money(row.taxableAmount)}</p></td>
              <td className="px-4 py-4">
                <p className="font-bold text-slate-600">Due {formatDate(row.depositDueDate)}</p>
                <p className="text-[11px] font-semibold text-slate-400">{row.challanNo ? `Challan ${row.challanNo}` : row.certificateStatus}</p>
              </td>
              <td className="px-4 py-4">
                <StatusBadge tone={row.status === "Closed" || row.status === "Filed" || row.status === "Adjusted" ? "green" : row.status === "Mismatch" || row.status === "Reversed" ? "red" : row.status === "Payable" ? "amber" : "blue"}>{row.status}</StatusBadge>
                <p className="mt-2 text-[10px] font-semibold text-slate-400">{row.type}</p>
              </td>
              <td className="px-4 py-4">
                <div className="flex flex-wrap gap-2">
                  {["Draft", "Verified", "Mismatch"].includes(row.status) ? <button type="button" onClick={() => openEditForm(row)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-primary" title="Edit TDS"><Edit3 size={15} /></button> : null}
                  {["Payable", "Adjusted", "Deposited", "Filed", "Mismatch"].includes(row.status) ? <button type="button" onClick={() => openCompliance(row)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-blue-600" title="Update compliance"><Upload size={15} /></button> : null}
                  {row.status === "Filed" || row.status === "Adjusted" ? <button type="button" onClick={() => closeRecord(row)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-green-600" title="Close record"><Check size={15} /></button> : null}
                  <button type="button" onClick={() => downloadCertificate(row)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-primary" title="Download record"><Download size={15} /></button>
                  {!["Closed", "Reversed"].includes(row.status) ? <button type="button" onClick={() => updateStatus(row.id, "Mismatch")} className="rounded-lg border border-border p-2 text-slate-500 hover:text-red-600" title="Mark mismatch"><X size={15} /></button> : null}
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </AccountingPage>
  );
}
